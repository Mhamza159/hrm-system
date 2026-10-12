/**
 * @file checkPermission.js
 * @description Authorization Middleware for Role-Based Access Control (RBAC) & CASL Permission Checks.
 * 
 * SPECIFICATION:
 * - Module: M1 Authentication (Slice 1.13) & M26 Roles & Permissions (BUILD-GUIDE Row 26.3)
 * - Layer: Middleware (Authorization Gatekeeper)
 * - Security Rules:
 *   1. Requires preceding `authenticate` middleware to populate `req.user`.
 *   2. Super Admin bypasses all checks with universal administrative override.
 *   3. HR Manager holds administrative authority over user management (`user.manage`).
 *   4. Rejects unauthorized actors with HTTP 403 Forbidden.
 */

import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Higher-order middleware factory enforcing required permissions
 * @param {string} requiredPermission - Required permission identifier (e.g. 'user.manage')
 */
export const checkPermission = (requiredPermission) => {
  return asyncHandler(async (req, res, next) => {
    // 1. Guard against unauthenticated requests reaching authorization gate
    if (!req.user) {
      throw new ApiError(401, 'Authentication required before permission evaluation.');
    }

    const userRoles = req.user.roles || [];

    // Helper to test if user holds specific role name
    const hasRole = (roleName) =>
      userRoles.some((r) =>
        typeof r === 'string' ? r === roleName : r?.name === roleName
      );

    // 2. Super Admin possesses unrestricted master override
    if (hasRole('Super Admin')) {
      return next();
    }

    // 3. Evaluate specific domain permission mappings
    if (requiredPermission === 'user.manage') {
      // HR Manager possesses user management authorization
      if (hasRole('HR Manager')) {
        return next();
      }
    }

    // 4. If user roles do not satisfy permission criteria, reject with 403 Forbidden
    throw new ApiError(
      403,
      `Forbidden: You lack the required permission ('${requiredPermission}') to perform this action.`
    );
  });
};
