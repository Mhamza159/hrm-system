/**
 * @file user.service.js
 * @description Enterprise Service layer for User Access, RBAC/PBAC Administration, and Account Security.
 */

import { User } from '../../models/user.model.js';
import { Employee } from '../../models/employee.model.js';
import { Role } from '../../models/role.model.js';
import { Department } from '../../models/department.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { AuditService } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';
import { emitToCompany } from '../../services/socket.service.js';

/**
 * Helper to determine if an actor is Super Admin
 */
const isActorSuperAdmin = (actor) => {
  if (!actor) return false;
  if (actor.role === 'Super Admin') return true;
  if (Array.isArray(actor.roles)) {
    return actor.roles.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin');
  }
  return false;
};

/**
 * Helper to determine if an actor is HR Manager
 */
const isActorHR = (actor) => {
  if (!actor) return false;
  if (isActorSuperAdmin(actor)) return true;
  if (actor.role === 'HR Manager') return true;
  if (Array.isArray(actor.roles)) {
    return actor.roles.some((r) => (typeof r === 'string' ? r : r?.name) === 'HR Manager');
  }
  return false;
};

/**
 * Retrieve paginated and filtered user access list with PBAC scoping and deep employee population
 * @param {Object} query
 * @param {Object} actor
 * @returns {Promise<Object>} { users, total, page, limit, totalPages }
 */
