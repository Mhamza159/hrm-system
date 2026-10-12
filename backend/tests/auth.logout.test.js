/**
 * @file auth.logout.test.js
 * @description Integration Tests for Slice 1.5: Secure Logout & Session Invalidation.
 * 
 * SPECIFICATION & ACCEPTANCE CRITERIA:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Row 1.5)
 * - Criteria:
 *   1. Presenting a valid Bearer token to POST /api/v1/auth/logout returns 200 OK.
 *   2. Sets an expired Set-Cookie header to clear the client-side httpOnly refreshToken cookie.
 *   3. Nullifies user.refreshTokenHash in MongoDB to permanently invalidate server-side session.
 *   4. Calling POST /api/v1/auth/refresh after logout returns 401 Unauthorized.
 *   5. Calling POST /api/v1/auth/logout without Bearer token or with forged token returns 401.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

describe('Secure Logout & Session Invalidation (Slice 1.5-TEST)', () => {
  const testEmail = 'logout.tester@company.pk';
  const testPassword = 'Password123!';
  let userId;

  beforeAll(async () => {
    // Connect to isolated test database
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_logout');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});

    // Seed test user with hashed password
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

  it('should successfully log out, clear httpOnly cookie, and nullify refreshTokenHash in DB', async () => {
    // 1. Initial Login to establish active session
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(loginRes.status).toBe(200);
    const accessToken = loginRes.body.data.accessToken;
    const cookies = loginRes.headers['set-cookie'];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(accessToken).toBeDefined();
    expect(refreshCookie).toBeDefined();

    // Verify database currently stores an active hash
    const userBeforeLogout = await User.findById(userId);
    expect(userBeforeLogout.refreshTokenHash).toBeTruthy();

    // 2. Perform Logout request
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', [refreshCookie]);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.message).toBe('Logged out successfully');

    // 3. Verify Set-Cookie header clears the refreshToken cookie
    const logoutCookies = logoutRes.headers['set-cookie'];
    expect(logoutCookies).toBeDefined();
    const clearedCookie = logoutCookies.find((c) => c.startsWith('refreshToken='));
    expect(clearedCookie).toBeDefined();
    // Cookie clearing either empties the value or sets Max-Age=0 / Expires in 1970
    expect(
      clearedCookie.includes('Expires=Thu, 01 Jan 1970') ||
      clearedCookie.includes('Max-Age=0') ||
      clearedCookie.startsWith('refreshToken=;')
    ).toBe(true);

    // 4. Verify MongoDB has nullified refreshTokenHash
    const userAfterLogout = await User.findById(userId);
    expect(userAfterLogout.refreshTokenHash).toBeNull();
  });

  it('should reject refresh attempts after session has been logged out', async () => {
    // 1. Login to obtain valid credentials
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const accessToken = loginRes.body.data.accessToken;
    const cookies = loginRes.headers['set-cookie'];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

    // 2. Perform Logout
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', [refreshCookie]);

    // 3. Attempt to use the captured refresh cookie after logout
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshCookie]);

    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.success).toBe(false);
    expect(refreshRes.body.message).toContain('Session has expired or was terminated');
  });

  it('should reject logout request without Authorization header with 401', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Authentication token missing');
  });

  it('should reject logout request with forged access token with 401', async () => {
    const forgedToken = jwt.sign({ userId }, 'wrong_secret');
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid or expired access token');
  });
});
