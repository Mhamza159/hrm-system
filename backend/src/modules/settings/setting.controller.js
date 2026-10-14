/**
 * @file setting.controller.js
 * @description Controller Actions & Request Handler Pipeline for M2 Company Settings.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11)
 * - Layer: Controller (Request Translation & Response Packaging)
 * - Architecture: Every successful response uses standard apiResponse({ statusCode, success, data, message, meta })
 */

import { SettingService } from './setting.service.js';
import { executeBackup, getBackupStatus as getBackupMetrics } from '../../jobs/backup.job.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

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

  // Construct accessible relative logo URL
  const logoUrl = `/uploads/logos/${req.file.filename}`;

  // Read existing company setting and merge logoUrl
  const existingCompany = (await SettingService.getSetting('company')) || {};
  const updatedCompany = { ...existingCompany, logoUrl };

  await SettingService.updateSetting('company', updatedCompany, req.user, req.ip, 'Company logo uploaded');

  return res.status(200).json(
    apiResponse(200, { logoUrl, company: updatedCompany }, 'Company logo uploaded successfully')
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
 * Retrieve public company handbook and non-sensitive policies
 * GET /api/v1/settings/public-policies
 * Accessible to all authenticated employees and managers
 */
export const getPublicPolicies = asyncHandler(async (req, res) => {
  const policies = await SettingService.getPublicPolicies();
  return res.status(200).json(apiResponse(200, policies, 'Public company policies retrieved successfully'));
});
