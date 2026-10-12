/**
 * @file auth.reset-password.test.js
 * @description Integration Tests for Slice 1.8: Password Reset Verification & Execution.
 * 
 * SPECIFICATION & ACCEPTANCE CRITERIA:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Row 1.8)
 * - Criteria:
 *   1. Presenting a valid unexpired 6-digit OTP commits new password and returns 200 OK.
 *   2. The user can immediately log in with the new password; old password fails.
 *   3. OTP fields (resetOtpHash, resetOtpExpires) are wiped to prevent replay.
 *   4. Expired OTP (>10m) returns 400 Bad Request.
 *   5. Incorrect OTP returns 400 Bad Request.
 *   6. Password shorter than 8 characters returns 400 Bad Request.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

describe('Password Reset Verification & Execution (Slice 1.8-TEST)', () => {
  const testEmail = 'reset.tester@company.pk';
  const initialPassword = 'OldPassword123!';
  const newPassword = 'NewSecretPassword999!';
  const validOtp = '654321';
  let userId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_reset');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});

    // Seed test user with active OTP hash
    const passwordHash = await User.hashPassword(initialPassword);
    const resetOtpHash = await bcrypt.hash(validOtp, 10);
    const user = await User.create({
      email: testEmail,
      passwordHash,
      resetOtpHash,
      resetOtpExpires: new Date(Date.now() + 10 * 60 * 1000), // Valid for 10 minutes
      isActive: true
    });
    userId = user._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('should successfully reset password with valid OTP and permit login with new credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        email: testEmail,
        otp: validOtp,
        newPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Password has been reset successfully');

    // Verify OTP was cleared in MongoDB
    const userInDb = await User.findById(userId);
    expect(userInDb.resetOtpHash).toBeNull();
    expect(userInDb.resetOtpExpires).toBeNull();

    // Verify user can log in with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: newPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();

    // Verify old password fails
    const oldLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: initialPassword });

    expect(oldLoginRes.status).toBe(401);
  });

  it('should reject reset request with incorrect OTP with 400 Bad Request', async () => {
    // Re-seed OTP
    const resetOtpHash = await bcrypt.hash(validOtp, 10);
    await User.findByIdAndUpdate(userId, {
      resetOtpHash,
      resetOtpExpires: new Date(Date.now() + 10 * 60 * 1000)
    });

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        email: testEmail,
        otp: '000000', // Incorrect OTP
        newPassword
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid verification code');
  });

  it('should reject reset request with expired OTP with 400 Bad Request', async () => {
    // Re-seed expired OTP (set in past)
    const resetOtpHash = await bcrypt.hash(validOtp, 10);
    await User.findByIdAndUpdate(userId, {
      resetOtpHash,
      resetOtpExpires: new Date(Date.now() - 60 * 1000) // Expired 1 minute ago
    });

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        email: testEmail,
        otp: validOtp,
        newPassword
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('expired');
  });

  it('should reject password shorter than 8 characters with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        email: testEmail,
        otp: validOtp,
        newPassword: 'short'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
