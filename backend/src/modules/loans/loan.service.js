/**
 * @file loan.service.js
 * @description Domain Business Logic for Loans & Salary Advances (Module M10 / Slices 10.1 to 10.6).
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Rows 10.1 to 10.6)
 * - Financial Invariant: Stored and computed in integer paisa (1 PKR = 100 paisa).
 * - Multi-tier State Machine: pending_recommendation -> pending_hr -> pending_admin -> active -> closed.
 */

import mongoose from 'mongoose';
import { Loan } from '../../models/loan.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';
import {
  validateLoanPolicy,
  calculateBorrowingLimits,
  compileAmortizationSchedule
} from './loanPolicy.js';

/**
 * Generate human-readable sequential loan ID e.g. "LN-2026-0001" or "ADV-2026-0001"
 */
async function generateLoanId(type) {
  const prefix = type === 'advance' ? 'ADV' : 'LN';
  const year = new Date().getFullYear();
  const count = await Loan.countDocuments({
    type,
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31, 23, 59, 59)
    }
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${sequence}`;
}

/**
 * Create a new loan or salary advance request (Slice 10.1 & 10.2)
 */
export async function createLoan(employeeId, loanData, actor, { ip, userAgent } = {}) {
  const { type, amount, repaymentTenureMonths, reason, effectiveStartMonth } = loanData;

  // 1. Verify borrowing caps & policy constraints (Slice 10.2)
  await validateLoanPolicy(employeeId, { type, amount, repaymentTenureMonths });

  // 2. Generate unique identifier & monthly installment
  const loanId = await generateLoanId(type);
  const monthlyInstallment = Math.round(amount / repaymentTenureMonths);

  // 3. Compile zero-discrepancy amortization schedule (Slice 10.4)
  const schedule = compileAmortizationSchedule(amount, repaymentTenureMonths, effectiveStartMonth);

  // Sanitize reason to prevent XSS / HTML injection in notifications & audit logs
  const sanitizedReason = (reason || '').replace(/<[^>]*>?/gm, '').trim();

  // 4. Persist in 'pending_recommendation' status (guarded by partial unique index)
  let loan;
  try {
    loan = await Loan.create({
      loanId,
      employeeId,
      type,
      amount,
      repaymentTenureMonths,
      monthlyInstallment,
      remainingBalance: amount,
      totalRepaid: 0,
      reason: sanitizedReason,
      status: 'pending_recommendation',
      effectiveStartMonth,
      schedule,
      repayments: []
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(
        409,
        `You already have an active or pending ${type}. Multiple concurrent requests are not permitted.`
      );
    }
    throw err;
  }

  // 5. Audit Logging
  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'LOAN_APPLY',
    entity: 'Loan',
    entityId: loan._id,
    ip,
    userAgent,
    details: {
      loanId,
      type,
      amount,
      repaymentTenureMonths,
      effectiveStartMonth
    }
  });

  // 6. Notify Department Manager if direct report exists
  const applicant = await Employee.findById(employeeId).populate('managerId');
  if (applicant?.managerId?.userId) {
    const applicantName = applicant.name || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Employee';
    await notify(applicant.managerId.userId, {
      type: 'leave', // Reuse existing channel
      title: `New ${type === 'advance' ? 'Salary Advance' : 'Loan'} Request`,
      body: `${applicantName} applied for PKR ${(amount / 100).toLocaleString('en-PK')} (${type}).`,
      link: '/loans/approvals'
    }).catch(() => {});
  }

  return loan;
}

/**
 * Query paginated loans with multi-tier CASL scope filters
 */
export async function getLoans(
  { page = 1, limit = 20, status, type, employeeId, search },
  userScope = 'all',
  actor = null
) {
  const filter = {};

  // CASL Scope Enforcement
  if (userScope === 'own') {
    if (!actor?.employeeId) {
      throw new ApiError(403, 'Your account is not linked to an employee profile');
    }
    const empId = typeof actor.employeeId === 'object' ? actor.employeeId._id : actor.employeeId;
    filter.employeeId = empId;
  } else if (userScope === 'team') {
    if (!actor?.employeeId) {
      filter.employeeId = { $in: [] };
    } else {
      const empId = typeof actor.employeeId === 'object' ? actor.employeeId._id : actor.employeeId;
      const subordinates = await Employee.find({ managerId: empId }).select('_id');
      filter.employeeId = { $in: subordinates.map((s) => s._id) };
    }
  } else if (userScope === 'department') {
    let deptId = null;
    if (actor?.employeeId) {
      if (typeof actor.employeeId === 'object' && actor.employeeId.departmentId) {
        deptId = typeof actor.employeeId.departmentId === 'object'
          ? actor.employeeId.departmentId._id
          : actor.employeeId.departmentId;
      } else {
        const emp = await Employee.findById(actor.employeeId).select('departmentId');
        deptId = emp?.departmentId;
      }
    }
    if (!deptId) {
      filter.employeeId = { $in: [] };
    } else {
      const deptEmployees = await Employee.find({ departmentId: deptId }).select('_id');
      filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }
  }

  // Explicit filters
  if (employeeId && userScope === 'all') {
    filter.employeeId = employeeId;
  }

  if (status) {
    filter.status = status;
  }

  if (type) {
    filter.type = type;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');

    const matchingEmployees = await Employee.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeCode: searchRegex }
      ]
    }).select('_id');

    filter.$or = [
      { loanId: searchRegex },
      { reason: searchRegex },
      { employeeId: { $in: matchingEmployees.map((e) => e._id) } }
    ];
  }

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  const [items, total] = await Promise.all([
    Loan.find(filter)
      .populate('employeeId', 'firstName lastName employeeCode email departmentId')
      .populate('recommendation.recommendedBy', 'name email')
      .populate('hrReview.reviewedBy', 'name email')
      .populate('adminApproval.approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Loan.countDocuments(filter)
  ]);

  return {
    items,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1
  };
}

/**
 * Get single loan details with populated audit log
 */
export async function getLoanById(id, userScope = 'all', actor = null) {
  const loan = await Loan.findById(id)
    .populate('employeeId', 'firstName lastName employeeCode email departmentId designationId managerId')
    .populate('recommendation.recommendedBy', 'name email')
    .populate('hrReview.reviewedBy', 'name email')
    .populate('adminApproval.approvedBy', 'name email')
    .populate('repayments.recordedBy', 'name email');

  if (!loan) {
    throw new ApiError(404, 'Loan record not found');
  }

  // Scope check
  if (userScope === 'own') {
    const actorEmpId = actor?.employeeId?._id || actor?.employeeId;
    if (loan.employeeId?._id?.toString() !== actorEmpId?.toString()) {
      throw new ApiError(403, 'You do not have permission to view this loan record');
    }
  } else if (userScope === 'team' || userScope === 'department') {
    const actorEmpId = actor?.employeeId?._id || actor?.employeeId;
    if (!actorEmpId) {
      throw new ApiError(403, 'Your account is not linked to an employee profile');
    }
    const actorEmp = await Employee.findById(actorEmpId).select('departmentId');
    const isDirect = loan.employeeId?.managerId?.toString() === actorEmpId.toString();
    const isDept = loan.employeeId?.departmentId?.toString() && actorEmp?.departmentId?.toString() && loan.employeeId.departmentId.toString() === actorEmp.departmentId.toString();
    if (!isDirect && !isDept) {
      throw new ApiError(403, 'You do not have permission to view loans outside your team or department');
    }
  }

  return loan;
}

/**
 * Get amortization schedule for a loan (Slice 10.4)
 */
export async function getLoanSchedule(id, userScope = 'all', actor = null) {
  const loan = await Loan.findById(id).select('employeeId loanId amount remainingBalance schedule status effectiveStartMonth');
  if (!loan) {
    throw new ApiError(404, 'Loan record not found');
  }

  // Scope check
  if (userScope === 'own') {
    const actorEmpId = actor?.employeeId?._id || actor?.employeeId;
    if (loan.employeeId.toString() !== actorEmpId?.toString()) {
      throw new ApiError(403, 'You do not have permission to view this loan schedule');
    }
  } else if (userScope === 'team' || userScope === 'department') {
    const actorEmpId = actor?.employeeId?._id || actor?.employeeId;
    if (!actorEmpId) {
      throw new ApiError(403, 'Your account is not linked to an employee profile');
    }
    const actorEmp = await Employee.findById(actorEmpId).select('departmentId');
    const applicant = await Employee.findById(loan.employeeId).select('departmentId managerId');
    const isDirect = applicant?.managerId?.toString() === actorEmpId.toString();
    const isDept = applicant?.departmentId?.toString() && actorEmp?.departmentId?.toString() && applicant.departmentId.toString() === actorEmp.departmentId.toString();
    if (!isDirect && !isDept) {
      throw new ApiError(403, 'You do not have permission to view loan schedules outside your team or department');
    }
  }

  return loan.schedule;
}

/**
 * Sequential Multi-Tier Approval Decision Engine (Slice 10.3)
 */
export async function decideLoan(id, decisionData, actor, { ip, userAgent } = {}) {
  const { decision, comments, disbursementMethod } = decisionData;
  const loan = await Loan.findById(id).populate('employeeId');

  if (!loan) {
    throw new ApiError(404, 'Loan record not found');
  }

  // Separation of duties: Applicant cannot recommend or approve their own loan
  const actorEmpId = (actor?.employeeId?._id || actor?.employeeId)?.toString();
  const applicantEmpId = (loan.employeeId?._id || loan.employeeId)?.toString();
  if (applicantEmpId && actorEmpId && applicantEmpId === actorEmpId) {
    throw new ApiError(403, 'Separation of duties: You cannot approve or recommend your own loan application');
  }

  const sanitizedComments = (comments || '').replace(/<[^>]*>?/gm, '').trim();
  const previousStatus = loan.status;
  const userRoles = Array.isArray(actor?.roles)
    ? actor.roles.map((r) => (typeof r === 'object' ? r.name : r))
    : [];
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isHR = userRoles.includes('HR Manager');

  // 1. Department Manager Recommendation Stage
  if (loan.status === 'pending_recommendation') {
    // Non-HR / non-Admin actors must belong to the applicant's department or be direct manager
    if (!isSuperAdmin && !isHR) {
      if (!actorEmpId) {
        throw new ApiError(403, 'Your account is not linked to an employee profile');
      }
      const actorEmp = await Employee.findById(actorEmpId).select('departmentId');
      const isDirect = loan.employeeId?.managerId?.toString() === actorEmpId;
      const isDept = loan.employeeId?.departmentId?.toString() && actorEmp?.departmentId?.toString() && loan.employeeId.departmentId.toString() === actorEmp.departmentId.toString();
      if (!isDirect && !isDept) {
        throw new ApiError(403, 'You can only recommend loans for employees within your department or team');
      }
    }

    if (decision === 'recommend') {
      loan.status = 'pending_hr';
      loan.recommendation = {
        recommendedBy: actor._id,
        recommendedAt: new Date(),
        decision: 'recommended',
        comments: sanitizedComments
      };
    } else if (decision === 'decline' || decision === 'reject') {
      loan.status = 'rejected';
      loan.recommendation = {
        recommendedBy: actor._id,
        recommendedAt: new Date(),
        decision: 'declined',
        comments: sanitizedComments
      };
    } else {
      throw new ApiError(400, "Invalid decision for recommendation stage. Allowed: 'recommend' or 'decline'");
    }
  }
  // 2. HR Manager Review & Verification Stage
  else if (loan.status === 'pending_hr') {
    if (!isHR && !isSuperAdmin) {
      throw new ApiError(403, 'Only HR Manager or Super Admin can review loans at this stage');
    }

    if (decision === 'forward' || decision === 'recommend') {
      loan.status = 'pending_admin';
      loan.hrReview = {
        reviewedBy: actor._id,
        reviewedAt: new Date(),
        decision: 'forwarded',
        comments: sanitizedComments
      };
    } else if (decision === 'reject') {
      loan.status = 'rejected';
      loan.hrReview = {
        reviewedBy: actor._id,
        reviewedAt: new Date(),
        decision: 'rejected',
        comments: sanitizedComments
      };
    } else {
      throw new ApiError(400, "Invalid decision for HR stage. Allowed: 'forward' or 'reject'");
    }
  }
  // 3. Super Admin Final Approval & Disbursement Stage
  else if (loan.status === 'pending_admin') {
    if (!isSuperAdmin) {
      throw new ApiError(403, 'Only Super Admin holds final disbursement authorization');
    }

    if (decision === 'approve') {
      loan.status = 'active'; // Approved and active for monthly payroll recovery
      loan.adminApproval = {
        approvedBy: actor._id,
        approvedAt: new Date(),
        decision: 'approved',
        disbursementMethod: disbursementMethod || 'bank_transfer',
        comments: sanitizedComments
      };
    } else if (decision === 'reject') {
      loan.status = 'rejected';
      loan.adminApproval = {
        approvedBy: actor._id,
        approvedAt: new Date(),
        decision: 'rejected',
        disbursementMethod: null,
        comments: sanitizedComments
      };
    } else {
      throw new ApiError(400, "Invalid decision for final stage. Allowed: 'approve' or 'reject'");
    }
  } else {
    throw new ApiError(400, `Loan cannot be decided in current status '${loan.status}'`);
  }

  await loan.save();

  // Audit log
  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'LOAN_DECISION',
    entity: 'Loan',
    entityId: loan._id,
    ip,
    userAgent,
    details: {
      loanId: loan.loanId,
      previousStatus,
      newStatus: loan.status,
      decision,
      comments: sanitizedComments
    }
  });

  // Notify applicant
  const applicantUser = await User.findOne({ employeeId: loan.employeeId._id });
  if (applicantUser) {
    await notify(applicantUser._id, {
      type: 'leave',
      title: `Loan Request ${loan.status.toUpperCase()}`,
      body: `Your request for ${loan.loanId} status is now '${loan.status}'. Notes: ${sanitizedComments}`,
      link: '/loans'
    }).catch(() => {});
  }

  return loan;
}

/**
 * Early Lump-Sum Prepayment & Settlement (Slice 10.6)
 */
export async function prepayLoan(id, prepaymentData, actor, { ip, userAgent } = {}) {
  const { amount, paymentMethod, reference } = prepaymentData;
  const loan = await Loan.findById(id);

  if (!loan) {
    throw new ApiError(404, 'Loan record not found');
  }

  if (loan.status !== 'active') {
    throw new ApiError(400, `Cannot record prepayment on a loan with status '${loan.status}'`);
  }

  const sanitizedReference = (reference || '').replace(/<[^>]*>?/gm, '').trim();

  if (amount > loan.remainingBalance) {
    const maxPKR = (loan.remainingBalance / 100).toLocaleString('en-PK');
    throw new ApiError(
      422,
      `Prepayment amount exceeds total outstanding balance of PKR ${maxPKR}`
    );
  }

  // Atomic Update
  loan.remainingBalance -= amount;
  loan.totalRepaid += amount;

  loan.repayments.push({
    amount,
    paymentMethod,
    reference: sanitizedReference,
    paidAt: new Date(),
    recordedBy: actor._id
  });

  // If full payment, mark all pending installments as prepaid and close loan
  if (loan.remainingBalance === 0) {
    loan.status = 'closed';
    for (const inst of loan.schedule) {
      if (inst.status === 'pending') {
        inst.status = 'prepaid';
        inst.paidAt = new Date();
        inst.notes = `Prepaid early via ${paymentMethod} (Ref: ${sanitizedReference})`;
      }
    }
  } else {
    // Partial payment: reduce pending installments proportionally or from the tail
    let amountToOffset = amount;
    for (let i = loan.schedule.length - 1; i >= 0 && amountToOffset > 0; i--) {
      const inst = loan.schedule[i];
      if (inst.status === 'pending') {
        if (amountToOffset >= inst.amount) {
          amountToOffset -= inst.amount;
          inst.status = 'prepaid';
          inst.paidAt = new Date();
          inst.notes = `Prepaid early (Ref: ${sanitizedReference})`;
        } else {
          inst.amount -= amountToOffset;
          inst.notes = `Reduced by PKR ${(amountToOffset / 100).toFixed(2)} via prepayment`;
          amountToOffset = 0;
        }
      }
    }
  }

  await loan.save();

  // Audit log
  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'LOAN_PREPAYMENT',
    entity: 'Loan',
    entityId: loan._id,
    ip,
    userAgent,
    details: {
      loanId: loan.loanId,
      amount,
      paymentMethod,
      reference: sanitizedReference,
      newRemainingBalance: loan.remainingBalance,
      isClosed: loan.status === 'closed'
    }
  });

  return loan;
}

/**
 * Organization-wide Ledger Summary & KPI Analytics (Slice 10.6)
 */
export async function getLedgerSummary() {
  const [aggregates] = await Loan.aggregate([
    {
      $group: {
        _id: null,
        totalDisbursed: {
          $sum: {
            $cond: [{ $in: ['$status', ['active', 'closed']] }, '$amount', 0]
          }
        },
        totalOutstanding: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, '$remainingBalance', 0]
          }
        },
        totalRecovered: {
          $sum: '$totalRepaid'
        },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        pendingCount: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$status',
                  ['pending_recommendation', 'pending_hr', 'pending_admin']
                ]
              },
              1,
              0
            ]
          }
        },
        closedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        }
      }
    }
  ]);

  const data = aggregates || {
    totalDisbursed: 0,
    totalOutstanding: 0,
    totalRecovered: 0,
    activeCount: 0,
    pendingCount: 0,
    closedCount: 0
  };

  return {
    ...data,
    totalDisbursedPaisa: data.totalDisbursed,
    totalOutstandingPaisa: data.totalOutstanding,
    totalRepaidPaisa: data.totalRecovered,
    activeAccountsCount: data.activeCount,
    totalLoansCount: (data.activeCount || 0) + (data.closedCount || 0) + (data.pendingCount || 0)
  };
}
