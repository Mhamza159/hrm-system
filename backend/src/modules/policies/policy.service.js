/**
 * @file policy.service.js
 * @description Core Business Logic Service for Company Policies Module.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Implements lifecycle state machine, semantic versioning snapshots,
 *   department/role scoping, digital acknowledgement auditing, and notification triggers.
 */

import mongoose from 'mongoose';
import { Policy } from '../../models/policy.model.js';
import { PolicyCategory } from '../../models/policyCategory.model.js';
import { PolicyVersion } from '../../models/policyVersion.model.js';
import { PolicyAcknowledgement } from '../../models/policyAcknowledgement.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { notify } from '../../services/notify.service.js';

/**
 * Helper to determine user roles and check administration privileges
 */
const getUserRoleNames = (user) => {
  if (!user || !user.roles) return [];
  return user.roles.map((r) => (typeof r === 'object' ? r.name : r));
};

const isAdminOrHR = (user) => {
  const roles = getUserRoleNames(user);
  return roles.includes('Super Admin') || roles.includes('HR Manager');
};

const isDeptManager = (user) => {
  const roles = getUserRoleNames(user);
  return roles.includes('Department Manager');
};

/**
 * 1. List Policies with Scoping, Filtering, and Pagination
 */
export const getPolicies = async (query = {}, user) => {
  const {
    search,
    category,
    status,
    scope,
    page = 1,
    limit = 20,
    myPoliciesOnly = false
  } = query;

  const mongoQuery = { isDeleted: false };

  // Role-based visibility scoping
  const hasFullAccess = isAdminOrHR(user);
  let employeeDoc = null;

  if (user && user._id) {
    employeeDoc = await Employee.findOne({
      $or: [{ userId: user._id }, { email: user.email }],
      isDeleted: false
    }).lean();
  }

  if (!hasFullAccess) {
    // Non-HR users can only see Published policies
    mongoQuery.status = 'Published';

    // Department and Role Scoping
    const scopeOr = [
      { scope: 'All Employees' }
    ];

    if (employeeDoc && employeeDoc.departmentId) {
      scopeOr.push({
        scope: 'Department Specific',
        applicableDepartmentIds: employeeDoc.departmentId
      });
    }

    if (isDeptManager(user)) {
      scopeOr.push({ scope: 'Management Only' });
    }

    mongoQuery.$or = scopeOr;
  } else if (status) {
    mongoQuery.status = status;
  }

  // Filter by category
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      mongoQuery.categoryId = category;
    } else {
      const catDoc = await PolicyCategory.findOne({
        $or: [{ code: category.toUpperCase() }, { name: category }],
        isDeleted: false
      }).lean();
      if (catDoc) mongoQuery.categoryId = catDoc._id;
    }
  }

  // Filter by scope
  if (scope) {
    mongoQuery.scope = scope;
  }

  // Search filter (safely combines with role-based scoping using $and if $or is already set)
  if (search && search.trim()) {
    const s = search.trim();
    const searchConditions = [
      { title: { $regex: s, $options: 'i' } },
      { policyCode: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } }
    ];

    if (mongoQuery.$or) {
      mongoQuery.$and = [
        { $or: mongoQuery.$or },
        { $or: searchConditions }
      ];
      delete mongoQuery.$or;
    } else {
      mongoQuery.$or = searchConditions;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Policy.countDocuments(mongoQuery);

  const policies = await Policy.find(mongoQuery)
    .populate('categoryId', 'name code icon color')
    .populate('ownerDepartmentId', 'name')
    .populate('ownerId', 'name email')
    .sort({ updatedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // Attach acknowledgement status for the current user/employee
  let employeeAcknowledgements = {};
  if (employeeDoc) {
    const acks = await PolicyAcknowledgement.find({
      employeeId: employeeDoc._id,
      isLatestVersion: true
    }).lean();

    for (const a of acks) {
      employeeAcknowledgements[a.policyId.toString()] = a;
    }
  }

  const items = policies.map((p) => {
    const ack = employeeAcknowledgements[p._id.toString()];
    return {
      ...p,
      hasAcknowledged: !!ack,
      acknowledgedAt: ack ? ack.acknowledgedAt : null,
      signatureText: ack ? ack.signatureText : null
    };
  });

  // Filter down to 'my policies' if requested
  const filteredItems = myPoliciesOnly
    ? items.filter((p) => p.requiresAcknowledgement)
    : items;

  return {
    items: filteredItems,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1
  };
};

/**
 * 2. Executive Dashboard KPIs & Analytics
 */
export const getPolicyStats = async (_user) => {
  const baseQuery = { isDeleted: false };

  const [
    totalPolicies,
    publishedPolicies,
    draftPolicies,
    pendingApprovalPolicies,
    archivedPolicies,
    requiringAcknowledgementCount,
    allPublishedPolicies
  ] = await Promise.all([
    Policy.countDocuments(baseQuery),
    Policy.countDocuments({ ...baseQuery, status: 'Published' }),
    Policy.countDocuments({ ...baseQuery, status: 'Draft' }),
    Policy.countDocuments({ ...baseQuery, status: 'Pending Approval' }),
    Policy.countDocuments({ ...baseQuery, status: 'Archived' }),
    Policy.countDocuments({ ...baseQuery, status: 'Published', requiresAcknowledgement: true }),
    Policy.find({ ...baseQuery, status: 'Published', requiresAcknowledgement: true }).select('_id version').lean()
  ]);

  // Compute workforce compliance percentage across mandatory policies
  let totalMandatorySlots = 0;
  let totalSignedSlots = 0;

  if (allPublishedPolicies.length > 0) {
    const totalActiveEmployees = await Employee.countDocuments({ isDeleted: false, status: 'Active' });
    totalMandatorySlots = allPublishedPolicies.length * (totalActiveEmployees || 1);

    const signedCount = await PolicyAcknowledgement.countDocuments({
      isLatestVersion: true,
      policyId: { $in: allPublishedPolicies.map((p) => p._id) }
    });
    totalSignedSlots = signedCount;
  }

  const overallComplianceRate =
    totalMandatorySlots > 0 ? Math.round((totalSignedSlots / totalMandatorySlots) * 100) : 100;

  return {
    totalPolicies,
    publishedPolicies,
    draftPolicies,
    pendingApprovalPolicies,
    archivedPolicies,
    requiringAcknowledgementCount,
    overallComplianceRate
  };
};

/**
 * 3. Get Single Policy Details
 */
export const getPolicyById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid policy ID format');
  }

  const policy = await Policy.findOne({ _id: id, isDeleted: false })
    .populate('categoryId', 'name code icon color')
    .populate('ownerDepartmentId', 'name')
    .populate('ownerId', 'name email')
    .populate('approvedBy', 'name email')
    .lean();

  if (!policy) {
    throw new ApiError(404, 'Policy not found');
  }

  // Non-HR users can only view Published policies
  if (!isAdminOrHR(user) && policy.status !== 'Published') {
    throw new ApiError(403, 'You do not have permission to view unpublished policy drafts');
  }

  // Attach user's acknowledgement record if present
  let acknowledgement = null;
  if (user && user._id) {
    const employeeDoc = await Employee.findOne({
      $or: [{ userId: user._id }, { email: user.email }],
      isDeleted: false
    }).lean();

    if (employeeDoc) {
      acknowledgement = await PolicyAcknowledgement.findOne({
        policyId: id,
        policyVersion: policy.version,
        employeeId: employeeDoc._id
      }).lean();
    }
  }

  return {
    ...policy,
    hasAcknowledged: !!acknowledgement,
    acknowledgement
  };
};

