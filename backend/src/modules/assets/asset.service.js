/**
 * @file asset.service.js
 * @description Core Domain Service for Module M23 Asset Management.
 * 
 * SPECIFICATION & BUSINESS LOGIC:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1 to 23.6)
 * - Layer: Domain Service Layer (All DB queries, mutations & validations live here)
 * - Reuses: ApiError, recordAuditLog, notify, Employee, User, Department models.
 */

import { Asset } from '../../models/asset.model.js';
import { AssetRequest } from '../../models/assetRequest.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { Role } from '../../models/role.model.js';
import { ApiError } from '../../utils/apiError.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';

/**
 * 23.1: Register a new physical hardware or software asset into inventory
 */
export const createAsset = async ({ assetData, user, ipAddress, userAgent }) => {
  const existingTag = await Asset.findOne({
    assetTag: assetData.assetTag.toUpperCase().trim(),
    isDeleted: false
  });
  if (existingTag) {
    throw new ApiError(409, `Asset tag '${assetData.assetTag}' is already registered in inventory.`);
  }

  const existingSerial = await Asset.findOne({
    serialNumber: assetData.serialNumber.trim(),
    isDeleted: false
  });
  if (existingSerial) {
    throw new ApiError(409, `Asset with serial number / license key '${assetData.serialNumber}' already exists.`);
  }

  const initialHistory = {
    action: 'created',
    performedBy: user._id,
    date: new Date(),
    notes: 'Initial asset register entry',
    condition: 'new'
  };

  const asset = await Asset.create({
    ...assetData,
    assetTag: assetData.assetTag.toUpperCase().trim(),
    serialNumber: assetData.serialNumber.trim(),
    history: [initialHistory]
  });

  await recordAuditLog({
    actorId: user._id,
    action: 'asset.create',
    module: 'assets',
    resource: 'Asset',
    resourceId: asset._id,
    after: asset.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return asset;
};

export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * 23.1: Retrieve paginated asset catalog with multi-axis filtering
 */
export const getAssets = async ({ query = {}, user }) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  if (query.type && query.type !== 'all') {
    filter.type = query.type;
  }

  if (query.search) {
    const term = escapeRegex(query.search.trim());
    filter.$or = [
      { assetTag: { $regex: term, $options: 'i' } },
      { name: { $regex: term, $options: 'i' } },
      { serialNumber: { $regex: term, $options: 'i' } },
      { modelNumber: { $regex: term, $options: 'i' } }
    ];
  }

  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.expiringSoon === 'true' || query.expiringSoon === '1') {
    const today = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(today.getDate() + 30);

    filter.$or = [
      { warrantyExpiresAt: { $gte: today, $lte: thirtyDaysAhead } },
      { licenseExpiresAt: { $gte: today, $lte: thirtyDaysAhead } }
    ];
  }

  const [assets, total] = await Promise.all([
    Asset.find(filter)
      .populate('assignedTo', 'firstName lastName employeeCode departmentId workEmail phone')
      .populate('history.performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Asset.countDocuments(filter)
  ]);

  return {
    assets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * 23.1: Retrieve single asset record with detailed history, repairs & issues
 */
export const getAssetById = async (id) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false })
    .populate('assignedTo', 'firstName lastName employeeCode departmentId workEmail phone designationId')
    .populate('history.performedBy', 'name email')
    .populate('history.employeeId', 'firstName lastName employeeCode')
    .populate('issues.reportedBy', 'firstName lastName employeeCode workEmail')
    .lean();

  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  return asset;
};

/**
 * 23.1: Update asset attributes and specifications
 */
export const updateAsset = async ({ id, updateData, user, ipAddress, userAgent }) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const previousState = asset.toObject();

  Object.assign(asset, updateData);
  await asset.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'asset.update',
    module: 'assets',
    resource: 'Asset',
    resourceId: asset._id,
    before: previousState,
    after: asset.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return asset;
};

/**
 * 23.1: Soft-delete an asset
 */
