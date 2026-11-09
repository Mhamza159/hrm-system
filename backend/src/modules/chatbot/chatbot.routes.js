/**
 * @file chatbot.routes.js
 * @description Express Router for Module M16 HR Chatbot.
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.1 to 16.9)
 * - Middleware Stack: authenticate -> checkPermission -> validate -> upload -> controller
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import * as chatbotController from './chatbot.controller.js';
import * as v from './chatbot.validation.js';

const router = Router();

// Multer in-memory storage for handbook policy documents (PDF, DOC, DOCX, TXT <= 10MB)
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.txt'];

const uploadPolicyFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 MB maximum, 1 file
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname ? file.originalname.slice(file.originalname.lastIndexOf('.')) : '').toLowerCase();
    const isMimeAllowed = ALLOWED_MIMES.includes(file.mimetype);
    const isExtAllowed = ALLOWED_EXTS.includes(ext);

    if (isMimeAllowed && isExtAllowed) {
      cb(null, true);
    } else if (isMimeAllowed || isExtAllowed) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file format. Only PDF, DOC, DOCX, and TXT files up to 10MB are accepted.'), false);
    }
  }
});

// All chatbot routes require authentication
router.use(authenticate);

// 16.1: Policy Documents Ingestion & Management
router.post(
  '/policies',
  checkPermission('chatbot.policy.manage'),
  uploadPolicyFile.single('file'),
  validate(v.policyUploadSchema),
  chatbotController.uploadPolicy
);

router.get(
  '/policies',
  checkPermission('chatbot.policy.manage'),
  chatbotController.getPolicies
);

router.delete(
  '/policies/:id',
  checkPermission('chatbot.policy.manage'),
  validate(v.policyIdParamSchema),
  chatbotController.deletePolicy
);

// 16.2 & 16.3 & 16.4 & 16.5 & 16.7: Ask Chatbot
router.post(
  '/ask',
  checkPermission('chatbot.use'),
  validate(v.askChatbotSchema),
  chatbotController.ask
);

// 16.8: Chat History & Clear
router.get(
  '/history',
  checkPermission('chatbot.use'),
  chatbotController.getHistory
);

router.delete(
  '/history',
  checkPermission('chatbot.use'),
  chatbotController.clearHistory
);

// 16.6: Escalation & HR Queue
router.post(
  '/escalate',
  checkPermission('chatbot.use'),
  validate(v.escalateQuestionSchema),
  chatbotController.escalate
);

router.get(
  '/unanswered',
  checkPermission('chatbot.unanswered.manage'),
  chatbotController.getUnanswered
);

router.patch(
  '/unanswered/:id/answer',
  checkPermission('chatbot.unanswered.manage'),
  validate(v.answerQuestionSchema),
  chatbotController.answerUnanswered
);

// 16.9: Chatbot Settings
router.get(
  '/settings',
  checkPermission('chatbot.use'),
  chatbotController.getSettings
);

router.patch(
  '/settings',
  checkPermission('chatbot.manage'),
  validate(v.chatbotSettingsSchema),
  chatbotController.updateSettings
);

export default router;

