/**
 * @file auth.change-password.test.js
 * @description Integration Tests for Slice 1.9: Self-Service Password Change & First-Login Reset Mandate.
 * 
 * SPECIFICATION & ACCEPTANCE CRITERIA:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Row 1.9)
 * - Criteria:
 *   1. Authenticated user can change password by providing correct current password.
 *   2. If user had mustChangePassword: true, successfully changing password clears it to false.
 *   3. Incorrect current password returns 400 Bad Request.
 *   4. Attempting to set identical new password as current password returns 400 Bad Request.
 *   5. Unauthenticated request returns 401 Unauthorized.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { env } from '../src/config/env.js';

describe('Self-Service Password Change (Slice 1.9-TEST)', () => {
  const testEmail = 'change.tester@company.pk';
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'BrandNewPassword456!';
  let userId;
  let accessToken;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_change');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await AuditLog.deleteMany({});

    // Seed test user with mustChangePassword = true (representing initial onboarding state)
    const passwordHash = await User.hashPassword(initialPassword);
    const user = await User.create({
      email: testEmail,
      passwordHash,
      isActive: true,
      mustChangePassword: true
    });
    userId = user._id;

    // Login to obtain Bearer accessToken
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: initialPassword });

    accessToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await mongoose.disconnect();
  });

  it('should change password, clear mustChangePassword flag, and write audit log', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: initialPassword,
        newPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Password has been updated successfully');

    // Verify MongoDB user state
    const userInDb = await User.findById(userId);
    expect(userInDb.mustChangePassword).toBe(false);

    // Verify user can now log in with the new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: newPassword });

    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.data.accessToken; // update token for following tests

    // Verify security audit log entry was written
    const audit = await AuditLog.findOne({ targetId: userId, action: 'PASSWORD_CHANGE' });
    expect(audit).toBeDefined();
    expect(audit.module).toBe('AUTH');
  });

  it('should reject password change with incorrect current password with 400 Bad Request', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'WrongCurrentPassword999!',
        newPassword: 'AnotherPassword789!'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Current password is incorrect');
  });

  it('should reject new password if identical to current password with 400 Bad Request', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: newPassword,
        newPassword: newPassword // Identical
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot be the same');
  });

  it('should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/change-password')
      .send({
        currentPassword: newPassword,
        newPassword: 'SomeOtherPassword123!'
      });

    expect(res.status).toBe(401);
  });
});
