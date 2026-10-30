/**
 * @file payrollProcessor.js
 * @description Batch Payroll Calculation Engine for Active Employees.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.3, 9.4, 9.7)
 * - Layer: Processor (Async worker calculation engine)
 * - Precondition: Attendance MonthLock MUST be active for the target cycle.
 * - Integrations:
 *   - M5 Attendance: Overtime hours & late arrival penalties.
 *   - M6 Leaves: Unpaid leave days & approved leave encashments.
 *   - M2 Settings: FBR tax slabs, EOBI, PESSI, Provident Fund.
 * - Real-Time: Emits 'payroll:progress' and 'payroll:completed' over Socket.io.
 */

import { PayrollRun } from '../../models/payrollRun.model.js';
import { Payslip } from '../../models/payslip.model.js';
import { SalaryStructure } from '../../models/salaryStructure.model.js';
import { Employee } from '../../models/employee.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { Leave } from '../../models/leave.model.js';
import { LeaveEncashment } from '../../models/leaveEncashment.model.js';
import { MonthLock } from '../../models/monthLock.model.js';
import { Loan } from '../../models/loan.model.js';
import { Expense } from '../../models/expense.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { calculateAnnualIncomeTax } from './taxCalculator.js';
import { calculateStatutoryContributions } from './contributionsCalculator.js';
import { emitToCompany } from '../../services/socket.service.js';

/**
 * Executes a full batch payroll run calculation for a specified calendar month.
 * 
 * @param {Object} params
 * @param {number} params.month - Cycle month (1 - 12)
 * @param {number} params.year - Cycle year (e.g. 2026)
 * @param {Object} params.actor - User initiating the run
 * @returns {Promise<PayrollRun>} The generated PayrollRun document in 'review' status
 */
