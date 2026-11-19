import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Roles & Permissions Matrix Functional Audit Test Suite (Plan 29-06)', () => {
  let superAdminToken;
  let superAdminRole;
  let superAdminUser;
  let customRoleId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_matrix_audit');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});

    // 1. Seed Super Admin Role
    superAdminRole = await Role.create({
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Master Administrator with unrestricted access',
      isSystem: true,
      isActive: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    // 2. Seed Super Admin User
    superAdminUser = await User.create({
      name: 'Root Admin',
      email: 'root.matrix@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    superAdminToken = jwt.sign(
      { userId: superAdminUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    try {
      await User.deleteMany({});
      await Role.deleteMany({});
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    } catch {
      // ignore
    }
  });

  it('1. should create a custom role with mixed granular scopes and approval limits', async () => {
    const payload = {
      name: 'Senior Finance Officer',
      description: 'Authorizes payroll disbursements and reviews team expenses',
      isActive: true,
      permissions: [
        { action: 'payroll.view', subject: 'Payroll', scope: 'department' },
        { action: 'payroll.process', subject: 'Payroll', scope: 'department', limit: 250000 },
        { action: 'expense.view', subject: 'Expense', scope: 'team' },
        { action: 'expense.approve', subject: 'Expense', scope: 'team', limit: 50000 },
        { action: 'attendance.view', subject: 'Attendance', scope: 'own' }
      ]
    };

    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Senior Finance Officer');
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.permissions).toHaveLength(5);

    customRoleId = res.body.data._id;
  });

  it('2. should update custom role with updated scopes and approval limits', async () => {
    const updatePayload = {
      name: 'Principal Finance Controller',
      description: 'Enterprise-wide payroll disbursement and high-limit expense approvals',
      isActive: true,
      permissions: [
        { action: 'payroll.view', subject: 'Payroll', scope: 'all' },
        { action: 'payroll.process', subject: 'Payroll', scope: 'all', limit: 1000000 },
        { action: 'expense.view', subject: 'Expense', scope: 'all' },
        { action: 'expense.approve', subject: 'Expense', scope: 'all', limit: 500000 }
      ]
    };

    const res = await request(app)
      .patch(`/api/v1/roles/${customRoleId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Principal Finance Controller');
    expect(res.body.data.permissions).toHaveLength(4);

    const payrollProcess = res.body.data.permissions.find((p) => p.action === 'payroll.process');
    expect(payrollProcess).toBeDefined();
    expect(payrollProcess.scope).toBe('all');
    expect(payrollProcess.limit).toBe(1000000);
  });

  it('3. should reject payload when permission rule contains an invalid scope', async () => {
    const invalidPayload = {
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'invalid_universe' }
      ]
    };

    const res = await request(app)
      .patch(`/api/v1/roles/${customRoleId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. should prevent renaming a system core role', async () => {
    const res = await request(app)
      .patch(`/api/v1/roles/${superAdminRole._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Demoted Super Admin'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot be renamed/i);
  });

  it('5. should prevent deactivating a system core role', async () => {
    const res = await request(app)
      .patch(`/api/v1/roles/${superAdminRole._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        isActive: false
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot be deactivated/i);
  });

  it('6. should allow toggling isActive on a custom role', async () => {
    const res = await request(app)
      .patch(`/api/v1/roles/${customRoleId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        isActive: false
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isActive).toBe(false);
  });
});
