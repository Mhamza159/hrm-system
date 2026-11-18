/**
 * @file department.service.js
 * @description Domain Service & Business Logic for Module M4 Departments, Designations, Shifts & Org Chart.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Rows 4.1 - 4.7)
 * - Layer: Service (Domain Business Logic & Data Persistence Orchestrator)
 * - Layer Invariant: Controllers never query MongoDB directly. All queries, transactions,
 *   integrity guards, and audit snapshots occur strictly inside this service.
 */

import mongoose from 'mongoose';
import { Department } from '../../models/department.model.js';
import { Designation } from '../../models/designation.model.js';
import { Shift } from '../../models/shift.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordAuditLog } from '../../services/audit.service.js';

/**
 * Escape regular expression special characters to protect MongoDB $regex against ReDoS & syntax injections
 * @param {string} str
 * @returns {string} Safe escaped string
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Check if setting targetParentId as parent of deptId would introduce a circular hierarchy.
 * @param {string} deptId 
 * @param {string} targetParentId 
 */
const detectCircularParent = async (deptId, targetParentId) => {
  if (!targetParentId) return false;
  if (deptId.toString() === targetParentId.toString()) return true;

  let currentParentId = targetParentId;
  const visited = new Set([deptId.toString()]);

  while (currentParentId) {
    if (visited.has(currentParentId.toString())) {
      return true;
    }
    visited.add(currentParentId.toString());

    const parentDept = await Department.findOne({ _id: currentParentId, isDeleted: false })
      .select('parentId')
      .lean();
    if (!parentDept || !parentDept.parentId) {
      break;
    }
    currentParentId = parentDept.parentId;
  }

  return false;
};

/**
 * 4.1: Retrieve list of departments with hierarchy, populated heads, and headcounts
 * @param {Object} queryOptions 
 * @returns {Object} List of departments and count
 */
export const getAllDepartments = async ({ search = '', parentId, isActive, isArchived, page, limit } = {}) => {
  const query = { isDeleted: false };

  // Backwards-compatible archival filter: matches both explicit false and unpopulated legacy documents
  if (isArchived !== undefined) {
    const shouldBeArchived = isArchived === 'true' || isArchived === true;
    query.isArchived = shouldBeArchived ? true : { $ne: true };
  } else {
    query.isArchived = { $ne: true };
  }

  // Idempotent background normalization of unpopulated legacy records
  Department.updateMany({ isArchived: { $exists: false } }, { $set: { isArchived: false } }).catch(() => {});

  if (search && typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }
  }

  if (parentId !== undefined) {
    if (parentId === 'null' || parentId === null) {
      query.parentId = null;
    } else if (mongoose.Types.ObjectId.isValid(parentId)) {
      query.parentId = parentId;
    }
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true' || isActive === true;
  }

  let dbQuery = Department.find(query)
    .populate('parentId', 'name code')
    .populate({
      path: 'headId',
      select: 'email roles employeeId',
      populate: { path: 'employeeId', select: 'name employeeCode' }
    })
    .sort({ name: 1 });

  let total = 0;
  let pagination = null;

  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    total = await Department.countDocuments(query);
    dbQuery = dbQuery.skip(skip).limit(limitNum);

    pagination = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  const departments = await dbQuery.lean();

  // Attach active headcount to each department
  const deptIds = departments.map((d) => d._id);
  const employeeCounts = await Employee.aggregate([
    { $match: { departmentId: { $in: deptIds }, isDeleted: false } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } }
  ]);

  const countMap = new Map();
  employeeCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  const enrichedDepartments = departments.map((dept) => {
    let headName = null;
    if (dept.headId) {
      headName = dept.headId.employeeId?.name || dept.headId.email;
    }

    return {
      ...dept,
      headName,
      headcount: countMap.get(dept._id.toString()) || 0
    };
  });

  return {
    departments: enrichedDepartments,
    total: total || enrichedDepartments.length,
    pagination
  };
};

/**
 * 4.1: Retrieve single department by ID with assigned staff roster and enriched leadership
 * @param {string} id 
 * @returns {Object} Enriched department document
 */
export const getDepartmentById = async (id) => {
  const department = await Department.findOne({ _id: id, isDeleted: false })
    .populate('parentId', 'name code')
    .populate({
      path: 'headId',
      select: 'email roles employeeId',
      populate: {
        path: 'employeeId',
        select: 'name employeeCode avatar designationId',
        populate: { path: 'designationId', select: 'title grade' }
      }
    })
    .lean();

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  // Fetch all active assigned staff members with their designations
  const employees = await Employee.find({ departmentId: id, isDeleted: false })
    .select('name employeeCode email designationId status joiningDate avatar')
    .populate('designationId', 'title grade')
    .sort({ name: 1 })
    .lean();

  let headName = null;
  let headDetails = null;
  if (department.headId) {
    headName = department.headId.employeeId?.name || department.headId.email;
    headDetails = {
      _id: department.headId._id,
      name: headName,
      email: department.headId.email,
      employeeCode: department.headId.employeeId?.employeeCode || '—',
      avatar: department.headId.employeeId?.avatar || null,
      designation: department.headId.employeeId?.designationId?.title || 'Department Head'
    };
  }

  const formattedEmployees = employees.map((emp) => ({
    _id: emp._id,
    name: emp.name,
    employeeCode: emp.employeeCode || '—',
    email: emp.email,
    designation: emp.designationId?.title || 'Staff Member',
    grade: emp.designationId?.grade || '',
    status: emp.status || 'Active',
    joiningDate: emp.joiningDate,
    avatar: emp.avatar || null
  }));

  return {
    ...department,
    headName,
    headDetails,
    headcount: employees.length,
    employees: formattedEmployees
  };
};

/**
 * 4.1: Create new department
 * @param {Object} payload 
 * @param {Object} actor 
 * @returns {Object} Created department
 */
export const createDepartment = async (payload, actor) => {
  const { name, code, description, parentId, headId, isActive } = payload;

  // Check code uniqueness
  const existingCode = await Department.findOne({ code: code.toUpperCase(), isDeleted: false });
  if (existingCode) {
    throw new ApiError(400, `Department with code '${code.toUpperCase()}' already exists`);
  }

  // Validate parentId if provided
  if (parentId) {
    const parentDept = await Department.findOne({ _id: parentId, isDeleted: false });
    if (!parentDept) {
      throw new ApiError(400, 'Specified parent department does not exist');
    }
  }

  // Validate headId if provided
  if (headId) {
    const headUser = await User.findOne({ _id: headId, isDeleted: false, isActive: true });
    if (!headUser) {
      throw new ApiError(400, 'Specified department head user does not exist or is inactive');
    }
  }

  const department = await Department.create({
    name,
    code: code.toUpperCase(),
    description: description || '',
    parentId: parentId || null,
    headId: headId || null,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: actor?._id || null
  });

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'department.create',
    entity: 'Department',
    entityId: department._id,
    after: department.toObject(),
    ip: actor?.ip,
    details: { name: department.name, code: department.code }
  });

  return department;
};

/**
 * 4.1: Update existing department
 * @param {string} id 
 * @param {Object} payload 
 * @param {Object} actor 
 * @returns {Object} Updated department
 */
export const updateDepartment = async (id, payload, actor) => {
  const department = await Department.findOne({ _id: id, isDeleted: false });
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  const beforeState = department.toObject();

  if (payload.code && payload.code.toUpperCase() !== department.code) {
    const existingCode = await Department.findOne({
      _id: { $ne: id },
      code: payload.code.toUpperCase(),
      isDeleted: false
    });
    if (existingCode) {
      throw new ApiError(400, `Department with code '${payload.code.toUpperCase()}' already exists`);
    }
    department.code = payload.code.toUpperCase();
  }

  if (payload.name) department.name = payload.name;
  if (payload.description !== undefined) department.description = payload.description;
  if (payload.isActive !== undefined) department.isActive = payload.isActive;

  if (payload.parentId !== undefined) {
    if (payload.parentId) {
      const isCircular = await detectCircularParent(id, payload.parentId);
      if (isCircular) {
        throw new ApiError(400, 'Circular department hierarchy detected. A department cannot report to its descendant.');
      }
      const parentDept = await Department.findOne({ _id: payload.parentId, isDeleted: false });
      if (!parentDept) {
        throw new ApiError(400, 'Specified parent department does not exist');
      }
      department.parentId = payload.parentId;
    } else {
      department.parentId = null;
    }
  }

  if (payload.headId !== undefined) {
    if (payload.headId) {
      const headUser = await User.findOne({ _id: payload.headId, isDeleted: false, isActive: true });
      if (!headUser) {
        throw new ApiError(400, 'Specified department head user does not exist or is inactive');
      }
      department.headId = payload.headId;
    } else {
      department.headId = null;
    }
  }

  await department.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'department.update',
    entity: 'Department',
    entityId: department._id,
    before: beforeState,
    after: department.toObject(),
    ip: actor?.ip,
    details: { changes: payload }
  });

  return department;
};

