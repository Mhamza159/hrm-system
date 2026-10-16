/**
 * @file employee.service.js
 * @description Core Domain Service for Employee Management (Module M3).
 * 
 * SPECIFICATION & LIFECYCLE:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.1 to 3.17)
 * - Layer: Service (Domain business logic & Mongoose operations)
 * - Integrates: AES-256-GCM encryption, CASL scope filters, Audit logging, Nodemailer.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcrypt';
import ExcelJS from 'exceljs';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { Role } from '../../models/role.model.js';
import { Department } from '../../models/department.model.js';
import { Designation } from '../../models/designation.model.js';
import { EmployeeHistory } from '../../models/employeeHistory.model.js';
import { ProfileChangeRequest } from '../../models/profileChangeRequest.model.js';
import { encrypt, decrypt } from '../../utils/crypto.js';
import { ApiError } from '../../utils/ApiError.js';
import { paginate } from '../../utils/paginate.js';
import { scopeFilter } from '../../utils/scopeFilter.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { emailService } from '../../services/email.service.js';

/**
 * Decrypt sensitive fields (CNIC and IBAN) on an employee object
 * @param {Object} employeeDoc
 * @returns {Object}
 */
const decryptEmployeeFields = (employeeDoc) => {
  if (!employeeDoc) return employeeDoc;
  const emp = employeeDoc.toObject ? employeeDoc.toObject() : { ...employeeDoc };

  if (emp.cnic) {
    try {
      emp.cnic = decrypt(emp.cnic);
    } catch {
      // keep as is if decryption fails
    }
  }

  if (emp.bankDetails?.iban) {
    try {
      emp.bankDetails.iban = decrypt(emp.bankDetails.iban);
    } catch {
      // keep as is if decryption fails
    }
  }

  return emp;
};

/**
 * Automatically compute the next sequential, conflict-free Employee Code (e.g. EMP-0001, EMP-0002)
 * @returns {Promise<string>}
 */
