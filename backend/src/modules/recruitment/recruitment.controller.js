/**
 * @file recruitment.controller.js
 * @description HTTP Controllers for Module M15 Recruitment & AI Screening.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1 to 15.13)
 * - Layer: Express Controller (Delegates 100% of business logic to service)
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import * as recruitmentService from './recruitment.service.js';
import { streamOfferLetterPdf } from '../../services/offerPdf.service.js';

// 15.1: Create Requisition
export const createRequisition = asyncHandler(async (req, res) => {
  const requisition = await recruitmentService.createRequisition(req.body, req.user);
  res.status(201).json({
    success: true,
    data: requisition,
    message: 'Job requisition submitted successfully.'
  });
});

// 15.1: List Requisitions
export const getRequisitions = asyncHandler(async (req, res) => {
  const result = await recruitmentService.getRequisitions(req.query, req.user, req.permissionScope);
  res.status(200).json({
    success: true,
    data: { items: result.docs },
    meta: result.meta
  });
});

// 15.2: Decide Requisition (Super Admin)
export const decideRequisition = asyncHandler(async (req, res) => {
  const result = await recruitmentService.decideRequisition(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    data: result,
    message: `Requisition ${req.body.decision} successfully.`
  });
});

// 15.3: Jobs CRUD
export const createJob = asyncHandler(async (req, res) => {
  const job = await recruitmentService.createJob(req.body, req.user);
  res.status(201).json({
    success: true,
    data: job,
    message: 'Job opening created successfully.'
  });
});

export const getJobs = asyncHandler(async (req, res) => {
  const result = await recruitmentService.getJobs(req.query, req.user, req.permissionScope);
  res.status(200).json({
    success: true,
    data: { items: result.docs },
    meta: result.meta
  });
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await recruitmentService.getJobById(req.params.id);
  res.status(200).json({
    success: true,
    data: job
  });
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await recruitmentService.updateJob(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    data: job,
    message: 'Job opening updated successfully.'
  });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const result = await recruitmentService.deleteJob(req.params.id, req.user);
  res.status(200).json({
    success: true,
    data: result,
    message: 'Job opening deleted successfully.'
  });
});

// 15.3: Public Careers
export const getPublicJobs = asyncHandler(async (req, res) => {
  const result = await recruitmentService.getPublicJobs(req.query);
  res.status(200).json({
    success: true,
    data: { items: result.docs },
    meta: result.meta
  });
});

export const getPublicJobBySlug = asyncHandler(async (req, res) => {
  const job = await recruitmentService.getPublicJobBySlug(req.params.slug);
  res.status(200).json({
    success: true,
    data: job
  });
});

// 15.4: Public Application with CV
export const applyForJob = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.applyForJob(req.params.id, req.body, req.file);
  res.status(201).json({
    success: true,
    data: candidate,
    message: 'Application submitted successfully.'
  });
});

// 15.7: Candidates & Pipeline
export const getCandidates = asyncHandler(async (req, res) => {
  const result = await recruitmentService.getCandidates(req.query, req.user, req.permissionScope);
  res.status(200).json({
    success: true,
    data: { items: result.docs },
    meta: result.meta
  });
});

export const getCandidateById = asyncHandler(async (req, res) => {
  const result = await recruitmentService.getCandidateById(req.params.id, req.user, req.permissionScope);
  res.status(200).json({
    success: true,
    data: result
  });
});

export const updateCandidateStage = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.updateCandidateStage(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    data: candidate,
    message: `Candidate stage updated to ${req.body.stage}.`
  });
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const result = await recruitmentService.deleteCandidate(req.params.id, req.user);
  res.status(200).json({
    success: true,
    data: result,
    message: 'Candidate application deleted successfully.'
  });
});

// 15.6: Run AI Screening
export const screenCandidate = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.screenCandidate(req.params.id, req.user);
  res.status(200).json({
    success: true,
    data: candidate,
    message: 'AI screening completed successfully.'
  });
});

// 15.8: Interviews & Scorecards
export const scheduleInterview = asyncHandler(async (req, res) => {
  const interview = await recruitmentService.scheduleInterview(req.params.id, req.body, req.user);
  res.status(201).json({
    success: true,
    data: interview,
    message: 'Interview round scheduled successfully.'
  });
});

export const submitScorecard = asyncHandler(async (req, res) => {
  const interview = await recruitmentService.submitScorecard(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    data: interview,
    message: 'Interview scorecard submitted successfully.'
  });
});

// 15.9: Technical Test
export const assignTechnicalTest = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.assignTechnicalTest(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    data: candidate,
    message: 'Technical test instructions dispatched successfully.'
  });
});

// 15.10: Offer Letters
export const issueOfferLetter = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.issueOfferLetter(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    data: candidate,
    message: 'Offer letter issued successfully.'
  });
});

export const downloadOfferLetterPdf = asyncHandler(async (req, res) => {
  const { candidate } = await recruitmentService.getCandidateById(req.params.id, req.user, req.permissionScope);
  if (!candidate?.offerDetails || candidate.offerDetails.status !== 'Issued') {
    throw new ApiError(404, 'No offer letter has been issued for this candidate yet.');
  }
  streamOfferLetterPdf(res, {
    candidate,
    job: candidate.jobId,
    offerDetails: candidate.offerDetails
  });
});

// 15.11: One-Click Hire
export const hireCandidate = asyncHandler(async (req, res) => {
  const result = await recruitmentService.hireCandidate(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    data: result,
    message: `Candidate hired successfully as ${result.employee?.employeeCode}.`
  });
});

// 15.12: Internal Jobs & Referrals
export const getInternalJobs = asyncHandler(async (req, res) => {
  const result = await recruitmentService.getInternalJobs(req.query);
  res.status(200).json({
    success: true,
    data: { items: result.docs },
    meta: result.meta
  });
});

export const submitReferral = asyncHandler(async (req, res) => {
  const candidate = await recruitmentService.submitReferral(req.body, req.file, req.user);
  res.status(201).json({
    success: true,
    data: candidate,
    message: 'Candidate referral submitted successfully.'
  });
});

