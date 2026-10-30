/**
 * @file expense.controller.js
 * @description Express Controller for Expense Claims & Categories (Module M11 / Slices 11.1 to 11.5).
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims
 * - Invariant: Uniform apiResponse wrapper payload.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as expenseService from './expense.service.js';

// ============================================================================
// 1. Categories Controller Handlers (BUILD-GUIDE Row 11.1)
// ============================================================================

export const createCategory = asyncHandler(async (req, res) => {
  const result = await expenseService.createCategory(req.body, req.user);
  return res.status(201).json(apiResponse(201, result, 'Expense category created successfully'));
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const result = await expenseService.getAllCategories(req.query);
  return res.status(200).json(apiResponse(200, result, 'Expense categories retrieved successfully'));
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const result = await expenseService.getCategoryById(req.params.id);
  return res.status(200).json(apiResponse(200, result, 'Expense category details retrieved'));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const result = await expenseService.updateCategory(req.params.id, req.body, req.user);
  return res.status(200).json(apiResponse(200, result, 'Expense category updated successfully'));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await expenseService.deleteCategory(req.params.id, req.user);
  return res.status(200).json(apiResponse(200, result, 'Expense category deleted successfully'));
});

// ============================================================================
// 2. Expense Claims Controller Handlers (BUILD-GUIDE Row 11.2)
// ============================================================================

export const createExpense = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId?._id || req.user.employeeId;
  if (!employeeId) {
    throw new ApiError(403, 'Your account is not linked to an employee profile.');
  }

  const result = await expenseService.createExpense(employeeId, req.body, req.file, req.user);
  return res.status(201).json(apiResponse(201, result, 'Expense claim submitted successfully'));
});

export const getMyExpenses = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId?._id || req.user.employeeId;
  if (!employeeId) {
    throw new ApiError(403, 'Your account is not linked to an employee profile.');
  }

  const result = await expenseService.getMyExpenses(employeeId, req.query);
  return res.status(200).json(apiResponse(200, result.expenses, 'My expense claims retrieved', result.meta));
});

export const getExpenseById = asyncHandler(async (req, res) => {
  const result = await expenseService.getExpenseById(req.params.id, req.user);
  return res.status(200).json(apiResponse(200, result, 'Expense claim details retrieved'));
});

// ============================================================================
// 3. Approvals Controller Handlers (BUILD-GUIDE Row 11.3)
// ============================================================================

export const getPendingApprovals = asyncHandler(async (req, res) => {
  const result = await expenseService.getPendingApprovals(req.user, req.query);
  return res.status(200).json(apiResponse(200, result.expenses, 'Pending expense approvals retrieved', result.meta));
});

export const decideExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.decideExpense(req.params.id, req.body, req.user);
  return res.status(200).json(apiResponse(200, result, `Expense claim ${result.status} successfully`));
});

// ============================================================================
// 4. Reimbursement Controller Handlers (BUILD-GUIDE Row 11.4)
// ============================================================================

export const reimburseExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.reimburseExpense(req.params.id, req.body, req.user);
  return res.status(200).json(apiResponse(200, result, 'Expense claim reimbursed successfully'));
});

// ============================================================================
// 5. Reports Controller Handler (BUILD-GUIDE Row 11.5)
// ============================================================================

export const getExpenseMonthlyReport = asyncHandler(async (req, res) => {
  const result = await expenseService.getExpenseMonthlyReport(req.query);
  return res.status(200).json(apiResponse(200, result, 'Expense monthly report retrieved successfully'));
});