export const generateNextEmployeeCode = async () => {
  const employees = await Employee.find(
    { employeeCode: { $regex: /^EMP-\d+$/i } },
    'employeeCode'
  ).lean();

  let maxNum = 0;
  for (const emp of employees) {
    if (emp.employeeCode) {
      const match = emp.employeeCode.match(/^EMP-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let candidateNum = maxNum + 1;
  let candidateCode = `EMP-${String(candidateNum).padStart(4, '0')}`;

  // Fallback verification loop to strictly guarantee no duplicate code
  while (await Employee.exists({ employeeCode: candidateCode })) {
    candidateNum += 1;
    candidateCode = `EMP-${String(candidateNum).padStart(4, '0')}`;
  }

  return candidateCode;
};

/**
 * Create a new employee with optional user account provisioning
 * @param {Object} payload 
 * @param {Object} actor 
 * @returns {Promise<Object>}
 */
export const createEmployee = async (payload, actor) => {
  // 1. Resolve & guarantee unique employeeCode
  if (!payload.employeeCode || !String(payload.employeeCode).trim()) {
    payload.employeeCode = await generateNextEmployeeCode();
  } else {
    payload.employeeCode = String(payload.employeeCode).trim().toUpperCase();
    const existingCode = await Employee.findOne({ employeeCode: payload.employeeCode });
    if (existingCode) {
      throw new ApiError(400, `Employee code '${payload.employeeCode}' is already registered`);
    }
  }

  // 2. Check uniqueness of email if provided
  if (payload.email) {
    const existingEmail = await Employee.findOne({ email: payload.email, isDeleted: false });
    if (existingEmail) {
      throw new ApiError(400, `Email '${payload.email}' is already assigned to an employee`);
    }
  }

  // 3. Encrypt sensitive fields
  const employeeData = { ...payload };
  if (employeeData.cnic) {
    employeeData.cnic = encrypt(employeeData.cnic);
  }
  if (employeeData.bankDetails?.iban) {
    employeeData.bankDetails = {
      ...employeeData.bankDetails,
      iban: encrypt(employeeData.bankDetails.iban)
    };
  }

  // 4. Provision User account if createAccount is requested
  let provisionedUserId = null;
  let tempPassword = null;

  if (payload.createAccount && payload.email) {
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      throw new ApiError(400, `User account with email '${payload.email}' already exists`);
    }

    // Locate standard 'Employee' role
    const employeeRole = await Role.findOne({ name: 'Employee' });
    const roleIds = employeeRole ? [employeeRole._id] : [];

    // Generate secure 10-character temporary password
    tempPassword = `Tmp@${crypto.randomBytes(4).toString('hex')}1`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const newUser = await User.create({
      email: payload.email,
      passwordHash,
      roles: roleIds,
      isActive: true,
      mustChangePassword: true
    });

    provisionedUserId = newUser._id;
  }

  if (provisionedUserId) {
    employeeData.userId = provisionedUserId;
  }

  // 5. Persist Employee in MongoDB
  let employee;
  try {
    employee = await Employee.create(employeeData);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.employeeCode) {
      employeeData.employeeCode = await generateNextEmployeeCode();
      employee = await Employee.create(employeeData);
    } else {
      throw err;
    }
  }

  // Link employeeId back onto User record
  if (provisionedUserId) {
    await User.findByIdAndUpdate(provisionedUserId, { employeeId: employee._id });

    // 6. Dispatch welcome email with temporary password
    try {
      await emailService.sendWelcomeOnboardingEmail(
        payload.email,
        payload.name,
        tempPassword
      );
    } catch (mailErr) {
      console.error('Welcome email dispatch failed:', mailErr.message);
    }
  }

  // 7. Audit Log
  await recordAuditLog({
    actor,
    action: 'employee.create',
    entity: 'Employee',
    entityId: employee._id,
    after: employee.toObject()
  });

  return decryptEmployeeFields(employee);
};

/**
 * Scoped Employee Directory query with faceted search and pagination
 * @param {Object} filterOptions
 * @param {Object} actor
 * @param {string} permissionScope
 * @returns {Promise<Object>}
 */
export const getEmployees = async (
  { page = 1, limit = 10, search, departmentId, designationId, status, employmentType, skill },
  actor,
  permissionScope = 'all'
) => {
  // 1. Resolve horizontal data scope query conditions
  const conditions = { isDeleted: false };

  if (permissionScope === 'own') {
    conditions.$or = [
      { userId: actor._id },
      { _id: actor.employeeId }
    ];
  } else if (permissionScope === 'department') {
    let actorDept = actor.departmentId;
    if (!actorDept && actor.employeeId) {
      const actorEmp = await Employee.findById(actor.employeeId).select('departmentId').lean();
      if (actorEmp) actorDept = actorEmp.departmentId;
    } else if (!actorDept && actor._id) {
      const actorEmp = await Employee.findOne({ userId: actor._id }).select('departmentId').lean();
      if (actorEmp) actorDept = actorEmp.departmentId;
    }
    conditions.departmentId = actorDept;
  } else if (permissionScope === 'team') {
    conditions.$or = [
      { managerId: actor.employeeId },
      { managerId: actor._id }
    ];
  }

  // 2. Apply explicit search term with regex sanitization (ReDoS defense)
  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    conditions.$and = conditions.$and || [];
    conditions.$and.push({
      $or: [
        { name: searchRegex },
        { employeeCode: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ]
    });
  }

  // 3. Faceted filters
  if (departmentId) conditions.departmentId = departmentId;
  if (designationId) conditions.designationId = designationId;
  if (status) conditions.status = status;
  if (employmentType) conditions.employmentType = employmentType;
  if (skill) conditions.skills = { $in: [skill.trim()] };

  // 4. Paginate query
  const result = await paginate(Employee, conditions, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    populate: [
      { path: 'departmentId', select: 'name code' },
      { path: 'designationId', select: 'title code grade' },
      { path: 'shiftId', select: 'name code startTime endTime type' },
      { path: 'managerId', select: 'name employeeCode email' },
      { path: 'userId', select: 'email isActive roles', populate: { path: 'roles', select: 'name' } }
    ],
    sort: { createdAt: -1 }
  });

  // 5. Decrypt or sanitize fields depending on permissions
  const canViewFinancials =
    permissionScope === 'all' ||
    actor.roles?.some((r) => r.name === 'Super Admin' || r.name === 'HR Manager');

  const items = (result.docs || []).map((emp) => {
    if (canViewFinancials) {
      return decryptEmployeeFields(emp);
    }
    // Mask sensitive fields
    const sanitized = { ...emp };
    delete sanitized.bankDetails;
    if (sanitized.cnic) {
      sanitized.cnic = '35202-*******-1';
    }
    return sanitized;
  });

  return {
    items,
    total: result.meta?.totalDocs || 0,
    page: result.meta?.page || 1,
    limit: result.meta?.limit || 10,
    totalPages: result.meta?.totalPages || 1
  };
};

