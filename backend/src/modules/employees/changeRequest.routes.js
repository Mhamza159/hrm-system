/**
 * @file changeRequest.routes.js
 * @description Express Router for HR Review of Profile Change Requests.
 */

import express from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as employeeController from './employee.controller.js';
import { decideChangeRequestSchema } from './employee.validation.js';

const router = express.Router();

router.get(
  '/',
  authenticate,
  checkPermission('employee.edit'),
  employeeController.getChangeRequests
);

router.patch(
  '/:id/decide',
  authenticate,
  checkPermission('employee.edit'),
  validate(decideChangeRequestSchema),
  employeeController.decideChangeRequest
);

export default router;
