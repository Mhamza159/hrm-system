/**
 * @file payroll.service.js
 * @description Domain Business Logic for Payroll, Salary Structures & Pakistan Statutory Compliance.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.1 - 9.17)
 * - Layer: Service (Business Logic Layer)
 * - Financial Invariant: All values computed and stored in integer paisa (PKR × 100).
 */

import { SalaryStructure } from '../../models/salaryStructure.model.js';
import { Employee } from '../../models/employee.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { paginate } from '../../utils/paginate.js';
import { recordAuditLog } from '../../services/audit.service.js';

export class PayrollService {
  /**
   * 9.1: Assign initial salary structure to an employee
   */
  static async createSalaryStructure(data, actor, ip = null, userAgent = null) {
    const { employeeId, effectiveFrom, ...allowances } = data;

    // Verify employee exists and is active
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw new ApiError(404, 'Employee not found or has been archived');
    }

    // Check if employee already has an active salary structure
    const existingActive = await SalaryStructure.findOne({
      employeeId,
      status: 'active',
      isDeleted: false
    });

    if (existingActive) {
      throw new ApiError(
        409,
        'Employee already has an active salary structure. Use salary revision endpoint to update.'
      );
    }

    // Calculate gross salary strictly in integer paisa
    const basicSalary = Math.round(Number(allowances.basicSalary || 0));
    const houseRentAllowance = Math.round(Number(allowances.houseRentAllowance || 0));
    const medicalAllowance = Math.round(Number(allowances.medicalAllowance || 0));
    const conveyanceAllowance = Math.round(Number(allowances.conveyanceAllowance || 0));
    const otherAllowances = Math.round(Number(allowances.otherAllowances || 0));
    const grossSalary = basicSalary + houseRentAllowance + medicalAllowance + conveyanceAllowance + otherAllowances;

    const structure = await SalaryStructure.create({
      employeeId,
      effectiveFrom: new Date(effectiveFrom),
      currency: allowances.currency || 'PKR',
      basicSalary,
      houseRentAllowance,
      medicalAllowance,
      conveyanceAllowance,
      otherAllowances,
      grossSalary,
      eobiEnabled: allowances.eobiEnabled !== undefined ? allowances.eobiEnabled : true,
      pessiEnabled: allowances.pessiEnabled !== undefined ? allowances.pessiEnabled : false,
      providentFundEnabled: allowances.providentFundEnabled !== undefined ? allowances.providentFundEnabled : false,
      providentFundRate: allowances.providentFundRate || 0,
      status: 'active',
      revisedBy: actor?._id || null
    });

    // Record audit trail
    await recordAuditLog({
      userId: actor?._id,
      actor,
      action: 'SALARY_STRUCTURE_CREATE',
      entity: 'SalaryStructure',
      entityId: structure._id,
      after: structure.toObject(),
      ip,
      userAgent,
      details: {
        employeeCode: employee.employeeCode,
        grossSalary
      }
    });

