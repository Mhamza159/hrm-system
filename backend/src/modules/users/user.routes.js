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

export default router;
