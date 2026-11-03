/**
 * @file m22.projects.e2e.test.js
 * @description Comprehensive Multi-Role Functional & Security E2E Test Suite for Module M22 (Projects & Timesheets).
 * 
 * SPECIFICATION & COVERAGE:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.1 to 22.7)
 * - Roles: Super Admin, HR Manager, Department Manager, Employee
 * - Invariants:
 *   1. 24h Daily Cap across projects.
 *   2. Project member roster isolation (403 for non-members).
 *   3. Approved timesheet immutability (cannot modify/delete).
 *   4. Project profitability derived from SalaryStructure (403 for non-Super Admin).
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
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { Client } from '../src/models/client.model.js';
import { Project } from '../src/models/project.model.js';
import { Timesheet } from '../src/models/timesheet.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M22 — Projects & Timesheets E2E Test Suite', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken, nonMemberToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser, nonMemberUser;
  let engineeringDept;
  let devDesignation;
  let employeeEmp, deptManagerEmp, nonMemberEmp;
  let testClientId;
  let testProjectId;
  let testTimesheetId;
  const currentMonday = new Date();
  const day = currentMonday.getUTCDay();
  const diff = currentMonday.getUTCDate() - day + (day === 0 ? -6 : 1);
  const mondayUtc = new Date(Date.UTC(currentMonday.getUTCFullYear(), currentMonday.getUTCMonth(), diff, 0, 0, 0, 0));

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
    if (mongoose.connection.readyState === 0) {
      const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m22_projects');
      await mongoose.connect(testDbUri);
    }

    // Clean test collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Designation.deleteMany({}),
      Employee.deleteMany({}),
      SalaryStructure.deleteMany({}),
      Client.deleteMany({}),
      Project.deleteMany({}),
      Timesheet.deleteMany({})
    ]);

    // Bootstrap roles and Super Admin
    await seedRolesAndAdmin();

    superAdminUser = await User.findOne({
      email: { $in: ['mhamzaofficial159@gmail.com', 'admin@hrm.company.pk', env.ADMIN_EMAIL] }
    }).populate('roles');
    if (!superAdminUser) {
      const saRole = await Role.findOne({ name: 'Super Admin' });
      superAdminUser = await User.findOne({ roles: saRole._id }).populate('roles');
    }
    superAdminToken = generateToken(superAdminUser);

    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const mgrRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    // Seed Department & Designation
    engineeringDept = await Department.create({
      name: 'Software Engineering',
      code: 'SWE',
      isActive: true
    });

    devDesignation = await Designation.create({
      title: 'Senior Software Engineer',
      code: 'SSE',
      departmentId: engineeringDept._id,
      grade: 'Senior',
      isActive: true
    });

    // Seed HR Manager User
    hrManagerUser = await User.create({
      name: 'Ayesha HR',
      email: 'ayesha.hr@hrm.company.pk',
      passwordHash: 'hashed_pw_test',
      roles: [hrRole._id],
      status: 'Active',
      departmentId: engineeringDept._id
    });
    hrManagerUser.roles = [hrRole];
    hrManagerToken = generateToken(hrManagerUser);

    // Seed Department Manager User & Employee
    deptManagerUser = await User.create({
      name: 'Kamran Lead',
      email: 'kamran.lead@hrm.company.pk',
      passwordHash: 'hashed_pw_test',
      roles: [mgrRole._id],
      status: 'Active',
      departmentId: engineeringDept._id
    });
    deptManagerUser.roles = [mgrRole];
    deptManagerToken = generateToken(deptManagerUser);

    deptManagerEmp = await Employee.create({
      userId: deptManagerUser._id,
      employeeCode: 'EMP-M22-MGR', employeeId: 'EMP-M22-MGR',
      name: 'Kamran Lead',
      email: 'kamran.lead@hrm.company.pk',
      departmentId: engineeringDept._id,
      designationId: devDesignation._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    // Seed Project Member Employee
    employeeUser = await User.create({
      name: 'Bilal Engineer',
      email: 'bilal.eng@hrm.company.pk',
      passwordHash: 'hashed_pw_test',
      roles: [empRole._id],
      status: 'Active',
      departmentId: engineeringDept._id
    });
    employeeUser.roles = [empRole];
    employeeToken = generateToken(employeeUser);

    employeeEmp = await Employee.create({
      userId: employeeUser._id,
      employeeCode: 'EMP-M22-DEV', employeeId: 'EMP-M22-DEV',
      name: 'Bilal Engineer',
      email: 'bilal.eng@hrm.company.pk',
      departmentId: engineeringDept._id,
      designationId: devDesignation._id,
      managerId: deptManagerEmp._id,
      status: 'Active',
      joiningDate: new Date('2024-01-01')
    });

    // Seed Non-Member Employee (for 403 roster checks)
    nonMemberUser = await User.create({
      name: 'Zain Outsider',
      email: 'zain.outsider@hrm.company.pk',
      passwordHash: 'hashed_pw_test',
      roles: [empRole._id],
      status: 'Active',
      departmentId: engineeringDept._id
    });
    nonMemberUser.roles = [empRole];
    nonMemberToken = generateToken(nonMemberUser);

    nonMemberEmp = await Employee.create({
      userId: nonMemberUser._id,
      employeeCode: 'EMP-M22-OUT', employeeId: 'EMP-M22-OUT',
      name: 'Zain Outsider',
      email: 'zain.outsider@hrm.company.pk',
      departmentId: engineeringDept._id,
      designationId: devDesignation._id,
      status: 'Active',
      joiningDate: new Date('2024-06-01')
    });

    // Seed Salary Structure for Bilal (Basic: 100,000 PKR = 10,000,000 paisa)
    // Hourly Cost: 10,000,000 / (22 * 8) = 56,818 paisa (approx 568.18 PKR)
    await SalaryStructure.create({
      employeeId: employeeEmp._id,
      effectiveFrom: new Date('2024-01-01'),
      currency: 'PKR',
      basicSalary: 10000000,
      houseRentAllowance: 4000000,
      medicalAllowance: 1000000,
      conveyanceAllowance: 1000000,
      grossSalary: 16000000,
      status: 'active'
    });
  }, 35000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // ROW 22.1: CLIENTS & PROJECTS CRUD TESTS
  // =========================================================================
  describe('Row 22.1 — Clients & Projects Portfolio Management', () => {
    it('22.1-TEST-1: HR Manager creates a corporate client successfully', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          name: 'Sarah Connor',
          companyName: 'Cyberdyne Systems',
          email: 'sarah@cyberdyne.com',
          phone: '+92 300 9876543',
          address: 'Tech District, Lahore',
          currency: 'PKR'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companyName).toBe('Cyberdyne Systems');
      testClientId = res.body.data._id;
    });

    it('22.1-TEST-2: Department Manager creates a project charter with billing details', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          name: 'Skynet Defense Platform',
          code: 'PRJ-SKYNET',
          description: 'Autonomous core defense systems',
          clientId: testClientId,
          departmentId: engineeringDept._id.toString(),
          managerId: deptManagerUser._id.toString(),
          billingType: 'hourly',
          hourlyBillingRatePaisa: 350000, // 3,500 PKR/hr
          budgetPaisa: 50000000, // 500,000 PKR
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('PRJ-SKYNET');
      expect(res.body.data.hourlyBillingRatePaisa).toBe(350000);
      testProjectId = res.body.data._id;
    });

    it('22.1-TEST-3: Rejects duplicate project code with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          name: 'Duplicate Skynet',
          code: 'PRJ-SKYNET',
          clientId: testClientId,
          departmentId: engineeringDept._id.toString(),
          managerId: deptManagerUser._id.toString()
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('22.1-TEST-4: Retrieves paginated project portfolio', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // ROW 22.2: MEMBER ASSIGNMENT & ROSTER ISOLATION TESTS
  // =========================================================================
  describe('Row 22.2 — Project Member Assignment & Roster Isolation', () => {
    it('22.2-TEST-1: Assigns Bilal to project as Lead Developer', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${testProjectId}/members`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          members: [
            {
              employeeId: employeeEmp._id.toString(),
              projectRole: 'Lead',
              customHourlyRatePaisa: 400000 // 4,000 PKR/hr
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.members.length).toBe(1);
    });

    it('22.2-TEST-2: Roster Isolation: Rejects time logging from unassigned employee with 403', async () => {
      const res = await request(app)
        .post('/api/v1/timesheets')
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({
          projectId: testProjectId,
          date: mondayUtc.toISOString(),
          hours: 4.0,
          taskDescription: 'Attempting to log time without assignment',
          isBillable: true
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // ROW 22.3: TIMESHEET ENTRY & DAILY 24-HOUR CAP TESTS
  // =========================================================================
  describe('Row 22.3 — Weekly Timesheet Entry & Daily 24h Cap', () => {
    it('22.3-TEST-1: Assigned employee Bilal logs 8.0 hours on Monday', async () => {
      const res = await request(app)
        .post('/api/v1/timesheets')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          projectId: testProjectId,
          date: mondayUtc.toISOString(),
          hours: 8.0,
          taskDescription: 'Implemented neural net handshake protocols',
          isBillable: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hours).toBe(8.0);
      expect(res.body.data.status).toBe('draft');
      testTimesheetId = res.body.data._id;
    });

    it('22.3-TEST-2: Invariant: Rejects time entry exceeding 24.0 hours for the day with 400', async () => {
      // Create a second project to test cross-project daily sum
      const secondProj = await Project.create({
        name: 'Secondary Internal Support',
        code: 'PRJ-SUPP',
        clientId: testClientId,
        departmentId: engineeringDept._id,
        managerId: deptManagerUser._id,
        members: [{ employeeId: employeeEmp._id, projectRole: 'Developer' }]
      });

      // Bilal already has 8.0h on Monday. Logging 17.0h = 25.0h > 24.0h limit
      const res = await request(app)
        .post('/api/v1/timesheets')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          projectId: secondProj._id.toString(),
          date: mondayUtc.toISOString(),
          hours: 17.0,
          taskDescription: 'Excessive overtime beyond 24h ceiling'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('24.0 hours');
    });

    it('22.3-TEST-3: Retrieves weekly grid timesheets for employee', async () => {
      const res = await request(app)
        .get(`/api/v1/timesheets/my-week?weekStartDate=${mondayUtc.toISOString()}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entries.length).toBeGreaterThanOrEqual(1);
    });

    it('22.3-TEST-4: Invariant: Rejects time entry more than 7 days in the future with 400', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const res = await request(app)
        .post('/api/v1/timesheets')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          projectId: testProjectId,
          date: futureDate.toISOString(),
          hours: 8.0,
          taskDescription: 'Future task logging attempt'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('7 days in the future');
    });
  });

  // =========================================================================
  // ROW 22.4: TIMESHEET SUBMISSION & MANAGER APPROVAL WORKFLOW TESTS
  // =========================================================================
  describe('Row 22.4 — Weekly Timesheet Submission & Approval Workflow', () => {
    it('22.4-TEST-1: Bilal submits weekly timesheet for review', async () => {
      const res = await request(app)
        .post('/api/v1/timesheets/submit')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          weekStartDate: mondayUtc.toISOString()
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submittedCount).toBeGreaterThanOrEqual(1);
    });

    it('22.4-TEST-2: Department Manager views pending timesheet queue', async () => {
      const res = await request(app)
        .get('/api/v1/timesheets/pending')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('22.4-TEST-3: Manager approves timesheet entry', async () => {
      const res = await request(app)
        .patch(`/api/v1/timesheets/${testTimesheetId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'approved'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
    });

    it('22.4-TEST-4: Invariant: Approved timesheets cannot be modified or deleted', async () => {
      const editRes = await request(app)
        .put(`/api/v1/timesheets/${testTimesheetId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          hours: 6.0
        });

      expect(editRes.status).toBe(400);
      expect(editRes.body.message).toContain('locked');

      const delRes = await request(app)
        .delete(`/api/v1/timesheets/${testTimesheetId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(delRes.status).toBe(400);
      expect(delRes.body.message).toContain('locked');
    });

    it('22.4-TEST-5: Invariant: Cannot self-approve own timesheet with 403', async () => {
      await Project.findByIdAndUpdate(testProjectId, {
        $push: { members: { employeeId: deptManagerEmp._id, projectRole: 'Lead' } }
      });

      const entry = await Timesheet.create({
        employeeId: deptManagerEmp._id,
        projectId: testProjectId,
        date: mondayUtc,
        weekNumber: '2026-W45',
        weekStartDate: mondayUtc,
        hours: 6.0,
        taskDescription: 'Manager self logging',
        status: 'submitted'
      });

      const res = await request(app)
        .patch(`/api/v1/timesheets/${entry._id}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'approved'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('cannot approve or reject your own');
    });
  });

  // =========================================================================
  // ROW 22.5: UTILIZATION REPORT TESTS
  // =========================================================================
  describe('Row 22.5 — Utilization Telemetry & Aggregation', () => {
    it('22.5-TEST-1: Computes billable vs non-billable utilization rates', async () => {
      const res = await request(app)
        .get('/api/v1/reports/utilization')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalBillableHours).toBeGreaterThanOrEqual(8.0);
      expect(res.body.data.summary.overallUtilizationRate).toBe(100);
    });
  });

  // =========================================================================
  // ROW 22.6: PROJECT PROFITABILITY & HOURLY COST TESTS
  // =========================================================================
  describe('Row 22.6 — Project Profitability (Super Admin Only)', () => {
    it('22.6-TEST-1: Invariant: Rejects non-Super Admin from accessing profitability with 403', async () => {
      const res = await request(app)
        .get('/api/v1/reports/project-profitability')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(403);
    });

    it('22.6-TEST-2: Super Admin calculates revenue, salary-derived labor cost, and profit margin', async () => {
      const res = await request(app)
        .get('/api/v1/reports/project-profitability')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const skynetReport = res.body.data.find((p) => p.projectCode === 'PRJ-SKYNET');
      expect(skynetReport).toBeDefined();
      expect(skynetReport.totalBillableHours).toBe(8.0);
      // Revenue = 8h * 400000 (member custom rate) = 3,200,000 paisa (32,000 PKR)
      expect(skynetReport.totalRevenuePaisa).toBe(3200000);
      // Hourly Cost = round(10000000 / (22 * 8)) = 56818 paisa
      // Labor Cost = 8 * 56818 = 454544 paisa
      expect(skynetReport.totalLaborCostPaisa).toBe(454544);
      // Gross Profit = 3200000 - 454544 = 2,745,456 paisa
      expect(skynetReport.grossProfitPaisa).toBe(2745456);
      expect(skynetReport.profitMarginPercentage).toBeGreaterThan(80);
    });
  });

  // =========================================================================
  // ROW 22.7: HR TIMESHEET COMPLIANCE TESTS
  // =========================================================================
  describe('Row 22.7 — HR Timesheet Compliance & Reminders', () => {
    it('22.7-TEST-1: Identifies employees with missing or unsubmitted timesheets', async () => {
      const res = await request(app)
        .get(`/api/v1/timesheets/missing?weekStartDate=${mondayUtc.toISOString()}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.missingList.length).toBeGreaterThanOrEqual(1);
      // NonMemberEmp hasn't logged 40h
      const missingZain = res.body.data.missingList.find((m) => m.name === 'Zain Outsider');
      expect(missingZain).toBeDefined();
      expect(missingZain.totalHoursLogged).toBe(0);
    });

    it('22.7-TEST-2: HR triggers compliance reminders to delinquent employees', async () => {
      const res = await request(app)
        .post('/api/v1/timesheets/remind-missing')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          weekStartDate: mondayUtc.toISOString(),
          employeeIds: [nonMemberEmp._id.toString()]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.remindedCount).toBe(1);
    });
  });
});
