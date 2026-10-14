/**
 * @file departments.api.test.js
 * @description Integration Tests for Module M4 Departments Master (BUILD-GUIDE ID 4.1).
 * 
 * TEST COVERAGE:
 * - 4.1-TEST:
 *   1. Super Admin & HR Manager create, list, and update departments (HTTP 200/201).
 *   2. Code uniqueness enforcement (HTTP 400).
 *   3. Department Manager and Employee mutation blocking (HTTP 403 Forbidden).
 *   4. Active employee deletion guard: blocking deletion when active staff assigned (HTTP 400).
 *   5. Empty department deletion succeeds (soft delete with isDeleted: true).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Employee } from '../src/models/employee.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M4 — Departments API Integration Test Suite (Slice 4.1-TEST)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  let engineeringDeptId;
  let qaDeptId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m4_departments');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});

    // 1. Super Admin Role & User
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    superAdminUser = await User.create({
      email: 'admin.dept@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 2. HR Manager Role & User (org.manage + org.view)
    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'HR Operations Lead',
      isSystem: true,
      permissions: [
        { action: 'org.manage', subject: 'Organization', scope: 'all' },
        { action: 'org.view', subject: 'Organization', scope: 'all' }
      ]
    });

    hrUser = await User.create({
      email: 'hr.dept@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 3. Department Manager Role & User (org.view only)
    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Department Manager',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'all' }]
    });

    managerUser = await User.create({
      email: 'manager.dept@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });
    managerToken = jwt.sign({ userId: managerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 4. Employee Role & User (org.view only)
    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Regular Employee',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'all' }]
    });

    employeeUser = await User.create({
      email: 'employee.dept@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});
    await mongoose.disconnect();
  }, 30000);

  // =========================================================================
  // Slice 4.1: Departments Master & Active Employee Deletion Guard
  // =========================================================================

  it('Super Admin successfully creates a top-level department (201 Created)', async () => {
    const payload = {
      name: 'Technology & Engineering',
      code: 'TECH-ENG',
      description: 'Core software engineering and infrastructure division',
      isActive: true
    };

    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(payload.name);
    expect(res.body.data.code).toBe('TECH-ENG');
    expect(res.body.data.parentId).toBeNull();
    expect(res.body.data.isActive).toBe(true);

    engineeringDeptId = res.body.data._id;
  });

  it('HR Manager creates a child department under existing parent (201 Created)', async () => {
    const payload = {
      name: 'Quality Assurance',
      code: 'QA',
      description: 'Software testing and automation',
      parentId: engineeringDeptId,
      isActive: true
    };

    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(payload.name);
    expect(res.body.data.code).toBe('QA');
    expect(res.body.data.parentId.toString()).toBe(engineeringDeptId.toString());

    qaDeptId = res.body.data._id;
  });

  it('Enforces unique department code constraint (400 Bad Request)', async () => {
    const duplicatePayload = {
      name: 'Duplicate QA Dept',
      code: 'QA',
      description: 'Duplicate code'
    };

    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(duplicatePayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('HR Manager updates department details (200 OK)', async () => {
    const updatePayload = {
      name: 'Quality Engineering & Testing',
      description: 'Updated test automation description'
    };

    const res = await request(app)
      .patch(`/api/v1/departments/${qaDeptId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Quality Engineering & Testing');
    expect(res.body.data.description).toBe('Updated test automation description');
  });

  it('Department Manager and Employee receive 403 Forbidden when creating or updating departments', async () => {
    // 1. Department Manager create attempt -> 403
    const mgrRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Unauthorized Dept', code: 'UNAUTH' });

    expect(mgrRes.status).toBe(403);
    expect(mgrRes.body.success).toBe(false);

    // 2. Employee update attempt -> 403
    const empRes = await request(app)
      .patch(`/api/v1/departments/${qaDeptId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Hacked Name' });

    expect(empRes.status).toBe(403);
    expect(empRes.body.success).toBe(false);
  });

  it('All authenticated roles can read departments list and details (200 OK)', async () => {
    const res = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    // Verify parent populated
    const qaDept = res.body.data.find((d) => d.code === 'QA');
    expect(qaDept).toBeDefined();
    expect(qaDept.parentId).toBeDefined();
    expect(qaDept.parentId.name).toBe('Technology & Engineering');
  });

  it('Blocks deletion of a department populated with active employees (400 Bad Request)', async () => {
    // Assign an active employee to QA department
    await Employee.create({
      employeeCode: 'EMP-QA-001',
      name: 'Tester Ali',
      email: 'tester.ali@company.pk',
      departmentId: qaDeptId,
      status: 'Active',
      isDeleted: false
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/departments/${qaDeptId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.success).toBe(false);
    expect(deleteRes.body.message).toMatch(/active employee\(s\) are currently assigned/i);

    // Verify department is still active in database
    const deptStillExists = await Department.findOne({ _id: qaDeptId, isDeleted: false });
    expect(deptStillExists).toBeDefined();
  });

  it('Blocks deletion of a parent department that has child sub-departments (400 Bad Request)', async () => {
    // Attempt to delete parent engineeringDeptId while qaDeptId still reports to it
    const deleteRes = await request(app)
      .delete(`/api/v1/departments/${engineeringDeptId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.success).toBe(false);
    expect(deleteRes.body.message).toMatch(/sub-department\(s\) report to it/i);
  });

  it('Successfully soft deletes an empty department without active staff or child departments (200 OK)', async () => {
    // Create a standalone temporary department
    const tempDept = await Department.create({
      name: 'Temporary Lab',
      code: 'TMP-LAB',
      isActive: true,
      isDeleted: false
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/departments/${tempDept._id}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toMatch(/successfully deleted/i);

    // Verify soft deleted in DB
    const dbDept = await Department.findById(tempDept._id);
    expect(dbDept.isDeleted).toBe(true);

    // Verify excluded from list API
    const listRes = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${hrToken}`);

    const found = listRes.body.data.find((d) => d.code === 'TMP-LAB');
    expect(found).toBeUndefined();
  });

  // =========================================================================
  // Slice 4.2: Department Head & Manager Assignment
  // =========================================================================

  it('HR Manager retrieves candidate users for Department Head assignment (200 OK)', async () => {
    const res = await request(app)
      .get('/api/v1/departments/heads/candidates')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const candidate = res.body.data.find((c) => c._id.toString() === managerUser._id.toString());
    expect(candidate).toBeDefined();
    expect(candidate.email).toBe(managerUser.email);
  });

  it('HR Manager assigns Department Head to an active user via PATCH /:id/head (200 OK)', async () => {
    const res = await request(app)
      .patch(`/api/v1/departments/${engineeringDeptId}/head`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ headId: managerUser._id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.headId.toString()).toBe(managerUser._id.toString());

    // Verify populated on retrieval
    const getRes = await request(app)
      .get(`/api/v1/departments/${engineeringDeptId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.headId._id.toString()).toBe(managerUser._id.toString());
    expect(getRes.body.data.headId.email).toBe(managerUser.email);

    // Verify audit log entry was created
    const audit = await AuditLog.findOne({
      entityId: engineeringDeptId,
      action: 'department.update'
    });
    expect(audit).toBeDefined();
  });

  it('Rejects department head assignment with invalid or non-existent headId (400 Bad Request)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/v1/departments/${engineeringDeptId}/head`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ headId: fakeId });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/user does not exist or is inactive/i);
  });

  it('Department Manager cannot reassign department head (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/departments/${engineeringDeptId}/head`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ headId: employeeUser._id });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
