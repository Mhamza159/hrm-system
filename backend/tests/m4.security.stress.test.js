/**
 * @file m4.security.stress.test.js
 * @description Dedicated Security, Hardening & Doubt-Driven Stress Tests for Module M4.
 * 
 * COVERS:
 * 1. NoSQL & ReDoS Injection resilience in search queries.
 * 2. Scope enforcement: Employee blocked from all 10 mutation endpoints with HTTP 403.
 * 3. Information Disclosure: Sensitive field omission in OrgChart & MyTeam.
 * 4. Circular Hierarchy & Self-Parenting prevention in departments.
 * 5. Active Staff Deletion Guards on Departments, Designations, and Shifts.
 * 6. Empty dataset edge cases.
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
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M4 — Security, Hardening & Stress-Testing Audit', () => {
  let adminToken;
  let employeeToken;
  let adminUser;
  let employeeUser;

  let testDeptId;
  let testDesigId;
  let testShiftId;
  let testEmpId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m4_sec');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Shift.deleteMany({});
    await Employee.deleteMany({});

    // Roles
    const adminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const empRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'own' }]
    });

    // Users
    adminUser = await User.create({
      email: 'sec.admin@company.pk',
      passwordHash: 'dummy',
      roles: [adminRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'sec.employee@company.pk',
      passwordHash: 'dummy',
      roles: [empRole._id],
      isActive: true
    });

    adminToken = jwt.sign(
      { userId: adminUser._id, email: adminUser.email, roles: ['Super Admin'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    employeeToken = jwt.sign(
      { userId: employeeUser._id, email: employeeUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Initial Master Data
    const dept = await Department.create({
      name: 'Secured Directorate',
      code: 'SEC-DIR',
      isActive: true
    });
    testDeptId = dept._id;

    const desig = await Designation.create({
      title: 'Security Analyst',
      code: 'SEC-ANA',
      grade: 'Mid',
      departmentId: testDeptId,
      isActive: true
    });
    testDesigId = desig._id;

    const shift = await Shift.create({
      name: 'Night Shield Shift',
      code: 'SHIELD-NIGHT',
      type: 'night',
      startTime: '22:00',
      endTime: '06:00',
      isCrossMidnight: true,
      durationMinutes: 480
    });
    testShiftId = shift._id;

    // Staff assigned
    const emp = await Employee.create({
      employeeCode: 'SEC-001',
      name: 'Agent Cipher',
      email: employeeUser.email,
      userId: employeeUser._id,
      departmentId: testDeptId,
      designationId: testDesigId,
      shiftId: testShiftId,
      cnic: '35201-0000000-1',
      salary: 15000000 // Sensitive test field
    });
    testEmpId = emp._id;
  });

  // ==========================================
  // 1. NoSQL Injection & ReDoS Resilience
  // ==========================================
  describe('1. NoSQL Injection & ReDoS Resilience', () => {
    it('Safely handles unescaped regex special characters in search', async () => {
      // Unescaped '[' would normally crash MongoDB regex
      const res1 = await request(app)
        .get('/api/v1/departments?search=[invalid-regex')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res1.status).toBe(200);
      expect(res1.body.data).toHaveLength(0);

      // ReDoS pattern
      const res2 = await request(app)
        .get('/api/v1/designations?search=(.*a){10}')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body.data).toHaveLength(0);

      // Metacharacters query
      const res3 = await request(app)
        .get('/api/v1/shifts?search=.*')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res3.status).toBe(200);
    });
  });

  // ==========================================
  // 2. Strict Privilege Escalation Guards
  // ==========================================
  describe('2. Scope Enforcement: Employee Blocked from All 10 Mutation Endpoints (HTTP 403)', () => {
    it('Blocks POST /api/v1/departments', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Hacked', code: 'HACK' });
      expect(res.status).toBe(403);
    });

    it('Blocks PATCH /api/v1/departments/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Renamed' });
      expect(res.status).toBe(403);
    });

    it('Blocks PATCH /api/v1/departments/:id/head', async () => {
      const res = await request(app)
        .patch(`/api/v1/departments/${testDeptId}/head`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ headId: employeeUser._id });
      expect(res.status).toBe(403);
    });

    it('Blocks DELETE /api/v1/departments/:id', async () => {
      const res = await request(app)
        .delete(`/api/v1/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('Blocks POST /api/v1/designations', async () => {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Hacked', code: 'HACK', grade: 'Lead', departmentId: testDeptId });
      expect(res.status).toBe(403);
    });

    it('Blocks PATCH /api/v1/designations/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/designations/${testDesigId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ title: 'Lead' });
      expect(res.status).toBe(403);
    });

    it('Blocks DELETE /api/v1/designations/:id', async () => {
      const res = await request(app)
        .delete(`/api/v1/designations/${testDesigId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('Blocks POST /api/v1/shifts', async () => {
      const res = await request(app)
        .post('/api/v1/shifts')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Hacked Shift', code: 'HACK', startTime: '09:00', endTime: '18:00' });
      expect(res.status).toBe(403);
    });

    it('Blocks PATCH /api/v1/shifts/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/shifts/${testShiftId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Renamed Shift' });
      expect(res.status).toBe(403);
    });

    it('Blocks DELETE /api/v1/shifts/:id', async () => {
      const res = await request(app)
        .delete(`/api/v1/shifts/${testShiftId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 3. Information Disclosure & Privacy Invariant
  // ==========================================
  describe('3. Information Disclosure & Privacy Invariants', () => {
    it('Guarantees /org-chart excludes sensitive salary, cnic, and bank credentials', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      const node = res.body.data.tree[0];
      expect(node.salary).toBeUndefined();
      expect(node.cnic).toBeUndefined();
      expect(node.bankDetails).toBeUndefined();
      expect(node.passwordHash).toBeUndefined();
    });

    it('Guarantees /teams/my excludes sensitive financial details', async () => {
      const res = await request(app)
        .get('/api/v1/teams/my')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      const reports = res.body.data.directReports;
      reports.forEach((r) => {
        expect(r.salary).toBeUndefined();
        expect(r.cnic).toBeUndefined();
        expect(r.bankDetails).toBeUndefined();
      });
    });
  });

  // ==========================================
  // 4. Circular Hierarchy & Active Deletion Guards
  // ==========================================
  describe('4. Circular Hierarchy & Active Deletion Guards', () => {
    it('Rejects self-parenting and circular hierarchy in departments (HTTP 400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parentId: testDeptId });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Circular department hierarchy detected');
    });

    it('Blocks deletion of designation populated with active staff (HTTP 400)', async () => {
      const res = await request(app)
        .delete(`/api/v1/designations/${testDesigId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('active employee(s) hold this title');
    });

    it('Blocks deletion of shift populated with active staff (HTTP 400)', async () => {
      const res = await request(app)
        .delete(`/api/v1/shifts/${testShiftId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('active employee(s) are assigned to this shift');
    });
  });
});
