/**
 * @file leave.types.test.js
 * @description Integration Tests for Module M6 Leave Types Definition & Management (BUILD-GUIDE Row 6.1).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M6 — Leave Types API Test Suite (Slice 6.1-TEST)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let createdLeaveTypeId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_leaves');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await LeaveType.deleteMany({});

    // 1. Roles Setup
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.settings', subject: 'Leave', scope: 'all' },
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' },
        { action: 'leave.approve', subject: 'Leave', scope: 'team' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    // 2. Users Setup
    const createTestUser = async (email, roleId) => {
      const user = await User.create({
        email,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuu',
        roles: [roleId],
        isEmailVerified: true,
        isActive: true
      });
      return jwt.sign(
        { userId: user._id, roles: [roleId] },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
    };

    superAdminToken = await createTestUser('superadmin@test.com', superAdminRole._id);
    hrToken = await createTestUser('hr@test.com', hrRole._id);
    managerToken = await createTestUser('manager@test.com', managerRole._id);
    employeeToken = await createTestUser('employee@test.com', employeeRole._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await LeaveType.deleteMany({});
    await mongoose.disconnect();
  });

  it('1. HR Manager can create a valid leave type with full attributes (HTTP 201)', async () => {
    const res = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Annual Leave',
        code: 'ANNUAL',
        description: 'Standard paid yearly statutory leave entitlement',
        daysPerYear: 14,
        isPaid: true,
        carryForwardMax: 5,
        requiresAttachment: false,
        minDaysForAttachment: 3,
        genderConstraint: 'any',
        isActive: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Annual Leave');
    expect(res.body.data.code).toBe('ANNUAL');
    expect(res.body.data.daysPerYear).toBe(14);
    expect(res.body.data.carryForwardMax).toBe(5);

    createdLeaveTypeId = res.body.data._id;
  });

  it('2. Rejects duplicate leave type code (HTTP 409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Duplicate Annual',
        code: 'annual', // Should normalize to uppercase and collide
        daysPerYear: 10
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('3. Rejects invalid leave type data (negative days, invalid gender) (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Invalid Leave',
        code: 'INVALID',
        daysPerYear: -5,
        genderConstraint: 'alien'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. Department Manager receives 403 Forbidden when creating a leave type', async () => {
    const res = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Manager Type',
        code: 'MGR_TYPE',
        daysPerYear: 5
      });

    expect(res.status).toBe(403);
  });

  it('5. Employee receives 403 Forbidden when creating a leave type', async () => {
    const res = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Employee Type',
        code: 'EMP_TYPE',
        daysPerYear: 5
      });

    expect(res.status).toBe(403);
  });

  it('6. All authenticated roles (Employee, Manager, HR) can view leave types (HTTP 200)', async () => {
    const res = await request(app)
      .get('/api/v1/leave-types')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('7. HR Manager can update an existing leave type (HTTP 200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/leave-types/${createdLeaveTypeId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        daysPerYear: 16,
        description: 'Updated description for annual entitlement'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.daysPerYear).toBe(16);
    expect(res.body.data.description).toBe('Updated description for annual entitlement');
  });

  it('8. Super Admin can soft-deactivate a leave type (HTTP 200)', async () => {
    const res = await request(app)
      .delete(`/api/v1/leave-types/${createdLeaveTypeId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isActive).toBe(false);

    // Verify it is still in DB but flagged inactive
    const check = await LeaveType.findById(createdLeaveTypeId);
    expect(check.isActive).toBe(false);
  });
});