export const deleteAsset = async ({ id, user, ipAddress, userAgent }) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  if (asset.status === 'assigned') {
    throw new ApiError(400, 'Cannot delete an asset that is currently assigned to a custodian. Please return it first.');
  }

  asset.isDeleted = true;
  await asset.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'asset.delete',
    module: 'assets',
    resource: 'Asset',
    resourceId: asset._id,
    before: asset.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return { message: 'Asset deleted successfully' };
};

/**
 * 23.2: Assign available asset to an employee custodian
 */
export const assignAsset = async ({ id, employeeId, assignedDate, notes = '', condition = 'good', user, ipAddress, userAgent }) => {
  const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Designated employee custodian not found');
  }

  const existingAsset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!existingAsset) {
    throw new ApiError(404, 'Asset not found');
  }

  if (existingAsset.status === 'assigned') {
    throw new ApiError(400, 'Asset is already assigned to a custodian. Please process return first.');
  }

  if (existingAsset.status === 'under_repair') {
    throw new ApiError(400, 'Asset is currently under repair and cannot be assigned.');
  }

  if (existingAsset.status === 'retired' || existingAsset.status === 'lost') {
    throw new ApiError(400, `Asset cannot be assigned because its status is '${existingAsset.status}'.`);
  }

  const prev = existingAsset.toObject();

  // Atomic conditional update to guard against concurrency races
  const asset = await Asset.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
      status: 'available'
    },
    {
      $set: {
        assignedTo: employee._id,
        status: 'assigned'
      },
      $push: {
        history: {
          action: 'assigned',
          employeeId: employee._id,
          performedBy: user._id,
          date: assignedDate ? new Date(assignedDate) : new Date(),
          condition,
          notes: notes.trim()
        }
      }
    },
    { new: true }
  );

  if (!asset) {
    throw new ApiError(400, 'Asset is already assigned to a custodian. Please process return first.');
  }

  await recordAuditLog({
    actorId: user._id,
    action: 'asset.assign',
    module: 'assets',
    resource: 'Asset',
    resourceId: asset._id,
    before: prev,
    after: asset.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  // Notify employee custodian
  if (employee.userId) {
    await notify(employee.userId, {
      title: 'Company Asset Assigned',
      body: `You have been assigned ${asset.name} (Tag: ${asset.assetTag}).`,
      message: `You have been assigned ${asset.name} (Tag: ${asset.assetTag}).`,
      type: 'system',
      link: '/assets/my'
    }).catch((err) => console.error('[Notify Error]', err.message));
  }

  return asset;
};

/**
 * 23.2: Process return of asset from custodian back to inventory
 */
export const returnAsset = async ({ id, returnDate, condition = 'good', notes = '', user, ipAddress, userAgent }) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  if (asset.status !== 'assigned') {
    throw new ApiError(400, `Asset is not currently assigned (current status: '${asset.status}').`);
  }

  const previousCustodianId = asset.assignedTo;
  const prev = asset.toObject();

  asset.assignedTo = null;
  asset.status = 'available';
  asset.hasOpenIssue = false; // Close active issues on check-in
  asset.history.push({
    action: 'returned',
    employeeId: previousCustodianId,
    performedBy: user._id,
    date: returnDate ? new Date(returnDate) : new Date(),
    condition,
    notes: notes.trim()
  });

  await asset.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'asset.return',
    module: 'assets',
    resource: 'Asset',
    resourceId: asset._id,
    before: prev,
    after: asset.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return asset;
};

/**
 * 23.4: Dispatch asset for maintenance / repair
 */
export const sendAssetForRepair = async ({ id, repairData, user, ipAddress, userAgent }) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const prev = asset.toObject();

  const repairRecord = {
    issueDescription: repairData.issueDescription.trim(),
    vendorName: repairData.vendorName.trim(),
    repairCostPaisa: repairData.repairCostPaisa || 0,
    sentDate: repairData.sentDate ? new Date(repairData.sentDate) : new Date(),
    expectedReturnDate: repairData.expectedReturnDate ? new Date(repairData.expectedReturnDate) : null,
    status: 'in_progress'
  };

  asset.status = 'under_repair';
  asset.repairs.push(repairRecord);
  asset.history.push({
    action: 'repair_sent',
    performedBy: user._id,
    date: new Date(),
    notes: `Sent to ${repairData.vendorName}: ${repairData.issueDescription}`
  });

  await asset.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'asset.repair_sent',
    module: 'assets',
    resource: 'Asset',
    resourceId: asset._id,
    before: prev,
    after: asset.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return asset;
};

