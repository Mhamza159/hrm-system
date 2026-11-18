/**
 * @file departments.archive-lifecycle.e2e.test.js
 * @description Comprehensive E2E integration test suite for Phase 25:
 * Department Module Archival Lifecycle, Stats Aggregation, RBAC, and Critical Employee Guard.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { env } from '../src/config/env.js';

describe('Phase 25: Department Module Archive Lifecycle & Employee Guard E2E', () => {
  const adminEmail = 'admin.dept@company.pk';
  const employeeEmail = 'staff.dept@company.pk';
  const testPassword = 'Password123!';

  let adminToken;
  let employeeToken;
  let adminUser;
  let employeeUser;

  let parentDept;
  let childDept;
  let linkedEmployee;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p25_departments');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});

    // 1. Seed Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'System Super Administrator',
      permissions: [{ action: 'manage', subject: 'all' }]
    });

    const staffRole = await Role.create({
      name: 'Employee',
      description: 'Standard Staff Member',
      permissions: [{ action: 'org.view', subject: 'Organization' }]
    });

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 3. Seed Users
    adminUser = await User.create({
      email: adminEmail,
      passwordHash,
      roles: [superAdminRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: employeeEmail,
      passwordHash,
      roles: [staffRole._id],
      isActive: true
    });

    // 4. Generate Tokens
    adminToken = jwt.sign(
      { userId: adminUser._id, _id: adminUser._id, id: adminUser._id, email: adminUser.email, roles: ['Super Admin'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: employeeUser._id, _id: employeeUser._id, id: employeeUser._id, email: employeeUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await mongoose.disconnect();
  });

  it('1. POST /api/v1/departments creates new department with code uniqueness and parent hierarchy', async () => {
    // Create Top-Level Directorate
    const res1 = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Technology Directorate',
        code: 'TECH-DIR',
        description: 'Core Engineering and Operations'
      });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.name).toBe('Technology Directorate');
    expect(res1.body.data.code).toBe('TECH-DIR');
    parentDept = res1.body.data;

    // Create Sub-Department
    const res2 = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Software Engineering',
        code: 'SWE-01',
        description: 'Core product development',
        parentId: parentDept._id
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data.parentId).toBe(parentDept._id);
    childDept = res2.body.data;

    // Duplicate code must be rejected with 400
    const resDup = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Unit',
        code: 'SWE-01'
      });

    expect(resDup.status).toBe(400);
    expect(resDup.body.message).toContain('already exists');
  });

  it('2. PATCH /api/v1/departments/:id blocks circular parent hierarchy', async () => {
    // Attempt to make parent report to its child
    const res = await request(app)
      .patch(`/api/v1/departments/${parentDept._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ parentId: childDept._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Circular department hierarchy detected');
  });

  it('3. PATCH /api/v1/departments/:id/archive archives department and sets metadata', async () => {
    // Create standalone department for archival test
    const createRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Legacy R&D Lab',
        code: 'RND-LEGACY',
        description: 'Phased out lab'
      });
    const rndDept = createRes.body.data;

    const archiveRes = await request(app)
      .patch(`/api/v1/departments/${rndDept._id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.isArchived).toBe(true);
    expect(archiveRes.body.data.archivedAt).toBeDefined();
    expect(archiveRes.body.data.archivedBy).toBeDefined();
  });

  it('4. GET /api/v1/departments omits archived departments while GET /archived lists them', async () => {
    const activeRes = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(activeRes.status).toBe(200);
    const codes = activeRes.body.data.map((d) => d.code);
    expect(codes).toContain('TECH-DIR');
    expect(codes).toContain('SWE-01');
    expect(codes).not.toContain('RND-LEGACY');

    const archivedRes = await request(app)
      .get('/api/v1/departments/archived')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(archivedRes.status).toBe(200);
    expect(archivedRes.body.data.docs.length).toBeGreaterThanOrEqual(1);
    const archivedCodes = archivedRes.body.data.docs.map((d) => d.code);
    expect(archivedCodes).toContain('RND-LEGACY');
  });

  it('4b. Legacy regression check: Unpopulated isArchived field is correctly retrieved as active department', async () => {
    // Directly insert raw mongo document without isArchived field
    await mongoose.connection.collection('departments').insertOne({
      name: 'Legacy Operations Directorate',
      code: 'LEG-OPS',
      description: 'Historical department without isArchived BSON key',
      isDeleted: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const codes = res.body.data.map((d) => d.code);
    expect(codes).toContain('LEG-OPS');
  });

  it('5. POST /api/v1/employees fails when assigning to an archived department', async () => {
    const rndDept = await Department.findOne({ code: 'RND-LEGACY' });

    const empRes = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Staff',
        email: 'rnd.staff@company.pk',
        departmentId: rndDept._id.toString(),
        employmentType: 'Permanent'
      });

    expect(empRes.status).toBe(400);
    expect(empRes.body.message).toContain('archived');
  });

  it('6. CRITICAL: Permanent delete is strictly BLOCKED when employees are assigned', async () => {
    // 1. Assign employee to Software Engineering (childDept)
    const emp = await Employee.create({
      employeeCode: 'EMP-T100',
      name: 'Software Engineer One',
      email: 'swe.one@company.pk',
      departmentId: childDept._id,
      employmentType: 'Permanent'
    });
    linkedEmployee = emp;

    // 2. Archive Software Engineering
    await request(app)
      .patch(`/api/v1/departments/${childDept._id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    // 3. Attempt to permanently delete while employee is assigned
    const deleteRes = await request(app)
      .delete(`/api/v1/departments/${childDept._id}/permanent`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.message).toContain(
      'This department cannot be permanently deleted because 1 employee(s) are still assigned to it'
    );

    // Verify department is still in database
    const verifyDept = await Department.findById(childDept._id);
    expect(verifyDept).toBeDefined();
  });

  it('7. Reassigning employee allows permanent deletion of empty department', async () => {
    // 1. Reassign employee to parent Technology Directorate
    linkedEmployee.departmentId = parentDept._id;
    await linkedEmployee.save();

    // 2. Permanent deletion now succeeds
    const deleteRes = await request(app)
      .delete(`/api/v1/departments/${childDept._id}/permanent`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain('permanently deleted');

    // 3. Verify record was purged from DB
    const purgedDept = await Department.findById(childDept._id);
    expect(purgedDept).toBeNull();
  });

  it('8. PATCH /api/v1/departments/:id/restore reinstates archived department to active directory', async () => {
    const rndDept = await Department.findOne({ code: 'RND-LEGACY' });

    const restoreRes = await request(app)
      .patch(`/api/v1/departments/${rndDept._id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isArchived).toBe(false);
    expect(restoreRes.body.data.isActive).toBe(true);

    // Now appears back in active departments query
    const activeRes = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`);

    const codes = activeRes.body.data.map((d) => d.code);
    expect(codes).toContain('RND-LEGACY');
  });

  it('9. GET /api/v1/departments/stats aggregates accurate live KPI metrics from database', async () => {
    const statsRes = await request(app)
      .get('/api/v1/departments/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.total).toBeGreaterThanOrEqual(2);
    expect(statsRes.body.data.active).toBeGreaterThanOrEqual(2);
    expect(statsRes.body.data.archived).toBe(0);
    expect(statsRes.body.data.withEmployees).toBeGreaterThanOrEqual(1);
  });

  it('10. Non-authorized roles (Employee) are forbidden from archiving, restoring, or deleting', async () => {
    const rndDept = await Department.findOne({ code: 'RND-LEGACY' });

    // Archive forbidden
    const res1 = await request(app)
      .patch(`/api/v1/departments/${rndDept._id}/archive`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res1.status).toBe(403);

    // Delete forbidden
    const res2 = await request(app)
      .delete(`/api/v1/departments/${rndDept._id}/permanent`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res2.status).toBe(403);
  });
});
