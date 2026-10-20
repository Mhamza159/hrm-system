/**
 * @file autoAbsent.job.js
 * @description Scheduled Nightly Cron Job for Automatic Absenteeism Marking.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.13)
 * - Schedule: 23:59 PKT (Asia/Karachi) daily
 * - Logic: Marks active employees with no punch record as 'absent', respecting holidays & leaves.
 */

import cron from 'node-cron';
import { Attendance } from '../../../models/attendance.model.js';
import { Employee } from '../../../models/employee.model.js';
import { Holiday } from '../../../models/holiday.model.js';
import { Setting } from '../../../models/setting.model.js';
import { normalizeToUtcMidnight } from '../attendance.service.js';

/**
 * Executes the core Auto-Absent sweep logic
 * @param {Date} [runDate=new Date()]
 * @returns {Promise<{ processed: number, markedAbsent: number, skipped: number }>}
 */
export const runAutoAbsentSweep = async (runDate = new Date()) => {
  const targetDate = normalizeToUtcMidnight(runDate);

  // 1. Check if targetDate is an active Pakistan Gazetted Holiday (Module M6 Row 6.11 & 6.12)
  const gazettedHoliday = await Holiday.findOne({
    date: targetDate,
    isActive: true,
    type: 'gazetted'
  }).lean();

  if (gazettedHoliday) {
    console.log(`⏱️ [AutoAbsent] Skipped auto-absent sweep: ${targetDate.toISOString().split('T')[0]} is Gazetted Holiday (${gazettedHoliday.name}).`);
    return { processed: 0, markedAbsent: 0, skipped: 0, holiday: gazettedHoliday.name };
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[targetDate.getUTCDay()];

  // Fetch company default working days
  const workingDaysSetting = await Setting.findOne({ key: 'workingDays' }).lean();
  const defaultWorkingDays = (workingDaysSetting?.value || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']).map((d) =>
    d.toLowerCase()
  );

  // Fetch all active employees
  const employees = await Employee.find({ isDeleted: false, status: { $in: ['Active', 'Probation', 'active'] } })
    .populate('shiftId', 'workDays workingDays')
    .lean();

  let markedAbsent = 0;
  let skipped = 0;

  for (const emp of employees) {
    // Check if today is a scheduled work day for this employee
    const shiftDays = emp.shiftId?.workDays || emp.shiftId?.workingDays;
    const workingDays = shiftDays && shiftDays.length > 0 ? shiftDays.map((d) => d.toLowerCase()) : defaultWorkingDays;

    if (!workingDays.includes(dayName)) {
      skipped++;
      continue;
    }

    // Check if attendance record exists for today
    const existing = await Attendance.findOne({ employeeId: emp._id, date: targetDate });
    if (existing) {
      skipped++;
      continue;
    }

    // Create auto-absent record
    const absentRecord = new Attendance({
      employeeId: emp._id,
      date: targetDate,
      shiftId: emp.shiftId?._id || null,
      checkIn: null,
      checkOut: null,
      status: 'absent',
      source: 'system_auto_absent',
      flags: []
    });

    await absentRecord.save();
    markedAbsent++;
  }

  console.log(`⏱️ [AutoAbsent] Sweep finished for ${targetDate.toISOString().split('T')[0]}: marked ${markedAbsent} absent, skipped ${skipped}.`);
  return { processed: employees.length, markedAbsent, skipped };
};

/**
 * Initializes the node-cron scheduled job at 23:59 PKT
 */
export const initAutoAbsentJob = () => {
  // Run every night at 23:59 Asia/Karachi time
  const task = cron.schedule(
    '59 23 * * *',
    async () => {
      try {
        console.log('🌙 [Cron] Running nightly Auto-Absent job at 23:59 PKT...');
        await runAutoAbsentSweep(new Date());
      } catch (err) {
        console.error('❌ [Cron Error] Failed to execute auto-absent job:', err);
      }
    },
    {
      timezone: 'Asia/Karachi'
    }
  );

  console.log('⏰ [Cron] Auto-Absent scheduled task initialized (23:59 Asia/Karachi).');
  return task;
};
