/**
 * @file department.controller.js
 * @description Controller Layer for Module M4 Departments, Designations, Shifts & Org Chart.
 * 
 * SPECIFICATION:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Rows 4.1 - 4.7)
 * - Layer: Controller (Request parser & HTTP Response dispatcher)
 * - Layer Invariant: Controllers ONLY validate request inputs, delegate to service,
 *   and respond using apiResponse. Direct DB queries are forbidden here.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { getEffectiveScopeForAction } from '../../middlewares/checkPermission.js';
import * as departmentService from './department.service.js';

/**
 * GET /api/v1/departments
 * 4.1: Retrieve list of departments with hierarchy, populated heads, and headcounts
 */
export const getDepartments = asyncHandler(async (req, res) => {
  const { search, parentId, isActive, page, limit } = req.query;
  const result = await departmentService.getAllDepartments({ search, parentId, isActive, page, limit });
  return res.status(200).json(
    apiResponse(200, result.departments, 'Departments retrieved successfully.', result.pagination)
  );
});

/**
 * GET /api/v1/departments/:id
 * 4.1: Retrieve single department details
 */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  return res.status(200).json(
    apiResponse(200, department, 'Department details retrieved successfully.')
  );
});

/**
 * POST /api/v1/departments
 * 4.1: Create new department
 */
export const createDepartment = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const department = await departmentService.createDepartment(req.body, actor);
  return res.status(201).json(
    apiResponse(201, department, 'Department created successfully.')
  );
});

/**
 * PATCH /api/v1/departments/:id
 * 4.1: Update existing department
 */
export const updateDepartment = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const department = await departmentService.updateDepartment(req.params.id, req.body, actor);
  return res.status(200).json(
    apiResponse(200, department, 'Department updated successfully.')
  );
});

/**
 * GET /api/v1/departments/heads/candidates
 * 4.2: Retrieve list of active users eligible for Department Head assignment
 */
export const getHeadCandidates = asyncHandler(async (req, res) => {
  const candidates = await departmentService.getHeadCandidates();
  return res.status(200).json(
    apiResponse(200, candidates, 'Candidate users retrieved successfully.')
  );
});

/**
 * PATCH /api/v1/departments/:id/head
 * 4.2: Assign or update department head
 */
export const assignDepartmentHead = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const department = await departmentService.assignDepartmentHead(req.params.id, req.body.headId, actor);
  return res.status(200).json(
    apiResponse(200, department, 'Department head assigned successfully.')
  );
});

/**
 * DELETE /api/v1/departments/:id
 * 4.1: Soft delete department (guarded against active employees & sub-departments)
 */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const result = await departmentService.deleteDepartment(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, null, result.message)
  );
});

/**
 * GET /api/v1/designations
 * 4.3: Retrieve list of designations
 */
export const getDesignations = asyncHandler(async (req, res) => {
  const { departmentId, grade, isActive, page, limit, search } = req.query;
  const result = await departmentService.getAllDesignations({ departmentId, grade, isActive, page, limit, search });
  return res.status(200).json(
    apiResponse(200, result.designations, 'Designations retrieved successfully.', result.pagination)
  );
});

/**
 * GET /api/v1/designations/:id
 * 4.3: Retrieve single designation details
 */
export const getDesignationById = asyncHandler(async (req, res) => {
  const designation = await departmentService.getDesignationById(req.params.id);
  return res.status(200).json(
    apiResponse(200, designation, 'Designation details retrieved successfully.')
  );
});

/**
 * POST /api/v1/designations
 * 4.3: Create new designation
 */
export const createDesignation = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const designation = await departmentService.createDesignation(req.body, actor);
  return res.status(201).json(
    apiResponse(201, designation, 'Designation created successfully.')
  );
});

/**
 * PATCH /api/v1/designations/:id
 * 4.3: Update existing designation
 */
export const updateDesignation = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const designation = await departmentService.updateDesignation(req.params.id, req.body, actor);
  return res.status(200).json(
    apiResponse(200, designation, 'Designation updated successfully.')
  );
});

/**
 * DELETE /api/v1/designations/:id
 * 4.3: Soft delete designation (guarded against active employees)
 */
export const deleteDesignation = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const result = await departmentService.deleteDesignation(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, null, result.message)
  );
});

/**
 * GET /api/v1/shifts
 * 4.4: Retrieve list of shifts
 */
export const getShifts = asyncHandler(async (req, res) => {
  const { type, isActive, isCrossMidnight, page, limit, search } = req.query;
  const result = await departmentService.getAllShifts({ type, isActive, isCrossMidnight, page, limit, search });
  return res.status(200).json(
    apiResponse(200, result.shifts, 'Shifts retrieved successfully.', result.pagination)
  );
});

/**
 * GET /api/v1/shifts/:id
 * 4.4: Retrieve single shift details
 */
export const getShiftById = asyncHandler(async (req, res) => {
  const shift = await departmentService.getShiftById(req.params.id);
  return res.status(200).json(
    apiResponse(200, shift, 'Shift details retrieved successfully.')
  );
});

/**
 * POST /api/v1/shifts
 * 4.4: Create new shift
 */
export const createShift = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const shift = await departmentService.createShift(req.body, actor);
  return res.status(201).json(
    apiResponse(201, shift, 'Shift created successfully.')
  );
});

/**
 * PATCH /api/v1/shifts/:id
 * 4.4: Update existing shift
 */
export const updateShift = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const shift = await departmentService.updateShift(req.params.id, req.body, actor);
  return res.status(200).json(
    apiResponse(200, shift, 'Shift updated successfully.')
  );
});

/**
 * DELETE /api/v1/shifts/:id
 * 4.4: Soft delete shift (guarded against active employees)
 */
export const deleteShift = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const result = await departmentService.deleteShift(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, null, result.message)
  );
});

/**
 * GET /api/v1/org-chart
 * 4.5 & 4.7: Retrieve hierarchical organizational chart with reporting chain
 */
export const getOrgChart = asyncHandler(async (req, res) => {
  let scope = req.permissionScope;
  if (!scope || scope === 'all') {
    const isSuperAdmin = req.user?.roles?.some(
      (r) => r === 'Super Admin' || r?.name === 'Super Admin' || r?.name === 'HR Manager'
    );
    if (!isSuperAdmin) {
      const orgScope = getEffectiveScopeForAction(req.user, 'org.view');
      const empScope = getEffectiveScopeForAction(req.user, 'employee.view');
      if (orgScope === 'team' || orgScope === 'department') {
        scope = orgScope;
      } else if (empScope === 'team' || empScope === 'department') {
        scope = empScope;
      }
    }
  }

  const chartData = await departmentService.getOrgChart(req.user?._id, scope, req.user);
  return res.status(200).json(
    apiResponse(200, chartData, 'Organizational hierarchy retrieved successfully.')
  );
});

/**
 * GET /api/v1/teams/my
 * 4.6: Retrieve manager direct reports and team roster
 */
export const getMyTeam = asyncHandler(async (req, res) => {
  const teamData = await departmentService.getMyTeam(req.user?._id);
  return res.status(200).json(
    apiResponse(200, teamData, 'Manager team details retrieved successfully.')
  );
});
