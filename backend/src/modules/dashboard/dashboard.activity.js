/**
 * @file dashboard.activity.js
 * @description Role-scoped "Recent Activity" feed built from AuditLog.
 *
 * SECURITY: manager feeds are an ALLOWLIST of modules (new entities stay hidden by default).
 * Payroll, salary, loan, user, role, setting and employee-record entries are never listed.
 */

import { AuditLog } from '../../models/auditLog.model.js';
import { getPeopleByUserIds } from './dashboard.people.js';
import { Leave } from '../../models/leave.model.js';
import { AttendanceCorrection } from '../../models/correction.model.js';
import { WFHRequest } from '../../models/wfh.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { Expense } from '../../models/expense.model.js';
import { AssetRequest } from '../../models/assetRequest.model.js';
import Review from '../../models/review.model.js';
import { Timesheet } from '../../models/timesheet.model.js';
import Checklist from '../../models/checklist.model.js';

// Stored spellings: recordAuditLog stores the lowercased entity (or resource) name. Derived from the
// writers: asset (AssetRequest), onboarding (Checklist), projects (Project, Timesheet), performance (Review).
// There is no Goal audit writer. 'asset' (inventory) and 'client' are deliberately excluded.
export const MANAGER_ACTIVITY_MODULES = [
  'leave', 'attendancecorrection', 'wfhrequest', 'attendance', 'expense',
  'assetrequest', 'checklist', 'review', 'timesheet', 'project',
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
  review: Review,
  timesheet: Timesheet,
}; // project has no top-level employeeId (members[]), so it uses the actor rule only

const ACTION_LABELS = {
  LEAVE_APPLY: 'applied for leave',
  LEAVE_APPROVED: 'approved a leave request',
  LEAVE_APPROVE: 'approved a leave request',
  LEAVE_REJECTED: 'rejected a leave request',
  LEAVE_REJECT: 'rejected a leave request',
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

// What each module's records are called in a sentence ("created a project").
const MODULE_NOUNS = {
  leave: 'leave request',
  leavetype: 'leave type',
  attendance: 'attendance record',
  attendancecorrection: 'attendance correction',
  wfhrequest: 'work-from-home request',
  expense: 'expense claim',
  asset: 'asset',
  assetrequest: 'asset request',
  checklist: 'onboarding checklist',
  checklisttemplate: 'checklist template',
  review: 'performance review',
  timesheet: 'timesheet',
  project: 'project',
  client: 'client',
  employee: 'employee record',
  resignation: 'resignation',
  exitinterview: 'exit interview',
  payrollrun: 'payroll run',
  payslip: 'payslip',
  salarystructure: 'salary structure',
  loan: 'loan request',
  job: 'job posting',
  candidate: 'candidate',
  requisition: 'job requisition',
  role: 'role',
  user: 'user account',
  setting: 'setting',
  department: 'department',
  designation: 'designation',
  announcement: 'announcement',
};

const VERBS = {
  create: 'created', add: 'added', update: 'updated', edit: 'edited', delete: 'deleted', remove: 'removed',
  approve: 'approved', approved: 'approved', reject: 'rejected', rejected: 'rejected', decide: 'decided on',
  submit: 'submitted', submitted: 'submitted', apply: 'submitted', request: 'requested', requested: 'requested',
  cancel: 'cancelled', archive: 'archived', restore: 'restored', assign: 'assigned', allocate: 'allocated',
  finalize: 'finalized', complete: 'completed', close: 'closed', publish: 'published', view: 'viewed',
  manage: 'updated', recommend: 'recommended', forward: 'forwarded', reimburse: 'reimbursed',
};

const withArticle = (noun) => `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`;

/**
 * Turns an audit action key into a sentence fragment that follows the actor's name:
 * "LEAVE_APPROVED" → "approved a leave request", "asset_request.approve" → "approved an asset request",
 * generic "CREATE" on module project → "created a project", "SUBMIT_TIMESHEET" → "submitted a timesheet".
 */
export const formatActionLabel = (action, module) => {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const words = String(action ?? '').toLowerCase().split(/[_.\s-]+/).filter(Boolean);
  if (words.length === 0) return 'made a change';
  const moduleNoun = MODULE_NOUNS[String(module || '').toLowerCase()];

  const last = words[words.length - 1];
  const first = words[0];
  if (VERBS[last]) {
    const subject = words.length > 1 ? words.slice(0, -1).join(' ') : moduleNoun;
    return subject ? `${VERBS[last]} ${withArticle(subject)}` : VERBS[last];
  }
  if (VERBS[first]) {
    const subject = words.length > 1 ? words.slice(1).join(' ') : moduleNoun;
    return subject ? `${VERBS[first]} ${withArticle(subject)}` : VERBS[first];
  }
  return words.join(' ');
};

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

  const people = await getPeopleByUserIds(rows.map((r) => r.actorId));

  return rows.map((r) => {
    const actor = r.actorId ? people.get(String(r.actorId)) : null;
    // recordAuditLog may store an unpopulated role ObjectId as the snapshot; only trust real names.
    const snapshotRole = r.actorRole && r.actorRole !== 'SYSTEM' && !/^[a-f0-9]{24}$/i.test(r.actorRole) ? r.actorRole : null;
    return {
      _id: r._id,
      actorName: actor?.employeeName || (r.actorEmail && r.actorEmail !== 'system' ? r.actorEmail : 'System'),
      actorAvatar: actor?.avatar || null,
      actorDesignation: actor?.designation || null,
      actorDepartment: actor?.department || null,
      // Role at the time of the action wins; fall back to the actor's current role.
      actorRole: r.actorId ? snapshotRole || actor?.role || null : null,
      actionLabel: formatActionLabel(r.action, r.module),
      action: r.action,
      module: r.module,
      targetModel: r.targetModel,
      createdAt: r.createdAt,
    };
  });
};
