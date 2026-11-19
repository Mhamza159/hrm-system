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
import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../../config/cloudinary.js';

export const createEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.createEmployee(req.body, req.user);
  return res
    .status(201)
    .json(apiResponse(201, result, 'Employee onboarded successfully'));
});

export const getNextEmployeeCode = asyncHandler(async (req, res) => {
  const nextCode = await employeeService.generateNextEmployeeCode();
  return res
    .status(200)
    .json(apiResponse(200, { nextCode }, 'Next employee code retrieved successfully'));
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

export const restoreEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.restoreEmployee(req.params.id, req.user);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Employee reverted from archive successfully'));
});

export const permanentDeleteEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.permanentDeleteEmployee(req.params.id, req.user);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Employee permanently deleted successfully'));
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
  const result = await employeeService.getChangeRequests(req.query, req.user);
  const requestsList = Array.isArray(result) ? result : result.requests || [];
  const meta = Array.isArray(result)
    ? null
    : {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
  return res
    .status(200)
    .json(apiResponse(200, requestsList, 'Change requests retrieved successfully', meta));
});

export const getChangeRequestStats = asyncHandler(async (req, res) => {
  const result = await employeeService.getChangeRequestStats(req.user);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Change request statistics retrieved successfully'));
});

export const getChangeRequestById = asyncHandler(async (req, res) => {
  const result = await employeeService.getChangeRequestById(req.params.id, req.user);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Change request details retrieved successfully'));
});

export const getMyChangeRequests = asyncHandler(async (req, res) => {
  const result = await employeeService.getMyChangeRequests(req.user._id, req.query);
  return res
    .status(200)
    .json(apiResponse(200, result, 'My change requests retrieved successfully'));
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

export const returnChangeRequest = asyncHandler(async (req, res) => {
  const result = await employeeService.returnChangeRequest(
    req.params.id,
    req.body,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Change request returned for correction successfully'));
});

export const cancelChangeRequest = asyncHandler(async (req, res) => {
  const result = await employeeService.cancelChangeRequest(
    req.params.id,
    req.body,
    req.user
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Change request cancelled successfully'));
});

export const uploadChangeRequestAttachment = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, 'Please upload a document file (PDF, PNG, or JPEG, max 5MB)');
  }

  let fileUrl = '';
  if (isCloudinaryConfigured()) {
    const uploadRes = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'hrm/change-requests',
      resource_type: 'auto'
    });
    fileUrl = uploadRes.secure_url;
  } else {
    fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  const attachment = {
    name: req.file.originalname,
    url: fileUrl,
    fileType: req.file.mimetype,
    size: req.file.size
  };

  return res
    .status(200)
    .json(apiResponse(200, attachment, 'Attachment uploaded successfully'));
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

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  const result = await employeeService.uploadAvatar('me', req.file, req.user);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Profile photo updated successfully'));
});

export const uploadEmployeeAvatar = asyncHandler(async (req, res) => {
  const result = await employeeService.uploadAvatar(req.params.id, req.file, req.user);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Employee profile photo updated successfully'));
});

/**
 * Retrieve compiled Employee ID Card coordinates and verifiable token (Phase 36)
 */
export const getEmployeeIdCard = asyncHandler(async (req, res) => {
  const result = await employeeService.getEmployeeIdCard(
    req.params.id,
    req.user,
    req.permissionScope
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Employee ID card generated successfully'));
});

/**
 * Self-service: Retrieve logged-in employee's own ID Card
 */
export const getMyIdCard = asyncHandler(async (req, res) => {
  let employeeId = req.user.employeeId || req.user.employee;
  if (!employeeId) {
    const emp = await Employee.findOne({
      $or: [{ userId: req.user._id }, { _id: req.user.employeeId || req.user.employee }],
      isDeleted: false
    });
    if (!emp) {
      throw new ApiError(404, 'No employee record linked to current user account');
    }
    employeeId = emp._id;
  }
  const result = await employeeService.getEmployeeIdCard(
    employeeId,
    req.user,
    'own'
  );
  return res
    .status(200)
    .json(apiResponse(200, result, 'Your official ID card retrieved successfully'));
});

