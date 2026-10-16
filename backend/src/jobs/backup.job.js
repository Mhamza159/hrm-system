/**
 * @file backup.job.js
 * @description Automated Database Backup Job & Manual Trigger Engine.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Row 2.10)
 * - Layer: Background Job & System Maintenance
 * - Policy: Daily execution, 30-day retention, isolated strictly to Super Admin.
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const RETENTION_DAYS = 30;

/**
 * Ensure the local backup storage directory exists
 */
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

/**
 * Execute a complete database export snapshot with 30-day retention cleanup
 * @returns {Promise<Object>}
 */
export const executeBackup = async () => {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-hrm-${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  // Collect data across all registered Mongoose models concurrently
  const modelNames = mongoose.modelNames();
  const entries = await Promise.all(
    modelNames.map(async (name) => {
      const Model = mongoose.model(name);
      const docs = await Model.find({}).lean();
      return [name, docs];
    })
  );
  const collectionsData = Object.fromEntries(entries);

  const payload = {
    createdAt: new Date().toISOString(),
    database: mongoose.connection?.name || 'hrm_development',
    version: '1.0.0',
    modelsCount: modelNames.length,
    data: collectionsData
  };

  const jsonContent = JSON.stringify(payload, null, 2);
  fs.writeFileSync(filePath, jsonContent, 'utf-8');

  const stats = fs.statSync(filePath);

  // Retention cleanup: purge archives older than 30 days
  cleanOldBackups();

  return {
    filename,
    sizeBytes: stats.size,
    timestamp: new Date().toISOString(),
    status: 'success'
  };
};

/**
 * Inspect backup storage directory to report status and metrics
 * @returns {Object}
 */
export const getBackupStatus = () => {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('backup-hrm-') && f.endsWith('.json'));

  if (files.length === 0) {
    return {
      lastBackup: null,
      totalBackups: 0,
      health: 'no_backups_found',
      retentionDays: RETENTION_DAYS
    };
  }

  // Sort descending by timestamp
  files.sort().reverse();
  const latestFile = files[0];
  const stats = fs.statSync(path.join(BACKUP_DIR, latestFile));

  return {
    lastBackup: {
      filename: latestFile,
      sizeBytes: stats.size,
      timestamp: stats.mtime.toISOString()
    },
    totalBackups: files.length,
    health: 'healthy',
    retentionDays: RETENTION_DAYS
  };
};

/**
 * Purge archives older than RETENTION_DAYS
 */
const cleanOldBackups = () => {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR);
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const fullPath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(fullPath);
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (error) {
    console.error('Backup retention cleanup warning:', error.message);
  }
};
