/**
 * @file leave.cancellation.test.js
 * @description Integration Tests for Leave Cancellation & Quota/Attendance Restoration (BUILD-GUIDE Row 6.8).
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

describe('Module M6 — Leave Cancellation & Balance Restoration (Slice 6.8-TEST)', () => {
  let employeeToken, otherToken, hrToken;
  let employeeUser, otherUser, hrUser;
  let employeeEmp, otherEmp;
  let annualType;
  const currentYear = new Date().getUTCFullYear();

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_cancellation');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Attendance.deleteMany({});

    // Roles
    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard staff',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'HR Manager',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.settings', subject: 'Leave', scope: 'all' },
        { action: 'leave.approve', subject: 'Leave', scope: 'all' }
      ]
    });

    // Employees
    employeeEmp = await Employee.create({
      name: 'Staff Cancel Test',
      employeeCode: 'EMP-CNL-01',
      workEmail: 'cancel.emp1@example.com',
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });

    otherEmp = await Employee.create({
      name: 'Other Staff Emp',
      employeeCode: 'EMP-CNL-02',
      workEmail: 'other.emp2@example.com',
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });

    // Users
    employeeUser = await User.create({
      email: 'cancel.emp1@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: employeeEmp._id,
      roles: [employeeRole._id]
    });

    otherUser = await User.create({
      email: 'other.emp2@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: otherEmp._id,
      roles: [employeeRole._id]
    });

    hrUser = await User.create({
      email: 'hr.cancel@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [hrRole._id]
    });

    // Tokens
    const signToken = (u, empId) =>
      jwt.sign({ userId: u._id, employeeId: empId, email: u.email }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    employeeToken = signToken(employeeUser, employeeEmp._id);
    otherToken = signToken(otherUser, otherEmp._id);
    hrToken = signToken(hrUser, null);

    annualType = await LeaveType.create({
      name: 'Annual Quota',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      isActive: true
    });

    await initializeEmployeeLeaveBalances(employeeEmp._id, currentYear);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 30000);

  it('1. should cancel a pending leave and restore pendingDays in LeaveBalance', async () => {
    // Reserve 2 pending days
    await LeaveBalance.updateOne(
      { employeeId: employeeEmp._id, year: currentYear, 'balances.leaveTypeId': annualType._id },
      { $inc: { 'balances.$.pendingDays': 2 } }
    );

    const leave = await Leave.create({
      employeeId: employeeEmp._id,
      leaveTypeId: annualType._id,
      startDate: new Date(Date.UTC(currentYear, 10, 15, 0, 0, 0)),
      endDate: new Date(Date.UTC(currentYear, 10, 16, 0, 0, 0)),
      days: 2,
      reason: 'Trip to family in Lahore',
      status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/cancel`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ cancellationReason: 'Plans called off due to urgent meetings' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');

    // Balance check: pendingDays should be restored to 0
    const balDoc = await LeaveBalance.findOne({ employeeId: employeeEmp._id, year: currentYear });
    const cat = balDoc.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
    expect(cat.pendingDays).toBe(0);
    expect(cat.usedDays).toBe(0);
  });

  it('2. should cancel future approved leave, restore usedDays, and clear Attendance records', async () => {
    const futureStart = new Date(Date.UTC(currentYear, 11, 20, 0, 0, 0));
    const futureEnd = new Date(Date.UTC(currentYear, 11, 21, 0, 0, 0));

    // Simulate approved state: usedDays = 2
    await LeaveBalance.updateOne(
      { employeeId: employeeEmp._id, year: currentYear, 'balances.leaveTypeId': annualType._id },
      { $inc: { 'balances.$.usedDays': 2 } }
    );

    const leave = await Leave.create({
      employeeId: employeeEmp._id,
      leaveTypeId: annualType._id,
      startDate: futureStart,
      endDate: futureEnd,
      days: 2,
      reason: 'Future holiday break',
      status: 'approved'
    });

    // Create linked Attendance on_leave records
    await Attendance.create({
      employeeId: employeeEmp._id,
      date: futureStart,
      status: 'on_leave',
      notes: 'Approved Leave: Future holiday break'
    });
    await Attendance.create({
      employeeId: employeeEmp._id,
      date: futureEnd,
      status: 'on_leave',
      notes: 'Approved Leave: Future holiday break'
    });

    const res = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/cancel`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ cancellationReason: 'Rescheduled to next quarter' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');

    // Balance check: usedDays restored back to 0
    const balDoc = await LeaveBalance.findOne({ employeeId: employeeEmp._id, year: currentYear });
    const cat = balDoc.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
    expect(cat.usedDays).toBe(0);

    // Attendance records should be cleared
    const remainingAtt = await Attendance.find({
      employeeId: employeeEmp._id,
      status: 'on_leave',
      date: { $gte: futureStart, $lte: futureEnd }
    });
    expect(remainingAtt.length).toBe(0);
  });

  it('3. should reject cancellation of past approved leaves with 400', async () => {
    const pastStart = new Date(Date.UTC(2025, 0, 10, 0, 0, 0));
    const pastEnd = new Date(Date.UTC(2025, 0, 12, 0, 0, 0));

    const pastLeave = await Leave.create({
      employeeId: employeeEmp._id,
      leaveTypeId: annualType._id,
      startDate: pastStart,
      endDate: pastEnd,
      days: 3,
      reason: 'Past approved leave',
      status: 'approved'
    });

    const res = await request(app)
      .patch(`/api/v1/leaves/${pastLeave._id}/cancel`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ cancellationReason: 'Trying to cancel past leave' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cannot cancel an approved leave that has already commenced or occurred in the past/i);
  });

  it('4. should prevent another employee from cancelling someone else\'s leave', async () => {
    const leave = await Leave.create({
      employeeId: employeeEmp._id,
      leaveTypeId: annualType._id,
      startDate: new Date(Date.UTC(currentYear, 10, 25, 0, 0, 0)),
      endDate: new Date(Date.UTC(currentYear, 10, 26, 0, 0, 0)),
      days: 2,
      reason: 'Private leave',
      status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/cancel`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ cancellationReason: 'Malicious cancellation attempt' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden: You can only cancel your own leave applications/i);
  });
});
