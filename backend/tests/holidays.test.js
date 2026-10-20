/**
 * @file holidays.test.js
 * @description Integration Tests for Module M6 Public & Gazetted Holidays (BUILD-GUIDE Row 6.11).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Holiday } from '../src/models/holiday.model.js';
import { seedPakistanHolidays } from '../src/seed/holidays.seed.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M6 — Holidays API Test Suite (Slice 6.11-TEST)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let createdHolidayId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_holidays');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Holiday.deleteMany({});

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
        { action: 'leave.view', subject: 'Leave', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' }
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
    await Holiday.deleteMany({});
    await mongoose.disconnect();
  });

  it('1. Seed script successfully seeds 10+ official Pakistan gazetted holidays', async () => {
    const result = await seedPakistanHolidays(2026);
    expect(result.seeded).toBeGreaterThanOrEqual(10);

    const count = await Holiday.countDocuments({ year: 2026 });
    expect(count).toBeGreaterThanOrEqual(10);

    // Verify idempotency: running again should seed 0 new documents
    const secondRun = await seedPakistanHolidays(2026);
    expect(secondRun.seeded).toBe(0);
  });

  it('2. All authenticated roles (Employee, Manager) can list public holidays (HTTP 200)', async () => {
    const res = await request(app)
      .get('/api/v1/holidays?year=2026')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);
  });

  it('3. HR Manager can create a new public holiday (HTTP 201)', async () => {
    const res = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Special Company Foundation Day',
        date: '2026-10-15',
        type: 'optional',
        isLunar: false,
        description: 'Annual corporate anniversary celebration.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Special Company Foundation Day');
    expect(res.body.data.type).toBe('optional');

    createdHolidayId = res.body.data._id;
  });

  it('4. Rejects duplicate holiday on the exact same date with same name (HTTP 409)', async () => {
    const res = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Special Company Foundation Day',
        date: '2026-10-15'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('5. Department Manager and Employee receive 403 Forbidden on holiday creation', async () => {
    const resMgr = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Manager Holiday',
        date: '2026-11-20'
      });
    expect(resMgr.status).toBe(403);

    const resEmp = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Emp Holiday',
        date: '2026-11-20'
      });
    expect(resEmp.status).toBe(403);
  });

  it('6. HR Manager can update lunar holiday dates upon moon sighting (HTTP 200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/holidays/${createdHolidayId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        date: '2026-10-16',
        description: 'Confirmed date updated after official announcement'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toContain('Confirmed date updated');
  });

  it('7. Super Admin can soft-deactivate a public holiday (HTTP 200)', async () => {
    const res = await request(app)
      .delete(`/api/v1/holidays/${createdHolidayId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isActive).toBe(false);

    const check = await Holiday.findById(createdHolidayId);
    expect(check.isActive).toBe(false);
  });
});
