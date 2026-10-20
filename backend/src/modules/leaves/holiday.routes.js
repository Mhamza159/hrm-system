/**
 * @file holiday.routes.js
 * @description Express Routes for Public & Gazetted Holidays (Module M6 Row 6.11).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.11)
 * - Middleware: authenticate -> validate -> checkPermission -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import * as leaveController from './leave.controller.js';
import {
  createHolidaySchema,
  updateHolidaySchema,
  holidayIdParamSchema
} from './leave.validation.js';

const router = Router();

router.use(authenticate);

// 6.11: List all holidays (all authenticated staff can view to plan time-off)
router.get(
  '/',
  leaveController.getHolidays
);

// 6.11: Get single holiday details
router.get(
  '/:id',
  validate(holidayIdParamSchema),
  leaveController.getHolidayById
);

// 6.11: Create new public holiday (Super Admin / HR Manager only)
router.post(
  '/',
  checkPermission('leave.settings', 'all'),
  validate(createHolidaySchema),
  leaveController.createHoliday
);

// 6.11: Update holiday date or details (Super Admin / HR Manager only)
router.patch(
  '/:id',
  checkPermission('leave.settings', 'all'),
  validate(updateHolidaySchema),
  leaveController.updateHoliday
);

// 6.11: Remove / deactivate holiday (Super Admin / HR Manager only)
router.delete(
  '/:id',
  checkPermission('leave.settings', 'all'),
  validate(holidayIdParamSchema),
  leaveController.deleteHoliday
);

export default router;
