/**
 * @file leave.dept-manager-approval.test.js
 * @description Integration test for Direct Single-Tier Super Admin Leave Approval for Department Managers.
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
import { Leave } from '../src/models/leave.model.js';
import { Notification } from '../src/models/notification.model.js';
import { buildApprovalChain } from '../src/modules/leaves/leave.service.js';

describe('Module M6 — Direct Single-Tier Super Admin Leave Approval for Department Managers', () => {
  let adminToken, hrToken, managerToken, employeeToken;
  let adminUser, hrUser, managerUser, employeeUser;
  let managerEmp, regularEmp;
  let casualLeaveType;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_dept_manager_approval');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Notification.deleteMany({});

    // 1. Roles
    const adminRole = await Role.create({
      name: 'Super Admin',
      description: 'Super administrator',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.approve', subject: 'Leave', scope: 'all' },
        { action: 'leave.apply', subject: 'Leave', scope: 'all' }
      ]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'Human Resources Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.approve', subject: 'Leave', scope: 'all' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Department Manager',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' },
        { action: 'leave.approve', subject: 'Leave', scope: 'team' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Regular Employee',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    // 2. Users
    adminUser = await User.create({
      email: 'superadmin.test@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [adminRole._id],
      isActive: true
    });

    hrUser = await User.create({
      email: 'hr.manager.test@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [hrRole._id],
      isActive: true
    });

    managerUser = await User.create({
      email: 'dept.manager.test@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [managerRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'regular.employee.test@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [employeeRole._id],
      isActive: true
    });

    // 3. Employees
    managerEmp = await Employee.create({
      userId: managerUser._id,
      name: 'Department Manager Test',
      employeeCode: 'EMP-DM-001',
      workEmail: 'dept.manager.test@example.com',
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    regularEmp = await Employee.create({
      userId: employeeUser._id,
      name: 'Regular Employee Test',
      employeeCode: 'EMP-REG-002',
      workEmail: 'regular.employee.test@example.com',
      joiningDate: new Date('2025-01-01'),
      managerId: managerEmp._id,
      status: 'Active'
    });

    // 4. Tokens
    const signToken = (u) =>
      jwt.sign({ userId: u._id, email: u.email }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    adminToken = signToken(adminUser);
    hrToken = signToken(hrUser);
    managerToken = signToken(managerUser);
    employeeToken = signToken(employeeUser);

    // 5. Leave Type & Balances
    casualLeaveType = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CASUAL',
      daysPerYear: 10,
      isPaid: true,
      isActive: true
    });

    const currentYear = new Date().getFullYear();
    await LeaveBalance.create({
      employeeId: managerEmp._id,
      year: currentYear,
      balances: [
        {
          leaveTypeId: casualLeaveType._id,
          allocatedDays: 10,
          carriedForwardDays: 0,
          usedDays: 0,
          pendingDays: 0
        }
      ]
    });

    await LeaveBalance.create({
      employeeId: regularEmp._id,
      year: currentYear,
      balances: [
        {
          leaveTypeId: casualLeaveType._id,
          allocatedDays: 10,
          carriedForwardDays: 0,
          usedDays: 0,
          pendingDays: 0
        }
      ]
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('US1: Department Manager leave application produces single-tier Super Admin approval chain', async () => {
    const chain = await buildApprovalChain(managerEmp, 3);
    expect(chain).toHaveLength(1);
    expect(chain[0].step).toBe(1);
    expect(chain[0].approverRole).toBe('Super Admin');
    expect(chain[0].approverId).toBeNull();
    expect(chain[0].status).toBe('pending');
  });

  it('US1: Regular employee leave application retains multi-tier approval chain (Zero Regression)', async () => {
    const chain = await buildApprovalChain(regularEmp, 3);
    expect(chain.length).toBeGreaterThanOrEqual(2);
    expect(chain[0].approverRole).toBe('Department Manager');
    expect(chain[1].approverRole).toBe('HR Manager');
  });

  it('US1 & US2: Applying as Department Manager via API creates 1-tier chain and dispatches Super Admin notification', async () => {
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        leaveTypeId: casualLeaveType._id.toString(),
        startDate: '2026-06-10',
        endDate: '2026-06-12',
        reason: 'Leadership conference trip'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.approvalChain).toHaveLength(1);
    expect(res.body.data.approvalChain[0].approverRole).toBe('Super Admin');
    expect(res.body.data.approvalChain[0].status).toBe('pending');

    // Check notification in database
    const notif = await Notification.findOne({
      userId: adminUser._id,
      type: 'leave'
    });
    expect(notif).not.toBeNull();
    expect(notif.title).toContain('Management Leave Application');
  });

  it('US3: HR Manager cannot decide on Department Manager leave (HTTP 403 Forbidden)', async () => {
    // Find the pending leave created by the Department Manager
    const dmLeave = await Leave.findOne({ employeeId: managerEmp._id, status: 'pending' });
    expect(dmLeave).not.toBeNull();

    const res = await request(app)
      .patch(`/api/v1/leaves/${dmLeave._id}/decide`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        action: 'approve',
        reason: 'HR approving Dept Manager leave unauthorized'
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Super Admin');
  });

  it('US3: Super Admin can decide on Department Manager leave (HTTP 200 OK)', async () => {
    const dmLeave = await Leave.findOne({ employeeId: managerEmp._id, status: 'pending' });
    expect(dmLeave).not.toBeNull();

    const res = await request(app)
      .patch(`/api/v1/leaves/${dmLeave._id}/decide`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'approve',
        reason: 'Approved by Super Admin executive review'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.approvalChain[0].status).toBe('approved');

    // Verify balance was deducted
    const balance = await LeaveBalance.findOne({ employeeId: managerEmp._id });
    const casual = balance.balances.find((b) => b.leaveTypeId.toString() === casualLeaveType._id.toString());
    expect(casual.usedDays).toBe(3);
    expect(casual.pendingDays).toBe(0);
  });
});

