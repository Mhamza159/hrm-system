/**
 * @file attendance.routes.js
 * @description Express Router for Module M5 Attendance, Breaks, Shifts, WFH, and Month Locking.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Rows 5.1 - 5.15)
 * - Middleware Pipeline: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
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
  exportAttendanceSchema
} from './attendance.validation.js';

const router = Router();

// Universal requirement: All routes require authenticated user session
router.use(authenticate);

/**
 * 5.3 & 5.4: Daily Clock-In and Clock-Out
 */
router.post(
  '/check-in',
  checkPermission('attendance.mark', 'own'),
  validate(checkInSchema),
  attendanceController.checkIn
);

router.post(
  '/check-out',
  checkPermission('attendance.mark', 'own'),
  validate(checkOutSchema),
  attendanceController.checkOut
);

/**
 * 5.5: Break Management (Meal, Tea, Prayer)
 */
router.post(
  '/break-start',
  checkPermission('attendance.mark', 'own'),
  validate(breakStartSchema),
  attendanceController.startBreak
);

router.post(
  '/break-end',
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
 * 5.11: Manual Attendance Override with Mandatory Audit Reason
 * (Keep at bottom so /:id doesn't collide with static subpaths)
 */
router.patch(
  '/:id',
  checkPermission('attendance.edit', 'all'),
  validate(manualEditSchema),
  attendanceController.updateAttendance
);

export default router;
