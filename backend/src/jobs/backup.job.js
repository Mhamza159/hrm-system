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
 * List all generated backup archives with detailed metadata
 * @returns {Array<Object>}
 */
export const listBackups = () => {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('backup-hrm-') && f.endsWith('.json'));
  files.sort().reverse();

  return files.map((filename) => {
    const fullPath = path.join(BACKUP_DIR, filename);
    const stats = fs.statSync(fullPath);
    return {
      filename,
      sizeBytes: stats.size,
      createdAt: stats.birthtime?.toISOString() || stats.mtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    };
  });
};

/**
 * Validate path and return resolved path for secure download
 * @param {string} filename
 * @returns {string}
 */
export const getBackupFilePath = (filename) => {
  ensureBackupDir();
  // Defense against path traversal
  const cleanFilename = path.basename(filename);
  if (!cleanFilename.startsWith('backup-hrm-') || !cleanFilename.endsWith('.json')) {
    throw new Error('Invalid backup archive filename');
  }
  const fullPath = path.join(BACKUP_DIR, cleanFilename);
  if (!fs.existsSync(fullPath)) {
    throw new Error('Backup archive does not exist');
  }
  return fullPath;
};

/**
 * Non-destructive test of backup JSON integrity
 * @param {string} filename
 * @returns {Object}
 */
export const verifyBackupArchiveIntegrity = (filename) => {
  const fullPath = getBackupFilePath(filename);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object' || !parsed.data) {
    throw new Error('Corrupted backup archive structure: missing data payload');
  }

  const collections = Object.keys(parsed.data);
  let totalRecords = 0;
  for (const col of collections) {
    if (Array.isArray(parsed.data[col])) {
      totalRecords += parsed.data[col].length;
    }
  }

  const stats = fs.statSync(fullPath);
  return {
    filename: path.basename(filename),
    isValid: true,
    database: parsed.database || 'unknown',
    modelsCount: parsed.modelsCount || collections.length,
    collectionsCount: collections.length,
    totalRecords,
    createdAt: parsed.createdAt || stats.mtime.toISOString()
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
