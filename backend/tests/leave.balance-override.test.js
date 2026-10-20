/**
 * @file leave.balance-override.test.js
 * @description Integration Tests for HR Manual Leave Balance Adjustment & Audit Trail (BUILD-GUIDE Row 6.14).
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
import { AuditLog } from '../src/models/auditLog.model.js';
import { initializeEmployeeLeaveBalances } from '../src/modules/leaves/leave.service.js';

describe('Module M6 — HR Manual Leave Balance Adjustment & Audit Trail (Slice 6.14-TEST)', () => {
  let hrToken, managerToken, employeeToken;
  let hrUser, managerUser, employeeUser;
  let employeeEmp;
  let annualType;
  let balanceDocId;
  const currentYear = new Date().getUTCFullYear();

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_override');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await AuditLog.deleteMany({});

    // Roles
    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.settings', subject: 'Leave', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' },
        { action: 'leave.approve', subject: 'Leave', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' }
      ]
    });

    employeeEmp = await Employee.create({
      name: 'Override Staff',
      employeeCode: 'EMP-OVR-01',
      workEmail: 'override.staff@example.com',
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    // Users
    hrUser = await User.create({
      email: 'hr.override@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [hrRole._id]
    });

    managerUser = await User.create({
      email: 'mgr.override@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [managerRole._id]
    });

    employeeUser = await User.create({
      email: 'override.staff@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: employeeEmp._id,
      roles: [employeeRole._id]
    });

    const signToken = (u, empId) =>
      jwt.sign({ userId: u._id, employeeId: empId, email: u.email }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    hrToken = signToken(hrUser, null);
    managerToken = signToken(managerUser, null);
    employeeToken = signToken(employeeUser, employeeEmp._id);

    annualType = await LeaveType.create({
      name: 'Annual Quota',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      isActive: true
    });

    const bal = await initializeEmployeeLeaveBalances(employeeEmp._id, currentYear);
    balanceDocId = bal._id;
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 30000);

  it('1. should reject manual balance adjustment when overrideReason is missing or too short', async () => {
    const res = await request(app)
      .patch(`/api/v1/leaves/balance/${balanceDocId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        balances: [
          {
            leaveTypeId: annualType._id,
            allocatedDays: 18
          }
        ],
        overrideReason: 'foo' // Less than 5 characters
      });

    expect(res.status).toBe(400);
  });

  it('2. should reject manual balance adjustment when requested by Department Manager or Employee (403 Forbidden)', async () => {
    const mgrRes = await request(app)
      .patch(`/api/v1/leaves/balance/${balanceDocId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        balances: [{ leaveTypeId: annualType._id, allocatedDays: 18 }],
        overrideReason: 'Department Manager attempting direct quota override'
      });

    expect(mgrRes.status).toBe(403);

    const empRes = await request(app)
      .patch(`/api/v1/leaves/balance/${balanceDocId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        balances: [{ leaveTypeId: annualType._id, allocatedDays: 18 }],
        overrideReason: 'Employee attempting direct quota override'
      });

    expect(empRes.status).toBe(403);
  });

  it('3. should allow HR Manager to override balance and record immutable audit log entry', async () => {
    const res = await request(app)
      .patch(`/api/v1/leaves/balance/${balanceDocId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        balances: [
          {
            leaveTypeId: annualType._id,
            allocatedDays: 16,
            carriedForwardDays: 2
          }
        ],
        overrideReason: 'COO Approved special quota adjustment for 2026 performance'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify document in DB
    const updated = await LeaveBalance.findById(balanceDocId);
    const cat = updated.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
    expect(cat.allocatedDays).toBe(16);
    expect(cat.carriedForwardDays).toBe(2);

    // Verify audit log entry
    const audit = await AuditLog.findOne({
      targetId: balanceDocId,
      action: 'LEAVE_BALANCE_OVERRIDE'
    });
    expect(audit).toBeDefined();
    expect(audit.actorId.toString()).toBe(hrUser._id.toString());
    expect(audit.details.overrideReason).toMatch(/COO Approved special quota adjustment/i);
  });
});
