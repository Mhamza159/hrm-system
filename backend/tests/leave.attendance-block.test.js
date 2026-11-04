/**
 * @file leave.attendance-block.test.js
 * @description Integration Tests: Blocking Attendance Punch on Approved Leave and Unlocking upon Cancellation.
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
import { normalizeToUtcMidnight } from '../src/modules/attendance/attendance.service.js';

describe('Leave-Guarded Attendance Punch Verification', () => {
  let employeeToken;
  let employeeUser, employeeEmp, annualType;
  const currentYear = new Date().getUTCFullYear();
  const todayUtc = normalizeToUtcMidnight(new Date());

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_leave_att_block');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Attendance.deleteMany({});

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard staff',
      isSystem: false,
      permissions: [
        { action: 'attendance.view', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    employeeEmp = await Employee.create({
      name: 'Leave Blocked Employee',
      employeeCode: 'EMP-LV-BLK-01',
      workEmail: 'leave.block@example.com',
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });

    employeeUser = await User.create({
      email: 'leave.block@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: employeeEmp._id,
      roles: [employeeRole._id]
    });

    annualType = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CL',
      annualQuota: 14,
      paid: true,
      requiresProof: false
    });

    await LeaveBalance.create({
      employeeId: employeeEmp._id,
      year: currentYear,
      balances: [
        {
          leaveTypeId: annualType._id,
          quota: 14,
          usedDays: 1,
          pendingDays: 0
        }
      ]
    });

    employeeToken = jwt.sign(
      {
        userId: employeeUser._id,
        email: employeeUser.email,
        role: 'Employee',
        roles: ['Employee'],
        roleId: employeeRole._id,
        employeeId: employeeEmp._id
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. should block check-in with 400 when an approved leave exists for today', async () => {
    // Create an approved leave for today
    const approvedLeave = await Leave.create({
      employeeId: employeeEmp._id,
      leaveTypeId: annualType._id,
      startDate: todayUtc,
      endDate: todayUtc,
      days: 1,
      reason: 'Personal family emergency',
      status: 'approved'
    });

    // Attempt clock in
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ source: 'web' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Attendance punch is blocked while on leave/i);
    expect(res.body.errors[0]?.code).toBe('ON_APPROVED_LEAVE');

    // Attendance record should NOT have a checkIn timestamp
    const att = await Attendance.findOne({ employeeId: employeeEmp._id, date: todayUtc });
    expect(att?.checkIn).toBeFalsy();
  });

  it('2. should return todayLeave details in /api/v1/attendance/my so UI can show OnLeaveModal', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/my')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.todayLeave).toBeDefined();
    expect(res.body.data.todayLeave.leaveType).toBe('Casual Leave');
  });

  it('3. should allow employee to cancel their leave and subsequently punch attendance successfully', async () => {
    const activeLeave = await Leave.findOne({ employeeId: employeeEmp._id, status: 'approved' });
    expect(activeLeave).toBeTruthy();

    // Cancel the approved leave
    const cancelRes = await request(app)
      .patch(`/api/v1/leaves/${activeLeave._id}/cancel`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ cancellationReason: 'Cancelled to report to office and mark attendance' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('cancelled');

    // Now attempt clock in again
    const punchRes = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ source: 'web' });

    expect(punchRes.status).toBe(200);
    expect(punchRes.body.success).toBe(true);
    expect(punchRes.body.data.checkIn).toBeDefined();

    // Verify attendance is now present and active
    const finalAtt = await Attendance.findOne({ employeeId: employeeEmp._id, date: todayUtc });
    expect(finalAtt.checkIn).toBeTruthy();
    expect(['present', 'half_day', 'late']).toContain(finalAtt.status);
  });
});