/**
 * 4.2: Retrieve active user candidates for Department Head assignment with rich profile details
 * Supports server-side search by name, email, employee code, or designation.
 * @param {Object} [options]
 * @param {string} [options.search]
 * @returns {Array} List of candidate users with full employee metadata
 */
export const getHeadCandidates = async ({ search = '' } = {}) => {
  const users = await User.find({ isDeleted: false, isActive: true })
    .select('_id email employeeId')
    .populate({
      path: 'employeeId',
      select: 'name employeeCode avatar status departmentId designationId',
      populate: [
        { path: 'designationId', select: 'title grade' },
        { path: 'departmentId', select: 'name code' }
      ]
    })
    .sort({ email: 1 })
    .lean();

  let candidates = users.map((u) => ({
    _id: u._id,
    email: u.email,
    name: u.employeeId?.name || u.email,
    employeeCode: u.employeeId?.employeeCode || '—',
    avatar: u.employeeId?.avatar || null,
    designation: u.employeeId?.designationId?.title || 'Staff Member',
    currentDepartment: u.employeeId?.departmentId?.name || 'Unassigned',
    status: u.employeeId?.status || 'Active'
  }));

  if (search && typeof search === 'string' && search.trim()) {
    const term = search.trim().toLowerCase();
    candidates = candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.employeeCode.toLowerCase().includes(term) ||
        c.designation.toLowerCase().includes(term)
    );
  }

  return candidates;
};

/**
 * 4.2: Assign or reassign department head
 * @param {string} id 
 * @param {string} headId 
 * @param {Object} actor 
 * @returns {Object} Updated department
 */
export const assignDepartmentHead = async (id, headId, actor) => {
  return await updateDepartment(id, { headId }, actor);
};

/**
 * Retrieve comprehensive department analytics & workforce distribution metrics
 * @returns {Object} Live workforce analytics, distributions, and top/lowest units
 */
export const getDepartmentAnalytics = async () => {
  const [totalDepartments, activeDepartments, archivedDepartments] = await Promise.all([
    Department.countDocuments({ isDeleted: false }),
    Department.countDocuments({ isArchived: { $ne: true }, isDeleted: false }),
    Department.countDocuments({ isArchived: true, isDeleted: false })
  ]);

  // Retrieve active departments
  const activeDepts = await Department.find({ isArchived: { $ne: true }, isDeleted: false })
    .select('_id name code headId parentId createdAt')
    .populate('parentId', 'name code')
    .populate({
      path: 'headId',
      select: 'email employeeId',
      populate: { path: 'employeeId', select: 'name employeeCode avatar designationId' }
    })
    .sort({ name: 1 })
    .lean();

  const activeIds = activeDepts.map((d) => d._id);

  // Group employee counts by department
  const employeeCounts = await Employee.aggregate([
    { $match: { departmentId: { $in: activeIds }, isDeleted: false } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } }
  ]);

  const countMap = new Map();
  let totalAssignedEmployees = 0;
  employeeCounts.forEach((c) => {
    countMap.set(c._id.toString(), c.count);
    totalAssignedEmployees += c.count;
  });

  let staffedDepartments = 0;
  let emptyDepartments = 0;
  let unassignedHeads = 0;

  const departmentBreakdown = activeDepts.map((dept) => {
    const count = countMap.get(dept._id.toString()) || 0;
    if (count > 0) staffedDepartments += 1;
    else emptyDepartments += 1;

    const hasHead = !!dept.headId;
    if (!hasHead) unassignedHeads += 1;

    const percentage = totalAssignedEmployees > 0 ? Math.round((count / totalAssignedEmployees) * 100) : 0;

    return {
      _id: dept._id,
      name: dept.name,
      code: dept.code,
      headcount: count,
      percentage,
      hasHead,
      headName: dept.headId?.employeeId?.name || dept.headId?.email || null,
      parentName: dept.parentId?.name || null
    };
  });

  // Sort by headcount desc
  const sortedByHeadcount = [...departmentBreakdown].sort((a, b) => b.headcount - a.headcount);
  const topDepartment = sortedByHeadcount[0] || null;
  const staffedUnits = sortedByHeadcount.filter((d) => d.headcount > 0);
  const lowestDepartment = staffedUnits.length > 0 ? staffedUnits[staffedUnits.length - 1] : null;

  const headAssignmentRatio = activeDepartments > 0
    ? Math.round(((activeDepartments - unassignedHeads) / activeDepartments) * 100)
    : 0;

  // Donut chart distribution segments (top 5 + other units)
  const top5 = sortedByHeadcount.slice(0, 5);
  const othersCount = sortedByHeadcount.slice(5).reduce((acc, d) => acc + d.headcount, 0);
  const workforceDistribution = top5.map((d) => ({
    name: d.name,
    code: d.code,
    count: d.headcount,
    percentage: d.percentage
  }));
  if (othersCount > 0) {
    workforceDistribution.push({
      name: 'Other Units',
      code: 'OTHER',
      count: othersCount,
      percentage: totalAssignedEmployees > 0 ? Math.round((othersCount / totalAssignedEmployees) * 100) : 0
    });
  }

  return {
    summary: {
      totalDepartments,
      activeDepartments,
      archivedDepartments,
      totalAssignedEmployees,
      staffedDepartments,
      emptyDepartments,
      unassignedHeads,
      headAssignmentRatio
    },
    departmentBreakdown,
    workforceDistribution,
    topDepartment,
    lowestDepartment
  };
};

/**
 * Retrieve aggregated department statistics for dashboard KPI cards
 * @returns {Object} Total, active, archived, withEmployees, withoutEmployees counts
 */
export const getDepartmentStats = async () => {
  const analytics = await getDepartmentAnalytics();
  return {
    total: analytics.summary.totalDepartments,
    active: analytics.summary.activeDepartments,
    archived: analytics.summary.archivedDepartments,
    totalAssignedEmployees: analytics.summary.totalAssignedEmployees,
    withEmployees: analytics.summary.staffedDepartments,
    withoutEmployees: analytics.summary.emptyDepartments,
    unassignedHeads: analytics.summary.unassignedHeads,
    headAssignmentRatio: analytics.summary.headAssignmentRatio
  };
};

/**
 * Retrieve list of archived departments with search, pagination, and assigned employee counts
 */
export const getArchivedDepartments = async ({
  search = '',
  page = 1,
  limit = 20,
  sortBy = 'archivedAt',
  sortOrder = 'desc'
} = {}) => {
  const query = { isArchived: true, isDeleted: false };

  if (search && typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortObj = { [sortBy]: sortDirection };

  const [total, departments] = await Promise.all([
    Department.countDocuments(query),
    Department.find(query)
      .populate('parentId', 'name code')
      .populate({
        path: 'headId',
        select: 'email roles employeeId',
        populate: { path: 'employeeId', select: 'name employeeCode' }
      })
      .populate('archivedBy', 'email name')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean()
  ]);

  const deptIds = departments.map((d) => d._id);
  const employeeCounts = await Employee.aggregate([
    { $match: { departmentId: { $in: deptIds }, isDeleted: false } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } }
  ]);

  const countMap = new Map();
  employeeCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  const enrichedDepartments = departments.map((dept) => {
    let headName = null;
    if (dept.headId) {
      headName = dept.headId.employeeId?.name || dept.headId.email;
    }
    const archivedByName = dept.archivedBy?.name || dept.archivedBy?.email || 'Administrator';

    return {
      ...dept,
      headName,
      archivedByName,
      headcount: countMap.get(dept._id.toString()) || 0
    };
  });

  return {
    docs: enrichedDepartments,
    departments: enrichedDepartments,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
};

/**
 * Move department to archive (cold storage)
 */
export const archiveDepartment = async (id, actor) => {
  const department = await Department.findOne({ _id: id, isDeleted: false });
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  if (department.isArchived) {
    throw new ApiError(400, `Department '${department.name}' is already archived`);
  }

  // Active Sub-Department Guard: Cannot archive department if active child sub-departments report to it
  const childDepartmentCount = await Department.countDocuments({
    parentId: id,
    isArchived: { $ne: true },
    isDeleted: false
  });

  if (childDepartmentCount > 0) {
    throw new ApiError(
      400,
      `Cannot archive department '${department.name}'. ${childDepartmentCount} active sub-department(s) report to it. Reassign or archive sub-departments first.`
    );
  }

  const beforeState = department.toObject();
  department.isArchived = true;
  department.archivedAt = new Date();
  department.archivedBy = actor?._id || null;
  await department.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'department.archive',
    entity: 'Department',
    entityId: department._id,
    before: beforeState,
    after: department.toObject(),
    ip: actor?.ip,
    details: { name: department.name, code: department.code }
  });

  return department;
};

