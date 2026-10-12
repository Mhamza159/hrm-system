/**
 * @file auth.lockout.test.js
 * @description Integration Tests for Slice 1.3: Brute-Force Defense & Automated Account Lockout.
 * 
 * SPECIFICATION & ACCEPTANCE CRITERIA:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Row 1.3)
 * - Criteria:
 *   1. Up to 4 failed attempts increment failedAttempts and return 401.
 *   2. The 5th consecutive failed attempt sets lockUntil to 15 minutes in the future and returns 423 Locked.
 *   3. Even if the 6th attempt provides the CORRECT password, it MUST be rejected with 423 Locked
 *      because the account is actively locked.
 *   4. A successful login before hitting 5 attempts resets failedAttempts back to 0.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

describe('Brute-Force Defense & Account Lockout (Slice 1.3-TEST)', () => {
  const targetEmail = 'lockout.target@company.pk';
  const validPassword = 'TargetPassword123!';

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_lockout');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});

    // Seed test target user
    const passwordHash = await User.hashPassword(validPassword);
    await User.create({
      email: targetEmail,
      passwordHash,
      isActive: true,
      failedAttempts: 0,
      lockUntil: null
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('should increment failed attempts and return 401 for first 4 wrong passwords', async () => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: targetEmail,
          password: `WrongPassword_${attempt}`
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');

      // Verify DB persistence of failed attempts counter
      const userInDb = await User.findOne({ email: targetEmail });
      expect(userInDb.failedAttempts).toBe(attempt);
      expect(userInDb.lockUntil).toBeNull();
    }
  });

  it('should lock the account for 15 minutes on the 5th consecutive failed attempt and return 423', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: targetEmail,
        password: 'WrongPassword_5thAttempt'
      });

    expect(res.status).toBe(423);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('locked');

    // Verify DB lockUntil timestamp is approximately 15 minutes in the future
    const userInDb = await User.findOne({ email: targetEmail });
    expect(userInDb.failedAttempts).toBe(5);
    expect(userInDb.lockUntil).not.toBeNull();

    const expectedFutureTime = Date.now() + 14 * 60 * 1000;
    expect(new Date(userInDb.lockUntil).getTime()).toBeGreaterThan(expectedFutureTime);
  });

  it('should reject login with 423 even when using CORRECT password while account is locked', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: targetEmail,
        password: validPassword // Correct password
      });

    // Must still reject with 423 Locked
    expect(res.status).toBe(423);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Account is locked');
  });

  it('should reset failedAttempts to 0 upon successful login once unlocked', async () => {
    // Manually expire lockout in DB to simulate 15 minutes elapsed
    await User.updateOne(
      { email: targetEmail },
      { lockUntil: new Date(Date.now() - 1000), failedAttempts: 5 }
    );

    // Now log in with correct password
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: targetEmail,
        password: validPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify DB counters reset
    const userInDb = await User.findOne({ email: targetEmail });
    expect(userInDb.failedAttempts).toBe(0);
    expect(userInDb.lockUntil).toBeNull();
  });
});