/**
 * 4. Create Policy Draft
 */
export const createPolicy = async (data, user) => {
  const existing = await Policy.findOne({
    policyCode: data.policyCode.trim().toUpperCase(),
    isDeleted: false
  }).lean();

  if (existing) {
    throw new ApiError(409, `Policy with code "${data.policyCode}" already exists`);
  }

  const policy = await Policy.create({
    ...data,
    policyCode: data.policyCode.trim().toUpperCase(),
    ownerId: user._id,
    status: 'Draft',
    version: '1.0'
  });

  return policy;
};

/**
 * 5. Update Policy
 */
export const updatePolicy = async (id, data, _user) => {
  const policy = await Policy.findOne({ _id: id, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, 'Policy not found');
  }

  // If modifying a Published policy, archive previous version into PolicyVersion history
  if (policy.status === 'Published') {
    await PolicyVersion.create({
      policyId: policy._id,
      version: policy.version,
      title: policy.title,
      content: policy.content,
      fileUrl: policy.fileUrl,
      fileType: policy.fileType,
      fileSize: policy.fileSize,
      changeSummary: data.changeSummary || 'Revision update to published policy',
      effectiveDate: policy.effectiveDate,
      publishedAt: policy.publishedAt || new Date(),
      createdBy: policy.ownerId,
      approvedBy: policy.approvedBy
    });

    // Bump version (e.g. 1.0 -> 1.1)
    const currentVerParts = policy.version.split('.');
    const major = currentVerParts[0] || '1';
    const minor = Number(currentVerParts[1] || '0') + 1;
    policy.version = `${major}.${minor}`;

    // Reset status to Draft or Pending Approval for governance
    policy.status = 'Draft';
  }

  // Update policy fields
  const allowedFields = [
    'title',
    'categoryId',
    'description',
    'content',
    'scope',
    'applicableDepartmentIds',
    'applicableRoleNames',
    'requiresAcknowledgement',
    'acknowledgementGracePeriodDays',
    'effectiveDate',
    'reviewDate',
    'expiryDate',
    'fileUrl',
    'fileType',
    'fileSize'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      policy[field] = data[field];
    }
  }

  await policy.save();
  return policy;
};

