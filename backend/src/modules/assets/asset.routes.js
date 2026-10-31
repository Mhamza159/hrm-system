/**
 * @file asset.routes.js
 * @description Express Routes for Module M23 Asset Management.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1 to 23.6)
 * - Middleware: authenticate -> validate -> checkPermission
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as assetController from './asset.controller.js';
import {
  createAssetSchema,
  updateAssetSchema,
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
  validate(createAssetRequestSchema),
  checkPermission('asset.request'),
  assetController.createAssetRequest
);

router.post(
  '/requests/:id/approve',
  validate(approveAssetRequestSchema),
  checkPermission('asset.manage'),
  assetController.approveAssetRequest
);

router.post(
  '/requests/:id/reject',
  validate(rejectAssetRequestSchema),
  checkPermission('asset.manage'),
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
  validate(queryAssetsSchema),
  checkPermission('asset.view'),
  assetController.getAssets
);

router.post(
  '/',
  validate(createAssetSchema),
  checkPermission('asset.create'),
  assetController.createAsset
);

router.get(
  '/:id',
  checkPermission('asset.view'),
  assetController.getAssetById
);

router.put(
  '/:id',
  validate(updateAssetSchema),
  checkPermission('asset.manage'),
  assetController.updateAsset
);

router.delete(
  '/:id',
  checkPermission('asset.manage'),
  assetController.deleteAsset
);

// ----------------------------------------------------
// Custodian Assign & Return (23.2)
// ----------------------------------------------------
router.post(
  '/:id/assign',
  validate(assignAssetSchema),
  checkPermission('asset.assign'),
  assetController.assignAsset
);

router.post(
  '/:id/return',
  validate(returnAssetSchema),
  checkPermission('asset.assign'),
  assetController.returnAsset
);

// ----------------------------------------------------
// Maintenance & Repairs (23.4)
// ----------------------------------------------------
router.post(
  '/:id/repairs',
  validate(repairAssetSchema),
  checkPermission('asset.manage'),
  assetController.sendAssetForRepair
);

router.patch(
  '/:id/repairs/:repairId',
  validate(updateRepairSchema),
  checkPermission('asset.manage'),
  assetController.completeAssetRepair
);

// ----------------------------------------------------
// Issue Flagging (23.6)
// ----------------------------------------------------
router.post(
  '/:id/issue',
  validate(reportIssueSchema),
  checkPermission('asset.issue', 'own'),
  assetController.reportAssetIssue
);

export default router;

