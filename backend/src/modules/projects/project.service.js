/**
 * @file project.service.js
 * @description Domain Business Logic for Module M22 Projects & Timesheets.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.1 to 22.7)
 * - Layer: Service Layer (Business rules, validations, database interactions, audit logs)
 * - Invariants:
 *   1. 24h Daily Cap: Cumulative logged hours for an employee on any day <= 24.0h.
 *   2. Project Roster Isolation: Only assigned team members can log time to a project.
 *   3. Approval Immutability: Approved timesheets cannot be modified or deleted.
 *   4. Profitability Restriction: Hourly labor cost derived from active SalaryStructure; Super Admin only.
 */

import { Client } from '../../models/client.model.js';
import { Project } from '../../models/project.model.js';
import { Timesheet } from '../../models/timesheet.model.js';
import { Employee } from '../../models/employee.model.js';
import { Department } from '../../models/department.model.js';
import { User } from '../../models/user.model.js';
import { SalaryStructure } from '../../models/salaryStructure.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';
import { assertSuperAdminIfApplicantIsHR } from '../../utils/hrApprovalGuard.js';

// =========================================================================
// DATE & ISO WEEK UTILITIES
// =========================================================================

/**
 * Normalizes a date to Monday 00:00:00.000 UTC of its week.
 */
export const getMondayOfWeek = (inputDate) => {
  let d;
  if (typeof inputDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(inputDate)) {
    const parts = inputDate.slice(0, 10).split('-').map(Number);
    d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
  } else {
    d = new Date(inputDate);
  }
  if (isNaN(d.getTime())) {
    throw new ApiError(400, 'Invalid date format provided for week calculation');
  }
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
};

/**
 * Returns ISO week format string, e.g. "2026-W45"
 */
