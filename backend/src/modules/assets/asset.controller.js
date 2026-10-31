/**
 * @file asset.controller.js
 * @description Controller Handlers for Module M23 Asset Management.
 * 
 * SPECIFICATION:
 * - Layer: Controller Layer (Extracts request payload, calls service, returns standard envelope)
 * - Standard Envelope: { success: true, statusCode, data, message, meta }
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import * as assetService from './asset.service.js';

/**
 * 23.1: Register new physical hardware or software asset
 */
export const createAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.createAsset({
    assetData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: asset,
    message: 'Asset successfully registered in inventory.'
  });
});

/**
 * 23.1: List assets with filters and pagination
 */
export const getAssets = asyncHandler(async (req, res) => {
  const result = await assetService.getAssets({
    query: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.assets,
    meta: result.pagination,
    message: 'Assets retrieved successfully.'
  });
});

/**
 * 23.1: Retrieve single asset details
 */
export const getAssetById = asyncHandler(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: asset,
    message: 'Asset details retrieved successfully.'
  });
});

/**
 * 23.1: Update asset attributes
 */
export const updateAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.updateAsset({
    id: req.params.id,
    updateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: asset,
    message: 'Asset attributes updated successfully.'
  });
});

/**
 * 23.1: Soft-delete asset
 */
export const deleteAsset = asyncHandler(async (req, res) => {
  const result = await assetService.deleteAsset({
    id: req.params.id,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: null,
    message: result.message
  });
});

/**
 * 23.2: Assign asset to employee custodian
 */
export const assignAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.assignAsset({
    id: req.params.id,
    employeeId: req.body.employeeId,
    assignedDate: req.body.assignedDate,
    notes: req.body.notes,
    condition: req.body.condition,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: asset,
    message: 'Asset successfully assigned to employee custodian.'
  });
});

/**
 * 23.2: Return asset to inventory
 */
export const returnAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.returnAsset({
    id: req.params.id,
    returnDate: req.body.returnDate,
    condition: req.body.condition,
    notes: req.body.notes,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: asset,
    message: 'Asset returned to inventory successfully.'
  });
});

/**
 * 23.4: Send asset for repair / maintenance
 */
export const sendAssetForRepair = asyncHandler(async (req, res) => {
  const asset = await assetService.sendAssetForRepair({
    id: req.params.id,
    repairData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: asset,
    message: 'Asset dispatched for service repair.'
  });
});

/**
 * 23.4: Complete asset repair
 */
export const completeAssetRepair = asyncHandler(async (req, res) => {
  const asset = await assetService.completeAssetRepair({
    id: req.params.id,
    repairId: req.params.repairId,
    updateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: asset,
    message: 'Asset repair status updated successfully.'
  });
});

/**
 * 23.6: Employee Self-Service: Get currently assigned assets
 */
export const getMyAssets = asyncHandler(async (req, res) => {
  const assets = await assetService.getMyAssets({ user: req.user });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: assets,
    message: 'My assigned assets retrieved successfully.'
  });
});

/**
 * 23.6: Employee reports malfunction / issue
 */
export const reportAssetIssue = asyncHandler(async (req, res) => {
  const asset = await assetService.reportAssetIssue({
    id: req.params.id,
    issueData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: asset,
    message: 'Issue report submitted successfully to HR.'
  });
});

/**
 * 23.5: Manager creates asset requisition
 */
export const createAssetRequest = asyncHandler(async (req, res) => {
  const request = await assetService.createAssetRequest({
    requestData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: request,
    message: 'Asset requisition submitted successfully.'
  });
});

/**
 * 23.5: Get asset requisitions
 */
export const getAssetRequests = asyncHandler(async (req, res) => {
  const requests = await assetService.getAssetRequests({ user: req.user });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: requests,
    message: 'Asset requisitions retrieved successfully.'
  });
});

/**
 * 23.5: HR Approves and Allocates Asset
 */
export const approveAssetRequest = asyncHandler(async (req, res) => {
  const request = await assetService.approveAssetRequest({
    id: req.params.id,
    allocatedAssetId: req.body.allocatedAssetId,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: request,
    message: 'Asset requisition approved and asset allocated.'
  });
});

/**
 * 23.5: HR Rejects Requisition
 */
export const rejectAssetRequest = asyncHandler(async (req, res) => {
  const request = await assetService.rejectAssetRequest({
    id: req.params.id,
    rejectionReason: req.body.rejectionReason,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: request,
    message: 'Asset requisition rejected.'
  });
});

/**
 * 23.3: Manual trigger for asset expiry check
 */
export const checkExpiryTrigger = asyncHandler(async (req, res) => {
  const result = await assetService.checkExpiringAssets();

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: `Expiry check completed: ${result.count} assets expiring within 30 days.`
  });
});