/**
 * 23.4: Complete repair and restore asset to inventory
 */
export const completeAssetRepair = async ({ id, repairId, updateData, user, ipAddress, userAgent }) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const repair = asset.repairs.id(repairId);
  if (!repair) {
    throw new ApiError(404, 'Repair record not found on this asset');
  }

  const prev = asset.toObject();

  repair.status = updateData.status;
  repair.actualReturnDate = updateData.actualReturnDate ? new Date(updateData.actualReturnDate) : new Date();
  if (updateData.finalCostPaisa !== undefined) {
    repair.repairCostPaisa = updateData.finalCostPaisa;
  }
  if (updateData.resolutionNotes) {
    repair.resolutionNotes = updateData.resolutionNotes.trim();
  }

  // If repair was completed or unrepairable, transition asset status
  if (updateData.status === 'completed') {
    asset.status = asset.assignedTo ? 'assigned' : 'available';
    asset.hasOpenIssue = false;
  } else if (updateData.status === 'unrepairable') {
    asset.status = 'retired';
  }

  asset.history.push({
    action: 'repair_completed',
    performedBy: user._id,
    date: new Date(),
    notes: `Repair ${updateData.status}: ${updateData.resolutionNotes || 'Returned from vendor'}`
  });

  await asset.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'asset.repair_completed',
    module: 'assets',
    resource: 'Asset',
    resourceId: asset._id,
    before: prev,
    after: asset.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return asset;
};

/**
 * 23.6: Employee Self-Service: Get all assets assigned to current employee
 */
