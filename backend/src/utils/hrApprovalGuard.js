/**
 * @file hrApprovalGuard.js
 * @description Executive Segregation-of-Duties Guard:
 * Strictly enforces that ANY requests submitted by HR personnel (HR Managers)
 * can ONLY be approved or decided by the Super Admin.
 * 
 * For all regular employees / non-HR staff, all approval flows remain completely normal.
 */

import { Employee } from '../models/employee.model.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { notify } from '../services/notify.service.js';
import { ApiError } from './ApiError.js';

/**
 * Checks whether an actor/user holds the Super Admin role.
 * @param {Object} user 
 * @returns {boolean}
 */
export const isUserSuperAdmin = (user) => {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;
  return Array.isArray(user.roles) && user.roles.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin');
};

/**
 * Checks whether an actor/user holds the HR Manager role.
 * @param {Object} user 
 * @returns {boolean}
 */
export const isUserHR = (user) => {
  if (!user) return false;
  if (user.role === 'HR Manager') return true;
  return Array.isArray(user.roles) && user.roles.some((r) => (typeof r === 'string' ? r : r?.name) === 'HR Manager');
};

/**
 * Checks whether an actor/user holds the Department Manager role.
 * @param {Object} user 
 * @returns {boolean}
 */
export const isUserDeptManager = (user) => {
  if (!user) return false;
  if (user.role === 'Department Manager') return true;
  return Array.isArray(user.roles) && user.roles.some((r) => (typeof r === 'string' ? r : r?.name) === 'Department Manager');
};

/**
 * Determines whether the applicant (identified by employeeId, Employee object, or userId) is a Department Manager.
 * @param {string|Object} applicantEmployee - Employee ObjectId or populated Employee object
 * @param {string|Object} [applicantUser] - User ObjectId or User object (optional fallback)
 * @returns {Promise<boolean>}
 */
export const isApplicantDeptManager = async (applicantEmployee, applicantUser = null) => {
  try {
    // 1. Direct user check if already supplied
    if (applicantUser) {
      if (typeof applicantUser === 'object' && Array.isArray(applicantUser.roles)) {
        return isUserDeptManager(applicantUser);
      }
      const u = await User.findById(applicantUser).populate('roles').lean();
      if (u) return isUserDeptManager(u);
    }

    // 2. Resolve via employee
    if (applicantEmployee) {
      let targetUserId = null;
      if (typeof applicantEmployee === 'object') {
        if (applicantEmployee.userId) {
          if (typeof applicantEmployee.userId === 'object' && Array.isArray(applicantEmployee.userId.roles)) {
            return isUserDeptManager(applicantEmployee.userId);
          }
          targetUserId = applicantEmployee.userId?._id || applicantEmployee.userId;
        }
      }

      if (!targetUserId) {
        const empId = typeof applicantEmployee === 'object' ? applicantEmployee._id : applicantEmployee;
        if (empId) {
          const emp = await Employee.findById(empId).select('userId').lean();
          targetUserId = emp?.userId;
        }
      }

      if (targetUserId) {
        const u = await User.findById(targetUserId).populate('roles').lean();
        if (u) return isUserDeptManager(u);
      }
    }

    return false;
  } catch (err) {
    console.error('[isApplicantDeptManager Check Error]', err.message);
    return false;
  }
};

/**
 * Determines whether the applicant is either a Department Manager or an HR personnel.
 * @param {string|Object} applicantEmployee 
 * @param {string|Object} [applicantUser] 
 * @returns {Promise<boolean>}
 */
export const isApplicantManagerOrHR = async (applicantEmployee, applicantUser = null) => {
  const isHr = await isApplicantHR(applicantEmployee, applicantUser);
  if (isHr) return true;
  return isApplicantDeptManager(applicantEmployee, applicantUser);
};

/**
 * Determines whether the applicant (identified by employeeId, Employee object, or userId) is an HR staff member.
 * @param {string|Object} applicantEmployee - Employee ObjectId or populated Employee object
 * @param {string|Object} [applicantUser] - User ObjectId or User object (optional fallback)
 * @returns {Promise<boolean>}
 */
