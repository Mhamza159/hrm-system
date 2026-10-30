/**
 * @file attendance.routes.js
 * @description Express Router for Module M5 Attendance, Breaks, Shifts, WFH, and Month Locking.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Rows 5.1 - 5.15)
 * - Middleware Pipeline: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as attendanceController from './attendance.controller.js';
import {
  checkInSchema,
  checkOutSchema,
  breakStartSchema,
  breakEndSchema,
  manualEditSchema,
  lockMonthSchema,
  unlockMonthSchema,
  wfhRequestSchema,
  wfhDecideSchema,
  correctionRequestSchema,
  correctionDecideSchema,
  queryMyAttendanceSchema,
  queryTeamAttendanceSchema,
  exportAttendanceSchema,
  queryAttendanceHistorySchema,
  decideOvertimeSchema,
  queryTeamOvertimeSchema,
  createWfhLocationSchema,
  updateWfhLocationStatusSchema,
  reviewFlaggedPunchSchema,
  queryFlaggedPunchesSchema,
  queryPunchLocationsSchema,
  createKioskSchema,
  updateKioskSchema,
  queryKiosksSchema,
  getKioskQrSchema,
  kioskIdParamSchema,
  resetDeviceSchema,
  enrollFaceSchema,
  faceApprovalSchema,
  faceRejectSchema
} from './attendance.validation.js';

const router = Router();

// Universal requirement: All routes require authenticated user session
router.use(authenticate);

// Defense-in-depth: Rate limiters for state-mutating punch operations and self-service requests
const punchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 punch operations per minute per IP
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many punch requests in a short period. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const requestsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 submissions per 15 minutes per IP
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests submitted. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 5.3 & 5.4: Daily Clock-In and Clock-Out
 */
router.post(
  '/check-in',
  punchLimiter,
  checkPermission('attendance.mark', 'own'),
  validate(checkInSchema),
  attendanceController.checkIn
);

router.post(
  '/check-out',
  punchLimiter,
  checkPermission('attendance.mark', 'own'),
  validate(checkOutSchema),
  attendanceController.checkOut
);

/**
 * 5.5: Break Management (Meal, Tea, Prayer)
 */
router.post(
  '/break-start',
  punchLimiter,
  checkPermission('attendance.mark', 'own'),
  validate(breakStartSchema),
  attendanceController.startBreak
);

router.post(
  '/break-end',
  punchLimiter,
  checkPermission('attendance.mark', 'own'),
  validate(breakEndSchema),
  attendanceController.endBreak
);

/**
 * 5.9: Monthly Color-Coded Self-Service Attendance Calendar
 */
router.get(
  '/my',
  checkPermission('attendance.view', 'own'),
  validate(queryMyAttendanceSchema),
  attendanceController.getMyAttendance
);

/**
 * 5.10: Team Live Attendance Grid
 */
router.get(
  '/team',
  checkPermission('attendance.view', 'team'),
  validate(queryTeamAttendanceSchema),
  attendanceController.getTeamAttendance
);

/**
 * 5.15: Monthly Attendance History Matrix
 */
router.get(
  '/history',
  checkPermission('attendance.view', 'own'),
  validate(queryAttendanceHistorySchema),
  attendanceController.getAttendanceHistory
);

/**
 * 5.14: Pre-Payroll Monthly Attendance Lock Control
 */
router.post(
  '/lock',
  checkPermission('attendance.lock', 'all'),
  validate(lockMonthSchema),
  attendanceController.lockMonth
);

router.post(
  '/unlock',
  checkPermission('attendance.lock', 'all'),
  validate(unlockMonthSchema),
  attendanceController.unlockMonth
);

router.get(
  '/lock-status',
  checkPermission('attendance.view', 'own'),
  attendanceController.getLockStatus
);

/**
 * 5.8: Work-From-Home (WFH) Requests & Approvals
 */
router.post(
  '/wfh',
  requestsLimiter,
  checkPermission('attendance.wfh', 'own'),
  validate(wfhRequestSchema),
  attendanceController.applyWFH
);

router.get(
  '/wfh/my',
  checkPermission('attendance.wfh', 'own'),
  attendanceController.getMyWFHRequests
);

router.get(
  '/wfh/team',
  checkPermission('attendance.approve', 'team'),
  attendanceController.getTeamWFHRequests
);

router.get(
  '/wfh/:id/audit-context',
  checkPermission('attendance.approve', 'team'),
  attendanceController.getWFHAuditContext
);

router.patch(
  '/wfh/:id/decide',
  checkPermission('attendance.approve', 'team'),
  validate(wfhDecideSchema),
  attendanceController.decideWFH
);

/**
 * 5.12: Attendance Missed-Punch Corrections
 */
router.post(
  '/corrections',
  requestsLimiter,
  checkPermission('attendance.correction', 'own'),
  validate(correctionRequestSchema),
  attendanceController.applyCorrection
);

router.get(
  '/corrections/my',
  checkPermission('attendance.correction', 'own'),
  attendanceController.getMyCorrections
);

router.get(
  '/corrections/team',
  checkPermission('attendance.approve', 'team'),
  attendanceController.getTeamCorrections
);

router.get(
  '/corrections/:id/audit-context',
  checkPermission('attendance.approve', 'team'),
  attendanceController.getCorrectionAuditContext
);

router.patch(
  '/corrections/:id/decide',
  checkPermission('attendance.approve', 'team'),
  validate(correctionDecideSchema),
  attendanceController.decideCorrection
);

/**
 * 5.15: Excel Export Reporting
 */
router.get(
  '/export',
  checkPermission('attendance.export', 'team'),
  validate(exportAttendanceSchema),
  attendanceController.exportAttendance
);

/**
 * 5.13: Manual Trigger for Nightly Auto-Absent Job (Admin/Testing)
 */
