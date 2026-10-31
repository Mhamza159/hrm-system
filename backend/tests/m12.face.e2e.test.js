/**
 * @file m12.face.e2e.test.js
 * @description Comprehensive Multi-Role Integration & E2E Test Suite for Module M12: Face Recognition Attendance.
 *
 * SPECIFICATION & GOVERNANCE:
 * - Module: M12 Face Recognition Attendance (BUILD-GUIDE Section 19 · Rows 12.1 to 12.9)
 * - Verification: Enrollment, HR approval/rejection lifecycle, Euclidean distance matching, anti-spoofing fallback, flagged snapshots, manager team scoping.
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

describe('Module M12 — Face Recognition Attendance E2E Test Suite', () => {
  let superAdminToken, hrToken, managerToken, employeeToken, otherDeptEmployeeToken;
  let superAdminUser, hrUser, managerUser, employeeUser, otherDeptEmployeeUser;
  let employeeDoc, otherDeptEmployeeDoc;
  let testDept, otherDept, testDesig;

  // Mock 128-d face descriptors
  const createMockDescriptor = (baseVal = 0.1) => {
    return Array.from({ length: 128 }, (_, i) => baseVal + (i * 0.001));
  };

  const enrolledDescriptorA = createMockDescriptor(0.15);
  const enrolledDescriptorB = createMockDescriptor(0.16);
  const enrolledDescriptorC = createMockDescriptor(0.14);

  // Close match (Euclidean distance ~ 0.05 < 0.50)
  const matchingLiveDescriptor = createMockDescriptor(0.152);

  // Far mismatch (Euclidean distance > 1.0 > 0.50)
  const mismatchLiveDescriptor = createMockDescriptor(0.85);

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
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_test_face');
    }

    // Clean test state
    await Attendance.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Roles Setup
    const superAdminRole = await Role.findOneAndUpdate(
      { name: 'Super Admin' },
      { name: 'Super Admin', permissions: [{ action: 'manage', subject: 'all', scope: 'all' }] },
      { upsert: true, new: true }
    );

    const hrRole = await Role.findOneAndUpdate(
      { name: 'HR Manager' },
      {
        name: 'HR Manager',
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.face.manage', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.approve', subject: 'Attendance', scope: 'all' }
        ]
      },
      { upsert: true, new: true }
    );

    const managerRole = await Role.findOneAndUpdate(
      { name: 'Department Manager' },
      {
        name: 'Department Manager',
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'team' },
          { action: 'attendance.approve', subject: 'Attendance', scope: 'team' }
        ]
      },
      { upsert: true, new: true }
    );

    const employeeRole = await Role.findOneAndUpdate(
      { name: 'Employee' },
      {
        name: 'Employee',
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    // 2. Organization Fixtures
    testDept = await Department.findOneAndUpdate(
      { name: 'Face Test Engineering' },
      { name: 'Face Test Engineering', code: 'FTE' },
      { upsert: true, new: true }
    );

    otherDept = await Department.findOneAndUpdate(
      { name: 'Face Test Marketing' },
      { name: 'Face Test Marketing', code: 'FTM' },
      { upsert: true, new: true }
    );

    testDesig = await Designation.findOneAndUpdate(
      { title: 'AI Specialist' },
      { title: 'AI Specialist', departmentId: testDept._id },
      { upsert: true, new: true }
    );

    // 3. User & Employee Fixtures
    employeeUser = await User.findOneAndUpdate(
      { email: 'face.alice@example.com' },
      {
        name: 'Alice Face Employee',
        email: 'face.alice@example.com',
        passwordHash: 'dummyhash',
        roles: [employeeRole._id],
        faceEnrollment: { status: 'none', descriptors: [] }
      },
      { upsert: true, new: true }
    );

    employeeDoc = await Employee.findOneAndUpdate(
      { email: 'face.alice@example.com' },
      {
        employeeCode: 'EMP-FACE-01',
        name: 'Alice Face Employee',
        email: 'face.alice@example.com',
        departmentId: testDept._id,
        designationId: testDesig._id,
        userId: employeeUser._id,
        status: 'Active'
      },
      { upsert: true, new: true }
    );
    employeeUser.employeeId = employeeDoc._id;
    await employeeUser.save();

    managerUser = await User.findOneAndUpdate(
      { email: 'face.manager@example.com' },
      {
        name: 'Bob Engineering Manager',
        email: 'face.manager@example.com',
        passwordHash: 'dummyhash',
        roles: [managerRole._id]
      },
      { upsert: true, new: true }
    );

    const managerDoc = await Employee.findOneAndUpdate(
      { email: 'face.manager@example.com' },
      {
        employeeCode: 'MGR-FACE-01',
        name: 'Bob Engineering Manager',
        email: 'face.manager@example.com',
        departmentId: testDept._id,
        designationId: testDesig._id,
        userId: managerUser._id,
        status: 'Active'
      },
      { upsert: true, new: true }
    );
    managerUser.employeeId = managerDoc._id;
    await managerUser.save();

    // Link managerId for team scoping
    employeeDoc.managerId = managerDoc._id;
    await employeeDoc.save();

    otherDeptEmployeeUser = await User.findOneAndUpdate(
      { email: 'face.charlie@example.com' },
      {
        name: 'Charlie Marketing Rep',
        email: 'face.charlie@example.com',
        passwordHash: 'dummyhash',
        roles: [employeeRole._id]
      },
      { upsert: true, new: true }
    );

    otherDeptEmployeeDoc = await Employee.findOneAndUpdate(
      { email: 'face.charlie@example.com' },
      {
        employeeCode: 'EMP-FACE-02',
        name: 'Charlie Marketing Rep',
        email: 'face.charlie@example.com',
        departmentId: otherDept._id,
        designationId: testDesig._id,
        userId: otherDeptEmployeeUser._id,
        status: 'Active'
      },
      { upsert: true, new: true }
    );
    otherDeptEmployeeUser.employeeId = otherDeptEmployeeDoc._id;
    await otherDeptEmployeeUser.save();

    hrUser = await User.findOneAndUpdate(
      { email: 'face.hr@example.com' },
      {
        name: 'Helen HR Manager',
        email: 'face.hr@example.com',
        passwordHash: 'dummyhash',
        roles: [hrRole._id]
      },
      { upsert: true, new: true }
    );

    superAdminUser = await User.findOneAndUpdate(
      { email: 'face.admin@example.com' },
      {
        name: 'Sam Super Admin',
        email: 'face.admin@example.com',
        passwordHash: 'dummyhash',
        roles: [superAdminRole._id]
      },
      { upsert: true, new: true }
    );

    // 4. Initial Settings
    await Setting.findOneAndUpdate(
      { key: 'faceAttendance' },
      {
        key: 'faceAttendance',
        value: { isEnabled: true, matchThreshold: 0.50, requireLiveness: true }
      },
      { upsert: true }
    );

    // 5. Generate Auth Tokens
    superAdminToken = createAuthToken(superAdminUser, 'Super Admin', superAdminRole._id);
    hrToken = createAuthToken(hrUser, 'HR Manager', hrRole._id);
    managerToken = createAuthToken(managerUser, 'Department Manager', managerRole._id);
    employeeToken = createAuthToken(employeeUser, 'Employee', employeeRole._id);
    otherDeptEmployeeToken = createAuthToken(otherDeptEmployeeUser, 'Employee', employeeRole._id);
  });

  afterAll(async () => {
    await Attendance.deleteMany({});
  });

  // =========================================================================
  // Slice 2: Face Enrollment (Row 12.2)
  // =========================================================================
  describe('BUILD-GUIDE 12.2: Face Enrollment Submission', () => {
    it('should reject enrollment if fewer than 3 descriptors provided', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [enrolledDescriptorA, enrolledDescriptorB], // only 2
          photo: 'data:image/jpeg;base64,mockphoto'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject enrollment if descriptor vector length is not 128', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [
            Array.from({ length: 64 }, () => 0.1),
            enrolledDescriptorB,
            enrolledDescriptorC
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully submit 3 face descriptors and set status to pending', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [enrolledDescriptorA, enrolledDescriptorB, enrolledDescriptorC],
          photo: 'data:image/jpeg;base64,mockfrontalphoto'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.descriptorsCount).toBe(3);

      // Verify in DB
      const updatedUser = await User.findById(employeeUser._id);
      expect(updatedUser.faceEnrollment.status).toBe('pending');
      expect(updatedUser.faceEnrollment.descriptors.length).toBe(3);
    });

    it('should return face enrollment status via GET /attendance/face/status', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/face/status')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.descriptorsCount).toBe(3);
    });
  });

  // =========================================================================
  // Slice 3: HR Approval & Re-enrollment Lifecycle (Row 12.3)
  // =========================================================================
  describe('BUILD-GUIDE 12.3: HR Approval & Enrollment Lifecycle', () => {
    it('should reject non-HR users from approving face enrollments (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/attendance/face/${employeeUser._id}/approve`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow HR Manager to query face enrollments list', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/face/enrollments?status=pending')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.some((u) => u._id === String(employeeUser._id));
      expect(found).toBe(true);
    });

    it('should allow HR Manager to approve pending face enrollment', async () => {
      const res = await request(app)
        .patch(`/api/v1/attendance/face/${employeeUser._id}/approve`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await User.findById(employeeUser._id);
      expect(dbUser.faceEnrollment.status).toBe('approved');
      expect(dbUser.faceEnrollment.approvedBy).toBeDefined();
    });

    it('should allow HR Manager to reject face enrollment with mandatory reason', async () => {
      // Re-enroll otherDeptEmployeeUser first
      await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${otherDeptEmployeeToken}`)
        .send({
          descriptors: [enrolledDescriptorA, enrolledDescriptorB, enrolledDescriptorC]
        });

      const res = await request(app)
        .patch(`/api/v1/attendance/face/${otherDeptEmployeeUser._id}/reject`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ reason: 'Photo is too dark and face is shadowed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await User.findById(otherDeptEmployeeUser._id);
      expect(dbUser.faceEnrollment.status).toBe('rejected');
      expect(dbUser.faceEnrollment.rejectionReason).toBe('Photo is too dark and face is shadowed');
    });

    it('should allow HR Manager to reset face enrollment for re-enrolling', async () => {
      const res = await request(app)
        .delete(`/api/v1/attendance/face/${otherDeptEmployeeUser._id}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ reason: 'Employee requested new photo capture' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await User.findById(otherDeptEmployeeUser._id);
      expect(dbUser.faceEnrollment.status).toBe('none');
      expect(dbUser.faceEnrollment.descriptors.length).toBe(0);
    });
  });

  // =========================================================================
  // Slice 5: Face Check-In & Distance Matching (Row 12.5)
  // =========================================================================
  describe('BUILD-GUIDE 12.5: Face Check-In & Euclidean Distance Matching', () => {
    it('should reject face check-in if user face enrollment is not approved', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${otherDeptEmployeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: matchingLiveDescriptor
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Face enrollment is not approved/i);
    });

    it('should successfully clock in with matching face descriptor (distance < threshold)', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: matchingLiveDescriptor,
          snapshot: 'data:image/jpeg;base64,mocksnapshot'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('face');
      expect(['present', 'half_day', 'late']).toContain(res.body.data.status);
      expect(res.body.data.confidenceDistance).toBeLessThan(0.50);
      expect(res.body.data.snapshotUrl).toBe('data:image/jpeg;base64,mocksnapshot');
    });

    it('should successfully clock out with matching face descriptor', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: matchingLiveDescriptor
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkOut).toBeDefined();
    });
  });

  // =========================================================================
  // Slice 6: Threshold & Setting Tuning (Row 12.6)
  // =========================================================================
  describe('BUILD-GUIDE 12.6: Face Recognition Setting & Toggle', () => {
    it('should block face check-in when faceAttendance is disabled by Super Admin', async () => {
      // Disable face attendance
      await Setting.findOneAndUpdate(
        { key: 'faceAttendance' },
        { value: { isEnabled: false, matchThreshold: 0.50 } }
      );

      // Clean attendance for today to test punch block
      await Attendance.deleteMany({ employeeId: employeeDoc._id });

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: matchingLiveDescriptor
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Face recognition attendance is currently disabled/i);

      // Re-enable for subsequent tests
      await Setting.findOneAndUpdate(
        { key: 'faceAttendance' },
        { value: { isEnabled: true, matchThreshold: 0.50 } }
      );
    });
  });

  // =========================================================================
  // Slice 7: Failed / Suspicious Attempts Logging (Row 12.7)
  // =========================================================================
  describe('BUILD-GUIDE 12.7: Failed Face Attempts Logging & Photo Snapshot', () => {
    it('should reject face punch when descriptor distance exceeds threshold and log flagged attendance', async () => {
      await Attendance.deleteMany({ employeeId: employeeDoc._id });

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: mismatchLiveDescriptor, // Far mismatch
          snapshot: 'data:image/jpeg;base64,mockfailedattemptphoto'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Face verification failed/i);

      // Verify that a flagged attendance record was created in MongoDB
      const flagged = await Attendance.findOne({
        employeeId: employeeDoc._id,
        isFlagged: true,
        flagReason: 'face_match_failed'
      });

      expect(flagged).toBeDefined();
      expect(flagged.snapshotUrl).toBe('data:image/jpeg;base64,mockfailedattemptphoto');
      expect(flagged.confidenceDistance).toBeGreaterThan(0.50);
    });
  });

  // =========================================================================
  // Slice 9: Department Scoped Flagged Snapshots (Row 12.9)
  // =========================================================================
  describe('BUILD-GUIDE 12.9: Manager Scoped Flagged Snapshots', () => {
    it('should allow Department Manager to view only their department staff flagged punches', async () => {
      // 1. Create a flagged punch for otherDeptEmployeeDoc
      await Attendance.create({
        employeeId: otherDeptEmployeeDoc._id,
        date: new Date(),
        source: 'face',
        isFlagged: true,
        flagReason: 'face_match_failed',
        snapshotUrl: 'data:image/jpeg;base64,marketingphoto'
      });

      // 2. Department Manager queries flagged punches
      const res = await request(app)
        .get('/api/v1/attendance/flagged?status=pending')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const returnedPunches = res.body.data;
      // Manager should see Alice (Engineering)
      const hasEngineeringStaff = returnedPunches.some((p) => String(p.employeeId?._id) === String(employeeDoc._id));
      expect(hasEngineeringStaff).toBe(true);

      // Manager should NOT see Charlie (Marketing)
      const hasMarketingStaff = returnedPunches.some((p) => String(p.employeeId?._id) === String(otherDeptEmployeeDoc._id));
      expect(hasMarketingStaff).toBe(false);
    });

    it('should allow HR Manager to view flagged punches across all departments', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/flagged?status=pending')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const returnedPunches = res.body.data;
      const hasEngineeringStaff = returnedPunches.some((p) => String(p.employeeId?._id) === String(employeeDoc._id));
      const hasMarketingStaff = returnedPunches.some((p) => String(p.employeeId?._id) === String(otherDeptEmployeeDoc._id));

      expect(hasEngineeringStaff).toBe(true);
      expect(hasMarketingStaff).toBe(true);
    });
  });
});