/**
 * 6. Soft Delete / Archive Policy
 */
export const deletePolicy = async (id, _user) => {
  const policy = await Policy.findOne({ _id: id, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, 'Policy not found');
  }

  policy.isDeleted = true;
  policy.status = 'Archived';
  await policy.save();

  return { message: 'Policy successfully removed' };
};

/**
 * 7. Submit Policy for Review / Approval
 */
export const submitPolicyForApproval = async (id, _user) => {
  const policy = await Policy.findOne({ _id: id, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, 'Policy not found');
  }

  if (policy.status !== 'Draft' && policy.status !== 'Rejected') {
    throw new ApiError(400, `Cannot submit policy currently in "${policy.status}" status`);
  }

  policy.status = 'Pending Approval';
  policy.rejectionReason = null;
  await policy.save();

  // Notify HR Managers and Super Admins
  const hrUsers = await User.find({ isDeleted: false }).populate('roles').lean();
  const approverIds = hrUsers
    .filter((u) => {
      const rNames = (u.roles || []).map((r) => (typeof r === 'object' ? r.name : r));
      return rNames.includes('Super Admin') || rNames.includes('HR Manager');
    })
    .map((u) => u._id);

  if (approverIds.length > 0) {
    await notify(approverIds, {
      type: 'system',
      title: 'Policy Submitted for Approval',
      body: `"${policy.title}" (${policy.policyCode}) has been submitted for governance review.`,
      link: `/policies?id=${policy._id}`
    });
  }

  return policy;
};

/**
 * 8. Approve Policy
 */
export const approvePolicy = async (id, { notes: _notes = '' } = {}, user) => {
  const policy = await Policy.findOne({ _id: id, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, 'Policy not found');
  }

  if (policy.status !== 'Pending Approval') {
    throw new ApiError(400, `Only policies in "Pending Approval" status can be approved`);
  }

  policy.status = 'Approved';
  policy.approvedBy = user._id;
  policy.approvedAt = new Date();
  await policy.save();

  // Notify policy owner
  if (policy.ownerId) {
    await notify(policy.ownerId, {
      type: 'system',
      title: 'Policy Approved',
      body: `Your policy proposal "${policy.title}" has been approved and is ready to be published.`,
      link: `/policies?id=${policy._id}`
    });
  }

  return policy;
};

/**
 * 9. Reject Policy
 */
export const rejectPolicy = async (id, { reason }, _user) => {
  const policy = await Policy.findOne({ _id: id, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, 'Policy not found');
  }

  if (policy.status !== 'Pending Approval') {
    throw new ApiError(400, `Only policies in "Pending Approval" status can be rejected`);
  }

  policy.status = 'Rejected';
  policy.rejectionReason = reason;
  await policy.save();

  // Notify policy owner
  if (policy.ownerId) {
    await notify(policy.ownerId, {
      type: 'system',
      title: 'Policy Proposal Returned',
      body: `"${policy.title}" was not approved: "${reason}"`,
      link: `/policies?id=${policy._id}`
    });
  }

  return policy;
};