export const getIsoWeekString = (inputDate) => {
  const date = new Date(inputDate);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  return `${new Date(firstThursday).getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
};

/**
 * Normalizes a calendar date to 00:00:00.000 UTC
 */
export const normalizeToUtcMidnight = (inputDate) => {
  if (typeof inputDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(inputDate)) {
    const parts = inputDate.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
  }
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) {
    throw new ApiError(400, 'Invalid date format provided');
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

// =========================================================================
// ROW 22.1: CLIENT SERVICES
// =========================================================================

export const createClient = async ({ clientData, user, ipAddress, userAgent }) => {
  const existingClient = await Client.findOne({
    companyName: new RegExp(`^${clientData.companyName.trim()}$`, 'i'),
    isDeleted: false
  });
  if (existingClient) {
    throw new ApiError(409, `A client with company name "${clientData.companyName}" already exists`);
  }

  const client = await Client.create(clientData);

  await recordAuditLog({
    actorId: user._id,
    action: 'CREATE',
    resource: 'Client',
    resourceId: client._id,
    description: `Registered new corporate client "${client.companyName}"`,
    ipAddress,
    userAgent
  });

  return client;
};

export const getClients = async ({ query = {} }) => {
  const { page = 1, limit = 20, search } = query;
  const filter = { isDeleted: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    Client.find(filter).sort({ companyName: 1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
    Client.countDocuments(filter)
  ]);

  return {
    data,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1
    }
  };
};

export const getClientById = async (id) => {
  const client = await Client.findOne({ _id: id, isDeleted: false }).lean();
  if (!client) {
    throw new ApiError(404, 'Client not found');
  }
  return client;
};

export const updateClient = async ({ id, updateData, user, ipAddress, userAgent }) => {
  const client = await Client.findOne({ _id: id, isDeleted: false });
  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  if (updateData.companyName && updateData.companyName !== client.companyName) {
    const duplicate = await Client.findOne({
      _id: { $ne: id },
      companyName: new RegExp(`^${updateData.companyName.trim()}$`, 'i'),
      isDeleted: false
    });
    if (duplicate) {
      throw new ApiError(409, `Another client with company name "${updateData.companyName}" already exists`);
    }
  }

  Object.assign(client, updateData);
  await client.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'UPDATE',
    resource: 'Client',
    resourceId: client._id,
    description: `Updated client profile for "${client.companyName}"`,
    ipAddress,
    userAgent
  });

  return client;
};

export const deleteClient = async ({ id, user, ipAddress, userAgent }) => {
  const client = await Client.findOne({ _id: id, isDeleted: false });
  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  const activeProjectsCount = await Project.countDocuments({ clientId: id, isDeleted: false });
  if (activeProjectsCount > 0) {
    throw new ApiError(400, `Cannot delete client with ${activeProjectsCount} active project(s). Reassign or archive projects first.`);
  }

  client.isDeleted = true;
  await client.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'DELETE',
    resource: 'Client',
    resourceId: client._id,
    description: `Soft-deleted client "${client.companyName}"`,
    ipAddress,
    userAgent
  });

  return { message: 'Client deleted successfully' };
};

// =========================================================================
// ROW 22.1: PROJECT SERVICES
// =========================================================================

export const createProject = async ({ projectData, user, ipAddress, userAgent }) => {
  const [clientExists, departmentExists, existingCode] = await Promise.all([
    Client.findOne({ _id: projectData.clientId, isDeleted: false }),
    Department.findOne({ _id: projectData.departmentId, isDeleted: false }),
    Project.findOne({ code: projectData.code.toUpperCase(), isDeleted: false })
  ]);

  if (!clientExists) {
    throw new ApiError(404, 'Selected client does not exist or has been deleted');
  }
  if (!departmentExists) {
    throw new ApiError(404, 'Selected department does not exist or has been deleted');
  }
  if (existingCode) {
    throw new ApiError(409, `Project with code "${projectData.code.toUpperCase()}" already exists`);
  }

  const project = await Project.create({
    ...projectData,
    code: projectData.code.toUpperCase()
  });

  await recordAuditLog({
    actorId: user._id,
    action: 'CREATE',
    resource: 'Project',
    resourceId: project._id,
    description: `Created project charter "${project.name}" (${project.code})`,
    ipAddress,
    userAgent
  });

  return await Project.findById(project._id)
    .populate('clientId', 'name companyName currency')
    .populate('departmentId', 'name')
    .populate('managerId', 'name email')
    .lean();
};

export const getProjects = async ({ query = {}, user, scope = 'all' }) => {
  const { page = 1, limit = 20, search, status, departmentId, clientId } = query;
  const filter = { isDeleted: false };

  // RBAC scope enforcement
  if (scope === 'own') {
    // Current user's linked employee ID or managerId
    const employee = await Employee.findOne({ userId: user._id, isDeleted: false }).select('_id');
    const empId = employee?._id;
    filter.$or = [
      { managerId: user._id },
      ...(empId ? [{ 'members.employeeId': empId }] : [])
    ];
  } else if (scope === 'department') {
    const employee = await Employee.findOne({ userId: user._id, isDeleted: false }).select('departmentId');
    if (employee?.departmentId) {
      filter.departmentId = employee.departmentId;
    }
  }

  if (status) {
    filter.status = status;
  }
  if (departmentId) {
    filter.departmentId = departmentId;
  }
  if (clientId) {
    filter.clientId = clientId;
  }
  if (search) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    });
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    Project.find(filter)
      .populate('clientId', 'name companyName currency')
      .populate('departmentId', 'name')
      .populate('managerId', 'name email')
      .populate('members.employeeId', 'name employeeId email designationId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    Project.countDocuments(filter)
  ]);

  return {
    data,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1
    }
  };
};

export const getProjectById = async (id) => {
  const project = await Project.findOne({ _id: id, isDeleted: false })
    .populate('clientId', 'name companyName currency')
    .populate('departmentId', 'name')
    .populate('managerId', 'name email')
    .populate({
      path: 'members.employeeId',
      select: 'name employeeId email designationId',
      populate: { path: 'designationId', select: 'title' }
    })
    .lean();

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
};

export const updateProject = async ({ id, updateData, user, ipAddress, userAgent }) => {
  const project = await Project.findOne({ _id: id, isDeleted: false });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (updateData.clientId) {
    const client = await Client.findOne({ _id: updateData.clientId, isDeleted: false });
    if (!client) throw new ApiError(404, 'Selected client does not exist');
  }
  if (updateData.departmentId) {
    const department = await Department.findOne({ _id: updateData.departmentId, isDeleted: false });
    if (!department) throw new ApiError(404, 'Selected department does not exist');
  }

  Object.assign(project, updateData);
  await project.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'UPDATE',
    resource: 'Project',
    resourceId: project._id,
    description: `Updated project charter details for "${project.name}" (${project.code})`,
    ipAddress,
    userAgent
  });

  return await Project.findById(project._id)
    .populate('clientId', 'name companyName currency')
    .populate('departmentId', 'name')
    .populate('managerId', 'name email')
    .populate('members.employeeId', 'name employeeId email')
    .lean();
};

export const deleteProject = async ({ id, user, ipAddress, userAgent }) => {
  const project = await Project.findOne({ _id: id, isDeleted: false });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  project.isDeleted = true;
  await project.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'DELETE',
    resource: 'Project',
    resourceId: project._id,
    description: `Soft-deleted project "${project.name}" (${project.code})`,
    ipAddress,
    userAgent
  });

  return { message: 'Project deleted successfully' };
};

// =========================================================================
// ROW 22.2: PROJECT MEMBERS ASSIGNMENT SERVICES
// =========================================================================

export const assignProjectMembers = async ({ projectId, members, user, ipAddress, userAgent }) => {
  const project = await Project.findOne({ _id: projectId, isDeleted: false });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Verify all employee IDs exist
  const employeeIds = members.map((m) => m.employeeId);
  const existingCount = await Employee.countDocuments({
    _id: { $in: employeeIds },
    isDeleted: false
  });

  if (existingCount !== employeeIds.length) {
    throw new ApiError(400, 'One or more assigned employees do not exist or have been archived');
  }

  // De-duplicate assigned members
  const uniqueMemberMap = new Map();
  for (const m of members) {
    uniqueMemberMap.set(m.employeeId.toString(), {
      employeeId: m.employeeId,
      projectRole: m.projectRole || 'Developer',
      customHourlyRatePaisa: m.customHourlyRatePaisa || 0,
      joinedAt: m.joinedAt || new Date()
    });
  }

  project.members = Array.from(uniqueMemberMap.values());
  await project.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'UPDATE',
    resource: 'Project',
    resourceId: project._id,
    description: `Assigned ${project.members.length} team member(s) to project "${project.name}" (${project.code})`,
    ipAddress,
    userAgent
  });

  return await Project.findById(project._id)
    .populate('members.employeeId', 'name employeeId email designationId')
    .lean();
};

// =========================================================================
// ROW 22.3: TIMESHEET ENTRY & DAILY 24H CAP SERVICES
// =========================================================================

export const logTimeEntry = async ({ employeeId, projectId, date, hours, taskDescription, isBillable = true, user, ipAddress, userAgent }) => {
  const targetDate = normalizeToUtcMidnight(date);

  // Guard: Cannot log time more than 7 days in the future
  const now = new Date();
  const maxFutureDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7, 23, 59, 59, 999));
  if (targetDate > maxFutureDate) {
    throw new ApiError(400, 'Cannot log timesheets for dates more than 7 days in the future');
  }

  // 1. Verify project exists and is active
  const project = await Project.findOne({ _id: projectId, isDeleted: false });
  if (!project) {
    throw new ApiError(404, 'Selected project does not exist');
  }
  if (project.status === 'completed' || project.status === 'archived') {
    throw new ApiError(400, `Cannot log time to a ${project.status} project`);
  }

  // 2. Invariant Check: Member Roster Isolation (Row 22.2)
  const isSuperAdmin = user?.roles?.includes('Super Admin');
  const isMember = project.members.some((m) => m.employeeId.toString() === employeeId.toString());
  if (!isMember && !isSuperAdmin) {
    throw new ApiError(403, 'You are not assigned to this project and cannot log time to it');
  }

  // 3. Invariant Check: Daily 24.0 Hour Cumulative Ceiling across all projects
  const existingEntriesForDay = await Timesheet.find({
    employeeId,
    date: targetDate,
    isDeleted: false
  }).lean();

  // Exclude current project's existing entry if updating
  const otherProjectsHours = existingEntriesForDay
    .filter((entry) => entry.projectId.toString() !== projectId.toString())
    .reduce((sum, entry) => sum + entry.hours, 0);

  const totalCalculatedHours = otherProjectsHours + hours;
  if (totalCalculatedHours > 24.0) {
    throw new ApiError(
      400,
      `Daily logged time across all projects cannot exceed 24.0 hours (attempted total: ${totalCalculatedHours.toFixed(2)}h)`
    );
  }

  // 4. Calculate ISO week & Monday start
  const weekNumber = getIsoWeekString(targetDate);
  const weekStartDate = getMondayOfWeek(targetDate);

  // 5. Upsert timesheet entry for (employeeId, projectId, targetDate)
  let timesheet = await Timesheet.findOne({
    employeeId,
    projectId,
    date: targetDate,
    isDeleted: false
  });

  if (timesheet) {
    if (timesheet.status === 'approved') {
      throw new ApiError(400, 'Approved timesheets are locked and cannot be modified');
    }
    timesheet.hours = hours;
    timesheet.taskDescription = taskDescription;
    timesheet.isBillable = isBillable;
    timesheet.status = 'draft'; // reset to draft on modification
    await timesheet.save();
  } else {
    timesheet = await Timesheet.create({
      employeeId,
      projectId,
      date: targetDate,
      weekNumber,
      weekStartDate,
      hours,
      taskDescription,
      isBillable,
      status: 'draft'
    });
  }

  await recordAuditLog({
    actorId: user._id,
    action: 'LOG_TIME',
    resource: 'Timesheet',
    resourceId: timesheet._id,
    description: `Logged ${hours}h on project "${project.code}" for ${targetDate.toISOString().slice(0, 10)}`,
    ipAddress,
    userAgent
  });

  return await Timesheet.findById(timesheet._id)
    .populate('projectId', 'name code billingType')
    .lean();
};

export const getMyWeeklyTimesheets = async ({ employeeId, weekStartDate }) => {
  const monday = getMondayOfWeek(weekStartDate);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000 + (23 * 60 + 59) * 60 * 1000 + 999);

  const timesheets = await Timesheet.find({
    employeeId,
    date: { $gte: monday, $lte: sunday },
    isDeleted: false
  })
    .populate('projectId', 'name code billingType')
    .sort({ date: 1 })
    .lean();

  return {
    weekStartDate: monday,
    weekNumber: getIsoWeekString(monday),
    entries: timesheets
  };
};

export const updateTimesheet = async ({ id, updateData, user, ipAddress, userAgent }) => {
  const timesheet = await Timesheet.findOne({ _id: id, isDeleted: false });
  if (!timesheet) {
    throw new ApiError(404, 'Timesheet entry not found');
  }

  // Invariant Check: Approved timesheet immutability
  if (timesheet.status === 'approved') {
    throw new ApiError(400, 'Approved timesheets are locked and cannot be modified');
  }

  // If hours updated, re-check daily 24h cap
  if (updateData.hours !== undefined && updateData.hours !== timesheet.hours) {
    const existingEntries = await Timesheet.find({
      employeeId: timesheet.employeeId,
      date: timesheet.date,
      _id: { $ne: timesheet._id },
      isDeleted: false
    }).lean();

    const otherHours = existingEntries.reduce((sum, e) => sum + e.hours, 0);
    if (otherHours + updateData.hours > 24.0) {
      throw new ApiError(
        400,
        `Daily logged time across all projects cannot exceed 24.0 hours (attempted: ${(otherHours + updateData.hours).toFixed(2)}h)`
      );
    }
  }

  Object.assign(timesheet, updateData);
  if (timesheet.status === 'rejected') {
    timesheet.status = 'draft'; // re-editing resets rejected to draft
  }
  await timesheet.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'UPDATE',
    resource: 'Timesheet',
    resourceId: timesheet._id,
    description: `Updated timesheet entry ${timesheet._id}`,
    ipAddress,
    userAgent
  });

  return await Timesheet.findById(timesheet._id).populate('projectId', 'name code billingType').lean();
};

export const deleteTimesheet = async ({ id, user, ipAddress, userAgent }) => {
  const timesheet = await Timesheet.findOne({ _id: id, isDeleted: false });
  if (!timesheet) {
    throw new ApiError(404, 'Timesheet entry not found');
  }

  // Invariant Check: Approved timesheet immutability
  if (timesheet.status === 'approved') {
    throw new ApiError(400, 'Approved timesheets are locked and cannot be deleted');
  }

  timesheet.isDeleted = true;
  await timesheet.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'DELETE',
    resource: 'Timesheet',
    resourceId: timesheet._id,
    description: `Deleted timesheet entry ${timesheet._id}`,
    ipAddress,
    userAgent
  });

  return { message: 'Timesheet entry deleted successfully' };
};

// =========================================================================
// ROW 22.4: TIMESHEET SUBMISSION & APPROVAL WORKFLOW SERVICES
// =========================================================================

export const submitWeekTimesheets = async ({ employeeId, weekStartDate, user, ipAddress, userAgent }) => {
  const monday = getMondayOfWeek(weekStartDate);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000 + (23 * 60 + 59) * 60 * 1000 + 999);

  const draftEntries = await Timesheet.find({
    employeeId,
    date: { $gte: monday, $lte: sunday },
    status: { $in: ['draft', 'rejected'] },
    isDeleted: false
  });

  if (draftEntries.length === 0) {
    throw new ApiError(400, 'No draft timesheet entries found for this calendar week to submit');
  }

  const submittedAt = new Date();
  await Timesheet.updateMany(
    {
      _id: { $in: draftEntries.map((e) => e._id) }
    },
    {
      $set: {
        status: 'submitted',
        submittedAt
      }
    }
  );

  // Notify Employee's Manager
  const employee = await Employee.findById(employeeId).populate('managerId');
  if (employee?.managerId?.userId) {
    await notify(employee.managerId.userId, {
      type: 'system',
      title: 'Timesheet Submitted for Review',
      body: `${employee.name} submitted timesheets for week starting ${monday.toISOString().slice(0, 10)}.`,
      link: '/timesheets/approvals'
    }).catch(() => {});
  }

  await recordAuditLog({
    actorId: user._id,
    action: 'SUBMIT_TIMESHEET',
    resource: 'Timesheet',
    resourceId: draftEntries[0]._id,
    description: `Submitted ${draftEntries.length} timesheet entry/entries for week ${getIsoWeekString(monday)}`,
    ipAddress,
    userAgent
  });

  return {
    message: `Successfully submitted ${draftEntries.length} timesheet entry/entries for approval`,
    submittedCount: draftEntries.length,
    weekNumber: getIsoWeekString(monday)
  };
};

export const getPendingTimesheets = async ({ query = {}, user, scope = 'team' }) => {
  const { page = 1, limit = 20, departmentId, employeeId } = query;
  const filter = { status: 'submitted', isDeleted: false };

  if (scope === 'team') {
    // Subordinates reporting directly to user
    const actorEmployee = await Employee.findOne({ userId: user._id, isDeleted: false }).select('_id');
    if (actorEmployee) {
      const subordinates = await Employee.find({ managerId: actorEmployee._id, isDeleted: false }).select('_id');
      filter.employeeId = { $in: subordinates.map((s) => s._id) };
    } else {
      filter.employeeId = { $in: [] };
    }
  } else if (scope === 'department') {
    const actorEmployee = await Employee.findOne({ userId: user._id, isDeleted: false }).select('departmentId');
    if (actorEmployee?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: actorEmployee.departmentId, isDeleted: false }).select('_id');
      filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }
  }

  if (departmentId) {
    const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).select('_id');
    filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
  }
  if (employeeId) {
    filter.employeeId = employeeId;
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    Timesheet.find(filter)
      .populate('employeeId', 'name employeeId email designationId departmentId')
      .populate('projectId', 'name code billingType')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    Timesheet.countDocuments(filter)
  ]);

  return {
    data,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1
    }
  };
};

export const decideTimesheet = async ({ id, decision, rejectionReason, user, ipAddress, userAgent }) => {
  const timesheet = await Timesheet.findOne({ _id: id, isDeleted: false });
  if (!timesheet) {
    throw new ApiError(404, 'Timesheet not found');
  }

  await assertSuperAdminIfApplicantIsHR(timesheet.employeeId, user, 'timesheet submission');

  if (timesheet.status === 'approved') {
    throw new ApiError(400, 'Timesheet is already approved and locked');
  }

  // 1. Invariant Check: Segregation of Duties (No Self-Approval)
  const actorEmployee = await Employee.findOne({ userId: user._id, isDeleted: false });
  if (actorEmployee && actorEmployee._id.toString() === timesheet.employeeId.toString()) {
    throw new ApiError(403, 'You cannot approve or reject your own timesheet submission');
  }

  // 2. Invariant Check: Department / Reporting Hierarchy Scope for non-Admin/HR
  const hasElevatedAccess = user?.roles?.some((r) =>
    typeof r === 'string'
      ? r === 'Super Admin' || r === 'HR Manager'
      : r?.name === 'Super Admin' || r?.name === 'HR Manager'
  );

  if (!hasElevatedAccess) {
    const targetEmployee = await Employee.findById(timesheet.employeeId).lean();
    if (!targetEmployee) {
      throw new ApiError(404, 'Subordinate employee record not found');
    }
    const isDirectReport = actorEmployee && targetEmployee.managerId?.toString() === actorEmployee._id.toString();
    const isSameDepartment = actorEmployee?.departmentId && targetEmployee.departmentId?.toString() === actorEmployee.departmentId.toString();

    if (!isDirectReport && !isSameDepartment) {
      throw new ApiError(403, 'You do not have authorization to decide timesheets outside your team or department');
    }
  }

  if (decision === 'approved') {
    timesheet.status = 'approved';
    timesheet.approvedBy = user._id;
    timesheet.approvedAt = new Date();
    timesheet.rejectionReason = '';
  } else if (decision === 'rejected') {
    timesheet.status = 'rejected';
    timesheet.rejectionReason = rejectionReason || 'Rejected by manager';
    timesheet.approvedBy = null;
    timesheet.approvedAt = null;
  } else {
    throw new ApiError(400, 'Invalid decision. Must be "approved" or "rejected"');
  }

  await timesheet.save();

  // Notify Employee
  const employee = await Employee.findById(timesheet.employeeId);
  if (employee?.userId) {
    await notify(employee.userId, {
      type: 'system',
      title: `Timesheet ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
      body: `Your timesheet entry for ${timesheet.date.toISOString().slice(0, 10)} was ${decision}.${decision === 'rejected' ? ` Reason: ${timesheet.rejectionReason}` : ''}`,
      link: '/timesheets/my'
    }).catch(() => {});
  }

  await recordAuditLog({
    actorId: user._id,
    action: decision === 'approved' ? 'APPROVE_TIMESHEET' : 'REJECT_TIMESHEET',
    resource: 'Timesheet',
    resourceId: timesheet._id,
    description: `Marked timesheet entry ${timesheet._id} as ${decision}`,
    ipAddress,
    userAgent
  });

  return await Timesheet.findById(timesheet._id)
    .populate('employeeId', 'name employeeId email')
    .populate('projectId', 'name code')
    .populate('approvedBy', 'name email')
    .lean();
};

