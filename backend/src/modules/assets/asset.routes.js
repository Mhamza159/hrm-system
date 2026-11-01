/**
 * @file asset.routes.js
 * @description Express Routes for Module M23 Asset Management.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1 to 23.6)
 * - Middleware Defensive Hierarchy: authenticate -> checkPermission -> validate -> controller
 * - IDOR & Scoping: Verified at perimeter by CASL checkPermission and enforced horizontally in domain service.
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as assetController from './asset.controller.js';
import {
  createAssetSchema,
  getAssetByIdSchema,
  updateAssetSchema,
  deleteAssetSchema,
  queryAssetsSchema,
  assignAssetSchema,
  returnAssetSchema,
  repairAssetSchema,
  updateRepairSchema,
  reportIssueSchema,
  createAssetRequestSchema,
  approveAssetRequestSchema,
  rejectAssetRequestSchema
} from './asset.validation.js';

const router = Router();

// Mandatory authentication for all asset endpoints
router.use(authenticate);

// ----------------------------------------------------
// Requisitions Sub-routes (23.5)
// ----------------------------------------------------
router.get(
  '/requests',
  checkPermission('asset.request'),
  assetController.getAssetRequests
);

router.post(
  '/requests',
  checkPermission('asset.request'),
  validate(createAssetRequestSchema),
  assetController.createAssetRequest
);

router.post(
  '/requests/:id/approve',
  checkPermission('asset.manage'),
  validate(approveAssetRequestSchema),
  assetController.approveAssetRequest
);

router.post(
  '/requests/:id/reject',
  checkPermission('asset.manage'),
  validate(rejectAssetRequestSchema),
  assetController.rejectAssetRequest
);

// ----------------------------------------------------
// Employee Custodian Self-Service (23.6)
// ----------------------------------------------------
router.get(
  '/my',
  checkPermission('asset.view', 'own'),
  assetController.getMyAssets
);

// ----------------------------------------------------
// Expiry Check Trigger (23.3)
// ----------------------------------------------------
router.post(
  '/check-expiry',
  checkPermission('asset.manage'),
  assetController.checkExpiryTrigger
);

// ----------------------------------------------------
// Asset Inventory Master CRUD (23.1)
// ----------------------------------------------------
router.get(
  '/',
  checkPermission('asset.view'),
  validate(queryAssetsSchema),
  assetController.getAssets
);

router.post(
  '/',
  checkPermission('asset.create'),
  validate(createAssetSchema),
  assetController.createAsset
);

router.get(
  '/:id',
  checkPermission('asset.view'),
  validate(getAssetByIdSchema),
  assetController.getAssetById
);

router.put(
  '/:id',
  checkPermission('asset.manage'),
  validate(updateAssetSchema),
  assetController.updateAsset
);

router.delete(
  '/:id',
  checkPermission('asset.manage'),
  validate(deleteAssetSchema),
  assetController.deleteAsset
);

// ----------------------------------------------------
// Custodian Assign & Return (23.2)
// ----------------------------------------------------
router.post(
  '/:id/assign',
  checkPermission('asset.assign'),
  validate(assignAssetSchema),
  assetController.assignAsset
);

router.post(
  '/:id/return',
  checkPermission('asset.assign'),
  validate(returnAssetSchema),
  assetController.returnAsset
);

// ----------------------------------------------------
// Maintenance & Repairs (23.4)
// ----------------------------------------------------
router.post(
  '/:id/repairs',
  checkPermission('asset.manage'),
  validate(repairAssetSchema),
  assetController.sendAssetForRepair
);

router.patch(
  '/:id/repairs/:repairId',
  checkPermission('asset.manage'),
  validate(updateRepairSchema),
  assetController.completeAssetRepair
);

// ----------------------------------------------------
// Issue Flagging (23.6)
// ----------------------------------------------------
router.post(
  '/:id/issue',
  checkPermission('asset.issue', 'own'),
  validate(reportIssueSchema),
  assetController.reportAssetIssue
);

export default router;
