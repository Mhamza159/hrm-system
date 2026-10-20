/**
 * @file leave.balance-query.test.js
 * @description Integration Tests for Live Leave Balance Query & Horizontal Scoping (BUILD-GUIDE Row 6.9).
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
import { LeaveType } from '../src/models/leaveType.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';

describe('Module M6 — Live Leave Balance Query & Quota Inspector (Slice 6.9-TEST)', () => {
  let adminToken, managerToken, employeeToken, otherEmpToken;
  let managerEmployeeId, subordinateEmployeeId, outsiderEmployeeId;
  let annualTypeId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_query');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});

    // Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const deptManagerRole = await Role.create({
      name: 'Department Manager',
      description: 'Manager',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard staff',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    // Leave Types
    const annualType = await LeaveType.create({
      name: 'Annual Leave',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      carryForwardMax: 5,
      isActive: true
    });
    annualTypeId = annualType._id;

    // Employees
    const managerEmp = await Employee.create({
      employeeCode: 'EMP-MGR-01',
      name: 'Manager Ali',
      email: 'manager.ali@company.pk',
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });
    managerEmployeeId = managerEmp._id;

    const subordinateEmp = await Employee.create({
      employeeCode: 'EMP-SUB-02',
      name: 'Subordinate Bilal',
      email: 'bilal.sub@company.pk',
      joiningDate: new Date('2024-05-01'),
      managerId: managerEmployeeId,
      status: 'Active'
    });
    subordinateEmployeeId = subordinateEmp._id;

    const outsiderEmp = await Employee.create({
      employeeCode: 'EMP-OUT-03',
      name: 'Outsider Tariq',
      email: 'tariq.out@company.pk',
      joiningDate: new Date('2024-06-01'),
      managerId: new mongoose.Types.ObjectId(), // Different manager
      status: 'Active'
    });
    outsiderEmployeeId = outsiderEmp._id;

    // Pre-populate subordinate balance: 14 allocated, 2 carried forward, 3 used, 1 pending
    await LeaveBalance.create({
      employeeId: subordinateEmployeeId,
      year: 2026,
      balances: [
        {
          leaveTypeId: annualTypeId,
          allocatedDays: 14,
          carriedForwardDays: 2,
          usedDays: 3,
          pendingDays: 1,
          encashedDays: 0
        }
      ]
    });

    // Users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin.m6@company.pk',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [superAdminRole._id]
    });
    adminToken = jwt.sign(
      { userId: adminUser._id, roles: ['Super Admin'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager.user@company.pk',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: managerEmployeeId,
      roles: [deptManagerRole._id]
    });
    managerToken = jwt.sign(
      { userId: managerUser._id, employeeId: managerEmployeeId, roles: [deptManagerRole] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const empUser = await User.create({
      name: 'Employee Bilal User',
      email: 'bilal.user@company.pk',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: subordinateEmployeeId,
      roles: [employeeRole._id]
    });
    employeeToken = jwt.sign(
      { userId: empUser._id, employeeId: subordinateEmployeeId, roles: [employeeRole] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const outsiderUser = await User.create({
      name: 'Outsider Tariq User',
      email: 'tariq.user@company.pk',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: outsiderEmployeeId,
      roles: [employeeRole._id]
    });
    otherEmpToken = jwt.sign(
      { userId: outsiderUser._id, employeeId: outsiderEmployeeId, roles: [employeeRole] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await mongoose.disconnect();
  }, 30000);

  it('1. Employee queries own live balance without query parameters (200 OK & correct available days)', async () => {
    const res = await request(app)
      .get('/api/v1/leaves/balance?year=2026')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId.toString()).toBe(subordinateEmployeeId.toString());
    expect(res.body.data.year).toBe(2026);

    const annual = res.body.data.balances.find(
      (b) => b.leaveType._id.toString() === annualTypeId.toString()
    );
    expect(annual).toBeDefined();
    // 14 allocated + 2 carried = 16 entitlement
    expect(annual.totalEntitlement).toBe(16);
    expect(annual.usedDays).toBe(3);
    expect(annual.pendingDays).toBe(1);
    // 16 - 3 used - 1 pending = 12 available days
    expect(annual.availableDays).toBe(12);
  });

  it('2. Department Manager queries subordinate team member balance with team scope (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/v1/leaves/balance?employeeId=${subordinateEmployeeId}&year=2026`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId.toString()).toBe(subordinateEmployeeId.toString());
  });

  it('3. Department Manager queries employee outside direct team reporting line (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/leaves/balance?employeeId=${outsiderEmployeeId}&year=2026`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not in your direct team/i);
  });

  it('4. Standard Employee queries another employee balance with own scope (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/leaves/balance?employeeId=${subordinateEmployeeId}&year=2026`)
      .set('Authorization', `Bearer ${otherEmpToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only have permission to view your own/i);
  });

  it('5. Super Admin queries any employee balance with all scope (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/v1/leaves/balance?employeeId=${outsiderEmployeeId}&year=2026`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId.toString()).toBe(outsiderEmployeeId.toString());
  });

  it('6. Querying uninitialized employee balance auto-initializes quota document', async () => {
    // managerEmployeeId has no balance yet in 2026
    const existing = await LeaveBalance.findOne({ employeeId: managerEmployeeId, year: 2026 });
    expect(existing).toBeNull();

    const res = await request(app)
      .get('/api/v1/leaves/balance?year=2026')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.balances.length).toBeGreaterThanOrEqual(1);

    const created = await LeaveBalance.findOne({ employeeId: managerEmployeeId, year: 2026 });
    expect(created).not.toBeNull();
  });
});
