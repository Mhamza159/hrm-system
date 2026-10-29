/**
 * @file loanPolicy.js
 * @description Domain Policy Engine for Loan Limits, Borrowing Caps & Schedule Allocation (Module M10 / Slices 10.1 & 10.2).
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.2)
 * - Financial Invariant: All calculations performed in integer paisa (1 PKR = 100 paisa).
 */

import { ApiError } from '../../utils/apiError.js';
import { SalaryStructure } from '../../models/salaryStructure.model.js';
import { Employee } from '../../models/employee.model.js';
import { Loan } from '../../models/loan.model.js';

/**
 * Calculates borrowing limits and eligibility for an employee
 * @param {string|mongoose.Types.ObjectId} employeeId 
 * @returns {Promise<Object>}
 */
export async function calculateBorrowingLimits(employeeId) {
  const [employee, salaryStructure, activeLoans] = await Promise.all([
    Employee.findById(employeeId).lean(),
    SalaryStructure.findOne({ employeeId, status: 'active', isDeleted: false }).lean(),
    Loan.find({
      employeeId,
      status: {
        $in: [
          'pending_recommendation',
          'pending_hr',
          'pending_admin',
          'approved',
          'active'
        ]
      }
    }).lean()
  ]);

  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  if (employee.status === 'Terminated' || employee.status === 'Resigned') {
    throw new ApiError(400, 'Inactive or separated employees cannot apply for loans or advances');
  }

  const basicSalary = salaryStructure?.basicSalary || 0;
  const grossSalary = salaryStructure?.grossSalary || 0;

  // Policy caps: Advance up to 1x Gross Salary; Loan up to 2x Basic Salary
  const maxAdvancePaisa = grossSalary;
  const maxLoanPaisa = basicSalary * 2;

  // Active debt tracking
  const activeLoanCount = activeLoans.filter((l) => l.type === 'loan').length;
  const activeAdvanceCount = activeLoans.filter((l) => l.type === 'advance').length;
  const totalOutstandingBalance = activeLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);

  const employeeName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';
  const isProbation = employee.status === 'Probation';

  return {
    employeeId: employee._id,
    employeeName,
    employeeCode: employee.employeeCode,
    employmentStatus: employee.status,
    isProbation,
    probationCompleted: !isProbation,
    basicSalary,
    grossSalary,
    maxAdvancePaisa,
    maxLoanPaisa,
    advanceMaxPaisa: maxAdvancePaisa,
    loanMaxPaisa: maxLoanPaisa,
    activeLoanCount,
    activeAdvanceCount,
    hasActiveAdvance: activeAdvanceCount > 0,
    hasActiveLoan: activeLoanCount > 0,
    totalOutstandingBalance,
    canApplyAdvance: activeAdvanceCount === 0 && grossSalary > 0 && !isProbation,
    canApplyLoan: activeLoanCount === 0 && basicSalary > 0 && !isProbation
  };
}

/**
 * Validates a new loan request against borrowing policy
 * @param {string|mongoose.Types.ObjectId} employeeId 
 * @param {Object} loanData 
 * @returns {Promise<Object>}
 */
export async function validateLoanPolicy(employeeId, { type, amount, repaymentTenureMonths }) {
  const limits = await calculateBorrowingLimits(employeeId);

  if (limits.isProbation) {
    throw new ApiError(422, 'Employees on probation are not eligible for company loans or salary advances');
  }

  if (type === 'advance') {
    if (amount > limits.maxAdvancePaisa) {
      const maxPKR = (limits.maxAdvancePaisa / 100).toLocaleString('en-PK');
      throw new ApiError(
        422,
        `Requested advance amount exceeds your maximum borrowing policy limit of PKR ${maxPKR} (1x monthly gross salary)`
      );
    }
    if (limits.activeAdvanceCount > 0) {
      throw new ApiError(
        409,
        'You already have an active or pending salary advance. Multiple concurrent advances are not permitted.'
      );
    }
    if (repaymentTenureMonths > 3) {
      throw new ApiError(422, 'Salary advances must be repaid within 1 to 3 months');
    }
  } else {
    // Standard Loan
    if (amount > limits.maxLoanPaisa) {
      const maxPKR = (limits.maxLoanPaisa / 100).toLocaleString('en-PK');
      throw new ApiError(
        422,
        `Requested loan amount exceeds your maximum borrowing policy limit of PKR ${maxPKR} (2x monthly basic salary)`
      );
    }
    if (limits.activeLoanCount > 0) {
      throw new ApiError(
        409,
        'You already have an active or pending loan. Multiple concurrent loans are not permitted.'
      );
    }
    if (repaymentTenureMonths < 1 || repaymentTenureMonths > 24) {
      throw new ApiError(422, 'Loan repayment tenure must be between 1 and 24 months');
    }
  }

  return limits;
}

/**
 * Compiles a zero-discrepancy monthly installment amortization schedule
 * @param {number} totalAmountPaisa 
 * @param {number} tenureMonths 
 * @param {string} effectiveStartMonth Format 'YYYY-MM'
 * @returns {Array<Object>}
 */
export function compileAmortizationSchedule(totalAmountPaisa, tenureMonths, effectiveStartMonth) {
  const schedule = [];
  const baseInstallment = Math.floor(totalAmountPaisa / tenureMonths);
  const remainder = totalAmountPaisa - (baseInstallment * tenureMonths);

  let [year, month] = effectiveStartMonth.split('-').map(Number);

  for (let i = 1; i <= tenureMonths; i++) {
    // First installment absorbs any remainder paisa to ensure exact sum matching
    const installmentAmount = i === 1 ? baseInstallment + remainder : baseInstallment;
    const dueMonthStr = `${year}-${String(month).padStart(2, '0')}`;

    schedule.push({
      installmentNumber: i,
      dueMonth: dueMonthStr,
      amount: installmentAmount,
      status: 'pending',
      payslipId: null,
      paidAt: null,
      notes: ''
    });

    // Increment month
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return schedule;
}
