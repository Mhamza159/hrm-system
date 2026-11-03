/**
 * @file project.routes.js
 * @description Express Routes for Module M22 Projects & Timesheets.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.1 to 22.7)
 * - Middleware Hierarchy: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as projectController from './project.controller.js';
import {
  createClientSchema,
  updateClientSchema,
  createProjectSchema,
  updateProjectSchema,
  assignProjectMembersSchema,
  logTimesheetSchema,
  updateTimesheetSchema,
  submitWeekTimesheetSchema,
  decideTimesheetSchema,
  remindMissingSchema,
  paramIdSchema
} from './project.validation.js';

// =========================================================================
// 1. CLIENTS ROUTER (/api/v1/clients)
// =========================================================================
export const clientRouter = Router();
clientRouter.use(authenticate);

clientRouter.get(
  '/',
  checkPermission('project.view'),
  projectController.getClients
);

clientRouter.post(
  '/',
  checkPermission('project.manage'),
  validate(createClientSchema),
  projectController.createClient
);

clientRouter.get(
  '/:id',
  checkPermission('project.view'),
  validate(paramIdSchema),
  projectController.getClientById
);

clientRouter.put(
  '/:id',
  checkPermission('project.manage'),
  validate(updateClientSchema),
  projectController.updateClient
);

clientRouter.delete(
  '/:id',
  checkPermission('project.manage'),
  validate(paramIdSchema),
  projectController.deleteClient
);

// =========================================================================
// 2. PROJECTS ROUTER (/api/v1/projects)
// =========================================================================
export const projectRouter = Router();
projectRouter.use(authenticate);

projectRouter.get(
  '/',
  checkPermission('project.view'),
  projectController.getProjects
);

projectRouter.post(
  '/',
  checkPermission('project.manage'),
  validate(createProjectSchema),
  projectController.createProject
);

projectRouter.get(
  '/:id',
  checkPermission('project.view'),
  validate(paramIdSchema),
  projectController.getProjectById
);

projectRouter.put(
  '/:id',
  checkPermission('project.manage'),
  validate(updateProjectSchema),
  projectController.updateProject
);

projectRouter.delete(
  '/:id',
  checkPermission('project.manage'),
  validate(paramIdSchema),
  projectController.deleteProject
);

// Row 22.2: Assign project members
projectRouter.put(
  '/:id/members',
  checkPermission('project.manage'),
  validate(assignProjectMembersSchema),
  projectController.assignProjectMembers
);

// =========================================================================
// 3. TIMESHEETS ROUTER (/api/v1/timesheets)
// =========================================================================
export const timesheetRouter = Router();
timesheetRouter.use(authenticate);

// Row 22.3: My weekly entries & daily entry logging
timesheetRouter.get(
  '/my-week',
  checkPermission('timesheet.log'),
  projectController.getMyWeeklyTimesheets
);

timesheetRouter.post(
  '/',
  checkPermission('timesheet.log'),
  validate(logTimesheetSchema),
  projectController.logTimeEntry
);

timesheetRouter.put(
  '/:id',
  checkPermission('timesheet.log'),
  validate(updateTimesheetSchema),
  projectController.updateTimesheet
);

timesheetRouter.delete(
  '/:id',
  checkPermission('timesheet.log'),
  validate(paramIdSchema),
  projectController.deleteTimesheet
);

// Row 22.4: Week submission & manager approval
timesheetRouter.post(
  '/submit',
  checkPermission('timesheet.log'),
  validate(submitWeekTimesheetSchema),
  projectController.submitWeekTimesheets
);

timesheetRouter.get(
  '/pending',
  checkPermission('timesheet.approve'),
  projectController.getPendingTimesheets
);

timesheetRouter.patch(
  '/:id/decide',
  checkPermission('timesheet.approve'),
  validate(decideTimesheetSchema),
  projectController.decideTimesheet
);

// Row 22.7: HR Missing timesheets compliance
timesheetRouter.get(
  '/missing',
  checkPermission('timesheet.compliance'),
  projectController.getMissingTimesheets
);

timesheetRouter.post(
  '/remind-missing',
  checkPermission('timesheet.compliance'),
  validate(remindMissingSchema),
  projectController.remindMissingTimesheets
);

// =========================================================================
// 4. REPORTS ROUTER (/api/v1/reports/...)
// =========================================================================
export const projectReportsRouter = Router();
projectReportsRouter.use(authenticate);

// Row 22.5: Utilization report
projectReportsRouter.get(
  '/utilization',
  checkPermission('report.utilization'),
  projectController.getUtilizationReport
);

// Row 22.6: Project Profitability (Super Admin Only)
projectReportsRouter.get(
  '/project-profitability',
  checkPermission('report.profitability'),
  projectController.getProjectProfitabilityReport
);

export default {
  clientRouter,
  projectRouter,
  timesheetRouter,
  projectReportsRouter
};