    return structure;
  }

  /**
   * 9.1: List paginated salary structures
   */
  static async getSalaryStructures(query = {}) {
    const { page = 1, limit = 20, status = 'active', search, departmentId } = query;
    const filter = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    // If searching by employee code or name, find employee IDs first
    if (search || departmentId) {
      const empFilter = { isDeleted: false };
      if (departmentId) empFilter.departmentId = departmentId;
      if (search) {
        empFilter.$or = [
          { employeeCode: new RegExp(search.trim(), 'i') },
          { name: new RegExp(search.trim(), 'i') }
        ];
      }
      const matchingEmployees = await Employee.find(empFilter).select('_id');
      filter.employeeId = { $in: matchingEmployees.map((e) => e._id) };
    }

    return await paginate(SalaryStructure, filter, {
      page,
      limit,
      sort: { effectiveFrom: -1, createdAt: -1 },
      populate: {
        path: 'employeeId',
        select: 'employeeCode name email departmentId designationId status',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      }
    });
  }

  /**
   * 9.2: Get employee current salary structure and revision history
   */
  static async getEmployeeSalaryStructure(employeeId) {
    const employee = await Employee.findById(employeeId).populate([
      { path: 'departmentId', select: 'name' },
      { path: 'designationId', select: 'title' }
    ]);
    if (!employee || employee.isDeleted) {
      throw new ApiError(404, 'Employee not found');
    }

    const current = await SalaryStructure.findOne({
      employeeId,
      status: 'active',
      isDeleted: false
    });

    const history = await SalaryStructure.find({
      employeeId,
      status: { $in: ['historical', 'superseded'] },
      isDeleted: false
    })
      .sort({ effectiveFrom: -1 })
      .populate('revisedBy', 'name email');

    return {
      employee: {
        _id: employee._id,
        name: employee.name,
        employeeCode: employee.employeeCode,
        department: employee.departmentId?.name || '',
        designation: employee.designationId?.title || ''
      },
      current,
      history
    };
  }

  /**
   * 9.2: Revise / Increment Employee Salary Structure
   */
  static async reviseSalaryStructure(employeeId, data, actor, ip = null, userAgent = null) {
    const { effectiveFrom, revisionReason, ...allowances } = data;

    const employee = await Employee.findById(employeeId);
    if (!employee || employee.isDeleted) {
      throw new ApiError(404, 'Employee not found');
    }

    // Find current active structure
    const currentActive = await SalaryStructure.findOne({
      employeeId,
      status: 'active',
      isDeleted: false
    });

    const basicSalary = Math.round(Number(allowances.basicSalary || 0));
    const houseRentAllowance = Math.round(Number(allowances.houseRentAllowance || 0));
    const medicalAllowance = Math.round(Number(allowances.medicalAllowance || 0));
    const conveyanceAllowance = Math.round(Number(allowances.conveyanceAllowance || 0));
    const otherAllowances = Math.round(Number(allowances.otherAllowances || 0));
    const grossSalary = basicSalary + houseRentAllowance + medicalAllowance + conveyanceAllowance + otherAllowances;

    // Archive current structure to superseded
    if (currentActive) {
      currentActive.status = 'superseded';
      await currentActive.save();
    }

    // Insert new active structure with audit trail
    const newStructure = await SalaryStructure.create({
      employeeId,
      effectiveFrom: new Date(effectiveFrom),
      currency: allowances.currency || currentActive?.currency || 'PKR',
      basicSalary,
      houseRentAllowance,
      medicalAllowance,
      conveyanceAllowance,
      otherAllowances,
      grossSalary,
      eobiEnabled: allowances.eobiEnabled !== undefined ? allowances.eobiEnabled : currentActive?.eobiEnabled ?? true,
      pessiEnabled: allowances.pessiEnabled !== undefined ? allowances.pessiEnabled : currentActive?.pessiEnabled ?? false,
      providentFundEnabled: allowances.providentFundEnabled !== undefined ? allowances.providentFundEnabled : currentActive?.providentFundEnabled ?? false,
      providentFundRate: allowances.providentFundRate !== undefined ? allowances.providentFundRate : currentActive?.providentFundRate ?? 0,
      status: 'active',
      revisionReason,
      revisedBy: actor?._id || null
    });

    await recordAuditLog({
      userId: actor?._id,
      actor,
      action: 'SALARY_STRUCTURE_REVISE',
      entity: 'SalaryStructure',
      entityId: newStructure._id,
      before: currentActive ? currentActive.toObject() : null,
      after: newStructure.toObject(),
      ip,
      userAgent,
      details: {
        employeeCode: employee.employeeCode,
        previousGross: currentActive?.grossSalary || 0,
        newGross: grossSalary,
        reason: revisionReason
      }
    });

    return newStructure;
  }

  /**
   * 9.7: Trigger Batch Payroll Generation
   */
  static async generatePayrollRun(month, year, actor) {
    const { executeBatchPayrollCalculation } = await import('./payrollProcessor.js');
    return await executeBatchPayrollCalculation({ month, year, actor });
  }

  /**
   * 9.7: List Paginated Payroll Runs
   */
  static async getPayrollRuns(query = {}) {
    const { page = 1, limit = 20, status, year } = query;
    const filter = {};
    if (status) filter.status = status;
    if (year) filter.year = Number(year);

    const { PayrollRun } = await import('../../models/payrollRun.model.js');
    return await paginate(PayrollRun, filter, {
      page,
      limit,
      sort: { year: -1, month: -1 },
      populate: [
        { path: 'generatedBy', select: 'name email' },
        { path: 'approvedBy', select: 'name email' },
        { path: 'paidBy', select: 'name email' }
      ]
    });
  }

  /**
   * 9.8: Get Detailed Payroll Run with Paginated Payslips
   */
  static async getPayrollRunById(runId, query = {}) {
    const { PayrollRun } = await import('../../models/payrollRun.model.js');
    const { Payslip } = await import('../../models/payslip.model.js');

    const run = await PayrollRun.findById(runId).populate([
      { path: 'generatedBy', select: 'name email' },
      { path: 'approvedBy', select: 'name email' },
      { path: 'paidBy', select: 'name email' }
    ]);

    if (!run) {
      throw new ApiError(404, 'Payroll run not found');
    }

    const { page = 1, limit = 50, search } = query;
    const slipFilter = { payrollRunId: run._id };

    if (search) {
      const matchingEmployees = await Employee.find({
        $or: [
          { employeeCode: new RegExp(search.trim(), 'i') },
          { name: new RegExp(search.trim(), 'i') }
        ]
      }).select('_id');
      slipFilter.employeeId = { $in: matchingEmployees.map((e) => e._id) };
    }

    const paginatedSlips = await paginate(Payslip, slipFilter, {
      page,
      limit,
      sort: { netPay: -1 },
      populate: {
        path: 'employeeId',
        select: 'name employeeCode email departmentId designationId',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      }
    });

    return {
      run,
      payslips: paginatedSlips.docs,
      meta: paginatedSlips.meta
    };
  }

  /**
   * 9.9: Adjust Draft Payslip Line Item & Atomically Recalculate
   */
  static async adjustPayslipLineItem(runId, slipId, adjustment, actor, ip = null, userAgent = null) {
    const { PayrollRun } = await import('../../models/payrollRun.model.js');
    const { Payslip } = await import('../../models/payslip.model.js');
    const { calculateAnnualIncomeTax } = await import('./taxCalculator.js');

    const run = await PayrollRun.findById(runId);
    if (!run) throw new ApiError(404, 'Payroll run not found');

    if (run.status === 'approved' || run.status === 'paid') {
      throw new ApiError(409, `Cannot adjust payslips on an ${run.status} payroll run.`);
    }

    const slip = await Payslip.findOne({ _id: slipId, payrollRunId: runId });
    if (!slip) throw new ApiError(404, 'Payslip not found in this run');

    const { type, name, category, amount, description } = adjustment;
    const itemAmount = Math.max(0, Math.round(Number(amount || 0)));

    if (type === 'earning') {
      slip.earnings.push({
        name,
        category,
        amount: itemAmount,
        description: description || 'Manual HR earning adjustment'
      });
    } else {
      slip.deductions.push({
        name,
        category,
        amount: itemAmount,
        description: description || 'Manual HR deduction adjustment'
      });
    }

    // Recompute gross
    const newGross = slip.earnings.reduce((sum, item) => sum + item.amount, 0);
    slip.grossPay = newGross;

    // Recalculate tax
    const taxResult = await calculateAnnualIncomeTax(newGross);
    const newTax = taxResult.monthlyTaxPaisa;
    slip.taxWithheld = newTax;

    const existingTaxItem = slip.deductions.find((d) => d.category === 'tax');
    if (existingTaxItem) {
      existingTaxItem.amount = newTax;
    } else if (newTax > 0) {
      slip.deductions.push({
        name: 'FBR Income Tax Withholding',
        category: 'tax',
        amount: newTax
      });
    }

    // Recompute deductions & net
    slip.totalDeductions = slip.deductions.reduce((sum, item) => sum + item.amount, 0);
    slip.netPay = Math.max(0, slip.grossPay - slip.totalDeductions);
    await slip.save();

    // Recalculate parent run aggregates
    const aggregates = await Payslip.aggregate([
      { $match: { payrollRunId: run._id } },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossPay' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNet: { $sum: '$netPay' },
          totalTax: { $sum: '$taxWithheld' },
          totalOvertime: { $sum: '$overtimePay' }
        }
      }
    ]);

    if (aggregates.length > 0) {
      run.totalGrossPay = aggregates[0].totalGross;
      run.totalDeductions = aggregates[0].totalDeductions;
      run.totalNetPay = aggregates[0].totalNet;
      run.totalTaxWithheld = aggregates[0].totalTax;
      run.totalOvertimePay = aggregates[0].totalOvertime;
      await run.save();
    }

    await recordAuditLog({
      userId: actor?._id,
      actor,
      action: 'PAYSLIP_LINE_ITEM_ADJUST',
      entity: 'Payslip',
      entityId: slip._id,
      ip,
      userAgent,
      details: {
        runId,
        adjustmentType: type,
        category,
        amount: itemAmount,
        newNetPay: slip.netPay
      }
    });

    return slip;
  }

  /**
   * 9.8: Approve Payroll Run (Super Admin Only)
   */
  static async approvePayrollRun(runId, actor, ip = null, userAgent = null) {
    const { PayrollRun } = await import('../../models/payrollRun.model.js');
    const { Payslip } = await import('../../models/payslip.model.js');

    const run = await PayrollRun.findById(runId);
    if (!run) throw new ApiError(404, 'Payroll run not found');

    if (run.status !== 'review' && run.status !== 'draft') {
      throw new ApiError(409, `Cannot approve payroll run in '${run.status}' status.`);
    }

    run.status = 'approved';
    run.approvedBy = actor._id;
    run.approvedAt = new Date();
    run.isLocked = true;
    await run.save();

    // Mark all slips in run as approved
    await Payslip.updateMany({ payrollRunId: run._id }, { status: 'approved' });

    await recordAuditLog({
      userId: actor._id,
      actor,
      action: 'PAYROLL_RUN_APPROVE',
      entity: 'PayrollRun',
      entityId: run._id,
      ip,
      userAgent,
      details: {
        month: run.month,
        year: run.year,
        totalNetPay: run.totalNetPay,
        totalEmployees: run.totalEmployees
      }
    });

    return run;
  }

  /**
   * 9.8: Mark Payroll Run as Paid
   */
  static async markPayrollPaid(runId, actor, paymentData = {}, ip = null, userAgent = null) {
    const { PayrollRun } = await import('../../models/payrollRun.model.js');
    const { Payslip } = await import('../../models/payslip.model.js');

    const run = await PayrollRun.findById(runId);
    if (!run) throw new ApiError(404, 'Payroll run not found');

    if (run.status !== 'approved') {
      throw new ApiError(409, 'Only approved payroll runs can be marked as paid.');
    }

    run.status = 'paid';
    run.paidBy = actor._id;
    run.paidAt = new Date();
    if (paymentData.paymentMethod) run.paymentMethod = paymentData.paymentMethod;
    await run.save();

    // Mark all slips in run as paid
    await Payslip.updateMany({ payrollRunId: run._id }, { status: 'paid' });

    await recordAuditLog({
      userId: actor._id,
      actor,
      action: 'PAYROLL_RUN_MARK_PAID',
      entity: 'PayrollRun',
      entityId: run._id,
      ip,
      userAgent,
      details: {
        month: run.month,
        year: run.year,
        totalNetPay: run.totalNetPay,
        paidAt: run.paidAt
      }
    });

    return run;
  }

  /**
   * 9.11: Self-Service Get My Payslips
   */
  static async getMyPayslips(user, query = {}) {
    const { Payslip } = await import('../../models/payslip.model.js');
    const emp = await Employee.findOne({
      $or: [{ _id: user.employeeId }, { email: user.email }]
    });

    if (!emp) {
      throw new ApiError(404, 'Employee record not associated with this account');
    }

    const { page = 1, limit = 12 } = query;
    return await paginate(
      Payslip,
      { employeeId: emp._id, status: { $in: ['approved', 'paid'] } },
      {
        page,
        limit,
        sort: { year: -1, month: -1 },
        populate: { path: 'payrollRunId', select: 'status payDate' }
      }
    );
  }

  /**
   * 9.10: Generate Payslip PDF Buffer with Authorization Check
   */
  static async getPayslipPdf(slipId, user) {
    const { Payslip } = await import('../../models/payslip.model.js');
    const { generatePayslipPdf } = await import('./payslipPdf.service.js');

    const payslip = await Payslip.findById(slipId).populate({
      path: 'employeeId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    });

    if (!payslip) {
      throw new ApiError(404, 'Payslip not found');
    }

    // Role/Ownership Authorization:
    // HR Manager or Super Admin can view any slip. Regular Employee can only view their own slip.
    const userRoleNames = (user.roles || []).map((r) => (typeof r === 'object' ? r.name : r));
    const isHrOrAdmin = userRoleNames.some((r) => ['Super Admin', 'HR Manager'].includes(r));

    if (!isHrOrAdmin) {
      const isOwner =
        payslip.employeeId?._id?.toString() === user.employeeId?.toString() ||
        payslip.employeeId?.email === user.email;

      if (!isOwner) {
        throw new ApiError(403, 'You are not authorized to access this payslip');
      }
    }

    const pdfBuffer = await generatePayslipPdf(payslip);
    const empCode = payslip.employeeId?.employeeId || 'EMP';
    const filename = `Payslip_${payslip.year}_${payslip.month}_${empCode}.pdf`;

    return { buffer: pdfBuffer, filename };
  }

  /**
   * 9.12: Corporate Bank Advice Export
   */
  static async exportBankAdvice(runId, bankFormat) {
    const { generateBankAdviceSheet } = await import('./bankSheet.service.js');
    return await generateBankAdviceSheet(runId, bankFormat);
  }
}

