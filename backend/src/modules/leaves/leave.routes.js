/**
 * @file leave.routes.js
 * @description Express Router for Leave Requests, Balance Inspection, and Approvals (Module M6).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Rows 6.1 - 6.15)
 * - Layer: Routes (API contracts guarded by JWT auth & CASL authorization)
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  applyLeaveSchema,
  decideLeaveSchema,
  cancelLeaveSchema,
  requestEncashmentSchema,
  decideEncashmentSchema,
  adjustBalanceSchema
} from './leave.validation.js';
import * as leaveController from './leave.controller.js';

const router = Router();

// Multer memory upload middleware for medical proof / certificate attachments
const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file format. Only PDF, JPEG, PNG, and WEBP medical certificates are allowed (Max 5MB).'));
    }
  }
});

// ==========================================
// 6.9: Live Leave Balance & Quota Inspection
// ==========================================
router.get(
  '/balance',
  authenticate,
  checkPermission('leave.view', 'own'),
  leaveController.getLeaveBalance
);

// ==========================================
// 6.3 & 6.5: Leave Application & Medical Proof
// ==========================================
router.post(
  '/',
  authenticate,
  checkPermission('leave.apply', 'own'),
  uploadAttachment.single('attachment'),
  validate(applyLeaveSchema),
  leaveController.applyLeave
);

router.get(
  '/my',
  authenticate,
  checkPermission('leave.view', 'own'),
  leaveController.getMyLeaves
);

// ==========================================
// 6.6 & 6.7: Approval Chain & Decision Queue
// ==========================================
router.get(
  '/approvals',
  authenticate,
  checkPermission('leave.approve', 'team'),
  leaveController.getPendingApprovals
);

router.patch(
  '/:id/decide',
  authenticate,
  checkPermission('leave.approve', 'team'),
  validate(decideLeaveSchema),
  leaveController.decideLeave
);

// ==========================================
// 6.8: Leave Cancellation & Balance Revert
// ==========================================
router.patch(
  '/:id/cancel',
  authenticate,
  checkPermission('leave.apply', 'own'),
  validate(cancelLeaveSchema),
  leaveController.cancelLeave
);

// ==========================================
// 6.10: Team Leave Conflict Calendar
// ==========================================
router.get(
  '/calendar',
  authenticate,
  checkPermission('leave.view', 'team'),
  leaveController.getLeaveCalendar
);

// ==========================================
// 6.13: Year-End Leave Encashment Engine
// ==========================================
router.post(
  '/encash',
  authenticate,
  checkPermission('leave.encash', 'own'),
  validate(requestEncashmentSchema),
  leaveController.requestLeaveEncashment
);

router.get(
  '/encash',
  authenticate,
  checkPermission('leave.encash', 'own'),
  leaveController.getLeaveEncashments
);

router.patch(
  '/encash/:id',
  authenticate,
  checkPermission('leave.encash', 'all'),
  validate(decideEncashmentSchema),
  leaveController.decideLeaveEncashment
);

// ==========================================
// 6.14: HR Manual Leave Balance Adjustment & Audit Trail
// ==========================================
router.patch(
  '/balance/:id',
  authenticate,
  checkPermission('leave.settings', 'all'),
  validate(adjustBalanceSchema),
  leaveController.adjustLeaveBalance
);

router.patch(
  '/balances/:id',
  authenticate,
  checkPermission('leave.settings', 'all'),
  validate(adjustBalanceSchema),
  leaveController.adjustLeaveBalance
);

// ==========================================
// 6.15: Leave Analytics & ExcelJS Report Export
// ==========================================
router.get(
  '/export',
  authenticate,
  checkPermission('report.export', 'team'),
  leaveController.exportLeaveReport
);

export default router;
