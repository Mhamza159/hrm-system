/**
 * @file m8.notifications.e2e.test.js
 * @description Comprehensive Multi-Role End-to-End User Journey Tests for Module M8 (Notifications & Announcements).
 * 
 * ROLE JOURNEYS VERIFIED:
 * 1. Super Admin: Logs in, publishes pinned company announcement, verifies notice board.
 * 2. HR Manager: Logs in, triggers multi-recipient alert via notify(), inspects read receipts.
 * 3. Department Manager: Logs in, publishes department notice, blocked from global broadcast (403).
 * 4. Employee: Logs in, views live unread bell badge, marks read, records read receipt, updates preferences.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Announcement } from '../src/models/announcement.model.js';
import { Notification } from '../src/models/notification.model.js';
import { notify } from '../src/services/notify.service.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Slice E2E-M8: Multi-Role Live End-to-End Verification (All 4 Default Roles)', () => {
  let superAdminToken;
  let hrManagerToken;
  let deptManagerToken;
  let employeeToken;

  let superAdminUser;
  let hrManagerUser;
  let deptManagerUser;
  let employeeUser;

  let engDepartment;
  let designDepartment;
  let companyAnnouncementId;
  let deptAnnouncementId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m8_e2e');
    await mongoose.connect(testDbUri);

    // Clean test database
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // Bootstrap roles and base admin
    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptManagerRole = await Role.findOne({ name: 'Department Manager' });
    const employeeRole = await Role.findOne({ name: 'Employee' });

    // Seed Departments
    engDepartment = await Department.create({
      name: 'Software Engineering',
      code: 'SWE',
      description: 'Core product engineering'
    });

    designDepartment = await Department.create({
      name: 'UI/UX Design',
      code: 'DES',
      description: 'Product interface and visual design'
    });

    const passHash = await User.hashPassword('Password123!');

    // 1. Super Admin User
    superAdminUser = await User.create({
      email: 'admin.e2e@company.pk',
      passwordHash: passHash,
      roles: [superAdminRole._id],
      isActive: true
    });

    // 2. HR Manager User
    hrManagerUser = await User.create({
      email: 'hr.e2e@company.pk',
      passwordHash: passHash,
      roles: [hrRole._id],
      isActive: true
    });

    // 3. Department Manager User (Software Engineering)
    deptManagerUser = await User.create({
      email: 'lead.dev@company.pk',
      passwordHash: passHash,
      roles: [deptManagerRole._id],
      isActive: true
    });

    const mgrEmp = await Employee.create({
      employeeCode: 'EMP-LEAD-001',
      userId: deptManagerUser._id,
      name: 'Farhan Zaidi',
      email: deptManagerUser.email,
      departmentId: engDepartment._id
    });
    deptManagerUser.employeeId = mgrEmp._id;
    await deptManagerUser.save();

    // 4. Employee User (Software Engineering)
    employeeUser = await User.create({
      email: 'developer.ali@company.pk',
      passwordHash: passHash,
      roles: [employeeRole._id],
      isActive: true,
      notificationPrefs: {
        attendance: { inApp: true, email: true, whatsapp: false },
        leave: { inApp: true, email: true, whatsapp: false },
        payroll: { inApp: true, email: true, whatsapp: true },
        announcement: { inApp: true, email: true, whatsapp: false }
      }
    });

    const devEmp = await Employee.create({
      employeeCode: 'EMP-DEV-042',
      userId: employeeUser._id,
      name: 'Ali Mansoor',
      email: employeeUser.email,
      departmentId: engDepartment._id
    });
    employeeUser.employeeId = devEmp._id;
    await employeeUser.save();

    // Issue standard JWT access tokens
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    hrManagerToken = jwt.sign({ userId: hrManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    deptManagerToken = jwt.sign({ userId: deptManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }, 35000);

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({})
    ]);
    await mongoose.disconnect();
  });

  describe('Journey 1: Super Admin Flow', () => {
    it('Super Admin publishes pinned company announcement and inspects notice board', async () => {
      // 1. Publish Pinned Company Announcement
      const postRes = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Annual Company Retreat & Holiday Schedule',
          content: 'The executive team is pleased to announce our annual retreat in November. All regional offices will remain closed.',
          targetAudience: 'company',
          priority: 'urgent',
          pinned: true
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.pinned).toBe(true);
      expect(postRes.body.data.pinnedAt).toBeDefined();

      companyAnnouncementId = postRes.body.data._id;

      // 2. Query Dashboard Notice Board (pinnedOnly = true)
      const boardRes = await request(app)
        .get('/api/v1/announcements?pinnedOnly=true')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(boardRes.status).toBe(200);
      expect(boardRes.body.data.length).toBeGreaterThanOrEqual(1);
      const pinnedTitles = boardRes.body.data.map((a) => a.title);
      expect(pinnedTitles).toContain('Annual Company Retreat & Holiday Schedule');
    });
  });

  describe('Journey 2: HR Manager Flow', () => {
    it('HR Manager triggers operational alert via notify() and inspects announcement receipts', async () => {
      // 1. Trigger Multi-Recipient Operational Alert via Centralized notify()
      const targetIds = [employeeUser._id, deptManagerUser._id];
      const notifyRes = await notify(targetIds, {
        type: 'leave',
        title: 'Public Holiday Alert — Iqbal Day',
        body: 'Please note that Monday, November 9th is an observed national holiday.',
        link: '/announcements',
        channels: ['inApp', 'email']
      });

      expect(notifyRes.success).toBe(true);
      expect(notifyRes.count).toBe(2);

      // Verify records in DB
      const notifs = await Notification.find({ type: 'leave', title: 'Public Holiday Alert — Iqbal Day' });
      expect(notifs.length).toBe(2);

      // 2. HR Manager inspects read receipts on the Super Admin announcement
      const receiptsRes = await request(app)
        .get(`/api/v1/announcements/${companyAnnouncementId}/receipts`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(receiptsRes.status).toBe(200);
      expect(receiptsRes.body.success).toBe(true);
      expect(receiptsRes.body.data.totalReads).toBeDefined();
    });
  });

  describe('Journey 3: Department Manager Flow', () => {
    it('Department Manager publishes department notice and is blocked from global broadcast', async () => {
      // 1. Publish Department-Specific Announcement
      const deptRes = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          title: 'Engineering Sprint Deadline & Code Freeze',
          content: 'All pull requests must be merged before Thursday 17:00 PKT for the staging build.',
          targetAudience: 'department',
          departmentId: engDepartment._id.toString(),
          priority: 'high'
        });

      expect(deptRes.status).toBe(201);
      expect(deptRes.body.success).toBe(true);
      expect(deptRes.body.data.targetAudience).toBe('department');
      deptAnnouncementId = deptRes.body.data._id;

      // 2. Department Manager tries to post company-wide -> HTTP 403 Forbidden
      const unauthorizedRes = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          title: 'Company-Wide Policy Change Attempt',
          content: 'Should be rejected by CASL authorization.',
          targetAudience: 'company'
        });

      expect(unauthorizedRes.status).toBe(403);
      expect(unauthorizedRes.body.message).toContain('company-wide');

      // 3. Department Manager tries to post in another department -> HTTP 403 Forbidden
      const foreignDeptRes = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          title: 'Design Team Workflows',
          content: 'Eng lead attempting to publish in Design department.',
          targetAudience: 'department',
          departmentId: designDepartment._id.toString()
        });

      expect(foreignDeptRes.status).toBe(403);
      expect(foreignDeptRes.body.message).toContain('own department');
    });
  });

  describe('Journey 4: Employee Flow', () => {
    it('Employee views in-app notifications, marks read, registers read receipt, and updates preferences', async () => {
      // 1. Employee fetches In-App Notifications (Unread Bell Badge)
      const notifRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.success).toBe(true);
      expect(notifRes.body.data.unreadCount).toBeGreaterThanOrEqual(1);

      const unreadNotif = notifRes.body.data.items.find((n) => !n.isRead);
      expect(unreadNotif).toBeDefined();

      // 2. Employee marks notification as read
      const readNotifRes = await request(app)
        .patch(`/api/v1/notifications/${unreadNotif._id}/read`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(readNotifRes.status).toBe(200);
      expect(readNotifRes.body.data.isRead).toBe(true);
      expect(readNotifRes.body.data.readAt).toBeDefined();

      // 3. Employee opens department announcement and registers read receipt
      const receiptRes = await request(app)
        .patch(`/api/v1/announcements/${deptAnnouncementId}/read`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(receiptRes.status).toBe(200);
      expect(receiptRes.body.data.readCount).toBeGreaterThanOrEqual(1);

      // 4. Employee updates notification preferences
      const updatePrefRes = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          attendance: { inApp: true, email: false, whatsapp: false },
          payroll: { inApp: true, email: true, whatsapp: true }
        });

      expect(updatePrefRes.status).toBe(200);
      expect(updatePrefRes.body.success).toBe(true);
      expect(updatePrefRes.body.data.attendance.email).toBe(false);
      expect(updatePrefRes.body.data.payroll.whatsapp).toBe(true);

      // 5. Employee is blocked from inspecting other users' read receipts (HTTP 403)
      const blockedReceiptsRes = await request(app)
        .get(`/api/v1/announcements/${companyAnnouncementId}/receipts`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(blockedReceiptsRes.status).toBe(403);
    });
  });
});
