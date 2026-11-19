/**
 * @file setting.controller.js
 * @description Controller Actions & Request Handler Pipeline for M2 Company Settings.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11)
 * - Layer: Controller (Request Translation & Response Packaging)
 * - Architecture: Every successful response uses standard apiResponse({ statusCode, success, data, message, meta })
 */

import fs from 'node:fs';
import path from 'node:path';
import { SettingService } from './setting.service.js';
import {
  executeBackup,
  getBackupStatus as getBackupMetrics,
  listBackups,
  getBackupFilePath,
  verifyBackupArchiveIntegrity
} from '../../jobs/backup.job.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../../config/cloudinary.js';

/**
 * Retrieve all system settings in a consolidated dictionary
 * GET /api/v1/settings
 */
export const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await SettingService.getAllSettings();
  return res.status(200).json(apiResponse(200, settings, 'Settings retrieved successfully'));
});

/**
 * Retrieve single setting domain configuration
 * GET /api/v1/settings/:key
 */
export const getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const value = await SettingService.getSetting(key);

  if (value === null) {
    throw new ApiError(404, `Setting with key '${key}' not found`);
  }

  return res.status(200).json(apiResponse(200, { key, value }, `Setting '${key}' retrieved successfully`));
});

/**
 * Update single setting configuration
 * PATCH /api/v1/settings/:key
 */
export const updateSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  // Accept value directly or wrapped in { value }
  const payloadToUpdate = value !== undefined ? value : req.body;

  const updatedValue = await SettingService.updateSetting(
    key,
    payloadToUpdate,
    req.user,
    req.ip,
    description
  );

  return res.status(200).json(
    apiResponse(200, { key, value: updatedValue }, `Setting '${key}' updated successfully`)
  );
});

/**
 * Upload company logo and update company profile setting
 * POST /api/v1/settings/company/logo
 */
export const uploadCompanyLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Logo file is required');
  }

  let logoUrl;

  if (isCloudinaryConfigured() && req.file.buffer) {
    const cloudRes = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'hrm/logos',
      resource_type: 'image'
    });
    logoUrl = cloudRes.secure_url;
  } else {
    // Local fallback when Cloudinary credentials are not configured or file was stored on disk
    if (req.file.filename) {
      logoUrl = `/uploads/logos/${req.file.filename}`;
    } else {
      const logoDir = path.resolve(process.cwd(), 'uploads', 'logos');
      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname).toLowerCase();
      const uniqueName = `company-logo-${Date.now()}${ext}`;
      const filePath = path.join(logoDir, uniqueName);
      if (req.file.buffer) {
        fs.writeFileSync(filePath, req.file.buffer);
      }
      logoUrl = `/uploads/logos/${uniqueName}`;
    }
  }

  // Read existing company setting and merge logoUrl
  const existingCompany = (await SettingService.getSetting('company')) || {};
  const updatedCompany = { ...existingCompany, logoUrl };

  await SettingService.updateSetting('company', updatedCompany, req.user, req.ip, 'Company logo uploaded');

  return res.status(200).json(
    apiResponse(200, { logoUrl, company: updatedCompany }, 'Company logo uploaded successfully')
  );
});

/**
 * Remove company logo and reset to default brandmark
 * DELETE /api/v1/settings/company/logo
 */
export const deleteCompanyLogo = asyncHandler(async (req, res) => {
  const existingCompany = (await SettingService.getSetting('company')) || {};
  const updatedCompany = { ...existingCompany, logoUrl: '' };

  await SettingService.updateSetting('company', updatedCompany, req.user, req.ip, 'Company logo removed');

  return res.status(200).json(
    apiResponse(200, { logoUrl: '', company: updatedCompany }, 'Company logo removed successfully')
  );
});

/**
 * Execute immediate manual database backup
 * POST /api/v1/settings/backup-now
 * Guarded strictly for Super Admin
 */
export const triggerBackup = asyncHandler(async (req, res) => {
  // Defensive verification: ensure actor is Super Admin
  const isSuperAdmin = req.user?.roles?.some((r) =>
    (typeof r === 'object' ? r.name : r) === 'Super Admin'
  );

  if (!isSuperAdmin) {
    throw new ApiError(403, 'Database backup execution is strictly restricted to Super Admin');
  }

  const result = await executeBackup();
  return res.status(200).json(apiResponse(200, result, 'Database backup archive created successfully'));
});

/**
 * Inspect backup storage health & metrics
 * GET /api/v1/settings/backup-status
 */
export const getBackupStatus = asyncHandler(async (req, res) => {
  const status = getBackupMetrics();
  return res.status(200).json(apiResponse(200, status, 'Backup status retrieved successfully'));
});

/**
 * List all available database backup archives
 * GET /api/v1/settings/backups
 * Super Admin strictly
 */
export const getAllBackups = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.user?.roles?.some((r) =>
    (typeof r === 'object' ? r.name : r) === 'Super Admin'
  );
  if (!isSuperAdmin) {
    throw new ApiError(403, 'Listing database backup archives is strictly restricted to Super Admin');
  }

  const backups = listBackups();
  return res.status(200).json(apiResponse(200, backups, 'Backups list retrieved successfully'));
});

/**
 * Securely stream a backup archive for download
 * GET /api/v1/settings/backups/:filename/download
 * Super Admin strictly
 */
export const downloadBackupFile = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.user?.roles?.some((r) =>
    (typeof r === 'object' ? r.name : r) === 'Super Admin'
  );
  if (!isSuperAdmin) {
    throw new ApiError(403, 'Downloading database backup archives is strictly restricted to Super Admin');
  }

  const { filename } = req.params;
  try {
    const filePath = getBackupFilePath(filename);
    return res.download(filePath, filename);
  } catch (err) {
    throw new ApiError(404, err.message || 'Backup file not found');
  }
});

/**
 * Non-destructively verify integrity of a backup archive
 * POST /api/v1/settings/backups/verify-integrity
 * Super Admin strictly
 */
export const verifyBackup = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.user?.roles?.some((r) =>
    (typeof r === 'object' ? r.name : r) === 'Super Admin'
  );
  if (!isSuperAdmin) {
    throw new ApiError(403, 'Verifying database backup integrity is strictly restricted to Super Admin');
  }

  const { filename } = req.body;
  if (!filename) {
    throw new ApiError(400, 'Backup filename is required for integrity verification');
  }

  try {
    const report = verifyBackupArchiveIntegrity(filename);
    return res.status(200).json(apiResponse(200, report, 'Backup archive integrity verified successfully'));
  } catch (err) {
    throw new ApiError(400, `Backup integrity verification failed: ${err.message}`);
  }
});

/**
 * Retrieve public company handbook and non-sensitive policies
 * GET /api/v1/settings/public-policies
 * Accessible to all authenticated employees and managers
 */
export const getPublicPolicies = asyncHandler(async (req, res) => {
  const policies = await SettingService.getPublicPolicies();
  return res.status(200).json(apiResponse(200, policies, 'Public company policies retrieved successfully'));
});

/**
 * Retrieve public-facing corporate brand identity (Unauthenticated)
 * GET /api/v1/settings/public-branding
 * Used by Login, Public Careers, and Job Application portals
 */
export const getPublicBranding = asyncHandler(async (req, res) => {
  const company = (await SettingService.getSetting('company')) || {};
  return res.status(200).json(
    apiResponse(
      200,
      {
        name: company.name || 'ELVARA',
        legalName: company.legalName || company.name || 'ELVARA HRM Enterprise',
        logoUrl: company.logoUrl || ''
      },
      'Public company branding retrieved successfully'
    )
  );
});
