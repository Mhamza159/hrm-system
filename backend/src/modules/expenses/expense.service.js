/**
 * @file expense.service.js
 * @description Core Domain Service for Expense Categories, Claims, Multi-Tier Approvals & Reimbursements.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Rows 11.1 to 11.5)
 * - Financial Invariant: All calculations performed in integer paisa (1 PKR = 100 paisa).
 * - Receipt Invariant: Claims without valid receipt proof are rejected.
 */

import fs from 'fs';
import path from 'path';
import { ExpenseCategory } from '../../models/expenseCategory.model.js';
import { Expense } from '../../models/expense.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../../config/cloudinary.js';

// Default managerial approval threshold: PKR 15,000 (1,500,000 paisa)
export const DEFAULT_MANAGER_APPROVAL_LIMIT_PAISA = 1500000;

// ============================================================================
// 1. Expense Categories Management (BUILD-GUIDE Row 11.1)
// ============================================================================

export async function createCategory(data, actor) {
  const existing = await ExpenseCategory.findOne({
    code: data.code.toUpperCase(),
    isDeleted: false
  });

  if (existing) {
    throw new ApiError(409, `An expense category with code '${data.code.toUpperCase()}' already exists.`);
  }

  const category = await ExpenseCategory.create({
    name: data.name,
    code: data.code.toUpperCase(),
    description: data.description || '',
    maxLimitPaisa: data.maxLimitPaisa || 0,
    requiresReceipt: data.requiresReceipt !== undefined ? data.requiresReceipt : true,
    isActive: data.isActive !== undefined ? data.isActive : true
  });

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'EXPENSE_CATEGORY_CREATE',
    entity: 'ExpenseCategory',
    entityId: category._id,
    meta: { code: category.code, maxLimitPaisa: category.maxLimitPaisa }
  }).catch(() => {});

  return category;
}

export async function getAllCategories(filter = {}) {
  const query = { isDeleted: false };
  if (filter.activeOnly) {
    query.isActive = true;
  }
  return ExpenseCategory.find(query).sort({ name: 1 }).lean();
}

export async function getCategoryById(id) {
  const category = await ExpenseCategory.findOne({ _id: id, isDeleted: false }).lean();
  if (!category) {
    throw new ApiError(404, 'Expense category not found');
  }
  return category;
}

export async function updateCategory(id, data, actor) {
  const category = await ExpenseCategory.findOne({ _id: id, isDeleted: false });
  if (!category) {
    throw new ApiError(404, 'Expense category not found');
  }

  if (data.code && data.code.toUpperCase() !== category.code) {
    const existing = await ExpenseCategory.findOne({
      code: data.code.toUpperCase(),
      _id: { $ne: id },
      isDeleted: false
    });
    if (existing) {
      throw new ApiError(409, `Another category with code '${data.code.toUpperCase()}' already exists.`);
    }
    category.code = data.code.toUpperCase();
  }

  if (data.name !== undefined) category.name = data.name;
  if (data.description !== undefined) category.description = data.description;
  if (data.maxLimitPaisa !== undefined) category.maxLimitPaisa = data.maxLimitPaisa;
  if (data.requiresReceipt !== undefined) category.requiresReceipt = data.requiresReceipt;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'EXPENSE_CATEGORY_UPDATE',
    entity: 'ExpenseCategory',
    entityId: category._id,
    meta: { code: category.code }
  }).catch(() => {});

  return category;
}

export async function deleteCategory(id, actor) {
  const category = await ExpenseCategory.findOne({ _id: id, isDeleted: false });
  if (!category) {
    throw new ApiError(404, 'Expense category not found');
  }

  category.isDeleted = true;
  category.isActive = false;
  await category.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'EXPENSE_CATEGORY_DELETE',
    entity: 'ExpenseCategory',
    entityId: category._id,
    meta: { code: category.code }
  }).catch(() => {});

  return { message: 'Category deleted successfully' };
}

// ============================================================================
// 2. Receipt Storage Handler (Dual-tier Cloudinary + Local Disk Fallback)
// ============================================================================