/**
 * 10. Publish Policy
 */
export const publishPolicy = async (id, { effectiveDate, notifyWorkforce = true }, user) => {
  const policy = await Policy.findOne({ _id: id, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, 'Policy not found');
  }

  if (policy.status !== 'Approved' && policy.status !== 'Draft') {
    throw new ApiError(400, `Policy must be Approved before publishing`);
  }

  policy.status = 'Published';
  policy.publishedAt = new Date();
  policy.effectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();
  await policy.save();

  // Create immutable snapshot in PolicyVersion
  await PolicyVersion.findOneAndUpdate(
    { policyId: policy._id, version: policy.version },
    {
      title: policy.title,
      content: policy.content,
      fileUrl: policy.fileUrl,
      fileType: policy.fileType,
      fileSize: policy.fileSize,
      changeSummary: 'Published version',
      effectiveDate: policy.effectiveDate,
      publishedAt: policy.publishedAt,
      createdBy: policy.ownerId,
      approvedBy: policy.approvedBy || user._id
    },
    { upsert: true, new: true }
  );

  // Invalidate previous version acknowledgements for this policy
  await PolicyAcknowledgement.updateMany(
    { policyId: policy._id, policyVersion: { $ne: policy.version } },
    { $set: { isLatestVersion: false } }
  );

  // Dispatch workforce notification if required
  if (notifyWorkforce) {
    let targetEmployeeQuery = { isDeleted: false, status: 'Active' };
    if (policy.scope === 'Department Specific' && policy.applicableDepartmentIds?.length > 0) {
      targetEmployeeQuery.departmentId = { $in: policy.applicableDepartmentIds };
    }

    const emps = await Employee.find(targetEmployeeQuery).select('userId').lean();
    const userIds = emps.map((e) => e.userId).filter(Boolean);

    if (userIds.length > 0) {
      const ackMsg = policy.requiresAcknowledgement
        ? ' Your signature and acknowledgement are required.'
        : '';
      await notify(userIds, {
        type: 'announcement',
        title: `Official Policy Published: ${policy.title}`,
        body: `New corporate policy "${policy.title}" (${policy.version}) has taken effect.${ackMsg}`,
        link: `/policies?id=${policy._id}`
      });
    }
  }

  return policy;
};

/**
 * 11. Sign / Acknowledge Policy (Employee)
 */
export const acknowledgePolicy = async (id, { signatureText, ipAddress, userAgent }, user) => {
  const policy = await Policy.findOne({ _id: id, isDeleted: false, status: 'Published' });
  if (!policy) {
    throw new ApiError(404, 'Active published policy not found');
  }

  const employee = await Employee.findOne({
    $or: [{ userId: user._id }, { email: user.email }],
    isDeleted: false
  });

  if (!employee) {
    throw new ApiError(404, 'Employee profile not associated with this user');
  }

  // Check if already signed this exact version
  const existingAck = await PolicyAcknowledgement.findOne({
    policyId: policy._id,
    policyVersion: policy.version,
    employeeId: employee._id
  });

  if (existingAck) {
    throw new ApiError(409, `You have already acknowledged policy version ${policy.version}`);
  }

  const acknowledgement = await PolicyAcknowledgement.create({
    policyId: policy._id,
    policyVersion: policy.version,
    employeeId: employee._id,
    userId: user._id,
    signatureText: signatureText.trim(),
    acknowledgedAt: new Date(),
    ipAddress,
    userAgent,
    isLatestVersion: true
  });

  return acknowledgement;
};

/**
 * 12. Policy Acknowledgement Compliance Roster (Admin Tracking)
 */