export const getUsers = async (query = {}, actor = null) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };
  const now = new Date();

  // 1. PBAC Scoping
  if (actor && !isActorSuperAdmin(actor) && !isActorHR(actor)) {
    const actorEmployee = await Employee.findOne({ userId: actor._id, isDeleted: false });
    const isDeptMgr = actor.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Department Manager');

    if (isDeptMgr && actorEmployee?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: actorEmployee.departmentId, isDeleted: false }).select('userId _id');
      const allowedUserIds = deptEmployees.map((e) => e.userId).filter(Boolean);
      filter._id = { $in: allowedUserIds };
    } else {
      // Regular employee: strictly restricted to their own account
      filter._id = actor._id;
    }
  }

  // 2. Department Filter (lookup via Employee)
  if (query.departmentId && query.departmentId !== 'all') {
    const deptEmployees = await Employee.find({ departmentId: query.departmentId, isDeleted: false }).select('userId');
    const deptUserIds = deptEmployees.map((e) => e.userId).filter(Boolean);
    if (filter._id && filter._id.$in) {
      const existing = new Set(filter._id.$in.map(String));
      filter._id = { $in: deptUserIds.filter((id) => existing.has(String(id))) };
    } else {
      filter._id = { $in: deptUserIds };
    }
  }

  const andClauses = [];

  // 3. Status Filters (Active, Inactive, Locked)
  if (query.status === 'active') {
    filter.isActive = true;
    andClauses.push({ $or: [{ lockUntil: null }, { lockUntil: { $lte: now } }] });
  } else if (query.status === 'inactive') {
    filter.isActive = false;
  } else if (query.status === 'locked') {
    filter.lockUntil = { $gt: now };
  }

  // 4. Role Filter
  if (query.roleId && query.roleId !== 'all') {
    filter.roles = query.roleId;
  }

  // 5. Access Status Filter (Assigned vs Unassigned Roles)
  if (query.accessStatus === 'assigned') {
    filter.roles = { $exists: true, $not: { $size: 0 } };
  } else if (query.accessStatus === 'unassigned') {
    andClauses.push({ $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] });
  }

  // 6. 2FA Enforced Filter
  if (query.has2fa === 'true') {
    filter.twoFactorEnabled = true;
  } else if (query.has2fa === 'false') {
    filter.twoFactorEnabled = false;
  }

  // 7. Multi-field Search (Name, Email, Employee Code)
  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    const matchedEmployees = await Employee.find({
      $or: [
        { name: searchRegex },
        { employeeCode: searchRegex }
      ],
      isDeleted: false
    }).select('userId');

    const matchedUserIds = matchedEmployees.map((e) => e.userId).filter(Boolean);

    const searchConditions = [
      { name: searchRegex },
      { email: searchRegex }
    ];

    if (matchedUserIds.length > 0) {
      searchConditions.push({ _id: { $in: matchedUserIds } });
    }

    andClauses.push({ $or: searchConditions });
  }

  if (andClauses.length > 0) {
    filter.$and = andClauses;
  }

  // Sorting
  const sortField = query.sortBy || 'createdAt';
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sortObj = { [sortField]: sortDirection };

  const [rawUsers, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash -refreshTokenHash -resetOtpHash -twoFactorOtpHash')
      .populate('roles', 'name description isSystem')
      .populate({
        path: 'employeeId',
        select: 'name employeeCode departmentId designationId employmentStatus avatar phone',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'designationId', select: 'title code' }
        ]
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  // Format users payload with safe fallback coordinates
  const users = rawUsers.map((u) => {
    const isLocked = Boolean(u.lockUntil && new Date(u.lockUntil) > now);
    let accountStatus = 'active';
    if (isLocked) accountStatus = 'locked';
    else if (!u.isActive) accountStatus = 'inactive';

    const emp = u.employeeId;
    const resolvedName = u.name || emp?.name || u.email.split('@')[0];

    return {
      ...u,
      name: resolvedName,
      isLocked,
      accountStatus,
      employee: emp
        ? {
            id: emp._id,
            name: emp.name,
            employeeCode: emp.employeeCode,
            department: emp.departmentId?.name || 'Unassigned',
            designation: emp.designationId?.title || 'Unassigned',
            employmentStatus: emp.employmentStatus,
            avatar: emp.avatar || u.avatar
          }
        : null
    };
  });

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Retrieve aggregated statistics and metrics for User Access dashboard
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const getUserStats = async (actor = null) => {
  const baseFilter = { isDeleted: false };
  const now = new Date();

  // PBAC Scoping
  if (actor && !isActorSuperAdmin(actor) && !isActorHR(actor)) {
    const actorEmployee = await Employee.findOne({ userId: actor._id, isDeleted: false });
    const isDeptMgr = actor.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Department Manager');
    if (isDeptMgr && actorEmployee?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: actorEmployee.departmentId, isDeleted: false }).select('userId');
      baseFilter._id = { $in: deptEmployees.map((e) => e.userId).filter(Boolean) };
    } else {
      baseFilter._id = actor._id;
    }
  }

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    lockedUsers,
    unassignedUsers,
    twoFactorUsers,
    allRoles
  ] = await Promise.all([
    User.countDocuments(baseFilter),
    User.countDocuments({ ...baseFilter, isActive: true, $or: [{ lockUntil: null }, { lockUntil: { $lte: now } }] }),
    User.countDocuments({ ...baseFilter, isActive: false }),
    User.countDocuments({ ...baseFilter, lockUntil: { $gt: now } }),
    User.countDocuments({ ...baseFilter, $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] }),
    User.countDocuments({ ...baseFilter, twoFactorEnabled: true }),
    Role.find({ isDeleted: false }).select('name')
  ]);

  // Aggregate user counts per role
  const roleAggregation = await User.aggregate([
    { $match: baseFilter },
    { $unwind: '$roles' },
    { $group: { _id: '$roles', count: { $sum: 1 } } }
  ]);

  const roleCountMap = new Map();
  roleAggregation.forEach((r) => roleCountMap.set(String(r._id), r.count));

  const roleBreakdown = allRoles.map((r) => ({
    roleId: r._id,
    roleName: r.name,
    count: roleCountMap.get(String(r._id)) || 0
  }));

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    lockedUsers,
    assignedUsers: Math.max(0, totalUsers - unassignedUsers),
    unassignedUsers,
    twoFactorUsers,
    roleBreakdown,
    statusDistribution: {
      active: activeUsers,
      inactive: inactiveUsers,
      locked: lockedUsers
    }
  };
};

