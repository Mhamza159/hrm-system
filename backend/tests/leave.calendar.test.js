/**
 * @file leave.calendar.test.js
 * @description Integration Tests for Team Leave Conflict Calendar & Data Scoping (BUILD-GUIDE Row 6.10).
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
import { Holiday } from '../src/models/holiday.model.js';

describe('Module M6 — Team Leave Conflict Calendar (Slice 6.10-TEST)', () => {
  let hrToken, engManagerToken, salesManagerToken;
  let hrUser, engManagerUser, salesManagerUser;
  let engDept, salesDept;
  let engEmp1, engEmp2, salesEmp1;
  let annualType;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_calendar');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await LeaveType.deleteMany({});
    await Leave.deleteMany({});
    await Holiday.deleteMany({});

    // Roles
    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' }
      ]
    });

    // Departments
    engDept = await Department.create({ name: 'Engineering', code: 'ENG' });
    salesDept = await Department.create({ name: 'Sales & Growth', code: 'SALES' });

    // Employees
    const engMgrEmp = await Employee.create({
      name: 'Eng Lead',
      employeeCode: 'EMP-MGR-ENG',
      workEmail: 'eng.lead@example.com',
      departmentId: engDept._id,
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    const salesMgrEmp = await Employee.create({
      name: 'Sales Lead',
      employeeCode: 'EMP-MGR-SALES',
      workEmail: 'sales.lead@example.com',
      departmentId: salesDept._id,
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    engEmp1 = await Employee.create({
      name: 'Dev Ali',
      employeeCode: 'EMP-DEV-01',
      workEmail: 'dev.ali@example.com',
      departmentId: engDept._id,
      managerId: engMgrEmp._id,
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });

    engEmp2 = await Employee.create({
      name: 'Dev Bilal',
      employeeCode: 'EMP-DEV-02',
      workEmail: 'dev.bilal@example.com',
      departmentId: engDept._id,
      managerId: engMgrEmp._id,
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });

    salesEmp1 = await Employee.create({
      name: 'Sales Usman',
      employeeCode: 'EMP-SALES-01',
      workEmail: 'sales.usman@example.com',
      departmentId: salesDept._id,
      managerId: salesMgrEmp._id,
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });

    // Users
    hrUser = await User.create({
      email: 'hr.cal@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [hrRole._id]
    });

    engManagerUser = await User.create({
      email: 'eng.lead@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: engMgrEmp._id,
      roles: [managerRole._id]
    });
    engMgrEmp.userId = engManagerUser._id;
    await engMgrEmp.save();

    salesManagerUser = await User.create({
      email: 'sales.lead@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: salesMgrEmp._id,
      roles: [managerRole._id]
    });
    salesMgrEmp.userId = salesManagerUser._id;
    await salesMgrEmp.save();

    // Tokens
    const signToken = (u, empId) =>
      jwt.sign({ userId: u._id, employeeId: empId, email: u.email }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    hrToken = signToken(hrUser, null);
    engManagerToken = signToken(engManagerUser, engMgrEmp._id);
    salesManagerToken = signToken(salesManagerUser, salesMgrEmp._id);

    annualType = await LeaveType.create({
      name: 'Annual Quota',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      isActive: true
    });

    // Create a Gazetted Holiday in June 2026
    await Holiday.create({
      name: 'Mid-Year Special Holiday',
      date: new Date(Date.UTC(2026, 5, 17, 0, 0, 0)),
      year: 2026,
      type: 'gazetted',
      isActive: true
    });

    // Create approved overlapping leaves in Engineering (June 10 - June 12, 2026) -> triggers conflict
    await Leave.create({
      employeeId: engEmp1._id,
      leaveTypeId: annualType._id,
      startDate: new Date(Date.UTC(2026, 5, 10, 0, 0, 0)),
      endDate: new Date(Date.UTC(2026, 5, 12, 0, 0, 0)),
      days: 3,
      reason: 'Vacation',
      status: 'approved'
    });

    await Leave.create({
      employeeId: engEmp2._id,
      leaveTypeId: annualType._id,
      startDate: new Date(Date.UTC(2026, 5, 11, 0, 0, 0)),
      endDate: new Date(Date.UTC(2026, 5, 13, 0, 0, 0)),
      days: 3,
      reason: 'Personal work',
      status: 'approved'
    });

    // Create approved leave in Sales (June 20 - June 22, 2026)
    await Leave.create({
      employeeId: salesEmp1._id,
      leaveTypeId: annualType._id,
      startDate: new Date(Date.UTC(2026, 5, 20, 0, 0, 0)),
      endDate: new Date(Date.UTC(2026, 5, 22, 0, 0, 0)),
      days: 3,
      reason: 'Family retreat',
      status: 'approved'
    });
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 30000);

  it('1. should scope calendar for Engineering Manager to Engineering department employees only', async () => {
    const res = await request(app)
      .get('/api/v1/leaves/calendar?month=2026-06')
      .set('Authorization', `Bearer ${engManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.month).toBe('2026-06');

    // Engineering manager should see 2 leaves (engEmp1 & engEmp2) and NOT salesEmp1
    const leaves = res.body.data.leaves;
    expect(leaves.length).toBe(2);
    const hasSalesEmp = leaves.some((l) => l.employeeId?.name === 'Sales Usman');
    expect(hasSalesEmp).toBe(false);
  });

  it('2. should detect and return team capacity conflicts when >= 2 department peers are away on the same day', async () => {
    const res = await request(app)
      .get('/api/v1/leaves/calendar?month=2026-06')
      .set('Authorization', `Bearer ${engManagerToken}`);

    expect(res.status).toBe(200);
    const conflicts = res.body.data.conflicts;

    // Both engEmp1 and engEmp2 are off on June 11 and June 12
    expect(conflicts.length).toBeGreaterThanOrEqual(2);
    const june11Conflict = conflicts.find((c) => c.date === '2026-06-11');
    expect(june11Conflict).toBeDefined();
    expect(june11Conflict.count).toBe(2);
  });

  it('3. should allow HR Manager to view all company leaves or filter by departmentId', async () => {
    // Unfiltered HR request
    const allRes = await request(app)
      .get('/api/v1/leaves/calendar?month=2026-06')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(allRes.status).toBe(200);
    // HR sees all 3 leaves (2 Eng + 1 Sales)
    expect(allRes.body.data.leaves.length).toBe(3);
    expect(allRes.body.data.holidays.length).toBe(1);
    expect(allRes.body.data.holidays[0].name).toBe('Mid-Year Special Holiday');

    // Filtered by Sales department
    const salesRes = await request(app)
      .get(`/api/v1/leaves/calendar?month=2026-06&departmentId=${salesDept._id}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(salesRes.status).toBe(200);
    expect(salesRes.body.data.leaves.length).toBe(1);
    expect(salesRes.body.data.leaves[0].employeeId?.name).toBe('Sales Usman');
  });
});
