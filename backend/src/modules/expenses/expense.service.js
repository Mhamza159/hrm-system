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
import mongoose from 'mongoose';
import { ExpenseCategory } from '../../models/expenseCategory.model.js';
import { Expense } from '../../models/expense.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { Department } from '../../models/department.model.js';
import { Designation } from '../../models/designation.model.js';
import { SalaryStructure } from '../../models/salaryStructure.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../../config/cloudinary.js';
import { assertSuperAdminIfApplicantIsHR, isApplicantHR, notifySuperAdmins, notifyHRManagers } from '../../utils/hrApprovalGuard.js';
import { populatePerson, toPerson, getPeopleByUserIds } from '../dashboard/dashboard.people.js';

// Default managerial approval threshold: PKR 15,000 (1,500,000 paisa)
export const DEFAULT_MANAGER_APPROVAL_LIMIT_PAISA = 1500000;

// ============================================================================
// 1. Expense Categories Management (BUILD-GUIDE Row 11.1)
// ============================================================================

export async function createCategory(data, actor) {
  // code is unique across the whole collection, archived categories included
  const existing = await ExpenseCategory.findOne({ code: data.code.toUpperCase() });

  if (existing) {
    throw new ApiError(
      409,
      existing.isDeleted
        ? `Code '${existing.code}' belongs to the archived category '${existing.name}'. Restore it from the Archive tab, or permanently delete it first.`
        : `An expense category with code '${data.code.toUpperCase()}' already exists.`
    );
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
      _id: { $ne: id }
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

/** Archived categories with how many claims still reference each (shown in the Archive tab). */
export async function getArchivedCategories() {
  const categories = await ExpenseCategory.find({ isDeleted: true })
    .sort({ archivedAt: -1, updatedAt: -1 })
    .lean();
  const counts = await Expense.aggregate([
    { $match: { categoryId: { $in: categories.map((c) => c._id) } } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } }
  ]);
  const claimCount = new Map(counts.map((c) => [String(c._id), c.count]));
  const people = await getPeopleByUserIds(categories.map((c) => c.archivedBy));

  return categories.map((c) => ({
    ...c,
    claimCount: claimCount.get(String(c._id)) || 0,
    archivedByName: c.archivedBy ? people.get(String(c.archivedBy))?.employeeName || null : null
  }));
}

/** "Delete" archives the category: it is disabled and leaves every claim form until restored. */
export async function deleteCategory(id, actor) {
  const category = await ExpenseCategory.findOne({ _id: id, isDeleted: false });
  if (!category) {
    throw new ApiError(404, 'Expense category not found');
  }

  category.isDeleted = true;
  category.isActive = false;
  category.archivedAt = new Date();
  category.archivedBy = actor?._id || null;
  await category.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'EXPENSE_CATEGORY_ARCHIVE',
    entity: 'ExpenseCategory',
    entityId: category._id,
    meta: { code: category.code, name: category.name }
  }).catch(() => {});

  return { message: `'${category.name}' moved to the archive` };
}

export async function restoreCategory(id, actor) {
  const category = await ExpenseCategory.findOne({ _id: id, isDeleted: true });
  if (!category) {
    throw new ApiError(404, 'Archived expense category not found');
  }

  category.isDeleted = false;
  category.isActive = true;
  category.archivedAt = null;
  category.archivedBy = null;
  await category.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'EXPENSE_CATEGORY_RESTORE',
    entity: 'ExpenseCategory',
    entityId: category._id,
    meta: { code: category.code, name: category.name }
  }).catch(() => {});

  return category;
}

/**
 * Permanently removes an archived category. Refused while any claim references it, because claim
 * history, payouts and expense reports would lose their category.
 */
