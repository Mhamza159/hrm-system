/**
 * @file leave.attendance-sync.test.js
 * @description Integration Tests for Leave-Attendance Auto-Sync and AutoAbsent Protection (BUILD-GUIDE Row 6.12).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';
import { Leave } from '../src/models/leave.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import {
  initializeEmployeeLeaveBalances,
  syncLeaveToAttendance,
  cancelLeave
} from '../src/modules/leaves/leave.service.js';
import { runAutoAbsentSweep } from '../src/modules/attendance/jobs/autoAbsent.job.js';

describe('Module M6 — Attendance Linkage & Auto-Leave Synchronization (Slice 6.12-TEST)', () => {
  let employeeEmp, hrUser, annualType;
  const currentYear = new Date().getUTCFullYear();

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_att_sync');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Attendance.deleteMany({});

    const hrRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all' }]
    });

    hrUser = await User.create({
      email: 'hr.admin@att-sync.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [hrRole._id]
    });

    employeeEmp = await Employee.create({
      name: 'Tariq Mehmood',
      employeeCode: 'EMP-ATT-01',
      workEmail: 'tariq.att@example.com',
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });

    annualType = await LeaveType.create({
      name: 'Annual Paid Quota',
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

  it('1. should synchronize approved leave dates into Attendance as on_leave', async () => {
    // Monday to Tuesday
    const testStart = new Date(Date.UTC(2026, 4, 4, 0, 0, 0)); // Monday May 4, 2026
    const testEnd = new Date(Date.UTC(2026, 4, 5, 0, 0, 0)); // Tuesday May 5, 2026

    const leave = await Leave.create({
      employeeId: employeeEmp._id,
      leaveTypeId: annualType._id,
      startDate: testStart,
      endDate: testEnd,
      days: 2,
      halfDay: 'none',
      reason: 'Medical treatment in hospital',
      status: 'approved'
    });

    // Execute synchronization
    await syncLeaveToAttendance(leave);

    // Verify attendance collection has 2 records with status 'on_leave'
    const records = await Attendance.find({
      employeeId: employeeEmp._id,
      date: { $gte: testStart, $lte: testEnd }
    }).sort({ date: 1 });

    expect(records.length).toBe(2);
    expect(records[0].status).toBe('on_leave');
    expect(records[1].status).toBe('on_leave');
  });

  it('2. should verify that runAutoAbsentSweep skips staff on approved leave (zero false absences)', async () => {
    // Run the nightly auto-absent sweep on Monday May 4, 2026
    const testMonday = new Date(Date.UTC(2026, 4, 4, 0, 0, 0));
    const sweepResult = await runAutoAbsentSweep(testMonday);

    expect(sweepResult).toBeDefined();

    // Verify that the employee's attendance record for May 4 remains 'on_leave', NOT overwritten to 'absent'
    const att = await Attendance.findOne({
      employeeId: employeeEmp._id,
      date: testMonday
    });

    expect(att).toBeDefined();
    expect(att.status).toBe('on_leave');
  });

  it('3. should support half_day leave recording in Attendance', async () => {
    const testWed = new Date(Date.UTC(2026, 4, 6, 0, 0, 0)); // Wednesday May 6, 2026

    const halfDayLeave = await Leave.create({
      employeeId: employeeEmp._id,
      leaveTypeId: annualType._id,
      startDate: testWed,
      endDate: testWed,
      days: 0.5,
      halfDay: 'first_half',
      reason: 'Doctor appointment morning',
      status: 'approved'
    });

    await syncLeaveToAttendance(halfDayLeave);

    const halfDayAtt = await Attendance.findOne({
      employeeId: employeeEmp._id,
      date: testWed
    });

    expect(halfDayAtt).toBeDefined();
    expect(halfDayAtt.status).toBe('half_day');
  });

  it('4. should clean on_leave attendance records when approved leave is cancelled', async () => {
    // Future leave
    const futureDate = new Date(Date.UTC(2026, 11, 28, 0, 0, 0));

    const futureLeave = await Leave.create({
      employeeId: employeeEmp._id,
      leaveTypeId: annualType._id,
      startDate: futureDate,
      endDate: futureDate,
      days: 1,
      status: 'approved',
      reason: 'Winter year-end personal day'
    });

    await syncLeaveToAttendance(futureLeave);

    // Verify on_leave is present
    let att = await Attendance.findOne({ employeeId: employeeEmp._id, date: futureDate });
    expect(att).toBeDefined();
    expect(att.status).toBe('on_leave');

    // Populate roles on hrUser as authenticate middleware would
    const hrAdmin = await User.findById(hrUser._id).populate('roles');

    // Cancel the leave
    await cancelLeave(futureLeave._id, 'Holiday plans cancelled', hrAdmin);

    // Verify on_leave attendance record is deleted
    att = await Attendance.findOne({ employeeId: employeeEmp._id, date: futureDate });
    expect(att).toBeNull();
  });
});
