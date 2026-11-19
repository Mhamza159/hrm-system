/**
 * @file user.controller.js
 * @description Controller handlers for User Access, RBAC/PBAC Administration, and Security Actions.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as userService from './user.service.js';

/**
 * List users with pagination, filters, and PBAC scoping
 * Contract: data holds array of users; meta holds pagination info.
 */
export const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getUsers(req.query, req.user);
  const usersList = Array.isArray(result) ? result : result.users || [];
  const meta = Array.isArray(result)
    ? null
    : {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };

  return res
    .status(200)
    .json(new ApiResponse(200, usersList, 'User list retrieved successfully', meta));
});

/**
 * Aggregate dashboard statistics and security posture metrics
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats(req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'User access statistics retrieved successfully'));
});

/**
 * Retrieve single user with deep forensic identity and security details
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id, req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User details retrieved successfully'));
});

/**
 * Unlock a locked user account
 */
export const unlockUserAccount = asyncHandler(async (req, res) => {
  const result = await userService.unlockUserAccount(
    req.params.id,
    req.body || {},
    req.user
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, result.message));
});

/**
 * Revoke all active sessions for a user
 */
export const revokeUserSessions = asyncHandler(async (req, res) => {
  const result = await userService.revokeUserSessions(
    req.params.id,
    req.body || {},
    req.user
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, result.message));
});

/**
 * Force password change upon next login
 */
export const forcePasswordChange = asyncHandler(async (req, res) => {
  const result = await userService.forcePasswordChange(
    req.params.id,
    req.body || {},
    req.user
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, result.message));
});
