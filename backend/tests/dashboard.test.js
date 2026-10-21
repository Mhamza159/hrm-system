/**
 * @file dashboard.test.js
 * @description Unit and Integration tests for Module M7 Dashboard aggregations and endpoints.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { Leave } from '../src/models/leave.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

import {
  getTodayDateString,
  getLastNDaysList
} from '../src/modules/dashboard/dashboard.service.js';

describe('Module M7 — Dashboard Service Helpers (Slice 7.5-TEST)', () => {
  it('7.5-TEST: getTodayDateString returns valid YYYY-MM-DD format in Asia/Karachi', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('7.5-TEST: getLastNDaysList returns exact number of contiguous sequential dates', () => {
    const days7 = getLastNDaysList(7);
    expect(days7.length).toBe(7);
    expect(days7[6]).toBe(getTodayDateString());

    const day0 = dayjs(days7[0]);
    const day1 = dayjs(days7[1]);
    expect(day1.diff(day0, 'day')).toBe(1);
  });
});

describe('Module M7 — Role-Based Dashboard Integration Tests (Slices 7.1, 7.2, 7.3, 7.4)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let testDept;
  let managerEmployee;
  let staffEmployee;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m7_dashboard');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});

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
        { action: 'dashboard.view', subject: 'Dashboard', scope: 'all' },
        { action: 'report.view', subject: 'Report', scope: 'all' },
        { action: 'report.export', subject: 'Report', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'dashboard.view', subject: 'Dashboard', scope: 'team' },
        { action: 'report.view', subject: 'Report', scope: 'team' },
        { action: 'report.export', subject: 'Report', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'dashboard.view', subject: 'Dashboard', scope: 'own' }
      ]
    });

    // 2. Department & Employees
    testDept = await Department.create({
      name: 'Engineering',
      code: 'ENG'
    });

    managerEmployee = await Employee.create({
      employeeCode: 'EMP-MGR-001',
      name: 'Bilal Manager',
      email: 'manager.dash@hrm.local',
      departmentId: testDept._id,
      status: 'Active'
    });

    staffEmployee = await Employee.create({
      employeeCode: 'EMP-STF-001',
      name: 'Usman Staff',
      email: 'staff.dash@hrm.local',
      departmentId: testDept._id,
      managerId: managerEmployee._id,
      status: 'Active'
    });

    // Update Dept head
    testDept.headId = managerEmployee._id;
    await testDept.save();

    // 3. Today's Attendance Seed
    const today = getTodayDateString();
    await Attendance.create({
      employeeId: staffEmployee._id,
      date: today,
      status: 'present',
      workDurationMinutes: 480
    });

    // 4. Users Setup
    const superAdminUser = await User.create({
      name: 'Dash Admin',
      email: 'admin.dash@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id]
    });

    const hrUser = await User.create({
      name: 'Dash HR',
      email: 'hr.dash@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id]
    });

    const managerUser = await User.create({
      name: 'Dash Manager',
      email: 'manager.dash@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      employeeId: managerEmployee._id
    });

    const empUser = await User.create({
      name: 'Dash Staff',
      email: 'staff.dash@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      employeeId: staffEmployee._id
    });

    // Link user accounts to employees
    managerEmployee.userId = managerUser._id;
    await managerEmployee.save();

    staffEmployee.userId = empUser._id;
    await staffEmployee.save();

    // 5. Issue JWT Tokens
    const signToken = (user, roleName) =>
      jwt.sign(
        {
          userId: user._id,
          email: user.email,
          roles: [roleName],
          employeeId: user.employeeId
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin');
    hrToken = signToken(hrUser, 'HR Manager');
    managerToken = signToken(managerUser, 'Department Manager');
    employeeToken = signToken(empUser, 'Employee');
  }, 35000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // 7.1-TEST: Super Admin Executive Dashboard
  it('7.1-TEST: GET /api/v1/dashboard/admin returns 200 with company metrics for Super Admin', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/admin')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis).toBeDefined();
    expect(res.body.data.kpis.totalEmployees).toBeGreaterThanOrEqual(2);
    expect(res.body.data.attendanceTrend).toBeDefined();
  }, 20000);

  it('7.1-TEST: Disallows Department Manager and Employee from GET /api/v1/dashboard/admin (403 Forbidden)', async () => {
    const resMgr = await request(app)
      .get('/api/v1/dashboard/admin')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(resMgr.status).toBe(403);

    const resEmp = await request(app)
      .get('/api/v1/dashboard/admin')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(resEmp.status).toBe(403);
  }, 15000);

  // 7.2-TEST: HR Manager Operational Dashboard
  it('7.2-TEST: GET /api/v1/dashboard/hr returns 200 with workforce operations queues for HR Manager', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/hr')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis.activeEmployees).toBeGreaterThanOrEqual(2);
    expect(res.body.data.pendingLeaves).toBeDefined();
    expect(res.body.data.upcomingBirthdays).toBeDefined();
  }, 15000);

  it('7.2-TEST: Disallows Department Manager from GET /api/v1/dashboard/hr (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/hr')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  }, 15000);

  // 7.3-TEST: Department Manager Team Dashboard
  it('7.3-TEST: GET /api/v1/dashboard/manager returns 200 with team-scoped status and NO salary leaks', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/manager')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis.teamCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.teamMembers).toBeDefined();

    // STRICT INVARIANT: Ensure zero salary / financial figures leak in manager payload
    const payloadStr = JSON.stringify(res.body.data);
    expect(payloadStr).not.toContain('basicSalary');
    expect(payloadStr).not.toContain('grossPay');
    expect(payloadStr).not.toContain('netPayable');
    expect(payloadStr).not.toContain('paisa');
  }, 15000);

  // 7.4-TEST: Employee Personal Dashboard
  it('7.4-TEST: GET /api/v1/dashboard/employee returns 200 with isolated caller data', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/employee')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee.employeeCode).toBe('EMP-STF-001');
    expect(res.body.data.todayAttendance.status).toBe('present');
    expect(res.body.data.leaveBalances).toBeDefined();
  }, 15000);

  it('Security Hardening: Manager with no team members receives safe zeroed state without throwing', async () => {
    const soloManagerRole = await Role.findOne({ name: 'Department Manager' });
    const soloUser = await User.create({
      name: 'Solo Manager',
      email: 'solo.mgr@hrm.local',
      passwordHash: 'dummy',
      roles: [soloManagerRole._id]
    });
    const soloToken = jwt.sign(
      { userId: soloUser._id, email: soloUser.email, roles: ['Department Manager'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/v1/dashboard/manager')
      .set('Authorization', `Bearer ${soloToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis.teamCount).toBe(0);
    expect(res.body.data.teamMembers).toEqual([]);
    expect(res.body.data.pendingApprovals).toEqual([]);
  }, 15000);

  it('Security Hardening: User without employee record receives safe empty employee dashboard', async () => {
    const orphanEmpRole = await Role.findOne({ name: 'Employee' });
    const orphanUser = await User.create({
      name: 'Orphan User',
      email: 'orphan.emp@hrm.local',
      passwordHash: 'dummy',
      roles: [orphanEmpRole._id]
    });
    const orphanToken = jwt.sign(
      { userId: orphanUser._id, email: orphanUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/v1/dashboard/employee')
      .set('Authorization', `Bearer ${orphanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee).toBeNull();
    expect(res.body.data.leaveBalances).toEqual([]);
  }, 15000);
}, 35000);