/**
 * Restore an archived department back to active directory
 */
export const restoreDepartment = async (id, actor) => {
  const department = await Department.findOne({ _id: id, isDeleted: false });
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  if (!department.isArchived) {
    throw new ApiError(400, `Department '${department.name}' is already active`);
  }

  // Code Uniqueness Guard: Check if another active department is using the same code
  const existingCode = await Department.findOne({
    _id: { $ne: id },
    code: department.code.toUpperCase(),
    isArchived: { $ne: true },
    isDeleted: false
  });

  if (existingCode) {
    throw new ApiError(
      400,
      `Cannot restore department. Active department '${existingCode.name}' is already using code '${department.code}'.`
    );
  }

  // If parentId is archived or deleted, detach it so restored department becomes top-level
  if (department.parentId) {
    const parentDept = await Department.findOne({
      _id: department.parentId,
      isArchived: { $ne: true },
      isDeleted: false
    });
    if (!parentDept) {
      department.parentId = null;
    }
  }

  const beforeState = department.toObject();
  department.isArchived = false;
  department.archivedAt = null;
  department.archivedBy = null;
  department.isActive = true;
  await department.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'department.restore',
    entity: 'Department',
    entityId: department._id,
    before: beforeState,
    after: department.toObject(),
    ip: actor?.ip,
    details: { name: department.name, code: department.code }
  });

  return department;
};

/**
 * Permanently purge department from database
 * MANDATORY GUARD: A department must NOT be permanently deleted as long as one or more employees are assigned to it.
 */
export const permanentDeleteDepartment = async (id, actor) => {
  const department = await Department.findById(id);
  if (!department || department.isDeleted) {
    throw new ApiError(404, 'Department not found');
  }

  // CRITICAL MANDATORY BUSINESS RULE: Check employee assignment
  const assignedCount = await Employee.countDocuments({ departmentId: id });
  if (assignedCount > 0) {
    throw new ApiError(
      400,
      `This department cannot be permanently deleted because ${assignedCount} employee(s) are still assigned to it. Please reassign all employees to another department before proceeding.`
    );
  }

  // Sub-Department Guard: Check no child departments exist
  const childCount = await Department.countDocuments({ parentId: id, isDeleted: false });
  if (childCount > 0) {
    throw new ApiError(
      400,
      `Cannot permanently delete department '${department.name}'. ${childCount} sub-department(s) report to it. Reassign or delete sub-departments first.`
    );
  }

  const beforeState = department.toObject();
  await Department.deleteOne({ _id: id });

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'department.permanent_delete',
    entity: 'Department',
    entityId: id,
    before: beforeState,
    ip: actor?.ip,
    details: { name: department.name, code: department.code }
  });

  return { message: `Department '${department.name}' permanently deleted.` };
};

/**
 * 4.1: Delete department (guarded against active employees and active sub-departments)
 * @param {string} id 
 * @param {Object} actor 
 * @returns {Object} Deleted department acknowledgment
 */
export const deleteDepartment = async (id, actor) => {
  const department = await Department.findOne({ _id: id, isDeleted: false });
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  // Active Employee Guard: Cannot delete department populated with active employees
  const activeEmployeeCount = await Employee.countDocuments({
    departmentId: id,
    isDeleted: false
  });

  if (activeEmployeeCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete department '${department.name}'. ${activeEmployeeCount} active employee(s) are currently assigned to it. Reassign employees first.`
    );
  }

  // Active Sub-Department Guard: Cannot delete department if child departments exist
  const childDepartmentCount = await Department.countDocuments({
    parentId: id,
    isDeleted: false
  });

  if (childDepartmentCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete department '${department.name}'. ${childDepartmentCount} sub-department(s) report to it. Reassign or delete sub-departments first.`
    );
  }

  const beforeState = department.toObject();
  department.isDeleted = true;
  await department.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'department.delete',
    entity: 'Department',
    entityId: department._id,
    before: beforeState,
    after: department.toObject(),
    ip: actor?.ip
  });

  return { message: `Department '${department.name}' successfully deleted` };
};

/**
 * Retrieve comprehensive designation analytics & workforce distribution metrics
 * @returns {Object} Live workforce analytics, distributions, and grade/department breakdowns
 */