/**
 * Retrieve comprehensive employee profile by ID
 * @param {string} id
 * @param {Object} actor
 * @param {string} permissionScope
 * @returns {Promise<Object>}
 */
export const getEmployeeById = async (id, actor, permissionScope = 'all') => {
  const employee = await Employee.findOne({ _id: id, isDeleted: false }).populate([
    { path: 'departmentId', select: 'name code description headId' },
    { path: 'designationId', select: 'title code grade description' },
    { path: 'shiftId', select: 'name code startTime endTime graceMinutes type' },
    { path: 'managerId', select: 'name employeeCode email phone' },
    { path: 'userId', select: 'email isActive lastLoginAt roles' }
  ]);

  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  // Enforce horizontal access boundary
  const isOwn =
    String(employee.userId?._id || employee.userId) === String(actor._id) ||
    String(employee._id) === String(actor.employeeId);

  if (permissionScope === 'own' && !isOwn) {
    throw new ApiError(403, 'Forbidden: You can only view your own employee profile');
  }

  if (permissionScope === 'department' && !isOwn) {
    let actorDepartmentId = actor.departmentId;
    if (!actorDepartmentId && actor.employeeId) {
      const actorEmp = await Employee.findById(actor.employeeId).select('departmentId').lean();
      if (actorEmp) actorDepartmentId = actorEmp.departmentId;
    } else if (!actorDepartmentId && actor._id) {
      const actorEmp = await Employee.findOne({ userId: actor._id }).select('departmentId').lean();
      if (actorEmp) actorDepartmentId = actorEmp.departmentId;
    }

    if (String(employee.departmentId?._id || employee.departmentId) !== String(actorDepartmentId)) {
      throw new ApiError(403, 'Forbidden: You can only view employees in your department');
    }
  }

  const canViewFinancials =
    isOwn ||
    actor.roles?.some((r) => r.name === 'Super Admin' || r.name === 'HR Manager');

  if (canViewFinancials) {
    return decryptEmployeeFields(employee);
  }

  const sanitized = employee.toObject();
  delete sanitized.bankDetails;
  if (sanitized.cnic) {
    sanitized.cnic = '35202-*******-1';
  }
  return sanitized;
};

