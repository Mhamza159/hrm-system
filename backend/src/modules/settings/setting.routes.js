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

// Configure local uploads destination directory
const LOGO_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'logos');
if (!fs.existsSync(LOGO_UPLOAD_DIR)) {
  fs.mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });
}

// Multer storage for company logo assets (Slice 2.2)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, LOGO_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `company-logo-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const logoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB maximum
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid logo format. Only PNG, JPEG, WEBP, and SVG are supported.'));
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
