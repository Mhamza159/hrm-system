/**
 * @file payroll.controller.js
 * @description HTTP Controllers for M9 Payroll & Statutory Compliance.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.1 - 9.17)
 * - Layer: Controller (Parses input, calls service, formats standard envelope)
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { PayrollService } from './payroll.service.js';

/**
 * 9.1: Create Initial Salary Structure
 * POST /api/v1/salary-structures
 */
export const createSalaryStructure = asyncHandler(async (req, res) => {
  const structure = await PayrollService.createSalaryStructure(
    req.body,
    req.user,
    req.ip,
    req.get('user-agent')
  );

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: structure,
    message: 'Salary structure assigned successfully'
  });
});

/**
 * 9.1: List Paginated Salary Structures
 * GET /api/v1/salary-structures
 */
export const getSalaryStructures = asyncHandler(async (req, res) => {
  const result = await PayrollService.getSalaryStructures(req.query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.docs,
    meta: result.meta,
    message: 'Salary structures retrieved successfully'
  });
});

/**
 * 9.2: Get Employee Salary Structure & History
 * GET /api/v1/salary-structures/employee/:id
 */
export const getEmployeeSalaryStructure = asyncHandler(async (req, res) => {
  const data = await PayrollService.getEmployeeSalaryStructure(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: 'Employee salary structure retrieved successfully'
  });
});

/**
 * 9.2: Revise / Increment Salary Structure
 * PUT /api/v1/salary-structures/employee/:id
 */
export const reviseSalaryStructure = asyncHandler(async (req, res) => {
  const updatedStructure = await PayrollService.reviseSalaryStructure(
    req.params.id,
    req.body,
    req.user,
    req.ip,
    req.get('user-agent')
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: updatedStructure,
    message: 'Salary structure revised successfully'
  });
});
