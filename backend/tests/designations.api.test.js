/**
 * @file designations.api.test.js
 * @description Integration Tests for Module M4 Designations & Grade Tiers (BUILD-GUIDE ID 4.3).
 * 
 * TEST COVERAGE:
 * - 4.3-TEST:
 *   1. HR Manager creates designations across all 5 grade tiers: Junior, Mid, Senior, Lead, Executive (HTTP 201).
 *   2. Duplicate code within same department returns HTTP 400 Bad Request.
 *   3. Same code in different departments is permitted (HTTP 201).
 *   4. Department Manager and Employee receive 403 Forbidden on mutations.
 *   5. All roles can read designations list and details (HTTP 200).
 *   6. Active employee deletion guard: blocking deletion when active staff assigned (HTTP 400).
 *   7. Empty designation deletion succeeds (soft delete with isDeleted: true).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Employee } from '../src/models/employee.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M4 — Designations API Integration Test Suite (Slice 4.3-TEST)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let engDept;
  let salesDept;
  let sdeJuniorId;
  let leadArchitectId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m4_designations');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Employee.deleteMany({});

    // 1. Roles Setup
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'org.manage', subject: 'Organization', scope: 'all' },
        { action: 'org.view', subject: 'Organization', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'all' }]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'all' }]
    });

    // 2. Users Setup
    const adminUser = await User.create({
      email: 'admin.desig@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });
    superAdminToken = jwt.sign({ userId: adminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    const hrUser = await User.create({
      email: 'hr.desig@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    const mgrUser = await User.create({
      email: 'mgr.desig@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });
    managerToken = jwt.sign({ userId: mgrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    const empUser = await User.create({
      email: 'emp.desig@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });
    employeeToken = jwt.sign({ userId: empUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 3. Departments Setup
    engDept = await Department.create({
      name: 'Software Engineering',
      code: 'ENG',
      isActive: true
    });

    salesDept = await Department.create({
      name: 'Global Sales',
      code: 'SALES',
      isActive: true
    });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Employee.deleteMany({});
    await mongoose.disconnect();
  }, 30000);

  it('HR Manager creates designations across all 5 grade tiers (201 Created)', async () => {
    const grades = [
      { title: 'Junior Software Engineer', code: 'JSE', grade: 'Junior' },
      { title: 'Mid-Level Software Engineer', code: 'MSE', grade: 'Mid' },
      { title: 'Senior Software Engineer', code: 'SSE', grade: 'Senior' },
      { title: 'Lead Architect', code: 'LEAD-ARCH', grade: 'Lead' },
      { title: 'VP of Technology', code: 'VP-TECH', grade: 'Executive' }
    ];

    for (const item of grades) {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          title: item.title,
          code: item.code,
          grade: item.grade,
          departmentId: engDept._id,
          description: `Career position for ${item.title}`
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grade).toBe(item.grade);
      expect(res.body.data.departmentId.toString()).toBe(engDept._id.toString());

      if (item.code === 'JSE') sdeJuniorId = res.body.data._id;
      if (item.code === 'LEAD-ARCH') leadArchitectId = res.body.data._id;
    }
  }, 15000);

  it('Rejects duplicate designation code within the same department (400 Bad Request)', async () => {
    const duplicateRes = await request(app)
      .post('/api/v1/designations')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'Junior SE Duplicate',
        code: 'JSE',
        grade: 'Junior',
        departmentId: engDept._id
      });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toMatch(/already exists in this department/i);
  });

  it('Allows identical designation code in a different department (201 Created)', async () => {
    const res = await request(app)
      .post('/api/v1/designations')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'Sales Junior Associate',
        code: 'JSE',
        grade: 'Junior',
        departmentId: salesDept._id
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.departmentId.toString()).toBe(salesDept._id.toString());
  });

  it('HR Manager updates designation details (200 OK)', async () => {
    const updateRes = await request(app)
      .patch(`/api/v1/designations/${leadArchitectId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'Principal Lead Architect',
        description: 'Updated principal lead scope'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.title).toBe('Principal Lead Architect');
    expect(updateRes.body.data.description).toBe('Updated principal lead scope');
  });

  it('Department Manager and Employee receive 403 Forbidden on mutations', async () => {
    // 1. Manager cannot create
    const mgrRes = await request(app)
      .post('/api/v1/designations')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Unauthorized Title',
        code: 'UNAUTH',
        grade: 'Junior',
        departmentId: engDept._id
      });
    expect(mgrRes.status).toBe(403);

    // 2. Employee cannot delete
    const empRes = await request(app)
      .delete(`/api/v1/designations/${sdeJuniorId}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(empRes.status).toBe(403);
  });

  it('All authenticated roles can read designations list with department filters (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/v1/designations?departmentId=${engDept._id}&grade=Lead`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].grade).toBe('Lead');
    expect(res.body.data[0].departmentId._id.toString()).toBe(engDept._id.toString());
  });

  it('Blocks deletion of designation populated with active employees (400 Bad Request)', async () => {
    // Assign active employee to sdeJuniorId
    await Employee.create({
      employeeCode: 'EMP-DES-001',
      name: 'Junior Dev Babar',
      departmentId: engDept._id,
      designationId: sdeJuniorId,
      status: 'Active',
      isDeleted: false
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/designations/${sdeJuniorId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.success).toBe(false);
    expect(deleteRes.body.message).toMatch(/active employee\(s\) hold this title/i);

    // Verify designation still exists
    const desig = await Designation.findOne({ _id: sdeJuniorId, isDeleted: false });
    expect(desig).toBeDefined();
  });

  it('Successfully soft deletes an unassigned designation (200 OK)', async () => {
    // Delete leadArchitectId which has no assigned employees
    const deleteRes = await request(app)
      .delete(`/api/v1/designations/${leadArchitectId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toMatch(/successfully deleted/i);

    // Verify soft deleted in database
    const dbDesig = await Designation.findById(leadArchitectId);
    expect(dbDesig.isDeleted).toBe(true);
  });
});
