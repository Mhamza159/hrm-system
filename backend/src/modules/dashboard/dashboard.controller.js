/**
 * @file dashboard.controller.js
 * @description HTTP Controllers for Role-Based Dashboard aggregations.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as dashboardService from './dashboard.service.js';

/**
 * 7.1-BE: Super Admin Executive Dashboard Controller
 * Route: GET /api/v1/dashboard/admin
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAdminDashboardData();
  return res.status(200).json(
    new ApiResponse(200, data, 'Executive admin dashboard retrieved successfully')
  );
});

/**
 * 7.2-BE: HR Manager Operational Dashboard Controller
 * Route: GET /api/v1/dashboard/hr
 */
export const getHrDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getHrDashboardData();
  return res.status(200).json(
    new ApiResponse(200, data, 'HR workforce operations dashboard retrieved successfully')
  );
});

/**
 * 7.3-BE: Department Manager Team Dashboard Controller
 * Route: GET /api/v1/dashboard/manager
 */
export const getManagerDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getManagerDashboardData(req.user);
  return res.status(200).json(
    new ApiResponse(200, data, 'Team dashboard retrieved successfully')
  );
});

/**
 * 7.4-BE: Employee Personal Dashboard Controller
 * Route: GET /api/v1/dashboard/employee
 */
export const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getEmployeeDashboardData(req.user);
  return res.status(200).json(
    new ApiResponse(200, data, 'Personal employee dashboard retrieved successfully')
  );
});