export const getMyAssets = async ({ user }) => {
  let employeeId = user.employeeId;
  if (!employeeId) {
    const emp = await Employee.findOne({ userId: user._id });
    if (!emp) {
      return [];
    }
    employeeId = emp._id;
  }

  const assets = await Asset.find({
    assignedTo: employeeId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .lean();

  return assets;
};

/**
 * 23.6: Employee reports damage or malfunction on assigned asset
 */
export const reportAssetIssue = async ({ id, issueData, user, ipAddress, userAgent }) => {
  let employeeId = user.employeeId;
  if (!employeeId) {
    const emp = await Employee.findOne({ userId: user._id });
    if (!emp) {
      throw new ApiError(403, 'Employee profile not associated with this account');
    }
    employeeId = emp._id;
  }

  const asset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  if (!asset.assignedTo || asset.assignedTo.toString() !== employeeId.toString()) {
    throw new ApiError(403, 'You can only report issues on assets currently assigned to you');
  }

  const prev = asset.toObject();

  const issueRecord = {
    reportedBy: employeeId,
    issueType: issueData.issueType,
    description: issueData.description.trim(),
    severity: issueData.severity || 'medium',
    status: 'open',
    reportedAt: new Date()
  };

  asset.issues.push(issueRecord);
  asset.hasOpenIssue = true;
  await asset.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'asset.issue_report',
    module: 'assets',
    resource: 'Asset',
    resourceId: asset._id,
    before: prev,
    after: asset.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  // Notify HR Managers
  const hrRole = await Role.findOne({ name: 'HR Manager' });
  if (hrRole) {
    const hrUsers = await User.find({ roles: hrRole._id, isActive: true });
    const hrUserIds = hrUsers.map((u) => u._id);
    if (hrUserIds.length > 0) {
      await notify(hrUserIds, {
        title: 'Asset Issue Reported',
        body: `Issue reported on ${asset.name} (${asset.assetTag}): ${issueData.description}`,
        message: `Issue reported on ${asset.name} (${asset.assetTag}): ${issueData.description}`,
        type: 'system',
        link: `/assets/${asset._id}`
      }).catch((err) => console.error('[Notify Error]', err.message));
    }
  }

  return asset;
};

/**
 * 23.5: Manager submits asset requisition for subordinate
 */
export const createAssetRequest = async ({ requestData, user, ipAddress, userAgent }) => {
  const targetEmployee = await Employee.findOne({ _id: requestData.employeeId, isDeleted: false });
  if (!targetEmployee) {
    throw new ApiError(404, 'Target employee not found');
  }

  const isSuperAdmin = user.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin');
  const isHR = user.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'HR Manager');

  // If not Super Admin or HR, check department manager scoping
  if (!isSuperAdmin && !isHR) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false });
    if (!managerEmp) {
      throw new ApiError(403, 'Manager profile not found');
    }

    if (
      !targetEmployee.departmentId ||
      !managerEmp.departmentId ||
      targetEmployee.departmentId.toString() !== managerEmp.departmentId.toString()
    ) {
      throw new ApiError(403, 'You can only request assets for members in your own department');
    }
  }

  const assetRequest = await AssetRequest.create({
    requestedBy: user._id,
    departmentId: targetEmployee.departmentId,
    employeeId: targetEmployee._id,
    assetType: requestData.assetType,
    priority: requestData.priority || 'medium',
    specificationsRequired: requestData.specificationsRequired || '',
    justification: requestData.justification.trim()
  });

  await recordAuditLog({
    actorId: user._id,
    action: 'asset_request.create',
    module: 'assets',
    resource: 'AssetRequest',
    resourceId: assetRequest._id,
    after: assetRequest.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  // Notify HR Managers
  const hrRole = await Role.findOne({ name: 'HR Manager' });
  if (hrRole) {
    const hrUsers = await User.find({ roles: hrRole._id, isActive: true });
    const hrUserIds = hrUsers.map((u) => u._id);
    if (hrUserIds.length > 0) {
      await notify(hrUserIds, {
        title: 'New Asset Requisition',
        body: `Asset requisition submitted for ${targetEmployee.firstName} ${targetEmployee.lastName}.`,
        message: `Asset requisition submitted for ${targetEmployee.firstName} ${targetEmployee.lastName}.`,
        type: 'system',
        link: '/assets/requests'
      }).catch((err) => console.error('[Notify Error]', err.message));
    }
  }

  return assetRequest;
};

/**
 * 23.5: List asset requisitions (Department Manager scoped to department, HR/Super Admin global)
 */
export const getAssetRequests = async ({ user }) => {
  const isSuperAdmin = user.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin');
  const isHR = user.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'HR Manager');

  let filter = {};
  if (!isSuperAdmin && !isHR) {
    const managerEmp = await Employee.findOne({ userId: user._id });
    if (!managerEmp || !managerEmp.departmentId) {
      return [];
    }
    filter.departmentId = managerEmp.departmentId;
  }

  const requests = await AssetRequest.find(filter)
    .populate('requestedBy', 'name email')
    .populate('departmentId', 'name code')
    .populate('employeeId', 'firstName lastName employeeCode workEmail')
    .populate('allocatedAssetId', 'name assetTag serialNumber type status')
    .sort({ createdAt: -1 })
    .lean();

  return requests;
};

/**
 * 23.5: HR Approves Asset Requisition and Allocates Equipment
 */
