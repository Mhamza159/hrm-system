/**
 * @file approvalLimit.js
 * @description Helper utility for validating financial/operational approval limits per permission rule.
 * 
 * SPECIFICATION:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.9)
 * - Layer: Utilities / Domain Authorization Helpers
 */

import { ApiError } from './ApiError.js';

/**
 * Validates whether a user's assigned role permission limits permit an approval of the requested amount.
 * 
 * @param {Object} user - Authenticated user with populated roles
 * @param {string} actionName - Permission action string (e.g. 'expense.approve', 'leave.approve')
 * @param {number} requestedAmount - Numeric amount (e.g. PKR expense amount or leave days)
 * @returns {{ allowed: boolean, maxLimit: number | null, reason?: string }} Evaluation result
 */
export const checkApprovalLimit = (user, actionName, requestedAmount) => {
  if (!user) {
    throw new ApiError(401, 'User identity required for approval limit verification.');
  }

  // 1. Super Admin possesses unrestricted authorization
  const isSuperAdmin = user.roles?.some((r) =>
    typeof r === 'string' ? r === 'Super Admin' : r?.name === 'Super Admin'
  );
  if (isSuperAdmin) {
    return { allowed: true, maxLimit: null };
  }

  // 2. Scan user's assigned roles for highest configured limit for this action
  let foundAction = false;
  let hasUnlimited = false;
  let highestLimit = 0;

  for (const role of user.roles || []) {
    for (const perm of role.permissions || []) {
      if (perm.action === actionName || perm.action === 'manage') {
        foundAction = true;
        if (perm.limit === undefined || perm.limit === null) {
          hasUnlimited = true;
        } else if (typeof perm.limit === 'number' && perm.limit > highestLimit) {
          highestLimit = perm.limit;
        }
      }
    }
  }

  if (!foundAction) {
    return {
      allowed: false,
      maxLimit: 0,
      reason: `User does not possess permission '${actionName}'.`
    };
  }

  if (hasUnlimited) {
    return { allowed: true, maxLimit: null };
  }

  if (requestedAmount > highestLimit) {
    return {
      allowed: false,
      maxLimit: highestLimit,
      reason: `Requested amount (${requestedAmount}) exceeds maximum configured approval limit (${highestLimit}). Escalation required.`
    };
  }

  return { allowed: true, maxLimit: highestLimit };
};
