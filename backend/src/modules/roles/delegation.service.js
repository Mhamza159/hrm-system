/**
 * @file delegation.service.js
 * @description Service Layer for Approvals Delegation System (Slice 26.14).
 * 
 * SPECIFICATION:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.14)
 * - Layer: Service (Domain Business Logic & Data Persistence)
 */

import { Delegation } from '../../models/delegation.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordAuditLog } from '../../services/audit.service.js';

/**
 * Create a new approval delegation
 * @param {Object} data - Delegation payload (toUserId, permissions, startDate, endDate, reason)
 * @param {Object} actor - Authenticated manager delegating authority
 * @param {string} ip - Client IP
 */
export const createDelegation = async (data, actor, ip) => {
  const { toUserId, permissions = [], startDate, endDate, reason = '' } = data;

  if (String(actor._id) === String(toUserId)) {
    throw new ApiError(400, 'Cannot delegate approvals to yourself.');
  }

  const delegateUser = await User.findOne({ _id: toUserId, isDeleted: false });
  if (!delegateUser) {
    throw new ApiError(404, 'Delegate recipient user not found.');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError(400, 'Invalid startDate or endDate timestamp.');
  }

  if (end <= start) {
    throw new ApiError(400, 'End date must occur after start date.');
  }

  const delegation = await Delegation.create({
    fromUserId: actor._id,
    toUserId,
    permissions,
    startDate: start,
    endDate: end,
    status: 'active',
    reason: reason.trim()
  });

  await recordAuditLog({
    userId: actor._id,
    action: 'delegation.create',
    entity: 'Delegation',
    entityId: delegation._id,
    before: null,
    after: delegation.toObject(),
    ip,
    details: { toUserId, startDate: start, endDate: end }
  });

  return delegation;
};

/**
 * Retrieve delegations related to user (either created by user or delegated to user)
 * @param {Object} actor - Authenticated user
 */
export const getDelegations = async (actor) => {
  const isSuperAdmin = actor?.roles?.some((r) =>
    typeof r === 'string' ? r === 'Super Admin' : r?.name === 'Super Admin'
  );

  let query = {};
  if (!isSuperAdmin) {
    query = {
      $or: [{ fromUserId: actor._id }, { toUserId: actor._id }]
    };
  }

  return await Delegation.find(query)
    .populate('fromUserId', 'email')
    .populate('toUserId', 'email')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Cancel an active delegation
 * @param {string} delegationId - Delegation ObjectId
 * @param {Object} actor - Requesting user
 * @param {string} ip - Client IP
 */
export const cancelDelegation = async (delegationId, actor, ip) => {
  const delegation = await Delegation.findById(delegationId);
  if (!delegation) {
    throw new ApiError(404, 'Delegation not found.');
  }

  const isSuperAdmin = actor?.roles?.some((r) =>
    typeof r === 'string' ? r === 'Super Admin' : r?.name === 'Super Admin'
  );

  if (!isSuperAdmin && String(delegation.fromUserId) !== String(actor._id)) {
    throw new ApiError(403, 'Only the delegating manager or Super Admin can cancel this delegation.');
  }

  const before = delegation.toObject();
  delegation.status = 'cancelled';
  await delegation.save();

  await recordAuditLog({
    userId: actor._id,
    action: 'delegation.cancel',
    entity: 'Delegation',
    entityId: delegation._id,
    before,
    after: { status: 'cancelled' },
    ip
  });

  return { message: 'Delegation cancelled successfully.' };
};
