/**
 * @file changeRequest.routes.js
 * @description Express Router for Employee Profile & Organizational Change Requests.
 * 
 * SPECIFICATION & WORKFLOW:
 * - Module: Change Request Module (Phase 33)
 * - Layer: API Routes
 * - Enforces: Authentication, PBAC scoping, multi-role permissions, schema validation.
 */

import express from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as employeeController from './employee.controller.js';
import {
  changeRequestSchema,
  decideChangeRequestSchema,
  returnChangeRequestSchema,
  cancelChangeRequestSchema
} from './employee.validation.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, PNG, and WEBP document files are allowed.'));
    }
  }
});

// Self-service list of my change requests
router.get(
  '/my',
  authenticate,
  employeeController.getMyChangeRequests
);

// High-level KPI statistics
router.get(
  '/stats',
  authenticate,
  checkPermission(['change_request.view', 'employee.edit', 'employee.view']),
  employeeController.getChangeRequestStats
);

// List change requests with PBAC scoping and filters
router.get(
  '/',
  authenticate,
  checkPermission(['change_request.view', 'employee.edit', 'employee.view']),
  employeeController.getChangeRequests
);

// Inspect single change request
router.get(
  '/:id',
  authenticate,
  checkPermission(['change_request.view', 'employee.edit', 'employee.view']),
  employeeController.getChangeRequestById
);

// Submit new change request
router.post(
  '/',
  authenticate,
  validate(changeRequestSchema),
  employeeController.submitChangeRequest
);

// Secure attachment upload
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  employeeController.uploadChangeRequestAttachment
);

// Reviewer decision: approve or reject
router.patch(
  '/:id/decide',
  authenticate,
  checkPermission(['change_request.approve', 'employee.edit']),
  validate(decideChangeRequestSchema),
  employeeController.decideChangeRequest
);

// Reviewer return for correction
router.patch(
  '/:id/return',
  authenticate,
  checkPermission(['change_request.approve', 'employee.edit']),
  validate(returnChangeRequestSchema),
  employeeController.returnChangeRequest
);

// Requester or Admin cancel request
router.patch(
  '/:id/cancel',
  authenticate,
  validate(cancelChangeRequestSchema),
  employeeController.cancelChangeRequest
);

export default router;
