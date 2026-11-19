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
import { Shift } from '../../models/shift.model.js';
import { EmployeeHistory } from '../../models/employeeHistory.model.js';
import { ProfileChangeRequest } from '../../models/profileChangeRequest.model.js';
import { encrypt, decrypt } from '../../utils/crypto.js';
import { ApiError } from '../../utils/ApiError.js';
import { paginate } from '../../utils/paginate.js';
import { scopeFilter } from '../../utils/scopeFilter.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { emailService } from '../../services/email.service.js';
import { uploadBufferToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from '../../config/cloudinary.js';
import { assertSuperAdminIfApplicantIsHR, isApplicantHR, notifySuperAdmins, notifyHRManagers } from '../../utils/hrApprovalGuard.js';
import { notify } from '../../services/notify.service.js';
import { emitToCompany } from '../../services/socket.service.js';
import { initializeEmployeeLeaveBalances } from '../leaves/leave.service.js';
import { assertEmployeeAssetClearance } from '../assets/asset.service.js';
import { initOnboardingForEmployee } from '../onboarding/onboarding.service.js';
import { SettingService } from '../settings/setting.service.js';

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

  if (emp.bankDetails?.accountNumber) {
    try {
      emp.bankDetails.accountNumber = decrypt(emp.bankDetails.accountNumber);
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

  // Department validity & archival guard
  if (payload.departmentId) {
    const dept = await Department.findOne({ _id: payload.departmentId, isDeleted: false });
    if (!dept) {
      throw new ApiError(404, 'Specified department does not exist');
    }
    if (dept.isArchived) {
      throw new ApiError(400, `Cannot assign employee to department '${dept.name}' because it is archived.`);
    }
  }

  // Designation validity & archival guard
  if (payload.designationId) {
    const desig = await Designation.findOne({ _id: payload.designationId, isDeleted: false });
    if (!desig) {
      throw new ApiError(404, 'Specified designation does not exist');
    }
    if (desig.isArchived) {
      throw new ApiError(400, `Cannot assign employee to designation '${desig.title}' because it is archived.`);
    }
  }

  // Shift validity & archival guard
  if (payload.shiftId) {
    const shift = await Shift.findOne({ _id: payload.shiftId, isDeleted: false });
    if (!shift) {
      throw new ApiError(404, 'Specified work shift does not exist');
    }
    if (shift.isArchived) {
      throw new ApiError(400, `Cannot assign employee to shift '${shift.name}' because it is archived.`);
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
  if (employeeData.bankDetails?.accountNumber) {
    employeeData.bankDetails = {
      ...employeeData.bankDetails,
      accountNumber: encrypt(employeeData.bankDetails.accountNumber)
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

    // Resolve assigned role (preventing Super Admin from standard employee creation)
    let assignedRoleIds = [];
    if (payload.roleId) {
      const selectedRole = await Role.findOne({ _id: payload.roleId, isDeleted: false });
      if (selectedRole) {
        if (selectedRole.name === 'Super Admin') {
          throw new ApiError(403, 'Super Admin role cannot be assigned during employee creation.');
        }
        assignedRoleIds = [selectedRole._id];
      }
    }

    if (!assignedRoleIds.length) {
      const defaultRole = await Role.findOne({ name: 'Employee', isDeleted: false });
      assignedRoleIds = defaultRole ? [defaultRole._id] : [];
    }

    // Generate secure 10-character temporary password
    tempPassword = `Tmp@${crypto.randomBytes(4).toString('hex')}1`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const newUser = await User.create({
      email: payload.email,
      name: payload.name || '',
      passwordHash,
      roles: assignedRoleIds,
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

  // 6b. Automatically initialize leave balances for current year (Module M6 Row 6.2)
  try {
    await initializeEmployeeLeaveBalances(employee._id);
  } catch (leaveErr) {
    console.error('Leave balance initialization failed:', leaveErr.message);
  }

  // 6c. Automatically initialize onboarding checklist (Module M18 Row 18.2)
  try {
    await initOnboardingForEmployee({ employee });
  } catch (onboardErr) {
    console.error('Onboarding checklist initialization failed:', onboardErr.message);
  }

  // 7. Audit Log
  await recordAuditLog({
    actor,
    action: 'employee.create',
    entity: 'Employee',
    entityId: employee._id,
    after: employee.toObject()
  });

  const decrypted = decryptEmployeeFields(employee);
  if (tempPassword) {
    decrypted.tempPassword = tempPassword;
  }
  return decrypted;
};

/**
 * Scoped Employee Directory query with faceted search and pagination
 * @param {Object} filterOptions
 * @param {Object} actor
 * @param {string} permissionScope
 * @returns {Promise<Object>}
 */
export const getEmployees = async (
  { page = 1, limit = 10, search, departmentId, designationId, status, employmentType, skill, forReporting = false, archived = false, isDeleted = false },
  actor,
  permissionScope = 'all'
) => {
  // 1. Resolve horizontal data scope query conditions
  const isArchived = String(archived) === 'true' || String(isDeleted) === 'true';
  const conditions = { isDeleted: isArchived };

  // Exclude Super Admin from general workforce directory and dashboards
  // Allow inclusion ONLY when specifically querying for reporting manager selection
  if (String(forReporting) !== 'true') {
    conditions.email = { $nin: ['mhamzaofficial159@gmail.com', 'admin@hrm.company.pk'] };
    conditions.employeeCode = { $ne: 'EMP-000' };
  }

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
  if (status) conditions.status = new RegExp('^' + status.trim() + '$', 'i');
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
  const employee = await Employee.findById(id).populate([
    { path: 'departmentId', select: 'name code description headId' },
    { path: 'designationId', select: 'title code grade description' },
    { path: 'shiftId', select: 'name code startTime endTime graceMinutes type' },
    { path: 'managerId', select: 'name employeeCode email phone' },
    { path: 'userId', select: 'email isActive lastLoginAt roles twoFactorEnabled avatar' }
  ]);

  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  // Super Admin Profile Protection: No other user can access or view Super Admin's employee profile
  const isTargetSuperAdmin =
    employee.email === 'mhamzaofficial159@gmail.com' ||
    employee.email === 'admin@hrm.company.pk' ||
    employee.employeeCode === 'EMP-000';

  if (isTargetSuperAdmin) {
    const isActorSuperAdmin = actor?.roles?.some((r) => {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName === 'Super Admin';
    });
    const isOwn =
      String(employee.userId?._id || employee.userId) === String(actor?._id) ||
      String(employee._id) === String(actor?.employeeId);
    if (!isActorSuperAdmin && !isOwn) {
      throw new ApiError(403, 'Forbidden: Super Admin profile is protected and cannot be accessed.');
    }
  }

  // Enforce horizontal access boundary
  const isOwn =
    String(employee.userId?._id || employee.userId) === String(actor?._id) ||
    String(employee._id) === String(actor?.employeeId);

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
    actor?.roles?.some((r) => {
      const name = typeof r === 'string' ? r : r?.name;
      return name === 'Super Admin' || name === 'HR Manager';
    });

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
    { path: 'userId', select: 'email isActive lastLoginAt twoFactorEnabled avatar' }
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

  // Super Admin Profile Protection: No other user can modify Super Admin's employee profile
  const isTargetSuperAdmin =
    employee.email === 'mhamzaofficial159@gmail.com' ||
    employee.email === 'admin@hrm.company.pk' ||
    employee.employeeCode === 'EMP-000';

  if (isTargetSuperAdmin) {
    const isActorSuperAdmin = actor?.roles?.some((r) => {
      const roleName = typeof r === 'string' ? r : r.name;
      return roleName === 'Super Admin';
    });
    const isOwn = String(employee.userId) === String(actor?._id);
    if (!isActorSuperAdmin && !isOwn) {
      throw new ApiError(403, 'Forbidden: Super Admin profile cannot be modified by other users.');
    }
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

  // Department validity & archival guard
  if (payload.departmentId && String(payload.departmentId) !== String(employee.departmentId)) {
    const dept = await Department.findOne({ _id: payload.departmentId, isDeleted: false });
    if (!dept) {
      throw new ApiError(404, 'Specified department does not exist');
    }
    if (dept.isArchived) {
      throw new ApiError(400, `Cannot assign employee to department '${dept.name}' because it is archived.`);
    }
  }

  // Designation validity & archival guard
  if (payload.designationId && String(payload.designationId) !== String(employee.designationId)) {
    const desig = await Designation.findOne({ _id: payload.designationId, isDeleted: false });
    if (!desig) {
      throw new ApiError(404, 'Specified designation does not exist');
    }
    if (desig.isArchived) {
      throw new ApiError(400, `Cannot assign employee to designation '${desig.title}' because it is archived.`);
    }
  }

  // Shift validity & archival guard
  if (payload.shiftId && String(payload.shiftId) !== String(employee.shiftId)) {
    const shift = await Shift.findOne({ _id: payload.shiftId, isDeleted: false });
    if (!shift) {
      throw new ApiError(404, 'Specified work shift does not exist');
    }
    if (shift.isArchived) {
      throw new ApiError(400, `Cannot assign employee to shift '${shift.name}' because it is archived.`);
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

  // Re-encrypt Account Number if changed
  if (updates.bankDetails?.accountNumber) {
    updates.bankDetails = {
      ...employee.bankDetails?.toObject?.(),
      ...updates.bankDetails,
      accountNumber: encrypt(updates.bankDetails.accountNumber)
    };
  }

  Object.assign(employee, updates);
  await employee.save();

  // If name updated and employee has a linked user account, keep user.name in sync
  if (updates.name && employee.userId) {
    await User.findByIdAndUpdate(employee.userId, { name: updates.name }).catch(() => {});
  }

  // If roleId provided and employee has a linked user account, update user roles
  if (payload.roleId && employee.userId) {
    const selectedRole = await Role.findOne({ _id: payload.roleId, isDeleted: false });
    if (selectedRole && selectedRole.name !== 'Super Admin') {
      await User.findByIdAndUpdate(employee.userId, { roles: [selectedRole._id] });
    }
  }

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

  // Check asset exit clearance only when terminating employee
  if (status === 'Terminated') {
    await assertEmployeeAssetClearance(id);
  }

  if (
    employee.email === 'mhamzaofficial159@gmail.com' ||
    employee.email === 'admin@hrm.company.pk' ||
    employee.employeeCode === 'EMP-000'
  ) {
    throw new ApiError(403, 'Forbidden: Super Admin status lifecycle cannot be modified.');
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

  // Ensure all company equipment returned before employee deletion
  await assertEmployeeAssetClearance(id);

  if (
    employee.email === 'mhamzaofficial159@gmail.com' ||
    employee.email === 'admin@hrm.company.pk' ||
    employee.employeeCode === 'EMP-000'
  ) {
    throw new ApiError(403, 'Forbidden: Super Admin profile cannot be deleted or archived.');
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
 * Restore an archived employee record and reactivate user account
 * @param {string} id
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const restoreEmployee = async (id, actor) => {
  const employee = await Employee.findOne({ _id: id, isDeleted: true });
  if (!employee) {
    throw new ApiError(404, 'Archived employee record not found');
  }

  employee.isDeleted = false;
  await employee.save();

  if (employee.userId) {
    await User.findByIdAndUpdate(employee.userId, {
      isActive: true
    });
  }

  await recordAuditLog({
    actor,
    action: 'employee.restore',
    entity: 'Employee',
    entityId: employee._id,
    before: { isDeleted: true },
    after: { isDeleted: false }
  });

  return { message: 'Employee reverted from archive successfully', employee };
};

/**
 * Permanently delete employee record from database
 * @param {string} id
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const permanentDeleteEmployee = async (id, actor) => {
  const employee = await Employee.findOne({ _id: id });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  if (
    employee.email === 'mhamzaofficial159@gmail.com' ||
    employee.email === 'admin@hrm.company.pk' ||
    employee.employeeCode === 'EMP-000'
  ) {
    throw new ApiError(403, 'Forbidden: Super Admin profile cannot be permanently deleted.');
  }

  // Ensure all company equipment returned before permanent employee deletion
  await assertEmployeeAssetClearance(id);

  if (employee.userId) {
    await User.findByIdAndDelete(employee.userId);
  }

  await Employee.findByIdAndDelete(id);

  await recordAuditLog({
    actor,
    action: 'employee.permanent_delete',
    entity: 'Employee',
    entityId: employee._id,
    before: { employeeCode: employee.employeeCode, email: employee.email, name: employee.name },
    after: null
  });

  return { message: 'Employee permanently deleted' };
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

  let fileUrl;
  let publicId = null;

  if (isCloudinaryConfigured() && file.buffer) {
    const cloudRes = await uploadBufferToCloudinary(file.buffer, {
      folder: 'hrm/documents',
      resource_type: 'auto'
    });
    fileUrl = cloudRes.secure_url;
    publicId = cloudRes.public_id;
  } else {
    // Local fallback when Cloudinary credentials are not configured or file was stored on disk
    if (file.filename) {
      fileUrl = `/uploads/documents/${file.filename}`;
    } else {
      const documentsDir = path.resolve(process.cwd(), 'uploads/documents');
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }
      const ext = path.extname(file.originalname);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `doc-${uniqueSuffix}${ext}`;
      const filePath = path.join(documentsDir, filename);
      if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
      }
      fileUrl = `/uploads/documents/${filename}`;
    }
  }

  const documentEntry = {
    type,
    title,
    fileUrl,
    publicId,
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

  if (doc.publicId) {
    await deleteFromCloudinary(doc.publicId, doc.mimeType?.startsWith('image/') ? 'image' : 'raw');
  } else if (doc.fileUrl) {
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
 * Upload and update employee profile avatar
 * @param {string} employeeId - 'me' or specific employee ObjectId
 * @param {Object} file - Uploaded image file buffer
 * @param {Object} actor - Authenticated user initiating upload
 * @returns {Promise<Object>}
 */
export const uploadAvatar = async (employeeId, file, actor) => {
  if (!file) {
    throw new ApiError(400, 'Profile image file attachment is required');
  }

  // Strict image format validation (MIME + Extension)
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!file.mimetype || !allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
    throw new ApiError(400, 'Invalid file format. Only JPEG, PNG, and WEBP image files are allowed.');
  }

  // Deep inspection via binary magic bytes signature
  if (file.buffer && file.buffer.length >= 4) {
    const isJpeg = file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
    const isPng =
      file.buffer[0] === 0x89 &&
      file.buffer[1] === 0x50 &&
      file.buffer[2] === 0x4e &&
      file.buffer[3] === 0x47;
    const isWebp =
      file.buffer.length >= 12 &&
      file.buffer.toString('utf8', 0, 4) === 'RIFF' &&
      file.buffer.toString('utf8', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      throw new ApiError(400, 'Fake or corrupted image file detected. File signature does not match image format.');
    }
  }

  let employee;
  if (employeeId === 'me' || !employeeId) {
    const user = await User.findById(actor._id);
    const queryOr = [{ userId: actor._id }];
    if (user?.employeeId) {
      queryOr.push({ _id: user.employeeId });
    }
    employee = await Employee.findOne({ $or: queryOr, isDeleted: false });
  } else {
    employee = await Employee.findOne({ _id: employeeId, isDeleted: false });
  }

  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  let avatarUrl;

  if (isCloudinaryConfigured() && file.buffer) {
    const cloudRes = await uploadBufferToCloudinary(file.buffer, {
      folder: 'hrm/avatars',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' }
      ]
    });
    avatarUrl = cloudRes.secure_url;
  } else {
    // Local fallback
    const avatarsDir = path.resolve(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `avatar-${employee._id}-${Date.now()}${ext}`;
    const filePath = path.join(avatarsDir, uniqueName);
    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    }
    avatarUrl = `/uploads/avatars/${file.filename || uniqueName}`;
  }

  // Update employee model
  employee.avatar = avatarUrl;
  await employee.save();

  // Also synchronize user model
  if (employee.userId) {
    await User.findByIdAndUpdate(employee.userId, { avatar: avatarUrl });
  }
  if (actor?._id) {
    await User.findByIdAndUpdate(actor._id, { avatar: avatarUrl });
  }

  await recordAuditLog({
    actor,
    action: 'employee.avatar_upload',
    entity: 'Employee',
    entityId: employee._id,
    details: { avatarUrl }
  });

  return {
    employee: decryptEmployeeFields(employee),
    avatarUrl
  };
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

  // Department validity & archival guard on promotion/transfer
  if (payload.newDepartmentId) {
    const dept = await Department.findOne({ _id: payload.newDepartmentId, isDeleted: false });
    if (!dept) {
      throw new ApiError(404, 'Specified destination department does not exist');
    }
    if (dept.isArchived) {
      throw new ApiError(400, `Cannot transfer/promote employee to department '${dept.name}' because it is archived.`);
    }
  }

  // Designation validity & archival guard on promotion/transfer
  if (payload.newDesignationId) {
    const desig = await Designation.findOne({ _id: payload.newDesignationId, isDeleted: false });
    if (!desig) {
      throw new ApiError(404, 'Specified destination designation does not exist');
    }
    if (desig.isArchived) {
      throw new ApiError(400, `Cannot promote/assign employee to designation '${desig.title}' because it is archived.`);
    }
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
export const submitChangeRequest = async (userId, { category, field, requestedValue, reason, priority = 'normal', attachments = [] }) => {
  const employee = await Employee.findOne({ userId, isDeleted: false });
  if (!employee) {
    throw new ApiError(404, 'No employee record linked to your user account');
  }

  // Determine category if not explicitly provided
  let determinedCategory = category;
  if (!determinedCategory) {
    if (field === 'bankDetails' || field === 'bank_details') determinedCategory = 'bank_details';
    else if (field === 'address') determinedCategory = 'address';
    else if (field === 'emergencyContact' || field === 'emergency_contact') determinedCategory = 'emergency_contact';
    else if (field === 'departmentId' || field === 'department') determinedCategory = 'department';
    else if (field === 'designationId' || field === 'designation') determinedCategory = 'designation';
    else if (field === 'reportingManagerId' || field === 'reporting_manager') determinedCategory = 'reporting_manager';
    else if (field === 'phone' || field === 'personalEmail' || field === 'contact') determinedCategory = 'contact';
    else determinedCategory = 'personal';
  }

  // Extract current baseline oldValue snapshot from employee
  let oldValue = null;
  if (determinedCategory === 'bank_details') {
    let plainIban = '';
    if (employee.bankDetails?.iban) {
      try {
        plainIban = decrypt(employee.bankDetails.iban);
      } catch {
        plainIban = employee.bankDetails.iban;
      }
    }
    oldValue = {
      bankName: employee.bankDetails?.bankName || '',
      accountTitle: employee.bankDetails?.accountTitle || '',
      accountNumber: employee.bankDetails?.accountNumber || '',
      iban: plainIban
    };
  } else if (determinedCategory === 'address') {
    oldValue = employee.address?.toObject?.() || employee.address || null;
  } else if (determinedCategory === 'emergency_contact') {
    oldValue = employee.emergencyContact?.toObject?.() || employee.emergencyContact || null;
  } else if (determinedCategory === 'department') {
    const dept = await Department.findById(employee.departmentId).select('name code');
    oldValue = {
      departmentId: employee.departmentId,
      name: dept?.name || '',
      code: dept?.code || ''
    };
  } else if (determinedCategory === 'designation') {
    const desig = await Designation.findById(employee.designationId).select('title code');
    oldValue = {
      designationId: employee.designationId,
      title: desig?.title || '',
      code: desig?.code || ''
    };
  } else if (determinedCategory === 'reporting_manager') {
    let mgrName = '';
    const mgrId = employee.managerId || employee.reportingManagerId;
    if (mgrId) {
      const mgr = await Employee.findById(mgrId).select('name employeeCode');
      mgrName = mgr ? `${mgr.name} (${mgr.employeeCode})` : '';
    }
    oldValue = {
      reportingManagerId: mgrId,
      managerId: mgrId,
      name: mgrName
    };
  } else if (determinedCategory === 'contact') {
    oldValue = {
      phone: employee.phone || '',
      personalEmail: employee.personalEmail || ''
    };
  } else {
    oldValue = {
      name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      gender: employee.gender || '',
      dob: employee.dob || null,
      maritalStatus: employee.maritalStatus || '',
      bloodGroup: employee.bloodGroup || ''
    };
  }

  const applicantName = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee';

  const timelineEntry = {
    action: 'submitted',
    actor: userId,
    actorName: applicantName,
    actorRole: 'Employee',
    note: reason,
    timestamp: new Date()
  };

  const request = await ProfileChangeRequest.create({
    employeeId: employee._id,
    requestedBy: userId,
    category: determinedCategory,
    field,
    oldValue,
    requestedValue,
    reason,
    priority,
    attachments,
    status: 'pending',
    timeline: [timelineEntry]
  });

  const isHr = await isApplicantHR(employee._id, userId);
  if (isHr) {
    await notifySuperAdmins({
      type: 'profile',
      title: 'Profile Change Request (HR Personnel)',
      body: `${applicantName} requested an update to their ${field}. Awaiting Super Admin review.`,
      link: '/change-requests'
    }).catch(() => {});
  } else {
    await notifyHRManagers({
      type: 'profile',
      title: 'New Profile Change Request',
      body: `${applicantName} submitted a change request for ${field}.`,
      link: '/change-requests'
    }).catch(() => {});
  }

  emitToCompany('change_request:created', {
    requestId: request._id,
    employeeId: employee._id,
    category: determinedCategory,
    status: 'pending'
  });

  await recordAuditLog({
    actor: { _id: userId, name: applicantName },
    action: 'change_request.created',
    entity: 'ProfileChangeRequest',
    entityId: request._id,
    details: { category: determinedCategory, field, priority }
  }).catch(() => {});

  return request;
};

/**
 * Retrieve all profile change requests with PBAC scoping and filters
 * @param {Object} query
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const getChangeRequests = async (query = {}, actor = null) => {
  const filter = { isDeleted: false };
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.category && query.category !== 'all') filter.category = query.category;
  if (query.priority && query.priority !== 'all') filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  // PBAC scoping
  if (actor) {
    let isSuperAdmin = actor.role === 'Super Admin' || actor.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
    if (!isSuperAdmin && Array.isArray(actor.roles) && actor.roles.length > 0) {
      const saRole = await Role.findOne({ name: 'Super Admin' }).select('_id');
      if (saRole && actor.roles.some((r) => String(r._id || r) === String(saRole._id))) {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin) {
      const actorEmployee = await Employee.findOne({ userId: actor._id, isDeleted: false });
      const ability = actor.ability;

      let scope = 'own';
      if (ability && typeof ability.can === 'function') {
        if (ability.can('all', 'ChangeRequest') || ability.can('all', 'change_request.view')) {
          scope = 'all';
        } else if (ability.can('department', 'ChangeRequest') || ability.can('department', 'change_request.view')) {
          scope = 'department';
        } else if (ability.can('team', 'ChangeRequest') || ability.can('team', 'change_request.view')) {
          scope = 'team';
        }
      } else {
        let isHR = actor.roles?.some((r) => r === 'HR Manager' || r?.name === 'HR Manager');
        if (!isHR && Array.isArray(actor.roles) && actor.roles.length > 0) {
          const hrRoleDoc = await Role.findOne({ name: 'HR Manager' }).select('_id');
          if (hrRoleDoc && actor.roles.some((r) => String(r._id || r) === String(hrRoleDoc._id))) {
            isHR = true;
          }
        }
        let isDeptMgr = actor.roles?.some((r) => r === 'Department Manager' || r?.name === 'Department Manager');
        if (!isDeptMgr && Array.isArray(actor.roles) && actor.roles.length > 0) {
          const dmRoleDoc = await Role.findOne({ name: 'Department Manager' }).select('_id');
          if (dmRoleDoc && actor.roles.some((r) => String(r._id || r) === String(dmRoleDoc._id))) {
            isDeptMgr = true;
          }
        }
        if (isHR) scope = 'all';
        else if (isDeptMgr) scope = 'department';
      }

      if (scope === 'department' && actorEmployee?.departmentId) {
        const deptEmployees = await Employee.find({ departmentId: actorEmployee.departmentId }).select('_id');
        filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
      } else if (scope === 'team' && actorEmployee?._id) {
        const teamEmployees = await Employee.find({
          $or: [{ reportingManagerId: actorEmployee._id }, { managerId: actorEmployee._id }]
        }).select('_id');
        filter.employeeId = { $in: teamEmployees.map((e) => e._id) };
      } else if (scope === 'own') {
        const ownFilters = [{ requestedBy: actor._id }];
        if (actorEmployee?._id) ownFilters.push({ employeeId: actorEmployee._id });
        filter.$or = ownFilters;
      }
    }
  }

  if (query.departmentId && query.departmentId !== 'all') {
    const deptEmployees = await Employee.find({ departmentId: query.departmentId }).select('_id');
    if (filter.employeeId && filter.employeeId.$in) {
      const existingIds = new Set(filter.employeeId.$in.map(String));
      const filteredIds = deptEmployees.map((e) => e._id).filter((id) => existingIds.has(String(id)));
      filter.employeeId = { $in: filteredIds };
    } else {
      filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
    }
  }

  if (query.search && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    const matchedEmployees = await Employee.find({
      $or: [
        { name: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeCode: searchRegex }
      ]
    }).select('_id');

    const searchConditions = [
      { reason: searchRegex },
      { field: searchRegex },
      { employeeId: { $in: matchedEmployees.map((e) => e._id) } }
    ];

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    ProfileChangeRequest.find(filter)
      .populate({
        path: 'employeeId',
        select: 'name employeeCode email phone departmentId designationId avatar',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'designationId', select: 'title code' }
        ]
      })
      .populate('requestedBy', 'email name')
      .populate('decidedBy', 'email name')
      .populate('assignedTo', 'email name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProfileChangeRequest.countDocuments(filter)
  ]);

  return {
    requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Retrieve aggregated statistics for change requests dashboard
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const getChangeRequestStats = async (actor = null) => {
  const baseFilter = { isDeleted: false };
  if (actor) {
    let isSuperAdmin = actor.role === 'Super Admin' || actor.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
    if (!isSuperAdmin && Array.isArray(actor.roles) && actor.roles.length > 0) {
      const saRole = await Role.findOne({ name: 'Super Admin' }).select('_id');
      if (saRole && actor.roles.some((r) => String(r._id || r) === String(saRole._id))) {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin) {
      let isHR = actor.roles?.some((r) => r === 'HR Manager' || r?.name === 'HR Manager');
      if (!isHR && Array.isArray(actor.roles) && actor.roles.length > 0) {
        const hrRoleDoc = await Role.findOne({ name: 'HR Manager' }).select('_id');
        if (hrRoleDoc && actor.roles.some((r) => String(r._id || r) === String(hrRoleDoc._id))) {
          isHR = true;
        }
      }

      let isDeptMgr = actor.roles?.some((r) => r === 'Department Manager' || r?.name === 'Department Manager');
      if (!isDeptMgr && Array.isArray(actor.roles) && actor.roles.length > 0) {
        const dmRoleDoc = await Role.findOne({ name: 'Department Manager' }).select('_id');
        if (dmRoleDoc && actor.roles.some((r) => String(r._id || r) === String(dmRoleDoc._id))) {
          isDeptMgr = true;
        }
      }

      const actorEmployee = await Employee.findOne({ userId: actor._id, isDeleted: false });
      if (!isHR && isDeptMgr && actorEmployee?.departmentId) {
        const deptEmps = await Employee.find({ departmentId: actorEmployee.departmentId }).select('_id');
        baseFilter.employeeId = { $in: deptEmps.map((e) => e._id) };
      } else if (!isHR && !isDeptMgr) {
        const ownFilters = [{ requestedBy: actor._id }];
        if (actorEmployee?._id) ownFilters.push({ employeeId: actorEmployee._id });
        baseFilter.$or = ownFilters;
      }
    }
  }

  const [
    total,
    pending,
    underReview,
    approved,
    rejected,
    returned,
    categoryAgg
  ] = await Promise.all([
    ProfileChangeRequest.countDocuments(baseFilter),
    ProfileChangeRequest.countDocuments({ ...baseFilter, status: 'pending' }),
    ProfileChangeRequest.countDocuments({ ...baseFilter, status: 'under_review' }),
    ProfileChangeRequest.countDocuments({ ...baseFilter, status: 'approved' }),
    ProfileChangeRequest.countDocuments({ ...baseFilter, status: 'rejected' }),
    ProfileChangeRequest.countDocuments({ ...baseFilter, status: 'returned' }),
    ProfileChangeRequest.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
  ]);

  const categoryBreakdown = {};
  categoryAgg.forEach((c) => {
    categoryBreakdown[c._id || 'other'] = c.count;
  });

  let myPendingAction = pending;
  if (actor) {
    const isSuperAdmin = actor.roles?.some((r) => r.name === 'Super Admin' || r === 'Super Admin');
    const isHR = actor.roles?.some((r) => r.name === 'HR Manager' || r === 'HR Manager');
    if (!isSuperAdmin && !isHR) {
      myPendingAction = 0;
    }
  }

  return {
    total,
    pending,
    under_review: underReview,
    approved,
    rejected,
    returned,
    myPendingAction,
    categoryBreakdown
  };
};

/**
 * Retrieve single change request with deep population
 * @param {string} id
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const getChangeRequestById = async (id, actor = null) => {
  const req = await ProfileChangeRequest.findOne({ _id: id, isDeleted: false })
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode email phone departmentId designationId reportingManagerId avatar employmentStatus',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title code' },
        { path: 'reportingManagerId', select: 'name employeeCode email' }
      ]
    })
    .populate('requestedBy', 'email name')
    .populate('decidedBy', 'email name')
    .populate('assignedTo', 'email name')
    .populate('timeline.actor', 'email name');

  if (!req) {
    throw new ApiError(404, 'Change request not found');
  }

  if (actor) {
    let isSuperAdmin = actor.role === 'Super Admin' || actor.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
    if (!isSuperAdmin && Array.isArray(actor.roles) && actor.roles.length > 0) {
      const saRole = await Role.findOne({ name: 'Super Admin' }).select('_id');
      if (saRole && actor.roles.some((r) => String(r._id || r) === String(saRole._id))) {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin) {
      let isHR = actor.roles?.some((r) => r === 'HR Manager' || r?.name === 'HR Manager');
      if (!isHR && Array.isArray(actor.roles) && actor.roles.length > 0) {
        const hrRoleDoc = await Role.findOne({ name: 'HR Manager' }).select('_id');
        if (hrRoleDoc && actor.roles.some((r) => String(r._id || r) === String(hrRoleDoc._id))) {
          isHR = true;
        }
      }

      if (!isHR) {
        const actorEmployee = await Employee.findOne({ userId: actor._id, isDeleted: false });
        let isDeptMgr = actor.roles?.some((r) => r === 'Department Manager' || r?.name === 'Department Manager');
        if (!isDeptMgr && Array.isArray(actor.roles) && actor.roles.length > 0) {
          const dmRoleDoc = await Role.findOne({ name: 'Department Manager' }).select('_id');
          if (dmRoleDoc && actor.roles.some((r) => String(r._id || r) === String(dmRoleDoc._id))) {
            isDeptMgr = true;
          }
        }

        const isApplicant = String(req.requestedBy?._id || req.requestedBy) === String(actor._id) ||
          (actorEmployee && String(req.employeeId?._id || req.employeeId) === String(actorEmployee._id));

        const isSameDept = isDeptMgr && actorEmployee?.departmentId &&
          String(req.employeeId?.departmentId?._id || req.employeeId?.departmentId) === String(actorEmployee.departmentId);

        if (!isApplicant && !isSameDept) {
          throw new ApiError(403, 'You do not have permission to view this change request');
        }
      }
    }
  }

  return req;
};

/**
 * Retrieve employee self-service list of their own change requests
 * @param {string} userId
 * @param {Object} query
 * @returns {Promise<Array<Object>>}
 */
export const getMyChangeRequests = async (userId, query = {}) => {
  const employee = await Employee.findOne({ userId, isDeleted: false });
  const filter = {
    isDeleted: false,
    $or: [{ requestedBy: userId }]
  };
  if (employee?._id) {
    filter.$or.push({ employeeId: employee._id });
  }

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  const requests = await ProfileChangeRequest.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name employeeCode email departmentId designationId avatar',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title code' }
      ]
    })
    .populate('decidedBy', 'name email')
    .sort({ createdAt: -1 });

  return requests;
};

/**
 * Decide (approve / reject) sensitive field change request with cross-module sync
 * @param {string} id
 * @param {Object} decision
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const decideChangeRequest = async (id, { action, rejectionReason, decisionReason }, actor) => {
  const changeReq = await ProfileChangeRequest.findById(id);
  if (!changeReq) {
    throw new ApiError(404, 'Change request not found');
  }

  await assertSuperAdminIfApplicantIsHR(changeReq.employeeId, actor, 'profile change request');

  if (changeReq.status !== 'pending' && changeReq.status !== 'under_review') {
    throw new ApiError(400, `Request is already ${changeReq.status}`);
  }

  const finalReason = decisionReason || rejectionReason || (action === 'approved' ? 'Approved by HR' : 'Rejected by HR');

  if (action === 'rejected') {
    changeReq.status = 'rejected';
    changeReq.decisionReason = finalReason;
    changeReq.rejectionReason = finalReason;
    changeReq.decidedBy = actor._id;
    changeReq.decidedAt = new Date();

    changeReq.timeline.push({
      action: 'rejected',
      actor: actor._id,
      actorName: actor.name || 'HR Reviewer',
      actorRole: actor.role || 'HR',
      note: finalReason,
      timestamp: new Date()
    });

    await changeReq.save();

    await recordAuditLog({
      actor,
      action: 'change_request.rejected',
      entity: 'ProfileChangeRequest',
      entityId: changeReq._id,
      details: { rejectionReason: finalReason }
    }).catch(() => {});

    await notify(changeReq.requestedBy, {
      type: 'profile',
      title: 'Profile Change Request Declined',
      body: `Your request to update ${changeReq.field} was declined: ${finalReason}`,
      link: '/change-requests'
    }).catch(() => {});

    emitToCompany('change_request:updated', {
      requestId: changeReq._id,
      status: 'rejected'
    });

    return changeReq;
  }

  // Approval flow: Apply updates onto target Employee record
  const employee = await Employee.findById(changeReq.employeeId);
  if (!employee) {
    throw new ApiError(404, 'Target employee record not found');
  }

  const beforeSnapshot = employee.toObject();
  const category = changeReq.category;
  const requestedValue = changeReq.requestedValue;

  if (category === 'bank_details' || changeReq.field === 'bankDetails') {
    const bankVal = { ...requestedValue };
    if (bankVal.iban) {
      bankVal.iban = encrypt(bankVal.iban);
    }
    employee.bankDetails = {
      ...employee.bankDetails?.toObject?.(),
      ...bankVal
    };
  } else if (category === 'address' || changeReq.field === 'address') {
    employee.address = {
      ...employee.address?.toObject?.(),
      ...requestedValue
    };
  } else if (category === 'emergency_contact' || changeReq.field === 'emergencyContact') {
    employee.emergencyContact = {
      ...employee.emergencyContact?.toObject?.(),
      ...requestedValue
    };
  } else if (category === 'contact') {
    if (requestedValue.phone) employee.phone = requestedValue.phone;
    if (requestedValue.personalEmail || requestedValue.email) {
      employee.email = requestedValue.personalEmail || requestedValue.email;
    }
  } else if (category === 'personal') {
    if (requestedValue.gender) employee.gender = requestedValue.gender;
    if (requestedValue.dob) employee.dob = requestedValue.dob;
    if (requestedValue.maritalStatus) employee.maritalStatus = requestedValue.maritalStatus;
    if (requestedValue.bloodGroup) employee.bloodGroup = requestedValue.bloodGroup;

    const newName = requestedValue.name || requestedValue.fullName;
    if (newName) {
      employee.name = newName;
      if (employee.userId) {
        await User.findByIdAndUpdate(employee.userId, { name: newName }).catch(() => {});
      }
    }
  } else if (category === 'department' || changeReq.field === 'departmentId') {
    const newDeptId = requestedValue.departmentId || requestedValue;
    const targetDept = await Department.findById(newDeptId);
    if (!targetDept) {
      throw new ApiError(400, 'Target department does not exist');
    }
    const prevDeptId = employee.departmentId;
    employee.departmentId = newDeptId;

    await EmployeeHistory.create({
      employeeId: employee._id,
      eventType: 'Transfer',
      previousDepartmentId: prevDeptId,
      newDepartmentId: newDeptId,
      remarks: changeReq.reason || 'Approved Department Change Request'
    }).catch(() => {});
  } else if (category === 'designation' || changeReq.field === 'designationId') {
    const newDesigId = requestedValue.designationId || requestedValue;
    const targetDesig = await Designation.findById(newDesigId);
    if (!targetDesig) {
      throw new ApiError(400, 'Target designation does not exist');
    }
    const prevDesigId = employee.designationId;
    employee.designationId = newDesigId;

    await EmployeeHistory.create({
      employeeId: employee._id,
      eventType: 'Promotion',
      previousDesignationId: prevDesigId,
      newDesignationId: newDesigId,
      remarks: changeReq.reason || 'Approved Designation Change Request'
    }).catch(() => {});
  } else if (category === 'reporting_manager' || changeReq.field === 'reportingManagerId') {
    const newManagerId = requestedValue.reportingManagerId || requestedValue;
    if (String(newManagerId) === String(employee._id)) {
      throw new ApiError(400, 'Employee cannot be their own reporting manager');
    }
    const targetMgr = await Employee.findById(newManagerId);
    if (!targetMgr) {
      throw new ApiError(400, 'Target reporting manager does not exist');
    }
    employee.reportingManagerId = newManagerId;
    employee.managerId = newManagerId;
  } else {
    employee[changeReq.field] = requestedValue;
  }

  await employee.save();

  changeReq.status = 'approved';
  changeReq.decisionReason = finalReason;
  changeReq.decidedBy = actor._id;
  changeReq.decidedAt = new Date();

  changeReq.timeline.push({
    action: 'approved',
    actor: actor._id,
    actorName: actor.name || 'HR Reviewer',
    actorRole: actor.role || 'HR',
    note: finalReason,
    timestamp: new Date()
  });

  await changeReq.save();

  await recordAuditLog({
    actor,
    action: 'change_request.approved',
    entity: 'Employee',
    entityId: employee._id,
    before: beforeSnapshot,
    after: employee.toObject()
  }).catch(() => {});

  await notify(changeReq.requestedBy, {
    type: 'profile',
    title: 'Profile Change Request Approved',
    body: `Your request to update ${changeReq.field} has been approved and applied to your profile.`,
    link: '/change-requests'
  }).catch(() => {});

  emitToCompany('change_request:updated', {
    requestId: changeReq._id,
    status: 'approved'
  });

  return changeReq;
};

/**
 * Return change request for correction
 * @param {string} id
 * @param {Object} payload
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const returnChangeRequest = async (id, { notes }, actor) => {
  const changeReq = await ProfileChangeRequest.findById(id);
  if (!changeReq) {
    throw new ApiError(404, 'Change request not found');
  }

  await assertSuperAdminIfApplicantIsHR(changeReq.employeeId, actor, 'profile change request');

  if (changeReq.status !== 'pending' && changeReq.status !== 'under_review') {
    throw new ApiError(400, `Cannot return a request that is already ${changeReq.status}`);
  }

  changeReq.status = 'returned';
  changeReq.decisionReason = notes;
  changeReq.decidedBy = actor._id;
  changeReq.decidedAt = new Date();

  changeReq.timeline.push({
    action: 'returned',
    actor: actor._id,
    actorName: actor.name || 'Reviewer',
    actorRole: actor.role || 'HR Manager',
    note: notes,
    timestamp: new Date()
  });

  await changeReq.save();

  await recordAuditLog({
    actor,
    action: 'change_request.returned',
    entity: 'ProfileChangeRequest',
    entityId: changeReq._id,
    details: { notes }
  }).catch(() => {});

  await notify(changeReq.requestedBy, {
    type: 'profile',
    title: 'Change Request Returned for Correction',
    body: `Your change request for ${changeReq.field} was returned: "${notes}". Please revise and resubmit.`,
    link: '/profile'
  }).catch(() => {});

  emitToCompany('change_request:updated', {
    requestId: changeReq._id,
    status: 'returned'
  });

  return changeReq;
};

/**
 * Cancel change request by employee requester
 * @param {string} id
 * @param {Object} payload
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export const cancelChangeRequest = async (id, { reason }, actor) => {
  const changeReq = await ProfileChangeRequest.findById(id);
  if (!changeReq) {
    throw new ApiError(404, 'Change request not found');
  }

  if (changeReq.status !== 'pending' && changeReq.status !== 'returned' && changeReq.status !== 'under_review') {
    throw new ApiError(400, `Cannot cancel a request that is already ${changeReq.status}`);
  }

  const isOwner = String(changeReq.requestedBy) === String(actor._id);
  const isSuperAdmin = actor.roles?.some((r) => r.name === 'Super Admin' || r === 'Super Admin');
  if (!isOwner && !isSuperAdmin) {
    throw new ApiError(403, 'You are not authorized to cancel this change request');
  }

  changeReq.status = 'cancelled';
  changeReq.decisionReason = reason || 'Cancelled by employee';

  changeReq.timeline.push({
    action: 'cancelled',
    actor: actor._id,
    actorName: actor.name || 'Requester',
    actorRole: isOwner ? 'Employee' : 'Admin',
    note: reason || 'Cancelled by employee',
    timestamp: new Date()
  });

  await changeReq.save();

  await recordAuditLog({
    actor,
    action: 'change_request.cancelled',
    entity: 'ProfileChangeRequest',
    entityId: changeReq._id,
    details: { reason }
  }).catch(() => {});

  emitToCompany('change_request:updated', {
    requestId: changeReq._id,
    status: 'cancelled'
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
    const inserted = await Employee.insertMany(validEmployees);
    const curYear = new Date().getUTCFullYear();
    for (const emp of inserted) {
      try {
        await initializeEmployeeLeaveBalances(emp._id, curYear);
      } catch (leaveErr) {
        // Fallback silently if leave types not yet seeded
      }
    }
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

  // Super Admin is a system administrator, not an employee: exclude from workforce export
  conditions.email = { $nin: ['mhamzaofficial159@gmail.com', 'admin@hrm.company.pk'] };
  conditions.employeeCode = { $ne: 'EMP-000' };

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

/**
 * Retrieve official compiled Employee ID Card coordinates and verifiable token (Phase 36)
 * @param {string} employeeId
 * @param {Object} actor
 * @param {string} permissionScope
 * @returns {Promise<Object>}
 */
export const getEmployeeIdCard = async (employeeId, actor, permissionScope = 'all') => {
  const employee = await Employee.findById(employeeId)
    .populate('departmentId', 'name code')
    .populate('designationId', 'title code')
    .populate('userId', 'avatar email isActive');

  if (!employee || employee.isDeleted) {
    throw new ApiError(404, 'Employee record not found or has been archived');
  }

  // Horizontal authorization & PBAC enforcement
  const isOwn =
    String(employee.userId?._id || employee.userId) === String(actor?._id) ||
    String(employee._id) === String(actor?.employeeId) ||
    String(employee._id) === String(actor?.employee);

  const isActorSuperAdmin = actor?.roles?.some((r) => {
    const roleName = typeof r === 'string' ? r : r.name;
    return roleName === 'Super Admin';
  });

  const isActorHR = actor?.roles?.some((r) => {
    const roleName = typeof r === 'string' ? r : r.name;
    return roleName === 'HR Manager';
  });

  if (!isActorSuperAdmin && !isActorHR && !isOwn && permissionScope !== 'all') {
    if (permissionScope === 'department') {
      let actorDepartmentId = actor.departmentId;
      if (!actorDepartmentId && actor.employeeId) {
        const actorEmp = await Employee.findById(actor.employeeId).select('departmentId');
        actorDepartmentId = actorEmp?.departmentId;
      }
      const targetDeptId = employee.departmentId?._id || employee.departmentId;
      if (String(actorDepartmentId) !== String(targetDeptId)) {
        throw new ApiError(403, 'Forbidden: You can only view ID cards of employees in your department');
      }
    } else {
      throw new ApiError(403, 'Forbidden: You do not have permission to view this employee ID card');
    }
  }

  // Central company settings
  const company = (await SettingService.getSetting('company')) || {};
  const idCardConfig = company.idCardConfig || {
    layout: 'vertical',
    primaryColor: '#00C471',
    theme: 'forest',
    showBloodGroup: true,
    showEmergencyContact: true,
    showDepartment: true,
    showDesignation: true,
    showJoiningDate: true,
    showBarcode: true,
    qrCodeType: 'verification',
    cardValidityYears: 2,
    backDisclaimer: 'This credential card remains the property of the organization. If found, please return to Human Resources.'
  };

  const issueDate = employee.joiningDate || employee.createdAt || new Date();
  const validityYears = Number(idCardConfig.cardValidityYears) || 2;
  const validUntil = new Date(issueDate);
  validUntil.setFullYear(validUntil.getFullYear() + validityYears);

  // Verifiable QR verification token / payload
  const qrVerificationPayload = {
    code: employee.employeeCode,
    name: employee.name,
    dept: employee.departmentId?.name || 'General',
    desig: employee.designationId?.title || 'Staff',
    validUntil: validUntil.toISOString().slice(0, 10),
    verifyUrl: `/verify/id-card?code=${encodeURIComponent(employee.employeeCode)}`
  };

  // Record audit log
  await recordAuditLog({
    action: 'EMPLOYEE_ID_CARD_GENERATED',
    actor,
    target: { id: employee._id, type: 'Employee' },
    details: {
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      department: employee.departmentId?.name
    }
  });

  return {
    employee: {
      _id: employee._id,
      name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      fullName: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      firstName: employee.firstName || (employee.name ? employee.name.split(' ')[0] : ''),
      lastName: employee.lastName || (employee.name ? employee.name.split(' ').slice(1).join(' ') : ''),
      employeeCode: employee.employeeCode,
      avatar: employee.avatar || employee.userId?.avatar || '',
      department: employee.departmentId?.name || 'Unassigned',
      designation: employee.designationId?.title || 'Unassigned',
      joiningDate: employee.joiningDate,
      bloodGroup: employee.bloodGroup || '',
      emergencyContact: employee.emergencyContact || null,
      employmentStatus: employee.employmentStatus
    },
    company: {
      name: company.name || 'Company',
      legalName: company.legalName || '',
      address: company.address || '',
      city: company.city || '',
      country: company.country || 'Pakistan',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      logoUrl: company.logoUrl || ''
    },
    idCardConfig,
    meta: {
      issueDate,
      validUntil,
      qrVerificationPayload
    }
  };
};