export const approveAssetRequest = async ({ id, allocatedAssetId, user, ipAddress, userAgent }) => {
  const request = await AssetRequest.findById(id);
  if (!request) {
    throw new ApiError(404, 'Asset requisition not found');
  }

  if (request.status !== 'pending') {
    throw new ApiError(400, `Requisition has already been processed (current status: '${request.status}').`);
  }

  const asset = await Asset.findOne({ _id: allocatedAssetId, isDeleted: false });
  if (!asset) {
    throw new ApiError(404, 'Allocated asset not found');
  }

  if (asset.status !== 'available') {
    throw new ApiError(400, `Selected asset is not available for allocation (current status: '${asset.status}').`);
  }

  const prevReq = request.toObject();

  // 1. Assign asset to employee
  asset.assignedTo = request.employeeId;
  asset.status = 'assigned';
  asset.history.push({
    action: 'assigned',
    employeeId: request.employeeId,
    performedBy: user._id,
    date: new Date(),
    notes: `Allocated via requisition #${request._id}`
  });
  await asset.save();

  // 2. Mark request approved & allocated
  request.status = 'approved';
  request.allocatedAssetId = asset._id;
  request.approvedBy = user._id;
  request.approvedAt = new Date();
  await request.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'asset_request.approve',
    module: 'assets',
    resource: 'AssetRequest',
    resourceId: request._id,
    before: prevReq,
    after: request.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  // Notify Employee and Requesting Manager
  const targetEmployee = await Employee.findById(request.employeeId);
  if (targetEmployee?.userId) {
    await notify(targetEmployee.userId, {
      title: 'Asset Requisition Approved',
      body: `Your equipment requisition for ${asset.name} has been approved and allocated.`,
      message: `Your equipment requisition for ${asset.name} has been approved and allocated.`,
      type: 'system',
      link: '/assets/my'
    }).catch((err) => console.error('[Notify Error]', err.message));
  }

  if (request.requestedBy) {
    await notify(request.requestedBy, {
      title: 'Team Asset Request Approved',
      body: `Asset ${asset.name} (${asset.assetTag}) allocated for your team member.`,
      message: `Asset ${asset.name} (${asset.assetTag}) allocated for your team member.`,
      type: 'system',
      link: '/assets/requests'
    }).catch((err) => console.error('[Notify Error]', err.message));
  }

  return request;
};

/**
 * 23.5: HR Rejects Asset Requisition with mandatory reason
 */
export const rejectAssetRequest = async ({ id, rejectionReason, user, ipAddress, userAgent }) => {
  const request = await AssetRequest.findById(id);
  if (!request) {
    throw new ApiError(404, 'Asset requisition not found');
  }

  if (request.status !== 'pending') {
    throw new ApiError(400, `Requisition has already been processed (current status: '${request.status}').`);
  }

  const prevReq = request.toObject();

  request.status = 'rejected';
  request.approvedBy = user._id;
  request.approvedAt = new Date();
  request.rejectionReason = rejectionReason.trim();
  await request.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'asset_request.reject',
    module: 'assets',
    resource: 'AssetRequest',
    resourceId: request._id,
    before: prevReq,
    after: request.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  // Notify Requesting Manager
  if (request.requestedBy) {
    await notify(request.requestedBy, {
      title: 'Asset Request Declined',
      body: `Your asset requisition was declined: ${rejectionReason}`,
      message: `Your asset requisition was declined: ${rejectionReason}`,
      type: 'system',
      link: '/assets/requests'
    }).catch((err) => console.error('[Notify Error]', err.message));
  }

  return request;
};

/**
 * 23.3: Expiry Job Scanner for warranties and licenses expiring within 30 days
 */
export const checkExpiringAssets = async () => {
  const today = new Date();
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(today.getDate() + 30);

  const expiringAssets = await Asset.find({
    isDeleted: false,
    status: { $nin: ['retired', 'lost'] },
    $or: [
      { warrantyExpiresAt: { $gte: today, $lte: thirtyDaysAhead } },
      { licenseExpiresAt: { $gte: today, $lte: thirtyDaysAhead } }
    ]
  }).lean();

  if (expiringAssets.length === 0) {
    return { count: 0, assets: [] };
  }

  const hrRole = await Role.findOne({ name: 'HR Manager' });
  const adminRole = await Role.findOne({ name: 'Super Admin' });
  const rolesList = [hrRole?._id, adminRole?._id].filter(Boolean);

  const adminUsers = await User.find({ roles: { $in: rolesList }, isActive: true });
  const recipientIds = adminUsers.map((u) => u._id);

  if (recipientIds.length > 0) {
    await notify(recipientIds, {
      title: 'Asset Expiry Notice (30-Day Window)',
      body: `${expiringAssets.length} asset warranty/license(s) are approaching expiration within the next 30 days.`,
      message: `${expiringAssets.length} asset warranty/license(s) are approaching expiration within the next 30 days.`,
      type: 'system',
      link: '/assets?expiringSoon=true'
    }).catch((err) => console.error('[Notify Error]', err.message));
  }

  return { count: expiringAssets.length, assets: expiringAssets };
};