export async function uploadReceipt(file) {
  if (!file || !file.buffer || file.size === 0) {
    throw new ApiError(400, 'Receipt file is mandatory and cannot be empty.');
  }

  // Allowed mime types: image/* and application/pdf
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new ApiError(400, 'Invalid receipt format. Only JPEG, PNG, WEBP, or PDF files are supported.');
  }

  // Max 5MB size limit
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ApiError(400, 'Receipt file size exceeds maximum allowed limit of 5MB.');
  }

  // 1. Try Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      const uploadRes = await uploadBufferToCloudinary(file.buffer, {
        folder: 'hrm_expenses',
        resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image'
      });
      return {
        receiptUrl: uploadRes.secure_url || uploadRes.url,
        receiptPublicId: uploadRes.public_id,
        receiptMimeType: file.mimetype
      };
    } catch (err) {
      console.warn('[ExpenseService] Cloudinary upload failed, falling back to disk:', err?.message);
    }
  }

  // 2. Local Disk Fallback
  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'expenses');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(file.originalname) || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
  const filename = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const diskPath = path.join(uploadsDir, filename);

  fs.writeFileSync(diskPath, file.buffer);

  return {
    receiptUrl: `/uploads/expenses/${filename}`,
    receiptPublicId: filename,
    receiptMimeType: file.mimetype
  };
}

// ============================================================================
// 3. Expense Claims Submission & Queries (BUILD-GUIDE Row 11.2)
// ============================================================================

export async function generateClaimNumber() {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const count = await Expense.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `EXP-${dateStr}-${sequence}`;
}

export async function createExpense(employeeId, data, file, actor) {
  // 1. Validate Employee Existence
  const employee = await Employee.findById(employeeId).populate('managerId');
  if (!employee) {
    throw new ApiError(404, 'Employee record not found.');
  }

  // 2. Validate Category & Policy Limit Caps
  const category = await ExpenseCategory.findOne({
    _id: data.categoryId,
    isDeleted: false,
    isActive: true
  });
  if (!category) {
    throw new ApiError(404, 'Active expense category not found.');
  }

  const amountPaisa = Number(data.amount);
  if (!Number.isInteger(amountPaisa) || amountPaisa <= 0) {
    throw new ApiError(400, 'Expense amount must be a positive integer in paisa.');
  }

  if (category.maxLimitPaisa > 0 && amountPaisa > category.maxLimitPaisa) {
    throw new ApiError(
      422,
      `Requested amount (PKR ${(amountPaisa / 100).toLocaleString('en-PK')}) exceeds category '${category.name}' maximum limit of PKR ${(category.maxLimitPaisa / 100).toLocaleString('en-PK')}.`
    );
  }

  // 3. Receipt Mandatory Check
  if (category.requiresReceipt && !file) {
    throw new ApiError(400, `Category '${category.name}' strictly mandates a verifiable receipt.`);
  }

  const receiptInfo = file ? await uploadReceipt(file) : { receiptUrl: '', receiptPublicId: '', receiptMimeType: '' };

  // 4. Generate Claim Number & Initial Approval Step
  const claimNumber = await generateClaimNumber();

  const expense = await Expense.create({
    claimNumber,
    employeeId: employee._id,
    categoryId: category._id,
    amount: amountPaisa,
    approvedAmount: amountPaisa,
    expenseDate: new Date(data.expenseDate),
    description: data.description.trim(),
    receiptUrl: receiptInfo.receiptUrl,
    receiptPublicId: receiptInfo.receiptPublicId,
    receiptMimeType: receiptInfo.receiptMimeType,
    status: 'pending_manager',
    approvalHistory: [
      {
        stage: 'submission',
        actorId: actor?._id,
        decision: 'submitted',
        comments: 'Expense claim submitted with receipt.',
        timestamp: new Date()
      }
    ]
  });

  // 5. Audit Log
  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'EXPENSE_APPLY',
    entity: 'Expense',
    entityId: expense._id,
    meta: { claimNumber, amount: amountPaisa, category: category.name }
  }).catch(() => {});

  // 6. Notify Department Manager if present
  if (employee.managerId?.userId) {
    const applicantName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';
    await notify(employee.managerId.userId, {
      type: 'expense',
      title: 'New Expense Claim Submitted',
      body: `${applicantName} submitted claim ${claimNumber} for PKR ${(amountPaisa / 100).toLocaleString('en-PK')} (${category.name}).`,
      link: '/expenses/approvals'
    }).catch(() => {});
  }

  return expense;
}

