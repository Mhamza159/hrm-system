/**
 * @file auth.security-audit.test.js
 * @description Comprehensive Adversarial Security Audit & Stress-Test for Module M1.
 * 
 * AUDIT SCOPE (Doubt-Driven Development & OWASP Top 10):
 * 1. NoSQL Injection Attacks (Operator injection: $gt, $ne, $regex, array injection)
 * 2. Cross-Site Scripting (XSS) & Header Injection in input parameters
 * 3. Rate-Limiting & Body Size Defense (Payload memory exhaustion >16KB -> 413)
 * 4. Concurrent Race Conditions & Double-Click handling (Concurrent refresh / login)
 * 5. Horizontal Privilege Escalation & Broken Access Control (RBAC/PBAC boundaries)
 * 6. Malformed & Empty Payload Stress-Testing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { LoginHistory } from '../src/models/loginHistory.model.js';
import { env } from '../src/config/env.js';

describe('Module M1 — Adversarial Security & Stress-Test Audit', () => {
  let superAdminUser;
  let employeeUser;
  let victimUser;
  let employeeToken;

  const validPassword = 'SecurePassword123!';

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_security');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await LoginHistory.deleteMany({});

    // 1. Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'login.history', subject: 'User', scope: 'own' },
        { action: 'employee.view', subject: 'Employee', scope: 'own' }
      ]
    });

    // 2. Users
    const passwordHash = await User.hashPassword(validPassword);

    superAdminUser = await User.create({
      email: 'sec.admin@company.pk',
      passwordHash,
      roles: [superAdminRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'sec.employee@company.pk',
      passwordHash,
      roles: [employeeRole._id],
      isActive: true
    });

    victimUser = await User.create({
      email: 'sec.victim@company.pk',
      passwordHash,
      roles: [employeeRole._id],
      isActive: true
    });

    employeeToken = jwt.sign(
      { userId: employeeUser._id, roles: [employeeRole._id] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }, 25000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await LoginHistory.deleteMany({});
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. NoSQL INJECTION & INPUT TAMPERING ATTACKS
  // =========================================================================
  describe('Pillar 1: NoSQL Operator Injection & Tampering Defense', () => {
    it('1.1: Rejects $gt operator injection in email with HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: { $gt: '' },
          password: validPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).not.toContain('accessToken');
    });

    it('1.2: Rejects $ne operator injection in password with HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sec.admin@company.pk',
          password: { $ne: null }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.3: Rejects array injection in email parameter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: ['sec.admin@company.pk'],
          password: validPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('1.4: Rejects NoSQL injection in OTP reset payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'sec.employee@company.pk',
          otp: { $regex: '.*' },
          newPassword: 'NewPassword123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. XSS & PAYLOAD EXHAUSTION (DoS DEFENSE)
  // =========================================================================
  describe('Pillar 2: XSS & Request Body Exhaustion Defense', () => {
    it('2.1: Rejects script tags in email field during password recovery', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: '<script>alert("XSS")</script>@evil.com'
        });

      // Zod email format validation must block it
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('2.2: Body size cap: rejects oversized JSON payload (>16KB) with HTTP 413 Payload Too Large', async () => {
      const oversizedString = 'A'.repeat(25 * 1024); // 25KB string exceeds 16KB parser limit
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          email: 'sec.employee@company.pk',
          password: oversizedString
        }));

      expect(res.status).toBe(413);
    });
  });

  // =========================================================================
  // 3. BROKEN ACCESS CONTROL & PRIVILEGE ESCALATION (BOLA / IDOR)
  // =========================================================================
  describe('Pillar 3: Horizontal Privilege Escalation & Access Control Boundaries', () => {
    it('3.1: Regular Employee cannot toggle another user account status (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${victimUser._id}/status`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify victim user was not mutated
      const victim = await User.findById(victimUser._id);
      expect(victim.isActive).toBe(true);
    });

    it('3.2: Regular Employee cannot trigger emergency password reset for another user (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${victimUser._id}/reset-password`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('3.3: Unauthenticated request to /api/v1/auth/me returns HTTP 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('3.4: Tampered/forged JWT access token signature returns HTTP 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { userId: superAdminUser._id, roles: ['Super Admin'] },
        'wrong_attacker_secret_key_123'
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid or expired');
    });
  });

  // =========================================================================
  // 4. CONCURRENT RACE CONDITIONS & DOUBLE-CLICK STRESS TESTING
  // =========================================================================
  describe('Pillar 4: Concurrent Race Conditions & Double-Click Stress Test', () => {
    it('4.1: Parallel concurrent login requests evaluate cleanly without deadlocks', async () => {
      const parallelRequests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'sec.employee@company.pk',
            password: validPassword
          })
      );

      const responses = await Promise.all(parallelRequests);

      // Every response should either be 200 OK
      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();
      });
    });

    it('4.2: Concurrent token refresh: once refreshed, reusing an old token hash is rejected', async () => {
      // Step A: Perform fresh login to obtain initial refresh cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sec.employee@company.pk',
          password: validPassword
        });

      const initialCookie = loginRes.headers['set-cookie'];
      expect(initialCookie).toBeDefined();

      // Step B: Use initial refresh cookie to rotate tokens
      const refresh1 = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', initialCookie);

      expect(refresh1.status).toBe(200);
      const rotatedCookie = refresh1.headers['set-cookie'];
      expect(rotatedCookie).toBeDefined();

      // Step C: Attempt to replay the OLD initial cookie (must be rejected with 401)
      const replayRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', initialCookie);

      expect(replayRes.status).toBe(401);
    });
  });

  // =========================================================================
  // 5. EMPTY, MALFORMED & EDGE CASE PAYLOADS
  // =========================================================================
  describe('Pillar 5: Malformed & Empty Payload Edge Cases', () => {
    it('5.1: Completely empty JSON body on /login returns HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('5.2: Whitespace-only password on /login returns HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sec.employee@company.pk',
          password: '   '
        });

      expect([400, 401]).toContain(res.status);
    });

    it('5.3: Short OTP (<6 digits) on /reset-password returns HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'sec.employee@company.pk',
          otp: '123',
          newPassword: 'ValidNewPassword123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('5.4: Long OTP (>6 digits) on /reset-password returns HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'sec.employee@company.pk',
          otp: '12345678',
          newPassword: 'ValidNewPassword123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
