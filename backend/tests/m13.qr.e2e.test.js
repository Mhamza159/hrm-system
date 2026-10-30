/**
 * @file m13.qr.e2e.test.js
 * @description Comprehensive Multi-Role E2E and Integration Test Suite for Module M13: QR Code Attendance.
 *
 * SPECIFICATION:
 * - Module: M13 Dynamic QR Code Attendance (BUILD-GUIDE Section 18 · Rows 13.1 to 13.6)
 * - Anti-proxy: HMAC SHA-256 rotating QR codes with 30s TTL, hardware device binding, directionality enforcement.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Setting } from '../src/models/setting.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { Kiosk } from '../src/models/kiosk.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';

describe('Module M13 — Dynamic QR Code Attendance E2E Test Suite', () => {
  let superAdminToken, hrToken, managerToken, employeeToken;
  let superAdminUser, hrUser, managerUser, employeeUser;
  let employeeDoc, hrEmployeeDoc;
  let testDept, testDesig;
  let createdKioskId, exitOnlyKioskId;

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
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_test_qr');
    }

    // Clean test state
    await Kiosk.deleteMany({});
    await Attendance.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Roles Setup
    const superAdminRole = await Role.findOneAndUpdate(
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

    const hrRole = await Role.findOneAndUpdate(
      { name: 'HR Manager' },
      {
        name: 'HR Manager',
        description: 'HR Administrator',
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

    const managerRole = await Role.findOneAndUpdate(
      { name: 'Department Manager' },
      {
        name: 'Department Manager',
        description: 'Dept Manager',
        isSystem: true,
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'team' }
        ]
      },
      { upsert: true, new: true }
    );

    const employeeRole = await Role.findOneAndUpdate(
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

    // 2. Department & Designation
    testDept = await Department.findOneAndUpdate(
      { name: 'Engineering Operations' },
      { name: 'Engineering Operations' },
      { upsert: true, new: true }
    );

    testDesig = await Designation.findOneAndUpdate(
      { title: 'Lead Architect' },
      { title: 'Lead Architect', departmentId: testDept._id },
      { upsert: true, new: true }
    );

    // 3. User & Employee accounts
    const ts = Date.now();

    superAdminUser = await User.create({
      name: 'Super Admin User',
      email: `sa_qr_${ts}@example.com`,
      passwordHash: 'dummyhash',
      roles: [superAdminRole._id],
      isActive: true
    });
    superAdminToken = createAuthToken(superAdminUser, 'Super Admin', superAdminRole._id);

    hrUser = await User.create({
      name: 'HR Manager User',
      email: `hr_qr_${ts}@example.com`,
      passwordHash: 'dummyhash',
      roles: [hrRole._id],
      isActive: true
    });
    hrEmployeeDoc = await Employee.create({
      userId: hrUser._id,
      employeeCode: `EMP-HR-${ts.toString().slice(-4)}`,
      name: 'HR Manager',
      firstName: 'HR',
      lastName: 'Manager',
      departmentId: testDept._id,
      designationId: testDesig._id,
      dateOfJoining: new Date()
    });
    hrUser.employeeId = hrEmployeeDoc._id;
    await hrUser.save();
    hrToken = createAuthToken(hrUser, 'HR Manager', hrRole._id);

    managerUser = await User.create({
      name: 'Dept Manager User',
      email: `mgr_qr_${ts}@example.com`,
      passwordHash: 'dummyhash',
      roles: [managerRole._id],
      isActive: true
    });
    managerToken = createAuthToken(managerUser, 'Department Manager', managerRole._id);

    employeeUser = await User.create({
      name: 'QR Field Employee',
      email: `emp_qr_${ts}@example.com`,
      passwordHash: 'dummyhash',
      roles: [employeeRole._id],
      isActive: true
    });
    employeeDoc = await Employee.create({
      userId: employeeUser._id,
      employeeCode: `EMP-QR-${ts.toString().slice(-4)}`,
      name: 'Hamza Tariq',
      firstName: 'Hamza',
      lastName: 'Tariq',
      departmentId: testDept._id,
      designationId: testDesig._id,
      dateOfJoining: new Date()
    });
    employeeUser.employeeId = employeeDoc._id;
    await employeeUser.save();
    employeeToken = createAuthToken(employeeUser, 'Employee', employeeRole._id);

    // Ensure system setting allows QR attendance initially
    await Setting.findOneAndUpdate(
      { key: 'qrAttendance' },
      { key: 'qrAttendance', value: { isEnabled: true, rotationSeconds: 30 } },
      { upsert: true }
    );
  });

  afterAll(async () => {
    // Keep test db clean
    await Kiosk.deleteMany({});
  });

  // ==========================================================================
  // Section 18 / Row 13.1: Kiosk Hardware Devices CRUD & Permissions
  // ==========================================================================
  describe('Row 13.1: Kiosk Devices CRUD & Authorization', () => {
    it('HR Manager can successfully register a new attendance Kiosk', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Reception Main Lobby',
          code: 'KIOSK-MAIN-01',
          type: 'both',
          locationDescription: 'Ground floor main entrance security booth'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Reception Main Lobby');
      expect(res.body.data.code).toBe('KIOSK-MAIN-01');
      expect(res.body.data.type).toBe('both');
      expect(res.body.data.secretKey).toBeUndefined(); // Secret key must NOT be exposed in response

      createdKioskId = res.body.data._id;
    });

    it('Rejects duplicate Kiosk registration codes with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Another Reception Terminal',
          code: 'kiosk-main-01', // case insensitive duplicate
          type: 'both'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('Employee without attendance.kiosk.manage is rejected with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Rogue Kiosk',
          code: 'KIOSK-ROGUE',
          type: 'both'
        });

      expect(res.status).toBe(403);
    });

    it('Can list registered kiosks and update kiosk configuration', async () => {
      const listRes = await request(app)
        .get('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

      const updateRes = await request(app)
        .patch(`/api/v1/attendance/kiosks/${createdKioskId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          locationDescription: 'Updated: Gate 1 reception revolving door'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.locationDescription).toBe('Updated: Gate 1 reception revolving door');
    });

    it('Creates an exit-only kiosk for directionality testing', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/kiosks')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Rear Parking Exit Barrier',
          code: 'KIOSK-EXIT-02',
          type: 'exit',
          locationDescription: 'Rear parking exit turnstile'
        });

      expect(res.status).toBe(201);
      exitOnlyKioskId = res.body.data._id;
    });
  });

  // ==========================================================================
  // Section 18 / Row 13.2: Dynamic Rotating QR Code Generation
  // ==========================================================================
  describe('Row 13.2: Dynamic Rotating QR Code Token & Vector Stream', () => {
    it('Generates signed HMAC SHA-256 token and SVG payload for active kiosk', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/qr/current?kioskId=${createdKioskId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.svg).toContain('<svg');
      expect(res.body.data.expiresIn).toBe(30);

      // Verify token format: base64urlPayload.base64urlSignature
      const parts = res.body.data.token.split('.');
      expect(parts.length).toBe(2);

      const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      expect(payload.kId).toBe(createdKioskId);
      expect(payload.kType).toBe('both');
      expect(payload.ttl).toBe(30);
      expect(typeof payload.ts).toBe('number');

      // Heartbeat should be updated
      const kiosk = await Kiosk.findById(createdKioskId);
      expect(kiosk.lastHeartbeatAt).toBeDefined();
    });

    it('Rejects QR generation for non-existent kiosk with HTTP 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/attendance/qr/current?kioskId=${fakeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================================================
  // Section 18 / Row 13.3 & 13.4: Scan-to-Punch & Hardware Device Binding
  // ==========================================================================
  describe('Row 13.3 & 13.4: Scan-to-Punch, Expiry, Direction, & Device Binding', () => {
    let liveQrToken;
    const testDeviceId = 'device-hardware-uuid-98765';

    it('Fetches a fresh QR token for clock-in test', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/qr/current?kioskId=${createdKioskId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      
      expect(res.status).toBe(200);
      liveQrToken = res.body.data.token;
    });

    it('Rejects scan with tampered signature with HTTP 400', async () => {
      const parts = liveQrToken.split('.');
      const tamperedToken = `${parts[0]}.invalidtamperedsignature123`;

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: tamperedToken,
          deviceId: testDeviceId
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/tampered|invalid/i);
    });

    it('Rejects scan with expired QR token with HTTP 400', async () => {
      // Craft expired token using kiosk secretKey
      const kiosk = await Kiosk.findById(createdKioskId).select('+secretKey');
      const expiredPayload = {
        kId: kiosk._id.toString(),
        kType: kiosk.type,
        ts: Math.floor(Date.now() / 1000) - 100, // 100 seconds in the past
        ttl: 30,
        nonce: 'expirednonce'
      };
      const pB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      const sig = crypto.createHmac('sha256', kiosk.secretKey).update(pB64).digest('base64url');
      const expiredToken = `${pB64}.${sig}`;

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: expiredToken,
          deviceId: testDeviceId
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('Enforces Kiosk directionality: Check-in at an exit-only kiosk returns HTTP 400', async () => {
      const qrRes = await request(app)
        .get(`/api/v1/attendance/qr/current?kioskId=${exitOnlyKioskId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      const exitQrToken = qrRes.body.data.token;

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: exitQrToken,
          deviceId: testDeviceId
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exit only/i);
    });

    it('Clock-in succeeds on valid QR scan and automatically binds user hardware device', async () => {
      // User deviceId must be null before first scan
      const preUser = await User.findById(employeeUser._id);
      expect(preUser.deviceId || null).toBeNull();

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: liveQrToken,
          deviceId: testDeviceId,
          deviceModel: 'Samsung Galaxy S24 Ultra'
        });

      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('qr');
      expect(res.body.data.kioskId).toBe(createdKioskId);

      // Verify user deviceId was bound
      const postUser = await User.findById(employeeUser._id);
      expect(postUser.deviceId).toBe(testDeviceId);
      expect(postUser.deviceModel).toBe('Samsung Galaxy S24 Ultra');
      expect(postUser.deviceBoundAt).toBeDefined();
    });

    it('Subsequent punch attempt from a different device (proxy punch) is blocked with HTTP 403', async () => {
      // Get fresh QR token
      const qrRes = await request(app)
        .get(`/api/v1/attendance/qr/current?kioskId=${createdKioskId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      const freshToken = qrRes.body.data.token;

      // Attempt punch with buddy proxy device ID
      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: freshToken,
          deviceId: 'proxy-phone-uuid-hacked-999',
          deviceModel: 'Xiaomi Redmi 10'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/device binding mismatch/i);
    });

    it('Clock-out succeeds when scanned from the registered bound device', async () => {
      const qrRes = await request(app)
        .get(`/api/v1/attendance/qr/current?kioskId=${createdKioskId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'qr',
          qrToken: qrRes.body.data.token,
          deviceId: testDeviceId
        });

      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkOut).toBeDefined();
    });
  });

  // ==========================================================================
  // Section 18 / Row 13.5: HR Device Binding Reset Workflow & Audit
  // ==========================================================================
  describe('Row 13.5: HR Device Binding Reset Workflow', () => {
    it('Employee without HR/Admin permission cannot reset device binding (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/attendance/users/${employeeUser._id}/reset-device`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          reason: 'I bought a new iPhone 16 Pro'
        });

      expect(res.status).toBe(403);
    });

    it('HR Manager can successfully reset an employees device binding and records audit log', async () => {
      const res = await request(app)
        .post(`/api/v1/attendance/users/${employeeUser._id}/reset-device`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          reason: 'Employee changed their official company smartphone'
        });

      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user's deviceId is cleared in DB
      const user = await User.findById(employeeUser._id);
      expect(user.deviceId || null).toBeNull();
      expect(user.deviceBoundAt || null).toBeNull();

      // Verify AuditLog record
      const audit = await AuditLog.findOne({
        action: 'RESET_DEVICE_BINDING',
        targetId: employeeUser._id
      });
      expect(audit).toBeDefined();
      expect(audit.details.reason).toContain('changed their official company smartphone');
    });

    it('Also works via /api/v1/users/:id/reset-device route', async () => {
      // Bind device again
      await User.findByIdAndUpdate(employeeUser._id, { deviceId: 'temp-device-123' });

      const res = await request(app)
        .post(`/api/v1/users/${employeeUser._id}/reset-device`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          reason: 'Secondary verification of user route'
        });

      
      expect(res.status).toBe(200);
      const user = await User.findById(employeeUser._id);
      expect(user.deviceId || null).toBeNull();
    });
  });

  // ==========================================================================
  // Section 18 / Row 13.6: System Setting Toggle for QR Attendance
  // ==========================================================================
  describe('Row 13.6: System Setting Feature Toggle for QR Attendance', () => {
    it('Blocks QR generation with HTTP 400 when disabled in System Settings', async () => {
      await Setting.findOneAndUpdate(
        { key: 'qrAttendance' },
        { value: { isEnabled: false } }
      );

      const res = await request(app)
        .get(`/api/v1/attendance/qr/current?kioskId=${createdKioskId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/disabled/i);

      // Restore setting to enabled
      await Setting.findOneAndUpdate(
        { key: 'qrAttendance' },
        { value: { isEnabled: true, rotationSeconds: 30 } }
      );
    });
  });
});