/**
 * Retrieve authenticated user's own linked employee profile
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export const getMyProfile = async (userId) => {
  const user = await User.findById(userId);

  const queryOr = [{ userId }];
  if (user?.employeeId) {
    queryOr.push({ _id: user.employeeId });
  }

  const employee = await Employee.findOne({
    $or: queryOr,
    isDeleted: false
  }).populate([
    { path: 'departmentId', select: 'name code headId' },
    { path: 'designationId', select: 'title code grade' },
    { path: 'shiftId', select: 'name code startTime endTime graceMinutes type' },
    { path: 'managerId', select: 'name employeeCode email phone' },
    { path: 'userId', select: 'email isActive lastLoginAt' }
  ]);

  if (!employee) {
    throw new ApiError(404, 'No employee record linked to your user account');
  }

  return decryptEmployeeFields(employee);
};

/**
 * Update employee record
 * @param {string} id
 * @param {Object} payload
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const updateEmployee = async (id, payload, actor) => {
  const employee = await Employee.findOne({ _id: id, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  const beforeSnapshot = employee.toObject();

  // If email updated, verify uniqueness
  if (payload.email && payload.email !== employee.email) {
    const existing = await Employee.findOne({
      email: payload.email,
      _id: { $ne: id },
      isDeleted: false
    });
    if (existing) {
      throw new ApiError(400, `Email '${payload.email}' is already in use`);
    }
  }

  const updates = { ...payload };

  // Re-encrypt CNIC if changed
  if (updates.cnic) {
    updates.cnic = encrypt(updates.cnic);
  }

  // Re-encrypt IBAN if changed
  if (updates.bankDetails?.iban) {
    updates.bankDetails = {
      ...employee.bankDetails?.toObject?.(),
      ...updates.bankDetails,
      iban: encrypt(updates.bankDetails.iban)
    };
  }

  Object.assign(employee, updates);
  await employee.save();

  await recordAuditLog({
    actor,
    action: 'employee.edit',
    entity: 'Employee',
    entityId: employee._id,
    before: beforeSnapshot,
    after: employee.toObject()
  });

  return decryptEmployeeFields(employee);
};

/**
 * Update employee status lifecycle (Active, Probation, Notice, Resigned, Terminated, Suspended)
 * @param {string} id
 * @param {Object} statusData
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const updateEmployeeStatus = async (id, { status, reason }, actor) => {
  const employee = await Employee.findOne({ _id: id, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  const beforeStatus = employee.status;
  employee.status = status;
  employee.statusReason = reason;
  await employee.save();

  // If Terminated, Resigned, or Suspended, deactivate linked user login account
  if (['Terminated', 'Resigned', 'Suspended'].includes(status) && employee.userId) {
    await User.findByIdAndUpdate(employee.userId, {
      isActive: false,
      refreshTokenHash: null
    });
  } else if (status === 'Active' && employee.userId) {
    // Re-activating employee re-activates login account
    await User.findByIdAndUpdate(employee.userId, { isActive: true });
  }

  await recordAuditLog({
    actor,
    action: 'employee.status_change',
    entity: 'Employee',
    entityId: employee._id,
    before: { status: beforeStatus },
    after: { status, reason }
  });

  return decryptEmployeeFields(employee);
};

/**
 * Soft delete employee record and deactivate user account
 * @param {string} id
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const deleteEmployee = async (id, actor) => {
  const employee = await Employee.findOne({ _id: id, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  employee.isDeleted = true;
  await employee.save();

  if (employee.userId) {
    await User.findByIdAndUpdate(employee.userId, {
      isActive: false,
      refreshTokenHash: null
    });
  }

  await recordAuditLog({
    actor,
    action: 'employee.delete',
    entity: 'Employee',
    entityId: employee._id,
    before: { isDeleted: false },
    after: { isDeleted: true }
  });

  return { message: 'Employee archived successfully' };
};

/**
 * Upload document to employee vault
 * @param {string} employeeId
 * @param {Object} docInfo
 * @param {Object} file
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const uploadDocument = async (employeeId, { type, title }, file, actor) => {
  if (!file) {
    throw new ApiError(400, 'Document file attachment is required');
  }

  const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  const documentEntry = {
    type,
    title,
    fileUrl: `/uploads/documents/${file.filename}`,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date(),
    uploadedBy: actor._id
  };

  employee.documents.push(documentEntry);
  await employee.save();

  await recordAuditLog({
    actor,
    action: 'employee.document_upload',
    entity: 'Employee',
    entityId: employee._id,
    details: { documentType: type, title }
  });

  return employee.documents[employee.documents.length - 1];
};

/**
 * Delete document from employee vault
 * @param {string} employeeId
 * @param {string} docId
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const deleteDocument = async (employeeId, docId, actor) => {
  const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  const doc = employee.documents.id(docId);
  if (!doc) {
    throw new ApiError(404, 'Document not found in employee vault');
  }

  if (doc.fileUrl) {
    const filePath = path.resolve(process.cwd(), doc.fileUrl.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // file unlink failure is non-fatal to document database record removal
      }
    }
  }

  employee.documents.pull(docId);
  await employee.save();

  await recordAuditLog({
    actor,
    action: 'employee.document_delete',
    entity: 'Employee',
    entityId: employee._id,
    details: { docId }
  });

  return { message: 'Document removed from vault' };
};

/**
 * Update employee personal skill tags
 * @param {string} employeeId
 * @param {Array<string>} skills
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const updateSkills = async (employeeId, skills, actor) => {
  const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  employee.skills = Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean)));
  await employee.save();

  await recordAuditLog({
    actor,
    action: 'employee.skills_update',
    entity: 'Employee',
    entityId: employee._id,
    after: { skills: employee.skills }
  });

  return employee.skills;
};

/**
 * Record a career milestone / promotion / transfer event
 * @param {string} employeeId
 * @param {Object} payload
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const recordJobHistory = async (employeeId, payload, actor) => {
  const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  const history = await EmployeeHistory.create({
    employeeId,
    eventType: payload.eventType,
    previousDepartmentId: payload.previousDepartmentId || employee.departmentId,
    newDepartmentId: payload.newDepartmentId || employee.departmentId,
    previousDesignationId: payload.previousDesignationId || employee.designationId,
    newDesignationId: payload.newDesignationId || employee.designationId,
    effectiveDate: payload.effectiveDate || new Date(),
    remarks: payload.remarks,
    createdBy: actor._id
  });

  // Automatically update current employee designation / department if provided
  if (payload.newDepartmentId) employee.departmentId = payload.newDepartmentId;
  if (payload.newDesignationId) employee.designationId = payload.newDesignationId;
  await employee.save();

  await recordAuditLog({
    actor,
    action: 'employee.promotion_history',
    entity: 'Employee',
    entityId: employee._id,
    details: payload
  });

  return history;
};

/**
 * Retrieve chronological career promotion/transfer timeline
 * @param {string} employeeId
 * @returns {Promise<Array<Object>>}
 */
