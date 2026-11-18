/**
 * @file designations.overhaul.e2e.test.js
 * @description Comprehensive E2E integration test suite for Phase 26:
 * Designation Module Archival Lifecycle, Stats & Analytics Aggregations, RBAC,
 * Cross-Module Assignment Guards, and Critical Employee Assignment Restriction Guard.
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
import { Designation } from '../src/models/designation.model.js';
import { env } from '../src/config/env.js';

describe('Phase 26: Designation Module Overhaul, Archival Lifecycle & Employee Guard E2E', () => {
  const adminEmail = 'admin.desig@company.pk';
  const staffEmail = 'staff.desig@company.pk';
  const testPassword = 'Password123!';

  let adminToken;
  let staffToken;
  let adminUser;
  let staffUser;

  let testDept;
  let secondaryDept;
  let testDesig;
  let secondaryDesig;
  let linkedEmployee;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p26_designations');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});

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

    staffUser = await User.create({
      email: staffEmail,
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

    staffToken = jwt.sign(
      { userId: staffUser._id, _id: staffUser._id, id: staffUser._id, email: staffUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Seed Test Departments
    testDept = await Department.create({
      name: 'Engineering Division',
      code: 'ENG',
      isActive: true
    });

    secondaryDept = await Department.create({
      name: 'Product Design',
      code: 'DSG',
      isActive: true
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await mongoose.disconnect();
  });

  it('1. POST /api/v1/designations creates a new designation with valid grade tier', async () => {
    const res = await request(app)
      .post('/api/v1/designations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Senior Software Engineer',
        code: 'SSE',
        grade: 'Senior',
        departmentId: testDept._id.toString(),
        description: 'Leads backend architecture and microservices.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Senior Software Engineer');
    expect(res.body.data.code).toBe('SSE');
    expect(res.body.data.grade).toBe('Senior');
    expect(res.body.data.isArchived).toBe(false);

    testDesig = res.body.data;
  });

  it('2. POST /api/v1/designations rejects duplicate code within the same department', async () => {
    const res = await request(app)
      .post('/api/v1/designations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Staff Software Engineer',
        code: 'SSE', // duplicate code in same department
        grade: 'Lead',
        departmentId: testDept._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("already exists in this department");
  });

  it('3. POST /api/v1/designations creates secondary designation in another department', async () => {
    const res = await request(app)
      .post('/api/v1/designations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Principal Product Designer',
        code: 'PPD',
        grade: 'Lead',
        departmentId: secondaryDept._id.toString(),
        description: 'Design systems lead.'
      });

    expect(res.status).toBe(201);
    secondaryDesig = res.body.data;
  });

  it('4. PATCH /api/v1/designations/:id updates title and description', async () => {
    const res = await request(app)
      .patch(`/api/v1/designations/${testDesig._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Senior Full Stack Engineer',
        description: 'Full stack web applications and microservices.'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Senior Full Stack Engineer');
  });

  it('5. GET /api/v1/designations/stats returns 7-metric KPI statistics', async () => {
    const res = await request(app)
      .get('/api/v1/designations/stats')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.active).toBe(2);
    expect(res.body.data.archived).toBe(0);
    expect(res.body.data.totalAssignedEmployees).toBe(0);
    expect(res.body.data.withoutEmployees).toBe(2);
    expect(res.body.data.departmentsCount).toBe(2);
  });

  it('6. GET /api/v1/designations/analytics returns grade breakdown and department share', async () => {
    const res = await request(app)
      .get('/api/v1/designations/analytics')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalDesignations).toBe(2);
    expect(Array.isArray(res.body.data.gradeBreakdown)).toBe(true);
    expect(Array.isArray(res.body.data.departmentDistribution)).toBe(true);
  });

  it('7. Link employee to designation and test GET /api/v1/designations/:id enriched response', async () => {
    // Seed employee assigned to testDesig
    linkedEmployee = await Employee.create({
      employeeCode: 'EMP-2601',
      name: 'Ahmed Tariq',
      email: 'ahmed.tariq@company.pk',
      departmentId: testDept._id,
      designationId: testDesig._id,
      joiningDate: new Date(),
      status: 'Active'
    });

    const res = await request(app)
      .get(`/api/v1/designations/${testDesig._id}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.headcount).toBe(1);
    expect(Array.isArray(res.body.data.employees)).toBe(true);
    expect(res.body.data.employees.length).toBe(1);
    expect(res.body.data.employees[0].name).toBe('Ahmed Tariq');
    expect(res.body.data.employees[0].employeeCode).toBe('EMP-2601');
  });

  it('8. PATCH /api/v1/designations/:id/archive soft-archives designation', async () => {
    const res = await request(app)
      .patch(`/api/v1/designations/${testDesig._id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isArchived).toBe(true);
    expect(res.body.data.archivedAt).toBeDefined();
  });

  it('9. GET /api/v1/designations excludes archived, and GET /api/v1/designations/archived includes it', async () => {
    const activeRes = await request(app)
      .get('/api/v1/designations')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(activeRes.status).toBe(200);
    const activeTitles = activeRes.body.data.map((d) => d.code);
    expect(activeTitles).not.toContain('SSE');
    expect(activeTitles).toContain('PPD');

    const archivedRes = await request(app)
      .get('/api/v1/designations/archived')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(archivedRes.status).toBe(200);
    expect(archivedRes.body.data.total).toBe(1);
    expect(archivedRes.body.data.docs[0].code).toBe('SSE');
    expect(archivedRes.body.data.docs[0].headcount).toBe(1);
  });

  it('10. Cross-Module Guard: Employee creation/update with archived designation is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeCode: 'EMP-FAIL',
        name: 'Fail User',
        email: 'fail.user@company.pk',
        departmentId: testDept._id.toString(),
        designationId: testDesig._id.toString(), // archived!
        joiningDate: new Date(),
        status: 'Active'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('because it is archived');
  });

  it('11. MANDATORY GUARD: DELETE /api/v1/designations/:id/permanent is BLOCKED when employee is assigned', async () => {
    const res = await request(app)
      .delete(`/api/v1/designations/${testDesig._id}/permanent`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'This designation cannot be permanently deleted because 1 employee(s) are still assigned to it. Please reassign all employees to another designation before proceeding.'
    );

    // Verify designation document was NOT deleted
    const stillExists = await Designation.findById(testDesig._id);
    expect(stillExists).not.toBeNull();
  });

  it('12. Reassign employee away, then permanent deletion succeeds', async () => {
    // Reassign employee to secondaryDesig
    await Employee.updateOne(
      { _id: linkedEmployee._id },
      { designationId: secondaryDesig._id }
    );

    const res = await request(app)
      .delete(`/api/v1/designations/${testDesig._id}/permanent`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('permanently deleted');

    // Verify designation document is purged from database
    const purged = await Designation.findById(testDesig._id);
    expect(purged).toBeNull();
  });

  it('13. Archive secondary designation and test restore lifecycle', async () => {
    // Archive secondary designation
    await request(app)
      .patch(`/api/v1/designations/${secondaryDesig._id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Restore secondary designation
    const restoreRes = await request(app)
      .patch(`/api/v1/designations/${secondaryDesig._id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.success).toBe(true);
    expect(restoreRes.body.data.isArchived).toBe(false);
    expect(restoreRes.body.data.archivedAt).toBeNull();

    // Verify it is back in active directory
    const activeRes = await request(app)
      .get('/api/v1/designations')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(activeRes.body.data.some((d) => d._id === secondaryDesig._id)).toBe(true);
  });

  it('14. RBAC: User without org.manage cannot archive or delete designation', async () => {
    const archiveRes = await request(app)
      .patch(`/api/v1/designations/${secondaryDesig._id}/archive`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(archiveRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/v1/designations/${secondaryDesig._id}/permanent`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(deleteRes.status).toBe(403);
  });
});
