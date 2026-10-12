/**
 * @file checkPermission.js
 * @description Dynamic Authorization Middleware for RBAC & CASL Permission Checks.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.3)
 * - Layer: Middleware (Authorization Gatekeeper)
 * - Implementation: Uses @casl/ability (MongoAbility) to compile and evaluate rules dynamically.
 * - Additive Union: Compiles rules across all roles held by user into a unified ability instance.
 * - Horizontal Scope: Evaluates data scope priority ('all' > 'department' > 'team' > 'own') and
 *   attaches `req.permissionScope` and `req.ability` to the request object.
 */

import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Compiles a CASL MongoAbility instance for a user based on their assigned roles.
 * @param {Object} user - Authenticated user with populated roles
 * @returns {import('@casl/ability').MongoAbility} Compiled CASL ability instance
 */
export const buildAbilityForUser = (user) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);
  const roles = user?.roles || [];

  for (const role of roles) {
    // 1. Super Admin master role override
    if (role === 'Super Admin' || role?.name === 'Super Admin') {
      can('manage', 'all');
      break;
    }

    // 2. Iterate through role's granular permission rules
    if (Array.isArray(role?.permissions)) {
      for (const perm of role.permissions) {
        if (perm.action === 'manage' && (perm.subject === 'all' || !perm.subject)) {
          can('manage', 'all');
        } else {
          // Register rule with subject (or fallback to 'all') and optional fields
          const subject = perm.subject || 'all';
          const fields = perm.fields?.length ? perm.fields : undefined;
          can(perm.action, subject, fields);
          // Also allow action on 'all' so checkPermission('action') matches
          if (subject !== 'all') {
            can(perm.action, 'all', fields);
          }
        }
      }
    }
  }

  return build();
};

/**
 * Resolves the most permissive data scope for a user for a specific action.
 * Priority hierarchy: all (4) > department (3) > team (2) > own (1)
 * @param {Object} user - Authenticated user with roles
 * @param {string} actionName - Permission action string (e.g. 'attendance.view')
 * @returns {string} Effective data scope ('all', 'department', 'team', 'own')
 */
export const getEffectiveScopeForAction = (user, actionName) => {
  const roles = user?.roles || [];
  const scopePriority = { all: 4, department: 3, team: 2, own: 1 };
  let bestScope = null;
  let bestPriority = 0;

  for (const role of roles) {
    if (role === 'Super Admin' || role?.name === 'Super Admin') {
      return 'all';
    }

    if (Array.isArray(role?.permissions)) {
      for (const perm of role.permissions) {
        if (perm.action === 'manage' && (perm.subject === 'all' || !perm.subject)) {
          return 'all';
        }
        if (perm.action === actionName || perm.action === 'manage') {
          const priority = scopePriority[perm.scope] || 1;
          if (priority > bestPriority) {
            bestPriority = priority;
            bestScope = perm.scope;
          }
        }
      }
    }
  }

  return bestScope || 'all';
};

/**
 * Express Middleware Factory checking required permission via CASL.
 * @param {string} requiredPermission - Permission action identifier (e.g. 'role.manage', 'user.manage')
 * @param {string} [subject='all'] - Subject entity type (e.g. 'Role', 'User', 'Employee')
 */
export const checkPermission = (requiredPermission, subject = 'all') => {
  return asyncHandler(async (req, res, next) => {
    // 1. Guard against unauthenticated requests reaching authorization gate
    if (!req.user) {
      throw new ApiError(401, 'Authentication required before permission evaluation.');
    }

    // 2. Build CASL Ability dynamically from user's current roles
    const ability = buildAbilityForUser(req.user);

    // 3. Evaluate whether ability permits 'manage all' or specific action
    const isAllowed =
      ability.can('manage', 'all') ||
      ability.can(requiredPermission, subject) ||
      ability.can(requiredPermission, 'all');

    if (!isAllowed) {
      throw new ApiError(
        403,
        `Forbidden: You lack the required permission ('${requiredPermission}') to perform this action.`
      );
    }

    // 4. Attach ability and resolved horizontal data scope to request context
    req.ability = ability;
    req.permissionScope = getEffectiveScopeForAction(req.user, requiredPermission);

    next();
  });
};