export const getDesignationAnalytics = async () => {
  const [totalDesignations, activeDesignations, archivedDesignations] = await Promise.all([
    Designation.countDocuments({ isDeleted: false }),
    Designation.countDocuments({ isArchived: { $ne: true }, isDeleted: false }),
    Designation.countDocuments({ isArchived: true, isDeleted: false })
  ]);

  // Retrieve active designations with populated department info
  const activeDesigs = await Designation.find({ isArchived: { $ne: true }, isDeleted: false })
    .select('_id title code grade departmentId isActive createdAt')
    .populate('departmentId', 'name code')
    .lean();

  const activeIds = activeDesigs.map((d) => d._id);

  // Group employee counts by designation
  const employeeCounts = await Employee.aggregate([
    { $match: { designationId: { $in: activeIds }, isDeleted: false } },
    { $group: { _id: '$designationId', count: { $sum: 1 } } }
  ]);

  const countMap = new Map();
  employeeCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  let totalAssignedEmployees = 0;
  let staffedDesignations = 0;
  let emptyDesignations = 0;
  const uniqueDeptIds = new Set();

  const gradeCounts = {
    Junior: { count: 0, headcount: 0 },
    Mid: { count: 0, headcount: 0 },
    Senior: { count: 0, headcount: 0 },
    Lead: { count: 0, headcount: 0 },
    Executive: { count: 0, headcount: 0 }
  };

  const departmentMap = new Map();

  const designationBreakdown = activeDesigs.map((desig) => {
    const headcount = countMap.get(desig._id.toString()) || 0;
    totalAssignedEmployees += headcount;

    if (headcount > 0) {
      staffedDesignations += 1;
    } else {
      emptyDesignations += 1;
    }

    if (desig.departmentId?._id) {
      uniqueDeptIds.add(desig.departmentId._id.toString());
    }

    // Grade breakdown
    if (gradeCounts[desig.grade]) {
      gradeCounts[desig.grade].count += 1;
      gradeCounts[desig.grade].headcount += headcount;
    }

    // Department grouping
    const deptIdStr = desig.departmentId?._id ? desig.departmentId._id.toString() : 'unassigned';
    const deptName = desig.departmentId?.name || 'Unassigned';
    if (!departmentMap.has(deptIdStr)) {
      departmentMap.set(deptIdStr, {
        departmentId: desig.departmentId?._id || null,
        name: deptName,
        code: desig.departmentId?.code || '—',
        designationCount: 0,
        headcount: 0
      });
    }
    const deptEntry = departmentMap.get(deptIdStr);
    deptEntry.designationCount += 1;
    deptEntry.headcount += headcount;

    return {
      _id: desig._id,
      title: desig.title,
      code: desig.code,
      grade: desig.grade,
      departmentId: desig.departmentId?._id || null,
      departmentName: desig.departmentId?.name || 'Unassigned',
      departmentCode: desig.departmentId?.code || '—',
      headcount,
      isActive: desig.isActive
    };
  });

  // Attach percentage of workforce to each designation
  const formattedBreakdown = designationBreakdown.map((item) => ({
    ...item,
    percentage: totalAssignedEmployees > 0 ? Number(((item.headcount / totalAssignedEmployees) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.headcount - a.headcount);

  const topDesignation = formattedBreakdown.length > 0 && formattedBreakdown[0].headcount > 0 ? formattedBreakdown[0] : null;
  const staffedList = formattedBreakdown.filter((d) => d.headcount > 0);
  const lowestDesignation = staffedList.length > 0 ? staffedList[staffedList.length - 1] : null;

  // Grade breakdown array
  const gradeBreakdown = Object.entries(gradeCounts).map(([grade, data]) => ({
    grade,
    count: data.count,
    headcount: data.headcount,
    percentage: totalAssignedEmployees > 0 ? Number(((data.headcount / totalAssignedEmployees) * 100).toFixed(1)) : 0
  }));

  // Department distribution array
  const departmentDistribution = Array.from(departmentMap.values()).map((dept) => ({
    ...dept,
    percentage: totalAssignedEmployees > 0 ? Number(((dept.headcount / totalAssignedEmployees) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.headcount - a.headcount);

  return {
    summary: {
      totalDesignations,
      activeDesignations,
      archivedDesignations,
      totalAssignedEmployees,
      staffedDesignations,
      emptyDesignations,
      uniqueDepartmentsCount: uniqueDeptIds.size
    },
    gradeBreakdown,
    departmentDistribution,
    designationBreakdown: formattedBreakdown,
    topDesignation,
    lowestDesignation
  };
};

/**
 * Retrieve 7-metric KPI statistics for designation dashboard cards
 * @returns {Object} Total, active, archived, assigned staff, staffed, empty, and departments count
 */
export const getDesignationStats = async () => {
  const analytics = await getDesignationAnalytics();
  return {
    total: analytics.summary.totalDesignations,
    active: analytics.summary.activeDesignations,
    archived: analytics.summary.archivedDesignations,
    totalAssignedEmployees: analytics.summary.totalAssignedEmployees,
    withEmployees: analytics.summary.staffedDesignations,
    withoutEmployees: analytics.summary.emptyDesignations,
    departmentsCount: analytics.summary.uniqueDepartmentsCount
  };
};

/**
 * 4.3: Retrieve list of designations
 */
export const getAllDesignations = async ({ departmentId, grade, isActive, page, limit, search = '', isArchived } = {}) => {
  // Idempotent background normalization: ensure legacy documents have isArchived: false
  Designation.updateMany({ isArchived: { $exists: false } }, { $set: { isArchived: false } }).catch(() => {});

  const query = { isDeleted: false };

  // By default, only retrieve active (non-archived) designations
  if (isArchived === 'true' || isArchived === true) {
    query.isArchived = true;
  } else if (isArchived === 'all') {
    // allow all
  } else {
    query.isArchived = { $ne: true };
  }

  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    query.departmentId = departmentId;
  }
  if (grade) {
    query.grade = grade;
  }
  if (isActive !== undefined) {
    query.isActive = isActive === 'true' || isActive === true;
  }
  if (search && typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    if (term) {
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }
  }

  let dbQuery = Designation.find(query)
    .populate('departmentId', 'name code')
    .sort({ grade: 1, title: 1 });

  let total = 0;
  let pagination = null;

  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    total = await Designation.countDocuments(query);
    dbQuery = dbQuery.skip(skip).limit(limitNum);

    pagination = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    };
  }

  const designations = await dbQuery.lean();

  // Attach active employee headcount
  const desigIds = designations.map((d) => d._id);
  const employeeCounts = await Employee.aggregate([
    { $match: { designationId: { $in: desigIds }, isDeleted: false } },
    { $group: { _id: '$designationId', count: { $sum: 1 } } }
  ]);
  const countMap = new Map();
  employeeCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  const enriched = designations.map((d) => ({
    ...d,
    headcount: countMap.get(d._id.toString()) || 0
  }));

  return {
    designations: enriched,
    total: total || enriched.length,
    pagination
  };
};

/**
 * Retrieve paginated archived designations with archive actor and headcount
 */
export const getArchivedDesignations = async ({
  search = '',
  departmentId = null,
  grade = null,
  page = 1,
  limit = 10,
  sortBy = 'archivedAt',
  sortOrder = 'desc'
} = {}) => {
  const query = { isArchived: true, isDeleted: false };

  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    query.departmentId = departmentId;
  }
  if (grade) {
    query.grade = grade;
  }
  if (search && typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    if (term) {
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  const allowedSortFields = ['title', 'code', 'grade', 'archivedAt', 'createdAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'archivedAt';
  sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

  const [total, designations] = await Promise.all([
    Designation.countDocuments(query),
    Designation.find(query)
      .populate('departmentId', 'name code')
      .populate('archivedBy', 'email name')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean()
  ]);

  const desigIds = designations.map((d) => d._id);
  const employeeCounts = await Employee.aggregate([
    { $match: { designationId: { $in: desigIds }, isDeleted: false } },
    { $group: { _id: '$designationId', count: { $sum: 1 } } }
  ]);

  const countMap = new Map();
  employeeCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  const enriched = designations.map((d) => ({
    ...d,
    archivedByName: d.archivedBy?.name || d.archivedBy?.email || 'Administrator',
    headcount: countMap.get(d._id.toString()) || 0
  }));

  return {
    docs: enriched,
    designations: enriched,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
};

/**
 * 4.3: Retrieve single designation by ID enriched with assigned staff roster
 */
export const getDesignationById = async (id) => {
  const designation = await Designation.findOne({ _id: id, isDeleted: false })
    .populate('departmentId', 'name code description')
    .populate('archivedBy', 'name email')
    .lean();

  if (!designation) {
    throw new ApiError(404, 'Designation not found');
  }

  const employees = await Employee.find({ designationId: id, isDeleted: false })
    .select('name employeeCode email departmentId status joiningDate avatar')
    .populate('departmentId', 'name code')
    .sort({ name: 1 })
    .lean();

  return {
    ...designation,
    headcount: employees.length,
    employees: employees.map((emp) => ({
      _id: emp._id,
      name: emp.name,
      employeeCode: emp.employeeCode || '—',
      email: emp.email,
      departmentName: emp.departmentId?.name || 'Unassigned',
      status: emp.status || 'Active',
      joiningDate: emp.joiningDate,
      avatar: emp.avatar || null
    }))
  };
};

/**
 * 4.3: Create new designation
 */
export const createDesignation = async (payload, actor) => {
  const { title, code, grade, departmentId, description, isActive } = payload;

  // Validate department exists and is active
  const dept = await Department.findOne({ _id: departmentId, isDeleted: false });
  if (!dept) {
    throw new ApiError(400, 'Specified department does not exist');
  }
  if (dept.isArchived) {
    throw new ApiError(400, `Cannot create designation in archived department '${dept.name}'.`);
  }

  // Check code uniqueness in department
  const existingCode = await Designation.findOne({
    code: code.toUpperCase(),
    departmentId,
    isDeleted: false
  });
  if (existingCode) {
    throw new ApiError(400, `Designation with code '${code.toUpperCase()}' already exists in this department`);
  }

  const designation = await Designation.create({
    title,
    code: code.toUpperCase(),
    grade,
    departmentId,
    description: description || '',
    isActive: isActive !== undefined ? isActive : true,
    createdBy: actor?._id || null
  });

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'designation.create',
    entity: 'Designation',
    entityId: designation._id,
    after: designation.toObject(),
    ip: actor?.ip,
    details: { title, code, grade, department: dept.name }
  });

  return designation;
};

/**
 * 4.3: Update existing designation
 */
export const updateDesignation = async (id, payload, actor) => {
  const designation = await Designation.findOne({ _id: id, isDeleted: false });
  if (!designation) {
    throw new ApiError(404, 'Designation not found');
  }

  const beforeState = designation.toObject();
  const targetDeptId = payload.departmentId || designation.departmentId;

  if (payload.departmentId) {
    const dept = await Department.findOne({ _id: payload.departmentId, isDeleted: false });
    if (!dept) {
      throw new ApiError(400, 'Specified department does not exist');
    }
    if (dept.isArchived) {
      throw new ApiError(400, `Cannot associate designation with archived department '${dept.name}'.`);
    }
    designation.departmentId = payload.departmentId;
  }

  if (payload.code && (payload.code.toUpperCase() !== designation.code || payload.departmentId)) {
    const existingCode = await Designation.findOne({
      _id: { $ne: id },
      code: payload.code.toUpperCase(),
      departmentId: targetDeptId,
      isDeleted: false
    });
    if (existingCode) {
      throw new ApiError(400, `Designation with code '${payload.code.toUpperCase()}' already exists in this department`);
    }
    designation.code = payload.code.toUpperCase();
  }

  if (payload.title) designation.title = payload.title;
  if (payload.grade) designation.grade = payload.grade;
  if (payload.description !== undefined) designation.description = payload.description;
  if (payload.isActive !== undefined) designation.isActive = payload.isActive;

  await designation.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'designation.update',
    entity: 'Designation',
    entityId: designation._id,
    before: beforeState,
    after: designation.toObject(),
    ip: actor?.ip,
    details: { changes: payload }
  });

  return designation;
};

/**
 * 4.3: Delete designation (guarded against active employees)
 */
export const deleteDesignation = async (id, actor) => {
  const designation = await Designation.findOne({ _id: id, isDeleted: false });
  if (!designation) {
    throw new ApiError(404, 'Designation not found');
  }

  // Active Employee Guard
  const activeStaffCount = await Employee.countDocuments({
    designationId: id,
    isDeleted: false
  });

  if (activeStaffCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete designation '${designation.title}'. ${activeStaffCount} active employee(s) hold this title. Reassign staff first.`
    );
  }

  const beforeState = designation.toObject();
  designation.isDeleted = true;
  await designation.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'designation.delete',
    entity: 'Designation',
    entityId: designation._id,
    before: beforeState,
    after: designation.toObject(),
    ip: actor?.ip
  });

  return { message: `Designation '${designation.title}' successfully deleted` };
};

/**
 * Move designation to archive (cold storage)
 */
export const archiveDesignation = async (id, actor) => {
  const designation = await Designation.findOne({ _id: id, isDeleted: false });
  if (!designation) {
    throw new ApiError(404, 'Designation not found');
  }

  if (designation.isArchived) {
    throw new ApiError(400, `Designation '${designation.title}' is already archived`);
  }

  const beforeState = designation.toObject();
  designation.isArchived = true;
  designation.archivedAt = new Date();
  designation.archivedBy = actor?._id || null;
  await designation.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'designation.archive',
    entity: 'Designation',
    entityId: designation._id,
    before: beforeState,
    after: designation.toObject(),
    ip: actor?.ip,
    details: { title: designation.title, code: designation.code }
  });

  return designation;
};

/**
 * Restore archived designation to active directory
 */
export const restoreDesignation = async (id, actor) => {
  const designation = await Designation.findOne({ _id: id, isDeleted: false });
  if (!designation) {
    throw new ApiError(404, 'Designation not found');
  }

  if (!designation.isArchived) {
    throw new ApiError(400, `Designation '${designation.title}' is not archived`);
  }

  // Associated department validity guard
  const dept = await Department.findOne({ _id: designation.departmentId, isDeleted: false });
  if (!dept) {
    throw new ApiError(400, 'Cannot restore designation because its associated department has been deleted.');
  }

  // Active Code Uniqueness Guard within department
  const existingActive = await Designation.findOne({
    _id: { $ne: id },
    code: designation.code,
    departmentId: designation.departmentId,
    isArchived: { $ne: true },
    isDeleted: false
  });
  if (existingActive) {
    throw new ApiError(
      400,
      `Cannot restore designation: An active designation with code '${designation.code}' already exists in this department.`
    );
  }

  const beforeState = designation.toObject();
  designation.isArchived = false;
  designation.archivedAt = null;
  designation.archivedBy = null;
  designation.isActive = true;
  await designation.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'designation.restore',
    entity: 'Designation',
    entityId: designation._id,
    before: beforeState,
    after: designation.toObject(),
    ip: actor?.ip,
    details: { title: designation.title, code: designation.code }
  });

  return designation;
};

/**
 * Permanently purge designation from database
 * MANDATORY GUARD: A designation must NOT be permanently deleted as long as one or more employees are assigned to it.
 */
export const permanentDeleteDesignation = async (id, actor) => {
  const designation = await Designation.findById(id);
  if (!designation || designation.isDeleted) {
    throw new ApiError(404, 'Designation not found');
  }

  // CRITICAL MANDATORY BUSINESS RULE: Check employee assignment
  const assignedCount = await Employee.countDocuments({ designationId: id });
  if (assignedCount > 0) {
    throw new ApiError(
      400,
      `This designation cannot be permanently deleted because ${assignedCount} employee(s) are still assigned to it. Please reassign all employees to another designation before proceeding.`
    );
  }

  const beforeState = designation.toObject();
  await Designation.deleteOne({ _id: id });

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'designation.permanent_delete',
    entity: 'Designation',
    entityId: id,
    before: beforeState,
    ip: actor?.ip,
    details: { title: designation.title, code: designation.code }
  });

  return { message: `Designation '${designation.title}' permanently deleted.` };
};

/**
 * Helper to compute cross-midnight and duration
 */
export const calculateShiftTiming = (startTime, endTime, breakMinutes = 0, type = 'fixed') => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  let isCrossMidnight = false;

  if (totalMinutes <= 0 || type === 'night') {
    totalMinutes += 24 * 60;
    isCrossMidnight = true;
  }

  if (breakMinutes >= totalMinutes) {
    throw new ApiError(400, 'Break minutes cannot exceed or equal total shift duration');
  }

  const durationMinutes = totalMinutes - breakMinutes;

  return {
    isCrossMidnight,
    durationMinutes
  };
};

/**
 * 4.4: Retrieve list of shifts
 */
export const getAllShifts = async ({ type, isActive, isCrossMidnight, departmentId, page, limit, search = '', isArchived } = {}) => {
  // Idempotent background normalization: ensure legacy documents have isArchived: false
  Shift.updateMany({ isArchived: { $exists: false } }, { $set: { isArchived: false } }).catch(() => {});

  const query = { isDeleted: false };

  // By default, only retrieve active (non-archived) shifts
  if (isArchived === 'true' || isArchived === true) {
    query.isArchived = true;
  } else if (isArchived === 'all') {
    // allow all
  } else {
    query.isArchived = { $ne: true };
  }

  if (type) query.type = type;
  if (isActive !== undefined) query.isActive = isActive === 'true' || isActive === true;
  if (isCrossMidnight !== undefined) query.isCrossMidnight = isCrossMidnight === 'true' || isCrossMidnight === true;
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    query.departmentId = departmentId;
  }
  if (search && typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }
  }

  let dbQuery = Shift.find(query)
    .populate('departmentId', 'name code')
    .populate('createdBy', 'name email')
    .sort({ type: 1, startTime: 1 });

  let total = 0;
  let pagination = null;

  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    total = await Shift.countDocuments(query);
    dbQuery = dbQuery.skip(skip).limit(limitNum);

    pagination = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    };
  }

  const shifts = await dbQuery.lean();

  // Attach active employee count assigned to this shift
  const shiftIds = shifts.map((s) => s._id);
  const employeeCounts = await Employee.aggregate([
    { $match: { shiftId: { $in: shiftIds }, isDeleted: false } },
    { $group: { _id: '$shiftId', count: { $sum: 1 } } }
  ]);
  const countMap = new Map();
  employeeCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  const enriched = shifts.map((s) => ({
    ...s,
    headcount: countMap.get(s._id.toString()) || 0
  }));

  return {
    shifts: enriched,
    total: total || enriched.length,
    pagination
  };
};

/**
 * 4.4: Retrieve list of archived shifts
 */
export const getArchivedShifts = async ({ search = '', type, departmentId, page = 1, limit = 10 } = {}) => {
  const query = { isArchived: true, isDeleted: false };

  if (type) query.type = type;
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    query.departmentId = departmentId;
  }
  if (search && typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const total = await Shift.countDocuments(query);
  const shifts = await Shift.find(query)
    .populate('departmentId', 'name code')
    .populate('archivedBy', 'name email')
    .populate('createdBy', 'name email')
    .sort({ archivedAt: -1, updatedAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const shiftIds = shifts.map((s) => s._id);
  const employeeCounts = await Employee.aggregate([
    { $match: { shiftId: { $in: shiftIds }, isDeleted: false } },
    { $group: { _id: '$shiftId', count: { $sum: 1 } } }
  ]);
  const countMap = new Map();
  employeeCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  const enriched = shifts.map((s) => ({
    ...s,
    headcount: countMap.get(s._id.toString()) || 0
  }));

  return {
    shifts: enriched,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
};

/**
 * 4.4: Work shifts analytics and distribution aggregation
 */
export const getShiftAnalytics = async () => {
  const [totalShifts, activeShifts, archivedShifts, nightShifts, totalEmployees, assignedEmployees] = await Promise.all([
    Shift.countDocuments({ isDeleted: false }),
    Shift.countDocuments({ isArchived: { $ne: true }, isDeleted: false, isActive: true }),
    Shift.countDocuments({ isArchived: true, isDeleted: false }),
    Shift.countDocuments({
      isArchived: { $ne: true },
      isDeleted: false,
      $or: [{ isCrossMidnight: true }, { type: 'night' }]
    }),
    Employee.countDocuments({ isDeleted: false }),
    Employee.countDocuments({ shiftId: { $ne: null }, isDeleted: false })
  ]);

  const activeShiftsList = await Shift.find({ isArchived: { $ne: true }, isDeleted: false })
    .populate('departmentId', 'name code')
    .lean();

  const shiftIds = activeShiftsList.map((s) => s._id);
  const employeeCounts = await Employee.aggregate([
    { $match: { shiftId: { $in: shiftIds }, isDeleted: false } },
    { $group: { _id: '$shiftId', count: { $sum: 1 } } }
  ]);
  const countMap = new Map();
  employeeCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

  let staffedShifts = 0;
  let emptyShifts = 0;
  let fixedCount = 0;
  let flexibleCount = 0;
  let nightCount = 0;
  let fixedStaff = 0;
  let flexibleStaff = 0;
  let nightStaff = 0;
  let dayShiftsCount = 0;
  let dayShiftsStaff = 0;

  const shiftHeadcounts = activeShiftsList.map((s) => {
    const headcount = countMap.get(s._id.toString()) || 0;
    if (headcount > 0) staffedShifts += 1;
    else emptyShifts += 1;

    if (s.type === 'night' || s.isCrossMidnight) {
      nightCount += 1;
      nightStaff += headcount;
    } else if (s.type === 'flexible') {
      flexibleCount += 1;
      flexibleStaff += headcount;
      dayShiftsCount += 1;
      dayShiftsStaff += headcount;
    } else {
      fixedCount += 1;
      fixedStaff += headcount;
      dayShiftsCount += 1;
      dayShiftsStaff += headcount;
    }

    return {
      _id: s._id,
      name: s.name,
      code: s.code,
      type: s.type,
      startTime: s.startTime,
      endTime: s.endTime,
      isCrossMidnight: s.isCrossMidnight,
      durationMinutes: s.durationMinutes,
      capacity: s.capacity || 0,
      headcount,
      departmentName: s.departmentId?.name || 'All Departments',
      color: s.color || '#00C471'
    };
  });

  shiftHeadcounts.sort((a, b) => b.headcount - a.headcount);

  const typeDistribution = [
    { type: 'fixed', label: 'Fixed Schedule', shiftCount: fixedCount, staffCount: fixedStaff, color: '#00C471' },
    { type: 'flexible', label: 'Flexible Hours', shiftCount: flexibleCount, staffCount: flexibleStaff, color: '#F59E0B' },
    { type: 'night', label: 'Night / Rotational', shiftCount: nightCount, staffCount: nightStaff, color: '#818CF8' }
  ];

  const dayNightRatio = {
    day: { shiftCount: dayShiftsCount, staffCount: dayShiftsStaff, label: 'Day Shifts' },
    night: { shiftCount: nightCount, staffCount: nightStaff, label: 'Night / Overnight' }
  };

  const deptMap = new Map();
  activeShiftsList.forEach((s) => {
    if (s.departmentId) {
      const dId = s.departmentId._id.toString();
      if (!deptMap.has(dId)) {
        deptMap.set(dId, { name: s.departmentId.name, code: s.departmentId.code, shiftCount: 0 });
      }
      deptMap.get(dId).shiftCount += 1;
    }
  });

  const departmentBreakdown = Array.from(deptMap.values());

  const summary = {
    totalShifts,
    activeShifts,
    archivedShifts,
    nightShifts,
    totalAssignedEmployees: assignedEmployees,
    unassignedEmployees: Math.max(0, totalEmployees - assignedEmployees),
    totalEmployees,
    staffedShifts,
    emptyShifts,
    departmentsCount: departmentBreakdown.length
  };

  return {
    summary,
    typeDistribution,
    shiftHeadcounts,
    departmentBreakdown,
    dayNightRatio
  };
};

/**
 * 4.4: Retrieve 7 live KPI statistics for shifts
 */
export const getShiftStats = async () => {
  const analytics = await getShiftAnalytics();
  return {
    total: analytics.summary.totalShifts,
    active: analytics.summary.activeShifts,
    archived: analytics.summary.archivedShifts,
    totalAssignedEmployees: analytics.summary.totalAssignedEmployees,
    unassignedEmployees: analytics.summary.unassignedEmployees,
    withEmployees: analytics.summary.staffedShifts,
    withoutEmployees: analytics.summary.emptyShifts,
    nightShifts: analytics.summary.nightShifts,
    departmentsCount: analytics.summary.departmentsCount
  };
};

/**
 * 4.4: Retrieve single shift by ID
 */
export const getShiftById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Shift not found');
  }

  const shift = await Shift.findOne({ _id: id, isDeleted: false })
    .populate('departmentId', 'name code')
    .populate('createdBy', 'name email')
    .populate('archivedBy', 'name email')
    .lean();
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  const headcount = await Employee.countDocuments({ shiftId: id, isDeleted: false });
  return { ...shift, headcount };
};

/**
 * 4.4: Retrieve assigned employee roster for a shift
 */
export const getShiftEmployees = async (id, { page = 1, limit = 10, search = '' } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Shift not found');
  }

  const shift = await Shift.findOne({ _id: id, isDeleted: false });
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  const query = { shiftId: id, isDeleted: false };
  if (search && typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { employeeCode: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ];
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const total = await Employee.countDocuments(query);
  const employees = await Employee.find(query)
    .select('name employeeCode email phone avatar departmentId designationId status joiningDate')
    .populate('departmentId', 'name code')
    .populate('designationId', 'title grade')
    .sort({ name: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    employees,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
};

/**
 * 4.4: Assign or reassign employees to a shift
 */
export const assignEmployeesToShift = async (shiftId, { employeeIds = [], action = 'add' } = {}, actor) => {
  const shift = await Shift.findOne({ _id: shiftId, isDeleted: false });
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  if (shift.isArchived) {
    throw new ApiError(400, `Cannot assign employees to shift '${shift.name}' because it is archived.`);
  }

  const validIds = employeeIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0 && action !== 'clear') {
    throw new ApiError(400, 'No valid employee IDs provided');
  }

  let modifiedCount = 0;

  if (action === 'clear') {
    const res = await Employee.updateMany(
      { shiftId: shift._id, isDeleted: false },
      { $set: { shiftId: null } }
    );
    modifiedCount = res.modifiedCount;
  } else if (action === 'remove') {
    const res = await Employee.updateMany(
      { _id: { $in: validIds }, shiftId: shiftId, isDeleted: false },
      { $set: { shiftId: null } }
    );
    modifiedCount = res.modifiedCount;
  } else if (action === 'set') {
    if (shift.capacity > 0 && validIds.length > shift.capacity) {
      throw new ApiError(400, `Cannot assign ${validIds.length} employees. Shift capacity is ${shift.capacity}.`);
    }
    await Employee.updateMany(
      { shiftId: shiftId, isDeleted: false },
      { $set: { shiftId: null } }
    );
    const res = await Employee.updateMany(
      { _id: { $in: validIds }, isDeleted: false },
      { $set: { shiftId: shift._id } }
    );
    modifiedCount = res.modifiedCount;
  } else {
    // action == 'add'
    if (shift.capacity > 0) {
      const currentCount = await Employee.countDocuments({ shiftId: shift._id, isDeleted: false });
      const newAssignmentsCount = await Employee.countDocuments({
        _id: { $in: validIds },
        shiftId: { $ne: shift._id },
        isDeleted: false
      });
      if (currentCount + newAssignmentsCount > shift.capacity) {
        throw new ApiError(
          400,
          `Cannot add ${newAssignmentsCount} employees. Total will exceed shift capacity of ${shift.capacity} (Current: ${currentCount}).`
        );
      }
    }
    const res = await Employee.updateMany(
      { _id: { $in: validIds }, isDeleted: false },
      { $set: { shiftId: shift._id } }
    );
    modifiedCount = res.modifiedCount;
  }

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'shift.assign_employees',
    entity: 'Shift',
    entityId: shift._id,
    ip: actor?.ip,
    details: { shiftName: shift.name, action, employeeCount: validIds.length, modifiedCount }
  });

  const updatedHeadcount = await Employee.countDocuments({ shiftId: shift._id, isDeleted: false });

  return {
    message: `Successfully updated shift assignments for '${shift.name}'.`,
    modifiedCount,
    headcount: updatedHeadcount
  };
};

/**
 * 4.4: Soft-archive a shift
 */
export const archiveShift = async (id, actor) => {
  const shift = await Shift.findOne({ _id: id, isDeleted: false });
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  if (shift.isArchived) {
    throw new ApiError(400, `Shift '${shift.name}' is already archived`);
  }

  const beforeState = shift.toObject();
  shift.isArchived = true;
  shift.archivedAt = new Date();
  shift.archivedBy = actor?._id || null;
  await shift.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'shift.archive',
    entity: 'Shift',
    entityId: shift._id,
    before: beforeState,
    after: shift.toObject(),
    ip: actor?.ip,
    details: { name: shift.name, code: shift.code }
  });

  return shift;
};

/**
 * 4.4: Restore an archived shift
 */
export const restoreShift = async (id, actor) => {
  const shift = await Shift.findOne({ _id: id, isDeleted: false });
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  if (!shift.isArchived) {
    throw new ApiError(400, `Shift '${shift.name}' is not archived`);
  }

  // Active Code Uniqueness Guard
  const existingActive = await Shift.findOne({
    _id: { $ne: id },
    code: shift.code,
    isArchived: { $ne: true },
    isDeleted: false
  });
  if (existingActive) {
    throw new ApiError(
      400,
      `Cannot restore shift: An active shift with code '${shift.code}' already exists.`
    );
  }

  // If department association exists, verify department is not deleted or archived
  if (shift.departmentId) {
    const dept = await Department.findOne({ _id: shift.departmentId, isDeleted: false });
    if (!dept || dept.isArchived) {
      shift.departmentId = null; // Unlink deleted or archived department gracefully
    }
  }

  const beforeState = shift.toObject();
  shift.isArchived = false;
  shift.archivedAt = null;
  shift.archivedBy = null;
  shift.isActive = true;
  await shift.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'shift.restore',
    entity: 'Shift',
    entityId: shift._id,
    before: beforeState,
    after: shift.toObject(),
    ip: actor?.ip,
    details: { name: shift.name, code: shift.code }
  });

  return shift;
};

/**
 * 4.4: Permanently purge shift from database
 * MANDATORY GUARD: A shift must NOT be permanently deleted as long as one or more employees are assigned to it.
 */
export const permanentDeleteShift = async (id, actor) => {
  const shift = await Shift.findById(id);
  if (!shift || shift.isDeleted) {
    throw new ApiError(404, 'Shift not found');
  }

  // CRITICAL MANDATORY BUSINESS RULE: Check employee assignment
  const assignedCount = await Employee.countDocuments({ shiftId: id, isDeleted: false });
  if (assignedCount > 0) {
    throw new ApiError(
      400,
      `This shift cannot be permanently deleted because ${assignedCount} employee(s) are currently assigned to it. Please reassign all employees to another shift before proceeding.`
    );
  }

  const beforeState = shift.toObject();
  await Shift.deleteOne({ _id: id });

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'shift.permanent_delete',
    entity: 'Shift',
    entityId: id,
    before: beforeState,
    ip: actor?.ip,
    details: { name: shift.name, code: shift.code }
  });

  return { message: `Shift '${shift.name}' permanently deleted.` };
};

/**
 * 4.4: Create new shift with cross-midnight calculation
 */
export const createShift = async (payload, actor) => {
  const {
    name,
    code,
    type = 'fixed',
    startTime,
    endTime,
    graceMinutes = 15,
    breakMinutes = 60,
    halfDayMinutes = 240,
    workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    departmentId = null,
    capacity = 0,
    description = '',
    color = '#00C471',
    isActive = true
  } = payload;

  const existingCode = await Shift.findOne({ code: code.toUpperCase(), isDeleted: false });
  if (existingCode) {
    throw new ApiError(400, `Shift with code '${code.toUpperCase()}' already exists`);
  }

  if (departmentId) {
    const dept = await Department.findOne({ _id: departmentId, isDeleted: false });
    if (!dept) {
      throw new ApiError(404, 'Associated department not found');
    }
    if (dept.isArchived) {
      throw new ApiError(400, `Cannot associate shift with department '${dept.name}' because it is archived.`);
    }
  }

  const { isCrossMidnight, durationMinutes } = calculateShiftTiming(startTime, endTime, breakMinutes, type);

  const shift = await Shift.create({
    name,
    code: code.toUpperCase(),
    type,
    startTime,
    endTime,
    graceMinutes,
    breakMinutes,
    halfDayMinutes,
    workDays,
    departmentId: departmentId || null,
    capacity: Math.max(0, Number(capacity) || 0),
    description: description || '',
    color: color || '#00C471',
    isCrossMidnight,
    durationMinutes,
    isActive,
    createdBy: actor?._id || null
  });

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'shift.create',
    entity: 'Shift',
    entityId: shift._id,
    after: shift.toObject(),
    ip: actor?.ip,
    details: { name, code, type, isCrossMidnight, durationMinutes }
  });

  return shift;
};

/**
 * 4.4: Update existing shift
 */
export const updateShift = async (id, payload, actor) => {
  const shift = await Shift.findOne({ _id: id, isDeleted: false });
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  const beforeState = shift.toObject();

  if (payload.code && payload.code.toUpperCase() !== shift.code) {
    const existingCode = await Shift.findOne({
      _id: { $ne: id },
      code: payload.code.toUpperCase(),
      isDeleted: false
    });
    if (existingCode) {
      throw new ApiError(400, `Shift with code '${payload.code.toUpperCase()}' already exists`);
    }
    shift.code = payload.code.toUpperCase();
  }

  if (payload.departmentId !== undefined) {
    if (payload.departmentId) {
      const dept = await Department.findOne({ _id: payload.departmentId, isDeleted: false });
      if (!dept) {
        throw new ApiError(404, 'Associated department not found');
      }
      if (dept.isArchived) {
        throw new ApiError(400, `Cannot associate shift with department '${dept.name}' because it is archived.`);
      }
      shift.departmentId = payload.departmentId;
    } else {
      shift.departmentId = null;
    }
  }

  if (payload.capacity !== undefined) shift.capacity = Math.max(0, Number(payload.capacity) || 0);
  if (payload.description !== undefined) shift.description = payload.description;
  if (payload.color !== undefined) shift.color = payload.color;
  if (payload.name) shift.name = payload.name;
  if (payload.type) shift.type = payload.type;
  if (payload.startTime) shift.startTime = payload.startTime;
  if (payload.endTime) shift.endTime = payload.endTime;
  if (payload.graceMinutes !== undefined) shift.graceMinutes = payload.graceMinutes;
  if (payload.breakMinutes !== undefined) shift.breakMinutes = payload.breakMinutes;
  if (payload.halfDayMinutes !== undefined) shift.halfDayMinutes = payload.halfDayMinutes;
  if (payload.workDays) shift.workDays = payload.workDays;
  if (payload.isActive !== undefined) shift.isActive = payload.isActive;

  const { isCrossMidnight, durationMinutes } = calculateShiftTiming(
    shift.startTime,
    shift.endTime,
    shift.breakMinutes,
    shift.type
  );
  shift.isCrossMidnight = isCrossMidnight;
  shift.durationMinutes = durationMinutes;

  await shift.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'shift.update',
    entity: 'Shift',
    entityId: shift._id,
    before: beforeState,
    after: shift.toObject(),
    ip: actor?.ip,
    details: { changes: payload }
  });

  return shift;
};

/**
 * 4.4: Delete shift (guarded against active employees)
 */
export const deleteShift = async (id, actor) => {
  const shift = await Shift.findOne({ _id: id, isDeleted: false });
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  // Active Employee Guard
  const activeStaffCount = await Employee.countDocuments({
    shiftId: id,
    isDeleted: false
  });

  if (activeStaffCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete shift '${shift.name}'. ${activeStaffCount} active employee(s) are assigned to this shift. Reassign staff first.`
    );
  }

  const beforeState = shift.toObject();
  shift.isDeleted = true;
  await shift.save();

  await recordAuditLog({
    userId: actor?._id,
    actor,
    action: 'shift.delete',
    entity: 'Shift',
    entityId: shift._id,
    before: beforeState,
    after: shift.toObject(),
    ip: actor?.ip
  });

  return { message: `Shift '${shift.name}' successfully deleted` };
};

/**
 * 4.5 & 4.7: Retrieve hierarchical organizational chart with DAG cycle prevention, reporting chain, and role-based data scoping
 * @param {string} requestingUserId 
 * @param {string} [permissionScope='all'] - 'all' | 'department' | 'team' | 'own'
 * @param {Object} [actor=null] - Authenticated user context
 * @returns {Object} { tree, reportingChain, totalNodes }
 */
export const getOrgChart = async (requestingUserId, permissionScope = 'all', actor = null) => {
  const employees = await Employee.find({ isDeleted: false })
    .select('name employeeCode email phone departmentId designationId managerId userId status avatar')
    .populate('departmentId', 'name code')
    .populate('designationId', 'title grade')
    .lean();

  if (!employees.length) {
    return {
      tree: [],
      reportingChain: [],
      totalNodes: 0
    };
  }

  // Find requesting user's employee record to build vertical reportingChain
  let userEmployeeId = null;
  let userEmp = employees.find(
    (e) => e.userId?.toString() === requestingUserId?.toString()
  );
  if (!userEmp && actor?.employeeId) {
    userEmp = employees.find(
      (e) => e._id?.toString() === actor.employeeId?.toString()
    );
  }
  if (userEmp) {
    userEmployeeId = userEmp._id.toString();
  }

  // If user is restricted to team or department but has no employee profile, return empty
  if ((permissionScope === 'team' || permissionScope === 'department') && !userEmp) {
    return {
      tree: [],
      reportingChain: [],
      totalNodes: 0
    };
  }

  // Filter employees according to permissionScope:
  // - 'department': only employees belonging to the requesting user's department
  // - 'team', 'own', 'all': handled via tree rooting and traversal below
  let scopedEmployees = employees;
  let userDeptId = null;
  if (permissionScope === 'department' && userEmp) {
    userDeptId = userEmp.departmentId?._id?.toString() || userEmp.departmentId?.toString();
    if (!userDeptId) {
      return {
        tree: [],
        reportingChain: [],
        totalNodes: 0
      };
    }
    scopedEmployees = employees.filter((emp) => {
      const empDeptId = emp.departmentId?._id?.toString() || emp.departmentId?.toString();
      return empDeptId === userDeptId;
    });
  }

  // 1. Build lookup maps for scoped employees
  const employeeMap = new Map();
  const childrenMap = new Map();

  for (const emp of scopedEmployees) {
    const id = emp._id.toString();
    const isRootExecutive = emp.employeeCode === 'EMP-000' || !emp.managerId;
    employeeMap.set(id, {
      id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      email: emp.email || '',
      phone: emp.phone || '',
      avatar: emp.avatar || '',
      department: emp.departmentId?.name || (isRootExecutive ? 'Executive Management' : 'General'),
      departmentCode: emp.departmentId?.code || (isRootExecutive ? 'EXEC' : ''),
      designation: emp.designationId?.title || (isRootExecutive ? 'Chief Executive Officer' : 'Team Member'),
      grade: emp.designationId?.grade || (isRootExecutive ? 'Executive' : 'Mid'),
      status: emp.status || 'Active',
      userId: emp.userId ? emp.userId.toString() : null,
      managerId: emp.managerId ? emp.managerId.toString() : null,
      isMe: emp.userId ? emp.userId.toString() === requestingUserId?.toString() : (userEmployeeId ? id === userEmployeeId : false)
    });

    const mId = emp.managerId ? emp.managerId.toString() : 'ROOT';
    if (!childrenMap.has(mId)) {
      childrenMap.set(mId, []);
    }
    childrenMap.get(mId).push(id);
  }

  // 2. Resolve manager name and designation for all nodes
  for (const [id, node] of employeeMap.entries()) {
    if (node.managerId && employeeMap.has(node.managerId)) {
      const mgr = employeeMap.get(node.managerId);
      node.managerName = mgr.name;
      node.managerDesignation = mgr.designation;
    } else {
      node.managerName = null;
      node.managerDesignation = null;
    }
  }

  // 3. Identify Root nodes based on scope
  const rootIds = [];
  if (permissionScope === 'team' && userEmployeeId && employeeMap.has(userEmployeeId)) {
    // For team scope: Manager is the sole root of their team tree
    rootIds.push(userEmployeeId);
  } else if (permissionScope === 'department') {
    // For department scope: Roots are nodes whose manager is either not in this department,
    // or is null, or not in active department employees
    for (const [id, node] of employeeMap.entries()) {
      if (!node.managerId || !employeeMap.has(node.managerId)) {
        rootIds.push(id);
      }
    }
  } else {
    // For 'all' and 'own': Global roots (managerId is null or not in active employees)
    for (const [id, node] of employeeMap.entries()) {
      if (!node.managerId || !employeeMap.has(node.managerId)) {
        rootIds.push(id);
      }
    }
  }

  // 4. Recursive tree builder with DAG cycle prevention
  const buildSubtree = (nodeId, visitedPath = new Set()) => {
    if (visitedPath.has(nodeId)) {
      // Cycle detected: prune branch to prevent stack overflow
      return null;
    }

    const node = employeeMap.get(nodeId);
    if (!node) return null;

    const nextVisited = new Set(visitedPath);
    nextVisited.add(nodeId);

    const childIds = childrenMap.get(nodeId) || [];
    const children = [];

    for (const childId of childIds) {
      const childNode = buildSubtree(childId, nextVisited);
      if (childNode) {
        children.push(childNode);
      }
    }

    return {
      ...node,
      directReportsCount: children.length,
      children
    };
  };

  const tree = rootIds
    .map((rootId) => buildSubtree(rootId, new Set()))
    .filter(Boolean);

  // 5. Compute reportingChain (Slice 4.7): ancestral path upwards from user to root
  const reportingChain = [];
  if (userEmployeeId && employeeMap.has(userEmployeeId)) {
    let curr = employeeMap.get(userEmployeeId);
    const chainVisited = new Set();
    while (curr && !chainVisited.has(curr.id)) {
      reportingChain.unshift(curr.id);
      chainVisited.add(curr.id);
      curr = curr.managerId && employeeMap.has(curr.managerId)
        ? employeeMap.get(curr.managerId)
        : null;
    }
  }

  // 6. Calculate totalNodes for the rendered hierarchy
  const countNodes = (nodes) => {
    let count = 0;
    for (const n of nodes) {
      count += 1;
      if (n.children?.length) {
        count += countNodes(n.children);
      }
    }
    return count;
  };
  const totalNodes = countNodes(tree);

  return {
    tree,
    reportingChain,
    totalNodes
  };
};

/**
 * 4.6: Retrieve manager's direct team members and subordinate shift distribution
 * @param {string} managerUserId 
 * @returns {Object} Direct team details
 */
export const getMyTeam = async (managerUserId) => {
  // 1. Locate manager's employee record
  let managerEmployee = await Employee.findOne({ userId: managerUserId, isDeleted: false })
    .populate('departmentId', 'name code')
    .populate('designationId', 'title grade')
    .lean();

  let directReports = [];

  if (managerEmployee) {
    directReports = await Employee.find({
      managerId: managerEmployee._id,
      isDeleted: false
    })
      .select('name employeeCode email phone joiningDate status departmentId designationId shiftId avatar')
      .populate('departmentId', 'name code')
      .populate('designationId', 'title grade')
      .populate('shiftId', 'name startTime endTime type isCrossMidnight')
      .sort({ name: 1 })
      .lean();
  }

  return {
    manager: managerEmployee
      ? {
          name: managerEmployee.name,
          employeeCode: managerEmployee.employeeCode,
          avatar: managerEmployee.avatar || '',
          department: managerEmployee.departmentId?.name || '',
          designation: managerEmployee.designationId?.title || ''
        }
      : null,
    directReports: directReports.map((emp) => ({
      _id: emp._id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      email: emp.email || '',
      phone: emp.phone || '',
      avatar: emp.avatar || '',
      joiningDate: emp.joiningDate,
      status: emp.status,
      department: emp.departmentId?.name || '',
      designation: emp.designationId?.title || '',
      grade: emp.designationId?.grade || 'Mid',
      shift: emp.shiftId
        ? {
            name: emp.shiftId.name,
            startTime: emp.shiftId.startTime,
            endTime: emp.shiftId.endTime,
            type: emp.shiftId.type,
            isCrossMidnight: emp.shiftId.isCrossMidnight
          }
        : null
    })),
    totalCount: directReports.length
  };
};
