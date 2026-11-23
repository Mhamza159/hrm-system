/**
 * @file attendance.wfh-face-notifications.e2e.test.js
 * @description Comprehensive E2E Integration Test Suite for Phase 40:
 * - Face Punch without enrollment validation & blocking
 * - Face Enrollment HR notification triggering & recipient resolution
 * - WFH 1-day-before advance notice restriction in Asia/Karachi
 * - WFH submission & decision notification lifecycle linking to `/attendance/team?tab=wfh`
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Shift } from '../src/models/shift.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { WFHRequest } from '../src/models/wfh.model.js';
import { Notification } from '../src/models/notification.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Phase 40 E2E — Face Enrollment, HR Notifications & WFH Workflow Fixes', { timeout: 35000 }, () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  let managerEmp;
  let employeeDoc;
  let testShift;

  const createAuthToken = (user, role) => {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: {
          _id: role._id,
          name: role.name,
          permissions: role.permissions
        }
      },
      env.JWT_ACCESS_SECRET || 'test_jwt_secret_key_12345',
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_phase40_wfh_face');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // Clean test database
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Shift.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      WFHRequest.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Seed Roles
    const saRole = await Role.create({
      name: 'Super Admin',
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }],
      isSystem: true
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      permissions: [
        { action: 'manage', subject: 'attendance', scope: 'all' },
        { action: 'manage', subject: 'face', scope: 'all' },
        { action: 'manage', subject: 'wfh', scope: 'all' }
      ],
      isSystem: true
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      permissions: [
        { action: 'read', subject: 'attendance', scope: 'team' },
        { action: 'manage', subject: 'wfh', scope: 'team' }
      ],
      isSystem: true
    });

    const empRole = await Role.create({
      name: 'Employee',
      permissions: [
        { action: 'read', subject: 'attendance', scope: 'own' },
        { action: 'manage', subject: 'wfh', scope: 'own' }
      ],
      isSystem: true
    });

    // 2. Seed Shift
    testShift = await Shift.create({
      name: 'General Day Shift',
      code: 'GDS-PH40',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      halfDayMinutes: 240,
      fullDayMinutes: 480,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });

    // 3. Seed Users & Employees
    superAdminUser = await User.create({
      name: 'Super Admin',
      email: 'admin.phase40@hrm.test',
      passwordHash: 'dummy_hash_superadmin',
      roles: [saRole._id],
      role: 'Super Admin',
      isActive: true
    });
    superAdminToken = createAuthToken(superAdminUser, saRole);

    hrUser = await User.create({
      name: 'HR Partner',
      email: 'hr.phase40@hrm.test',
      passwordHash: 'dummy_hash_hr',
      roles: [hrRole._id],
      role: 'HR Manager',
      isActive: true
    });
    hrToken = createAuthToken(hrUser, hrRole);

    managerUser = await User.create({
      name: 'Engineering Lead',
      email: 'manager.phase40@hrm.test',
      passwordHash: 'dummy_hash_manager',
      roles: [managerRole._id],
      role: 'Department Manager',
      isActive: true
    });
    managerToken = createAuthToken(managerUser, managerRole);

    managerEmp = await Employee.create({
      userId: managerUser._id,
      employeeCode: 'EMP-MGR',
      name: 'Engineering Lead',
      email: 'manager.phase40@hrm.test',
      shiftId: testShift._id,
      joiningDate: new Date('2024-01-01')
    });

    employeeUser = await User.create({
      name: 'Zainab Qasim',
      email: 'zainab.phase40@hrm.test',
      passwordHash: 'dummy_hash_emp',
      roles: [empRole._id],
      role: 'Employee',
      isActive: true,
      faceEnrollment: {
        status: 'none',
        descriptors: []
      }
    });
    employeeToken = createAuthToken(employeeUser, empRole);

    employeeDoc = await Employee.create({
      userId: employeeUser._id,
      employeeCode: 'EMP-040',
      name: 'Zainab Qasim',
      email: 'zainab.phase40@hrm.test',
      managerId: managerEmp._id,
      shiftId: testShift._id,
      joiningDate: new Date('2025-01-01')
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==========================================
  // SECTION 1: FACE PUNCH WITHOUT ENROLLMENT
  // ==========================================
  describe('Requirement 1: Face Punch Without Face Enrollment Validation', () => {
    it('1.1 Rejects face punch when user has status: none with FACE_ENROLLMENT_REQUIRED code', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: new Array(128).fill(0.123)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Face enrollment is required');
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].code).toBe('FACE_ENROLLMENT_REQUIRED');
      expect(res.body.errors[0].status).toBe('none');

      // Verify no attendance document created
      const att = await Attendance.findOne({ employeeId: employeeDoc._id });
      expect(att).toBeNull();
    });

    it('1.2 Logs audit trail entry for blocked face punch due to missing enrollment', async () => {
      const log = await AuditLog.findOne({
        action: 'FACE_PUNCH_BLOCKED_UNENROLLED',
        actorId: employeeUser._id
      });
      expect(log).not.toBeNull();
      expect(log.details.enrollmentStatus).toBe('none');
    });

    it('1.3 Rejects face punch when face enrollment is pending HR review', async () => {
      await User.findByIdAndUpdate(employeeUser._id, {
        'faceEnrollment.status': 'pending',
        'faceEnrollment.descriptors': [new Array(128).fill(0.1)]
      });

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: new Array(128).fill(0.1)
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('pending HR review');
      expect(res.body.errors[0].code).toBe('FACE_ENROLLMENT_REQUIRED');
      expect(res.body.errors[0].status).toBe('pending');
    });

    it('1.4 Rejects face punch when face enrollment was rejected', async () => {
      await User.findByIdAndUpdate(employeeUser._id, {
        'faceEnrollment.status': 'rejected',
        'faceEnrollment.descriptors': []
      });

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'face',
          liveDescriptor: new Array(128).fill(0.1)
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('rejected');
      expect(res.body.errors[0].code).toBe('FACE_ENROLLMENT_REQUIRED');
      expect(res.body.errors[0].status).toBe('rejected');
    });
  });

  // ==========================================
  // SECTION 2: FACE ENROLLMENT HR NOTIFICATIONS
  // ==========================================
  describe('Requirement 2: Face Enrollment HR Notification Trigger & Recipient Resolution', () => {
    it('2.1 Triggers notification to HR Managers & Super Admins on successful enrollment submission', async () => {
      // Clear previous notifications
      await Notification.deleteMany({});

      const sampleDescriptor = new Array(128).fill(0.05);

      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          descriptors: [sampleDescriptor, sampleDescriptor, sampleDescriptor],
          photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');

      // Check notification created in database for HR Manager and Super Admin
      const notifications = await Notification.find({
        type: 'attendance',
        title: 'Face Enrollment Completed'
      });

      expect(notifications.length).toBeGreaterThanOrEqual(2);
      const recipientIds = notifications.map((n) => n.userId.toString());
      expect(recipientIds).toContain(hrUser._id.toString());
      expect(recipientIds).toContain(superAdminUser._id.toString());
      expect(recipientIds).not.toContain(employeeUser._id.toString());

      // Verify content
      const hrNotif = notifications.find((n) => n.userId.toString() === hrUser._id.toString());
      expect(hrNotif.body).toContain('Zainab Qasim');
      expect(hrNotif.body).toContain('EMP-040');
      expect(hrNotif.link).toBe('/attendance/face-enrollments');
    });

    it('2.2 Blocks duplicate biometric collision and does not dispatch notification on collision', async () => {
      // Approve employeeUser's face enrollment to simulate an already registered employee
      await User.findByIdAndUpdate(employeeUser._id, {
        'faceEnrollment.status': 'approved'
      });

      const initialCount = await Notification.countDocuments({ title: 'Face Enrollment Completed' });

      // Create another employee trying to enroll identical vector
      const user2 = await User.create({
        name: 'Imposter User',
        email: 'imposter.phase40@hrm.test',
        passwordHash: 'dummy_hash',
        roles: [employeeUser.roles[0]],
        isActive: true
      });
      const user2Token = createAuthToken(user2, { _id: employeeUser.roles[0], name: 'Employee', permissions: ['attendance.mark'] });

      const res = await request(app)
        .post('/api/v1/attendance/face/enroll')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          descriptors: [new Array(128).fill(0.05), new Array(128).fill(0.05), new Array(128).fill(0.05)], // Exact match to Zainab's
          photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);

      const postCount = await Notification.countDocuments({ title: 'Face Enrollment Completed' });
      expect(postCount).toBe(initialCount); // No new notifications dispatched
    });
  });

  // ==========================================
  // SECTION 3: WFH 1-DAY-BEFORE ADVANCE RESTRICTION
  // ==========================================
  describe('Requirement 3: WFH One-Day-Before Advance Notice Restriction', () => {
    it('3.1 Strictly rejects same-day WFH application (today)', async () => {
      const todayStr = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/attendance/wfh')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          date: todayStr,
          reason: 'Need to work from home today due to urgent repairs'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least one day before the requested date');
      expect(res.body.message).toContain('Same-day applications are not allowed');
      expect(res.body.errors[0].code).toBe('WFH_ADVANCE_NOTICE_REQUIRED');
    });

    it('3.2 Strictly rejects past-date WFH application (yesterday)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/attendance/wfh')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          date: yesterdayStr,
          reason: 'Forgot to apply yesterday for remote work'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least one day before the requested date');
      expect(res.body.errors[0].code).toBe('WFH_ADVANCE_NOTICE_REQUIRED');
    });

    it('3.3 Accepts valid WFH application submitted at least 1 day in advance (tomorrow)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/attendance/wfh')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          date: tomorrowStr,
          reason: 'Quiet sprint deliverables day at home workspace'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
    });

    it('3.4 Accepts WFH application submitted several days in advance (3 days out)', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 3);
      const futureStr = future.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/attendance/wfh')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          date: futureStr,
          reason: 'Advance remote work notice for broadband installation'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // SECTION 4: WFH NOTIFICATION LIFECYCLE
  // ==========================================
  describe('Requirement 4: WFH Notification Dispatch & Tab Routing', () => {
    it('4.1 Dispatches notification to Direct Manager and HR/Admins with direct tab link', async () => {
      const wfhNotifs = await Notification.find({
        type: 'attendance',
        title: 'New WFH Request'
      });

      expect(wfhNotifs.length).toBeGreaterThan(0);
      const recipientIds = wfhNotifs.map((n) => n.userId.toString());
      // Direct manager must be notified
      expect(recipientIds).toContain(managerUser._id.toString());
      // HR Manager and Super Admin must be notified
      expect(recipientIds).toContain(hrUser._id.toString());
      expect(recipientIds).toContain(superAdminUser._id.toString());

      // Link must target the specific WFH tab
      const sample = wfhNotifs[0];
      expect(sample.link).toBe('/attendance/team?tab=wfh');
      expect(sample.body).toContain('Zainab Qasim');
    });

    it('4.2 Dispatches decision notification to applicant when manager approves WFH', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowMidnight = new Date(Date.UTC(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()));

      const wfh = await WFHRequest.findOne({ employeeId: employeeDoc._id, date: tomorrowMidnight });
      expect(wfh).not.toBeNull();

      // Clear applicant notifications
      await Notification.deleteMany({ userId: employeeUser._id });

      const res = await request(app)
        .patch(`/api/v1/attendance/wfh/${wfh._id}/decide`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'approved'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');

      // Verify applicant received decision notification
      const notif = await Notification.findOne({
        userId: employeeUser._id,
        title: 'WFH Request Approved'
      });
      expect(notif).not.toBeNull();
      expect(notif.link).toBe('/attendance/my?tab=wfh');
      expect(notif.body).toContain('approved');
    });
  });
});