// =========================================================================
// ROW 22.5: UTILIZATION REPORT SERVICES
// =========================================================================

export const getUtilizationReport = async ({ query = {}, user, scope = 'all' }) => {
  const { startDate, endDate, departmentId } = query;
  const filter = { isDeleted: false, status: 'approved' };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = normalizeToUtcMidnight(startDate);
    if (endDate) {
      const endD = new Date(endDate);
      filter.date.$lte = new Date(Date.UTC(endD.getUTCFullYear(), endD.getUTCMonth(), endD.getUTCDate(), 23, 59, 59, 999));
    }
  }

  if (scope === 'own') {
    const employee = await Employee.findOne({ userId: user._id, isDeleted: false }).select('_id');
    filter.employeeId = employee?._id;
  } else if (scope === 'department') {
    const employee = await Employee.findOne({ userId: user._id, isDeleted: false }).select('departmentId');
    if (employee?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: employee.departmentId, isDeleted: false }).select('_id');
      filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }
  }

  if (departmentId) {
    const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).select('_id');
    filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
  }

  const timesheets = await Timesheet.find(filter)
    .populate('employeeId', 'name employeeId departmentId')
    .populate('projectId', 'name code billingType')
    .lean();

  let totalBillableHours = 0;
  let totalNonBillableHours = 0;
  const employeeMap = new Map();

  for (const t of timesheets) {
    const empKey = t.employeeId?._id?.toString() || 'unknown';
    if (!employeeMap.has(empKey)) {
      employeeMap.set(empKey, {
        employeeId: t.employeeId?._id,
        name: t.employeeId?.name || 'Unknown',
        empCode: t.employeeId?.employeeId || '-',
        billableHours: 0,
        nonBillableHours: 0,
        totalHours: 0
      });
    }

    const empStats = employeeMap.get(empKey);
    if (t.isBillable) {
      totalBillableHours += t.hours;
      empStats.billableHours += t.hours;
    } else {
      totalNonBillableHours += t.hours;
      empStats.nonBillableHours += t.hours;
    }
    empStats.totalHours += t.hours;
  }

  const totalLoggedHours = totalBillableHours + totalNonBillableHours;
  const overallUtilizationRate = totalLoggedHours > 0 ? Math.round((totalBillableHours / totalLoggedHours) * 10000) / 100 : 0;

  const breakdown = Array.from(employeeMap.values()).map((emp) => ({
    ...emp,
    utilizationRate: emp.totalHours > 0 ? Math.round((emp.billableHours / emp.totalHours) * 10000) / 100 : 0
  }));

  return {
    summary: {
      totalBillableHours: Math.round(totalBillableHours * 100) / 100,
      totalNonBillableHours: Math.round(totalNonBillableHours * 100) / 100,
      totalLoggedHours: Math.round(totalLoggedHours * 100) / 100,
      overallUtilizationRate
    },
    breakdown
  };
};

