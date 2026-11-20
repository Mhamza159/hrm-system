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
  const { search } = req.query;
  const candidates = await departmentService.getHeadCandidates({ search });
  return res.status(200).json(
    apiResponse(200, candidates, 'Candidate users retrieved successfully.')
  );
});

/**
 * GET /api/v1/departments/analytics
 * Retrieve rich workforce analytics & department distribution metrics for dashboard visualizations
 */
export const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const analytics = await departmentService.getDepartmentAnalytics();
  return res.status(200).json(
    apiResponse(200, analytics, 'Department analytics retrieved successfully.')
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
 * GET /api/v1/departments/stats
 * Retrieve aggregated statistics for dashboard KPI cards
 */
export const getDepartmentStats = asyncHandler(async (req, res) => {
  const stats = await departmentService.getDepartmentStats();
  return res.status(200).json(
    apiResponse(200, stats, 'Department statistics retrieved successfully.')
  );
});

/**
 * GET /api/v1/departments/archived
 * Retrieve paginated list of archived departments
 */
export const getArchivedDepartments = asyncHandler(async (req, res) => {
  const { search, page, limit, sortBy, sortOrder } = req.query;
  const result = await departmentService.getArchivedDepartments({
    search,
    page,
    limit,
    sortBy,
    sortOrder
  });
  return res.status(200).json(
    apiResponse(200, result, 'Archived departments retrieved successfully.', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  );
});

/**
 * PATCH /api/v1/departments/:id/archive
 * Move department to archive (cold storage)
 */
export const archiveDepartment = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const department = await departmentService.archiveDepartment(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, department, `Department '${department.name}' successfully archived.`)
  );
});

/**
 * PATCH /api/v1/departments/:id/restore
 * Restore archived department to active directory
 */
export const restoreDepartment = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const department = await departmentService.restoreDepartment(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, department, `Department '${department.name}' successfully restored.`)
  );
});

/**
 * DELETE /api/v1/departments/:id/permanent
 * Permanently purge department (guarded against assigned employees)
 */
export const permanentDeleteDepartment = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const result = await departmentService.permanentDeleteDepartment(req.params.id, actor);
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
 * GET /api/v1/designations/stats
 * Retrieve 7-metric KPI statistics for designation dashboard cards
 */
export const getDesignationStats = asyncHandler(async (req, res) => {
  const stats = await departmentService.getDesignationStats();
  return res.status(200).json(
    apiResponse(200, stats, 'Designation statistics retrieved successfully.')
  );
});

/**
 * GET /api/v1/designations/analytics
 * Retrieve rich workforce analytics & designation distribution metrics for dashboard visualizations
 */
export const getDesignationAnalytics = asyncHandler(async (req, res) => {
  const analytics = await departmentService.getDesignationAnalytics();
  return res.status(200).json(
    apiResponse(200, analytics, 'Designation analytics retrieved successfully.')
  );
});

/**
 * GET /api/v1/designations/archived
 * Retrieve paginated archived designations with archive actor and headcount
 */
export const getArchivedDesignations = asyncHandler(async (req, res) => {
  const { search, departmentId, grade, page, limit, sortBy, sortOrder } = req.query;
  const result = await departmentService.getArchivedDesignations({
    search,
    departmentId,
    grade,
    page,
    limit,
    sortBy,
    sortOrder
  });
  return res.status(200).json(
    apiResponse(200, result, 'Archived designations retrieved successfully.', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  );
});

/**
 * PATCH /api/v1/designations/:id/archive
 * Move designation to archive (cold storage)
 */
export const archiveDesignation = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const designation = await departmentService.archiveDesignation(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, designation, `Designation '${designation.title}' successfully archived.`)
  );
});

/**
 * PATCH /api/v1/designations/:id/restore
 * Restore archived designation to active directory
 */
export const restoreDesignation = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const designation = await departmentService.restoreDesignation(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, designation, `Designation '${designation.title}' successfully restored.`)
  );
});

/**
 * DELETE /api/v1/designations/:id/permanent
 * Permanently purge designation (guarded against assigned employees)
 */
export const permanentDeleteDesignation = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const result = await departmentService.permanentDeleteDesignation(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, null, result.message)
  );
});

