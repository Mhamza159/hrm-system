/**
 * @file dashboard.activity.js
 * @description Role-scoped "Recent Activity" feed built from AuditLog.
 *
 * SECURITY: manager feeds are an ALLOWLIST of modules (new entities stay hidden by default).
 * Payroll, salary, loan, user, role, setting and employee-record entries are never listed.
 */

import { AuditLog } from '../../models/auditLog.model.js';
import { Employee } from '../../models/employee.model.js';
import { Leave } from '../../models/leave.model.js';
import { AttendanceCorrection } from '../../models/correction.model.js';
import { WFHRequest } from '../../models/wfh.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { Expense } from '../../models/expense.model.js';
import { AssetRequest } from '../../models/assetRequest.model.js';
import Checklist from '../../models/checklist.model.js';

// Stored spellings: recordAuditLog lowercases the entity name. Dev DB had leave, expense, review;
// the rest are written by Task 2 / the asset and onboarding services.
export const MANAGER_ACTIVITY_MODULES = [
  'leave', 'attendancecorrection', 'wfhrequest', 'attendance',
  'expense', 'assetrequest', 'checklist', 'review',
];

// Modules whose targetId points at a record carrying `employeeId`.
const OWNER_MODELS = {
  leave: Leave,
  attendancecorrection: AttendanceCorrection,
  wfhrequest: WFHRequest,
  attendance: Attendance,
  expense: Expense,
  assetrequest: AssetRequest,
  checklist: Checklist,
};

const ACTION_LABELS = {
  LEAVE_APPLY: 'applied for leave',
  LEAVE_APPROVED: 'approved a leave request',
  LEAVE_APPROVE: 'approved a leave request',
  LEAVE_REJECTED: 'rejected a leave request',
  LEAVE_CANCEL: 'cancelled a leave request',
  LEAVE_AUTO_LAPSED: 'leave request lapsed automatically',
  EXPENSE_APPLY: 'submitted an expense',
  EXPENSE_SUBMITTED: 'submitted an expense',
  EXPENSE_DECIDE: 'decided on an expense',
  EXPENSE_REIMBURSE: 'reimbursed an expense',
  WFH_REQUESTED: 'requested work from home',
  WFH_APPROVED: 'approved a work from home request',
  WFH_REJECTED: 'rejected a work from home request',
  CORRECTION_REQUESTED: 'requested an attendance correction',
  CORRECTION_APPROVED: 'approved an attendance correction',
  CORRECTION_REJECTED: 'rejected an attendance correction',
  OVERTIME_APPROVED: 'approved overtime',
  OVERTIME_REJECTED: 'rejected overtime',
};

export const formatActionLabel = (action = '') =>
  ACTION_LABELS[action] ||
  String(action).toLowerCase().split('_').filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const idSet = (ids) => new Set(ids.map(String));

/** Keeps rows whose actor is in the team, or whose target record belongs to a team employee. */
const filterToTeam = async (rows, { teamEmployeeIds, teamUserIds }) => {
  const users = idSet(teamUserIds);
  const employees = idSet(teamEmployeeIds);

  const idsByModule = {};
  for (const r of rows) {
    if (r.actorId && users.has(String(r.actorId))) continue;
    if (OWNER_MODELS[r.module] && r.targetId) (idsByModule[r.module] ||= []).push(r.targetId);
  }
  const ownerOf = new Map();
  await Promise.all(Object.entries(idsByModule).map(async ([module, ids]) => {
    const docs = await OWNER_MODELS[module].find({ _id: { $in: ids } }).select('employeeId').lean();
    docs.forEach((d) => ownerOf.set(`${module}:${d._id}`, String(d.employeeId)));
  }));

  return rows.filter((r) =>
    (r.actorId && users.has(String(r.actorId))) ||
    employees.has(ownerOf.get(`${r.module}:${r.targetId}`)));
};

export const getRecentActivity = async ({ team = null, limit = 8 } = {}) => {
  const filter = team
    ? { module: { $in: MANAGER_ACTIVITY_MODULES } }
    : { module: { $nin: ['auth', 'AUTH'] } };

  // shortcut: team feed scans the latest 200 allowlisted rows, upgrade to an aggregation if teams see empty feeds
  let rows = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(team ? 200 : limit).lean();
  if (team) rows = (await filterToTeam(rows, team)).slice(0, limit);

  const actorIds = [...new Set(rows.filter((r) => r.actorId).map((r) => String(r.actorId)))];
  const employees = await Employee.find({ userId: { $in: actorIds } }).select('userId name').lean();
  const nameByUser = new Map(employees.map((e) => [String(e.userId), e.name]));

  return rows.map((r) => ({
    _id: r._id,
    actorName: r.actorId ? nameByUser.get(String(r.actorId)) || r.actorEmail || 'System' : 'System',
    actionLabel: formatActionLabel(r.action),
    action: r.action,
    module: r.module,
    targetModel: r.targetModel,
    createdAt: r.createdAt,
  }));
};