export async function getMyExpenses(employeeId, query = {}) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = { employeeId };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.categoryId) {
    filter.categoryId = query.categoryId;
  }

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('categoryId', 'name code maxLimitPaisa')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Expense.countDocuments(filter)
  ]);

  return {
    expenses,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

export async function getExpenseById(id, user) {
  const expense = await Expense.findById(id)
    .populate('employeeId', 'name firstName lastName email department designation')
    .populate('categoryId', 'name code maxLimitPaisa requiresReceipt')
    .populate('approvalHistory.actorId', 'name email role')
    .lean();

  if (!expense) {
    throw new ApiError(404, 'Expense claim not found');
  }

  // IDOR & Authorization Boundary Check
  const isSuperAdmin = user?.role === 'Super Admin' || user?.roles?.some((r) => r.name === 'Super Admin');
  const isHR = user?.role === 'HR Manager' || user?.roles?.some((r) => r.name === 'HR Manager');
  const userEmployeeId = user?.employeeId?._id?.toString() || user?.employeeId?.toString();
  const expenseEmployeeId = expense.employeeId?._id?.toString() || expense.employeeId?.toString();

  // 1. Applicant can always view their own claim
  if (userEmployeeId && userEmployeeId === expenseEmployeeId) {
    return expense;
  }

  // 2. Super Admin and HR Manager have cross-company visibility
  if (isSuperAdmin || isHR) {
    return expense;
  }

  // 3. Department Manager can view claims submitted by their direct reports
  if (userEmployeeId) {
    const isDirectReport = await Employee.exists({ _id: expenseEmployeeId, managerId: userEmployeeId });
    if (isDirectReport) {
      return expense;
    }
  }

  throw new ApiError(403, 'Access denied: You do not have authorization to view this expense claim.');
}

// ============================================================================
// 4. Approval Hierarchy Engine (BUILD-GUIDE Row 11.3)
// ============================================================================

export async function getPendingApprovals(user, query = {}) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const isSuperAdmin = user.role === 'Super Admin' || user.roles?.some((r) => r.name === 'Super Admin');
  const isHR = user.role === 'HR Manager' || user.roles?.some((r) => r.name === 'HR Manager');

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  } else if (isSuperAdmin || isHR) {
    filter.status = { $in: ['pending_manager', 'pending_admin'] };
  } else {
    // Department Manager only reviews pending_manager for team members
    const teamEmployees = await Employee.find({ managerId: user.employeeId }).select('_id');
    const teamEmployeeIds = teamEmployees.map((e) => e._id);
    filter.employeeId = { $in: teamEmployeeIds };
    filter.status = 'pending_manager';
  }

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('employeeId', 'name firstName lastName email department designation')
      .populate('categoryId', 'name code maxLimitPaisa')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Expense.countDocuments(filter)
  ]);

  return {
    expenses,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

export async function decideExpense(id, decisionData, actor) {
  const expense = await Expense.findById(id).populate('categoryId');
  if (!expense) {
    throw new ApiError(404, 'Expense claim not found');
  }

  // 1. Terminal State Check: Cannot mutate settled claims
  if (['approved', 'rejected', 'reimbursed'].includes(expense.status)) {
    throw new ApiError(400, `Cannot decide expense claim with status '${expense.status}'. Claim is already settled.`);
  }

  // 2. Separation of duties: Applicant cannot approve their own claim
  const actorEmployeeId = actor.employeeId?._id?.toString() || actor.employeeId?.toString();
  if (actorEmployeeId && actorEmployeeId === expense.employeeId.toString()) {
    throw new ApiError(403, 'Separation of duties violation: You cannot decide or approve your own expense claim.');
  }

  const isSuperAdmin = actor.role === 'Super Admin' || actor.roles?.some((r) => r.name === 'Super Admin');
  const isHR = actor.role === 'HR Manager' || actor.roles?.some((r) => r.name === 'HR Manager');

  // 3. Executive Escalation Protection: Only Super Admin (or HR) can decide on claims in 'pending_admin'
  if (expense.status === 'pending_admin' && !isSuperAdmin && !isHR) {
    throw new ApiError(403, 'This claim has escalated to executive approval. Only Super Admin can approve or reject it.');
  }

  const { decision, comments, approvedAmount } = decisionData;
  const finalApprovedAmount = approvedAmount ? Number(approvedAmount) : expense.amount;

  if (approvedAmount && (!Number.isInteger(finalApprovedAmount) || finalApprovedAmount <= 0)) {
    throw new ApiError(400, 'Approved amount must be a positive integer in paisa.');
  }

  // Extract manager limit from permissions or default
  const managerPermission = actor.permissions?.find((p) => p.action === 'expense.approve');
  const approvalLimitPaisa = managerPermission?.limit || DEFAULT_MANAGER_APPROVAL_LIMIT_PAISA;

  if (decision === 'reject') {
    expense.status = 'rejected';
    expense.approvalHistory.push({
      stage: expense.status === 'pending_admin' ? 'admin_rejection' : 'manager_rejection',
      actorId: actor._id,
      decision: 'rejected',
      comments: comments.trim(),
      timestamp: new Date()
    });
  } else if (decision === 'recommend') {
    // Recommend escalates to pending_admin
    expense.status = 'pending_admin';
    expense.approvedAmount = finalApprovedAmount;
    expense.approvalHistory.push({
      stage: 'manager_recommendation',
      actorId: actor._id,
      decision: 'recommended',
      comments: comments.trim(),
      timestamp: new Date()
    });
  } else if (decision === 'approve') {
    // If claim amount exceeds manager limit and actor is not Super Admin, must escalate to pending_admin
    if (!isSuperAdmin && !isHR && expense.amount > approvalLimitPaisa) {
      expense.status = 'pending_admin';
      expense.approvedAmount = finalApprovedAmount;
      expense.approvalHistory.push({
        stage: 'manager_escalation',
        actorId: actor._id,
        decision: 'escalated',
        comments: `Claim amount (PKR ${(expense.amount / 100).toLocaleString('en-PK')}) exceeds manager threshold (PKR ${(approvalLimitPaisa / 100).toLocaleString('en-PK')}). Escalated to Super Admin. Remarks: ${comments.trim()}`,
        timestamp: new Date()
      });
    } else {
      // Direct approval
      expense.status = 'approved';
      expense.approvedAmount = finalApprovedAmount;
      expense.approvalHistory.push({
        stage: isSuperAdmin ? 'admin_approval' : 'manager_approval',
        actorId: actor._id,
        decision: 'approved',
        comments: comments.trim(),
        timestamp: new Date()
      });
    }
  }

  await expense.save();

  // Audit Log
  await recordAuditLog({
    userId: actor._id,
    actor,
    action: 'EXPENSE_DECIDE',
    entity: 'Expense',
    entityId: expense._id,
    meta: { decision, status: expense.status, approvedAmount: expense.approvedAmount }
  }).catch(() => {});

  // Notify applicant
  const applicantEmployee = await Employee.findById(expense.employeeId);
  if (applicantEmployee?.userId) {
    await notify(applicantEmployee.userId, {
      type: 'expense',
      title: `Expense Claim ${expense.status.toUpperCase()}`,
      body: `Claim ${expense.claimNumber} is now '${expense.status}'. Notes: ${comments.trim()}`,
      link: '/expenses'
    }).catch(() => {});
  }

  return expense;
}

// ============================================================================
// 5. Reimbursement Execution (BUILD-GUIDE Row 11.4)
// ============================================================================

export async function reimburseExpense(id, data, actor) {
  const isPayroll = data.method === 'payroll';

  // Atomic check-and-set:
  // - Direct: status transitions immediately to 'reimbursed'
  // - Payroll: claim is attached to upcoming payroll cycle (status stays 'approved' until payroll is finalized & paid)
  const queryFilter = {
    _id: id,
    status: 'approved',
    'reimbursement.method': { $ne: 'payroll' }
  };

  const updateDoc = isPayroll
    ? {
        $set: {
          'reimbursement.method': 'payroll',
          'reimbursement.remarks': data.remarks || 'Queued for inclusion in next payroll run',
          'reimbursement.disbursedBy': actor._id
        },
        $push: {
          approvalHistory: {
            stage: 'payroll_queued',
            actorId: actor._id,
            decision: 'payroll_attached',
            comments: `Attached to upcoming payroll cycle. Remarks: ${data.remarks || 'N/A'}`,
            timestamp: new Date()
          }
        }
      }
    : {
        $set: {
          status: 'reimbursed',
          reimbursement: {
            method: 'direct',
            paymentReference: data.paymentReference || '',
            disbursedAt: new Date(),
            disbursedBy: actor._id,
            remarks: data.remarks || ''
          }
        },
        $push: {
          approvalHistory: {
            stage: 'reimbursement',
            actorId: actor._id,
            decision: 'reimbursed',
            comments: `Reimbursed via DIRECT transfer. Ref: ${data.paymentReference || 'N/A'}`,
            timestamp: new Date()
          }
        }
      };

  const updatedExpense = await Expense.findOneAndUpdate(queryFilter, updateDoc, { new: true });

  if (!updatedExpense) {
    const existing = await Expense.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Expense claim not found');
    }
    if (existing.reimbursement?.method === 'payroll') {
      throw new ApiError(400, 'This expense claim has already been queued for reimbursement via payroll.');
    }
    throw new ApiError(
      400,
      `Cannot reimburse expense claim with status '${existing.status}'. Only 'approved' claims can be reimbursed.`
    );
  }

  // Audit Log
  await recordAuditLog({
    userId: actor._id,
    actor,
    action: 'EXPENSE_REIMBURSE',
    entity: 'Expense',
    entityId: updatedExpense._id,
    meta: { method: data.method, paymentReference: data.paymentReference }
  }).catch(() => {});

  // Notify applicant
  const applicantEmployee = await Employee.findById(updatedExpense.employeeId);
  if (applicantEmployee?.userId) {
    const notifBody = isPayroll
      ? `Your claim ${updatedExpense.claimNumber} of PKR ${(updatedExpense.approvedAmount / 100).toLocaleString('en-PK')} has been attached to the upcoming payroll cycle.`
      : `Your claim ${updatedExpense.claimNumber} of PKR ${(updatedExpense.approvedAmount / 100).toLocaleString('en-PK')} has been reimbursed via direct payout.`;

    await notify(applicantEmployee.userId, {
      type: 'expense',
      title: isPayroll ? 'Expense Attached to Payroll' : 'Expense Claim Reimbursed',
      body: notifBody,
      link: '/expenses'
    }).catch(() => {});
  }

  return updatedExpense;
}

