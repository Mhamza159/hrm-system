/**
 * @file rewards.controller.js
 * @description Express Controller for Module M20: Rewards, Celebrations & Surveys.
 */

import * as rewardsService from './rewards.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// ==========================================
// AWARDS & EMPLOYEE OF THE MONTH (Row 20.1)
// ==========================================

export const createAward = asyncHandler(async (req, res) => {
  const award = await rewardsService.createAwardCycle(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, award, 'Award cycle created successfully'));
});

export const getAwards = asyncHandler(async (req, res) => {
  const result = await rewardsService.getAwards(req.user, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result.awards, 'Award cycles retrieved successfully', result.pagination));
});

export const getAwardById = asyncHandler(async (req, res) => {
  const award = await rewardsService.getAwardById(req.user, req.params.id);
  return res.status(200).json(new ApiResponse(200, award, 'Award details retrieved successfully'));
});

export const nominate = asyncHandler(async (req, res) => {
  const award = await rewardsService.nominateCandidate(req.user, req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, award, 'Candidate nominated successfully'));
});

export const shortlist = asyncHandler(async (req, res) => {
  const award = await rewardsService.shortlistNomination(
    req.user,
    req.params.id,
    req.params.nominationId,
    req.body.shortlisted
  );
  return res.status(200).json(new ApiResponse(200, award, 'Nomination shortlist updated successfully'));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const award = await rewardsService.updateAwardStatus(req.user, req.params.id, req.body.status);
  return res.status(200).json(new ApiResponse(200, award, 'Award status updated successfully'));
});

export const castVote = asyncHandler(async (req, res) => {
  const result = await rewardsService.castVote(req.user, req.params.id, req.body.nomineeId);
  return res.status(200).json(new ApiResponse(200, result, 'Ballot vote recorded successfully'));
});

export const announceWinner = asyncHandler(async (req, res) => {
  const winner = await rewardsService.announceWinner(req.user, req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, winner, 'Award winner announced successfully'));
});

export const getVoteStats = asyncHandler(async (req, res) => {
  const stats = await rewardsService.getAwardVoteStats(req.user, req.params.id);
  return res.status(200).json(new ApiResponse(200, stats, 'Award vote statistics retrieved successfully'));
});

// ==========================================
// PEER APPRECIATION & KUDOS (Row 20.2)
// ==========================================

export const createKudos = asyncHandler(async (req, res) => {
  const kudos = await rewardsService.createKudos(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, kudos, 'Appreciation kudos posted successfully'));
});

export const getKudos = asyncHandler(async (req, res) => {
  const result = await rewardsService.getKudos(req.user, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result.kudos, 'Kudos feed retrieved successfully', result.pagination));
});

export const toggleLike = asyncHandler(async (req, res) => {
  const result = await rewardsService.toggleLikeKudos(req.user, req.params.id);
  return res.status(200).json(new ApiResponse(200, result, 'Kudos reaction updated successfully'));
});

// ==========================================
// CELEBRATION WALL (Row 20.3)
// ==========================================

export const getTodayCelebrations = asyncHandler(async (req, res) => {
  const celebrations = await rewardsService.getTodayCelebrations();
  return res
    .status(200)
    .json(new ApiResponse(200, celebrations, "Today's celebrations retrieved successfully"));
});

export const getUpcomingCelebrations = asyncHandler(async (req, res) => {
  const daysAhead = parseInt(req.query.days, 10) || 30;
  const upcoming = await rewardsService.getUpcomingCelebrations(daysAhead);
  return res
    .status(200)
    .json(new ApiResponse(200, upcoming, 'Upcoming celebrations retrieved successfully'));
});

// ==========================================
// PULSE SURVEYS & POLLS (Row 20.4 & 20.5)
// ==========================================

export const createSurvey = asyncHandler(async (req, res) => {
  const survey = await rewardsService.createSurvey(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, survey, 'Pulse survey created successfully'));
});

export const getSurveys = asyncHandler(async (req, res) => {
  const surveys = await rewardsService.getSurveys(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, surveys, 'Surveys retrieved successfully'));
});

export const getSurveyById = asyncHandler(async (req, res) => {
  const survey = await rewardsService.getSurveyById(req.user, req.params.id);
  return res.status(200).json(new ApiResponse(200, survey, 'Survey retrieved successfully'));
});

export const submitSurveyResponse = asyncHandler(async (req, res) => {
  const result = await rewardsService.submitSurveyResponse(req.user, req.params.id, req.body.answers);
  return res.status(200).json(new ApiResponse(200, result, 'Survey response submitted successfully'));
});

export const getSurveyAnalytics = asyncHandler(async (req, res) => {
  const analytics = await rewardsService.getSurveyAnalytics(req.user, req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, analytics, 'Survey analytics retrieved successfully'));
});

