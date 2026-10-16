/**
 * @file employee.routes.js
 * @description Express Router for Employee Lifecycle & Records (Module M3).
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.1 to 3.17)
 * - Layer: Router (Protected by authenticate, checkPermission, and Zod validation)
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import * as employeeController from './employee.controller.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateStatusSchema,
  updateSkillsSchema,
  changeRequestSchema,
  decideChangeRequestSchema,
  jobHistorySchema
} from './employee.validation.js';

const router = express.Router();

// Ensure uploads/documents folder exists
const documentsDir = path.resolve(process.cwd(), 'uploads/documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          'Invalid file format. Allowed formats: PDF, JPEG, PNG, WEBP (Max 5MB).'
        )
      );
    }
  }
});

// Multer Memory Storage for Excel Spreadsheet Bulk Ingestion
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file format. Please upload an Excel file (.xlsx)'));
    }
  }
});

// Self-Service Routes (Must come before /:id parameter matching)
router.get('/me', authenticate, employeeController.getMyProfile);
router.patch(
  '/me/skills',
  authenticate,
  validate(updateSkillsSchema),
  employeeController.updateSkills
);
router.post(
  '/me/change-request',
  authenticate,
  validate(changeRequestSchema),
  employeeController.submitChangeRequest
);

// Next Available Employee Code (Must come before /:id parameter matching)
router.get(
  '/next-code',
  authenticate,
  checkPermission('employee.create'),
  employeeController.getNextEmployeeCode
);

// Bulk Import & Directory Export (Must come before /:id parameter matching)
router.get(
  '/export',
  authenticate,
  checkPermission('report.export'),
  employeeController.exportEmployees
);
router.post(
  '/import',
  authenticate,
  checkPermission('employee.create'),
  uploadMemory.single('file'),
  employeeController.importEmployees
);

// Manual Probation Expiry Check Trigger
router.post(
  '/jobs/check-probation',
  authenticate,
  checkPermission('employee.view'),
  employeeController.triggerProbationCheck
);

// Standard Employee CRUD & Directory
router
  .route('/')
  .post(
    authenticate,
    checkPermission('employee.create'),
    validate(createEmployeeSchema),
    employeeController.createEmployee
  )
  .get(
    authenticate,
    checkPermission('employee.view'),
    employeeController.getEmployees
  );

// Single Employee Operations
router
  .route('/:id')
  .get(
    authenticate,
    checkPermission('employee.view'),
    employeeController.getEmployeeById
  )
  .patch(
    authenticate,
    checkPermission('employee.edit'),
    validate(updateEmployeeSchema),
    employeeController.updateEmployee
  )
  .delete(
    authenticate,
    checkPermission('employee.delete'),
    employeeController.deleteEmployee
  );

// Employee Status Transition
router.patch(
  '/:id/status',
  authenticate,
  checkPermission('employee.edit'),
  validate(updateStatusSchema),
  employeeController.updateEmployeeStatus
);

// Document Vault
router.post(
  '/:id/documents',
  authenticate,
  checkPermission('employee.edit'),
  uploadDoc.single('file'),
  employeeController.uploadDocument
);

router.delete(
  '/:id/documents/:docId',
  authenticate,
  checkPermission('employee.edit'),
  employeeController.deleteDocument
);

// Skills Management
router.patch(
  '/:id/skills',
  authenticate,
  checkPermission('employee.edit'),
  validate(updateSkillsSchema),
  employeeController.updateSkills
);

// Career & Promotional Job History
router
  .route('/:id/history')
  .post(
    authenticate,
    checkPermission('employee.edit'),
    validate(jobHistorySchema),
    employeeController.recordJobHistory
  )
  .get(
    authenticate,
    checkPermission('employee.view'),
    employeeController.getJobHistory
  );

// Salary Revision History (Guarded by employee.salary.view)
router.get(
  '/:id/salary-history',
  authenticate,
  checkPermission('employee.salary.view'),
  employeeController.getSalaryHistory
);

export default router;
