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
 * Asserts that if the applicant is an HR Manager, the decision actor MUST be a Super Admin.
 * Throws ApiError(403) if the applicant is HR and actor is not Super Admin.
 * 
 * @param {string|Object} applicantEmployee - Employee ObjectId or populated Employee object
 * @param {Object} actor - Authenticated decision maker user context (req.user)
 * @param {string} [requestTypeName='request'] - Name of request type for the error message
 * @param {string|Object} [applicantUser=null] - Optional user ID of applicant
 */
export const assertSuperAdminIfApplicantIsHR = async (
  applicantEmployee,
  actor,
  requestTypeName = 'request',
  applicantUser = null
) => {
  const isHr = await isApplicantHR(applicantEmployee, applicantUser);
  if (isHr) {
    if (!isUserSuperAdmin(actor)) {
      throw new ApiError(
        403,
        `Forbidden: Any ${requestTypeName} applied by HR personnel can only be approved or decided by the Super Admin.`
      );
    }
  }
};