export async function permanentDeleteCategory(id, actor) {
  const category = await ExpenseCategory.findOne({ _id: id, isDeleted: true });
  if (!category) {
    throw new ApiError(404, 'Archived expense category not found. Only archived categories can be permanently deleted.');
  }

  const linkedClaims = await Expense.countDocuments({ categoryId: category._id });
  if (linkedClaims > 0) {
    throw new ApiError(
      409,
      `Cannot permanently delete '${category.name}': ${linkedClaims} expense claim${linkedClaims === 1 ? '' : 's'} reference it. Keep it archived so their history stays intact.`
    );
  }

  await ExpenseCategory.deleteOne({ _id: category._id });

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'EXPENSE_CATEGORY_PERMANENT_DELETE',
    entity: 'ExpenseCategory',
    entityId: category._id,
    meta: { code: category.code, name: category.name }
  }).catch(() => {});

  return { message: `'${category.name}' permanently deleted` };
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
    status: (await isApplicantHR(employee._id, actor?._id)) ? 'pending_admin' : 'pending_manager',
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

  // 6. Notify relevant approvers based on PBAC rules
  const isHr = await isApplicantHR(employee._id, actor);
  const applicantName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';
  const formattedPkr = (amountPaisa / 100).toLocaleString('en-PK');

  if (isHr) {
    await notifySuperAdmins({
      type: 'expense',
      title: 'New Expense Claim (HR Staff)',
      body: `${applicantName} (HR Manager) submitted claim ${claimNumber} for PKR ${formattedPkr} (${category.name}). Awaiting Super Admin review.`,
      link: '/expenses/approvals'
    }).catch(() => {});
  } else if (employee.managerId?.userId) {
    await notify(employee.managerId.userId, {
      type: 'expense',
      title: 'New Expense Claim Submitted',
      body: `${applicantName} submitted claim ${claimNumber} for PKR ${formattedPkr} (${category.name}).`,
      link: '/expenses/approvals'
    }).catch(() => {});
  } else {
    await notifyHRManagers({
      type: 'expense',
      title: 'New Expense Claim Submitted',
      body: `${applicantName} submitted claim ${claimNumber} for PKR ${formattedPkr} (${category.name}). Awaiting HR review.`,
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
      .populate('categoryId', 'name code maxLimitPaisa requiresReceipt')
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

const hasRole = (user, name) =>
  user?.role === name || Boolean(user?.roles?.some((r) => (r?.name || r) === name));

/**
 * Employees whose claims the user may see and decide (besides their own):
 * - Super Admin / HR → null (company-wide)
 * - Department Manager → everyone in the department they belong to or head, excluding themselves
 * - anyone else → [] (own claims only)
 * Claims from any other department are never reachable by a Department Manager.
 */
export async function getReviewableEmployeeIds(user) {
  if (hasRole(user, 'Super Admin') || hasRole(user, 'HR Manager')) return null;
  // Only Department Managers review others' claims; everyone else sees their own claims only
  if (!hasRole(user, 'Department Manager')) return [];

  const managerEmpId = user?.employeeId?._id || user?.employeeId;
  if (!managerEmpId) return [];

  const [managerEmp, headedDepts] = await Promise.all([
    Employee.findById(managerEmpId).select('departmentId').lean(),
    Department.find({ headId: managerEmpId, isDeleted: { $ne: true } }).select('_id').lean()
  ]);
  const deptIds = [managerEmp?.departmentId, ...headedDepts.map((d) => d._id)].filter(Boolean);
  if (deptIds.length === 0) return [];

  const members = await Employee.find({ departmentId: { $in: deptIds }, _id: { $ne: managerEmpId } })
    .select('_id')
    .lean();
  return members.map((m) => m._id);
}

const inScope = (scopeIds, employeeId) =>
  scopeIds === null || scopeIds.some((id) => id.toString() === String(employeeId?._id ?? employeeId));

export async function getExpenseById(id, user) {
  const expense = await Expense.findById(id)
    .populate(populatePerson())
    .populate('categoryId', 'name code maxLimitPaisa requiresReceipt description')
    .lean();

  if (!expense) {
    throw new ApiError(404, 'Expense claim not found');
  }

  // IDOR & Authorization Boundary Check
  const userEmployeeId = user?.employeeId?._id?.toString() || user?.employeeId?.toString();
  const expenseEmployeeId = expense.employeeId?._id?.toString() || expense.employeeId?.toString();

  // Applicant always sees their own claim; Super Admin / HR see everything; a Department
  // Manager sees claims from their own department only.
  const isOwn = Boolean(userEmployeeId) && userEmployeeId === expenseEmployeeId;
  if (!isOwn && !inScope(await getReviewableEmployeeIds(user), expenseEmployeeId)) {
    throw new ApiError(403, 'Access denied: You do not have authorization to view this expense claim.');
  }

  // Resolve who acted at each approval stage and who disbursed (User has no name field of its own).
  const actorIds = [
    ...(expense.approvalHistory || []).map((h) => h.actorId),
    expense.reimbursement?.disbursedBy
  ].filter(Boolean);
  const people = await getPeopleByUserIds(actorIds);
  const describe = (userId) => {
    const p = userId ? people.get(String(userId)) : null;
    return p ? { name: p.employeeName, role: p.role, designation: p.designation } : null;
  };

  return {
    ...expense,
    applicant: toPerson(expense.employeeId),
    approvalHistory: (expense.approvalHistory || []).map((h) => ({ ...h, actor: describe(h.actorId) })),
    reimbursement: expense.reimbursement
      ? { ...expense.reimbursement, disbursedByPerson: describe(expense.reimbursement.disbursedBy) }
      : expense.reimbursement
  };
}

// ============================================================================
// 4. Approval Hierarchy Engine (BUILD-GUIDE Row 11.3)
// ============================================================================

export async function getPendingApprovals(user, query = {}) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const scopeIds = await getReviewableEmployeeIds(user);
  const filter = {};

  if (scopeIds === null) {
    // Super Admin / HR: any queue, defaulting to everything still awaiting a decision
    filter.status = query.status || { $in: ['pending_manager', 'pending_admin'] };
  } else {
    // Department Manager: only claims from their own department that await their decision.
    // The requested status is ignored so no other queue (escalations, approved, other depts) is reachable.
    filter.employeeId = { $in: scopeIds };
    filter.status = 'pending_manager';
  }

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate(populatePerson())
      .populate('categoryId', 'name code maxLimitPaisa requiresReceipt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Expense.countDocuments(filter)
  ]);

  return {
    expenses: expenses.map((e) => ({ ...e, applicant: toPerson(e.employeeId) })),
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

  // 2b. Executive Policy: HR applicant expenses can ONLY be decided by Super Admin
  await assertSuperAdminIfApplicantIsHR(expense.employeeId, actor, 'expense claim');

  const isSuperAdmin = actor.role === 'Super Admin' || actor.roles?.some((r) => r.name === 'Super Admin');
  const isHR = actor.role === 'HR Manager' || actor.roles?.some((r) => r.name === 'HR Manager');

  // 3. Executive Escalation Protection: Only Super Admin (or HR) can decide on claims in 'pending_admin'
  if (expense.status === 'pending_admin' && !isSuperAdmin && !isHR) {
    throw new ApiError(403, 'This claim has escalated to executive approval. Only Super Admin can approve or reject it.');
  }

  // 3b. Department boundary: a Department Manager may only decide claims from their own department
  if (!isSuperAdmin && !isHR && !inScope(await getReviewableEmployeeIds(actor), expense.employeeId)) {
    throw new ApiError(403, 'You can only review expense claims from your own department.');
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
    const stage = expense.status === 'pending_admin' ? 'admin_rejection' : 'manager_rejection'; // read before status changes
    expense.status = 'rejected';
    expense.approvalHistory.push({
      stage,
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

      await notifySuperAdmins({
        type: 'expense',
        title: 'Expense Claim Escalated to Super Admin',
        body: `Claim ${expense.claimNumber} (PKR ${(expense.amount / 100).toLocaleString('en-PK')}) exceeded manager threshold and has been escalated for Super Admin approval.`,
        link: '/expenses/approvals'
      }).catch(() => {});
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

  const existing = await Expense.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Expense claim not found');
  }

  // Terminal State Guard: Only approved claims can be reimbursed
  if (existing.status !== 'approved') {
    throw new ApiError(
      400,
      `Cannot reimburse expense claim with status '${existing.status}'. Only 'approved' claims can be reimbursed.`
    );
  }

  // Payroll Guard: If queueing for payroll, ensure employee has an active Salary Structure & is active
  if (isPayroll) {
    const salaryStructure = await SalaryStructure.findOne({
      employeeId: existing.employeeId,
      status: 'active',
      isDeleted: false
    });
    if (!salaryStructure) {
      throw new ApiError(
        400,
        'Cannot queue claim for payroll: Applicant does not have an active Salary Structure. Please disburse via direct payout or configure their salary structure first.'
      );
    }
    const applicantEmp = await Employee.findById(existing.employeeId);
    if (applicantEmp && ['Terminated', 'Resigned'].includes(applicantEmp.status)) {
      throw new ApiError(
        400,
        `Cannot queue claim for payroll: Applicant is marked as '${applicantEmp.status}'. Please disburse via direct payout.`
      );
    }
  }

  const isSwitchingFromPayroll = existing.reimbursement?.method === 'payroll' && !isPayroll;

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
            comments: `Reimbursed via DIRECT transfer.${isSwitchingFromPayroll ? ' (Switched from payroll queue)' : ''} Ref: ${data.paymentReference || 'N/A'}`,
            timestamp: new Date()
          }
        }
      };

  const updatedExpense = await Expense.findByIdAndUpdate(id, updateDoc, { new: true });

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

export async function getExpenseMonthlyReport(filters = {}, user = null) {
  const match = {};

  if (filters.month) {
    // month format: YYYY-MM
    const [year, m] = filters.month.split('-').map(Number);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const end = new Date(Date.UTC(year, m, 1));
    match.expenseDate = { $gte: start, $lt: end };
  }

  // report.view is granted with scope all (Super Admin/HR), team (Department Manager) and own
  // (Employee): limit the report to the claims the caller may see, plus their own.
  const scopeIds = await getReviewableEmployeeIds(user);
  if (scopeIds !== null) {
    const ownId = user?.employeeId?._id || user?.employeeId;
    match.employeeId = { $in: ownId ? [...scopeIds, new mongoose.Types.ObjectId(String(ownId))] : scopeIds };
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

  const [departments, claims] = await Promise.all([
    Expense.aggregate([
      { $match: match },
      { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' },
      { $lookup: { from: 'departments', localField: 'emp.departmentId', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$dept.name', 'Unassigned'] },
          totalClaims: { $sum: 1 },
          claimants: { $addToSet: '$employeeId' },
          totalAmountPaisa: { $sum: '$amount' },
          reimbursedAmountPaisa: { $sum: { $cond: [{ $eq: ['$status', 'reimbursed'] }, '$approvedAmount', 0] } }
        }
      },
      { $project: { totalClaims: 1, totalAmountPaisa: 1, reimbursedAmountPaisa: 1, claimantCount: { $size: '$claimants' } } },
      { $sort: { totalAmountPaisa: -1 } }
    ]),
    // shortcut: the claim list is capped at 500 rows per month; paginate if a month ever exceeds that
    Expense.find(match)
      .populate(populatePerson())
      .populate('categoryId', 'name code')
      .sort({ expenseDate: -1, createdAt: -1 })
      .limit(500)
      .lean()
  ]);

  return {
    month: filters.month || 'ALL',
    grandTotals,
    breakdown,
    departments,
    claims: claims.map((c) => ({
      _id: c._id,
      claimNumber: c.claimNumber,
      status: c.status,
      amount: c.amount,
      approvedAmount: c.approvedAmount,
      expenseDate: c.expenseDate,
      createdAt: c.createdAt,
      description: c.description,
      reimbursement: c.reimbursement ? { method: c.reimbursement.method } : undefined,
      categoryId: c.categoryId,
      applicant: toPerson(c.employeeId)
    }))
  };
}

