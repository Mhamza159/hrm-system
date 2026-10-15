/**
 * @file employee.controller.js
 * @description Controller Layer for Employee Management (Module M3).
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.1 to 3.17)
 * - Layer: Controller (Parses input, invokes service, returns apiResponse)
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as employeeService from './employee.service.js';
import { checkProbationExpiry } from '../../jobs/probation.job.js';

export const createEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.createEmployee(req.body, req.user);
  return res
    .status(201)
    .json(apiResponse(201, result, 'Employee onboarded successfully'));
});

export const getEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.getEmployees(
    req.query,
    req.user,
    req.permissionScope
  );
  return res.status(200).json(
    apiResponse(200, result, 'Employee directory retrieved successfully', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  );
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const result = await employeeService.getEmployeeById(
    req.params.id,
    req.user,
    req.permissionScope
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Employee details retrieved successfully'));
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const result = await employeeService.getMyProfile(req.user._id);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Personal profile retrieved successfully'));
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.updateEmployee(
    req.params.id,
    req.body,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Employee updated successfully'));
});

export const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const result = await employeeService.updateEmployeeStatus(
    req.params.id,
    req.body,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Employee status updated successfully'));
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.deleteEmployee(req.params.id, req.user);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Employee archived successfully'));
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const result = await employeeService.uploadDocument(
    req.params.id,
    req.body,
    req.file,
    req.user
  );
  return res
    .status(201)
    .json(apiResponse(201, result, 'Document uploaded successfully'));
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await employeeService.deleteDocument(
    req.params.id,
    req.params.docId,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Document deleted successfully'));
});

export const updateSkills = asyncHandler(async (req, res) => {
  const targetId = req.params.id || req.user.employeeId;
  const result = await employeeService.updateSkills(
    targetId,
    req.body.skills,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Skills updated successfully'));
});

export const recordJobHistory = asyncHandler(async (req, res) => {
  const result = await employeeService.recordJobHistory(
    req.params.id,
    req.body,
    req.user
  );
  return res
    .status(201)
    .json(apiResponse(201, result, 'Career history event recorded'));
});

export const getJobHistory = asyncHandler(async (req, res) => {
  const result = await employeeService.getJobHistory(req.params.id);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Career history retrieved successfully'));
});

export const getSalaryHistory = asyncHandler(async (req, res) => {
  const result = await employeeService.getSalaryHistory(
    req.params.id,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Salary revision history retrieved successfully'));
});

export const submitChangeRequest = asyncHandler(async (req, res) => {
  const result = await employeeService.submitChangeRequest(
    req.user._id,
    req.body
  );
  return res
    .status(201)
    .json(apiResponse(201, result, 'Profile change request submitted for HR approval'));
});

export const getChangeRequests = asyncHandler(async (req, res) => {
  const result = await employeeService.getChangeRequests(req.query);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Change requests retrieved successfully'));
});

export const decideChangeRequest = asyncHandler(async (req, res) => {
  const result = await employeeService.decideChangeRequest(
    req.params.id,
    req.body,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, `Change request ${req.body.action} successfully`));
});

export const importEmployees = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, 'Please upload an Excel spreadsheet (.xlsx)');
  }
  const result = await employeeService.importEmployeesFromExcel(
    req.file.buffer,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Bulk employee ingestion completed'));
});

export const exportEmployees = asyncHandler(async (req, res) => {
  const buffer = await employeeService.exportEmployeesToExcel(
    req.query,
    req.user
  );
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="employees-directory.xlsx"'
  );
  return res.status(200).send(buffer);
});

export const triggerProbationCheck = asyncHandler(async (req, res) => {
  const result = await checkProbationExpiry();
  return res
    .status(200)
    .json(apiResponse(200, result, 'Probation expiry check executed successfully'));
});
