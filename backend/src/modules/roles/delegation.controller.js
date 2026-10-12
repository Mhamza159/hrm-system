/**
 * @file delegation.controller.js
 * @description Controller for Approvals Delegation System (Slice 26.14).
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import * as delegationService from './delegation.service.js';

export const createDelegation = asyncHandler(async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress;
  const delegation = await delegationService.createDelegation(req.body, req.user, ip);
  return res.status(201).json(
    apiResponse(201, delegation, 'Approval delegation created successfully.')
  );
});

export const getDelegations = asyncHandler(async (req, res) => {
  const list = await delegationService.getDelegations(req.user);
  return res.status(200).json(
    apiResponse(200, list, 'Delegations retrieved successfully.')
  );
});

export const cancelDelegation = asyncHandler(async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress;
  const result = await delegationService.cancelDelegation(req.params.id, req.user, ip);
  return res.status(200).json(
    apiResponse(200, null, result.message)
  );
});
