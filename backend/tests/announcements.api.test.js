/**
 * @file announcements.api.test.js
 * @description Integration Tests for Announcements API, Scoping, Pinning & Read Receipts (Slices 8.6, 8.7, 8.8).
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
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M8 — Announcements API & Scoping Suite (Slices 8.6, 8.7, 8.8)', () => {
  let adminToken;
  let hrToken;
  let deptManagerToken;
  let employeeToken;

  let deptEngineering;
  let deptMarketing;
  let hrUser;
  let deptManagerUser;
  let employeeUser;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m8_announcements');
    await mongoose.connect(testDbUri);

    // Clean test collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Announcement.deleteMany({})
    ]);

    // Bootstrap system roles
    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptManagerRole = await Role.findOne({ name: 'Department Manager' });
    const employeeRole = await Role.findOne({ name: 'Employee' });

    // Create Departments
    deptEngineering = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      description: 'Software development and DevOps'
    });

    deptMarketing = await Department.create({
      name: 'Marketing',
      code: 'MKT',
      description: 'Digital brand awareness and growth'
    });

    const passHash = await User.hashPassword('Password123!');

    // 1. Super Admin
    const adminUser = await User.create({
      email: 'admin.announcements@company.pk',
      passwordHash: passHash,
      roles: [superAdminRole._id],
      isActive: true
    });

    // 2. HR Manager
    hrUser = await User.create({
      email: 'hr.announcements@company.pk',
      passwordHash: passHash,
      roles: [hrRole._id],
      isActive: true
    });

    // 3. Department Manager (Engineering)
    deptManagerUser = await User.create({
      email: 'manager.announcements@company.pk',
      passwordHash: passHash,
      roles: [deptManagerRole._id],
      isActive: true
    });

    const managerEmp = await Employee.create({
      employeeCode: 'EMP-MGR-001',
      userId: deptManagerUser._id,
      name: 'Eng Manager',
      email: deptManagerUser.email,
      departmentId: deptEngineering._id
    });
    deptManagerUser.employeeId = managerEmp._id;
    await deptManagerUser.save();

    // 4. Employee (Engineering)
    employeeUser = await User.create({
      email: 'employee.announcements@company.pk',
      passwordHash: passHash,
      roles: [employeeRole._id],
      isActive: true
    });

    const empRecord = await Employee.create({
      employeeCode: 'EMP-DEV-002',
      userId: employeeUser._id,
      name: 'Eng Employee',
      email: employeeUser.email,
      departmentId: deptEngineering._id
    });
    employeeUser.employeeId = empRecord._id;
    await employeeUser.save();

    // Generate JWTs
    adminToken = jwt.sign({ userId: adminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    deptManagerToken = jwt.sign({ userId: deptManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }, 35000);

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Announcement.deleteMany({})
    ]);
    await mongoose.disconnect();
  });

  describe('Slice 8.6: Creation & Target Audience Data Scoping', () => {
    it('8.6.1: Super Admin / HR Manager can create company-wide announcement', async () => {
      const res = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          title: 'Company Annual Retreat 2026',
          content: 'The entire company will head to Murree for our annual retreat next month.',
          targetAudience: 'company',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetAudience).toBe('company');
      expect(res.body.data.title).toBe('Company Annual Retreat 2026');
    });

    it('8.6.2: Department Manager can create announcement strictly for own department', async () => {
      const res = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          title: 'Engineering Q4 Tech Stack Roadmap',
          content: 'We are standardizing on Node.js 22 LTS across all core backend services.',
          targetAudience: 'department',
          departmentId: deptEngineering._id.toString(),
          priority: 'normal'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.departmentId._id).toBe(deptEngineering._id.toString());
    });

    it('8.6.3: Department Manager attempt to broadcast company-wide returns HTTP 403', async () => {
      const res = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          title: 'Unauthorized Global Policy Change',
          content: 'This should be blocked because Dept Manager only has department scope.',
          targetAudience: 'company',
          priority: 'urgent'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('company-wide');
    });

    it('8.6.4: Department Manager attempt to post to another department returns HTTP 403', async () => {
      const res = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          title: 'Marketing Budget Guidance',
          content: 'Engineering manager trying to post in marketing department.',
          targetAudience: 'department',
          departmentId: deptMarketing._id.toString()
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('own department');
    });

    it('8.6.5: Employee receives only company announcements and own department announcements', async () => {
      // Create a Marketing announcement by HR
      await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          title: 'Marketing Campaign Launch',
          content: 'Confidential to marketing staff only.',
          targetAudience: 'department',
          departmentId: deptMarketing._id.toString()
        });

      const res = await request(app)
        .get('/api/v1/announcements')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const titles = res.body.data.map((a) => a.title);
      expect(titles).toContain('Company Annual Retreat 2026');
      expect(titles).toContain('Engineering Q4 Tech Stack Roadmap');
      expect(titles).not.toContain('Marketing Campaign Launch');
    });
  });

  describe('Slice 8.7: Pinned Notice Board & Max 3 Constraint', () => {
    let announcementIdToPin;

    beforeAll(async () => {
      const a = await Announcement.create({
        title: 'Security Protocol Mandatory Update',
        content: 'Rotate your passwords and enable 2FA before end of week.',
        targetAudience: 'company',
        priority: 'urgent',
        authorId: hrUser._id
      });
      announcementIdToPin = a._id.toString();
    });

    it('8.7.1: HR Manager pins an announcement (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/announcements/${announcementIdToPin}/pin`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ pinned: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pinned).toBe(true);
      expect(res.body.data.pinnedAt).toBeDefined();
    });

    it('8.7.2: Pinning a 4th announcement automatically unpins the oldest pinned announcement', async () => {
      // Ensure announcementIdToPin is the oldest pinned notice
      await Announcement.findByIdAndUpdate(announcementIdToPin, {
        pinnedAt: new Date(Date.now() - 10000)
      });

      // Pin 2 more announcements so we have 3 pinned
      const a2 = await Announcement.create({
        title: 'Pinned Notice 2',
        content: 'Notice 2 body text.',
        targetAudience: 'company',
        pinned: true,
        pinnedAt: new Date(Date.now() - 3000),
        authorId: hrUser._id
      });

      const a3 = await Announcement.create({
        title: 'Pinned Notice 3',
        content: 'Notice 3 body text.',
        targetAudience: 'company',
        pinned: true,
        pinnedAt: new Date(Date.now() - 2000),
        authorId: hrUser._id
      });

      // Confirm we have 3 pinned
      const countBefore = await Announcement.countDocuments({ pinned: true, isDeleted: false });
      expect(countBefore).toBe(3);

      // Now pin a 4th announcement via API
      const a4 = await Announcement.create({
        title: 'Pinned Notice 4 (Newest)',
        content: 'Notice 4 body text.',
        targetAudience: 'company',
        pinned: false,
        authorId: hrUser._id
      });

      const res = await request(app)
        .patch(`/api/v1/announcements/${a4._id}/pin`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ pinned: true });

      expect(res.status).toBe(200);
      expect(res.body.data.pinned).toBe(true);

      // Verify total pinned count remains exactly 3
      const countAfter = await Announcement.countDocuments({ pinned: true, isDeleted: false });
      expect(countAfter).toBe(3);

      // Verify the oldest pinned (announcementIdToPin) was unpinned
      const oldest = await Announcement.findById(announcementIdToPin);
      expect(oldest.pinned).toBe(false);
    });

    it('8.7.3: Employee receives HTTP 403 when trying to pin an announcement', async () => {
      const res = await request(app)
        .patch(`/api/v1/announcements/${announcementIdToPin}/pin`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ pinned: true });

      expect(res.status).toBe(403);
    });
  });

  describe('Slice 8.8: Live Read Receipts Tracking', () => {
    let testAnnouncement;

    beforeAll(async () => {
      testAnnouncement = await Announcement.create({
        title: 'Health & Wellness Benefit Enrollment',
        content: 'Submit your health insurance forms by Friday.',
        targetAudience: 'company',
        authorId: hrUser._id,
        readBy: []
      });
    });

    it('8.8.1: Employee viewing announcement records read receipt (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/announcements/${testAnnouncement._id}/read`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readCount).toBe(1);
      expect(res.body.data.alreadyRead).toBe(false);

      // Second view does not duplicate receipt
      const resRepeat = await request(app)
        .patch(`/api/v1/announcements/${testAnnouncement._id}/read`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(resRepeat.status).toBe(200);
      expect(resRepeat.body.data.alreadyRead).toBe(true);
      expect(resRepeat.body.data.readCount).toBe(1);
    });

    it('8.8.2: HR Manager inspects read receipts breakdown (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/announcements/${testAnnouncement._id}/receipts`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalReads).toBe(1);
      expect(res.body.data.readers[0].userId._id.toString()).toBe(employeeUser._id.toString());
    });

    it('8.8.3: Employee receives HTTP 403 when attempting to view read receipts of another author', async () => {
      const res = await request(app)
        .get(`/api/v1/announcements/${testAnnouncement._id}/receipts`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });
});
