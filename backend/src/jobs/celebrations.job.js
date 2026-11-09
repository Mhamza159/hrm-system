/**
 * @file celebrations.job.js
 * @description Daily Scheduled Cron Job for Automated Birthdays & Work Anniversaries (BUILD-GUIDE Row 20.3).
 * 
 * SPECIFICATION:
 * - Module: M20 Rewards, Celebrations & Surveys (Row 20.3)
 * - Schedule: Runs daily at 00:01 AM PKT (Asia/Karachi)
 * - Layer: Background Worker Job
 */

import cron from 'node-cron';
import { getTodayCelebrations } from '../modules/rewards/rewards.service.js';
import { getIO } from '../services/socket.service.js';

/**
 * Execute automated daily celebrations check and broadcast
 */
export const runDailyCelebrationsJob = async () => {
  try {
    console.log('⏰ [CRON] Checking daily birthdays & work anniversaries...');
    const celebrations = await getTodayCelebrations();
    const totalCount = celebrations.birthdays.length + celebrations.anniversaries.length;

    console.log(
      `🎉 [CRON] Celebrations Job finished: ${celebrations.birthdays.length} birthday(s), ${celebrations.anniversaries.length} work anniversary/anniversaries found.`
    );

    if (totalCount > 0) {
      const io = getIO();
      if (io) {
        io.emit('celebration:today', celebrations);
      }
    }

    return celebrations;
  } catch (error) {
    console.error('❌ [CRON Error] Celebrations Job failed:', error.message);
    return { birthdays: [], anniversaries: [], error: error.message };
  }
};

/**
 * Initialize daily schedule runner (00:01 AM PKT daily)
 */
export const initCelebrationsJob = () => {
  cron.schedule(
    '1 0 * * *',
    async () => {
      await runDailyCelebrationsJob();
    },
    {
      timezone: 'Asia/Karachi'
    }
  );
  console.log('📅 [CRON] Daily Celebrations broadcast job registered (00:01 PKT daily).');
};