export const getPolicyAcknowledgements = async (id, query = {}) => {
  const policy = await Policy.findOne({ _id: id, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, 'Policy not found');
  }

  // Build eligible employee query
  const empQuery = { isDeleted: false, status: 'Active' };
  if (policy.scope === 'Department Specific' && policy.applicableDepartmentIds?.length > 0) {
    empQuery.departmentId = { $in: policy.applicableDepartmentIds };
  }

  if (query.departmentId && mongoose.Types.ObjectId.isValid(query.departmentId)) {
    empQuery.departmentId = query.departmentId;
  }

  const eligibleEmployees = await Employee.find(empQuery)
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .select('name employeeCode email departmentId designationId avatar')
    .sort({ name: 1 })
    .lean();

  const acknowledgements = await PolicyAcknowledgement.find({
    policyId: policy._id,
    policyVersion: policy.version
  }).lean();

  const ackMap = {};
  for (const a of acknowledgements) {
    ackMap[a.employeeId.toString()] = a;
  }

  const totalEligible = eligibleEmployees.length;
  let signedCount = 0;

  const roster = eligibleEmployees.map((emp) => {
    const ack = ackMap[emp._id.toString()];
    if (ack) signedCount += 1;

    return {
      employeeId: emp._id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      email: emp.email,
      avatar: emp.avatar,
      department: emp.departmentId?.name || 'Unassigned',
      designation: emp.designationId?.title || 'Staff',
      isAcknowledged: !!ack,
      acknowledgedAt: ack ? ack.acknowledgedAt : null,
      signatureText: ack ? ack.signatureText : null,
      ipAddress: ack ? ack.ipAddress : null
    };
  });

  // Calculate department progress
  const deptMap = {};
  for (const r of roster) {
    if (!deptMap[r.department]) {
      deptMap[r.department] = { total: 0, signed: 0 };
    }
    deptMap[r.department].total += 1;
    if (r.isAcknowledged) deptMap[r.department].signed += 1;
  }

  const departmentBreakdown = Object.entries(deptMap).map(([departmentName, stats]) => ({
    departmentName,
    total: stats.total,
    signed: stats.signed,
    percentage: stats.total > 0 ? Math.round((stats.signed / stats.total) * 100) : 100
  }));

  const compliancePercentage =
    totalEligible > 0 ? Math.round((signedCount / totalEligible) * 100) : 100;

  return {
    policyId: policy._id,
    policyTitle: policy.title,
    version: policy.version,
    totalEligible,
    signedCount,
    pendingCount: totalEligible - signedCount,
    compliancePercentage,
    departmentBreakdown,
    roster
  };
};

/**
 * 13. Policy Version History
 */
export const getPolicyVersions = async (id) => {
  const versions = await PolicyVersion.find({ policyId: id })
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return versions;
};

/**
 * 14. Category Management
 */
export const getCategories = async () => {
  const categories = await PolicyCategory.find({ isDeleted: false })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  // Attach policy counts per category
  const counts = await Policy.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } }
  ]);

  const countMap = {};
  for (const c of counts) {
    if (c._id) countMap[c._id.toString()] = c.count;
  }

  return categories.map((cat) => ({
    ...cat,
    policyCount: countMap[cat._id.toString()] || 0
  }));
};

export const createCategory = async (data) => {
  const existing = await PolicyCategory.findOne({
    code: data.code.trim().toUpperCase(),
    isDeleted: false
  }).lean();

  if (existing) {
    throw new ApiError(409, `Category with code "${data.code}" already exists`);
  }

  const category = await PolicyCategory.create({
    ...data,
    code: data.code.trim().toUpperCase()
  });

  return category;
};

export const updateCategory = async (id, data) => {
  const category = await PolicyCategory.findOne({ _id: id, isDeleted: false });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (data.name) category.name = data.name;
  if (data.description !== undefined) category.description = data.description;
  if (data.icon) category.icon = data.icon;
  if (data.color) category.color = data.color;
  if (data.displayOrder !== undefined) category.displayOrder = data.displayOrder;

  await category.save();
  return category;
};

export const deleteCategory = async (id) => {
  const category = await PolicyCategory.findOne({ _id: id, isDeleted: false });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Prevent deleting category if it has active policies
  const inUseCount = await Policy.countDocuments({ categoryId: id, isDeleted: false });
  if (inUseCount > 0) {
    throw new ApiError(400, `Cannot delete category because it is used by ${inUseCount} policy documents`);
  }

  category.isDeleted = true;
  await category.save();
  return { message: 'Category removed' };
};