export const getJobHistory = async (employeeId) => {
  return await EmployeeHistory.find({ employeeId })
    .populate('previousDepartmentId', 'name code')
    .populate('newDepartmentId', 'name code')
    .populate('previousDesignationId', 'title code grade')
    .populate('newDesignationId', 'title code grade')
    .populate('createdBy', 'email')
    .sort({ effectiveDate: -1, createdAt: -1 });
};

/**
 * Retrieve salary revision history (Permission Guarded)
 * @param {string} employeeId
 * @param {Object} actor
 * @returns {Promise<Array<Object>>}
 */
export const getSalaryHistory = async (employeeId, actor) => {
  const employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  const isOwn =
    String(employee.userId) === String(actor._id) ||
    String(employee._id) === String(actor.employeeId);

  const canViewSalary =
    isOwn ||
    actor.roles?.some(
      (r) =>
        (typeof r === 'string' ? r === 'Super Admin' || r === 'HR Manager' : r.name === 'Super Admin' || r.name === 'HR Manager') ||
        r.permissions?.some((p) => p.action === 'employee.salary.view')
    );

  if (!canViewSalary) {
    throw new ApiError(403, 'Forbidden: You do not have permission to view salary revision history');
  }

  return await EmployeeHistory.find({
    employeeId,
    $or: [{ eventType: 'Salary Revision' }, { newSalary: { $ne: null } }]
  })
    .populate('createdBy', 'email')
    .sort({ effectiveDate: -1, createdAt: -1 });
};

/**
 * Submit employee self-service profile change request
 * @param {string} userId
 * @param {Object} requestData
 * @returns {Promise<Object>}
 */
export const submitChangeRequest = async (userId, { field, requestedValue, reason }) => {
  const employee = await Employee.findOne({ userId, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'No employee record linked to your user account');
  }

  const request = await ProfileChangeRequest.create({
    employeeId: employee._id,
    requestedBy: userId,
    field,
    requestedValue,
    reason,
    status: 'pending'
  });

  return request;
};

/**
 * Retrieve all pending profile change requests for HR inspection
 * @param {Object} query
 * @returns {Promise<Array<Object>>}
 */
export const getChangeRequests = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;

  return await ProfileChangeRequest.find(filter)
    .populate('employeeId', 'name employeeCode email')
    .populate('requestedBy', 'email')
    .populate('decidedBy', 'email')
    .sort({ createdAt: -1 });
};

/**
 * Decide (approve / reject) sensitive field change request
 * @param {string} id
 * @param {Object} decision
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const decideChangeRequest = async (id, { action, rejectionReason }, actor) => {
  const changeReq = await ProfileChangeRequest.findById(id);
  if (!changeReq) {
    throw new ApiError(404, 'Change request not found');
  }

  if (changeReq.status !== 'pending') {
    throw new ApiError(400, `Request is already ${changeReq.status}`);
  }

  if (action === 'rejected') {
    changeReq.status = 'rejected';
    changeReq.rejectionReason = rejectionReason || 'Rejected by HR';
    changeReq.decidedBy = actor._id;
    changeReq.decidedAt = new Date();
    await changeReq.save();

    await recordAuditLog({
      actor,
      action: 'employee.change_request_rejected',
      entity: 'ProfileChangeRequest',
      entityId: changeReq._id,
      details: { rejectionReason }
    });

    return changeReq;
  }

  // Approval flow: Apply updates onto target Employee record
  const employee = await Employee.findById(changeReq.employeeId);
  if (!employee) {
    throw new ApiError(404, 'Target employee record not found');
  }

  const beforeSnapshot = employee.toObject();

  if (changeReq.field === 'bankDetails') {
    const bankVal = changeReq.requestedValue;
    if (bankVal.iban) {
      bankVal.iban = encrypt(bankVal.iban);
    }
    employee.bankDetails = {
      ...employee.bankDetails?.toObject?.(),
      ...bankVal
    };
  } else if (changeReq.field === 'address') {
    employee.address = {
      ...employee.address?.toObject?.(),
      ...changeReq.requestedValue
    };
  } else if (changeReq.field === 'emergencyContact') {
    employee.emergencyContact = {
      ...employee.emergencyContact?.toObject?.(),
      ...changeReq.requestedValue
    };
  } else {
    employee[changeReq.field] = changeReq.requestedValue;
  }

  await employee.save();

  changeReq.status = 'approved';
  changeReq.decidedBy = actor._id;
  changeReq.decidedAt = new Date();
  await changeReq.save();

  await recordAuditLog({
    actor,
    action: 'employee.change_request_approved',
    entity: 'Employee',
    entityId: employee._id,
    before: beforeSnapshot,
    after: employee.toObject()
  });

  return changeReq;
};

/**
 * Retrieve employees whose CNIC expires within specified days
 * @param {number} days
 * @returns {Promise<Array<Object>>}
 */