// ============================================================================
// 6. Monthly Expense Report & Aggregation (BUILD-GUIDE Row 11.5)
// ============================================================================

export async function getExpenseMonthlyReport(filters = {}) {
  const match = {};

  if (filters.month) {
    // month format: YYYY-MM
    const [year, m] = filters.month.split('-').map(Number);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const end = new Date(Date.UTC(year, m, 1));
    match.expenseDate = { $gte: start, $lt: end };
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'expensecategories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category.name',
        categoryCode: { $first: '$category.code' },
        totalClaims: { $sum: 1 },
        totalAmountPaisa: { $sum: '$amount' },
        approvedAmountPaisa: {
          $sum: {
            $cond: [{ $in: ['$status', ['approved', 'reimbursed']] }, '$approvedAmount', 0]
          }
        },
        reimbursedAmountPaisa: {
          $sum: {
            $cond: [{ $eq: ['$status', 'reimbursed'] }, '$approvedAmount', 0]
          }
        },
        pendingAmountPaisa: {
          $sum: {
            $cond: [{ $in: ['$status', ['pending_manager', 'pending_admin']] }, '$amount', 0]
          }
        }
      }
    },
    { $sort: { totalAmountPaisa: -1 } }
  ];

  const breakdown = await Expense.aggregate(pipeline);

  const grandTotals = breakdown.reduce(
    (acc, curr) => {
      acc.totalClaims += curr.totalClaims;
      acc.totalAmountPaisa += curr.totalAmountPaisa;
      acc.approvedAmountPaisa += curr.approvedAmountPaisa;
      acc.reimbursedAmountPaisa += curr.reimbursedAmountPaisa;
      acc.pendingAmountPaisa += curr.pendingAmountPaisa;
      return acc;
    },
    {
      totalClaims: 0,
      totalAmountPaisa: 0,
      approvedAmountPaisa: 0,
      reimbursedAmountPaisa: 0,
      pendingAmountPaisa: 0
    }
  );

  return {
    month: filters.month || 'ALL',
    grandTotals,
    breakdown
  };
}

