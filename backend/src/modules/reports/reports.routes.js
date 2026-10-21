/**
 * @file reports.routes.js
 * @description Express Router for Multi-Axis Reports and Streaming Exporters.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import * as reportsController from './reports.controller.js';

const router = Router();

const isTestEnv = process.env.NODE_ENV === 'test';
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 1000 : 60, // 60 report requests per 15 minutes per IP
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many report requests in a short period. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(authenticate);

/**
 * 7.6-BE & 7.8-BE: Multi-Axis Report Data & Streaming Export
 * Route: GET /api/v1/reports/:type
 */
router.get(
  '/:type',
  reportLimiter,
  checkPermission('report.view'),
  reportsController.getReport
);

export default router;
