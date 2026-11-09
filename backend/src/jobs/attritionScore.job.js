/**
 * @file attritionScore.job.js
 * @description Weekly Scheduled Cron Job for Automated Employee Attrition Risk Scoring.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Row 17.1)
 * - Schedule: Runs weekly on Sunday at 00:00 AM PKT (Saturday 19:00 UTC)
 * - Layer: Background Worker Job
 */

import cron from 'node-cron';
import { runWeeklyAttritionScoring } from '../modules/attrition/attrition.service.js';

/**
 * Execute automated company-wide attrition calculation
 * @returns {Promise<Object>}
 */
export const runAttritionCalculationJob = async () => {
  try {
    console.log('⏰ [CRON] Starting weekly Attrition Risk scoring job...');
    const result = await runWeeklyAttritionScoring();
    console.log(
      `✅ [CRON] Attrition Risk Job finished: Evaluated ${result.evaluatedCount} employees (${result.highRiskCount} High, ${result.mediumRiskCount} Medium, ${result.lowRiskCount} Low).`
    );
    return result;
  } catch (error) {
    console.error('❌ [CRON Error] Attrition Risk Job failed:', error.message);
    return { evaluatedCount: 0, error: error.message };
  }
};

/**
 * Initialize weekly schedule runner (Sundays at 00:00 AM PKT)
 */
export const initAttritionJob = () => {
  // Cron schedule: At 00:00 on Sunday in Asia/Karachi
  cron.schedule(
    '0 0 * * 0',
    async () => {
      await runAttritionCalculationJob();
    },
    {
      timezone: 'Asia/Karachi'
    }
  );
  console.log('📅 [CRON] Weekly Attrition Risk scoring job registered (Sundays 00:00 PKT).');
};

