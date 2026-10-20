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

/**
 * 9.7: Generate Batch Monthly Payroll Run
 * POST /api/v1/payroll/runs/generate
 */
export const generatePayrollRun = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  const run = await PayrollService.generatePayrollRun(month, year, req.user);

  res.status(202).json({
    success: true,
    statusCode: 202,
    data: run,
    message: `Batch payroll run for ${year}-${String(month).padStart(2, '0')} calculated successfully`
  });
});

/**
 * 9.7: List Paginated Payroll Runs
 * GET /api/v1/payroll/runs
 */
export const getPayrollRuns = asyncHandler(async (req, res) => {
  const result = await PayrollService.getPayrollRuns(req.query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.docs,
    meta: result.meta,
    message: 'Payroll runs retrieved successfully'
  });
});

/**
 * 9.8: Get Detailed Payroll Run with Payslips
 * GET /api/v1/payroll/runs/:id
 */
export const getPayrollRunById = asyncHandler(async (req, res) => {
  const result = await PayrollService.getPayrollRunById(req.params.id, req.query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.run,
    payslips: result.payslips,
    meta: result.meta,
    message: 'Payroll run details retrieved successfully'
  });
});

/**
 * 9.9: Adjust Line Item on Draft Payslip
 * PATCH /api/v1/payroll/runs/:id/payslips/:slipId
 */
export const adjustPayslipLineItem = asyncHandler(async (req, res) => {
  const updatedSlip = await PayrollService.adjustPayslipLineItem(
    req.params.id,
    req.params.slipId,
    req.body,
    req.user,
    req.ip,
    req.get('user-agent')
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: updatedSlip,
    message: 'Payslip line item adjusted and recalculated successfully'
  });
});

/**
 * 9.8: Approve Payroll Run (Super Admin Only)
 * PATCH /api/v1/payroll/runs/:id/approve
 */
export const approvePayrollRun = asyncHandler(async (req, res) => {
  const approvedRun = await PayrollService.approvePayrollRun(
    req.params.id,
    req.user,
    req.ip,
    req.get('user-agent')
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: approvedRun,
    message: 'Payroll run approved and released successfully'
  });
});

/**
 * 9.8: Mark Payroll Run as Paid
 * PATCH /api/v1/payroll/runs/:id/mark-paid
 */
export const markPayrollPaid = asyncHandler(async (req, res) => {
  const paidRun = await PayrollService.markPayrollPaid(
    req.params.id,
    req.user,
    req.body,
    req.ip,
    req.get('user-agent')
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: paidRun,
    message: 'Payroll run marked as paid successfully'
  });
});

/**
 * 9.11: Get Employee Self-Service Payslips
 * GET /api/v1/payslips/my
 */
export const getMyPayslips = asyncHandler(async (req, res) => {
  const result = await PayrollService.getMyPayslips(req.user, req.query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.docs,
    meta: result.meta,
    message: 'Self-service payslips retrieved successfully'
  });
});

/**
 * 9.10: Download or Stream Branded Payslip PDF
 * GET /api/v1/payslips/:id/pdf
 */
export const getPayslipPdf = asyncHandler(async (req, res) => {
  const { buffer, filename } = await PayrollService.getPayslipPdf(req.params.id, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.status(200).send(buffer);
});

/**
 * 9.12: Export Bank Transfer Advice Sheet (XLSX)
 * GET /api/v1/payroll/runs/:id/bank-advice
 */
export const exportBankAdvice = asyncHandler(async (req, res) => {
  const bank = req.query.bank || 'standard';
  const { buffer, filename } = await PayrollService.exportBankAdvice(req.params.id, bank);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.status(200).send(buffer);
});

/**
 * 9.13: Process Employee Final Exit Settlement
 * POST /api/v1/payroll/final-settlement/:id
 */
export const processFinalSettlement = asyncHandler(async (req, res) => {
  const result = await PayrollService.processFinalSettlement(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: 'Employee final exit settlement processed successfully'
  });
});

/**
 * 9.14: Form IT-3 Annual Tax Withholding Certificate PDF
 * GET /api/v1/payslips/annual-tax-certificate
 */
export const getAnnualTaxCertificatePdf = asyncHandler(async (req, res) => {
  const employeeId = req.query.employeeId || req.user.employeeId;
  const taxYear = req.query.taxYear || new Date().getFullYear();

  const { buffer, filename } = await PayrollService.getAnnualTaxCertificatePdf(
    employeeId,
    taxYear,
    req.user
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.status(200).send(buffer);
});

/**
 * 9.15: Statutory Tax Compliance Report
 * GET /api/v1/reports/tax-compliance
 */
export const getTaxComplianceReport = asyncHandler(async (req, res) => {
  const data = await PayrollService.getTaxComplianceReport(req.query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: 'Tax compliance report retrieved successfully'
  });
});

/**
 * 9.15: EOBI Compliance Report
 * GET /api/v1/reports/eobi-compliance
 */
export const getEobiComplianceReport = asyncHandler(async (req, res) => {
  const data = await PayrollService.getEobiComplianceReport(req.query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: 'EOBI compliance report retrieved successfully'
  });
});

/**
 * 9.16: Department Manager Team Overtime Guard
 * GET /api/v1/payroll/team-overtime
 */
export const getTeamOvertimeHours = asyncHandler(async (req, res) => {
  const data = await PayrollService.getTeamOvertimeHours(req.user, req.query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: 'Team overtime hours retrieved successfully'
  });
});

/**
 * 9.17: Departmental Payroll Cost Analytics
 * GET /api/v1/reports/payroll-cost
 */
export const getDepartmentPayrollCostAnalytics = asyncHandler(async (req, res) => {
  const data = await PayrollService.getDepartmentPayrollCostAnalytics(req.query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: 'Departmental payroll cost analytics retrieved successfully'
  });
});


