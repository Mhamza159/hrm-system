/**
 * @file policy.routes.js
 * @description Express Router for Company Policies Module.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Middleware Stack: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as policyController from './policy.controller.js';
import * as v from './policy.validation.js';

const router = Router();

// All policy routes require an authenticated user session
router.use(authenticate);

// 1. Categories Management
router.get(
  '/categories',
  checkPermission('policy.view'),
  policyController.getCategories
);

router.post(
  '/categories',
  checkPermission('policy.manage'),
  validate(v.policyCategorySchema),
  policyController.createCategory
);

router.put(
  '/categories/:id',
  checkPermission('policy.manage'),
  validate(v.mongoIdParamSchema),
  policyController.updateCategory
);

router.delete(
  '/categories/:id',
  checkPermission('policy.manage'),
  validate(v.mongoIdParamSchema),
  policyController.deleteCategory
);

// 2. Executive Statistics
router.get(
  '/stats',
  checkPermission('policy.view'),
  policyController.getPolicyStats
);

// 3. Policies Core CRUD & Queries
router.get(
  '/',
  checkPermission('policy.view'),
  validate(v.policyQuerySchema),
  policyController.getPolicies
);

router.post(
  '/',
  checkPermission('policy.create'),
  validate(v.createPolicySchema),
  policyController.createPolicy
);

router.get(
  '/:id',
  checkPermission('policy.view'),
  validate(v.mongoIdParamSchema),
  policyController.getPolicyById
);

router.put(
  '/:id',
  checkPermission('policy.edit'),
  validate(v.updatePolicySchema),
  policyController.updatePolicy
);

router.delete(
  '/:id',
  checkPermission('policy.delete'),
  validate(v.mongoIdParamSchema),
  policyController.deletePolicy
);

// 4. Governance Lifecycle: Submit, Approve, Reject, Publish
router.post(
  '/:id/submit',
  checkPermission('policy.edit'),
  validate(v.mongoIdParamSchema),
  policyController.submitPolicyForApproval
);

router.post(
  '/:id/approve',
  checkPermission('policy.approve'),
  validate(v.approvePolicySchema),
  policyController.approvePolicy
);

router.post(
  '/:id/reject',
  checkPermission('policy.approve'),
  validate(v.rejectPolicySchema),
  policyController.rejectPolicy
);

router.post(
  '/:id/publish',
  checkPermission('policy.publish'),
  validate(v.publishPolicySchema),
  policyController.publishPolicy
);

// 5. Employee Acknowledgement & Compliance Tracking
router.post(
  '/:id/acknowledge',
  checkPermission('policy.acknowledge'),
  validate(v.acknowledgePolicySchema),
  policyController.acknowledgePolicy
);

router.get(
  '/:id/acknowledgements',
  checkPermission('policy.track'),
  validate(v.mongoIdParamSchema),
  policyController.getPolicyAcknowledgements
);

router.get(
  '/:id/versions',
  checkPermission('policy.view'),
  validate(v.mongoIdParamSchema),
  policyController.getPolicyVersions
);

export default router;