export const getCnicExpiringSoon = async (days = 30) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);

  return await Employee.find({
    isDeleted: false,
    cnicExpiry: {
      $gte: new Date(),
      $lte: targetDate
    }
  }).select('name employeeCode email cnicExpiry departmentId');
};

/**
 * Bulk import employees from Excel spreadsheet (.xlsx) with row-level error reporting
 * @param {Buffer} buffer
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const importEmployeesFromExcel = async (buffer, actor) => {
  if (!buffer) {
    throw new ApiError(400, 'Excel spreadsheet buffer is required');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new ApiError(400, 'Excel file contains no readable worksheets');
  }

  const departments = await Department.find({ isActive: true }).lean();
  const deptMap = new Map(departments.map((d) => [d.code?.toUpperCase(), d._id]));

  const designations = await Designation.find({ isActive: true }).lean();
  const desigMap = new Map(designations.map((d) => [d.code?.toUpperCase(), d._id]));

  const existingEmployees = await Employee.find({ isDeleted: false }, 'employeeCode email').lean();
  const existingCodes = new Set(existingEmployees.map((e) => e.employeeCode?.toUpperCase()));
  const existingEmails = new Set(existingEmployees.map((e) => e.email?.toLowerCase()));

  const batchCodes = new Set();
  const batchEmails = new Set();

  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmploymentTypes = ['Permanent', 'Contract', 'Intern', 'Probation'];

  const validEmployees = [];
  const errors = [];
  let totalProcessed = 0;

  const getCellString = (cell) => {
    if (!cell || cell.value == null) return '';
    if (typeof cell.value === 'object') {
      if (cell.value.text) return String(cell.value.text).trim();
      if (cell.value.result) return String(cell.value.result).trim();
    }
    return String(cell.value).trim();
  };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const code = getCellString(row.getCell(1));
    const name = getCellString(row.getCell(2));
    const email = getCellString(row.getCell(3));
    const phone = getCellString(row.getCell(4));
    const cnic = getCellString(row.getCell(5));
    const deptCode = getCellString(row.getCell(6));
    const desigCode = getCellString(row.getCell(7));
    const empType = getCellString(row.getCell(8));
    const joiningDateRaw = row.getCell(9).value;
    const bankName = getCellString(row.getCell(10));
    const accountTitle = getCellString(row.getCell(11));
    const accountNumber = getCellString(row.getCell(12));
    const iban = getCellString(row.getCell(13));

    if (!code && !name && !email && !cnic) return;

    totalProcessed += 1;
    const rowErrors = [];

    if (!code) {
      rowErrors.push('Employee code is required');
    } else {
      const upperCode = code.toUpperCase();
      if (existingCodes.has(upperCode) || batchCodes.has(upperCode)) {
        rowErrors.push(`Duplicate employee code '${code}'`);
      }
    }

    if (!name) {
      rowErrors.push('Full name is required');
    }

    if (!email) {
      rowErrors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      rowErrors.push(`Invalid email format '${email}'`);
    } else {
      const lowerEmail = email.toLowerCase();
      if (existingEmails.has(lowerEmail) || batchEmails.has(lowerEmail)) {
        rowErrors.push(`Duplicate email '${email}'`);
      }
    }

    if (!cnic) {
      rowErrors.push('CNIC is required');
    } else if (!cnicRegex.test(cnic)) {
      rowErrors.push(`Invalid CNIC format '${cnic}' (Expected XXXXX-XXXXXXX-X)`);
    }

    let departmentId = null;
    if (deptCode) {
      departmentId = deptMap.get(deptCode.toUpperCase()) || null;
      if (!departmentId) {
        rowErrors.push(`Unknown department code '${deptCode}'`);
      }
    }

    let designationId = null;
    if (desigCode) {
      designationId = desigMap.get(desigCode.toUpperCase()) || null;
      if (!designationId) {
        rowErrors.push(`Unknown designation code '${desigCode}'`);
      }
    }

    let employmentType = 'Permanent';
    if (empType) {
      if (!validEmploymentTypes.includes(empType)) {
        rowErrors.push(`Invalid employment type '${empType}'. Allowed: ${validEmploymentTypes.join(', ')}`);
      } else {
        employmentType = empType;
      }
    }

    let joiningDate = new Date();
    if (joiningDateRaw) {
      const parsedDate = new Date(joiningDateRaw);
      if (!isNaN(parsedDate.getTime())) {
        joiningDate = parsedDate;
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        employeeCode: code || '—',
        name: name || '—',
        reason: rowErrors.join('; ')
      });
      return;
    }

    batchCodes.add(code.toUpperCase());
    batchEmails.add(email.toLowerCase());

    const employeeDoc = {
      employeeCode: code.toUpperCase(),
      name,
      email: email.toLowerCase(),
      phone: phone || undefined,
      cnic: encrypt(cnic),
      departmentId,
      designationId,
      employmentType,
      joiningDate,
      status: 'Active'
    };

    if (bankName || iban || accountNumber) {
      employeeDoc.bankDetails = {
        bankName: bankName || undefined,
        accountTitle: accountTitle || undefined,
        accountNumber: accountNumber || undefined,
        iban: iban ? encrypt(iban) : undefined
      };
    }

    validEmployees.push(employeeDoc);
  });

  if (validEmployees.length > 0) {
    await Employee.insertMany(validEmployees);
  }

  await recordAuditLog({
    actor,
    action: 'employee.bulk_import',
    entity: 'Employee',
    details: {
      totalRows: totalProcessed,
      succeeded: validEmployees.length,
      failed: errors.length
    }
  });

  return {
    total: totalProcessed,
    succeeded: validEmployees.length,
    failed: errors.length,
    errors
  };
};

/**
 * Export scoped employee directory to Excel workbook (.xlsx)
 * @param {Object} queryFilters
 * @param {Object} actor
 * @returns {Promise<Buffer>}
 */
