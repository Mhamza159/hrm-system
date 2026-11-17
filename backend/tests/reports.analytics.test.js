/**
 * @file reports.analytics.test.js
 * @description Integration tests for Phase 20: Backend Analytics Engine, ChartData & Inspection Endpoints.
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

describe('Phase 20 — Reports Analytics Engine & Inspection Endpoints', () => {
  let hrToken;
  let managerToken;
  let testDept;
  let staffEmployee;
  let testLeaveType;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m7_analytics');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await LeaveType.deleteMany({});

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'report.view', subject: 'Report', scope: 'all' },
        { action: 'report.export', subject: 'Report', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'report.view', subject: 'Report', scope: 'team' }
      ]
    });

    const hrUser = await User.create({
      name: 'Analytics HR',
      email: 'hr.analytics@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id]
    });

    const managerUser = await User.create({
      name: 'Analytics Manager',
      email: 'manager.analytics@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id]
    });

    testDept = await Department.create({
      name: 'Engineering Analytics',
      code: 'ENG-ANL'
    });

    staffEmployee = await Employee.create({
      name: 'Hamza Engineer',
      employeeCode: 'EMP-ANL-001',
      email: 'hamza.eng@hrm.enterprise',
      departmentId: testDept._id,
      status: 'Active',
      employmentType: 'Permanent',
      joiningDate: dayjs().subtract(6, 'month').toDate()
    });

    testLeaveType = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CASUAL',
      daysPerYear: 14,
      isPaid: true
    });

    // Attendance record
    await Attendance.create({
      employeeId: staffEmployee._id,
      date: dayjs().format('YYYY-MM-DD'),
      status: 'present',
      workDurationMinutes: 480,
      overtimeMinutes: 60,
      overtimeApproved: true
    });

    // Leave record
    await Leave.create({
      employeeId: staffEmployee._id,
      leaveTypeId: testLeaveType._id,
      startDate: dayjs().subtract(2, 'day').toDate(),
      endDate: dayjs().subtract(1, 'day').toDate(),
      days: 2,
      status: 'approved',
      reason: 'Urgent family task'
    });

    hrToken = jwt.sign(
      { userId: hrUser._id, email: hrUser.email, roles: ['HR Manager'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    managerToken = jwt.sign(
      { userId: managerUser._id, email: managerUser.email, roles: ['Department Manager'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. GET /api/v1/reports/attendance returns complete summary and chartData', async () => {
    const res = await request(app)
      .get('/api/v1/reports/attendance')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalRecords).toBeGreaterThanOrEqual(1);
    expect(res.body.data.summary.attendanceRate).toBeDefined();

    expect(res.body.data.chartData).toBeDefined();
    expect(Array.isArray(res.body.data.chartData.statusDistribution)).toBe(true);
    expect(Array.isArray(res.body.data.chartData.dailyTrend)).toBe(true);
  });

  it('2. GET /api/v1/reports/leave returns complete summary and chartData', async () => {
    const res = await request(app)
      .get('/api/v1/reports/leave')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalLeaveDays).toBeGreaterThanOrEqual(2);

    expect(res.body.data.chartData).toBeDefined();
    expect(Array.isArray(res.body.data.chartData.statusDistribution)).toBe(true);
    expect(Array.isArray(res.body.data.chartData.typeBreakdown)).toBe(true);
  });

  it('3. GET /api/v1/reports/headcount returns active headcount and demographics breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/reports/headcount')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalHeadcount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.chartData.departmentBreakdown).toBeDefined();
    expect(res.body.data.chartData.employmentTypeBreakdown).toBeDefined();
  });

  it('4. GET /api/v1/reports/attendance/inspect returns deep punch timeline and score', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/attendance/inspect?employeeId=${staffEmployee._id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('attendance');
    expect(res.body.data.employee.employeeCode).toBe('EMP-ANL-001');
    expect(res.body.data.summary.totalWorkHours).toBe(8);
    expect(Array.isArray(res.body.data.punches)).toBe(true);
  });

  it('5. GET /api/v1/reports/payroll/inspect blocks Department Manager with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/reports/payroll/inspect')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
  });
});
