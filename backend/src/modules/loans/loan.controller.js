/**
 * @file loan.controller.js
 * @description Express Controller for Loans & Salary Advances (Module M10 / Slices 10.1 to 10.6).
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances
 * - Invariant: Uniform ApiResponse payload wrapping.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as loanService from './loan.service.js';
import { calculateBorrowingLimits } from './loanPolicy.js';

export const createLoan = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId?._id || req.user.employeeId;
  if (!employeeId) {
    throw new ApiError(403, 'Your account is not linked to an employee profile');
  }

  const result = await loanService.createLoan(
    employeeId,
    req.body,
    req.user,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );

  return res.status(201).json(
    apiResponse(201, result, 'Loan request submitted successfully')
  );
});

export const getMyEligibility = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId?._id || req.user.employeeId;
  if (!employeeId) {
    throw new ApiError(403, 'Your account is not linked to an employee profile');
  }

  const limits = await calculateBorrowingLimits(employeeId);
  return res.status(200).json(
    apiResponse(200, limits, 'Borrowing limits calculated successfully')
  );
});

export const getLoans = asyncHandler(async (req, res) => {
  // Extract active scope from CASL middleware
  const userScope = req.permissionScope || 'own';
  const result = await loanService.getLoans(req.query, userScope, req.user);

  return res.status(200).json(
    apiResponse(200, result.items, 'Loans retrieved successfully', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  );
});

export const getLoanById = asyncHandler(async (req, res) => {
  const userScope = req.permissionScope || 'own';
  const result = await loanService.getLoanById(req.params.id, userScope, req.user);

  return res.status(200).json(
    apiResponse(200, result, 'Loan retrieved successfully')
  );
});

export const getLoanSchedule = asyncHandler(async (req, res) => {
  const userScope = req.permissionScope || 'own';
  const result = await loanService.getLoanSchedule(req.params.id, userScope, req.user);

  return res.status(200).json(
    apiResponse(200, result, 'Loan schedule retrieved successfully')
  );
});

export const decideLoan = asyncHandler(async (req, res) => {
  const result = await loanService.decideLoan(
    req.params.id,
    req.body,
    req.user,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );

  return res.status(200).json(
    apiResponse(200, result, `Loan ${req.body.decision} recorded successfully`)
  );
});

export const prepayLoan = asyncHandler(async (req, res) => {
  const result = await loanService.prepayLoan(
    req.params.id,
    req.body,
    req.user,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );

  return res.status(200).json(
    apiResponse(200, result, 'Prepayment recorded successfully')
  );
});

export const getLedgerSummary = asyncHandler(async (req, res) => {
  const result = await loanService.getLedgerSummary();

  return res.status(200).json(
    apiResponse(200, result, 'Loan ledger summary retrieved successfully')
  );
});
