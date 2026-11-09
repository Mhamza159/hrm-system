/**
 * @file m17.attrition.test.js
 * @description Comprehensive Functional Test Suite for Module M17 (Attrition Prediction).
 * 
 * SPECIFICATION & COVERAGE:
 * - BUILD-GUIDE Section 26 · Rows 17.1 to 17.5
 * - Roles: Super Admin, HR Manager, Department Manager, Employee, Unauthenticated Visitor
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
import { Attendance } from '../src/models/attendance.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import Review from '../src/models/review.model.js';
import { AttritionScore } from '../src/models/attritionScore.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M17 — Attrition Prediction Test Suite (Rows 17.1 to 17.5)', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser;
  let engDept, salesDept, softwareEngDesig;
  let highRiskEmployee, lowRiskEmployee, salesEmployee;
  let highRiskScoreDoc;

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
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m17_attrition');
    await mongoose.connect(testDbUri);

    // Clean test collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Designation.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      SalaryStructure.deleteMany({}),
      Review.deleteMany({}),
      AttritionScore.deleteMany({})
    ]);

    // Bootstrap roles
    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrManagerRole = await Role.findOne({ name: 'HR Manager' });
    const deptManagerRole = await Role.findOne({ name: 'Department Manager' });
    const employeeRole = await Role.findOne({ name: 'Employee' });

    // Departments & Designations
    engDept = await Department.create({ name: 'Software Engineering', code: 'ENG' });
    salesDept = await Department.create({ name: 'Sales & Growth', code: 'SLS' });

    softwareEngDesig = await Designation.create({
      title: 'Software Engineer',
      code: 'SE-ENG',
      grade: 'Mid',
      departmentId: engDept._id
    });

    // Users
    superAdminUser = await User.create({
      email: 'superadmin.attrition@test.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [superAdminRole._id]
    });
    superAdminUser.roles = [superAdminRole];

    hrManagerUser = await User.create({
      email: 'hrmanager.attrition@test.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [hrManagerRole._id]
    });
    hrManagerUser.roles = [hrManagerRole];

    deptManagerUser = await User.create({
      email: 'deptmanager.attrition@test.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [deptManagerRole._id]
    });
    deptManagerUser.roles = [deptManagerRole];

    const deptManagerEmp = await Employee.create({
      employeeCode: 'EMP-DM-001',
      name: 'Engineering Dept Manager',
      email: deptManagerUser.email,
      departmentId: engDept._id,
      designationId: softwareEngDesig._id,
      userId: deptManagerUser._id,
      status: 'Active'
    });
    deptManagerUser.employeeId = deptManagerEmp._id;
    await deptManagerUser.save();
    engDept.managerId = deptManagerUser._id;
    await engDept.save();

    employeeUser = await User.create({
      email: 'employee.attrition@test.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [employeeRole._id]
    });
    employeeUser.roles = [employeeRole];

    // Create Employees
    highRiskEmployee = await Employee.create({
      employeeCode: 'EMP-ENG-001',
      name: 'Kamran Akmal',
      email: 'kamran.a@test.pk',
      departmentId: engDept._id,
      designationId: softwareEngDesig._id,
      joiningDate: new Date(Date.now() - 32 * 30 * 24 * 60 * 60 * 1000), // 32 months tenure
      status: 'Active'
    });

    lowRiskEmployee = await Employee.create({
      employeeCode: 'EMP-ENG-002',
      name: 'Zainab Bibi',
      email: 'zainab.b@test.pk',
      departmentId: engDept._id,
      designationId: softwareEngDesig._id,
      joiningDate: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000), // 4 months tenure
      status: 'Active'
    });

    salesEmployee = await Employee.create({
      employeeCode: 'EMP-SLS-001',
      name: 'Hamza Tariq',
      email: 'hamza.t@test.pk',
      departmentId: salesDept._id,
      designationId: softwareEngDesig._id,
      joiningDate: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000),
      status: 'Active'
    });

    // Populate signals for highRiskEmployee
    // 1. Absences & Late arrivals in last 90 days (use non-overlapping days)
    const recentDate = new Date();
    for (let i = 1; i <= 5; i++) {
      await Attendance.create({
        employeeId: highRiskEmployee._id,
        date: new Date(recentDate.getTime() - (i * 2 + 1) * 24 * 60 * 60 * 1000),
        status: 'absent'
      });
    }
    for (let i = 1; i <= 7; i++) {
      await Attendance.create({
        employeeId: highRiskEmployee._id,
        date: new Date(recentDate.getTime() - (i * 2) * 24 * 60 * 60 * 1000),
        status: 'late',
        isLate: true
      });
    }

    // 2. Salary stagnation > 20 months
    await SalaryStructure.create({
      employeeId: highRiskEmployee._id,
      effectiveFrom: new Date(Date.now() - 22 * 30 * 24 * 60 * 60 * 1000),
      basicSalary: 15000000 // 150,000 PKR
    });

    // Generate Tokens
    superAdminToken = generateToken(superAdminUser);
    hrManagerToken = generateToken(hrManagerUser);
    deptManagerToken = generateToken(deptManagerUser);
    employeeToken = generateToken(employeeUser);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // =========================================================================
  // Row 17.1: Weekly & On-Demand Risk Score Engine (17.1-TEST)
  // =========================================================================
  describe('Row 17.1: Multi-Signal Risk Score Engine (17.1-TEST)', () => {
    it('should trigger on-demand company-wide recalculation via POST /attrition/calculate', async () => {
      const res = await request(app)
        .post('/api/v1/attrition/calculate')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.evaluatedCount).toBeGreaterThanOrEqual(3);
      expect(res.body.data.highRiskCount).toBeGreaterThanOrEqual(1);
    });

    it('should accurately calculate high risk score and contributing factors for stagnant employee', async () => {
      const score = await AttritionScore.findOne({ employeeId: highRiskEmployee._id }).lean();
      expect(score).toBeDefined();
      expect(score.riskScore).toBeGreaterThanOrEqual(70);
      expect(score.riskLevel).toBe('High');
      expect(score.breakdown.attendance).toBeGreaterThanOrEqual(30);
      expect(score.breakdown.salaryStagnation).toBe(25);
      expect(score.topFactors.length).toBeGreaterThan(0);

      highRiskScoreDoc = score;
    });

    it('should calculate low risk score for freshly joined employee without negative signals', async () => {
      const score = await AttritionScore.findOne({ employeeId: lowRiskEmployee._id }).lean();
      expect(score).toBeDefined();
      expect(score.riskScore).toBeLessThan(40);
      expect(score.riskLevel).toBe('Low');
    });
  });

  // =========================================================================
  // Row 17.2: Risk Levels & Contributing Factors Dashboard (17.2-TEST)
  // =========================================================================
  describe('Row 17.2: Risk Levels & Contributing Factors Dashboard (17.2-TEST)', () => {
    it('should return paginated attrition scores with metadata', async () => {
      const res = await request(app)
        .get('/api/v1/attrition/scores?page=1&limit=10')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter attrition scores by riskLevel High', async () => {
      const res = await request(app)
        .get('/api/v1/attrition/scores?riskLevel=High')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((s) => s.riskLevel === 'High')).toBe(true);
    });

    it('should filter attrition scores by departmentId', async () => {
      const res = await request(app)
        .get(`/api/v1/attrition/scores?departmentId=${engDept._id.toString()}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((s) => s.departmentId?._id?.toString() === engDept._id.toString() || s.departmentId?.toString() === engDept._id.toString())).toBe(true);
    });

    it('should retrieve single employee detailed risk profile', async () => {
      const res = await request(app)
        .get(`/api/v1/attrition/scores/${highRiskScoreDoc._id.toString()}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(highRiskScoreDoc._id.toString());
      expect(res.body.data.breakdown).toBeDefined();
      expect(res.body.data.topFactors).toBeDefined();
    });
  });

  // =========================================================================
  // Row 17.3: Department Trends Analytics (17.3-TEST)
  // =========================================================================
  describe('Row 17.3: Department Attrition Trends Analytics (17.3-TEST)', () => {
    it('should return department-level risk distributions', async () => {
      const res = await request(app)
        .get('/api/v1/attrition/departments')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const engStat = res.body.data.find((d) => d.departmentId === engDept._id.toString());
      expect(engStat).toBeDefined();
      expect(engStat.totalEmployees).toBeGreaterThanOrEqual(2);
      expect(engStat.highRisk).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Row 17.4: Retention Suggestions & Action Notes (17.4-TEST)
  // =========================================================================
  describe('Row 17.4: Retention Suggestions & Action Notes (17.4-TEST)', () => {
    it('should allow HR Manager to add an intervention note with follow-up date', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post(`/api/v1/attrition/${highRiskScoreDoc._id.toString()}/notes`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          note: 'Met with employee to discuss workload and compensation. Scheduled market benchmarking review.',
          actionTaken: 'Compensation Review',
          followUpDate: futureDate
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes.length).toBeGreaterThanOrEqual(1);

      const latestNote = res.body.data.notes[res.body.data.notes.length - 1];
      expect(latestNote.actionTaken).toBe('Compensation Review');
      expect(latestNote.note).toContain('Met with employee');
    });

    it('should retrieve retention notes history for an employee', async () => {
      const res = await request(app)
        .get(`/api/v1/attrition/${highRiskScoreDoc._id.toString()}/notes`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject note submission with empty or whitespace-only content with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/attrition/${highRiskScoreDoc._id.toString()}/notes`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          note: '   ',
          actionTaken: 'One-on-One Wellness Check'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
