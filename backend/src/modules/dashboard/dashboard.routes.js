/**
 * @file dashboard.routes.js
 * @description Express Router for Module M7 Dashboard endpoints.
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

// All dashboard endpoints require valid authentication
router.use(authenticate);

/**
 * 7.1-BE: Super Admin Executive Dashboard
 * Strict scope 'all' ensures only Super Admin / Executive leadership accesses company financials
 */
router.get(
  '/admin',
  checkPermission('dashboard.view', 'all'),
  dashboardController.getAdminDashboard
);

/**
 * 7.2-BE: HR Manager Operational Workforce Dashboard
 * Scope 'all' allows company-wide workforce operations & queues
 */
router.get(
  '/hr',
  checkPermission('dashboard.view', 'all'),
  dashboardController.getHrDashboard
);

/**
 * 7.3-BE: Department Manager Team Overview Dashboard
 * Scope 'team' restricts access to the caller's subordinates and department
 */
router.get(
  '/manager',
  checkPermission('dashboard.view', 'team'),
  dashboardController.getManagerDashboard
);

/**
 * 7.4-BE: Employee Personal Self-Service Dashboard
 * Scope 'own' restricts metrics strictly to the authenticated employee
 */
router.get(
  '/employee',
  checkPermission('dashboard.view', 'own'),
  dashboardController.getEmployeeDashboard
);

export default router;
