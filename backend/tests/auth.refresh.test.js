/**
 * @file auth.refresh.test.js
 * @description Integration Tests for Slice 1.4: Automatic Token Rotation & Transparent Session Refresh.
 * 
 * SPECIFICATION & ACCEPTANCE CRITERIA:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Row 1.4)
 * - Criteria:
 *   1. Presenting a valid refresh token cookie issues a new access token and a new rotated refresh cookie.
 *   2. The new refresh token is hashed with bcrypt and updates user.refreshTokenHash in MongoDB.
 *   3. Token Reuse Detection: Attempting to reuse the old, already rotated refresh token
 *      must fail with 401 and revoke the session by nullifying user.refreshTokenHash.
 *   4. Requests without cookies or with invalid signatures return 401.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

describe('Token Rotation & Session Refresh (Slice 1.4-TEST)', () => {
  const testEmail = 'rotation.tester@company.pk';
  const testPassword = 'Password123!';
  let userId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_refresh');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});

    // Seed test user
    const passwordHash = await User.hashPassword(testPassword);
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

  it('should successfully rotate tokens when presenting a valid refresh cookie', async () => {
    // 1. Perform initial login to generate valid session
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(loginRes.status).toBe(200);
    const initialCookies = loginRes.headers['set-cookie'];
    const initialRefreshCookie = initialCookies.find((c) => c.startsWith('refreshToken='));
    expect(initialRefreshCookie).toBeDefined();

    // Extract raw token value
    const rawOldToken = initialRefreshCookie.split(';')[0].split('=')[1];

    // 2. Call POST /api/v1/auth/refresh with the initial cookie
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [initialRefreshCookie]);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    // 3. Verify a NEW rotated cookie was set
    const newCookies = refreshRes.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    const newRefreshCookie = newCookies.find((c) => c.startsWith('refreshToken='));
    expect(newRefreshCookie).toBeDefined();

    const rawNewToken = newRefreshCookie.split(';')[0].split('=')[1];
    // Tokens must not be identical
    expect(rawNewToken).not.toBe(rawOldToken);

    // 4. Verify MongoDB has the hash of the NEW token
    const userInDb = await User.findById(userId);
    const isNewTokenHashed = await bcrypt.compare(rawNewToken, userInDb.refreshTokenHash);
    expect(isNewTokenHashed).toBe(true);
  });

  it('should detect token reuse, reject with 401, and revoke session in DB', async () => {
    // 1. Initial Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const cookies = loginRes.headers['set-cookie'];
    const oldRefreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

    // 2. First refresh (legitimate rotation)
    const firstRefreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [oldRefreshCookie]);

    expect(firstRefreshRes.status).toBe(200);

    // 3. Second refresh using the STALE/OLD cookie (attacker or replay attempt)
    const replayRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [oldRefreshCookie]);

    expect(replayRes.status).toBe(401);
    expect(replayRes.body.success).toBe(false);
    expect(replayRes.body.message).toContain('compromised');

    // 4. Verify session was completely revoked in DB
    const userInDb = await User.findById(userId);
    expect(userInDb.refreshTokenHash).toBeNull();
  });

  it('should reject refresh request with 401 when no cookie is sent', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('missing');
  });

  it('should reject forged or corrupted refresh token with 401', async () => {
    const forgedToken = jwt.sign({ userId }, 'wrong_secret_key');
    const forgedCookie = `refreshToken=${forgedToken}; Path=/; HttpOnly;`;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [forgedCookie]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