export async function executeBatchPayrollCalculation({ month, year, actor }) {
  const padMonth = String(month).padStart(2, '0');
  const yearMonth = `${year}-${padMonth}`;

  // 1. Precondition Check: Attendance Month MUST be locked
  const lock = await MonthLock.findOne({ yearMonth, isLocked: true });
  if (!lock) {
    throw new ApiError(
      422,
      `Attendance for ${yearMonth} must be locked before payroll generation (BUILD-GUIDE Row 5.14).`
    );
  }

  // 2. Prevent duplicate active payroll runs
  const existingRun = await PayrollRun.findOne({ month, year });
  if (existingRun && existingRun.status !== 'draft' && existingRun.status !== 'cancelled') {
    throw new ApiError(
      409,
      `Payroll run for ${yearMonth} already exists in status '${existingRun.status}'.`
    );
  }

  // Define cycle start and end dates (normalized to UTC)
  const cycleStartDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const cycleEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const daysInMonth = new Date(year, month, 0).getDate();
  const payDate = new Date(Date.UTC(year, month - 1, Math.min(daysInMonth, 30)));

  // Clean up any stale draft slips if re-running
  if (existingRun) {
    await Payslip.deleteMany({ payrollRunId: existingRun._id });
    await existingRun.deleteOne();
  }

  // Initialize new PayrollRun in 'draft' status
  const payrollRun = await PayrollRun.create({
    month,
    year,
    cycleStartDate,
    cycleEndDate,
    payDate,
    status: 'draft',
    generatedBy: actor._id
  });

  // 3. Query all active employees with active salary structures
  const activeStructures = await SalaryStructure.find({
    status: 'active',
    isDeleted: false
  }).populate('employeeId');

  // Filter to employees who are active or on notice
  const eligibleStructures = activeStructures.filter(
    (s) => s.employeeId && !s.employeeId.isDeleted && s.employeeId.status !== 'Terminated' && s.employeeId.status !== 'Resigned'
  );

  const totalEmployees = eligibleStructures.length;
  let completed = 0;

  // Aggregate run totals (in integer paisa)
  let totalGrossPay = 0;
  let totalDeductions = 0;
  let totalNetPay = 0;
  let totalTaxWithheld = 0;
  let totalEobiEmployer = 0;
  let totalEobiEmployee = 0;
  let totalOvertimePay = 0;
  const bankDistribution = {};

  // 4. Batch calculation loop
  for (const structure of eligibleStructures) {
    const emp = structure.employeeId;

    // --- A. Base Earnings from Salary Structure ---
    const basicSalary = structure.basicSalary;
    const houseRent = structure.houseRentAllowance || 0;
    const medical = structure.medicalAllowance || 0;
    const conveyance = structure.conveyanceAllowance || 0;
    const otherAllowances = structure.otherAllowances || 0;

    const earnings = [
      { name: 'Basic Salary', category: 'basic', amount: basicSalary, description: 'Base contractual pay' }
    ];
    if (houseRent > 0) earnings.push({ name: 'House Rent Allowance', category: 'house_rent', amount: houseRent });
    if (medical > 0) earnings.push({ name: 'Medical Allowance', category: 'medical', amount: medical });
    if (conveyance > 0) earnings.push({ name: 'Conveyance Allowance', category: 'conveyance', amount: conveyance });
    if (otherAllowances > 0) earnings.push({ name: 'Other Allowances', category: 'allowance', amount: otherAllowances });

    // --- B. M5 Attendance: Overtime Calculation ---
    const attendanceRecords = await Attendance.find({
      employeeId: emp._id,
      date: { $gte: cycleStartDate, $lte: cycleEndDate }
    });

    let totalApprovedOtMinutes = 0;
    let lateCount = 0;

    for (const att of attendanceRecords) {
      if (att.overtimeApproved && att.overtimeMinutes > 0) {
        totalApprovedOtMinutes += att.overtimeMinutes;
      }
      if (att.status === 'late') {
        lateCount += 1;
      }
    }

    const overtimeHours = Number((totalApprovedOtMinutes / 60).toFixed(2));
    // Standard Pakistan Overtime Formula: (Basic Salary / 30 / 8) * 1.5 * Overtime Hours
    let overtimePay = 0;
    if (overtimeHours > 0) {
      overtimePay = Math.round(((basicSalary / 30) / 8) * 1.5 * overtimeHours);
      earnings.push({
        name: `Overtime Pay (${overtimeHours} hrs)`,
        category: 'overtime',
        amount: overtimePay,
        description: `Approved overtime of ${overtimeHours} hours at 1.5x basic rate`
      });
    }

    // --- C. M6 Leaves: Approved Encashments ---
    const encashments = await LeaveEncashment.find({
      employeeId: emp._id,
      status: 'approved',
      payrollRunId: null
    });

    for (const enc of encashments) {
      earnings.push({
        name: `Leave Encashment (${enc.days} days)`,
        category: 'encashment',
        amount: enc.totalAmountPaisa,
        description: `Encashment of ${enc.days} annual leave days`
      });
      // Link encashment to this payroll run
      enc.payrollRunId = payrollRun._id;
      enc.status = 'processed';
      await enc.save();
    }

    // Compute Gross Pay for the month
    const grossPay = earnings.reduce((acc, curr) => acc + curr.amount, 0);

    // --- D. M6 Leaves: Unpaid Leave Absences ---
    const leaves = await Leave.find({
      employeeId: emp._id,
      status: 'approved',
      startDate: { $lte: cycleEndDate },
      endDate: { $gte: cycleStartDate }
    }).populate('leaveTypeId');

    let unpaidDays = 0;
    for (const lv of leaves) {
      if (lv.leaveTypeId && !lv.leaveTypeId.isPaid) {
        unpaidDays += lv.days || 0;
      }
    }

    const deductions = [];

    let unpaidLeaveDeduction = 0;
    if (unpaidDays > 0) {
      unpaidLeaveDeduction = Math.round((structure.grossSalary / 30) * unpaidDays);
      deductions.push({
        name: `Unpaid Leave (${unpaidDays} days)`,
        category: 'unpaid_leave',
        amount: unpaidLeaveDeduction,
        description: `Deduction for ${unpaidDays} days of approved unpaid absence`
      });
    }

    // Late penalty: 1 day salary deduction for every 3 late arrivals
    let lateDeductionDays = Math.floor(lateCount / 3);
    let lateDeductionPaisa = 0;
    if (lateDeductionDays > 0) {
      lateDeductionPaisa = Math.round((structure.grossSalary / 30) * lateDeductionDays);
      deductions.push({
        name: `Late Arrival Penalty (${lateCount} lates)`,
        category: 'late_penalty',
        amount: lateDeductionPaisa,
        description: `${lateDeductionDays} day deduction for ${lateCount} late punches`
      });
    }

    // --- E. Pakistan Statutory Withholding (FBR Tax, EOBI, PESSI, PF) ---
    const taxableMonthlyGross = Math.max(0, grossPay - unpaidLeaveDeduction);
    const taxResult = await calculateAnnualIncomeTax(taxableMonthlyGross);
    const taxWithheld = taxResult.monthlyTaxPaisa;

    if (taxWithheld > 0) {
      deductions.push({
        name: 'FBR Income Tax Withholding',
        category: 'tax',
        amount: taxWithheld,
        description: `Progressive salaried tax (${taxResult.effectiveRatePercent}%)`
      });
    }

    const statutory = await calculateStatutoryContributions({
      basicSalaryPaisa: basicSalary,
      grossSalaryPaisa: grossPay,
      eobiEnabled: structure.eobiEnabled,
      pessiEnabled: structure.pessiEnabled,
      pfEnabled: structure.providentFundEnabled,
      pfRate: structure.providentFundRate
    });

    if (statutory.eobi.employee > 0) {
      deductions.push({
        name: 'EOBI Contribution (Employee)',
        category: 'eobi',
        amount: statutory.eobi.employee,
        description: '1% of statutory minimum wage'
      });
    }

    if (statutory.providentFund.employee > 0) {
      deductions.push({
        name: 'Provident Fund (Employee)',
        category: 'provident_fund',
        amount: statutory.providentFund.employee,
        description: `Employee contribution (${structure.providentFundRate || 8.33}%)`
      });
    }

    // --- G. M11 Expense Claims: Approved Expense Reimbursements via Payroll (Slice 11.4) ---
    const approvedExpenses = await Expense.find({
      employeeId: emp._id,
      status: 'approved',
      'reimbursement.method': 'payroll'
    });

    let expenseReimbursementTotal = 0;
    for (const exp of approvedExpenses) {
      const payableAmount = exp.approvedAmount || exp.amount;
      if (payableAmount > 0) {
        earnings.push({
          name: `Expense Reimbursement (${exp.claimNumber})`,
          amount: payableAmount,
          isTaxable: false
        });
        expenseReimbursementTotal += payableAmount;
      }
    }
    grossPay += expenseReimbursementTotal;

    // --- F. M10 Loans & Salary Advances: Active Monthly Installment Deductions (Slice 10.5) ---
    const activeLoans = await Loan.find({
      employeeId: emp._id,
      status: 'active',
      'schedule.dueMonth': yearMonth,
      'schedule.status': 'pending'
    });

    for (const loan of activeLoans) {
      const scheduledInst = loan.schedule.find(
        (inst) => inst.dueMonth === yearMonth && inst.status === 'pending'
      );
      if (scheduledInst && scheduledInst.amount > 0) {
        const isAdvance = loan.type === 'advance';
        const deductionAmount = Math.min(scheduledInst.amount, loan.remainingBalance);
        if (deductionAmount > 0) {
          deductions.push({
            name: isAdvance
              ? `Salary Advance Recovery (${loan.loanId})`
              : `Loan Installment (${loan.loanId})`,
            category: isAdvance ? 'advance' : 'loan_installment',
            amount: deductionAmount,
            description: `${isAdvance ? 'Advance recovery' : 'Installment'} ${scheduledInst.installmentNumber} of ${loan.repaymentTenureMonths} for ${loan.loanId}`
          });
        }
      }
    }

    // Compute Net Pay
    const slipDeductions = deductions.reduce((acc, curr) => acc + curr.amount, 0);
    const netPay = Math.max(0, grossPay - slipDeductions);

    // Save individual Payslip
    await Payslip.create({
      payrollRunId: payrollRun._id,
      employeeId: emp._id,
      month,
      year,
      earnings,
      deductions,
      grossPay,
      totalDeductions: slipDeductions,
      netPay,
      taxWithheld,
      eobiEmployee: statutory.eobi.employee,
      eobiEmployer: statutory.eobi.employer,
      pessiAmount: statutory.pessi.employer,
      providentFundEmployee: statutory.providentFund.employee,
      providentFundEmployer: statutory.providentFund.employer,
      overtimeHours,
      overtimePay,
      lateDeductionDays,
      unpaidLeaveDays: unpaidDays,
      bankName: emp.bankDetails?.bankName || 'Meezan Bank',
      accountTitle: emp.bankDetails?.accountTitle || emp.name,
      accountNumber: emp.bankDetails?.accountNumber || '',
      iban: emp.bankDetails?.iban || '',
      status: 'draft'
    });

    // Accumulate Run Totals
    totalGrossPay += grossPay;
    totalDeductions += slipDeductions;
    totalNetPay += netPay;
    totalTaxWithheld += taxWithheld;
    totalEobiEmployer += statutory.eobi.employer;
    totalEobiEmployee += statutory.eobi.employee;
    totalOvertimePay += overtimePay;

    const bName = emp.bankDetails?.bankName || 'Meezan Bank';
    bankDistribution[bName] = bankDistribution[bName] || { count: 0, totalAmount: 0 };
    bankDistribution[bName].count += 1;
    bankDistribution[bName].totalAmount += netPay;

    completed += 1;
    const percentage = totalEmployees > 0 ? Math.round((completed / totalEmployees) * 100) : 100;

    // Emit live progress via Socket.io
    emitToCompany('payroll:progress', {
      runId: payrollRun._id,
      completed,
      total: totalEmployees,
      percentage
    });
  }

  // 5. Finalize PayrollRun with totals and transition status to 'review'
  const bankSummary = Object.entries(bankDistribution).map(([bankName, stats]) => ({
    bankName,
    count: stats.count,
    totalAmount: stats.totalAmount
  }));

  payrollRun.totalEmployees = completed;
  payrollRun.totalGrossPay = totalGrossPay;
  payrollRun.totalDeductions = totalDeductions;
  payrollRun.totalNetPay = totalNetPay;
  payrollRun.totalTaxWithheld = totalTaxWithheld;
  payrollRun.totalEobiEmployer = totalEobiEmployer;
  payrollRun.totalEobiEmployee = totalEobiEmployee;
  payrollRun.totalOvertimePay = totalOvertimePay;
  payrollRun.bankSummary = bankSummary;
  payrollRun.status = 'review';
  await payrollRun.save();

  // Emit completion event
  emitToCompany('payroll:completed', {
    runId: payrollRun._id,
    totalEmployees: completed
  });

  return payrollRun;
}
