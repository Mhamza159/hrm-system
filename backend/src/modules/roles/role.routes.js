/**
 * @file role.routes.js
 * @description Express Router for Module M26 Roles & Permissions.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.1 - 26.10)
 * - Middleware Pipeline: authenticate -> validate -> checkPermission -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import {
  createRoleSchema,
  updateRoleSchema,
  cloneRoleSchema
} from './role.validation.js';
import * as roleController from './role.controller.js';

const router = Router();

// Universal requirement: All routes require active authenticated session
router.use(authenticate);

/**
 * 26.1: Retrieve Master Permission Catalogue
 * GET /api/v1/permissions (or mounted under /api/v1/roles/permissions)
 */
router.get(
  '/permissions',
  checkPermission('role.view'),
  roleController.getPermissions
);

/**
 * 26.7: Roles Collection Endpoints
 */
router.get(
  '/',
  checkPermission('role.view'),
  roleController.getRoles
);

router.post(
  '/',
  validate(createRoleSchema),
  checkPermission('role.manage'),
  roleController.createRole
);

/**
 * 26.10: Role Cloning
 */
router.post(
  '/:id/clone',
  validate(cloneRoleSchema),
  checkPermission('role.manage'),
  roleController.cloneRole
);

/**
 * 26.7: Single Role Member Endpoints
 */
router.get(
  '/:id',
  checkPermission('role.view'),
  roleController.getRoleById
);

router.patch(
  '/:id',
  validate(updateRoleSchema),
  checkPermission('role.manage'),
  roleController.updateRole
);

router.delete(
  '/:id',
  checkPermission('role.manage'),
  roleController.deleteRole
);

export default router;
