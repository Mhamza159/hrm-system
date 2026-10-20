/**
 * @file leave.decision.test.js
 * @description Integration Tests for Leave Decision Workflow (Approve / Reject / Quota Settlement) (BUILD-GUIDE Row 6.7).
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
import { Attendance } from '../src/models/attendance.model.js';
import { initializeEmployeeLeaveBalances } from '../src/modules/leaves/leave.service.js';

describe('Module M6 — Leave Decision Workflow (Slice 6.7-TEST)', () => {
  let managerToken, hrToken, employeeToken;
  let managerUser, hrUser, employeeUser;
  let managerEmp, applicantEmp;
  let annualType;
  const currentYear = new Date().getUTCFullYear();

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_decisions');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Attendance.deleteMany({});

    // Roles
    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Department Manager',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' },
        { action: 'leave.approve', subject: 'Leave', scope: 'team' }
      ]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'HR Manager',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.approve', subject: 'Leave', scope: 'all' }
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
    managerUser = await User.create({
      email: 'manager.decision@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [managerRole._id]
    });

    hrUser = await User.create({
      email: 'hr.decision@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [hrRole._id]
    });

    employeeUser = await User.create({
      email: 'applicant.decision@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [employeeRole._id]
    });

    // Employees
    managerEmp = await Employee.create({
      userId: managerUser._id,
      name: 'Department Manager Emp',
      employeeCode: 'EMP-MGR-D01',
      workEmail: 'manager.decision@example.com',
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    applicantEmp = await Employee.create({
      userId: employeeUser._id,
      name: 'Applicant Staff Emp',
      employeeCode: 'EMP-STF-D02',
      workEmail: 'applicant.decision@example.com',
      joiningDate: new Date('2025-01-01'),
      managerId: managerEmp._id,
      status: 'Active'
    });

    // Tokens
    const signToken = (u) =>
      jwt.sign({ userId: u._id, email: u.email }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    managerToken = signToken(managerUser);
    hrToken = signToken(hrUser);
    employeeToken = signToken(employeeUser);

    annualType = await LeaveType.create({
      name: 'Annual Paid Leave',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      isActive: true
    });

    // Initialize balance
    await initializeEmployeeLeaveBalances(applicantEmp._id, currentYear);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. should advance step 1 to approved when Department Manager approves, keeping status pending for HR step 2', async () => {
    // Reserve 2 pending days in balance
    await LeaveBalance.updateOne(
      { employeeId: applicantEmp._id, year: currentYear, 'balances.leaveTypeId': annualType._id },
      { $inc: { 'balances.$.pendingDays': 2 } }
    );

    const leave = await Leave.create({
      employeeId: applicantEmp._id,
      leaveTypeId: annualType._id,
      startDate: new Date(Date.UTC(currentYear, 10, 10, 0, 0, 0)),
      endDate: new Date(Date.UTC(currentYear, 10, 11, 0, 0, 0)),
      days: 2,
      reason: 'Attending annual family wedding',
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
      .patch(`/api/v1/leaves/${leave._id}/decide`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'approve', reason: 'Recommended for approval by line manager' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.approvalChain[0].status).toBe('approved');
    expect(res.body.data.approvalChain[1].status).toBe('pending');
    expect(res.body.data.status).toBe('pending'); // Still pending until final HR step

    // Balance should still hold pendingDays = 2, usedDays = 0
    const balDoc = await LeaveBalance.findOne({ employeeId: applicantEmp._id, year: currentYear });
    const cat = balDoc.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
    expect(cat.pendingDays).toBe(2);
    expect(cat.usedDays).toBe(0);
  });

  it('2. should settle quota (pendingDays -> usedDays) and sync to Attendance when HR Manager final-approves', async () => {
    // Find previous leave to complete step 2
    const leave = await Leave.findOne({ employeeId: applicantEmp._id, status: 'pending' });
    expect(leave).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/decide`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ action: 'approve', reason: 'HR Final Sign-Off' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.approvalChain[1].status).toBe('approved');

    // Verify balance settlement: pendingDays decremented by 2, usedDays incremented by 2
    const balDoc = await LeaveBalance.findOne({ employeeId: applicantEmp._id, year: currentYear });
    const cat = balDoc.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
    expect(cat.pendingDays).toBe(0);
    expect(cat.usedDays).toBe(2);

    // Verify Attendance records synced with status: 'on_leave'
    const attRecords = await Attendance.find({
      employeeId: applicantEmp._id,
      status: 'on_leave'
    });
    expect(attRecords.length).toBeGreaterThanOrEqual(1);
  });

  it('3. should reject leave with mandatory reason, restoring pendingDays back to available quota', async () => {
    // Setup new pending leave for 3 days
    await LeaveBalance.updateOne(
      { employeeId: applicantEmp._id, year: currentYear, 'balances.leaveTypeId': annualType._id },
      { $inc: { 'balances.$.pendingDays': 3 } }
    );

    const leave = await Leave.create({
      employeeId: applicantEmp._id,
      leaveTypeId: annualType._id,
      startDate: new Date(Date.UTC(currentYear, 11, 15, 0, 0, 0)),
      endDate: new Date(Date.UTC(currentYear, 11, 17, 0, 0, 0)),
      days: 3,
      reason: 'Year end holiday trip',
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

    // Attempting rejection without adequate reason should fail validation
    const failRes = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/decide`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'reject', reason: '' });

    expect(failRes.status).toBe(400);

    // Rejection with valid reason
    const okRes = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/decide`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'reject', reason: 'High sprint workload during this release window' });

    expect(okRes.status).toBe(200);
    expect(okRes.body.success).toBe(true);
    expect(okRes.body.data.status).toBe('rejected');
    expect(okRes.body.data.decisionReason).toBe('High sprint workload during this release window');

    // Balance check: pendingDays decremented by 3, usedDays remains 2
    const balDoc = await LeaveBalance.findOne({ employeeId: applicantEmp._id, year: currentYear });
    const cat = balDoc.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
    expect(cat.pendingDays).toBe(0);
    expect(cat.usedDays).toBe(2);
  });

  it('4. should reject attempting to decide on an already processed (approved/rejected) leave', async () => {
    const rejectedLeave = await Leave.findOne({ employeeId: applicantEmp._id, status: 'rejected' });
    expect(rejectedLeave).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/leaves/${rejectedLeave._id}/decide`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'approve', reason: 'Attempt to re-approve rejected request' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only pending leaves can be approved or rejected/i);
  });
});