// =========================================================================
// ROW 22.6: PROJECT PROFITABILITY & HOURLY COST SERVICES (Super Admin Only)
// =========================================================================

export const getProjectProfitabilityReport = async ({ user }) => {
  // Hard Invariant: Super Admin Access Guard
  const isSuperAdmin = user?.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
  if (!isSuperAdmin) {
    throw new ApiError(403, 'Project profitability analytics are strictly restricted to Super Admin');
  }

  const projects = await Project.find({ isDeleted: false })
    .populate('clientId', 'name companyName currency')
    .populate('departmentId', 'name')
    .populate('managerId', 'name email')
    .lean();

  if (projects.length === 0) {
    return [];
  }

  // Batch fetch all approved timesheets for all projects (eliminates N+1 queries)
  const projectIds = projects.map((p) => p._id);
  const allApprovedTimesheets = await Timesheet.find({
    projectId: { $in: projectIds },
    status: 'approved',
    isDeleted: false
  }).lean();

  // Batch fetch active salary structures for all distinct employees
  const uniqueEmployeeIds = [...new Set(allApprovedTimesheets.map((t) => t.employeeId.toString()))];
  const activeSalaries = await SalaryStructure.find({
    employeeId: { $in: uniqueEmployeeIds },
    status: 'active',
    isDeleted: false
  }).lean();

  const salaryMap = new Map();
  for (const s of activeSalaries) {
    salaryMap.set(s.employeeId.toString(), s);
  }

  const timesheetsByProject = new Map();
  for (const t of allApprovedTimesheets) {
    const pId = t.projectId.toString();
    if (!timesheetsByProject.has(pId)) {
      timesheetsByProject.set(pId, []);
    }
    timesheetsByProject.get(pId).push(t);
  }

  const report = [];

  for (const project of projects) {
    const timesheets = timesheetsByProject.get(project._id.toString()) || [];

    let totalLoggedHours = 0;
    let totalBillableHours = 0;
    let totalLaborCostPaisa = 0;
    let totalRevenuePaisa = 0;

    for (const entry of timesheets) {
      totalLoggedHours += entry.hours;
      if (entry.isBillable) {
        totalBillableHours += entry.hours;
      }

      // Check if project has a member custom rate or use project billing rate
      const memberConfig = project.members.find(
        (m) => m.employeeId.toString() === entry.employeeId.toString()
      );

      // Revenue Calculation
      if (entry.isBillable) {
        const billingRatePaisa = memberConfig?.customHourlyRatePaisa || project.hourlyBillingRatePaisa || 0;
        totalRevenuePaisa += Math.round(entry.hours * billingRatePaisa);
      }

      // Cost Calculation: Read from memory-mapped SalaryStructure
      // Standard Formula: basicSalary ÷ (22 workdays × 8 hours)
      const salary = salaryMap.get(entry.employeeId.toString());

      if (salary && salary.basicSalary) {
        const hourlyCostPaisa = Math.round(salary.basicSalary / (22 * 8));
        totalLaborCostPaisa += Math.round(entry.hours * hourlyCostPaisa);
      }
    }

    const grossProfitPaisa = totalRevenuePaisa - totalLaborCostPaisa;
    const profitMarginPercentage = totalRevenuePaisa > 0
      ? Math.round((grossProfitPaisa / totalRevenuePaisa) * 10000) / 100
      : 0;

    report.push({
      projectId: project._id,
      projectName: project.name,
      projectCode: project.code,
      client: project.clientId?.companyName || 'N/A',
      billingType: project.billingType,
      budgetPaisa: project.budgetPaisa || 0,
      totalLoggedHours: Math.round(totalLoggedHours * 100) / 100,
      totalBillableHours: Math.round(totalBillableHours * 100) / 100,
      totalRevenuePaisa,
      totalLaborCostPaisa,
      grossProfitPaisa,
      profitMarginPercentage,
      status: project.status
    });
  }

  return report;
};

