/**
 * @file setting.routes.js
 * @description Express Routes Configuration for Module M2 Company Settings.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11)
 * - Layer: Routes (URL declarations, HTTP verbs & Middleware Binding)
 * - Middleware Order: authenticate -> checkPermission -> validate/upload -> controller
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { ApiError } from '../../utils/ApiError.js';
import * as settingController from './setting.controller.js';

const router = express.Router();

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB maximum
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid logo format. Only PNG, JPEG, WEBP, and SVG image files are supported (Max 2MB).'));
    }
  }
});

// ==============================================================================
// PUBLIC & POLICY ROUTES (Accessible to all authenticated staff with settings.view)
// ==============================================================================
router.get(
  '/public-policies',
  authenticate,
  checkPermission('settings.view'),
  settingController.getPublicPolicies
);

// ==============================================================================
// DISASTER RECOVERY & BACKUP ROUTES (BUILD-GUIDE Row 2.10)
// ==============================================================================
router.get(
  '/backup-status',
  authenticate,
  checkPermission('settings.manage'),
  settingController.getBackupStatus
);

router.post(
  '/backup-now',
  authenticate,
  checkPermission('settings.manage'),
  settingController.triggerBackup
);

// ==============================================================================
// LOGO UPLOAD (BUILD-GUIDE Row 2.2)
// ==============================================================================
router.post(
  '/company/logo',
  authenticate,
  checkPermission('settings.manage'),
  logoUpload.single('logo'),
  settingController.uploadCompanyLogo
);

// ==============================================================================
// GENERAL SETTINGS CRUD (BUILD-GUIDE Rows 2.1 to 2.9)
// ==============================================================================
router.get(
  '/',
  authenticate,
  checkPermission('settings.manage'),
  settingController.getAllSettings
);

router.get(
  '/:key',
  authenticate,
  checkPermission('settings.manage'),
  settingController.getSettingByKey
);

router.patch(
  '/:key',
  authenticate,
  checkPermission('settings.manage'),
  settingController.updateSettingByKey
);

export default router;
