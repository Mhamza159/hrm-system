/**
 * @file attrition.controller.js
 * @description Controller for Handling Attrition Prediction Requests & Envelopes.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Rows 17.1 to 17.5)
 * - Layer: Controller (Parses validated requests, calls service, sends uniform JSON response)
 */

import * as attritionService from './attrition.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getScores = asyncHandler(async (req, res) => {
  const result = await attritionService.getAttritionScores(req.query, req.user);
  return res.status(200).json(
    new ApiResponse(200, result.scores, 'Attrition risk scores retrieved successfully.', result.pagination)
  );
});

export const getScoreById = asyncHandler(async (req, res) => {
  const score = await attritionService.getAttritionScoreById(req.params.id, req.user);
  return res.status(200).json(
    new ApiResponse(200, score, 'Employee attrition risk profile retrieved successfully.')
  );
});

export const recalculateScores = asyncHandler(async (req, res) => {
  const summary = await attritionService.runWeeklyAttritionScoring();
  return res.status(200).json(
    new ApiResponse(200, summary, 'Company-wide attrition risk recalculation completed successfully.')
  );
});

export const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const analytics = await attritionService.getDepartmentRiskAnalytics(req.user);
  return res.status(200).json(
    new ApiResponse(200, analytics, 'Department attrition analytics retrieved successfully.')
  );
});

export const addNote = asyncHandler(async (req, res) => {
  const updatedScore = await attritionService.addRetentionNote(req.params.id, req.body, req.user);
  return res.status(201).json(
    new ApiResponse(201, updatedScore, 'Retention intervention note logged successfully.')
  );
});

export const getNotes = asyncHandler(async (req, res) => {
  const notes = await attritionService.getRetentionNotes(req.params.id, req.user);
  return res.status(200).json(
    new ApiResponse(200, notes, 'Retention notes history retrieved successfully.')
  );
});