export const exportEmployeesToExcel = async (queryFilters = {}, actor) => {
  const conditions = { isDeleted: false };
  if (queryFilters.departmentId) conditions.departmentId = queryFilters.departmentId;
  if (queryFilters.status) conditions.status = queryFilters.status;

  const employees = await Employee.find(conditions)
    .populate('departmentId', 'name code')
    .populate('designationId', 'title code grade')
    .sort({ createdAt: -1 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HRM System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Employee Directory');

  worksheet.columns = [
    { header: 'Employee Code', key: 'code', width: 16 },
    { header: 'Full Name', key: 'name', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'CNIC', key: 'cnic', width: 18 },
    { header: 'Department', key: 'department', width: 22 },
    { header: 'Designation', key: 'designation', width: 22 },
    { header: 'Employment Type', key: 'type', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Joining Date', key: 'joiningDate', width: 16 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00C471' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  employees.forEach((emp) => {
    let decryptedCnic = '—';
    if (emp.cnic) {
      try {
        decryptedCnic = decrypt(emp.cnic);
      } catch {
        decryptedCnic = emp.cnic;
      }
    }

    const row = worksheet.addRow({
      code: emp.employeeCode,
      name: emp.name,
      email: emp.email || '—',
      phone: emp.phone || '—',
      cnic: decryptedCnic,
      department: emp.departmentId?.name || 'Unassigned',
      designation: emp.designationId?.title || 'Unassigned',
      type: emp.employmentType,
      status: emp.status,
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '—'
    });

    row.alignment = { vertical: 'middle' };
  });

  await recordAuditLog({
    actor,
    action: 'employee.export',
    entity: 'Employee',
    details: { count: employees.length }
  });

  return await workbook.xlsx.writeBuffer();
};