/**
 * Retrieve single user by ID with deep forensic coordinates
 * @param {string} id
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const getUserById = async (id, actor = null) => {
  const user = await User.findOne({ _id: id, isDeleted: false })
    .select('-passwordHash -refreshTokenHash -resetOtpHash -twoFactorOtpHash')
    .populate('roles', 'name description isSystem permissions')
    .populate({
      path: 'employeeId',
      select: 'name employeeCode departmentId designationId employmentStatus avatar phone email joiningDate managerId',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title code' },
        { path: 'managerId', select: 'name employeeCode email' }
      ]
    })
    .lean();

  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  // PBAC Scoping Check
  if (actor && !isActorSuperAdmin(actor) && !isActorHR(actor)) {
    const isSelf = String(actor._id) === String(user._id);
    if (!isSelf) {
      const actorEmployee = await Employee.findOne({ userId: actor._id, isDeleted: false });
      const isDeptMgr = actor.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Department Manager');
      const isSameDept = isDeptMgr && actorEmployee?.departmentId &&
        String(user.employeeId?.departmentId?._id || user.employeeId?.departmentId) === String(actorEmployee.departmentId);

      if (!isSameDept) {
        throw new ApiError(403, 'Forbidden: Insufficient privileges to inspect this user account');
      }
    }
  }

  const now = new Date();
  const isLocked = Boolean(user.lockUntil && new Date(user.lockUntil) > now);
  const remainingLockoutMinutes = isLocked
    ? Math.max(1, Math.ceil((new Date(user.lockUntil).getTime() - now.getTime()) / (60 * 1000)))
    : 0;

  return {
    ...user,
    isLocked,
    remainingLockoutMinutes,
    accountStatus: isLocked ? 'locked' : (user.isActive ? 'active' : 'inactive')
  };
};

/**
 * Unlock a locked user account and reset failed login attempts
 * @param {string} id
 * @param {Object} payload
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const unlockUserAccount = async (id, { reason = '' } = {}, actor = null) => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  const wasLocked = Boolean(user.lockUntil && user.lockUntil > new Date());
  user.lockUntil = null;
  user.failedAttempts = 0;
  await user.save();

  await AuditService.log({
    actorId: actor?._id,
    actorEmail: actor?.email || 'admin@hrm.company.pk',
    actorRole: actor?.roles?.[0]?.name || actor?.role || 'Admin',
    action: 'USER_UNLOCK',
    module: 'AUTH',
    targetId: user._id,
    targetModel: 'User',
    details: {
      email: user.email,
      wasLocked,
      reason: reason || 'Account unlocked by administrator'
    }
  }).catch(() => {});

  await notify(user._id, {
    type: 'security',
    title: 'Account Unlocked',
    body: 'Your account lockout has been cleared by an administrator. You may now log in.',
    link: '/login'
  }).catch(() => {});

  emitToCompany('user:updated', {
    userId: user._id,
    action: 'unlocked'
  });

  return {
    message: 'User account has been unlocked successfully.',
    userId: user._id,
    email: user.email,
    isLocked: false,
    failedAttempts: 0,
    accountStatus: user.isActive ? 'active' : 'inactive'
  };
};

/**
 * Revoke all active sessions for a user by invalidating the refresh token
 * @param {string} id
 * @param {Object} payload
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const revokeUserSessions = async (id, { reason = '' } = {}, actor = null) => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  user.refreshTokenHash = null;
  await user.save();

  await AuditService.log({
    actorId: actor?._id,
    actorEmail: actor?.email || 'admin@hrm.company.pk',
    actorRole: actor?.roles?.[0]?.name || actor?.role || 'Admin',
    action: 'USER_SESSIONS_REVOKED',
    module: 'AUTH',
    targetId: user._id,
    targetModel: 'User',
    details: {
      email: user.email,
      reason: reason || 'Active sessions revoked by administrator'
    }
  }).catch(() => {});

  emitToCompany('user:session_revoked', {
    userId: user._id
  });

  return {
    message: 'All active sessions for this user have been terminated.',
    userId: user._id,
    refreshTokenHash: null
  };
};

/**
 * Mandate forced password change upon next login
 * @param {string} id
 * @param {Object} payload
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const forcePasswordChange = async (id, { reason = '' } = {}, actor = null) => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  user.mustChangePassword = true;
  user.refreshTokenHash = null; // Evict current session
  await user.save();

  await AuditService.log({
    actorId: actor?._id,
    actorEmail: actor?.email || 'admin@hrm.company.pk',
    actorRole: actor?.roles?.[0]?.name || actor?.role || 'Admin',
    action: 'USER_FORCE_PASSWORD_CHANGE',
    module: 'AUTH',
    targetId: user._id,
    targetModel: 'User',
    details: {
      email: user.email,
      reason: reason || 'Password change mandate enforced by administrator'
    }
  }).catch(() => {});

  await notify(user._id, {
    type: 'security',
    title: 'Password Change Mandated',
    body: 'An administrator has required you to update your password on your next login.',
    link: '/profile'
  }).catch(() => {});

  return {
    message: 'User is now required to change their password on next login.',
    userId: user._id,
    mustChangePassword: true,
    refreshTokenHash: null
  };
};
