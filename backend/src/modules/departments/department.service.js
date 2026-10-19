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
export const getAllDepartments = async ({ search = '', parentId, isActive, page, limit } = {}) => {
  const query = { isDeleted: false };

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
    query.parentId = parentId === 'null' || parentId === null ? null : parentId;
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
 * 4.1: Retrieve single department by ID
 * @param {string} id 
 * @returns {Object} Department document
 */
export const getDepartmentById = async (id) => {
  const department = await Department.findOne({ _id: id, isDeleted: false })
    .populate('parentId', 'name code')
    .populate({
      path: 'headId',
      select: 'email roles employeeId',
      populate: { path: 'employeeId', select: 'name employeeCode' }
    })
    .lean();

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  const headcount = await Employee.countDocuments({ departmentId: id, isDeleted: false });

  let headName = null;
  if (department.headId) {
    headName = department.headId.employeeId?.name || department.headId.email;
  }

  return {
    ...department,
    headName,
    headcount
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
 * 4.2: Retrieve active user candidates for Department Head assignment
 * @returns {Array} List of candidate users
 */
export const getHeadCandidates = async () => {
  const users = await User.find({ isDeleted: false, isActive: true })
    .select('_id email employeeId')
    .populate('employeeId', 'name employeeCode')
    .sort({ email: 1 })
    .lean();

  return users.map((u) => ({
    _id: u._id,
    email: u.email,
    name: u.employeeId?.name || u.email
  }));
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
 * 4.3: Retrieve list of designations
 */
export const getAllDesignations = async ({ departmentId, grade, isActive, page, limit, search = '' } = {}) => {
  const query = { isDeleted: false };

  if (departmentId) {
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
 * 4.3: Retrieve single designation by ID
 */
export const getDesignationById = async (id) => {
  const designation = await Designation.findOne({ _id: id, isDeleted: false })
    .populate('departmentId', 'name code')
    .lean();

  if (!designation) {
    throw new ApiError(404, 'Designation not found');
  }

  const headcount = await Employee.countDocuments({ designationId: id, isDeleted: false });
  return { ...designation, headcount };
};

/**
 * 4.3: Create new designation
 */
export const createDesignation = async (payload, actor) => {
  const { title, code, grade, departmentId, description, isActive } = payload;

  // Validate department exists
  const dept = await Department.findOne({ _id: departmentId, isDeleted: false });
  if (!dept) {
    throw new ApiError(400, 'Specified department does not exist');
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
export const getAllShifts = async ({ type, isActive, isCrossMidnight, page, limit, search = '' } = {}) => {
  const query = { isDeleted: false };

  if (type) query.type = type;
  if (isActive !== undefined) query.isActive = isActive === 'true' || isActive === true;
  if (isCrossMidnight !== undefined) query.isCrossMidnight = isCrossMidnight === 'true' || isCrossMidnight === true;
  if (search && typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    if (term) {
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }
  }

  let dbQuery = Shift.find(query).sort({ type: 1, startTime: 1 });

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
      totalPages: Math.ceil(total / limitNum)
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
 * 4.4: Retrieve single shift by ID
 */
export const getShiftById = async (id) => {
  const shift = await Shift.findOne({ _id: id, isDeleted: false }).lean();
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  const headcount = await Employee.countDocuments({ shiftId: id, isDeleted: false });
  return { ...shift, headcount };
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
    isActive = true
  } = payload;

  const existingCode = await Shift.findOne({ code: code.toUpperCase(), isDeleted: false });
  if (existingCode) {
    throw new ApiError(400, `Shift with code '${code.toUpperCase()}' already exists`);
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
    employeeMap.set(id, {
      id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      email: emp.email || '',
      phone: emp.phone || '',
      avatar: emp.avatar || '',
      department: emp.departmentId?.name || 'General',
      departmentCode: emp.departmentId?.code || '',
      designation: emp.designationId?.title || 'Team Member',
      grade: emp.designationId?.grade || 'Mid',
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
