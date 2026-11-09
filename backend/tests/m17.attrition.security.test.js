/**
 * @file m17.attrition.security.test.js
 * @description Security, Scoping & Confidentiality Invariant Tests for Module M17 (Attrition Prediction).
 * 
 * SPECIFICATION & SECURITY VECTORS:
 * - BUILD-GUIDE Section 26 · Row 17.5 & Section 14 (X1 Security)
 * - Strict Invariant: Employee has zero access (HTTP 403 Forbidden).
 * - Scoping Invariant: Department Manager cannot view or modify peer department records.
 * - Perimeter Defense: NoSQL injection, ReDoS, and unauthenticated guards.
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
import { Designation } from '../src/models/designation.model.js';
import { Employee } from '../src/models/employee.model.js';
import { AttritionScore } from '../src/models/attritionScore.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M17 — Security & Confidentiality Tests (Row 17.5)', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser;
  let engDept, salesDept, devDesig;
  let engEmployee, salesEmployee;
  let engScoreDoc, salesScoreDoc;

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        roles: user.roles.map((r) => r.name || r)
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m17_security');
    await mongoose.connect(testDbUri);

    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Designation.deleteMany({}),
      Employee.deleteMany({}),
      AttritionScore.deleteMany({})
    ]);

    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrManagerRole = await Role.findOne({ name: 'HR Manager' });
    const deptManagerRole = await Role.findOne({ name: 'Department Manager' });
    const employeeRole = await Role.findOne({ name: 'Employee' });

    engDept = await Department.create({ name: 'Engineering SEC', code: 'ENG-SEC' });
    salesDept = await Department.create({ name: 'Sales SEC', code: 'SLS-SEC' });

    devDesig = await Designation.create({
      title: 'Security Software Engineer',
      code: 'SE-SEC',
      grade: 'Mid',
      departmentId: engDept._id
    });

    superAdminUser = await User.create({
      email: 'superadmin.sec@test.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [superAdminRole._id]
    });
    superAdminUser.roles = [superAdminRole];

    hrManagerUser = await User.create({
      email: 'hrmanager.sec@test.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [hrManagerRole._id]
    });
    hrManagerUser.roles = [hrManagerRole];

    deptManagerUser = await User.create({
      email: 'deptmanager.sec@test.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [deptManagerRole._id]
    });
    deptManagerUser.roles = [deptManagerRole];

    const deptManagerEmp = await Employee.create({
      employeeCode: 'EMP-SEC-DM',
      name: 'Engineering Dept Manager',
      email: deptManagerUser.email,
      departmentId: engDept._id,
      designationId: devDesig._id,
      userId: deptManagerUser._id,
      status: 'Active'
    });
    deptManagerUser.employeeId = deptManagerEmp._id;
    await deptManagerUser.save();
    engDept.managerId = deptManagerUser._id;
    await engDept.save();

    employeeUser = await User.create({
      email: 'employee.sec@test.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [employeeRole._id]
    });
    employeeUser.roles = [employeeRole];

    // Employees
    engEmployee = await Employee.create({
      employeeCode: 'EMP-SEC-001',
      name: 'Engineering Tech Lead',
      email: 'eng.lead@test.pk',
      departmentId: engDept._id,
      designationId: devDesig._id,
      status: 'Active'
    });

    salesEmployee = await Employee.create({
      employeeCode: 'EMP-SEC-002',
      name: 'Sales Manager Rep',
      email: 'sales.rep@test.pk',
      departmentId: salesDept._id,
      designationId: devDesig._id,
      status: 'Active'
    });

    // Attrition Scores
    engScoreDoc = await AttritionScore.create({
      employeeId: engEmployee._id,
      departmentId: engDept._id,
      riskScore: 75,
      riskLevel: 'High',
      topFactors: ['High Absenteeism (+15)']
    });

    salesScoreDoc = await AttritionScore.create({
      employeeId: salesEmployee._id,
      departmentId: salesDept._id,
      riskScore: 45,
      riskLevel: 'Medium',
      topFactors: ['Salary Stagnation (+12)']
    });

    superAdminToken = generateToken(superAdminUser);
    hrManagerToken = generateToken(hrManagerUser);
    deptManagerToken = generateToken(deptManagerUser);
    employeeToken = generateToken(employeeUser);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // --------------------------------------------------------------------------
  // SEC-1: Unauthenticated Perimeter Guard
  // --------------------------------------------------------------------------
  it('SEC-1: should reject unauthenticated requests with HTTP 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/attrition/scores');
    expect(res.status).toBe(401);
  });

  // --------------------------------------------------------------------------
  // SEC-2: Strict Confidentiality Invariant — Regular Employee Blocked (403)
  // --------------------------------------------------------------------------
  it('SEC-2: should strictly forbid regular Employee from accessing scores list with HTTP 403', async () => {
    const res = await request(app)
      .get('/api/v1/attrition/scores')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('SEC-2: should strictly forbid regular Employee from triggering recalculation with HTTP 403', async () => {
    const res = await request(app)
      .post('/api/v1/attrition/calculate')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  it('SEC-2: should strictly forbid regular Employee from viewing department trends with HTTP 403', async () => {
    const res = await request(app)
      .get('/api/v1/attrition/departments')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  // --------------------------------------------------------------------------
  // SEC-3: Department Manager Team Scope Boundary Isolation
  // --------------------------------------------------------------------------
  it('SEC-3: should strictly scope Department Manager results to their own department only', async () => {
    const res = await request(app)
      .get('/api/v1/attrition/scores')
      .set('Authorization', `Bearer ${deptManagerToken}`);

    expect(res.status).toBe(200);
    // Must only contain Engineering employee; Sales employee must be absent
    const hasSalesEmp = res.body.data.some((s) => s.departmentId?._id?.toString() === salesDept._id.toString() || s.departmentId?.toString() === salesDept._id.toString());
    expect(hasSalesEmp).toBe(false);
  });

  it('SEC-3: should reject Department Manager attempting to view external department score with HTTP 403', async () => {
    const res = await request(app)
      .get(`/api/v1/attrition/scores/${salesScoreDoc._id.toString()}`)
      .set('Authorization', `Bearer ${deptManagerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  it('SEC-3: should reject Department Manager attempting to add note to external employee with HTTP 403', async () => {
    const res = await request(app)
      .post(`/api/v1/attrition/${salesScoreDoc._id.toString()}/notes`)
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({
        note: 'Unauthorized cross-department retention attempt',
        actionTaken: 'One-on-One Wellness Check'
      });

    expect(res.status).toBe(403);
  });

  // --------------------------------------------------------------------------
  // SEC-4 & SEC-5: Injection & ReDoS Defense
  // --------------------------------------------------------------------------
  it('SEC-4: should sanitize NoSQL injection attempts in query parameters', async () => {
    const res = await request(app)
      .get('/api/v1/attrition/scores?riskLevel[$ne]=Low')
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(400); // Caught by Zod enum validation
  });

  it('SEC-5: should safely process ReDoS attack metacharacters in search without crashing', async () => {
    const maliciousRegex = '((((((((a+)+)+)+)+)+)+)+)*$';
    const res = await request(app)
      .get(`/api/v1/attrition/scores?search=${encodeURIComponent(maliciousRegex)}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
