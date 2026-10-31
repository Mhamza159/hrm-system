/**
 * @file assetExpiry.job.js
 * @description Scheduled Cron Job for Automated 30-Day Warranty & Software License Expiry Alerts.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.3)
 * - Layer: Background Job (Scheduled via node-cron daily at 09:00 PKT)
 * - Target Recipients: HR Managers and Super Admins.
 */

import cron from 'node-cron';
import { checkExpiringAssets } from '../modules/assets/asset.service.js';

/**
 * Execute automated warranty & software license expiration checks
 * @returns {Promise<Object>}
 */
export const runAssetExpiryCheck = async () => {
  try {
    const result = await checkExpiringAssets();
    if (result.count > 0) {
      console.log(`⏰ [CRON] Asset Expiry Job: Dispatched alerts for ${result.count} expiring assets.`);
    }
    return result;
  } catch (error) {
    console.error('❌ [CRON Error] Asset Expiry Job failed:', error.message);
    return { count: 0, error: error.message };
  }
};

/**
 * Initialize daily schedule runner (Runs every day at 09:00 AM PKT / 04:00 AM UTC)
 */
export const initAssetExpiryJob = () => {
  // Cron schedule: At 09:00 on every day-of-week
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ [CRON] Starting daily Asset Warranty & License Expiry evaluation...');
    await runAssetExpiryCheck();
  });
  console.log('📅 [CRON] Asset Expiry Job registered (daily 09:00 PKT).');
};

export default {
  runAssetExpiryCheck,
  initAssetExpiryJob
};