export const isApplicantHR = async (applicantEmployee, applicantUser = null) => {
  try {
    // 1. Direct user check if already supplied
    if (applicantUser) {
      if (typeof applicantUser === 'object' && Array.isArray(applicantUser.roles)) {
        return isUserHR(applicantUser);
      }
      const u = await User.findById(applicantUser).populate('roles').lean();
      if (u) return isUserHR(u);
    }

    // 2. Resolve via employee
    if (applicantEmployee) {
      let targetUserId = null;
      if (typeof applicantEmployee === 'object') {
        if (applicantEmployee.userId) {
          if (typeof applicantEmployee.userId === 'object' && Array.isArray(applicantEmployee.userId.roles)) {
            return isUserHR(applicantEmployee.userId);
          }
          targetUserId = applicantEmployee.userId?._id || applicantEmployee.userId;
        }
      }

      if (!targetUserId) {
        const empId = typeof applicantEmployee === 'object' ? applicantEmployee._id : applicantEmployee;
        if (empId) {
          const emp = await Employee.findById(empId).select('userId').lean();
          targetUserId = emp?.userId;
        }
      }

      if (targetUserId) {
        const u = await User.findById(targetUserId).populate('roles').lean();
        if (u) return isUserHR(u);
      }
    }

    return false;
  } catch (err) {
    console.error('[isApplicantHR Check Error]', err.message);
    return false;
  }
};

/**
 * Asserts that if the applicant is a Department Manager or HR Manager, the decision actor MUST be a Super Admin.
 * Throws ApiError(403) if the applicant is Dept Manager/HR and actor is not Super Admin.
 * 
 * @param {string|Object} applicantEmployee - Employee ObjectId or populated Employee object
 * @param {Object} actor - Authenticated decision maker user context (req.user)
 * @param {string} [requestTypeName='request'] - Name of request type for the error message
 * @param {string|Object} [applicantUser=null] - Optional user ID of applicant
 */
export const assertSuperAdminIfApplicantIsManagerOrHR = async (
  applicantEmployee,
  actor,
  requestTypeName = 'request',
  applicantUser = null
) => {
  const isMgmt = await isApplicantManagerOrHR(applicantEmployee, applicantUser);
  if (isMgmt) {
    if (!isUserSuperAdmin(actor)) {
      throw new ApiError(
        403,
        `Forbidden: Any ${requestTypeName} applied by Department Managers or HR personnel can only be approved or decided by the Super Admin.`
      );
    }
  }
};

/**
 * Backwards-compatible alias for assertSuperAdminIfApplicantIsManagerOrHR.
 */
export const assertSuperAdminIfApplicantIsHR = assertSuperAdminIfApplicantIsManagerOrHR;

/**
 * Helper to dispatch in-app/push notification to all active Super Admins.
 * @param {Object} payload - Notification payload { type, title, body, link }
 */
export const notifySuperAdmins = async (payload) => {
  try {
    const role = await Role.findOne({ name: 'Super Admin' }).select('_id');
    const query = {
      isActive: { $ne: false },
      isDeleted: { $ne: true }
    };
    if (role) {
      query.$or = [{ roles: role._id }, { role: 'Super Admin' }];
    } else {
      query.role = 'Super Admin';
    }

    const adminUsers = await User.find(query).select('_id').lean();
    const adminUserIds = adminUsers.map((u) => u._id);
    if (adminUserIds.length > 0) {
      return await notify(adminUserIds, payload);
    }
  } catch (err) {
    console.error('[Notification Error - Super Admins]', err.message);
  }
};

/**
 * Helper to dispatch in-app/push notification to all active HR Managers.
 * @param {Object} payload - Notification payload { type, title, body, link }
 */
export const notifyHRManagers = async (payload) => {
  try {
    const role = await Role.findOne({ name: 'HR Manager' }).select('_id');
    if (!role) return;
    const hrUsers = await User.find({
      roles: role._id,
      isActive: true,
      isDeleted: { $ne: true }
    }).select('_id').lean();
    const hrUserIds = hrUsers.map((u) => u._id);
    if (hrUserIds.length > 0) {
      await notify(hrUserIds, payload);
    }
  } catch (err) {
    console.error('[Notification Error - HR Managers]', err.message);
  }
};
