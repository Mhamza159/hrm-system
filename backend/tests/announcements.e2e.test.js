/**
 * @file announcements.e2e.test.js
 * @description Integration tests for Phase 22: Announcements Module Architecture, Pinning, Archival & Read Analytics.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Announcement } from '../src/models/announcement.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Phase 22 — Announcements Module Integration Tests', () => {
  let hrToken;
  let deptMgrToken;
  let employeeToken;
  let otherEmpToken;

  let hrUser;
  let deptMgrUser;
  let empUser;
  let otherEmpUser;

  let deptA;
  let deptB;
  let createdAnnouncementId;
  let deptAnnouncementId;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m8_announcements_p22');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Announcement.deleteMany({});

    deptA = await Department.create({
      name: 'Engineering & Technology',
      code: 'ENG'
    });

    deptB = await Department.create({
      name: 'People & Culture',
      code: 'HRD'
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'announcement.view', subject: 'Announcement', scope: 'all' },
        { action: 'announcement.create', subject: 'Announcement', scope: 'all' },
        { action: 'announcement.edit', subject: 'Announcement', scope: 'all' },
        { action: 'announcement.delete', subject: 'Announcement', scope: 'all' },
        { action: 'announcement.pin', subject: 'Announcement', scope: 'all' }
      ]
    });

    const deptMgrRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'announcement.view', subject: 'Announcement', scope: 'department' },
        { action: 'announcement.create', subject: 'Announcement', scope: 'department' },
        { action: 'announcement.edit', subject: 'Announcement', scope: 'department' },
        { action: 'announcement.delete', subject: 'Announcement', scope: 'department' },
        { action: 'announcement.pin', subject: 'Announcement', scope: 'department' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'announcement.view', subject: 'Announcement', scope: 'own' }
      ]
    });

    hrUser = await User.create({
      name: 'HR Director',
      email: 'hr.director@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id]
    });

    deptMgrUser = await User.create({
      name: 'Engineering Lead',
      email: 'eng.lead@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [deptMgrRole._id]
    });

    empUser = await User.create({
      name: 'Software Engineer',
      email: 'dev.emp@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id]
    });

    otherEmpUser = await User.create({
      name: 'HR Associate',
      email: 'hr.assoc@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id]
    });

    // Create Employee Profiles
    await Employee.create({
      userId: deptMgrUser._id,
      name: 'Engineering Lead',
      employeeCode: 'EMP-ENG-001',
      email: deptMgrUser.email,
      departmentId: deptA._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    await Employee.create({
      userId: empUser._id,
      name: 'Software Engineer',
      employeeCode: 'EMP-ENG-002',
      email: empUser.email,
      departmentId: deptA._id,
      status: 'Active',
      joiningDate: new Date('2023-06-01')
    });

    await Employee.create({
      userId: otherEmpUser._id,
      name: 'HR Associate',
      employeeCode: 'EMP-HRD-001',
      email: otherEmpUser.email,
      departmentId: deptB._id,
      status: 'Active',
      joiningDate: new Date('2023-09-01')
    });

    hrToken = jwt.sign(
      { userId: hrUser._id, email: hrUser.email, roles: ['HR Manager'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    deptMgrToken = jwt.sign(
      { userId: deptMgrUser._id, email: deptMgrUser.email, roles: ['Department Manager'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: empUser._id, email: empUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    otherEmpToken = jwt.sign(
      { userId: otherEmpUser._id, email: otherEmpUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  }, 60000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. POST /api/v1/announcements creates a company-wide announcement with priority and attachments', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'Annual Enterprise Strategy All-Hands 2026',
        content: 'We are pleased to invite all workforce team members to the annual strategy alignment summit.',
        targetAudience: 'company',
        priority: 'high',
        pinned: false,
        attachments: [
          {
            name: 'Agenda & Logistics.pdf',
            url: 'https://company.storage/agenda.pdf',
            fileType: 'pdf'
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Annual Enterprise Strategy All-Hands 2026');
    expect(res.body.data.targetAudience).toBe('company');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.attachments).toHaveLength(1);

    createdAnnouncementId = res.body.data._id;
  });

  it('2. GET /api/v1/announcements allows Employee to view active company announcements with hasRead: false', async () => {
    const res = await request(app)
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const found = res.body.data.find((a) => a._id === createdAnnouncementId);
    expect(found).toBeDefined();
    expect(found.hasRead).toBe(false);
  });

  it('3. PATCH /api/v1/announcements/:id/read records read receipt and marks hasRead: true', async () => {
    const res = await request(app)
      .patch(`/api/v1/announcements/${createdAnnouncementId}/read`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.readCount).toBeGreaterThanOrEqual(2); // Author + Employee

    // Check listing again
    const listRes = await request(app)
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${employeeToken}`);

    const found = listRes.body.data.find((a) => a._id === createdAnnouncementId);
    expect(found.hasRead).toBe(true);
  });

  it('4. PATCH /api/v1/announcements/:id/pin toggles pin status', async () => {
    const res = await request(app)
      .patch(`/api/v1/announcements/${createdAnnouncementId}/pin`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ pinned: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pinned).toBe(true);
    expect(res.body.data.pinnedAt).toBeDefined();
  });

  it('5. PUT /api/v1/announcements/:id updates title and preserves read records', async () => {
    const res = await request(app)
      .put(`/api/v1/announcements/${createdAnnouncementId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'Annual Enterprise Strategy All-Hands 2026 (Updated Location)'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toContain('(Updated Location)');

    // Verify employee read record still intact
    const verifyDoc = await Announcement.findById(createdAnnouncementId).lean();
    const hasEmpRead = verifyDoc.readBy.some((r) => r.userId.toString() === empUser._id.toString());
    expect(hasEmpRead).toBe(true);
  });

  it('6. Department Manager creates department announcement and is blocked from company-wide (403)', async () => {
    // Attempt company-wide broadcast without 'all' scope -> 403
    const blockedRes = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${deptMgrToken}`)
      .send({
        title: 'Unauthorized Global Directive',
        content: 'This should fail authorization.',
        targetAudience: 'company'
      });

    expect(blockedRes.status).toBe(403);

    // Create department-scoped announcement for Dept A (Engineering)
    const deptRes = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${deptMgrToken}`)
      .send({
        title: 'Q4 Engineering Sprint Retrospective',
        content: 'Sprint review will take place this Thursday at 3 PM in Room B.',
        targetAudience: 'department',
        departmentId: deptA._id,
        departmentIds: [deptA._id],
        priority: 'normal'
      });

    expect(deptRes.status).toBe(201);
    expect(deptRes.body.data.targetAudience).toBe('department');
    deptAnnouncementId = deptRes.body.data._id;
  });

  it('7. Department Scoping: Dept A employee sees dept notice; Dept B employee does NOT', async () => {
    // Dept A Employee
    const deptARes = await request(app)
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${employeeToken}`);

    const hasInDeptA = deptARes.body.data.some((a) => a._id === deptAnnouncementId);
    expect(hasInDeptA).toBe(true);

    // Dept B Employee
    const deptBRes = await request(app)
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${otherEmpToken}`);

    const hasInDeptB = deptBRes.body.data.some((a) => a._id === deptAnnouncementId);
    expect(hasInDeptB).toBe(false);
  });

  it('8. PATCH /api/v1/announcements/:id/archive moves notice to archive and hides from active feed', async () => {
    const res = await request(app)
      .patch(`/api/v1/announcements/${createdAnnouncementId}/archive`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isArchived).toBe(true);
    expect(res.body.data.archivedAt).toBeDefined();

    // Verify it is NOT in active feed (default isArchived: false)
    const activeRes = await request(app)
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${hrToken}`);

    const inActive = activeRes.body.data.some((a) => a._id === createdAnnouncementId);
    expect(inActive).toBe(false);
  });

  it('9. GET /api/v1/announcements?isArchived=true returns archived notice and restore reactivates it', async () => {
    const archiveRes = await request(app)
      .get('/api/v1/announcements?isArchived=true')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(archiveRes.status).toBe(200);
    const inArchive = archiveRes.body.data.some((a) => a._id === createdAnnouncementId);
    expect(inArchive).toBe(true);

    // Restore back to active
    const restoreRes = await request(app)
      .patch(`/api/v1/announcements/${createdAnnouncementId}/restore`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isArchived).toBe(false);
  });

  it('10. GET /api/v1/announcements/:id/receipts returns totalTargeted, seenCount, and department breakdown', async () => {
    const res = await request(app)
      .get(`/api/v1/announcements/${createdAnnouncementId}/receipts`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalTargeted).toBeGreaterThanOrEqual(1);
    expect(res.body.data.seenCount).toBeGreaterThanOrEqual(2); // Author (HR) + Employee
    expect(res.body.data.compliancePercentage).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.readers)).toBe(true);
    expect(Array.isArray(res.body.data.departmentBreakdown)).toBe(true);

    const empReader = res.body.data.readers.find((r) => r.userId === empUser._id.toString());
    expect(empReader).toBeDefined();
    expect(empReader.name).toBe('Software Engineer');
  });
});
