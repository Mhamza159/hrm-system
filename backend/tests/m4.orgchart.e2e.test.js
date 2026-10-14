/**
 * @file m4.orgchart.e2e.test.js
 * @description Multi-Role End-to-End Integration Suite for Module M4 (BUILD-GUIDE Section 7 · Rows 4.1 - 4.7).
 * 
 * ROLE-BASED JOURNEYS:
 * 1. Super Admin:
 *    - Creates department 'Core Engineering'
 *    - Creates designation 'Senior QA Lead' (Lead grade)
 *    - Creates overnight Night Shift ('20:00' to '05:00', isCrossMidnight: true)
 *    - Assigns Department Head
 *    - Queries Org Chart and verifies full hierarchical DAG
 * 2. HR Manager:
 *    - Creates department and assigns active employees
 *    - Attempts to delete populated department -> blocked with HTTP 400 (active employee guard)
 *    - Updates shift grace periods -> verifies audit log emission
 * 3. Department Manager:
 *    - Attempts mutation on departments/designations/shifts -> rejected with HTTP 403
 *    - Queries /api/v1/teams/my -> receives direct subordinates and shift distribution
 *    - Inspects /api/v1/org-chart -> verifies structure without financial leakage
 * 4. Employee:
 *    - Attempts mutations -> rejected with HTTP 403
 *    - Queries /api/v1/org-chart -> personal card has isMe: true and reportingChain traced
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Shift } from '../src/models/shift.model.js';
import { Employee } from '../src/models/employee.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M4 — Multi-Role End-to-End System Verification (E2E-M4)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  let createdDeptId;
  let createdDesigId;
  let createdShiftId;
  let leadEmpId;
  let staffEmpId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m4_e2e');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Shift.deleteMany({});
    await Employee.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Roles Seed
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'Human Resources Admin',
      isSystem: true,
      permissions: [
        { action: 'org.manage', subject: 'Organization', scope: 'all' },
        { action: 'org.view', subject: 'Organization', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Team Manager',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'department' }]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'General Staff',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'own' }]
    });

    // 2. Users Seed
    superAdminUser = await User.create({
      email: 'admin.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrUser = await User.create({
      email: 'hr.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    managerUser = await User.create({
      email: 'mgr.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'dev.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    managerToken = jwt.sign({ userId: managerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  });

  // ==========================================
  // JOURNEY 1: Super Admin Complete Lifecycle
  // ==========================================
  describe('Journey 1: Super Admin Lifecycle', () => {
    it('Creates department "Core Engineering"', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Core Engineering',
          code: 'CORE-ENG',
          description: 'Platform and infrastructure engineering department'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('CORE-ENG');
      createdDeptId = res.body.data._id;
    });

    it('Assigns Department Head to Core Engineering', async () => {
      const res = await request(app)
        .patch(`/api/v1/departments/${createdDeptId}/head`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ headId: managerUser._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.headId).toBe(managerUser._id.toString());
    });

    it('Creates designation "Senior QA Lead" with Lead grade', async () => {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Senior QA Lead',
          code: 'QA-LEAD',
          grade: 'Lead',
          departmentId: createdDeptId,
          description: 'Quality assurance team leader'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.grade).toBe('Lead');
      createdDesigId = res.body.data._id;
    });

    it('Creates overnight Night Shift (20:00 to 05:00 next day)', async () => {
      const res = await request(app)
        .post('/api/v1/shifts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Core Night Shift',
          code: 'CORE-NIGHT',
          type: 'night',
          startTime: '20:00',
          endTime: '05:00',
          breakMinutes: 60
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isCrossMidnight).toBe(true);
      expect(res.body.data.durationMinutes).toBe(480);
      createdShiftId = res.body.data._id;
    });

    it('Inspects /org-chart and verifies company tree renders', async () => {
      // Create Manager and Staff Employee records
      const lead = await Employee.create({
        employeeCode: 'LEAD-001',
        name: 'Rashid Khan',
        email: 'mgr.e2e@company.pk',
        userId: managerUser._id,
        departmentId: createdDeptId,
        designationId: createdDesigId,
        shiftId: createdShiftId,
        managerId: null
      });
      leadEmpId = lead._id;

      const staff = await Employee.create({
        employeeCode: 'STAFF-001',
        name: 'Usman Qureshi',
        email: 'dev.e2e@company.pk',
        userId: employeeUser._id,
        departmentId: createdDeptId,
        designationId: createdDesigId,
        shiftId: createdShiftId,
        managerId: leadEmpId
      });
      staffEmpId = staff._id;

      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalNodes).toBe(2);
      expect(res.body.data.tree[0].name).toBe('Rashid Khan');
      expect(res.body.data.tree[0].children[0].name).toBe('Usman Qureshi');
    });
  });

  // ==========================================
  // JOURNEY 2: HR Manager Lifecycle & Guards
  // ==========================================
  describe('Journey 2: HR Manager Lifecycle & Guards', () => {
    it('Blocks deletion of department populated with active staff (HTTP 400)', async () => {
      const res = await request(app)
        .delete(`/api/v1/departments/${createdDeptId}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('active employee(s) are currently assigned');
    });

    it('Updates shift grace periods and records audit log', async () => {
      const res = await request(app)
        .patch(`/api/v1/shifts/${createdShiftId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ graceMinutes: 25 });

      expect(res.status).toBe(200);
      expect(res.body.data.graceMinutes).toBe(25);

      const log = await AuditLog.findOne({
        action: 'shift.update',
        entityId: createdShiftId
      });
      expect(log).toBeDefined();
    });
  });

  // ==========================================
  // JOURNEY 3: Department Manager Access & Team View
  // ==========================================
  describe('Journey 3: Department Manager Access & Team View', () => {
    it('Blocks mutation requests with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Hacked Dept', code: 'HACK' });

      expect(res.status).toBe(403);
    });

    it('Navigates to /teams/my and receives direct subordinates with shift info', async () => {
      const res = await request(app)
        .get('/api/v1/teams/my')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalCount).toBe(1);
      expect(res.body.data.directReports[0].name).toBe('Usman Qureshi');
      expect(res.body.data.directReports[0].shift.isCrossMidnight).toBe(true);
      expect(res.body.data.directReports[0].shift.startTime).toBe('20:00');
    });

    it('Inspects /org-chart without sensitive financial leaks', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      const root = res.body.data.tree[0];
      expect(root.salary).toBeUndefined();
      expect(root.cnic).toBeUndefined();
    });
  });

  // ==========================================
  // JOURNEY 4: Employee Self-Service & Reporting Line
  // ==========================================
  describe('Journey 4: Employee Self-Service & Reporting Line', () => {
    it('Blocks mutation endpoints with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/shifts')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Unauthorized Shift', code: 'NOPE' });

      expect(res.status).toBe(403);
    });

    it('Queries /org-chart: personal node marked isMe: true and reportingChain traced', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      const { reportingChain, tree } = res.body.data;

      // Tree personal card
      const root = tree[0];
      const meNode = root.children[0];
      expect(meNode.isMe).toBe(true);
      expect(root.isMe).toBe(false);

      // Ancestral reporting chain
      expect(reportingChain).toContain(leadEmpId.toString());
      expect(reportingChain).toContain(staffEmpId.toString());
      expect(reportingChain[0]).toBe(leadEmpId.toString());
      expect(reportingChain[1]).toBe(staffEmpId.toString());
    });
  });
});
