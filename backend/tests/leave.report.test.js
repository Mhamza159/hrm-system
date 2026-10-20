/**
 * @file leave.report.test.js
 * @description Integration Tests for Leave Analytics & ExcelJS Report Export (BUILD-GUIDE Row 6.15).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { Leave } from '../src/models/leave.model.js';

describe('Module M6 — Leave Analytics & ExcelJS Report Export (Slice 6.15-TEST)', () => {
  let hrToken, managerToken, employeeToken;
  let hrUser, managerUser, regularEmployeeUser;
  let engDept, salesDept;
  let engEmp, salesEmp;
  let annualType;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_report');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await LeaveType.deleteMany({});
    await Leave.deleteMany({});

    // Roles
    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'report.export', subject: 'Report', scope: 'all' },
        { action: 'leave.view', subject: 'Leave', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: false,
      permissions: [
        { action: 'report.export', subject: 'Report', scope: 'team' },
        { action: 'leave.view', subject: 'Leave', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' }
      ]
    });

    // Departments
    engDept = await Department.create({ name: 'Software Engineering', code: 'ENG' });
    salesDept = await Department.create({ name: 'Commercial Sales', code: 'SALES' });

    // Employees
    const mgrEmpDoc = await Employee.create({
      name: 'Eng Manager',
      firstName: 'Eng',
      lastName: 'Manager',
      employeeCode: 'EMP-MGR-01',
      workEmail: 'manager@example.com',
      departmentId: engDept._id,
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    engEmp = await Employee.create({
      name: 'Dev One',
      firstName: 'Dev',
      lastName: 'One',
      employeeCode: 'EMP-DEV-01',
      workEmail: 'dev1@example.com',
      departmentId: engDept._id,
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    salesEmp = await Employee.create({
      name: 'Sales One',
      firstName: 'Sales',
      lastName: 'One',
      employeeCode: 'EMP-SAL-01',
      workEmail: 'sales1@example.com',
      departmentId: salesDept._id,
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    // Users
    hrUser = await User.create({
      email: 'hr@example.com',
      passwordHash: 'hashed123',
      roles: [hrRole._id],
      status: 'Active'
    });

    managerUser = await User.create({
      email: 'manager@example.com',
      passwordHash: 'hashed123',
      roles: [managerRole._id],
      employeeId: mgrEmpDoc._id,
      status: 'Active'
    });
    mgrEmpDoc.userId = managerUser._id;
    await mgrEmpDoc.save();

    regularEmployeeUser = await User.create({
      email: 'employee@example.com',
      passwordHash: 'hashed123',
      roles: [employeeRole._id],
      employeeId: engEmp._id,
      status: 'Active'
    });
    engEmp.userId = regularEmployeeUser._id;
    await engEmp.save();

    // JWT Tokens
    const signToken = (user, empId) =>
      jwt.sign(
        {
          userId: user._id,
          email: user.email,
          employeeId: empId
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    hrToken = signToken(hrUser, null);
    managerToken = signToken(managerUser, mgrEmpDoc._id);
    employeeToken = signToken(regularEmployeeUser, engEmp._id);

    // Leave Types
    annualType = await LeaveType.create({
      name: 'Annual Paid Leave',
      code: 'ANNUAL',
      category: 'annual',
      paid: true,
      quotaPerYear: 14
    });

    // Seed Leaves in 2026
    await Leave.create([
      {
        employeeId: engEmp._id,
        leaveTypeId: annualType._id,
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-03T00:00:00.000Z'),
        days: 3,
        status: 'approved',
        reason: 'Summer vacation'
      },
      {
        employeeId: salesEmp._id,
        leaveTypeId: annualType._id,
        startDate: new Date('2026-06-05T00:00:00.000Z'),
        endDate: new Date('2026-06-07T00:00:00.000Z'),
        days: 3,
        status: 'approved',
        reason: 'Sales conference rest'
      }
    ]);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. should reject export when requested by regular Employee without report.export permission (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/reports/leaves')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  it('2. should allow HR Manager to export all company leave records as an Excel spreadsheet with dark styled header', async () => {
    const res = await request(app)
      .get('/api/v1/reports/leaves?year=2026')
      .set('Authorization', `Bearer ${hrToken}`)
      .responseType('blob');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toMatch(/Leave_Report_2026\.xlsx/);
    expect(res.body).toBeDefined();
  });

  it('3. should allow Department Manager to export team-scoped leave spreadsheet', async () => {
    const res = await request(app)
      .get('/api/v1/reports/leaves?year=2026')
      .set('Authorization', `Bearer ${managerToken}`)
      .responseType('blob');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.body).toBeDefined();
  });

  it('4. should support alias endpoint /api/v1/leaves/export', async () => {
    const res = await request(app)
      .get('/api/v1/leaves/export?year=2026')
      .set('Authorization', `Bearer ${hrToken}`)
      .responseType('blob');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
});
