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
import { PayrollRun } from '../../models/payrollRun.model.js';
import { Payslip } from '../../models/payslip.model.js';
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
  static async getEmployeeSalaryStructure(employeeId, user = null) {
    const employee = await Employee.findById(employeeId).populate([
      { path: 'departmentId', select: 'name' },
      { path: 'designationId', select: 'title' }
    ]);
    if (!employee || employee.isDeleted) {
      throw new ApiError(404, 'Employee not found');
    }

    // Role / Ownership Authorization Check (BUG-01 Fix)
    // Super Admin & HR Manager can view any salary structure; Employees can only view their own
    if (user) {
      const userRoleNames = (user.roles || []).map((r) => (typeof r === 'object' ? r.name : r));
      const isHrOrAdmin = userRoleNames.some((r) => ['Super Admin', 'HR Manager'].includes(r));
      if (!isHrOrAdmin) {
        const isOwner =
          employee._id.toString() === user.employeeId?.toString() ||
          employee.email === user.email ||
          employee.userId?.toString() === user._id?.toString();
        if (!isOwner) {
          throw new ApiError(403, 'You are not authorized to access this salary structure');
        }
      }
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

    // Multi-Channel Notification: Alert employees of disbursed payslips (BUILD-GUIDE Row 9.11)
    try {
      const { notify } = await import('../../services/notify.service.js');
      const paidSlips = await Payslip.find({ payrollRunId: run._id }).populate({
        path: 'employeeId',
        select: 'userId email name'
      });

      const recipientUserIds = paidSlips
        .map((s) => s.employeeId?.userId)
        .filter(Boolean);

      if (recipientUserIds.length > 0) {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[(run.month || 1) - 1];

        await notify(recipientUserIds, {
          type: 'payroll',
          title: `Salary Disbursed for ${monthName} ${run.year}`,
          body: `Your salary slip for ${monthName} ${run.year} is now available in your portal.`,
          link: '/payroll/my-payslips',
          metadata: { runId: run._id, month: run.month, year: run.year },
          channels: ['inApp', 'email']
        });
      }
    } catch (notifErr) {
      console.warn(`[payroll.service] Non-fatal notification failure on markPayrollPaid: ${notifErr.message}`);
    }

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

  /**
   * 9.13: Employee Final Exit Settlement Calculation & Clearance
   */
  static async processFinalSettlement(employeeId, body, actor) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const { SalaryStructure } = await import('../../models/salaryStructure.model.js');
    const { calculateGratuityPaisa } = await import('./contributionsCalculator.js');

    const salaryStructure = await SalaryStructure.findOne({
      employeeId: employee._id,
      status: 'active'
    });

    if (!salaryStructure) {
      throw new ApiError(400, 'Employee does not have an active salary structure assigned');
    }

    const exitDate = body.exitDate ? new Date(body.exitDate) : new Date();
    const joiningDate = employee.joiningDate || employee.dateOfJoining || new Date('2023-01-01');

    // Calculate completed service years
    const diffMs = exitDate - joiningDate;
    const completedYears = Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));

    const basicSalary = salaryStructure.basicSalary || salaryStructure.baseSalary || 0;
    const payableDays = Math.min(30, Math.max(0, Number(body.payableDays || 0)));
    const encashableDays = Math.max(0, Number(body.encashableLeaveDays || 0));

    const proRatedSalary = Math.round((basicSalary / 30) * payableDays);
    const leaveEncashment = Math.round((basicSalary / 30) * encashableDays);
    const gratuity = calculateGratuityPaisa(basicSalary, completedYears);

    const grossSettlement = proRatedSalary + leaveEncashment + gratuity;

    const loanDeduction = Math.round(Number(body.loanDeductionPaisa || (Number(body.loanDeduction || 0) * 100)));
    const advanceDeduction = Math.round(Number(body.advanceDeductionPaisa || (Number(body.advanceDeduction || 0) * 100)));
    const totalDeductions = loanDeduction + advanceDeduction;

    const netSettlement = Math.max(0, grossSettlement - totalDeductions);

    // Update Employee status if requested
    if (body.updateStatus !== false) {
      employee.status = body.separationType === 'Terminated' ? 'Terminated' : 'Resigned';
      employee.statusReason = body.reason || 'Final settlement processed and cleared';
      await employee.save();
    }

    // Multi-Channel Notification: Alert employee of final exit settlement clearance
    try {
      const { notify } = await import('../../services/notify.service.js');
      if (employee.userId) {
        await notify(employee.userId, {
          type: 'payroll',
          title: 'Exit Settlement Processed & Cleared',
          body: `Your final settlement and service gratuity calculation has been finalized. Net settlement: PKR ${(netSettlement / 100).toLocaleString('en-PK')}.`,
          link: '/payroll/my-payslips',
          metadata: { employeeId: employee._id },
          channels: ['inApp', 'email']
        });
      }
    } catch (notifErr) {
      console.warn(`[payroll.service] Non-fatal notification failure on final settlement: ${notifErr.message}`);
    }

    const settlementData = {
      lastBasicSalaryPaisa: basicSalary,
      gratuityYears: completedYears,
      payableDays,
      proRatedSalaryPaisa: proRatedSalary,
      encashableDays,
      leaveEncashmentPaisa: leaveEncashment,
      gratuityPaisa: gratuity,
      grossSettlementPaisa: grossSettlement,
      loanDeductionPaisa: loanDeduction,
      advanceDeductionPaisa: advanceDeduction,
      totalDeductionsPaisa: totalDeductions,
      netSettlementPaisa: netSettlement
    };

    return {
      employee: {
        _id: employee._id,
        name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        employeeCode: employee.employeeCode || employee.employeeId,
        joiningDate,
        exitDate,
        completedYears,
        status: employee.status
      },
      settlement: settlementData,
      ...settlementData
    };
  }

  /**
   * 9.14: Form IT-3 Annual Tax Withholding Certificate
   */
  static async getAnnualTaxCertificatePdf(employeeId, taxYear, user) {
    const employee = await Employee.findById(employeeId).populate([
      { path: 'departmentId', select: 'name' },
      { path: 'designationId', select: 'title' }
    ]);

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Authorization
    const userRoleNames = (user.roles || []).map((r) => (typeof r === 'object' ? r.name : r));
    const isHrOrAdmin = userRoleNames.some((r) => ['Super Admin', 'HR Manager'].includes(r));
    if (!isHrOrAdmin) {
      const isOwner = employee._id.toString() === user.employeeId?.toString() || employee.email === user.email;
      if (!isOwner) {
        throw new ApiError(403, 'You are not authorized to access this tax certificate');
      }
    }

    const { Payslip } = await import('../../models/payslip.model.js');
    const { generateAnnualTaxCertificate } = await import('./payslipPdf.service.js');

    const year = Number(taxYear) || new Date().getFullYear();
    // Fiscal Tax Year: July 1 (year - 1) to June 30 (year)
    const paidSlips = await Payslip.find({
      employeeId: employee._id,
      status: 'paid',
      $or: [
        { year: year - 1, month: { $gte: 7 } },
        { year: year, month: { $lte: 6 } }
      ]
    }).sort({ year: 1, month: 1 });

    const pdfBuffer = await generateAnnualTaxCertificate(employee, year, paidSlips);
    const empCode = employee.employeeCode || employee.employeeId || 'EMP';
    const filename = `Form_IT3_${empCode}_TY${year}.pdf`;

    return { buffer: pdfBuffer, filename };
  }

  /**
   * 9.15: Statutory Tax Compliance Report
   */
  static async getTaxComplianceReport(query = {}) {
    const { Payslip } = await import('../../models/payslip.model.js');
    const taxYear = Number(query.taxYear) || new Date().getFullYear();

    const slips = await Payslip.find({
      status: 'paid',
      $or: [
        { year: taxYear - 1, month: { $gte: 7 } },
        { year: taxYear, month: { $lte: 6 } }
      ]
    });

    let totalTaxWithheld = 0;
    let totalGross = 0;
    const monthlyMap = {};

    slips.forEach((s) => {
      const tax = s.taxWithheld || s.incomeTax || 0;
      totalTaxWithheld += tax;
      totalGross += s.grossPay || 0;

      const key = `${s.year}-${String(s.month).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: s.month, year: s.year, grossPaisa: 0, taxPaisa: 0, slipCount: 0 };
      }
      monthlyMap[key].grossPaisa += s.grossPay || 0;
      monthlyMap[key].taxPaisa += tax;
      monthlyMap[key].slipCount += 1;
    });

    return {
      taxYear,
      totalTaxWithheldPaisa: totalTaxWithheld,
      totalGrossPaisa: totalGross,
      totalSlips: slips.length,
      monthlyBreakdown: Object.values(monthlyMap).sort((a, b) => a.year - b.year || a.month - b.month)
    };
  }

  /**
   * 9.15: EOBI Compliance Report
   */
  static async getEobiComplianceReport(query = {}) {
    const { Payslip } = await import('../../models/payslip.model.js');
    const year = Number(query.year) || new Date().getFullYear();

    const slips = await Payslip.find({
      year,
      status: 'paid'
    });

    let totalEmployeeEobi = 0;
    let totalEmployerEobi = 0;
    const monthlyMap = {};

    slips.forEach((s) => {
      const eeEobi = s.eobiEmployee || 0;
      const erEobi = eeEobi * 5; // 1% EE, 5% ER

      totalEmployeeEobi += eeEobi;
      totalEmployerEobi += erEobi;

      const mKey = s.month;
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = { month: s.month, year, employeeEobiPaisa: 0, employerEobiPaisa: 0, count: 0 };
      }
      monthlyMap[mKey].employeeEobiPaisa += eeEobi;
      monthlyMap[mKey].employerEobiPaisa += erEobi;
      monthlyMap[mKey].count += 1;
    });

    return {
      year,
      totalEmployeeEobiPaisa: totalEmployeeEobi,
      totalEmployerEobiPaisa: totalEmployerEobi,
      totalCombinedPaisa: totalEmployeeEobi + totalEmployerEobi,
      monthlyBreakdown: Object.values(monthlyMap).sort((a, b) => a.month - b.month)
    };
  }

  /**
   * 9.16: Department Manager Team Overtime Guard
   * Strictly returns overtime hours & attendance metrics. Basic/Gross/Net pay are intentionally omitted to prevent leakage.
   */
  static async getTeamOvertimeHours(managerUser, query = {}) {
    const month = Number(query.month) || new Date().getMonth() + 1;
    const year = Number(query.year) || new Date().getFullYear();

    const managerEmployee = await Employee.findOne({
      $or: [{ _id: managerUser.employeeId }, { email: managerUser.email }]
    });

    let teamEmployees = [];
    if (managerEmployee) {
      teamEmployees = await Employee.find({
        $or: [
          { managerId: managerEmployee._id },
          { departmentId: managerEmployee.departmentId }
        ],
        status: { $in: ['Active', 'Probation'] }
      }).select('_id employeeCode name designationId departmentId');
    }

    const { Payslip } = await import('../../models/payslip.model.js');
    const empIds = teamEmployees.map((e) => e._id);

    const slips = await Payslip.find({
      month,
      year,
      employeeId: { $in: empIds }
    }).select('employeeId overtimeHours attendanceSummary status');

    const result = teamEmployees.map((emp) => {
      const slip = slips.find((s) => s.employeeId.toString() === emp._id.toString());
      return {
        employeeId: emp._id,
        name: emp.name,
        employeeCode: emp.employeeCode,
        overtimeHours: slip?.overtimeHours || slip?.attendanceSummary?.overtimeHours || 0,
        workingDays: slip?.attendanceSummary?.workingDays || 30,
        presentDays: slip?.attendanceSummary?.presentDays || 0,
        unpaidLeaves: slip?.attendanceSummary?.unpaidLeaves || 0,
        slipStatus: slip?.status || 'unprocessed'
      };
    });

    return { month, year, count: result.length, team: result };
  }

  /**
   * 9.17: Departmental Payroll Cost Analytics
   */
  static async getDepartmentPayrollCostAnalytics(query = {}) {
    const { Payslip } = await import('../../models/payslip.model.js');
    const year = Number(query.year) || new Date().getFullYear();

    const analytics = await Payslip.aggregate([
      {
        $match: {
          year,
          status: { $in: ['approved', 'paid'] }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $lookup: {
          from: 'departments',
          localField: 'employee.departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$department._id',
          departmentName: { $first: { $ifNull: ['$department.name', 'General'] } },
          totalGrossPay: { $sum: '$grossPay' },
          totalNetPay: { $sum: '$netPay' },
          totalIncomeTax: { $sum: '$taxWithheld' },
          totalEobi: { $sum: '$eobiEmployee' },
          totalOvertimePay: { $sum: '$overtimePay' },
          headcount: { $addToSet: '$employeeId' }
        }
      },
      {
        $project: {
          _id: 1,
          departmentName: 1,
          totalGrossPaisa: '$totalGrossPay',
          totalNetPaisa: '$totalNetPay',
          totalIncomeTaxPaisa: '$totalIncomeTax',
          totalEobiPaisa: '$totalEobi',
          totalOvertimePayPaisa: '$totalOvertimePay',
          employeeCount: { $size: '$headcount' }
        }
      },
      { $sort: { totalGrossPaisa: -1 } }
    ]);

    return analytics;
  }

  /**
   * X1.2: Immutability lock - Delete or soft delete payroll run
   */
  static async deletePayrollRun(runId, actor) {
    const run = await PayrollRun.findById(runId);
    if (!run || run.isDeleted) {
      throw new ApiError(404, 'Payroll run not found');
    }

    // Strict Security Invariant: Finalized payroll runs (approved or paid) can NEVER be deleted
    if (['approved', 'paid'].includes(run.status) || run.isLocked) {
      throw new ApiError(400, 'Cannot delete an approved, paid, or locked payroll run.');
    }

    run.isDeleted = true;
    run.deletedAt = new Date();
    run.deletedBy = actor?._id || null;
    await run.save();

    await Payslip.updateMany(
      { payrollRunId: run._id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    // Revert associated leave encashments back to approved & unlinked status (BUG-03 Fix)
    const { LeaveEncashment } = await import('../../models/leaveEncashment.model.js');
    await LeaveEncashment.updateMany(
      { payrollRunId: run._id },
      { $set: { status: 'approved', payrollRunId: null } }
    );

    await recordAuditLog({
      userId: actor?._id,
      actor,
      action: 'PAYROLL_RUN_DELETED',
      entity: 'PayrollRun',
      entityId: run._id,
      before: { status: run.status, month: run.month, year: run.year },
      after: { isDeleted: true }
    });

    return { message: 'Payroll run deleted successfully' };
  }
}


