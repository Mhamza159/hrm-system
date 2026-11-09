/**
 * @file rewards.routes.js
 * @description Express Router for Module M20: Rewards, Celebrations & Surveys.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as rewardsController from './rewards.controller.js';
import * as v from './rewards.validation.js';

const router = Router();

// Defensive rate limiters for write actions
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many voting requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

const kudosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  message: { success: false, message: 'Too many kudos requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(authenticate);

// ==========================================
// AWARDS & EMPLOYEE OF THE MONTH (Row 20.1)
// ==========================================

// Create award cycle (HR/Admin)
router.post(
  '/awards',
  checkPermission('rewards.manage', 'Rewards'),
  validate(v.createAwardSchema),
  rewardsController.createAward
);

// List award cycles
router.get(
  '/awards',
  checkPermission('rewards.view', 'Rewards'),
  rewardsController.getAwards
);

// Get specific award details
router.get(
  '/awards/:id',
  checkPermission('rewards.view', 'Rewards'),
  validate(v.idParamSchema),
  rewardsController.getAwardById
);

// Nominate candidate (Managers, HR, Admin)
router.post(
  '/awards/:id/nominate',
  checkPermission('rewards.nominate', 'Rewards'),
  validate(v.nominateSchema),
  rewardsController.nominate
);

// Shortlist nomination (HR/Admin)
router.patch(
  '/awards/:id/nominations/:nominationId/shortlist',
  checkPermission('rewards.manage', 'Rewards'),
  validate(v.shortlistSchema),
  rewardsController.shortlist
);

// Update status (e.g. open voting, close)
router.patch(
  '/awards/:id/status',
  checkPermission('rewards.manage', 'Rewards'),
  validate(v.idParamSchema),
  rewardsController.updateStatus
);

// Cast ballot vote
router.post(
  '/awards/:id/vote',
  voteLimiter,
  checkPermission('rewards.vote', 'Rewards'),
  validate(v.voteSchema),
  rewardsController.castVote
);

// Announce winner
router.post(
  '/awards/:id/announce',
  checkPermission('rewards.manage', 'Rewards'),
  validate(v.announceWinnerSchema),
  rewardsController.announceWinner
);

// View vote tally & statistics
router.get(
  '/awards/:id/stats',
  checkPermission('rewards.manage', 'Rewards'),
  validate(v.idParamSchema),
  rewardsController.getVoteStats
);

// ==========================================
// PEER APPRECIATION WALL & BADGES (Row 20.2)
// ==========================================

// Post kudos / peer recognition
router.post(
  '/kudos',
  kudosLimiter,
  checkPermission('rewards.kudos', 'Rewards'),
  validate(v.createKudosSchema),
  rewardsController.createKudos
);

// Get kudos feed
router.get(
  '/kudos',
  checkPermission('rewards.view', 'Rewards'),
  validate(v.getKudosQuerySchema),
  rewardsController.getKudos
);

// Toggle like / clap on a kudos
router.post(
  '/kudos/:id/like',
  checkPermission('rewards.kudos', 'Rewards'),
  validate(v.idParamSchema),
  rewardsController.toggleLike
);

// ==========================================
// CELEBRATION WALL (Row 20.3)
// ==========================================

// Get today's birthdays and work anniversaries
router.get(
  '/celebrations/today',
  checkPermission('rewards.view', 'Rewards'),
  rewardsController.getTodayCelebrations
);

// Get upcoming celebrations (next 30 days)
router.get(
  '/celebrations/upcoming',
  checkPermission('rewards.view', 'Rewards'),
  rewardsController.getUpcomingCelebrations
);

// ==========================================
// PULSE SURVEYS & POLLS (Row 20.4 & 20.5)
// ==========================================

// Create survey
router.post(
  '/surveys',
  checkPermission('rewards.manage', 'Rewards'),
  validate(v.createSurveySchema),
  rewardsController.createSurvey
);

// List active & available surveys
router.get(
  '/surveys',
  checkPermission('rewards.view', 'Rewards'),
  rewardsController.getSurveys
);

// Get specific survey details
router.get(
  '/surveys/:id',
  checkPermission('rewards.view', 'Rewards'),
  validate(v.idParamSchema),
  rewardsController.getSurveyById
);

// Submit survey response
router.post(
  '/surveys/:id/respond',
  checkPermission('rewards.respond', 'Rewards'),
  validate(v.submitSurveyResponseSchema),
  rewardsController.submitSurveyResponse
);

// Get survey analytics breakdown (HR/Admin)
router.get(
  '/surveys/:id/analytics',
  checkPermission('rewards.manage', 'Rewards'),
  validate(v.idParamSchema),
  rewardsController.getSurveyAnalytics
);

export default router;

