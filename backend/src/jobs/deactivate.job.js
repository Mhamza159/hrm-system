/**
 * @file deactivate.job.js
 * @description Scheduled Cron Job for Automated Account Deactivation on Last Working Day.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.11)
 * - Layer: Background Job (Scheduled via node-cron daily at 00:01 PKT)
 * - Invariant: Employees reaching their official last working day have portal access revoked,
 *   refresh tokens purged, and employment status transitioned to 'Resigned'.
 */

import cron from 'node-cron';
import { runAccountDeactivationJob } from '../modules/onboarding/onboarding.service.js';

export const initDeactivationJob = () => {
  // Runs daily at 00:01
  cron.schedule('1 0 * * *', async () => {
    console.log('⏰ [CRON] Starting daily automated departed employee account deactivation scanner...');
    try {
      const result = await runAccountDeactivationJob();
      console.log(`✅ [CRON] Deactivation scanner complete. Deactivated ${result.deactivatedCount} accounts.`);
    } catch (err) {
      console.error('❌ [CRON Error] Deactivation job failed:', err.message);
    }
  });
  console.log('📅 [CRON] Account Deactivation Job registered (daily 00:01).');
};

export default {
  initDeactivationJob
};

