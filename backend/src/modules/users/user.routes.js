import * as attendanceService from '../attendance/attendance.service.js';
import { resetDeviceSchema } from '../attendance/attendance.validation.js';
/**
 * @file user.routes.js
 * @description Express Router configuration for Module M1 User Administration endpoints.
 * 
 * PIPELINE ORDER (Tech-Spec Section 3):
 * route -> validate (Zod) -> checkPermission (CASL) -> controller -> service -> model
 */

import { Router } from 'express';
import { AuthController } from '../auth/auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import { updateUserStatusSchema } from '../auth/auth.validation.js';
import { assignRolesSchema } from '../roles/role.validation.js';
import * as roleController from '../roles/role.controller.js';
import { AuthService } from '../auth/auth.service.js';

import { User } from '../../models/user.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

/**
 * @route   GET /api/v1/users
 * @desc    Fetch list of active and deactivated system users
 * @access  Protected (Requires 'user.manage' permission)
 */
router.get(
  '/',
  authenticate,
  checkPermission('user.manage'),
  asyncHandler(async (req, res) => {
    const users = await User.find({ isDeleted: false })
      .select('-passwordHash -refreshTokenHash -resetOtpHash')
      .populate('roles')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(
      new ApiResponse(200, users, 'User list retrieved successfully')
    );
  })
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Toggle user account activation / deactivation status (Slice 1.13)
 * @access  Protected (Requires authenticated user with 'user.manage' permission)
 */
router.patch(
  '/:id/status',
  authenticate,
  checkPermission('user.manage'),
  validate(updateUserStatusSchema),
  AuthController.setUserStatus
);

/**
 * @route   POST /api/v1/users/:id/reset-password
 * @desc    HR-initiated emergency password reset (Slice 1.14)
 * @access  Protected (Requires authenticated user with 'user.manage' permission)
 */
router.post(
  '/:id/reset-password',
  authenticate,
  checkPermission('user.manage'),
  AuthController.adminResetPassword
);

/**
 * @route   PATCH /api/v1/users/:id/roles
 * @desc    Assign multiple roles to user (Slice 26.11 & 26.12)
 * @access  Protected (Requires 'role.assign' permission)
 */
router.patch(
  '/:id/roles',
  authenticate,
  validate(assignRolesSchema),
  checkPermission('role.assign'),
  roleController.assignUserRoles
);

/**
 * @route   GET /api/v1/users/:id/effective-permissions
 * @desc    Inspect effective merged permissions for a user (Slice 26.15)
 * @access  Protected (Requires 'role.view' permission)
 */
router.get(
  '/:id/effective-permissions',
  authenticate,
  checkPermission('role.view'),
  asyncHandler(async (req, res) => {
    const data = await AuthService.getMe(req.params.id);
    return res.status(200).json(
      new ApiResponse(200, data, 'Effective permissions retrieved successfully.')
    );
  })
);

/**
 * @route   POST /api/v1/users/:id/reset-device
 * @desc    Reset physical hardware device binding (Module M13 Slice 13.5)
 * @access  Protected (Requires 'user.manage' or 'attendance.kiosk.manage')
 */
router.post(
  '/:id/reset-device',
  authenticate,
  validate(resetDeviceSchema),
  asyncHandler(async (req, res) => {
    const perms = [
      ...(req.user.permissions || []),
      ...(req.user.roles?.flatMap((r) => (typeof r === 'object' && r.permissions ? r.permissions : [])) || [])
    ];
    const isSuperAdmin = req.user.role === 'Super Admin' || req.user.roles?.some((r) => (typeof r === 'string' ? r : r.name) === 'Super Admin');
    const hasPerm = isSuperAdmin || perms.some((p) => p.action === 'user.manage' || p.action === 'attendance.kiosk.manage');
    if (!hasPerm) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden: Insufficient permissions to reset hardware device binding.'));
    }

    const result = await attendanceService.resetDeviceBinding(req.params.id, req.body.reason, req.user);
    return res.status(200).json(
      new ApiResponse(200, result, 'Device binding reset successfully.')
    );
  })
);

export default router;