router.post(
  '/trigger-auto-absent',
  checkPermission('attendance.lock', 'all'),
  attendanceController.triggerAutoAbsentSweep
);

/**
 * 5.16: Team Overtime Punches & Approval Actions
 */
router.get(
  '/overtime/team',
  checkPermission('attendance.approve', 'team'),
  validate(queryTeamOvertimeSchema),
  attendanceController.getTeamOvertime
);

router.patch(
  '/:id/overtime-decide',
  checkPermission('attendance.approve', 'team'),
  validate(decideOvertimeSchema),
  attendanceController.decideOvertime
);


/**
 * ============================================================================
 * Module M14: GPS / Geo-fencing Attendance Routes (Rows 14.4 - 14.7)
 * ============================================================================
 */

// 14.6: Flagged Punches Review Queue
router.get(
  '/flagged',
  checkPermission('attendance.approve', 'Attendance'),
  validate(queryFlaggedPunchesSchema),
  attendanceController.getFlaggedPunches
);

router.patch(
  '/flagged/:id/review',
  checkPermission('attendance.approve', 'Attendance'),
  validate(reviewFlaggedPunchSchema),
  attendanceController.reviewFlaggedPunch
);

// 14.7: Spatial Locations for Interactive Leaflet Map
router.get(
  '/locations',
  checkPermission('attendance.view', 'Attendance'),
  validate(queryPunchLocationsSchema),
  attendanceController.getPunchLocations
);

// 14.4: Approved WFH Locations Management
router.get(
  '/wfh-locations',
  checkPermission('attendance.wfh', 'Attendance'),
  attendanceController.getWfhLocations
);

router.post(
  '/wfh-locations',
  requestsLimiter,
  checkPermission('attendance.wfh', 'Attendance'),
  validate(createWfhLocationSchema),
  attendanceController.createWfhLocation
);


router.delete(
  '/wfh-locations/:id',
  checkPermission('attendance.wfh', 'Attendance'),
  attendanceController.deleteWfhLocation
);

router.patch(
  '/wfh-locations/:id/status',
  checkPermission('attendance.approve', 'Attendance'),
  validate(updateWfhLocationStatusSchema),
  attendanceController.updateWfhLocationStatus
);

// ============================================================================
// Module M13: Dynamic QR Code Attendance & Kiosks Routes
// ============================================================================

// 13.1: Kiosks CRUD
router.get(
  '/kiosks',
  checkPermission('attendance.kiosk.manage', 'all'),
  validate(queryKiosksSchema),
  attendanceController.getKiosks
);

router.post(
  '/kiosks',
  checkPermission('attendance.kiosk.manage', 'all'),
  validate(createKioskSchema),
  attendanceController.createKiosk
);

router.get(
  '/kiosks/:id',
  checkPermission('attendance.kiosk.manage', 'all'),
  validate(kioskIdParamSchema),
  attendanceController.getKioskById
);

router.patch(
  '/kiosks/:id',
  checkPermission('attendance.kiosk.manage', 'all'),
  validate(updateKioskSchema),
  attendanceController.updateKiosk
);

router.delete(
  '/kiosks/:id',
  checkPermission('attendance.kiosk.manage', 'all'),
  validate(kioskIdParamSchema),
  attendanceController.deleteKiosk
);

// Rate limiter for Kiosk QR Code dynamic stream (max 60 queries/min per IP)
const qrStreamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many QR requests from this IP. Please wait before refreshing.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 13.2: Rotating Dynamic QR Code Vector Stream
router.get(
  '/qr/current',
  qrStreamLimiter,
  checkPermission('attendance.mark', 'own'),
  validate(getKioskQrSchema),
  attendanceController.getCurrentKioskQr
);

// 13.5: User Hardware Device Binding Reset
router.post(
  '/users/:id/reset-device',
  checkPermission('attendance.kiosk.manage', 'all'),
  validate(resetDeviceSchema),
  attendanceController.resetDeviceBinding
);


/**
 * 5.11: Manual Attendance Override with Mandatory Audit Reason
 * (Keep at bottom so /:id doesn't collide with static subpaths)
 */
/**
 * -------------------------------------------------------------
 * M12: Face Recognition Attendance Routes (Rows 12.2, 12.3)
 * -------------------------------------------------------------
 */

// 12.2: Face Enrollment submission (3-5 photos)
router.post(
  '/face/enroll',
  requestsLimiter,
  checkPermission('attendance.mark', 'own'),
  validate(enrollFaceSchema),
  attendanceController.enrollFace
);

// 12.2: Check current user's enrollment status
router.get(
  '/face/status',
  checkPermission('attendance.mark', 'own'),
  attendanceController.getFaceEnrollmentStatus
);

// 12.3: HR list of face enrollments
router.get(
  '/face/enrollments',
  checkPermission('attendance.face.manage', 'all'),
  attendanceController.getFaceEnrollments
);

// 12.3: HR approve face enrollment
router.patch(
  '/face/:userId/approve',
  checkPermission('attendance.face.manage', 'all'),
  validate(faceApprovalSchema),
  attendanceController.approveFaceEnrollment
);

// 12.3: HR reject face enrollment with reason
router.patch(
  '/face/:userId/reject',
  checkPermission('attendance.face.manage', 'all'),
  validate(faceRejectSchema),
  attendanceController.rejectFaceEnrollment
);

// 12.3: HR reset / delete face enrollment
router.delete(
  '/face/:userId',
  checkPermission('attendance.face.manage', 'all'),
  attendanceController.resetFaceEnrollment
);

router.patch(
  '/:id',
  checkPermission('attendance.edit', 'all'),
  validate(manualEditSchema),
  attendanceController.updateAttendance
);

export default router;