/**
 * GET /api/v1/shifts
 * 4.4: Retrieve list of shifts
 */
export const getShifts = asyncHandler(async (req, res) => {
  const { type, isActive, isCrossMidnight, departmentId, page, limit, search, isArchived } = req.query;
  const result = await departmentService.getAllShifts({ type, isActive, isCrossMidnight, departmentId, page, limit, search, isArchived });
  return res.status(200).json(
    apiResponse(200, result.shifts, 'Shifts retrieved successfully.', result.pagination)
  );
});

/**
 * GET /api/v1/shifts/archived
 * 4.4: Retrieve list of archived shifts
 */
export const getArchivedShifts = asyncHandler(async (req, res) => {
  const { search, type, departmentId, page, limit } = req.query;
  const result = await departmentService.getArchivedShifts({ search, type, departmentId, page, limit });
  return res.status(200).json(
    apiResponse(200, result.shifts, 'Archived shifts retrieved successfully.', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    })
  );
});

/**
 * GET /api/v1/shifts/stats
 * 4.4: Retrieve live KPI stats for shifts
 */
export const getShiftStats = asyncHandler(async (req, res) => {
  const stats = await departmentService.getShiftStats();
  return res.status(200).json(
    apiResponse(200, stats, 'Shift statistics retrieved successfully.')
  );
});

/**
 * GET /api/v1/shifts/analytics
 * 4.4: Retrieve shift analytics and workforce distributions
 */
export const getShiftAnalytics = asyncHandler(async (req, res) => {
  const analytics = await departmentService.getShiftAnalytics();
  return res.status(200).json(
    apiResponse(200, analytics, 'Shift analytics retrieved successfully.')
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
 * GET /api/v1/shifts/:id/employees
 * 4.4: Retrieve assigned employees for a shift
 */
export const getShiftEmployees = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await departmentService.getShiftEmployees(req.params.id, { page, limit, search });
  return res.status(200).json(
    apiResponse(200, result.employees, 'Shift employees retrieved successfully.', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    })
  );
});

/**
 * POST /api/v1/shifts/:id/assign
 * 4.4: Assign or reassign employees to a shift
 */
export const assignEmployeesToShift = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const result = await departmentService.assignEmployeesToShift(req.params.id, req.body, actor);
  return res.status(200).json(
    apiResponse(200, result, result.message)
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
 * PATCH /api/v1/shifts/:id/archive
 * 4.4: Soft-archive a shift
 */
export const archiveShift = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const shift = await departmentService.archiveShift(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, shift, `Shift '${shift.name}' archived successfully.`)
  );
});

/**
 * PATCH /api/v1/shifts/:id/restore
 * 4.4: Restore an archived shift
 */
export const restoreShift = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const shift = await departmentService.restoreShift(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, shift, `Shift '${shift.name}' restored successfully.`)
  );
});

/**
 * DELETE /api/v1/shifts/:id/permanent
 * 4.4: Permanently purge shift (guarded against assigned active employees)
 */
export const permanentDeleteShift = asyncHandler(async (req, res) => {
  const actor = {
    _id: req.user?._id,
    email: req.user?.email,
    roles: req.user?.roles,
    ip: req.ip
  };
  const result = await departmentService.permanentDeleteShift(req.params.id, actor);
  return res.status(200).json(
    apiResponse(200, null, result.message)
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
  const isSuperAdmin = req.user?.roles?.some(
    (r) => r === 'Super Admin' || r?.name === 'Super Admin' || r?.name === 'HR Manager'
  );

  if (!scope || scope === 'all') {
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

  const canViewSensitive = isSuperAdmin || req.user?.roles?.some(
    (r) => r === 'HR Manager' || r?.name === 'HR Manager'
  );

  const options = {
    departmentId: req.query.departmentId,
    viewMode: req.query.viewMode || 'company',
    employeeId: req.query.employeeId,
    maxDepth: req.query.maxDepth ? parseInt(req.query.maxDepth, 10) : undefined,
    status: req.query.status || 'active',
    search: req.query.search,
    canViewSensitive
  };

  const chartData = await departmentService.getOrgChart(req.user?._id, scope, req.user, options);
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
