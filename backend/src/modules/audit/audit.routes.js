/**
 * @file audit.routes.js
 * @description Express Router for immutable audit logging APIs.
 * 
 * SECURITY & PBAC:
 * - Module: X1 Security & Quality Gate (BUILD-GUIDE Section 14 · Row X1.1)
 * - Required Permission: audit.view (Scope: 'all')
 * - Protected: Unauthenticated or non-admin access returns 401/403.
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import * as auditController from './audit.controller.js';

const router = Router();

// Universal JWT Authentication for all audit routes
router.use(authenticate);

// GET /api/v1/audit-logs - Query audit entries with filters
router.get('/', checkPermission('audit.view', 'all'), auditController.getAuditLogs);

// GET /api/v1/audit-logs/:id - Forensic diff view for single entry
router.get('/:id', checkPermission('audit.view', 'all'), auditController.getAuditLog);

export default router;
