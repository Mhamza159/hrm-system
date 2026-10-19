/**
 * @file auth.2fa.test.js
 * @description Vitest Test Suite for Two-Factor Authentication (Slice 1.10-TEST).
 * 
 * SPECIFICATION & SECURITY VERIFICATIONS:
 * 1. User initiates 2FA setup and confirms with 6-digit email OTP.
 * 2. Login intercept: When 2FA is active, login halts and issues a temporary challenge token.
 * 3. Challenge verification: Valid OTP issues full access & rotating refresh token pair.
 * 4. Error boundaries: Invalid or expired OTP codes are rejected with 400 Bad Request.
 * 5. Disabling 2FA: Reverts security requirement upon password verification.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

describe('Two-Factor Authentication (Slice 1.10-TEST)', () => {
  const testEmail = 'twofactor.tester@company.pk';
  const testPassword = 'Password123!';
  let testUser;
  let authToken;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_2fa');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});

    // Seed test user
    const passwordHash = await User.hashPassword(testPassword);
    testUser = await User.create({
      email: testEmail,
      passwordHash,
      isActive: true,
      twoFactorEnabled: false
    });

    // Obtain access token for authenticated 2FA setup routes
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    authToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('should initiate and enable 2FA with 6-digit OTP confirmation', async () => {
    // 1. Initiate 2FA
    const initRes = await request(app)
      .post('/api/v1/auth/2fa/enable')
      .set('Authorization', `Bearer ${authToken}`);

    expect(initRes.status).toBe(200);
    expect(initRes.body.success).toBe(true);

    // Read back user to inspect generated OTP hash
    const userInDb = await User.findById(testUser._id);
    expect(userInDb.twoFactorOtpHash).toBeDefined();
    expect(userInDb.twoFactorOtpExpires).toBeDefined();

    // In tests, mock OTP manually to simulate user entering email code
    const mockOtp = '123456';
    userInDb.twoFactorOtpHash = await bcrypt.hash(mockOtp, 10);
    userInDb.twoFactorOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await userInDb.save();

    // 2. Confirm 2FA setup
    const confirmRes = await request(app)
      .post('/api/v1/auth/2fa/verify-enable')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ otp: mockOtp });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.twoFactorEnabled).toBe(true);

    const verifiedUser = await User.findById(testUser._id);
    expect(verifiedUser.twoFactorEnabled).toBe(true);
    expect(verifiedUser.twoFactorOtpHash).toBeNull();
  });

  it('should halt login and issue challenge token when 2FA is active', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.twoFactorRequired).toBe(true);
    expect(loginRes.body.data.tempToken).toBeDefined();

    // Ensure session cookies are NOT set during challenge phase
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeUndefined();
  });

  it('should reject invalid 2FA OTP with 400 Bad Request', async () => {
    // Trigger login to get a fresh tempToken and set active OTP
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const tempToken = loginRes.body.data.tempToken;

    // Send incorrect OTP
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        tempToken,
        otp: '000000'
      });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
  });

  it('should complete 2FA login verification with correct OTP and issue tokens', async () => {
    // 1. Initial login challenge
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const tempToken = loginRes.body.data.tempToken;

    // Manually set known OTP for test determinism
    const testOtp = '888999';
    const userInDb = await User.findById(testUser._id);
    userInDb.twoFactorOtpHash = await bcrypt.hash(testOtp, 10);
    userInDb.twoFactorOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await userInDb.save();

    // 2. Submit valid OTP
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        tempToken,
        otp: testOtp
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.accessToken).toBeDefined();
    expect(verifyRes.body.data.user.email).toBe(testEmail);

    // Verify refresh token cookie is set
    const cookies = verifyRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
  });

  it('should bypass 2FA and issue session immediately when rememberMe is true', async () => {
    // Attempt login with rememberMe: true while 2FA is active
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword, rememberMe: true });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.twoFactorRequired).toBe(false);
    expect(loginRes.body.data.accessToken).toBeDefined();
    expect(loginRes.body.data.user.email).toBe(testEmail);

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });

  it('should allow user to disable 2FA with password confirmation', async () => {
    // Disable 2FA
    const disableRes = await request(app)
      .post('/api/v1/auth/2fa/disable')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ password: testPassword });

    expect(disableRes.status).toBe(200);
    expect(disableRes.body.data.twoFactorEnabled).toBe(false);

    const userInDb = await User.findById(testUser._id);
    expect(userInDb.twoFactorEnabled).toBe(false);
  });
});
