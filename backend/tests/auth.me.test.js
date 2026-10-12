/**
 * @file auth.me.test.js
 * @description Integration Tests for Slice 1.6: Current User Hydration & Protected Identity Guarding.
 * 
 * SPECIFICATION & ACCEPTANCE CRITERIA:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Row 1.6)
 * - Criteria:
 *   1. Presenting a valid Bearer token to GET /api/v1/auth/me returns 200 OK with sanitized user profile and permissions.
 *   2. Sensitive credentials (passwordHash, refreshTokenHash, resetOtpHash) are strictly omitted.
 *   3. Missing Authorization header returns 401 Unauthorized.
 *   4. Expired or forged Bearer tokens return 401 Unauthorized.
 *   5. Deactivated accounts (isActive === false) return 401 Unauthorized.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

describe('Current User Hydration (Slice 1.6-TEST)', () => {
  const testEmail = 'me.tester@company.pk';
  const testPassword = 'Password123!';
  let userId;
  let validAccessToken;

  beforeAll(async () => {
    // Connect to isolated test database
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_me');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});

    // Seed test user with hashed password
    const passwordHash = await User.hashPassword(testPassword);
    const user = await User.create({
      email: testEmail,
      passwordHash,
      isActive: true,
      mustChangePassword: false
    });
    userId = user._id;

    // Perform initial login to generate valid access token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    validAccessToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('should return 200 OK with sanitized user profile and permissions for valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${validAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { user, permissions } = res.body.data;

    // Verify user profile attributes
    expect(user).toBeDefined();
    expect(user.id).toBe(userId.toString());
    expect(user.email).toBe(testEmail);
    expect(Array.isArray(user.roles)).toBe(true);
    expect(user.isActive).toBe(true);
    expect(user.mustChangePassword).toBe(false);

    // Verify critical security hashes are omitted
    expect(user.passwordHash).toBeUndefined();
    expect(user.refreshTokenHash).toBeUndefined();
    expect(user.resetOtpHash).toBeUndefined();

    // Verify permissions array is populated
    expect(Array.isArray(permissions)).toBe(true);
  });

  it('should reject GET /auth/me with 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Authentication token missing');
  });

  it('should reject GET /auth/me with 401 when access token has expired', async () => {
    // Sign an immediately expired token
    const expiredToken = jwt.sign(
      { userId, roles: [] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '0s' }
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid or expired access token');
  });

  it('should reject GET /auth/me with 401 for token signed with invalid secret', async () => {
    const forgedToken = jwt.sign({ userId }, 'wrong_tampered_secret_key');

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid or expired access token');
  });

  it('should reject GET /auth/me with 401 if user account is deactivated', async () => {
    // Create deactivated user
    const inactivePasswordHash = await User.hashPassword('Pass123!');
    const inactiveUser = await User.create({
      email: 'deactivated.user@company.pk',
      passwordHash: inactivePasswordHash,
      isActive: false
    });

    const tokenForInactive = jwt.sign(
      { userId: inactiveUser._id, roles: [] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenForInactive}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('deactivated');
  });
});
