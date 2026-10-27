/**
 * @file seedJulyPayrollData.js
 * @description Seeds comprehensive July 2026 dataset across all employees:
 * - Daily Attendance (Presents, Lates, WFH, Absents, Gazetted Holidays)
 * - Approved Overtime Hours
 * - Paid Leaves (Casual, Annual, Sick)
 * - Unpaid Leaves (LWP)
 * - Work From Home (WFH) Approved Requests
 * - Pre-Payroll Attendance MonthLock for '2026-07'
 * 
 * NOTE: Does NOT generate the payroll run itself. The user will trigger generation from the UI.
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import '../models/role.model.js';
import '../models/setting.model.js';
import '../models/department.model.js';
import '../models/designation.model.js';
import { User } from '../models/user.model.js';
import { Employee } from '../models/employee.model.js';
import { Shift } from '../models/shift.model.js';
import { SalaryStructure } from '../models/salaryStructure.model.js';
import { LeaveType } from '../models/leaveType.model.js';
import { Leave } from '../models/leave.model.js';
import { Attendance } from '../models/attendance.model.js';
import { MonthLock } from '../models/monthLock.model.js';
import { PayrollRun } from '../models/payrollRun.model.js';
import { Payslip } from '../models/payslip.model.js';
import { WFHRequest } from '../models/wfh.model.js';

export async function seedJulyPayrollData() {
  console.log('🚀 [July Data Seed] Preparing July 2026 Attendance, Leaves, WFH, and Overtime...');
  await connectDB();

  // 1. Fetch Admin User
  const adminUser = await User.findOne({ isActive: true });
  if (!adminUser) throw new Error('No active admin user found in database.');

  // 2. Fetch all active employees
  const employees = await Employee.find({ isDeleted: false, status: { $ne: 'Terminated' } })
    .populate('departmentId')
    .populate('designationId');

  console.log(`📋 Found ${employees.length} active employees.`);

  // 3. Ensure Shift exists
  let shift = await Shift.findOne({ code: 'GEN-01' });
  if (!shift) {
    shift = await Shift.create({
      name: 'General Corporate Shift',
      code: 'GEN-01',
      type: 'fixed',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      breakMinutes: 60,
      halfDayMinutes: 240
    });
  }

  // 4. Ensure Leave Types exist
  let casualType = await LeaveType.findOne({ code: 'CASUAL' });
  if (!casualType) {
    casualType = await LeaveType.create({ name: 'Casual Leave', code: 'CASUAL', daysPerYear: 10, isPaid: true });
  }

  let annualType = await LeaveType.findOne({ code: 'ANNUAL' });
  if (!annualType) {
    annualType = await LeaveType.create({ name: 'Annual Leave', code: 'ANNUAL', daysPerYear: 14, isPaid: true });
  }

  let sickType = await LeaveType.findOne({ code: 'SICK' });
  if (!sickType) {
    sickType = await LeaveType.create({ name: 'Sick Leave', code: 'SICK', daysPerYear: 8, isPaid: true });
  }

  let unpaidType = await LeaveType.findOne({ code: 'UNPAID' });
  if (!unpaidType) {
    unpaidType = await LeaveType.create({ name: 'Unpaid Leave (LWP)', code: 'UNPAID', daysPerYear: 30, isPaid: false });
  }

  // Clean existing July 2026 data
  const julStart = new Date(Date.UTC(2026, 6, 1, 0, 0, 0));
  const julEnd = new Date(Date.UTC(2026, 6, 31, 23, 59, 59, 999));

  await Attendance.deleteMany({ date: { $gte: julStart, $lte: julEnd } });
  await Leave.deleteMany({ startDate: { $gte: julStart, $lte: julEnd } });
  await WFHRequest.deleteMany({ date: { $gte: julStart, $lte: julEnd } });

  // Delete any existing July payroll run so user can create it cleanly from UI
  const existingRun = await PayrollRun.findOne({ month: 7, year: 2026 });
  if (existingRun) {
    await Payslip.deleteMany({ payrollRunId: existingRun._id });
    await existingRun.deleteOne();
    console.log('🧹 Cleaned existing July 2026 Payroll Run (ready for fresh generation).');
  }

  // 5. Seed Leaves for July 2026
  console.log('🌴 Seeding July 2026 Leaves...');

  // Employee 0: Paid Casual Leave on July 15 (1 day)
  if (employees[0]) {
    await Leave.create({
      employeeId: employees[0]._id,
      leaveTypeId: casualType._id,
      startDate: new Date(Date.UTC(2026, 6, 15)),
      endDate: new Date(Date.UTC(2026, 6, 15)),
      days: 1,
      reason: 'Family gathering',
      status: 'approved',
      currentApproverRole: 'none'
    });
    console.log(`   + [Paid Casual Leave] ${employees[0].name}: 1 day (July 15)`);
  }

  // Employee 1: Unpaid Leave on July 13 to July 15 (3 days LWP)
  if (employees[1]) {
    await Leave.create({
      employeeId: employees[1]._id,
      leaveTypeId: unpaidType._id,
      startDate: new Date(Date.UTC(2026, 6, 13)),
      endDate: new Date(Date.UTC(2026, 6, 15)),
      days: 3,
      reason: 'Urgent extended personal travel outside leave balance',
      status: 'approved',
      currentApproverRole: 'none'
    });
    console.log(`   + [Unpaid LWP Leave] ${employees[1].name}: 3 days (July 13 - 15)`);
  }

  // Employee 3: Paid Annual Leave on July 20 - July 21 (2 days)
  if (employees[3]) {
    await Leave.create({
      employeeId: employees[3]._id,
      leaveTypeId: annualType._id,
      startDate: new Date(Date.UTC(2026, 6, 20)),
      endDate: new Date(Date.UTC(2026, 6, 21)),
      days: 2,
      reason: 'Mid-year annual vacation',
      status: 'approved',
      currentApproverRole: 'none'
    });
    console.log(`   + [Paid Annual Leave] ${employees[3].name}: 2 days (July 20 - 21)`);
  }

  // Employee 5: Unpaid Leave on July 17 (1 day) + Paid Sick Leave on July 24 (1 day)
  if (employees[5]) {
    await Leave.create({
      employeeId: employees[5]._id,
      leaveTypeId: unpaidType._id,
      startDate: new Date(Date.UTC(2026, 6, 17)),
      endDate: new Date(Date.UTC(2026, 6, 17)),
      days: 1,
      reason: 'Emergency non-quota day',
      status: 'approved',
      currentApproverRole: 'none'
    });
    await Leave.create({
      employeeId: employees[5]._id,
      leaveTypeId: sickType._id,
      startDate: new Date(Date.UTC(2026, 6, 24)),
      endDate: new Date(Date.UTC(2026, 6, 24)),
      days: 1,
      reason: 'Medical checkup',
      status: 'approved',
      currentApproverRole: 'none'
    });
    console.log(`   + [Unpaid 1d + Paid Sick 1d] ${employees[5].name}: July 17 (Unpaid), July 24 (Sick)`);
  }

  // 6. Seed WFH Requests
  console.log('🏠 Seeding July 2026 Work From Home (WFH) Records...');
  if (employees[0]) {
    for (const d of [8, 22]) {
      await WFHRequest.create({
        employeeId: employees[0]._id,
        date: new Date(Date.UTC(2026, 6, d)),
        reason: 'Remote coding sprint',
        status: 'approved',
        decisionBy: adminUser._id,
        decisionAt: new Date(Date.UTC(2026, 6, d - 1))
      });
    }
    console.log(`   + [WFH Approved] ${employees[0].name}: July 8 & July 22`);
  }

  if (employees[2]) {
    await WFHRequest.create({
      employeeId: employees[2]._id,
      date: new Date(Date.UTC(2026, 6, 29)),
      reason: 'Home maintenance / remote day',
      status: 'approved',
      decisionBy: adminUser._id,
      decisionAt: new Date(Date.UTC(2026, 6, 28))
    });
    console.log(`   + [WFH Approved] ${employees[2].name}: July 29`);
  }

  if (employees[4]) {
    for (const d of [1, 2]) {
      await WFHRequest.create({
        employeeId: employees[4]._id,
        date: new Date(Date.UTC(2026, 6, d)),
        reason: 'Onboarding documentation remote',
        status: 'approved',
        decisionBy: adminUser._id,
        decisionAt: new Date(Date.UTC(2026, 5, 30))
      });
    }
    console.log(`   + [WFH Approved] ${employees[4].name}: July 1 & July 2`);
  }

  // 7. Seed Daily Attendance for July (31 Days)
  console.log('⏱️ Generating July 2026 Attendance Records...');
  const attendanceDocs = [];

  for (let day = 1; day <= 31; day++) {
    const dateUtc = new Date(Date.UTC(2026, 6, day, 0, 0, 0));
    const dayOfWeek = dateUtc.getUTCDay(); // 0 = Sun, 6 = Sat

    // Weekend (Saturday or Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];

      // Check on_leave days
      if (i === 0 && day === 15) {
        attendanceDocs.push({ employeeId: emp._id, date: dateUtc, shiftId: shift._id, status: 'on_leave', source: 'web' });
        continue;
      }
      if (i === 1 && [13, 14, 15].includes(day)) {
        attendanceDocs.push({ employeeId: emp._id, date: dateUtc, shiftId: shift._id, status: 'on_leave', source: 'web' });
        continue;
      }
      if (i === 3 && [20, 21].includes(day)) {
        attendanceDocs.push({ employeeId: emp._id, date: dateUtc, shiftId: shift._id, status: 'on_leave', source: 'web' });
        continue;
      }
      if (i === 5 && [17, 24].includes(day)) {
        attendanceDocs.push({ employeeId: emp._id, date: dateUtc, shiftId: shift._id, status: 'on_leave', source: 'web' });
        continue;
      }

      // Check unexcused absent day (e.g. Employee 3 on July 28)
      if (i === 3 && day === 28) {
        attendanceDocs.push({
          employeeId: emp._id,
          date: dateUtc,
          shiftId: shift._id,
          status: 'absent',
          source: 'system_auto_absent',
          workDurationMinutes: 0
        });
        continue;
      }

      // Check WFH days
      let isWfh = false;
      if (i === 0 && [8, 22].includes(day)) isWfh = true;
      if (i === 2 && day === 29) isWfh = true;
      if (i === 4 && [1, 2].includes(day)) isWfh = true;

      // Late scenarios
      let isLate = false;
      // Employee 0: 3 lates (July 2, 9, 23) -> Exactly 1 Day Penalty!
      if (i === 0 && [2, 9, 23].includes(day)) isLate = true;

      // Employee 2: 6 lates (July 3, 7, 10, 17, 21, 24) -> Exactly 2 Days Penalty!
      if (i === 2 && [3, 7, 10, 17, 21, 24].includes(day)) isLate = true;

      // Employee 3: 1 late (July 16) -> 0 penalty (within grace <3)
      if (i === 3 && day === 16) isLate = true;

      // Employee 5: 3 lates (July 6, 13, 27) -> Exactly 1 Day Penalty!
      if (i === 5 && [6, 13, 27].includes(day)) isLate = true;

      // Overtime scenarios
      let overtimeMinutes = 0;
      let overtimeApproved = false;

      // Employee 1: July 6 (120 min), July 27 (180 min) -> 5 hrs OT
      if (i === 1) {
        if (day === 6) { overtimeMinutes = 120; overtimeApproved = true; }
        if (day === 27) { overtimeMinutes = 180; overtimeApproved = true; }
      }

      // Employee 2: July 30 (240 min = 4 hrs OT)
      if (i === 2 && day === 30) {
        overtimeMinutes = 240;
        overtimeApproved = true;
      }

      // Employee 4: July 16 (180 min), July 23 (180 min) -> 6 hrs OT
      if (i === 4) {
        if (day === 16 || day === 23) { overtimeMinutes = 180; overtimeApproved = true; }
      }

      const checkInHour = isLate ? 9 : 8;
      const checkInMin = isLate ? 40 : 55;
      const checkOutHour = overtimeMinutes > 0 ? 18 + Math.floor(overtimeMinutes / 60) : 18;
      const checkOutMin = overtimeMinutes > 0 ? overtimeMinutes % 60 : 5;

      const checkIn = new Date(Date.UTC(2026, 6, day, checkInHour, checkInMin, 0));
      const checkOut = new Date(Date.UTC(2026, 6, day, checkOutHour, checkOutMin, 0));
      const workDurationMinutes = Math.round((checkOut - checkIn) / 60000);

      const flags = [];
      if (isWfh) flags.push('wfh');
      if (!isLate && !isWfh) flags.push('graceApplied');

      attendanceDocs.push({
        employeeId: emp._id,
        date: dateUtc,
        shiftId: shift._id,
        checkIn,
        checkOut,
        workDurationMinutes,
        overtimeMinutes,
        overtimeApproved,
        status: isLate ? 'late' : 'present',
        flags,
        source: isWfh ? 'wfh' : 'web'
      });
    }
  }

  await Attendance.insertMany(attendanceDocs);
  console.log(`✅ Inserted ${attendanceDocs.length} attendance records across July 2026.`);

  // 8. Lock July 2026 Attendance MonthLock (CRITICAL for payroll generation in UI)
  let monthLock = await MonthLock.findOne({ yearMonth: '2026-07' });
  if (!monthLock) {
    monthLock = await MonthLock.create({
      yearMonth: '2026-07',
      isLocked: true,
      lockedBy: adminUser._id,
      lockedAt: new Date('2026-07-31T23:59:59Z'),
      notes: 'July 2026 finalized and locked. Ready for user to generate payroll run.'
    });
    console.log('🔒 Locked Attendance for 2026-07 (MonthLock is active).');
  } else {
    monthLock.isLocked = true;
    monthLock.lockedAt = new Date('2026-07-31T23:59:59Z');
    await monthLock.save();
    console.log('🔒 MonthLock for 2026-07 confirmed locked.');
  }

  console.log('\n========================================================================================');
  console.log('🎯 JULY 2026 DATA SEED COMPLETE! SUMMARY OF FACTORS READY FOR YOUR PAYROLL GENERATION:');
  console.log('========================================================================================');
  console.log('1. Mohammad Hamza Hakim (EMP-000):');
  console.log('   - 2 Days WFH (July 8, 22)');
  console.log('   - 1 Paid Casual Leave (July 15)');
  console.log('   - 3 Lates (July 2, 9, 23) -> Expected Penalty: 1 Day Gross cut');
  console.log('');
  console.log('2. Sajwar Babar (EMP-0001):');
  console.log('   - 3 Days Unpaid Leave (LWP) (July 13 - 15) -> Expected Deduction: 3 Days Gross cut');
  console.log('   - 5 Hours Approved Overtime (July 6, 27) -> Expected Addition: 1.5x Basic Pay');
  console.log('   - 0 Lates (Perfect on-time)');
  console.log('');
  console.log('3. Basit Aziz (EMP-0002):');
  console.log('   - 6 Lates (July 3, 7, 10, 17, 21, 24) -> Expected Penalty: 2 Days Gross cut');
  console.log('   - 1 Day WFH (July 29)');
  console.log('   - 4 Hours Approved Overtime (July 30)');
  console.log('');
  console.log('4. Bilawal Haq (EMP-0003):');
  console.log('   - 2 Days Paid Annual Leave (July 20 - 21) -> No fine');
  console.log('   - 1 Late (July 16) -> Within Grace (<3 lates = 0 fine)');
  console.log('   - 1 Unexcused Absent (July 28)');
  console.log('');
  console.log('5. Huzaifa (EMP-0004):');
  console.log('   - 2 Days WFH (July 1 - 2)');
  console.log('   - 6 Hours Approved Overtime (July 16, 23)');
  console.log('   - 0 Lates (Punctual)');
  console.log('');
  console.log('6. Noman (EMP-0005):');
  console.log('   - 1 Day Unpaid Leave (July 17) -> Expected Deduction: 1 Day cut');
  console.log('   - 1 Day Paid Sick Leave (July 24) -> No fine');
  console.log('   - 3 Lates (July 6, 13, 27) -> Expected Penalty: 1 Day Gross cut');
  console.log('========================================================================================\n');
  console.log('👉 Ab aap frontend UI me ja kr Month: 7 (July), Year: 2026 select kr k Generate Payroll Run click kr saktay hain!');
}

if (process.argv[1]?.includes('seedJulyPayrollData.js')) {
  seedJulyPayrollData()
    .then(() => {
      console.log('✨ July 2026 data seeding finished successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ July seed failed:', err);
      process.exit(1);
    });
}
