/**
 * @file policy.controller.js
 * @description HTTP Controllers for Company Policies Module.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Standardized envelope: ApiResponse(statusCode, data, message, meta)
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as policyService from './policy.service.js';

export const getPolicies = asyncHandler(async (req, res) => {
  const result = await policyService.getPolicies(req.query, req.user);
  res.status(200).json(
    new ApiResponse(200, result, 'Policies retrieved successfully', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    })
  );
});

export const getPolicyStats = asyncHandler(async (req, res) => {
  const stats = await policyService.getPolicyStats(req.user);
  res.status(200).json(new ApiResponse(200, stats, 'Policy statistics compiled'));
});

export const getPolicyById = asyncHandler(async (req, res) => {
  const policy = await policyService.getPolicyById(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, policy, 'Policy details retrieved'));
});

export const createPolicy = asyncHandler(async (req, res) => {
  const policy = await policyService.createPolicy(req.body, req.user);
  res.status(201).json(new ApiResponse(201, policy, 'Policy draft created successfully'));
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const policy = await policyService.updatePolicy(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, policy, 'Policy updated successfully'));
});

export const deletePolicy = asyncHandler(async (req, res) => {
  const result = await policyService.deletePolicy(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Policy deleted successfully'));
});

export const submitPolicyForApproval = asyncHandler(async (req, res) => {
  const policy = await policyService.submitPolicyForApproval(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, policy, 'Policy submitted for administrative approval'));
});

export const approvePolicy = asyncHandler(async (req, res) => {
  const policy = await policyService.approvePolicy(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, policy, 'Policy approved successfully'));
});

export const rejectPolicy = asyncHandler(async (req, res) => {
  const policy = await policyService.rejectPolicy(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, policy, 'Policy proposal rejected'));
});

export const publishPolicy = asyncHandler(async (req, res) => {
  const policy = await policyService.publishPolicy(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, policy, 'Policy published successfully'));
});

export const acknowledgePolicy = asyncHandler(async (req, res) => {
  const clientIp =
    req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';

  const acknowledgement = await policyService.acknowledgePolicy(
    req.params.id,
    {
      ...req.body,
      ipAddress: Array.isArray(clientIp) ? clientIp[0] : String(clientIp).split(',')[0].trim(),
      userAgent
    },
    req.user
  );

  res.status(200).json(new ApiResponse(200, acknowledgement, 'Policy acknowledgement recorded'));
});

export const getPolicyAcknowledgements = asyncHandler(async (req, res) => {
  const result = await policyService.getPolicyAcknowledgements(req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Compliance roster retrieved'));
});

export const getPolicyVersions = asyncHandler(async (req, res) => {
  const versions = await policyService.getPolicyVersions(req.params.id);
  res.status(200).json(new ApiResponse(200, versions, 'Policy version history retrieved'));
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await policyService.getCategories();
  res.status(200).json(new ApiResponse(200, categories, 'Policy categories retrieved'));
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await policyService.createCategory(req.body);
  res.status(201).json(new ApiResponse(201, category, 'Policy category created'));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await policyService.updateCategory(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, category, 'Policy category updated'));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await policyService.deleteCategory(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Policy category removed'));
});
