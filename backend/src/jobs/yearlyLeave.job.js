/**
 * @file yearlyLeave.job.js
 * @description Scheduled Cron Job for Annual Leave Quota Rollover & Carry-Forward.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.2)
 * - Evaluates active employees, resets annual quotas, and carries over unused leaves within caps.
 */

import cron from 'node-cron';
import { rolloverYearlyBalances } from '../modules/leaves/leave.service.js';

export const runYearlyLeaveRollover = async () => {
  const currentYear = new Date().getUTCFullYear() - 1;
  const nextYear = new Date().getUTCFullYear();
  console.log(`[Job:YearlyLeave] Starting quota rollover from ${currentYear} to ${nextYear}...`);
  try {
    const result = await rolloverYearlyBalances(currentYear, nextYear);
    console.log(`[Job:YearlyLeave] Rollover completed successfully: ${result.employeesProcessed} employees processed for year ${result.targetYear}.`);
    return result;
  } catch (error) {
    console.error(`[Job:YearlyLeave Error] Failed annual rollover:`, error.message);
    throw error;
  }
};

/**
 * Initializes annual cron schedule (runs at 00:05 UTC on January 1st)
 */
export const initYearlyLeaveCron = () => {
  cron.schedule('5 0 1 1 *', async () => {
    await runYearlyLeaveRollover();
  }, {
    timezone: 'Asia/Karachi',
    name: 'yearly-leave-rollover'
  });
};
