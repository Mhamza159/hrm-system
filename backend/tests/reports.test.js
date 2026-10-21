/**
 * @file reports.test.js
 * @description Integration tests for Module M7 Reports: Multi-Axis Reports, Filters & Streaming Exporters.
 * Verifies Slices 7.6-TEST, 7.7-TEST, and 7.8-TEST.
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
import { AuditLog } from '../src/models/auditLog.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M7 — Reports Integration Tests (Slices 7.6, 7.7, 7.8)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;
  let viewerToken;

  let testDept;
  let otherDept;
  let otherDeptEmployee;
  let managerEmployee;
  let staffEmployee;
  let testLeaveType;

  const todayStr = dayjs().format('YYYY-MM-DD');
  const sevenDaysAgoStr = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m7_reports');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await LeaveType.deleteMany({});

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

    const viewerRole = await Role.create({
      name: 'Report Auditor',
      isSystem: false,
      permissions: [
        { action: 'report.view', subject: 'Report', scope: 'all' }
      ]
    });

    // 2. Department & Employees
    testDept = await Department.create({
      name: 'Engineering',
      code: 'ENG'
    });

    otherDept = await Department.create({
      name: 'Finance',
      code: 'FIN'
    });

    managerEmployee = await Employee.create({
      employeeCode: 'EMP-MGR-002',
      name: 'Zahid Manager',
      email: 'zahid.mgr@hrm.local',
      departmentId: testDept._id,
      status: 'Active',
      salary: 250000
    });

    staffEmployee = await Employee.create({
      employeeCode: 'EMP-STF-002',
      name: 'Hamza Staff',
      email: 'hamza.staff@hrm.local',
      departmentId: testDept._id,
      managerId: managerEmployee._id,
      status: 'Active',
      salary: 120000
    });

    otherDeptEmployee = await Employee.create({
      employeeCode: 'EMP-FIN-001',
      name: 'Other Dept Staff',
      email: 'other.dept@hrm.local',
      departmentId: otherDept._id,
      status: 'Active',
      salary: 150000
    });

    testDept.headId = managerEmployee._id;
    await testDept.save();

    // 3. Leave Type & Seed Records
    testLeaveType = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CL',
      daysPerYear: 14,
      isPaid: true
    });

    await Attendance.create({
      employeeId: staffEmployee._id,
      date: todayStr,
      status: 'present',
      workDurationMinutes: 480
    });

    await Attendance.create({
      employeeId: otherDeptEmployee._id,
      date: todayStr,
      status: 'present',
      workDurationMinutes: 480
    });

    await Leave.create({
      employeeId: staffEmployee._id,
      leaveTypeId: testLeaveType._id,
      startDate: new Date(todayStr),
      endDate: new Date(todayStr),
      days: 1,
      reason: 'Personal errand',
      status: 'approved'
    });

    // 4. User Accounts Setup
    const superAdminUser = await User.create({
      name: 'Report Admin',
      email: 'admin.rep@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id]
    });

    const hrUser = await User.create({
      name: 'Report HR',
      email: 'hr.rep@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id]
    });

    const managerUser = await User.create({
      name: 'Report Manager',
      email: 'manager.rep@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      employeeId: managerEmployee._id
    });

    const empUser = await User.create({
      name: 'Report Staff',
      email: 'staff.rep@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      employeeId: staffEmployee._id
    });

    const viewerUser = await User.create({
      name: 'Auditor Viewer',
      email: 'viewer.rep@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [viewerRole._id]
    });

    managerEmployee.userId = managerUser._id;
    await managerEmployee.save();

    staffEmployee.userId = empUser._id;
    await staffEmployee.save();

    // 5. JWT Generation Helper
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
    viewerToken = signToken(viewerUser, 'Report Auditor');
  }, 35000);

  afterAll(async () => {
    try {
      await mongoose.connection.db.dropDatabase();
    } catch {
      // Ignore if drop fails
    }
    await mongoose.connection.close();
  });

  // --- Slice 7.6-TEST: Multi-Axis Reports Console ---
  describe('Slice 7.6-TEST: Report Data & Scope Enforcement', () => {
    it('7.6-TEST: GET /api/v1/reports/attendance returns 200 with summary and records for HR Manager', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportType', 'attendance');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('totalRecords');
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
    });

    it('7.6-TEST: GET /api/v1/reports/leave returns 200 with leave metrics for HR Manager', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/leave?from=${sevenDaysAgoStr}&to=${todayStr}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportType', 'leave');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('totalApplications');
      expect(Array.isArray(res.body.data.records)).toBe(true);
    });

    it('7.6-TEST: Department Manager receives 403 Forbidden for financial report (payroll)', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/payroll?from=${sevenDaysAgoStr}&to=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/financial/i);
    });

    it('7.6-TEST: Regular Employee receives 403 Forbidden for reports without report.view permission', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  // --- Slice 7.7-TEST: Multi-Parameter Filter Toolbar ---
  describe('Slice 7.7-TEST: Date Range & Filter Validation', () => {
    it('7.7-TEST: Returns 400 Bad Request when from date is after to date', async () => {
      const invalidFrom = dayjs().add(2, 'day').format('YYYY-MM-DD');
      const invalidTo = dayjs().subtract(2, 'day').format('YYYY-MM-DD');

      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${invalidFrom}&to=${invalidTo}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Validation failed/i);
      expect(JSON.stringify(res.body.errors)).toMatch(/earlier than or equal to/i);
    });

    it('7.7-TEST: Returns 400 Bad Request for unrecognized report type', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/unknown-type?from=${sevenDaysAgoStr}&to=${todayStr}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Validation failed/i);
      expect(JSON.stringify(res.body.errors)).toMatch(/type/i);
    });

    it('7.7-TEST: Correctly applies departmentId filter', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}&departmentId=${testDept._id}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --- Slice 7.8-TEST: Streaming Excel and PDF Exporters ---
  describe('Slice 7.8-TEST: Streaming Exporters (ExcelJS & PDFKit)', () => {
    it('7.8-TEST: GET /api/v1/reports/attendance?format=xlsx streams valid Excel file with headers', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}&format=xlsx`)
        .set('Authorization', `Bearer ${hrToken}`)
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.xlsx');
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(100);
    });

    it('7.8-TEST: GET /api/v1/reports/attendance?format=pdf streams valid PDF file starting with %PDF-', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}&format=pdf`)
        .set('Authorization', `Bearer ${hrToken}`)
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(100);

      // Verify PDF Magic Bytes (%PDF-)
      const pdfHeader = res.body.slice(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');
    });

    it('7.8-TEST: Department Manager with export permission can stream XLSX for team', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}&format=xlsx`)
        .set('Authorization', `Bearer ${managerToken}`)
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.body.length).toBeGreaterThan(100);
    });

    it('7.8-TEST: Returns 403 Forbidden when user with report.view lacks report.export', async () => {
      // 1. Can view JSON data
      const viewRes = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(viewRes.status).toBe(200);

      // 2. Export is blocked with 403
      const exportRes = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}&format=xlsx`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(exportRes.status).toBe(403);
      expect(exportRes.body.message).toMatch(/report\.export/i);
    });

    it('7.8-TEST: Records audit log entry when export is successfully generated', async () => {
      await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}&format=xlsx`)
        .set('Authorization', `Bearer ${hrToken}`)
        .responseType('blob');

      const auditRecord = await AuditLog.findOne({
        action: 'report.export',
        'details.format': 'xlsx'
      }).sort({ createdAt: -1 });

      expect(auditRecord).toBeTruthy();
      expect(auditRecord.action).toBe('report.export');
      expect(auditRecord.targetModel).toBe('Report');
    });

    it('7.6-TEST: Department Manager cannot access employees from other departments via departmentId parameter', async () => {
      // Manager manages testDept (Engineering), otherDept is Finance
      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${sevenDaysAgoStr}&to=${todayStr}&departmentId=${otherDept._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Because otherDept employees are outside manager's team, result should be 0 records (intersection empty)
      expect(res.body.data.records.length).toBe(0);
    });

    it('Security Hardening: Rejects NoSQL injection attempts and excessive limit caps', async () => {
      // 1. Attempt NoSQL injection object in status
      const res1 = await request(app)
        .get(`/api/v1/reports/attendance?status[$ne]=active`)
        .set('Authorization', `Bearer ${hrToken}`);
      expect(res1.status).toBe(400);

      // 2. Attempt invalid ObjectId in departmentId
      const res2 = await request(app)
        .get(`/api/v1/reports/attendance?departmentId=invalid-non-hex-id`)
        .set('Authorization', `Bearer ${hrToken}`);
      expect(res2.status).toBe(400);

      // 3. Attempt limit exceeding bounded ceiling of 500 (DoS prevention)
      const res3 = await request(app)
        .get(`/api/v1/reports/attendance?limit=50000`)
        .set('Authorization', `Bearer ${hrToken}`);
      expect(res3.status).toBe(400);
    });

    it('Security Hardening: Returns empty items and zero counts gracefully when filters yield no records', async () => {
      const futureFrom = '2099-01-01';
      const futureTo = '2099-01-31';

      const res = await request(app)
        .get(`/api/v1/reports/attendance?from=${futureFrom}&to=${futureTo}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });
  });
});
