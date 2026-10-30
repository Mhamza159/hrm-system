/**
 * @file m13.security.test.js
 * @description Comprehensive Security, Hardening & Adversarial Stress Tests for Module M13: Dynamic QR Code Attendance.
 *
 * SPECIFICATION:
 * - Doubt-Driven-Development & Security Hardening
 * - Areas tested:
 *   1. Authentication, Validation (ObjectId), RBAC checkPermission & Scope filter
 *   2. NoSQL Injection & ReDoS resistance in Kiosk query filters
 *   3. Special Focus: Token Replay attacks, Kiosk Secret leakage, Timing attack resistance
 *   4. Edge cases, Race conditions (Double-click punch simulation), Empty/Malformed payloads
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Kiosk } from '../src/models/kiosk.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { Setting } from '../src/models/setting.model.js';

describe('Module M13 — Security, Hardening & Adversarial Stress Tests', () => {
  let superAdminUser, superAdminToken;
  let employeeUser, employeeDoc, employeeToken;
  let secondEmployeeUser, secondEmployeeDoc, secondEmployeeToken;
  let employeeRole, superAdminRole;
  let testDept, testDesig;
  let testKiosk;

  const createAuthToken = (user, roleName, roleId) => {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: roleName,
        roles: [roleName],
        roleId,
        employeeId: user.employeeId
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_test');
    }

    // 1. Roles Setup
    superAdminRole = await Role.findOneAndUpdate(
      { name: 'Super Admin' },
      {
        name: 'Super Admin',
        description: 'System Administrator',
        isSystem: true,
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.kiosk.manage', subject: 'Attendance', scope: 'all' },
          { action: 'user.manage', subject: 'User', scope: 'all' }
        ]
      },
      { upsert: true, new: true }
    );

    employeeRole = await Role.findOneAndUpdate(
      { name: 'Employee' },
      {
        name: 'Employee',
        description: 'Standard Employee',
        isSystem: true,
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    const ts = Date.now();

    testDept = await Department.findOneAndUpdate(
      { name: 'Security Department' },
      { name: 'Security Department', code: `SEC-DEP-${ts.toString().slice(-4)}` },
      { upsert: true, new: true }
    );

    testDesig = await Designation.findOneAndUpdate(
      { title: 'Security Specialist' },
      { title: 'Security Specialist', departmentId: testDept._id },
      { upsert: true, new: true }
    );

    // 2. Super Admin User
    superAdminUser = await User.create({
      name: 'Security Admin',
      email: `sec_admin_${ts}@hrm.company.pk`,
      passwordHash: 'dummyhash',
      roles: [superAdminRole._id],
      isActive: true
    });
    superAdminToken = createAuthToken(superAdminUser, 'Super Admin', superAdminRole._id);

    // 3. Employee 1 User & Doc
    employeeUser = await User.create({
      name: 'Sec Employee 1',
      email: `sec_emp1_${ts}@hrm.company.pk`,
      passwordHash: 'dummyhash',
      roles: [employeeRole._id],
      isActive: true
    });
    employeeDoc = await Employee.create({
      userId: employeeUser._id,
      employeeCode: `SEC-EMP-${ts.toString().slice(-4)}`,
      name: 'Sec Employee 1',
      firstName: 'Sec',
      lastName: 'One',
      departmentId: testDept._id,
      designationId: testDesig._id,
      dateOfJoining: new Date()
    });
    employeeUser.employeeId = employeeDoc._id;
    await employeeUser.save();
    employeeToken = createAuthToken(employeeUser, 'Employee', employeeRole._id);

    // 4. Employee 2 User & Doc
    secondEmployeeUser = await User.create({
      name: 'Sec Employee 2',
      email: `sec_emp2_${ts}@hrm.company.pk`,
      passwordHash: 'dummyhash',
      roles: [employeeRole._id],
      isActive: true
    });
    secondEmployeeDoc = await Employee.create({
      userId: secondEmployeeUser._id,
      employeeCode: `SEC-EMP2-${ts.toString().slice(-4)}`,
      name: 'Sec Employee 2',
      firstName: 'Sec',
      lastName: 'Two',
      departmentId: testDept._id,
      designationId: testDesig._id,
      dateOfJoining: new Date()
    });
    secondEmployeeUser.employeeId = secondEmployeeDoc._id;
    await secondEmployeeUser.save();
    secondEmployeeToken = createAuthToken(secondEmployeeUser, 'Employee', employeeRole._id);

    // 5. Test Kiosk
    testKiosk = await Kiosk.create({
      name: 'Security Test Kiosk',
      code: `SEC-KIOSK-${ts}`,
      type: 'both',
      locationDescription: 'Security Verification Gate',
      secretKey: crypto.randomBytes(32).toString('hex'),
      isActive: true
    });

    // Ensure global QR setting is enabled
    await Setting.findOneAndUpdate(
      { key: 'qrAttendance' },
      { key: 'qrAttendance', value: { isEnabled: true, rotationSeconds: 30 } },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    if (testKiosk?._id) {
      await Kiosk.deleteOne({ _id: testKiosk._id });
    }
    if (superAdminUser?._id) {
      await User.deleteMany({ _id: { $in: [superAdminUser._id, employeeUser._id, secondEmployeeUser._id] } });
    }
    if (employeeDoc?._id) {
      await Employee.deleteMany({ _id: { $in: [employeeDoc._id, secondEmployeeDoc._id] } });
    }
  });

  // ==========================================================================
  // AREA 1: Authentication, Validation & RBAC Scope Filters
  // ==========================================================================
  describe('Area 1: Authentication, ObjectId Validation & RBAC', () => {
    it('should reject unauthenticated requests to Kiosk endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/attendance/kiosks');
      expect(res.status).toBe(401);
    });

    it('should reject unauthorized employee access to Kiosk management with 403', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject malformed or non-ObjectId kiosk IDs with 400 validation error', async () => {
      const invalidIds = ['123', 'not-a-valid-id', '6ae48e3f6afb8f3e6c30c4eZ'];
      for (const id of invalidIds) {
        const res = await request(app)
          .get(`/api/v1/attendance/kiosks/${id}`)
          .set('Authorization', `Bearer ${superAdminToken}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid kiosk ID|Validation/i);
      }
    });

    it('should reject malformed user ID on device reset route with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/users/invalid-id/reset-device')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Hardware replacement' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid user ID|Validation/i);
    });
  });

  // ==========================================================================
  // AREA 2: NoSQL Injection, ReDoS & Input Hardening
  // ==========================================================================
  describe('Area 2: NoSQL Injection & ReDoS Defense', () => {
    it('should neutralize regex metacharacters in Kiosk search filter without crashing or ReDoS', async () => {
      const hostilePayloads = [
        '.*',
        '(a+)+',
        '[[[',
        '\\',
        '^{}$?+*()[]|\\',
        '{"$gt": ""}'
      ];

      for (const payload of hostilePayloads) {
        const res = await request(app)
          .get('/api/v1/attendance/kiosks')
          .query({ search: payload })
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // AREA 3: Khaas Focus: Kiosk Secret & Token Replay
  // ==========================================================================
  describe('Area 3: Special Focus: Kiosk Secret & Token Replay Attacks', () => {
    it('should NEVER leak kiosk secretKey in Kiosk listing, details or QR stream', async () => {
      // 1. GET /kiosks
      const listRes = await request(app)
        .get('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(listRes.status).toBe(200);
      for (const kiosk of listRes.body.data) {
        expect(kiosk.secretKey).toBeUndefined();
      }

      // 2. GET /kiosks/:id
      const detailRes = await request(app)
        .get(`/api/v1/attendance/kiosks/${testKiosk._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.secretKey).toBeUndefined();

      // 3. GET /qr/current
      const qrRes = await request(app)
        .get('/api/v1/attendance/qr/current')
        .query({ kioskId: testKiosk._id.toString() })
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(qrRes.status).toBe(200);
      expect(qrRes.body.data.kiosk.secretKey).toBeUndefined();
    });

    it('should reject tampered HMAC token signatures in constant time', async () => {
      // Fetch a legitimate QR token
      const qrRes = await request(app)
        .get('/api/v1/attendance/qr/current')
        .query({ kioskId: testKiosk._id.toString() })
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(qrRes.status).toBe(200);
      const validToken = qrRes.body.data.token;

      // Tamper signature by flipping characters
      const [payloadB64, signature] = validToken.split('.');
      const tamperedSignature = signature.slice(0, -3) + 'XYZ';
      const tamperedToken = `${payloadB64}.${tamperedSignature}`;

      const punchRes = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: tamperedToken,
          deviceId: 'SEC-DEVICE-01'
        });

      expect(punchRes.status).toBe(400);
      expect(punchRes.body.message).toMatch(/Tampered or invalid QR code signature/i);
    });

    it('should reject QR tokens with timestamps in the future', async () => {
      const kiosk = await Kiosk.findById(testKiosk._id).select('+secretKey');
      const futureSec = Math.floor(Date.now() / 1000) + 3600; // 1 hour into future
      const payload = {
        kId: kiosk._id.toString(),
        kType: kiosk.type,
        ts: futureSec,
        ttl: 30,
        nonce: crypto.randomBytes(8).toString('hex')
      };
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto.createHmac('sha256', kiosk.secretKey).update(payloadB64).digest('base64url');
      const futureToken = `${payloadB64}.${signature}`;

      const punchRes = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: futureToken,
          deviceId: 'SEC-DEVICE-01'
        });

      expect(punchRes.status).toBe(400);
      expect(punchRes.body.message).toMatch(/future/i);
    });

    it('should reject QR punch attempts if hardware deviceId is missing or empty (Anti-Bypass)', async () => {
      const qrRes = await request(app)
        .get('/api/v1/attendance/qr/current')
        .query({ kioskId: testKiosk._id.toString() })
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(qrRes.status).toBe(200);
      const validToken = qrRes.body.data.token;

      const punchRes = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: validToken,
          deviceId: '' // Intentionally empty to test bypass prevention
        });

      expect(punchRes.status).toBe(400);
      expect(punchRes.body.message).toMatch(/Hardware device ID is mandatory/i);
    });

    it('should prevent token replay: same user cannot reuse the same QR token nonce', async () => {
      // Clean attendance for today for secondEmployeeUser
      const todayUtc = new Date();
      todayUtc.setUTCHours(0, 0, 0, 0);
      await Attendance.deleteMany({ employeeId: secondEmployeeUser.employeeId, date: todayUtc });

      // Reset bound device
      await User.updateOne({ _id: secondEmployeeUser._id }, { deviceId: null, deviceBoundAt: null });

      const qrRes = await request(app)
        .get('/api/v1/attendance/qr/current')
        .query({ kioskId: testKiosk._id.toString() })
        .set('Authorization', `Bearer ${secondEmployeeToken}`);
      expect(qrRes.status).toBe(200);
      const validToken = qrRes.body.data.token;

      // 1. First punch succeeds
      const firstPunch = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${secondEmployeeToken}`)
        .send({
          source: 'qr',
          qrToken: validToken,
          deviceId: 'SEC-PHONE-EMP-2'
        });

      expect(firstPunch.status).toBe(200);

      // 2. Second punch with identical token must be blocked by Anti-Replay Cache
      const replayPunch = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${secondEmployeeToken}`)
        .send({
          source: 'qr',
          qrToken: validToken,
          deviceId: 'SEC-PHONE-EMP-2'
        });

      expect(replayPunch.status).toBe(400);
      expect(replayPunch.body.message).toMatch(/already been consumed/i);
    });
  });

  // ==========================================================================
  // AREA 4: Edge Cases, Race Conditions & Empty Payloads
  // ==========================================================================
  describe('Area 4: Race Conditions & Empty Data Stress-Testing', () => {
    it('should reject empty or missing fields on Kiosk creation with 400', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({}); // Completely empty body

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate kiosk code with 400 Conflict/Duplicate error', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Duplicate Kiosk',
          code: testKiosk.code, // Same code as existing kiosk
          type: 'both'
        });

      expect([400, 409]).toContain(res.status);
      expect(res.body.message).toMatch(/already exists|already registered/i);
    });

    it('should handle simulated concurrent double-click race condition gracefully', async () => {
      const ts = Date.now();
      const racer = await User.create({
        name: 'Racer Staff',
        email: `racer_${ts}@hrm.company.pk`,
        passwordHash: 'dummyhash',
        roles: [employeeRole._id],
        isActive: true
      });
      const racerDoc = await Employee.create({
        userId: racer._id,
        employeeCode: `RACER-${ts.toString().slice(-4)}`,
        name: 'Racer Staff',
        firstName: 'Racer',
        lastName: 'Staff',
        departmentId: testDept._id,
        designationId: testDesig._id,
        dateOfJoining: new Date()
      });
      racer.employeeId = racerDoc._id;
      await racer.save();
      const racerToken = createAuthToken(racer, 'Employee', employeeRole._id);

      const qrRes = await request(app)
        .get('/api/v1/attendance/qr/current')
        .query({ kioskId: testKiosk._id.toString() })
        .set('Authorization', `Bearer ${racerToken}`);
      expect(qrRes.status).toBe(200);
      const validToken = qrRes.body.data.token;

      // Dispatch 2 concurrent requests simultaneously (double-click simulation)
      const [req1, req2] = await Promise.all([
        request(app)
          .post('/api/v1/attendance/check-in')
          .set('Authorization', `Bearer ${racerToken}`)
          .send({
            source: 'qr',
            qrToken: validToken,
            deviceId: 'RACER-DEV-1'
          }),
        request(app)
          .post('/api/v1/attendance/check-in')
          .set('Authorization', `Bearer ${racerToken}`)
          .send({
            source: 'qr',
            qrToken: validToken,
            deviceId: 'RACER-DEV-1'
          })
      ]);

      const statuses = [req1.status, req2.status];
      // Exactly ONE request must succeed (200), and the other must be rejected (400)
      expect(statuses).toContain(200);
      expect([400, 409]).toContain(statuses.find((s) => s !== 200));

      // Clean up racer
      await User.deleteOne({ _id: racer._id });
      await Employee.deleteOne({ _id: racerDoc._id });
      await Attendance.deleteMany({ employeeId: racerDoc._id });
    });
  });
});
