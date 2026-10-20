/**
 * @file leave.approval-chain.test.js
 * @description Integration Tests for Multi-Level Approval Chain & M26.14 Delegation (BUILD-GUIDE Row 6.6).
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
import { Delegation } from '../src/models/delegation.model.js';
import { buildApprovalChain } from '../src/modules/leaves/leave.service.js';

describe('Module M6 — Multi-Level Approval Chain & M26.14 Delegation (Slice 6.6-TEST)', () => {
  let adminToken, managerToken, delegateToken, unauthorizedToken;
  let adminUser, managerUser, delegateUser, normalUser;
  let applicantEmp, managerEmp, delegateEmp;
  let annualType;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_approval_chain');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Delegation.deleteMany({});

    // Roles
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

    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Team lead',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' },
        { action: 'leave.approve', subject: 'Leave', scope: 'team' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard employee',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    // Users
    adminUser = await User.create({
      email: 'admin.approvals@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [adminRole._id]
    });

    managerUser = await User.create({
      email: 'manager.dept@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [managerRole._id]
    });

    delegateUser = await User.create({
      email: 'delegate.lead@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [employeeRole._id] // Initially normal employee role, but with active delegation
    });

    normalUser = await User.create({
      email: 'unauth.user@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [employeeRole._id]
    });

    const applicantUser = await User.create({
      email: 'applicant.emp@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [employeeRole._id]
    });

    // Employees
    managerEmp = await Employee.create({
      userId: managerUser._id,
      name: 'Department Manager Emp',
      employeeCode: 'EMP-MGR-001',
      workEmail: 'manager.dept@example.com',
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    delegateEmp = await Employee.create({
      userId: delegateUser._id,
      name: 'Designated Substitute Emp',
      employeeCode: 'EMP-DEL-002',
      workEmail: 'delegate.lead@example.com',
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    applicantEmp = await Employee.create({
      userId: applicantUser._id,
      name: 'Applicant Emp',
      employeeCode: 'EMP-APP-003',
      workEmail: 'applicant.emp@example.com',
      joiningDate: new Date('2025-01-01'),
      managerId: managerEmp._id, // Reports to managerEmp
      status: 'Active'
    });

    // Tokens
    const signToken = (u) =>
      jwt.sign({ userId: u._id, email: u.email }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    adminToken = signToken(adminUser);
    managerToken = signToken(managerUser);
    delegateToken = signToken(delegateUser);
    unauthorizedToken = signToken(normalUser);

    annualType = await LeaveType.create({
      name: 'Annual Vacation',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      isActive: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. should dynamically build multi-level approval chain: Dept Manager -> HR Manager -> Super Admin (for duration > 5 days)', async () => {
    // Net days = 6 (> 5 days triggers Level 3 Super Admin)
    const chainLong = await buildApprovalChain(applicantEmp, 6);
    expect(chainLong).toBeDefined();
    expect(chainLong.length).toBe(3);
    expect(chainLong[0].approverRole).toBe('Department Manager');
    expect(chainLong[0].approverId.toString()).toBe(managerUser._id.toString());
    expect(chainLong[1].approverRole).toBe('HR Manager');
    expect(chainLong[2].approverRole).toBe('Super Admin');

    // Net days = 2 (<= 5 days does not trigger Level 3)
    const chainShort = await buildApprovalChain(applicantEmp, 2);
    expect(chainShort.length).toBe(2);
    expect(chainShort[0].approverRole).toBe('Department Manager');
    expect(chainShort[1].approverRole).toBe('HR Manager');
  });

  it('2. should allow reporting Department Manager to see pending request in approval queue', async () => {
    const leave = await Leave.create({
      employeeId: applicantEmp._id,
      leaveTypeId: annualType._id,
      startDate: new Date('2026-11-02T00:00:00.000Z'),
      endDate: new Date('2026-11-04T00:00:00.000Z'),
      days: 3,
      reason: 'Mid-term vacation trip',
      status: 'pending',
      approvalChain: [
        {
          step: 1,
          approverRole: 'Department Manager',
          approverId: managerUser._id,
          status: 'pending'
        },
        {
          step: 2,
          approverRole: 'HR Manager',
          approverId: null,
          status: 'pending'
        }
      ]
    });

    const res = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const found = res.body.data.find((i) => i._id === leave._id.toString());
    expect(found).toBeDefined();
    expect(found.days).toBe(3);
  });

  it('3. should allow delegated substitute to see and approve request when active delegation exists', async () => {
    // Create pending leave assigned to manager
    const leave = await Leave.create({
      employeeId: applicantEmp._id,
      leaveTypeId: annualType._id,
      startDate: new Date('2026-11-10T00:00:00.000Z'),
      endDate: new Date('2026-11-12T00:00:00.000Z'),
      days: 3,
      reason: 'Urgent family engagement',
      status: 'pending',
      approvalChain: [
        {
          step: 1,
          approverRole: 'Department Manager',
          approverId: managerUser._id,
          status: 'pending'
        },
        {
          step: 2,
          approverRole: 'HR Manager',
          approverId: null,
          status: 'pending'
        }
      ]
    });

    // Without delegation, delegateToken should not have permission or see it
    const beforeRes = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${delegateToken}`);

    expect(beforeRes.status).toBe(403);

    // Now establish an active M26.14 delegation from managerUser to delegateUser
    const now = new Date();
    await Delegation.create({
      fromUserId: managerUser._id,
      toUserId: delegateUser._id,
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Started yesterday
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
      permissions: [{ action: 'leave.approve', subject: 'Leave', scope: 'team' }],
      reason: 'On business travel, delegating team leave approvals',
      status: 'active'
    });

    // With active delegation, delegate can access approval queue
    const afterRes = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${delegateToken}`);

    expect(afterRes.status).toBe(200);
    expect(afterRes.body.success).toBe(true);
    const found = afterRes.body.data.find((i) => i._id === leave._id.toString());
    expect(found).toBeDefined();

    // Delegate can approve Step 1
    const decideRes = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/decide`)
      .set('Authorization', `Bearer ${delegateToken}`)
      .send({ action: 'approve', reason: 'Approved by delegate during manager absence' });

    expect(decideRes.status).toBe(200);
    expect(decideRes.body.success).toBe(true);
    const updatedLeave = decideRes.body.data;
    expect(updatedLeave.approvalChain[0].status).toBe('approved');
    expect(updatedLeave.approvalChain[0].delegatedFrom.toString()).toBe(managerUser._id.toString());
    expect(updatedLeave.status).toBe('pending'); // Step 2 (HR) is still pending
  });

  it('4. should prevent unauthorized user from deciding on leave application', async () => {
    const leave = await Leave.create({
      employeeId: applicantEmp._id,
      leaveTypeId: annualType._id,
      startDate: new Date('2026-11-20T00:00:00.000Z'),
      endDate: new Date('2026-11-21T00:00:00.000Z'),
      days: 2,
      reason: 'Personal work',
      status: 'pending',
      approvalChain: [
        {
          step: 1,
          approverRole: 'Department Manager',
          approverId: managerUser._id,
          status: 'pending'
        }
      ]
    });

    const res = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/decide`)
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .send({ action: 'approve', reason: 'Attempt unauthorized approval' });

    expect(res.status).toBe(403);
  });
});
