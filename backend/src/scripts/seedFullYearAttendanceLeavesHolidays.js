/**
 * @file seedFullYearAttendanceLeavesHolidays.js
 * @description Seeds comprehensive Jan 1, 2026 to Nov 4, 2026 data for all active employees:
 * - 2026 Pakistan Gazetted Holidays
 * - Daily Attendance (Present, Late, Overtime, Holiday, On-Leave)
 * - Approved Paid Leaves (Casual, Annual, Sick)
 * - Approved Unpaid Leaves (LWP)
 * - Pre-Payroll MonthLocks for 2026-01 through 2026-10 (isLocked: true)
 * 
 * NOTE: Does NOT touch PayrollRun or Payslip collections. The user wants to manually trigger
 * and test payroll calculation via the UI.
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
import { Holiday } from '../models/holiday.model.js';
import { LeaveType } from '../models/leaveType.model.js';
import { Leave } from '../models/leave.model.js';
import { Attendance } from '../models/attendance.model.js';
import { MonthLock } from '../models/monthLock.model.js';
import { WFHRequest } from '../models/wfh.model.js';
import { seedPakistanHolidays } from '../seed/holidays.seed.js';

export async function seedFullYearData() {
  console.log('🚀 [Full-Year Seed] Starting Jan 1, 2026 to Nov 4, 2026 Attendance, Leaves & Holidays seeding...');
  await connectDB();

  // 1. Fetch Admin User
  const adminUser = await User.findOne({ isActive: true });
  if (!adminUser) throw new Error('No active admin user found in database.');

  // 2. Seed 2026 Pakistan Gazetted Holidays
  console.log('📅 Seeding 2026 Gazetted Holidays...');
  const holidayResult = await seedPakistanHolidays(2026, adminUser._id);
  console.log(`✅ Holidays seeded: ${holidayResult.seeded} new, total: ${holidayResult.total}`);

  // Fetch all 2026 holidays
  const allHolidays = await Holiday.find({ year: 2026 });
  const holidayMap = new Map();
  for (const h of allHolidays) {
    const key = new Date(h.date).toISOString().split('T')[0];
    holidayMap.set(key, h);
  }
  console.log(`📌 Loaded ${holidayMap.size} holiday dates for 2026.`);

  // 3. Fetch all active employees
  const employees = await Employee.find({ isDeleted: false, status: { $ne: 'Terminated' } })
    .populate('departmentId')
    .populate('designationId');

  console.log(`👥 Found ${employees.length} active employees:`);
  for (const emp of employees) {
    console.log(`   - [${emp.employeeCode || 'N/A'}] ${emp.name} (${emp.email || 'no-email'})`);
    // Ensure joiningDate is on or before Jan 1, 2026 so they are eligible for all 2026 payroll runs
    const joining = emp.joiningDate ? new Date(emp.joiningDate) : null;
    if (!joining || joining > new Date('2026-01-01')) {
      emp.joiningDate = new Date('2025-01-01');
      await emp.save();
      console.log(`     * Adjusted joiningDate to 2025-01-01 for full 2026 tenure`);
    }
  }

  // 4. Ensure Shift exists
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

  // 5. Ensure Leave Types exist
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

  // 6. Clean Attendance, Leaves, WFH from Jan 1, 2026 to Nov 4, 2026 (WITHOUT TOUCHING PAYROLL!)
  const seedStartDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  const seedEndDate = new Date(Date.UTC(2026, 10, 4, 23, 59, 59, 999));

  console.log('🧹 Cleaning previous attendance, leaves, and WFH in range 2026-01-01 to 2026-11-04...');
  const delAtt = await Attendance.deleteMany({ date: { $gte: seedStartDate, $lte: seedEndDate } });
  const delLeave = await Leave.deleteMany({ startDate: { $gte: seedStartDate, $lte: seedEndDate } });
  const delWfh = await WFHRequest.deleteMany({ date: { $gte: seedStartDate, $lte: seedEndDate } });
  console.log(`   Deleted: ${delAtt.deletedCount} attendance, ${delLeave.deletedCount} leaves, ${delWfh.deletedCount} WFH records.`);

  // 7. Seed Curated Realistic Leaves across the Year for Payroll Testing
  console.log('🌴 Creating Realistic Leave Records (Paid & Unpaid)...');
  const leavesToInsert = [];

  // Helper to schedule an approved leave
  const scheduleLeave = (empIndex, leaveType, startY, startM, startD, endY, endM, endD, days, reason) => {
    if (!employees[empIndex]) return;
    leavesToInsert.push({
      employeeId: employees[empIndex]._id,
      leaveTypeId: leaveType._id,
      startDate: new Date(Date.UTC(startY, startM - 1, startD, 0, 0, 0)),
      endDate: new Date(Date.UTC(endY, endM - 1, endD, 23, 59, 59)),
      days,
      reason,
      status: 'approved',
      currentApproverRole: 'none'
    });
  };

  // Emp 0:
  scheduleLeave(0, casualType, 2026, 3, 10, 2026, 3, 11, 2, 'Family engagement ceremony');
  scheduleLeave(0, sickType,   2026, 7, 15, 2026, 7, 15, 1, 'Seasonal flu');
  scheduleLeave(0, annualType, 2026, 9, 21, 2026, 9, 23, 3, 'Annual rest and recuperation');

  // Emp 1:
  scheduleLeave(1, unpaidType, 2026, 2, 16, 2026, 2, 17, 2, 'Personal emergency leave without pay');
  scheduleLeave(1, casualType, 2026, 5, 11, 2026, 5, 12, 2, 'Personal errands');
  scheduleLeave(1, unpaidType, 2026, 7, 13, 2026, 7, 15, 3, 'Extended personal travel outside quota');
  scheduleLeave(1, sickType,   2026, 10, 6, 2026, 10, 7, 2, 'Viral fever recovery');

  // Emp 2:
  scheduleLeave(2, casualType, 2026, 2, 18, 2026, 2, 19, 2, 'Home relocation');
  scheduleLeave(2, unpaidType, 2026, 6, 10, 2026, 6, 10, 1, 'Unpaid emergency leave day');
  scheduleLeave(2, annualType, 2026, 8, 17, 2026, 8, 20, 4, 'Summer vacation with family');

  // Emp 3:
  scheduleLeave(3, annualType, 2026, 3, 24, 2026, 3, 25, 2, 'Spring break');
  scheduleLeave(3, sickType,   2026, 6, 22, 2026, 6, 22, 1, 'Dental procedure');
  scheduleLeave(3, unpaidType, 2026, 10, 8, 2026, 10, 9, 2, 'Urgent leave without pay');

  // Emp 4:
  scheduleLeave(4, sickType,   2026, 4, 21, 2026, 4, 22, 2, 'Doctor prescribed medical rest');
  scheduleLeave(4, casualType, 2026, 6, 15, 2026, 6, 15, 1, 'Family commitment');
  scheduleLeave(4, unpaidType, 2026, 9, 16, 2026, 9, 16, 1, 'Unpaid day for documentation work');

  // Emp 5:
  scheduleLeave(5, casualType, 2026, 1, 19, 2026, 1, 19, 1, 'Family visit');
  scheduleLeave(5, annualType, 2026, 5, 18, 2026, 5, 20, 3, 'Annual rest days');
  scheduleLeave(5, casualType, 2026, 8, 6,  2026, 8, 7,  2, 'Personal travel');
  scheduleLeave(5, unpaidType, 2026, 10, 22, 2026, 10, 23, 2, 'Unpaid personal absence');

  const createdLeaves = await Leave.insertMany(leavesToInsert);
  console.log(`✅ Created ${createdLeaves.length} approved leave documents.`);

  // Fast lookup for whether an employee is on leave on a given date (YYYY-MM-DD)
  // Map: `${empId}_${YYYY-MM-DD}` -> Leave document
  const leaveDayMap = new Map();
  for (const lv of createdLeaves) {
    const cur = new Date(lv.startDate);
    const end = new Date(lv.endDate);
    while (cur <= end) {
      const dayStr = cur.toISOString().split('T')[0];
      leaveDayMap.set(`${lv.employeeId.toString()}_${dayStr}`, lv);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  // 8. Generate Daily Attendance from 2026-01-01 to 2026-11-04
  console.log('⏰ Generating Day-by-Day Attendance Records...');
  const attendanceDocs = [];

  const currentDateCursor = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  const finalSeedDate = new Date(Date.UTC(2026, 10, 4, 0, 0, 0)); // Nov 4, 2026

  while (currentDateCursor <= finalSeedDate) {
    const dateUtc = new Date(currentDateCursor);
    const dayStr = dateUtc.toISOString().split('T')[0];
    const dayOfWeek = dateUtc.getUTCDay(); // 0 = Sun, 6 = Sat
    const month = dateUtc.getUTCMonth() + 1; // 1 to 11
    const day = dateUtc.getUTCDate();

    // Check if this date is a Gazetted Holiday
    const holiday = holidayMap.get(dayStr);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend: skip regular attendance
      currentDateCursor.setUTCDate(currentDateCursor.getUTCDate() + 1);
      continue;
    }

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const empIdStr = emp._id.toString();

      // Case A: Gazetted Holiday
      if (holiday) {
        attendanceDocs.push({
          employeeId: emp._id,
          date: dateUtc,
          shiftId: shift._id,
          status: 'holiday',
          source: 'web',
          notes: holiday.name,
          workDurationMinutes: 0
        });
        continue;
      }

      // Case B: Approved Leave
      const activeLeave = leaveDayMap.get(`${empIdStr}_${dayStr}`);
      if (activeLeave) {
        attendanceDocs.push({
          employeeId: emp._id,
          date: dateUtc,
          shiftId: shift._id,
          status: 'on_leave',
          source: 'web',
          notes: `Approved Leave: ${activeLeave.reason}`,
          workDurationMinutes: 0
        });
        continue;
      }

      // Case C: Working Day (Present, Late, Overtime)
      let isLate = false;
      let overtimeMinutes = 0;
      let overtimeApproved = false;

      // Deterministic patterns per employee for testing payroll features:
      // --- LATE PENALTY SCENARIOS (3 lates = 1 day gross salary deduction) ---
      // Emp 0: 3 lates in Feb (Feb 3, 10, 17) -> exactly 1 day penalty in Feb
      if (i === 0 && month === 2 && [3, 10, 17].includes(day)) isLate = true;
      // Emp 0: 3 lates in Oct (Oct 6, 13, 20) -> exactly 1 day penalty in Oct
      if (i === 0 && month === 10 && [6, 13, 20].includes(day)) isLate = true;

      // Emp 1: 6 lates in Sept (Sept 2, 7, 14, 18, 22, 28) -> exactly 2 days penalty in Sept
      if (i === 1 && month === 9 && [2, 7, 14, 18, 22, 28].includes(day)) isLate = true;

      // Emp 2: 3 lates in Aug (Aug 5, 12, 19) -> exactly 1 day penalty in Aug
      if (i === 2 && month === 8 && [5, 12, 19].includes(day)) isLate = true;

      // Emp 3: 6 lates in May (May 5, 8, 12, 19, 22, 26) -> exactly 2 days penalty in May
      if (i === 3 && month === 5 && [5, 8, 12, 19, 22, 26].includes(day)) isLate = true;

      // Emp 4: 3 lates in Jan (Jan 8, 15, 22) -> exactly 1 day penalty in Jan
      if (i === 4 && month === 1 && [8, 15, 22].includes(day)) isLate = true;

      // Emp 5: 3 lates in June (June 4, 11, 18) -> exactly 1 day penalty in June
      if (i === 5 && month === 6 && [4, 11, 18].includes(day)) isLate = true;

      // Single occasional lates (grace < 3, no penalty)
      if (i === 0 && month === 4 && day === 14) isLate = true;
      if (i === 2 && month === 3 && day === 17) isLate = true;
      if (i === 4 && month === 8 && day === 11) isLate = true;

      // --- OVERTIME SCENARIOS (1.5x basic hourly rate) ---
      // Emp 0: May 8 (120m), May 15 (120m) -> 4 hrs OT
      if (i === 0 && month === 5 && [8, 15].includes(day)) {
        overtimeMinutes = 120;
        overtimeApproved = true;
      }
      // Emp 1: Jan 14 (180m), Jan 21 (180m) -> 6 hrs OT
      if (i === 1 && month === 1 && [14, 21].includes(day)) {
        overtimeMinutes = 180;
        overtimeApproved = true;
      }
      // Emp 2: Apr 10 (180m), Apr 17 (180m) -> 6 hrs OT
      if (i === 2 && month === 4 && [10, 17].includes(day)) {
        overtimeMinutes = 180;
        overtimeApproved = true;
      }
      // Emp 3: Aug 20 (240m = 4 hrs OT)
      if (i === 3 && month === 8 && day === 20) {
        overtimeMinutes = 240;
        overtimeApproved = true;
      }
      // Emp 4: Jul 9 (180m), Jul 23 (180m) -> 6 hrs OT
      if (i === 4 && month === 7 && [9, 23].includes(day)) {
        overtimeMinutes = 180;
        overtimeApproved = true;
      }
      // Emp 5: Feb 12 (180m), Feb 26 (180m) -> 6 hrs OT
      if (i === 5 && month === 2 && [12, 26].includes(day)) {
        overtimeMinutes = 180;
        overtimeApproved = true;
      }
      // Emp 5: Oct 15 (180m), Oct 22 (180m) -> 6 hrs OT
      if (i === 5 && month === 10 && [15, 22].includes(day)) {
        overtimeMinutes = 180;
        overtimeApproved = true;
      }

      // Check-in and check-out timestamps
      const checkInHour = isLate ? 9 : 8;
      const checkInMin = isLate ? (35 + ((day * 3 + i) % 20)) : (50 + ((day + i) % 10)); // 09:35-09:55 if late, 08:50-08:59 if on time
      const checkOutHour = overtimeMinutes > 0 ? (18 + Math.floor(overtimeMinutes / 60)) : 18;
      const checkOutMin = overtimeMinutes > 0 ? (overtimeMinutes % 60) : (5 + ((day + i) % 15)); // 18:05-18:20

      const checkIn = new Date(Date.UTC(2026, month - 1, day, checkInHour, checkInMin, 0));
      const checkOut = new Date(Date.UTC(2026, month - 1, day, checkOutHour, checkOutMin, 0));
      const workDurationMinutes = Math.round((checkOut - checkIn) / 60000);

      const flags = [];
      if (!isLate) flags.push('graceApplied');

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
        source: 'web'
      });
    }

    currentDateCursor.setUTCDate(currentDateCursor.getUTCDate() + 1);
  }

  console.log(`💾 Inserting ${attendanceDocs.length} attendance records into MongoDB...`);
  await Attendance.insertMany(attendanceDocs);
  console.log(`✅ Successfully seeded ${attendanceDocs.length} attendance records.`);

  // 9. Pre-lock Attendance for completed months (2026-01 through 2026-10)
  // This allows the user to immediately test Batch Payroll Generation for ANY month from Jan to Oct 2026!
  console.log('🔒 Ensuring MonthLock for past cycles 2026-01 through 2026-10...');
  for (let m = 1; m <= 10; m++) {
    const pad = String(m).padStart(2, '0');
    const yearMonth = `2026-${pad}`;
    const endDay = new Date(2026, m, 0).getDate();
    const lockDate = new Date(`2026-${pad}-${endDay}T23:59:59Z`);

    await MonthLock.findOneAndUpdate(
      { yearMonth },
      {
        yearMonth,
        isLocked: true,
        lockedBy: adminUser._id,
        lockedAt: lockDate,
        notes: `Month ${yearMonth} finalized and locked for payroll processing.`
      },
      { upsert: true, new: true }
    );
    console.log(`   🔒 MonthLock [${yearMonth}] -> isLocked: true`);
  }

  console.log('\n🎉 ============================================================');
  console.log('🎉 FULL-YEAR ATTENDANCE, LEAVES & HOLIDAYS DATA SEEDED SUCCESSFULLY!');
  console.log(`🎉 Total Active Employees: ${employees.length}`);
  console.log(`🎉 Date Range: 2026-01-01 to 2026-11-04`);
  console.log(`🎉 Attendance Records: ${attendanceDocs.length}`);
  console.log(`🎉 Approved Leaves: ${createdLeaves.length}`);
  console.log(`🎉 Pakistan 2026 Gazetted Holidays: ${holidayMap.size}`);
  console.log(`🎉 MonthLocks Active: 2026-01 through 2026-10 (Ready for Payroll UI)`);
  console.log('🎉 NOTE: Payroll runs & payslips were NOT created, as requested.');
  console.log('🎉 ============================================================\n');

  process.exit(0);
}

seedFullYearData().catch((err) => {
  console.error('❌ Error seeding full year data:', err);
  process.exit(1);
});
