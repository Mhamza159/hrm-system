/**
 * @file role.controller.js
 * @description Controller Layer for Module M26 Roles & Permissions (RBAC & CASL).
 * 
 * SPECIFICATION:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.1 - 26.16)
 * - Layer: Controller (Request parser & HTTP Response dispatcher)
 * - Layer Invariant: Controllers ONLY validate request inputs, delegate to service,
 *   and respond using apiResponse. Direct DB queries are forbidden here.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import * as roleService from './role.service.js';

/**
 * GET /api/v1/permissions
 * 26.1: Retrieve the complete system permission catalogue
 */
export const getPermissions = asyncHandler(async (req, res) => {
  const catalogue = await roleService.getPermissionsCatalogue();
  return res.status(200).json(
    apiResponse(200, catalogue, 'Permission catalogue retrieved successfully.')
  );
});

/**
 * GET /api/v1/roles
 * 26.7: Get paginated list of all active roles
 */
export const getRoles = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await roleService.getAllRoles({ page, limit, search });
  return res.status(200).json(
    apiResponse(200, result.roles, 'Roles retrieved successfully.', result.meta)
  );
});

/**
 * GET /api/v1/roles/:id
 * 26.7: Get single role details
 */
export const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  return res.status(200).json(
    apiResponse(200, role, 'Role details retrieved successfully.')
  );
});

/**
 * POST /api/v1/roles
 * 26.7: Create a new custom role
 */
export const createRole = asyncHandler(async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress;
  const role = await roleService.createRole(req.body, req.user, ip);
  return res.status(201).json(
    apiResponse(201, role, 'Custom role created successfully.')
  );
});

/**
 * PATCH /api/v1/roles/:id
 * 26.7 & 26.8: Update role metadata or permissions matrix
 */
export const updateRole = asyncHandler(async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress;
  const role = await roleService.updateRole(req.params.id, req.body, req.user, ip);
  return res.status(200).json(
    apiResponse(200, role, 'Role updated successfully.')
  );
});

/**
 * DELETE /api/v1/roles/:id
 * 26.7 & 26.13: Delete custom role (protected if system or in use)
 */
export const deleteRole = asyncHandler(async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress;
  const result = await roleService.deleteRole(req.params.id, req.user, ip);
  return res.status(200).json(
    apiResponse(200, null, result.message)
  );
});

/**
 * POST /api/v1/roles/:id/clone
 * 26.10: Clone existing role
 */
export const cloneRole = asyncHandler(async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress;
  const { newName } = req.body;
  const cloned = await roleService.cloneRole(req.params.id, newName, req.user, ip);
  return res.status(201).json(
    apiResponse(201, cloned, 'Role cloned successfully.')
  );
});

/**
 * PATCH /api/v1/users/:id/roles
 * 26.11 & 26.12: Assign multiple roles to a user
 */
export const assignUserRoles = asyncHandler(async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress;
  const { roleIds } = req.body;
  const updatedUser = await roleService.assignUserRoles(
    req.params.id,
    roleIds,
    req.user,
    ip
  );
  return res.status(200).json(
    apiResponse(200, updatedUser, 'User roles updated successfully.')
  );
});