// =========================================================================
// ROW 22.7: HR TIMESHEET COMPLIANCE SERVICES
// =========================================================================

export const getMissingTimesheets = async ({ weekStartDate, departmentId }) => {
  const monday = getMondayOfWeek(weekStartDate);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000 + (23 * 60 + 59) * 60 * 1000 + 999);

  const empFilter = { isDeleted: false, status: { $in: ['Active', 'active', 'Probation'] } };
  if (departmentId) {
    empFilter.departmentId = departmentId;
  }

  const activeEmployees = await Employee.find(empFilter)
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .populate('managerId', 'name email')
    .lean();

  const missingList = [];

  for (const emp of activeEmployees) {
    const timesheets = await Timesheet.find({
      employeeId: emp._id,
      date: { $gte: monday, $lte: sunday },
      isDeleted: false
    }).lean();

    const totalHours = timesheets.reduce((acc, t) => acc + t.hours, 0);
    const hasSubmitted = timesheets.some((t) => t.status === 'submitted' || t.status === 'approved');

    // Missing if 0 hours or not submitted or total hours < 40
    if (totalHours === 0 || !hasSubmitted || totalHours < 40) {
      missingList.push({
        employeeId: emp._id,
        name: emp.name,
        empCode: emp.employeeCode || emp.employeeId || '-',
        department: emp.departmentId?.name || 'Unassigned',
        designation: emp.designationId?.title || 'Staff',
        manager: emp.managerId?.name || 'N/A',
        totalHoursLogged: Math.round(totalHours * 100) / 100,
        hasSubmitted,
        deficitHours: Math.max(0, 40 - totalHours)
      });
    }
  }

  return {
    weekStartDate: monday,
    weekNumber: getIsoWeekString(monday),
    totalMissingCount: missingList.length,
    missingList
  };
};

export const remindMissingTimesheets = async ({ weekStartDate, employeeIds, user, ipAddress, userAgent }) => {
  const monday = getMondayOfWeek(weekStartDate);
  const weekLabel = getIsoWeekString(monday);

  const employees = await Employee.find({
    _id: { $in: employeeIds },
    isDeleted: false
  }).populate('userId');

  let remindedCount = 0;
  for (const emp of employees) {
    if (emp.userId) {
      await notify(emp.userId._id || emp.userId, {
        type: 'system',
        title: 'Timesheet Submission Reminder',
        body: `Please complete and submit your weekly timesheet for ${weekLabel}.`,
        link: '/timesheets/my'
      }).catch(() => {});
      remindedCount++;
    }
  }

  await recordAuditLog({
    actorId: user._id,
    action: 'REMIND_TIMESHEETS',
    resource: 'Timesheet',
    resourceId: user._id,
    description: `Dispatched timesheet compliance reminders to ${remindedCount} employee(s) for ${weekLabel}`,
    ipAddress,
    userAgent
  });

  return {
    message: `Reminders successfully dispatched to ${remindedCount} employee(s)`,
    remindedCount
  };
};
