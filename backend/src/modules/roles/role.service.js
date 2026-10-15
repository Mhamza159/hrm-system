/**
 * @file role.service.js
 * @description Business Logic & Service Layer for Module M26 Roles & Permissions (RBAC & CASL).
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.1 - 26.16)
 * - Layer: Service (Domain Business Logic & Data Persistence Orchestrator)
 * - Layer Invariant: Controllers NEVER query MongoDB directly; all queries, transactions,
 *   and audit snapshots occur strictly inside this service.
 */

import { Role } from '../../models/role.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { PERMISSIONS_CATALOGUE } from '../../shared/permissions.js';
import { recordAuditLog } from '../../services/audit.service.js';

/**
 * 26.1: Retrieve complete system permission catalogue
 * @returns {Array} Structured permissions catalogue
 */
export const getPermissionsCatalogue = async () => {
  // Returns static immutable catalogue taxonomy defined in shared constants
  return PERMISSIONS_CATALOGUE;
};

/**
 * 26.7: Retrieve paginated list of system and custom roles
 * @param {Object} queryOptions - Pagination and search filters
 * @returns {Object} List of roles and metadata
 */
export const getAllRoles = async ({ page = 1, limit = 20, search = '' } = {}) => {
  const query = { isDeleted: { $ne: true } };

  if (search.trim()) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Role.countDocuments(query);
  const roles = await Role.find(query)
    .sort({ isSystem: -1, createdAt: 1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return {
    roles,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1
    }
  };
};

/**
 * 26.7: Retrieve single role detail by ObjectId
 * @param {string} roleId - Role ObjectId
 * @returns {Object} Populated role document
 */
export const getRoleById = async (roleId) => {
  const role = await Role.findOne({ _id: roleId, isDeleted: { $ne: true } }).lean();
  if (!role) {
    throw new ApiError(404, 'Role not found or has been deleted.');
  }
  return role;
};

/**
 * 26.7: Create a new custom role
 * @param {Object} roleData - Role creation payload (name, description, permissions)
 * @param {Object} actor - Authenticated user initiating mutation
 * @param {string} ip - Client IP for audit logging
 * @returns {Object} Created role
 */
export const createRole = async (roleData, actor, ip) => {
  const { name, description = '', permissions = [] } = roleData;

  // Check unique name constraint defensively
  const existing = await Role.findOne({ name: name.trim() });
  if (existing) {
    throw new ApiError(409, `A role with name '${name}' already exists.`);
  }

  const newRole = await Role.create({
    name: name.trim(),
    description: description.trim(),
    isSystem: false,
    permissions
  });

  // 26.16: Record audit log snapshot
  await recordAuditLog({
    userId: actor?._id,
    action: 'role.create',
    entity: 'Role',
    entityId: newRole._id,
    before: null,
    after: newRole.toObject(),
    ip
  });

  return newRole;
};

/**
 * 26.7 & 26.8: Update role metadata and permissions matrix
 * @param {string} roleId - Target role ID
 * @param {Object} updateData - Updated attributes
 * @param {Object} actor - Authenticated user
 * @param {string} ip - Client IP
 * @returns {Object} Updated role
 */
export const updateRole = async (roleId, updateData, actor, ip) => {
  const role = await Role.findOne({ _id: roleId, isDeleted: { $ne: true } });
  if (!role) {
    throw new ApiError(404, 'Role not found.');
  }

  // 26.13: Immutable system roles protection - prevent renaming core roles
  if (role.isSystem && updateData.name && updateData.name !== role.name) {
    throw new ApiError(400, 'System default roles cannot be renamed.');
  }

  const beforeSnapshot = role.toObject();

  if (updateData.name && !role.isSystem) {
    // Check name collision with another role
    const collision = await Role.findOne({
      _id: { $ne: roleId },
      name: updateData.name.trim()
    });
    if (collision) {
      throw new ApiError(409, `Another role with name '${updateData.name}' already exists.`);
    }
    role.name = updateData.name.trim();
  }

  if (typeof updateData.description === 'string') {
    role.description = updateData.description.trim();
  }

  if (Array.isArray(updateData.permissions)) {
    // If updating Super Admin, do not allow wiping all permissions
    if (role.isSystem && role.name === 'Super Admin' && updateData.permissions.length === 0) {
      throw new ApiError(400, 'Super Admin role must retain permissions.');
    }
    role.permissions = updateData.permissions;
  }

  await role.save();

  // 26.16: Record audit log mutation diff
  await recordAuditLog({
    userId: actor?._id,
    action: 'role.update',
    entity: 'Role',
    entityId: role._id,
    before: beforeSnapshot,
    after: role.toObject(),
    ip
  });

  return role;
};

/**
 * 26.7 & 26.13: Delete custom role
 * @param {string} roleId - Role ID
 * @param {Object} actor - Authenticated user
 * @param {string} ip - Client IP
 */
export const deleteRole = async (roleId, actor, ip) => {
  const role = await Role.findOne({ _id: roleId, isDeleted: { $ne: true } });
  if (!role) {
    throw new ApiError(404, 'Role not found.');
  }

  // 26.13: Guard system roles against deletion
  if (role.isSystem) {
    throw new ApiError(400, 'System core roles are protected and cannot be deleted.');
  }

  // Check if any active user is currently assigned this role
  const assignedCount = await User.countDocuments({
    roles: roleId,
    isDeleted: { $ne: true }
  });
  if (assignedCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete role '${role.name}': It is currently assigned to ${assignedCount} user(s). Reassign them first.`
    );
  }

  const beforeSnapshot = role.toObject();
  role.isDeleted = true;
  await role.save();

  // 26.16: Record audit log
  await recordAuditLog({
    userId: actor?._id,
    action: 'role.delete',
    entity: 'Role',
    entityId: role._id,
    before: beforeSnapshot,
    after: { isDeleted: true },
    ip
  });

  return { message: `Role '${role.name}' deleted successfully.` };
};

/**
 * 26.10: Clone existing role
 * @param {string} sourceRoleId - ID of template role
 * @param {string} newName - Unique name for cloned copy
 * @param {Object} actor - Authenticated user
 * @param {string} ip - Client IP
 * @returns {Object} Newly cloned role
 */
export const cloneRole = async (sourceRoleId, newName, actor, ip) => {
  const sourceRole = await Role.findOne({ _id: sourceRoleId, isDeleted: { $ne: true } });
  if (!sourceRole) {
    throw new ApiError(404, 'Source role to clone from does not exist.');
  }

  const existing = await Role.findOne({ name: newName.trim() });
  if (existing) {
    throw new ApiError(409, `A role with name '${newName}' already exists.`);
  }

  const cloned = await Role.create({
    name: newName.trim(),
    description: `Cloned from ${sourceRole.name}`,
    isSystem: false,
    permissions: sourceRole.permissions
  });

  await recordAuditLog({
    userId: actor?._id,
    action: 'role.clone',
    entity: 'Role',
    entityId: cloned._id,
    before: { sourceRoleId: sourceRole._id, sourceName: sourceRole.name },
    after: cloned.toObject(),
    ip
  });

  return cloned;
};

/**
 * 26.11 & 26.12: Assign multiple roles to a user with privilege escalation guards
 * @param {string} userId - Target user ID
 * @param {Array<string>} roleIds - Array of role IDs to assign
 * @param {Object} actor - Authenticated user performing action
 * @param {string} ip - Client IP address
 * @returns {Object} Updated target user
 */
export const assignUserRoles = async (userId, roleIds, actor, ip) => {
  const targetUser = await User.findOne({ _id: userId, isDeleted: false });
  if (!targetUser) {
    throw new ApiError(404, 'Target user not found.');
  }

  // 1. Resolve candidate roles from database
  const roles = await Role.find({
    _id: { $in: roleIds },
    isDeleted: { $ne: true }
  });

  if (roles.length !== roleIds.length) {
    throw new ApiError(400, 'One or more specified role IDs are invalid or deleted.');
  }

  // 2. Privilege Escalation Guard (Slice 26.12)
  const isSuperAdmin = actor?.roles?.some((r) =>
    typeof r === 'string' ? r === 'Super Admin' : r?.name === 'Super Admin'
  );

  if (!isSuperAdmin) {
    // A non-Super Admin cannot assign Super Admin role
    const hasSuperAdminRole = roles.some((r) => r.name === 'Super Admin');
    if (hasSuperAdminRole) {
      throw new ApiError(
        403,
        'Privilege Escalation Guard: Only Super Admins are permitted to grant Super Admin role.'
      );
    }

    // Collect actor's own permission action set
    const actorActions = new Set();
    for (const actorRole of actor?.roles || []) {
      if (Array.isArray(actorRole?.permissions)) {
        for (const p of actorRole.permissions) {
          actorActions.add(p.action);
        }
      }
    }

    // Verify candidate roles do not exceed actor's permission boundary
    for (const candidateRole of roles) {
      for (const perm of candidateRole.permissions || []) {
        if (perm.action !== 'manage' && !actorActions.has(perm.action)) {
          throw new ApiError(
            403,
            `Privilege Escalation Guard: You cannot grant role '${candidateRole.name}' granting action '${perm.action}', which exceeds your own administrative authorizations.`
          );
        }
      }
    }
  }

  const beforeRoles = [...(targetUser.roles || [])];
  await User.findByIdAndUpdate(userId, { $set: { roles: roleIds } });

  // 26.16: Audit logging
  await recordAuditLog({
    userId: actor?._id,
    action: 'user.roles_assigned',
    entity: 'User',
    entityId: targetUser._id,
    before: { roles: beforeRoles },
    after: { roles: roleIds },
    ip,
    details: { assignedRoleNames: roles.map((r) => r.name) }
  });

  return await User.findById(targetUser._id)
    .select('-passwordHash -refreshTokenHash -resetOtpHash')
    .populate('roles')
    .lean();
};
