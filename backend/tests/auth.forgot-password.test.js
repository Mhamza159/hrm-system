/**
 * @file auth.forgot-password.test.js
 * @description Integration Tests for Slice 1.7: Password Recovery via Email OTP.
 * 
 * SPECIFICATION & ACCEPTANCE CRITERIA:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Row 1.7)
 * - Criteria:
 *   1. Requesting password reset for registered email returns 200 OK with generic confirmation.
 *   2. Sets 6-digit hashed OTP in user.resetOtpHash and 10m expiration timestamp in MongoDB.
 *   3. Anti-enumeration: Requesting reset for unregistered email returns identical 200 OK.
 *   4. Invalid email syntax returns 400 Bad Request.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

describe('Password Recovery via Email OTP (Slice 1.7-TEST)', () => {
  const testEmail = 'forgot.tester@company.pk';
  let userId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_forgot');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});

    // Seed test user
    const passwordHash = await User.hashPassword('Password123!');
    const user = await User.create({
      email: testEmail,
      passwordHash,
      isActive: true
    });
    userId = user._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('should generate OTP hash and expiration for registered user and return 200 generic message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('verification code has been sent');

    // Verify MongoDB has OTP hash and valid expiration (~10 mins in future)
    const userInDb = await User.findById(userId);
    expect(userInDb.resetOtpHash).toBeTruthy();
    expect(userInDb.resetOtpExpires).toBeTruthy();
    expect(new Date(userInDb.resetOtpExpires).getTime()).toBeGreaterThan(Date.now());
  });

  it('should return identical 200 message for unregistered email to prevent user enumeration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent.user@company.pk' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('verification code has been sent');
  });

  it('should reject malformed email address with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
