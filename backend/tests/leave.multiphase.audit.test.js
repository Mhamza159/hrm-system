/**
 * @file leave.multiphase.audit.test.js
 * @description Integration Tests for Two-Phase Leave Approval, Applicant Audit Dossier, and HR Notification Workflow.
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

describe('Module M6 — Multi-Phase Leave Workflow & Applicant Audit (Slice 6.7-Audit)', () => {
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

    const managerRole = await Role.findOneAndUpdate(
      { name: 'Department Manager' },
      {
        name: 'Department Manager',
        permissions: [
          { action: 'leave.view', subject: 'Leave', scope: 'team' },
          { action: 'leave.approve', subject: 'Leave', scope: 'team' }
        ]
      },
      { upsert: true, new: true }
    );

    const hrRole = await Role.findOneAndUpdate(
      { name: 'HR Manager' },
      {
        name: 'HR Manager',
        permissions: [
          { action: 'leave.view', subject: 'Leave', scope: 'all' },
          { action: 'leave.approve', subject: 'Leave', scope: 'all' }
        ]
      },
      { upsert: true, new: true }
    );

    const empRole = await Role.findOneAndUpdate(
      { name: 'Employee' },
      {
        name: 'Employee',
        permissions: [
          { action: 'leave.apply', subject: 'Leave', scope: 'own' },
          { action: 'leave.view', subject: 'Leave', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    managerUser = await User.create({
      email: 'audit.mgr@company.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [managerRole._id],
      status: 'active'
    });

    hrUser = await User.create({
      email: 'audit.hr@company.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [hrRole._id],
      status: 'active'
    });

    employeeUser = await User.create({
      email: 'audit.emp@company.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [empRole._id],
      status: 'active'
    });

    managerEmp = await Employee.create({
      userId: managerUser._id,
      employeeCode: 'MGR-AUD-01',
      name: 'Manager Audit Lead',
      email: managerUser.email,
      status: 'Active'
    });

    applicantEmp = await Employee.create({
      userId: employeeUser._id,
      employeeCode: 'EMP-AUD-01',
      name: 'Applicant Audit Tester',
      email: employeeUser.email,
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
      name: 'Annual Paid Vacation',
      code: 'APV',
      daysPerYear: 15,
      isPaid: true,
      requiresAttachment: false,
      isActive: true
    });

    await initializeEmployeeLeaveBalances(applicantEmp._id, currentYear);

    // Create seed attendance records for applicant (past 10 days)
    const today = new Date();
    for (let i = 1; i <= 10; i++) {
      const attDate = new Date(today);
      attDate.setDate(today.getDate() - i);
      attDate.setUTCHours(0, 0, 0, 0);

      await Attendance.create({
        employeeId: applicantEmp._id,
        date: attDate,
        status: i % 4 === 0 ? 'late' : 'present'
      });
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. HR cannot see newly applied leave until Step 1 Dept Manager approves it', async () => {
    // Tomorrow onwards
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(tomorrow.getDate() + 3);

    const startStr = tomorrow.toISOString().split('T')[0];
    const endStr = dayAfter.toISOString().split('T')[0];

    // Employee applies for a 3-day leave (chain: Step 1 Dept Manager, Step 2 HR Manager)
    const applyRes = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: annualType._id,
        startDate: startStr,
        endDate: endStr,
        reason: 'Family wedding trip requiring 3 working days'
      });

    expect(applyRes.status).toBe(201);
    const leaveId = applyRes.body.data?._id;

    // Dept Manager sees the leave in their pending approvals queue
    const mgrPending = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(mgrPending.status).toBe(200);
    const mgrItems = Array.isArray(mgrPending.body.data) ? mgrPending.body.data : mgrPending.body.data.items || [];
    expect(mgrItems.some((l) => l._id.toString() === leaveId.toString())).toBe(true);

    // HR Manager does NOT see the leave yet because Step 1 has not been approved!
    const hrPendingBefore = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(hrPendingBefore.status).toBe(200);
    const hrItemsBefore = Array.isArray(hrPendingBefore.body.data) ? hrPendingBefore.body.data : hrPendingBefore.body.data.items || [];
    expect(hrItemsBefore.some((l) => l._id.toString() === leaveId.toString())).toBe(false);

    // 2. Dept Manager inspects applicant audit before decision
    const auditRes = await request(app)
      .get(`/api/v1/leaves/${leaveId}/audit`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.employee.employeeCode).toBe('EMP-AUD-01');
    expect(auditRes.body.data.attendanceStats.totalRecordedDays).toBe(10);
    expect(auditRes.body.data.attendanceStats.present).toBeGreaterThan(0);
    expect(auditRes.body.data.balances.length).toBeGreaterThan(0);

    // 3. Dept Manager approves Step 1
    const approveStep1 = await request(app)
      .patch(`/api/v1/leaves/${leaveId}/decide`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        action: 'approve',
        reason: 'Audit verified. Attendance history and quota balance verified.'
      });

    expect(approveStep1.status).toBe(200);
    expect(approveStep1.body.data.status).toBe('pending');
    expect(approveStep1.body.data.approvalChain[0].status).toBe('approved');
    expect(approveStep1.body.data.approvalChain[1].status).toBe('pending');

    // 4. Leave has now transitioned to Phase 2 (HR Manager)!
    // Dept Manager no longer has this in their pending queue
    const mgrPendingAfter = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${managerToken}`);
    const mgrItemsAfter = Array.isArray(mgrPendingAfter.body.data) ? mgrPendingAfter.body.data : mgrPendingAfter.body.data.items || [];
    expect(mgrItemsAfter.some((l) => l._id.toString() === leaveId.toString())).toBe(false);

    // HR Manager NOW sees the leave in their pending approvals queue!
    const hrPendingAfter = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(hrPendingAfter.status).toBe(200);
    const hrItemsAfter = Array.isArray(hrPendingAfter.body.data) ? hrPendingAfter.body.data : hrPendingAfter.body.data.items || [];
    expect(hrItemsAfter.some((l) => l._id.toString() === leaveId.toString())).toBe(true);

    // 5. HR executes Step 2 final approval
    const hrApproveRes = await request(app)
      .patch(`/api/v1/leaves/${leaveId}/decide`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        action: 'approve',
        reason: 'HR governance approved. Approved by Dept Manager in Step 1.'
      });

    expect(hrApproveRes.status).toBe(200);
    expect(hrApproveRes.body.data.status).toBe('approved');
    expect(hrApproveRes.body.data.approvalChain[1].status).toBe('approved');
  });

  describe('Same-Day & Attendance Punch Validation Rules', () => {
    it('Rule 2: User cannot apply leave for previous/past dates', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2); // 2 days ago to ensure not current day
      const pastStr = yesterday.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualType._id,
          startDate: pastStr,
          endDate: pastStr,
          halfDay: 'none',
          reason: 'Attempting retroactive past date leave',
          assertPastBlocked: true
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be applied for past dates/i);
    });

    it('Rule 1 & 3: User CAN apply for 1st half leave today when they have NOT punched attendance', async () => {
      const todayStr = new Date().toISOString().split('T')[0];

      // Ensure no attendance record exists for applicantEmp today
      const todayUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
      await Attendance.deleteOne({ employeeId: applicantEmp._id, date: todayUtc });

      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualType._id,
          startDate: todayStr,
          endDate: todayStr,
          halfDay: 'first_half',
          reason: 'Personal morning work, applying 1st half before clock in'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.halfDay).toBe('first_half');
      expect(res.body.data.days).toBe(0.5);

      // Clean up for next test
      await Leave.deleteOne({ _id: res.body.data._id });
    });

    it('Rule 1: 1st half leave for today is REJECTED if user has already punched attendance', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

      // Create attendance check-in for today
      await Attendance.findOneAndUpdate(
        { employeeId: applicantEmp._id, date: todayUtc },
        {
          employeeId: applicantEmp._id,
          date: todayUtc,
          checkIn: new Date(),
          status: 'present'
        },
        { upsert: true, new: true }
      );

      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualType._id,
          startDate: todayStr,
          endDate: todayStr,
          halfDay: 'first_half',
          reason: 'Attempting 1st half after punching attendance'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already punched your attendance/i);
    });

    it('Rule 3: 2nd half leave for today is REJECTED if user has NOT punched attendance', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

      // Remove today's punch
      await Attendance.deleteOne({ employeeId: applicantEmp._id, date: todayUtc });

      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualType._id,
          startDate: todayStr,
          endDate: todayStr,
          halfDay: 'second_half',
          reason: 'Attempting 2nd half without checking in first'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/without punching attendance first/i);
    });

    it('Rule 4: 2nd half leave for today is REJECTED if midday cutoff time has passed', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

      // Set attendance record for today (user has clocked in)
      await Attendance.findOneAndUpdate(
        { employeeId: applicantEmp._id, date: todayUtc },
        {
          employeeId: applicantEmp._id,
          date: todayUtc,
          checkIn: new Date(Date.now() - 4 * 3600000),
          status: 'present'
        },
        { upsert: true, new: true }
      );

      // Create a shift where midday cutoff has definitely passed (e.g. shift from 00:00, halfDay: 60 mins -> cutoff 01:00 AM)
      const { Shift } = await import('../src/models/shift.model.js');
      const earlyShift = await Shift.create({
        name: 'Early Morning Cutoff Test Shift',
        code: `SH-CUT-${Date.now()}`,
        startTime: '01:00',
        endTime: '09:00',
        halfDayMinutes: 60 // Cutoff was 02:00 AM, definitely passed by now
      });

      await Employee.findByIdAndUpdate(applicantEmp._id, { shiftId: earlyShift._id });

      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualType._id,
          startDate: todayStr,
          endDate: todayStr,
          halfDay: 'second_half',
          reason: 'Attempting 2nd half after shift midday cutoff passed'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/midday cutoff time.*has already passed/i);
    });
  });
});
