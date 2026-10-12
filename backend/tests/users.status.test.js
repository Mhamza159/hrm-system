/**
 * @file users.status.test.js
 * @description Integration Tests for Slice 1.13: User Account Activation / Deactivation.
 * 
 * SPECIFICATION & ACCEPTANCE CRITERIA:
 * - Module: M1 Authentication & Administration (BUILD-GUIDE Section 4 · Row 1.13)
 * - Criteria:
 *   1. Super Admin or HR can deactivate a target user account.
 *   2. Deactivation clears target user's refreshTokenHash in MongoDB to force session eviction.
 *   3. Deactivated user cannot log in (returns 401).
 *   4. Super Admin can re-activate user account, restoring login access.
 *   5. Non-privileged roles (e.g. Employee) calling status endpoint receive 403 Forbidden.
 *   6. Administrator cannot deactivate their own account (returns 400).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { env } from '../src/config/env.js';

describe('User Account Activation / Deactivation (Slice 1.13-TEST)', () => {
  const adminEmail = 'admin.tester@company.pk';
  const employeeEmail = 'target.employee@company.pk';
  const sharedPassword = 'Password123!';
  let adminId;
  let employeeId;
  let adminAccessToken;
  let employeeAccessToken;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_status');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await Role.deleteMany({});

    // 1. Seed Role master records
    const adminRole = await Role.create({ name: 'Super Admin', isSystem: true });
    const employeeRole = await Role.create({ name: 'Employee', isSystem: true });

    const passwordHash = await User.hashPassword(sharedPassword);

    // 2. Seed Super Admin user
    const admin = await User.create({
      email: adminEmail,
      passwordHash,
      roles: [adminRole._id],
      isActive: true
    });
    adminId = admin._id;

    // 3. Seed Employee user
    const employee = await User.create({
      email: employeeEmail,
      passwordHash,
      roles: [employeeRole._id],
      isActive: true
    });
    employeeId = employee._id;

    // 3. Log in both users to obtain tokens
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: sharedPassword });
    adminAccessToken = adminLoginRes.body.data.accessToken;

    const employeeLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: sharedPassword });
    employeeAccessToken = employeeLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await Role.deleteMany({});
    await mongoose.disconnect();
  });

  it('should allow Super Admin to deactivate a user, evict their session, and write audit log', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${employeeId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        isActive: false,
        reason: 'Terminated employee account'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isActive).toBe(false);

    // Verify database state: isActive is false and refreshTokenHash is null
    const employeeInDb = await User.findById(employeeId);
    expect(employeeInDb.isActive).toBe(false);
    expect(employeeInDb.refreshTokenHash).toBeNull();

    // Verify audit log
    const audit = await AuditLog.findOne({ targetId: employeeId, action: 'USER_DEACTIVATE' });
    expect(audit).toBeDefined();
  });

  it('should block deactivated user from logging in with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: sharedPassword });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('deactivated');
  });

  it('should allow Super Admin to re-activate user account restoring access', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${employeeId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        isActive: true,
        reason: 'Rehired employee'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);

    // Verify user can now log in again
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: sharedPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
  });

  it('should reject non-admin (Employee) with 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${employeeId}/status`)
      .set('Authorization', `Bearer ${employeeAccessToken}`)
      .send({
        isActive: false
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  it('should prevent admin from deactivating their own account with 400 Bad Request', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${adminId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        isActive: false
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot deactivate their own account');
  });
});
