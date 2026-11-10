/**
 * @file recruitment.routes.js
 * @description Express Router for Module M15 Recruitment & AI Resume Screening.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1 to 15.13)
 * - Middleware Stack: rateLimit -> authenticate -> checkPermission -> validate -> upload -> controller
 */

import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import * as recruitmentController from './recruitment.controller.js';
import * as v from './recruitment.validation.js';

const router = Router();

// Multer memory storage configuration for candidate CV documents (PDF, DOC, DOCX <= 5MB)
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.txt'];

const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname ? file.originalname.slice(file.originalname.lastIndexOf('.')) : '').toLowerCase();
    const isMimeAllowed = ALLOWED_MIMES.includes(file.mimetype);
    const isExtAllowed = ALLOWED_EXTS.includes(ext);

    if (isMimeAllowed && isExtAllowed) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file format. Only PDF, DOC, and DOCX resumes up to 5MB are accepted.'), false);
    }
  }
});

// Rate limiter for public job application submissions
const publicApplyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many job applications submitted from this IP address. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for AI screening triggers to prevent API/resource exhaustion
const screeningLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: {
    success: false,
    message: 'Too many candidate screening requests. Please wait a few minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// =========================================================================
// PUBLIC ENDPOINTS (NO AUTHENTICATION REQUIRED)
// =========================================================================

// 15.3: Browse published careers portal jobs
router.get('/public/jobs', recruitmentController.getPublicJobs);
router.get('/public/jobs/:slug', recruitmentController.getPublicJobBySlug);

// 15.4: Submit job application with CV
router.post(
  '/public/jobs/:id/apply',
  publicApplyLimiter,
  uploadResume.single('cv'),
  validate(v.applyJobSchema),
  recruitmentController.applyForJob
);

// =========================================================================
// AUTHENTICATED WORKFORCE & ADMIN ENDPOINTS
// =========================================================================
router.use(authenticate);

// 15.12: Internal Job Board & Employee Referrals
router.get('/jobs/internal', recruitmentController.getInternalJobs);
router.get(
  '/referrals/my',
  checkPermission('recruitment.referral.submit', 'Recruitment'),
  recruitmentController.getMyReferrals
);
router.post(
  '/referrals',
  checkPermission('recruitment.referral.submit', 'Recruitment'),
  uploadResume.single('cv'),
  validate(v.submitReferralSchema),
  recruitmentController.submitReferral
);

// 15.1: Requisitions
router.get(
  '/requisitions',
  checkPermission('recruitment.requisition.view', 'Recruitment'),
  recruitmentController.getRequisitions
);

router.post(
  '/requisitions',
  validate(v.createRequisitionSchema),
  checkPermission('recruitment.requisition.create', 'Recruitment'),
  recruitmentController.createRequisition
);

// 15.2: Requisition Decision (Super Admin)
router.patch(
  '/requisitions/:id/decide',
  validate(v.decideRequisitionSchema),
  checkPermission('recruitment.requisition.decide', 'Recruitment'),
  recruitmentController.decideRequisition
);

// 15.3: Jobs Management
router.get(
  '/jobs',
  checkPermission('recruitment.job.view', 'Recruitment'),
  recruitmentController.getJobs
);

router.post(
  '/jobs',
  validate(v.createJobSchema),
  checkPermission('recruitment.job.manage', 'Recruitment'),
  recruitmentController.createJob
);

router.get(
  '/jobs/:id',
  checkPermission('recruitment.job.view', 'Recruitment'),
  recruitmentController.getJobById
);

router.patch(
  '/jobs/:id',
  validate(v.updateJobSchema),
  checkPermission('recruitment.job.manage', 'Recruitment'),
  recruitmentController.updateJob
);

router.delete(
  '/jobs/:id',
  checkPermission('recruitment.job.manage', 'Recruitment'),
  recruitmentController.deleteJob
);

// 15.7: Candidates & Pipeline Board
router.get(
  '/candidates',
  checkPermission('recruitment.candidate.view', 'Recruitment'),
  recruitmentController.getCandidates
);

router.get(
  '/candidates/:id',
  checkPermission('recruitment.candidate.view', 'Recruitment'),
  recruitmentController.getCandidateById
);

// Secure Candidate CV Document View & Fallback Stream
router.get(
  '/candidates/:id/cv',
  checkPermission('recruitment.candidate.view', 'Recruitment'),
  recruitmentController.getCandidateCv
);

router.patch(
  '/candidates/:id/stage',
  validate(v.updateCandidateStageSchema),
  checkPermission('recruitment.candidate.stage', 'Recruitment'),
  recruitmentController.updateCandidateStage
);

router.delete(
  '/candidates/:id',
  checkPermission('recruitment.candidate.stage', 'Recruitment'),
  recruitmentController.deleteCandidate
);

// 15.6: AI Screening
router.post(
  '/candidates/:id/screen',
  screeningLimiter,
  checkPermission('recruitment.candidate.screen', 'Recruitment'),
  recruitmentController.screenCandidate
);

// 15.8: Interviews & Scorecards
router.post(
  '/candidates/:id/interviews',
  validate(v.scheduleInterviewSchema),
  checkPermission('recruitment.interview.manage', 'Recruitment'),
  recruitmentController.scheduleInterview
);

router.post(
  '/interviews/:id/scorecard',
  validate(v.submitScorecardSchema),
  checkPermission('recruitment.interview.evaluate', 'Recruitment'),
  recruitmentController.submitScorecard
);

// 15.9: Technical Test
router.post(
  '/candidates/:id/technical-test',
  validate(v.sendTechnicalTestSchema),
  checkPermission('recruitment.candidate.stage', 'Recruitment'),
  recruitmentController.assignTechnicalTest
);

// 15.10: Offer Letters
router.post(
  '/candidates/:id/offer',
  validate(v.issueOfferSchema),
  checkPermission('recruitment.offer.manage', 'Recruitment'),
  recruitmentController.issueOfferLetter
);

router.get(
  '/candidates/:id/offer/pdf',
  checkPermission('recruitment.offer.view', 'Recruitment'),
  recruitmentController.downloadOfferLetterPdf
);

// 15.11: One-Click Hire
router.post(
  '/candidates/:id/hire',
  validate(v.hireCandidateSchema),
  checkPermission('recruitment.hire', 'Recruitment'),
  recruitmentController.hireCandidate
);

export default router;
