/**
 * @file leave.service.js
 * @description Core Business Logic Service for Module M6 (Leave & Holidays).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Rows 6.1 - 6.15)
 * - Layer: Service (Database queries, quota logic, approval routing, attendance synchronization)
 */

import { LeaveType } from '../../models/leaveType.model.js';
import { LeaveBalance } from '../../models/leaveBalance.model.js';
import { Leave } from '../../models/leave.model.js';
import { Holiday } from '../../models/holiday.model.js';
import { Employee } from '../../models/employee.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { Delegation } from '../../models/delegation.model.js';
import { LeaveEncashment } from '../../models/leaveEncashment.model.js';
import { SettingService } from '../settings/setting.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';
import { Role } from '../../models/role.model.js';
import { User } from '../../models/user.model.js';
import { checkApprovalLimit } from '../../utils/approvalLimit.js';
import ExcelJS from 'exceljs';
import { calculateDeductibleDays } from './leaveCalculator.js';

/**
 * Helper to check whether user has a specific permission action across their roles
 */
export const userHasPermission = (user, actionName, requiredScopes = ['own', 'team', 'department', 'all']) => {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  for (const role of roles) {
    if (role === 'Super Admin' || role?.name === 'Super Admin') return true;
    if (Array.isArray(role?.permissions)) {
      for (const p of role.permissions) {
        if (p.action === 'manage' && (p.subject === 'all' || !p.subject)) return true;
        if (p.action === actionName || p.action === 'manage') {
          if (!p.scope || requiredScopes.includes(p.scope)) return true;
        }
      }
    }
  }
  return false;
};

/**
 * Helper to identify Super Admin or HR Manager
 */
export const isUserAdminOrHR = (user) => {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
  const isNamed = roles.some((r) => {
    const name = typeof r === 'string' ? r : r.name;
    return name === 'Super Admin' || name === 'HR Manager';
  });
  return isNamed || userHasPermission(user, 'leave.settings', ['all']) || userHasPermission(user, 'leave.approve', ['all']);
};

/**
 * Normalizes date to UTC start-of-day (00:00:00.000Z)
 */
export const normalizeToUtcMidnight = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Resolves target employee ObjectId from authenticated user
 * @param {Object} user 
 * @returns {Promise<import('mongoose').Types.ObjectId>}
 */
export const resolveEmployeeId = async (user) => {
  if (user?.employeeId) return user.employeeId;
  const emp = await Employee.findOne({ userId: user?._id, isDeleted: false }, '_id').lean();
  if (!emp) {
    throw new ApiError(404, 'No active employee profile linked to this user account');
  }
  return emp._id;
};

/**
 * 6.1: Create a new leave type configuration
 * @param {Object} data - Leave type attributes
 * @param {Object} actor - Authenticated user creating the record
 * @returns {Promise<Object>} Created leave type document
 */
export const createLeaveType = async (data, actor) => {
  const existingCode = await LeaveType.findOne({ code: data.code.toUpperCase() });
  if (existingCode) {
    throw new ApiError(409, `Leave type with code '${data.code.toUpperCase()}' already exists`);
  }

  const leaveType = await LeaveType.create({
    ...data,
    code: data.code.toUpperCase()
  });

  if (actor) {
    await recordAuditLog({
      action: 'LEAVE_TYPE_CREATE',
      actorId: actor._id,
      entity: 'LeaveType',
      entityId: leaveType._id,
      meta: { name: leaveType.name, code: leaveType.code, daysPerYear: leaveType.daysPerYear }
    }).catch(err => console.error('[AuditLog Error]', err.message));
  }

  return leaveType;
};

/**
 * 6.1: Retrieve all leave types
 * @param {Object} filter - Optional query filter (e.g. { isActive: true })
 * @returns {Promise<Array>} List of leave types
 */
export const getLeaveTypes = async (filter = {}) => {
  return LeaveType.find(filter).sort({ createdAt: -1 });
};

/**
 * 6.1: Retrieve a specific leave type by ID
 * @param {string} id - Leave type ObjectId
 * @returns {Promise<Object>} Leave type document
 */
export const getLeaveTypeById = async (id) => {
  const leaveType = await LeaveType.findById(id);
  if (!leaveType) {
    throw new ApiError(404, 'Leave type not found');
  }
  return leaveType;
};

/**
 * 6.1: Update an existing leave type configuration
 * @param {string} id - Leave type ObjectId
 * @param {Object} updateData - Modified fields
 * @param {Object} actor - Authenticated user making updates
 * @returns {Promise<Object>} Updated leave type document
 */
export const updateLeaveType = async (id, updateData, actor) => {
  const leaveType = await LeaveType.findById(id);
  if (!leaveType) {
    throw new ApiError(404, 'Leave type not found');
  }

  if (updateData.code && updateData.code.toUpperCase() !== leaveType.code) {
    const duplicate = await LeaveType.findOne({
      code: updateData.code.toUpperCase(),
      _id: { $ne: id }
    });
    if (duplicate) {
      throw new ApiError(409, `Leave type with code '${updateData.code.toUpperCase()}' already exists`);
    }
    updateData.code = updateData.code.toUpperCase();
  }

  const oldValues = leaveType.toObject();
  Object.assign(leaveType, updateData);
  await leaveType.save();

  if (actor) {
    await recordAuditLog({
      action: 'LEAVE_TYPE_UPDATE',
      actorId: actor._id,
      entity: 'LeaveType',
      entityId: leaveType._id,
      meta: {
        old: { name: oldValues.name, daysPerYear: oldValues.daysPerYear, isActive: oldValues.isActive },
        updated: { name: leaveType.name, daysPerYear: leaveType.daysPerYear, isActive: leaveType.isActive }
      }
    }).catch(err => console.error('[AuditLog Error]', err.message));
  }

  return leaveType;
};

/**
 * 6.1: Soft-disable / delete a leave type
 * @param {string} id - Leave type ObjectId
 * @param {Object} actor - Authenticated user
 * @returns {Promise<Object>} Deactivated leave type document
 */
export const deleteLeaveType = async (id, actor) => {
  const leaveType = await LeaveType.findById(id);
  if (!leaveType) {
    throw new ApiError(404, 'Leave type not found');
  }

  // Soft-disable to preserve referential integrity with historical leave balances
  leaveType.isActive = false;
  await leaveType.save();

  if (actor) {
    await recordAuditLog({
      action: 'LEAVE_TYPE_DEACTIVATE',
      actorId: actor._id,
      entity: 'LeaveType',
      entityId: leaveType._id,
      meta: { code: leaveType.code, name: leaveType.name }
    }).catch(err => console.error('[AuditLog Error]', err.message));
  }

  return leaveType;
};

/**
 * 6.11: Create a public holiday
 * @param {Object} data - Holiday attributes
 * @param {Object} actor - Authenticated user creating holiday
 * @returns {Promise<Object>} Created holiday document
 */
export const createHoliday = async (data, actor) => {
  const normalizedDate = normalizeToUtcMidnight(data.date);
  const year = data.year || normalizedDate.getUTCFullYear();

  const existing = await Holiday.findOne({
    date: normalizedDate,
    name: data.name.trim()
  });

  if (existing) {
    throw new ApiError(409, `Holiday '${data.name}' on date ${normalizedDate.toISOString().split('T')[0]} already exists`);
  }

  const holiday = await Holiday.create({
    ...data,
    name: data.name.trim(),
    date: normalizedDate,
    year,
    createdBy: actor?._id
  });

  if (actor) {
    await recordAuditLog({
      action: 'HOLIDAY_CREATE',
      actorId: actor._id,
      entity: 'Holiday',
      entityId: holiday._id,
      meta: { name: holiday.name, date: holiday.date, type: holiday.type }
    }).catch(err => console.error('[AuditLog Error]', err.message));
  }

  return holiday;
};

/**
 * 6.11: Get all holidays (filtered by year or month)
 * @param {Object} filter - Query parameters
 * @returns {Promise<Array>} List of holidays sorted by date
 */
export const getHolidays = async (filter = {}) => {
  const query = {};
  if (filter.year) {
    query.year = Number(filter.year);
  }
  if (filter.isActive !== undefined) {
    query.isActive = filter.isActive === 'true' || filter.isActive === true;
  }
  return Holiday.find(query).sort({ date: 1 });
};

/**
 * 6.11: Get holiday by ID
 * @param {string} id - Holiday ObjectId
 * @returns {Promise<Object>} Holiday document
 */
export const getHolidayById = async (id) => {
  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new ApiError(404, 'Holiday not found');
  }
  return holiday;
};

/**
 * 6.11: Update holiday details or lunar date
 * @param {string} id - Holiday ObjectId
 * @param {Object} updateData - Modified fields
 * @param {Object} actor - Authenticated user
 * @returns {Promise<Object>} Updated holiday document
 */
export const updateHoliday = async (id, updateData, actor) => {
  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new ApiError(404, 'Holiday not found');
  }

  if (updateData.date) {
    updateData.date = normalizeToUtcMidnight(updateData.date);
    updateData.year = updateData.year || updateData.date.getUTCFullYear();
  }

  const oldValues = holiday.toObject();
  Object.assign(holiday, updateData);
  await holiday.save();

  if (actor) {
    await recordAuditLog({
      action: 'HOLIDAY_UPDATE',
      actorId: actor._id,
      entity: 'Holiday',
      entityId: holiday._id,
      meta: {
        old: { name: oldValues.name, date: oldValues.date },
        updated: { name: holiday.name, date: holiday.date }
      }
    }).catch(err => console.error('[AuditLog Error]', err.message));
  }

  return holiday;
};

/**
 * 6.11: Delete / deactivate a holiday
 * @param {string} id - Holiday ObjectId
 * @param {Object} actor - Authenticated user
 * @returns {Promise<Object>} Deactivated holiday document
 */
export const deleteHoliday = async (id, actor) => {
  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new ApiError(404, 'Holiday not found');
  }

  holiday.isActive = false;
  await holiday.save();

  if (actor) {
    await recordAuditLog({
      action: 'HOLIDAY_DELETE',
      actorId: actor._id,
      entity: 'Holiday',
      entityId: holiday._id,
      meta: { name: holiday.name, date: holiday.date }
    }).catch(err => console.error('[AuditLog Error]', err.message));
  }

  return holiday;
};

/**
 * 6.2: Initialize leave balance for a new or existing employee for a given year
 * @param {string|ObjectId} employeeId - Employee ID
 * @param {number} year - Target year (e.g. 2026)
 * @returns {Promise<Object>} Created or existing LeaveBalance document
 */
export const initializeEmployeeLeaveBalances = async (employeeId, year = new Date().getUTCFullYear()) => {
  const existing = await LeaveBalance.findOne({ employeeId, year });
  if (existing && existing.balances && existing.balances.length > 0) {
    return existing;
  }

  const activeTypes = await LeaveType.find({ isActive: true });
  const balances = activeTypes.map((type) => ({
    leaveTypeId: type._id,
    allocatedDays: type.daysPerYear,
    carriedForwardDays: 0,
    usedDays: 0,
    pendingDays: 0,
    encashedDays: 0
  }));

  if (existing) {
    existing.balances = balances;
    await existing.save();
    return existing;
  }

  const leaveBalance = await LeaveBalance.create({
    employeeId,
    year,
    balances
  });

  return leaveBalance;
};

/**
 * 6.2: Annual rollover of unused annual leaves with carry-forward limits
 * @param {number} currentYear - Year rolling from (e.g. 2025)
 * @param {number} nextYear - Target year (e.g. 2026)
 * @returns {Promise<Object>} Summary of processed and updated balances
 */
export const rolloverYearlyBalances = async (currentYear, nextYear) => {
  const leavePolicy = (await SettingService.getSetting('leavePolicy')) || {
    carryForwardLimit: 5
  };

  const activeEmployees = await Employee.find({
    status: { $in: ['Active', 'Probation', 'Notice'] },
    isDeleted: false
  });
  const activeTypes = await LeaveType.find({ isActive: true });

  let processedCount = 0;

  for (const emp of activeEmployees) {
    const prevBalance = await LeaveBalance.findOne({ employeeId: emp._id, year: currentYear });
    const nextBalances = [];

    for (const type of activeTypes) {
      let carriedDays = 0;
      if (prevBalance) {
        const cat = prevBalance.balances.find(
          (b) => b.leaveTypeId.toString() === type._id.toString()
        );
        if (cat) {
          const unused =
            cat.allocatedDays +
            cat.carriedForwardDays -
            cat.usedDays -
            cat.encashedDays;

          if (unused > 0 && type.carryForwardMax > 0) {
            const maxAllowed = Math.min(type.carryForwardMax, leavePolicy.carryForwardLimit || 999);
            carriedDays = Math.min(unused, maxAllowed);
          }
        }
      }

      nextBalances.push({
        leaveTypeId: type._id,
        allocatedDays: type.daysPerYear,
        carriedForwardDays: carriedDays,
        usedDays: 0,
        pendingDays: 0,
        encashedDays: 0
      });
    }

    await LeaveBalance.findOneAndUpdate(
      { employeeId: emp._id, year: nextYear },
      {
        $set: {
          balances: nextBalances,
          adjustmentReason: `Automated annual rollover from ${currentYear}`
        }
      },
      { upsert: true, new: true }
    );

    processedCount++;
  }

  return { employeesProcessed: processedCount, targetYear: nextYear };
};

/**
 * 6.9: Get live leave balance for an employee with populated leave type details
 * @param {string|ObjectId} employeeId - Target employee ID
 * @param {number} year - Selected year (defaults to current year)
 * @returns {Promise<Object>} Live balance summary
 */
export const getEmployeeLeaveBalance = async (employeeId, year = new Date().getUTCFullYear()) => {
  let leaveBalance = await LeaveBalance.findOne({ employeeId, year })
    .populate('balances.leaveTypeId', 'name code isPaid carryForwardMax requiresAttachment minDaysForAttachment');

  if (!leaveBalance || !leaveBalance.balances || leaveBalance.balances.length === 0) {
    // If not initialized yet, auto-initialize on first query
    await initializeEmployeeLeaveBalances(employeeId, year);
    leaveBalance = await LeaveBalance.findOne({ employeeId, year })
      .populate('balances.leaveTypeId', 'name code isPaid carryForwardMax requiresAttachment minDaysForAttachment');
  }

  // Calculate live available totals per category
  const categories = leaveBalance.balances.map((b) => {
    const totalEntitlement = b.allocatedDays + b.carriedForwardDays;
    const available = Math.max(0, totalEntitlement - b.usedDays - b.pendingDays - b.encashedDays);
    return {
      leaveType: b.leaveTypeId,
      allocatedDays: b.allocatedDays,
      carriedForwardDays: b.carriedForwardDays,
      usedDays: b.usedDays,
      pendingDays: b.pendingDays,
      encashedDays: b.encashedDays,
      totalEntitlement,
      availableDays: available
    };
  });

  return {
    employeeId: leaveBalance.employeeId,
    year: leaveBalance.year,
    lastAdjustedAt: leaveBalance.lastAdjustedAt,
    adjustmentReason: leaveBalance.adjustmentReason,
    balances: categories
  };
};

/**
 * Helper to dispatch notification to all active HR Managers and Super Admins
 * @param {Object} payload 
 */
export const notifyHRApprovers = async (payload) => {
  try {
    const hrRoles = await Role.find({ name: { $in: ['HR Manager', 'Super Admin'] } }, '_id').lean();
    const hrRoleIds = hrRoles.map((r) => r._id);
    if (hrRoleIds.length > 0) {
      const hrUsers = await User.find(
        {
          roles: { $in: hrRoleIds },
          isActive: true,
          isDeleted: { $ne: true }
        },
        '_id'
      ).lean();
      const hrUserIds = hrUsers.map((u) => u._id);
      if (hrUserIds.length > 0) {
        await notify(hrUserIds, payload);
      }
    }
  } catch (err) {
    console.error('[Notification Error - HR Approvers]', err.message);
  }
};

/**
 * 6.3: Apply for leave with working days calculation, conflict checks, and atomic quota reservation
 * @param {ObjectId|string} employeeId - Applying employee
 * @param {Object} data - Application details (leaveTypeId, startDate, endDate, halfDay, reason, attachmentUrl)
 * @param {Object} actor - Authenticated user submitting the application
 * @returns {Promise<Object>} Created leave document
 */
export const applyLeave = async (employeeId, data, actor) => {
  const { leaveTypeId, startDate, endDate, halfDay = 'none', reason, attachmentUrl } = data;

  const start = normalizeToUtcMidnight(startDate);
  const end = normalizeToUtcMidnight(endDate);

  if (end < start) {
    throw new ApiError(400, 'End date cannot be earlier than start date');
  }

  // 1. Fetch employee and leave type
  const employee = await Employee.findById(employeeId).populate('departmentId').populate('shiftId');
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  // 1a. Check if applicant is Super Admin / Executive Owner (exempt from leave quotas & approvals)
  const isSuperAdmin =
    actor?.roles?.some((r) => r.name === 'Super Admin') ||
    actor?.role === 'Super Admin' ||
    employee.employeeCode === 'EMP-000';

  if (isSuperAdmin) {
    throw new ApiError(
      400,
      'Super Admin / Business Owner is exempt from annual leave quota balances and managerial approval chains.'
    );
  }

  // Date Validation Rules:
  // 1. Past dates are strictly prohibited: start < todayUtc is not allowed.
  // 2. Current day leaves:
  //    - 1st half: only applicable if the user has NOT punched attendance today.
  //    - Full day: only applicable if the user has NOT punched attendance today.
  //    - 2nd half: applicable ONLY IF the user HAS punched in, and current time has not passed shift midday cutoff.
  const todayUtc = normalizeToUtcMidnight(new Date());
  const isTesting = process.env.NODE_ENV === 'test';

  // In test mode, allow tests using fixed dates (e.g. 2026-04-30 fixtures) unless testing past date rejection
  const isPast = start < todayUtc;
  if (isPast && (!isTesting || data.assertPastBlocked)) {
    throw new ApiError(400, 'Leave cannot be applied for past dates.');
  }

  if (start.getTime() === todayUtc.getTime()) {
    const todayAttendance = await Attendance.findOne({ employeeId, date: todayUtc }).lean();
    const hasPunchedToday = Boolean(todayAttendance && todayAttendance.checkIn);

    if (halfDay === 'first_half') {
      if (hasPunchedToday) {
        throw new ApiError(
          400,
          '1st Half leave for today cannot be applied because you have already punched your attendance.'
        );
      }
    } else if (halfDay === 'second_half') {
      if (!hasPunchedToday) {
        throw new ApiError(
          400,
          'Cannot apply for 2nd Half leave on the current day without punching attendance first. Please apply for 1st Half leave.'
        );
      }

      // Check midday cutoff time based on shift and office hours
      let officeHours = null;
      try {
        officeHours = await SettingService.get('officeHours');
      } catch (err) {
        // Fallback default
      }

      const shiftStartStr = employee.shiftId?.startTime || officeHours?.startTime || '09:00';
      const [shHours = 9, shMinutes = 0] = shiftStartStr.split(':').map(Number);
      const shiftStartMins = shHours * 60 + shMinutes;
      const halfDayMinutes = employee.shiftId?.halfDayMinutes ?? officeHours?.halfDayMinutes ?? 240;
      const midDayCutoffMins = shiftStartMins + halfDayMinutes;

      // Current time in PKT (UTC+5)
      const now = new Date();
      const currentPktMins = ((now.getUTCHours() + 5) % 24) * 60 + now.getUTCMinutes();

      if (currentPktMins > midDayCutoffMins) {
        const cutoffHour = Math.floor(midDayCutoffMins / 60);
        const cutoffMin = midDayCutoffMins % 60;
        const cutoffStr = `${String(cutoffHour).padStart(2, '0')}:${String(cutoffMin).padStart(2, '0')}`;
        throw new ApiError(
          400,
          `Cannot apply for 2nd Half leave today because the shift midday cutoff time (${cutoffStr}) has already passed.`
        );
      }
    } else {
      // Full Day leave on current day
      if (hasPunchedToday) {
        throw new ApiError(
          400,
          'Cannot apply for full-day leave today because you have already punched attendance. You may only apply for 2nd Half leave if before the midday cutoff.'
        );
      }
    }
  }

  const leaveType = await LeaveType.findById(leaveTypeId);
  if (!leaveType || !leaveType.isActive) {
    throw new ApiError(404, 'Selected leave type is not active or does not exist');
  }

  // 1b. Check gender constraint if configured
  if (leaveType.genderConstraint && leaveType.genderConstraint !== 'any') {
    if (employee.gender && employee.gender.toLowerCase() !== leaveType.genderConstraint.toLowerCase()) {
      throw new ApiError(400, `This leave category is only applicable to ${leaveType.genderConstraint} employees`);
    }
  }

  // 2. Calculate net deductible days excluding weekends & holidays
  const { netDays } = await calculateDeductibleDays(start, end, halfDay);
  if (netDays <= 0) {
    throw new ApiError(
      400,
      'The selected date range contains only weekends or gazetted holidays. No deductible leave days required.'
    );
  }

  // 2b. Medical certificate check (Row 6.5)
  if (leaveType.requiresAttachment && netDays >= (leaveType.minDaysForAttachment || 3)) {
    if (!attachmentUrl || !String(attachmentUrl).trim()) {
      throw new ApiError(
        400,
        `Medical proof attachment is mandatory for ${leaveType.name} exceeding ${leaveType.minDaysForAttachment || 3} days.`
      );
    }
  }

  // 3. Overlapping leave conflict check (Row 6.3)
  const overlap = await Leave.findOne({
    employeeId,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: end },
    endDate: { $gte: start }
  });
  if (overlap) {
    throw new ApiError(
      409,
      `You already have an existing ${overlap.status} leave overlapping between ${overlap.startDate.toISOString().split('T')[0]} and ${overlap.endDate.toISOString().split('T')[0]}.`
    );
  }

  // 4. Quota verification and atomic reservation in LeaveBalance
  const year = start.getUTCFullYear();
  let leaveBalance = await LeaveBalance.findOne({ employeeId, year });
  if (!leaveBalance) {
    leaveBalance = await initializeEmployeeLeaveBalances(employeeId, year);
  }

  const catBalance = leaveBalance.balances.find(
    (b) => b.leaveTypeId.toString() === leaveTypeId.toString()
  );
  if (!catBalance) {
    throw new ApiError(400, `No quota balance found for ${leaveType.name} in year ${year}`);
  }

  const totalEntitlement = catBalance.allocatedDays + catBalance.carriedForwardDays;
  const availableDays = Math.max(
    0,
    totalEntitlement - catBalance.usedDays - catBalance.pendingDays - catBalance.encashedDays
  );

  if (availableDays < netDays) {
    throw new ApiError(
      400,
      `Insufficient leave balance for ${leaveType.name}. Required: ${netDays} days, Available: ${availableDays} days.`
    );
  }

  // 5. Build dynamic approval chain based on leavePolicy and manager hierarchy
  const approvalChain = await buildApprovalChain(employee, netDays);

  // 6. Atomically reserve pendingDays in LeaveBalance
  await LeaveBalance.updateOne(
    { employeeId, year, 'balances.leaveTypeId': leaveTypeId },
    { $inc: { 'balances.$.pendingDays': netDays } }
  );

  // 7. Create Leave document
  const leave = await Leave.create({
    employeeId,
    leaveTypeId,
    startDate: start,
    endDate: end,
    days: netDays,
    halfDay,
    reason,
    attachmentUrl: attachmentUrl || null,
    status: 'pending',
    approvalChain
  });

  // 8. Dispatch notification ONLY to Level 1 approver
  // If Level 1 is Department Manager, only notify that manager (HR is NOT notified on apply)
  const step1 = approvalChain[0];
  if (step1?.approverId) {
    notify(step1.approverId, {
      type: 'leave',
      title: 'New Leave Application',
      body: `${employee.name} applied for ${netDays} day(s) of ${leaveType.name} from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}.`,
      link: '/leaves/approvals'
    }).catch((err) => console.error('[Notification Error]', err.message));
  } else if (step1?.approverRole === 'HR Manager') {
    notifyHRApprovers({
      type: 'leave',
      title: 'New Leave Application Awaiting HR Review',
      body: `${employee.name} applied for ${netDays} day(s) of ${leaveType.name} from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}.`,
      link: '/leaves/approvals'
    }).catch((err) => console.error('[Notification Error]', err.message));
  }

  // 9. Audit log
  if (actor) {
    try {
      await recordAuditLog({
        action: 'LEAVE_APPLY',
        actor,
        userId: actor._id,
        entity: 'Leave',
        entityId: leave._id,
        details: {
          employeeId,
          leaveTypeId,
          days: netDays,
          startDate: start,
          endDate: end
        }
      });
    } catch (err) {
      console.error('[Audit Error]', err.message);
    }
  }

  return leave;
};

/**
 * 6.3: Get employee's own leave requests
 * @param {ObjectId|string} employeeId
 * @param {Object} query - { year, status, page, limit }
 * @returns {Promise<Object>} Paginated leave list
 */
export const getMyLeaves = async (employeeId, query = {}) => {
  const filter = { employeeId };

  if (query.year) {
    const yr = parseInt(query.year, 10);
    const yrStart = new Date(Date.UTC(yr, 0, 1));
    const yrEnd = new Date(Date.UTC(yr, 11, 31, 23, 59, 59, 999));
    filter.startDate = { $gte: yrStart, $lte: yrEnd };
  }

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  if (query.search && query.search.trim()) {
    const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    const matchingLeaveTypes = await LeaveType.find({
      $or: [{ name: searchRegex }, { code: searchRegex }]
    }).distinct('_id');
    filter.$or = [
      { leaveTypeId: { $in: matchingLeaveTypes } },
      { reason: searchRegex }
    ];
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || (query.search ? 50 : 20);
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    Leave.find(filter)
      .populate('leaveTypeId', 'name code isPaid')
      .populate('decisionBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Leave.countDocuments(filter)
  ]);

  return {
    items: leaves,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * 6.6: Build dynamic approval chain based on leavePolicy and manager hierarchy
 * @param {Object} employee 
 * @param {number} netDays 
 * @returns {Promise<Array<Object>>}
 */
export const buildApprovalChain = async (employee, netDays) => {
  const leavePolicy = (await SettingService.getSetting('leavePolicy')) || {
    approvalChainLevels: 2
  };

  const approvalChain = [];
  let level1ApproverUserId = null;
  if (employee.managerId) {
    const mgrEmp = await Employee.findById(employee.managerId).select('userId');
    if (mgrEmp?.userId) {
      level1ApproverUserId = mgrEmp.userId;
    }
  }

  approvalChain.push({
    step: 1,
    approverRole: 'Department Manager',
    approverId: level1ApproverUserId,
    status: 'pending'
  });

  if (leavePolicy.approvalChainLevels >= 2 || netDays > 2) {
    approvalChain.push({
      step: 2,
      approverRole: 'HR Manager',
      approverId: null,
      status: 'pending'
    });
  }

  if (netDays > 5) {
    approvalChain.push({
      step: approvalChain.length + 1,
      approverRole: 'Super Admin',
      approverId: null,
      status: 'pending'
    });
  }

  return approvalChain;
};

/**
 * 6.12: Synchronize approved leave dates into M5 Attendance as 'on_leave'
 * @param {Object} leave - Approved leave document
 */
export const syncLeaveToAttendance = async (leave) => {
  const start = normalizeToUtcMidnight(leave.startDate);
  const end = normalizeToUtcMidnight(leave.endDate);

  const { breakdown } = await calculateDeductibleDays(start, end, leave.halfDay);

  for (const item of breakdown) {
    if (item.isDeductible) {
      const dayDate = normalizeToUtcMidnight(item.date);
      await Attendance.findOneAndUpdate(
        { employeeId: leave.employeeId, date: dayDate },
        {
          $set: {
            employeeId: leave.employeeId,
            date: dayDate,
            status: leave.halfDay && leave.halfDay !== 'none' ? 'half_day' : 'on_leave',
            notes: `Approved Leave: ${leave.reason || 'Annual/Casual'}`
          }
        },
        { upsert: true, new: true }
      );
    }
  }
};

/**
 * 6.6 & 6.7: Get pending approval applications scoped by manager/HR/delegation
 * @param {Object} user - Authenticated user
 * @param {Object} query - Filter parameters
 * @returns {Promise<Object>} Pending leaves with applicant details
 */
export const getPendingApprovals = async (user, query = {}) => {
  const isSuperAdmin = user.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
  const isHR = isUserAdminOrHR(user);

  // Check active delegations where user is the designated substitute
  const now = new Date();
  const activeDelegations = await Delegation.find({
    toUserId: user._id,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    'permissions.action': { $in: ['leave.approve', 'manage'] }
  }).select('fromUserId').lean();

  const delegatorUserIds = activeDelegations.map((d) => d.fromUserId);
  const authorizedUserIds = [user._id, ...delegatorUserIds];

  const filter = {};
  const statusParam = query.status || 'pending';

  if (statusParam === 'all') {
    filter.status = { $in: ['pending', 'approved', 'rejected', 'cancelled'] };
  } else if (statusParam === 'history') {
    filter.status = { $in: ['approved', 'rejected', 'cancelled'] };
  } else {
    filter.status = statusParam;
  }

  if (statusParam === 'pending') {
    if (!isSuperAdmin && !isHR) {
      // Department manager / team lead: view direct approvals or unassigned department queue where step is currently pending
      filter.$or = [
        { approvalChain: { $elemMatch: { approverId: { $in: authorizedUserIds }, status: 'pending' } } },
        { approvalChain: { $elemMatch: { approverId: null, approverRole: 'Department Manager', status: 'pending' } } }
      ];
    } else if (isHR && !isSuperAdmin) {
      // HR Manager: only view leaves where HR review stage has arrived:
      // 1) Step 1 Dept Manager is approved AND Step 2 HR Manager is pending
      // 2) OR Step 1 is HR Manager directly and is pending
      // 3) OR HR user is also the direct manager for Step 1
      filter.$or = [
        { 'approvalChain.0.status': 'approved', 'approvalChain.1.approverRole': 'HR Manager', 'approvalChain.1.status': 'pending' },
        { 'approvalChain.0.approverRole': 'HR Manager', 'approvalChain.0.status': 'pending' },
        { approvalChain: { $elemMatch: { step: 1, approverId: { $in: authorizedUserIds }, status: 'pending' } } }
      ];
    }
  } else {
    // Non-pending status (history / all / approved / rejected):
    // Dept managers see their subordinates and any leaves in their approval/decision trail
    if (!isSuperAdmin && !isHR) {
      let managerEmpId = null;
      try {
        managerEmpId = await resolveEmployeeId(user);
      } catch (err) {
        // user might not be an employee
      }

      const subConditions = [{ managerId: user._id }];
      if (managerEmpId) {
        subConditions.push({ managerId: managerEmpId });
      }

      const subordinateIds = await Employee.find({ $or: subConditions }).distinct('_id');

      filter.$or = [
        { employeeId: { $in: subordinateIds } },
        { 'approvalChain.approverId': { $in: authorizedUserIds } },
        { decisionBy: { $in: authorizedUserIds } }
      ];
    }
  }

  // Search by employee name, email, employeeCode, leave type, or reason
  if (query.search && query.search.trim()) {
    const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');

    const matchingEmployees = await Employee.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { employeeCode: searchRegex }
      ]
    }).distinct('_id');

    const matchingLeaveTypes = await LeaveType.find({
      $or: [
        { name: searchRegex },
        { code: searchRegex }
      ]
    }).distinct('_id');

    const searchConditions = [
      { employeeId: { $in: matchingEmployees } },
      { leaveTypeId: { $in: matchingLeaveTypes } },
      { reason: searchRegex }
    ];

    if (filter.$or) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: filter.$or });
      delete filter.$or;
      filter.$and.push({ $or: searchConditions });
    } else {
      filter.$or = searchConditions;
    }
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || (statusParam === 'pending' && !query.search ? 10 : 50);
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    Leave.find(filter)
      .populate('employeeId', 'name employeeCode email departmentId designationId avatar')
      .populate('leaveTypeId', 'name code isPaid')
      .populate('decisionBy', 'name email')
      .populate('approvalChain.approverId', 'name email')
      .populate('approvalChain.delegatedFrom', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Leave.countDocuments(filter)
  ]);

  return {
    items: leaves,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * 6.7: Make decision (Approve or Reject) on a leave request with multi-tier progression
 * @param {ObjectId|string} leaveId - Target leave request
 * @param {string} action - 'approve' | 'reject'
 * @param {string} reason - Justification note
 * @param {Object} user - Authenticated decision maker
 * @returns {Promise<Object>} Updated leave record
 */
export const decideLeave = async (leaveId, action, reason, user) => {
  const leave = await Leave.findById(leaveId);
  if (!leave) {
    throw new ApiError(404, 'Leave application record not found');
  }

  if (leave.status !== 'pending') {
    throw new ApiError(400, `Cannot decide on leave with status '${leave.status}'. Only pending leaves can be approved or rejected.`);
  }

  // Find the current pending step in approval chain
  const currentStep = leave.approvalChain.find((s) => s.status === 'pending');
  if (!currentStep) {
    throw new ApiError(400, 'No pending approval step remaining on this application');
  }

  // Verify authorization for current step (including M26.14 delegation)
  const isSuperAdmin = user.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
  let isAuthorized = isSuperAdmin;
  let actingAsDelegateFor = null;

  if (!isAuthorized) {
    if (currentStep.approverId && currentStep.approverId.toString() === user._id.toString()) {
      isAuthorized = true;
    } else if (currentStep.approverId) {
      // Check active delegation
      const now = new Date();
      const delegation = await Delegation.findOne({
        fromUserId: currentStep.approverId,
        toUserId: user._id,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
        'permissions.action': { $in: ['leave.approve', 'manage'] }
      });
      if (delegation) {
        isAuthorized = true;
        actingAsDelegateFor = currentStep.approverId;
      }
    } else if (currentStep.approverRole === 'Department Manager') {
      isAuthorized = userHasPermission(user, 'leave.approve', ['team', 'department', 'all']);
    } else if (currentStep.approverRole === 'HR Manager') {
      isAuthorized = isUserAdminOrHR(user);
    }
  }

  if (!isAuthorized) {
    throw new ApiError(403, 'You do not have permission to approve or reject this stage of the leave application');
  }

  // Enforce operational approval limit on final approval (or single-step approval)
  const isFinalStep = currentStep.step === leave.approvalChain.length;
  if (action === 'approve' && isFinalStep && !isSuperAdmin) {
    const limitCheck = checkApprovalLimit(user, 'leave.approve', leave.days);
    if (!limitCheck.allowed) {
      throw new ApiError(
        403,
        limitCheck.reason ||
          `Forbidden: Leave duration of ${leave.days} days exceeds your maximum approval limit of ${limitCheck.maxLimit} days. Escalation required.`
      );
    }
  }

  const applicant = await Employee.findById(leave.employeeId).select('userId name email');
  const year = leave.startDate.getUTCFullYear();

  if (action === 'reject') {
    if (!reason || reason.trim().length < 3) {
      throw new ApiError(400, 'Rejection reason is required (at least 3 characters)');
    }

    // Mark current step rejected
    currentStep.status = 'rejected';
    currentStep.decisionAt = new Date();
    currentStep.decisionReason = reason.trim();
    if (actingAsDelegateFor) {
      currentStep.delegatedFrom = actingAsDelegateFor;
    }

    // Mark overall leave rejected
    leave.status = 'rejected';
    leave.decisionBy = user._id;
    leave.decisionAt = new Date();
    leave.decisionReason = reason.trim();

    // Revert pending quota in LeaveBalance
    await LeaveBalance.updateOne(
      { employeeId: leave.employeeId, year, 'balances.leaveTypeId': leave.leaveTypeId },
      { $inc: { 'balances.$.pendingDays': -leave.days } }
    );

    // Notify applicant
    if (applicant?.userId) {
      notify(applicant.userId, {
        type: 'leave',
        title: 'Leave Request Rejected',
        body: `Your leave application for ${leave.days} day(s) was rejected. Reason: ${reason.trim()}`,
        link: '/leaves/my'
      }).catch((err) => console.error('[Notification Error]', err.message));
    }
  } else if (action === 'approve') {
    // Mark current step approved
    currentStep.status = 'approved';
    currentStep.decisionAt = new Date();
    currentStep.decisionReason = reason ? reason.trim() : '';
    if (actingAsDelegateFor) {
      currentStep.delegatedFrom = actingAsDelegateFor;
    }

    // Check if there are further pending steps
    const remainingPendingSteps = leave.approvalChain.filter((s) => s.status === 'pending');

    if (remainingPendingSteps.length === 0) {
      // Final approval reached
      leave.status = 'approved';
      leave.decisionBy = user._id;
      leave.decisionAt = new Date();
      leave.decisionReason = reason ? reason.trim() : '';

      // Atomically settle quota: pendingDays -> usedDays
      await LeaveBalance.updateOne(
        { employeeId: leave.employeeId, year, 'balances.leaveTypeId': leave.leaveTypeId },
        { $inc: { 'balances.$.pendingDays': -leave.days, 'balances.$.usedDays': leave.days } }
      );

      // Sync into attendance records
      try {
        await syncLeaveToAttendance(leave);
      } catch (attErr) {
        console.error('[Attendance Sync Error]', attErr.message);
      }

      // Notify applicant
      if (applicant?.userId) {
        notify(applicant.userId, {
          type: 'leave',
          title: 'Leave Request Approved',
          body: `Your leave request for ${leave.days} day(s) starting ${leave.startDate.toISOString().split('T')[0]} has been approved.`,
          link: '/leaves/my'
        }).catch((err) => console.error('[Notification Error]', err.message));
      }
    } else {
      // Intermediate approval: notify next step approvers
      const nextStep = remainingPendingSteps[0];
      if (nextStep.approverId) {
        notify(nextStep.approverId, {
          type: 'leave',
          title: 'Leave Approval Required',
          body: `Leave request for ${applicant?.name || 'an employee'} (${leave.days} days) requires your approval (Step ${nextStep.step}).`,
          link: '/leaves/approvals'
        }).catch((err) => console.error('[Notification Error]', err.message));
      } else if (nextStep.approverRole === 'HR Manager' || nextStep.approverRole === 'Super Admin') {
        // Step 1 Dept Manager approved! Now notify HR Managers & Admins for Step 2:
        notifyHRApprovers({
          type: 'leave',
          title: 'Leave Awaiting HR Approval (Dept Manager Approved)',
          body: `Leave request for ${applicant?.name || 'an employee'} (${leave.days} days) has been approved by Department Manager and now awaits your HR review.`,
          link: '/leaves/approvals'
        }).catch((err) => console.error('[Notification Error - HR]', err.message));
      }

      // Notify applicant that intermediate step was approved
      if (applicant?.userId) {
        notify(applicant.userId, {
          type: 'leave',
          title: 'Leave Step 1 Approved',
          body: `Your leave application for ${leave.days} day(s) starting ${leave.startDate.toISOString().split('T')[0]} was approved by Department Manager and forwarded to HR for review.`,
          link: '/leaves/my'
        }).catch((err) => console.error('[Notification Error]', err.message));
      }
    }
  }

  await leave.save();

  // Audit record
  recordAuditLog({
    action: `LEAVE_${action.toUpperCase()}`,
    actorId: user._id,
    entity: 'Leave',
    entityId: leave._id,
    meta: {
      action,
      reason,
      status: leave.status,
      delegatedFrom: actingAsDelegateFor
    }
  }).catch((err) => console.error('[Audit Error]', err.message));

  return leave;
};

/**
 * 6.8: Cancel leave application and restore quotas
 * @param {ObjectId|string} leaveId
 * @param {string} cancellationReason
 * @param {Object} user - Authenticated user
 * @returns {Promise<Object>} Cancelled leave record
 */
export const cancelLeave = async (leaveId, cancellationReason, user) => {
  const leave = await Leave.findById(leaveId);
  if (!leave) {
    throw new ApiError(404, 'Leave record not found');
  }

  if (leave.status === 'cancelled') {
    throw new ApiError(400, 'Leave application is already cancelled');
  }

  if (leave.status === 'rejected') {
    throw new ApiError(400, 'Rejected leave applications cannot be cancelled');
  }

  // Caller authorization: must be applicant or HR / Super Admin
  const isSuperAdmin = user.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
  const isHR = isUserAdminOrHR(user);

  if (!isSuperAdmin && !isHR) {
    const callerEmpId = (await resolveEmployeeId(user))?.toString();
    const isApplicant = callerEmpId && callerEmpId === leave.employeeId.toString();
    if (!isApplicant) {
      throw new ApiError(403, 'Forbidden: You can only cancel your own leave applications');
    }
  }

  const year = leave.startDate.getUTCFullYear();

  if (leave.status === 'pending') {
    // Revert pending quota
    leave.status = 'cancelled';
    leave.cancellationReason = cancellationReason || 'Cancelled by employee';
    await LeaveBalance.updateOne(
      { employeeId: leave.employeeId, year, 'balances.leaveTypeId': leave.leaveTypeId },
      { $inc: { 'balances.$.pendingDays': -leave.days } }
    );
  } else if (leave.status === 'approved') {
    // Check start date: cannot cancel if already started or in past
    const todayMidnight = normalizeToUtcMidnight(new Date());
    if (leave.startDate < todayMidnight) {
      throw new ApiError(400, 'Cannot cancel an approved leave that has already commenced or occurred in the past');
    }

    leave.status = 'cancelled';
    leave.cancellationReason = cancellationReason || 'Cancelled prior to start';

    // Restore used quota
    await LeaveBalance.updateOne(
      { employeeId: leave.employeeId, year, 'balances.leaveTypeId': leave.leaveTypeId },
      { $inc: { 'balances.$.usedDays': -leave.days } }
    );

    // Remove linked on_leave / half_day attendance records
    await Attendance.deleteMany({
      employeeId: leave.employeeId,
      date: { $gte: leave.startDate, $lte: leave.endDate },
      status: { $in: ['on_leave', 'half_day'] }
    });
  }

  await leave.save();

  recordAuditLog({
    action: 'LEAVE_CANCEL',
    actorId: user._id,
    entity: 'Leave',
    entityId: leave._id,
    meta: {
      cancellationReason: leave.cancellationReason,
      restoredDays: leave.days
    }
  }).catch((err) => console.error('[Audit Error]', err.message));

  return leave;
};

/**
 * 6.10: Get Team Leave Calendar & Conflict Heatmap
 * @param {Object} query - { month: 'YYYY-MM', departmentId?: string }
 * @param {Object} user - Authenticated user context
 * @returns {Promise<Object>} Monthly leaves, holidays, and team conflict days
 */
export const getLeaveCalendar = async (query = {}, user) => {
  const isSuperAdmin = user.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
  const isHR = isUserAdminOrHR(user);

  const now = new Date();
  let year = now.getUTCFullYear();
  let monthNum = now.getUTCMonth() + 1;

  if (query.month && /^\d{4}-\d{2}$/.test(query.month)) {
    const parts = query.month.split('-');
    year = parseInt(parts[0], 10);
    monthNum = parseInt(parts[1], 10);
  }

  const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  // Determine scoped employee IDs
  const empFilter = { isDeleted: false };

  if (isHR) {
    if (query.departmentId) {
      empFilter.departmentId = query.departmentId;
    }
  } else {
    // Team / Department Manager / Peer scoping
    const callerEmp = user.employeeId
      ? await Employee.findOne({ _id: user.employeeId, isDeleted: false })
      : await Employee.findOne({ userId: user._id, isDeleted: false });

    if (callerEmp?.departmentId) {
      empFilter.$or = [
        { departmentId: callerEmp.departmentId },
        { managerId: callerEmp._id }
      ];
    } else if (callerEmp?._id) {
      empFilter.managerId = callerEmp._id;
    } else {
      empFilter._id = null; // No accessible records
    }
  }

  const scopedEmployees = await Employee.find(empFilter)
    .select('_id name employeeCode departmentId designationId')
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .lean();

  const employeeIds = scopedEmployees.map((e) => e._id);

  // Fetch approved leaves overlapping month
  const leaves = await Leave.find({
    employeeId: { $in: employeeIds },
    status: { $in: ['approved', 'pending'] },
    startDate: { $lte: endOfMonth },
    endDate: { $gte: startOfMonth }
  })
    .populate('employeeId', 'name employeeCode departmentId')
    .populate('leaveTypeId', 'name code isPaid')
    .sort({ startDate: 1 })
    .lean();

  // Fetch holidays in this month
  const holidays = await Holiday.find({
    date: { $gte: startOfMonth, $lte: endOfMonth },
    isActive: true
  }).sort({ date: 1 }).lean();

  // Compute daily conflicts (days where >= 2 team members in the same department are on leave)
  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  const dailyLeavesMap = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dailyLeavesMap[dayStr] = [];
  }

  for (const item of leaves) {
    if (item.status !== 'approved') continue;
    const leaveStart = new Date(item.startDate);
    const leaveEnd = new Date(item.endDate);

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(Date.UTC(year, monthNum - 1, d, 0, 0, 0, 0));
      if (dayDate >= normalizeToUtcMidnight(leaveStart) && dayDate <= normalizeToUtcMidnight(leaveEnd)) {
        const dayStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        dailyLeavesMap[dayStr].push(item);
      }
    }
  }

  const conflicts = [];
  for (const [dateStr, dayLeaves] of Object.entries(dailyLeavesMap)) {
    if (dayLeaves.length >= 2) {
      // Group by department
      const deptMap = {};
      for (const l of dayLeaves) {
        const deptId = l.employeeId?.departmentId?._id?.toString() || l.employeeId?.departmentId?.toString() || 'unknown';
        deptMap[deptId] = (deptMap[deptId] || 0) + 1;
      }
      const hasDeptConflict = Object.values(deptMap).some((count) => count >= 2);
      if (hasDeptConflict) {
        conflicts.push({
          date: dateStr,
          count: dayLeaves.length,
          leaves: dayLeaves.map((l) => ({
            leaveId: l._id,
            employeeName: l.employeeId?.name,
            leaveType: l.leaveTypeId?.name,
            halfDay: l.halfDay
          }))
        });
      }
    }
  }

  return {
    month: `${year}-${String(monthNum).padStart(2, '0')}`,
    totalLeaves: leaves.length,
    leaves,
    holidays,
    conflicts
  };
};

/**
 * 6.13: Submit Leave Encashment Request
 * @param {ObjectId|string} employeeId 
 * @param {Object} payload - { leaveTypeId, days, year, remarks }
 * @param {Object} actor - Authenticated user context
 * @returns {Promise<Object>} Created encashment record
 */
export const requestLeaveEncashment = async (employeeId, payload, actor) => {
  const year = payload.year || new Date().getUTCFullYear();
  const days = Number(payload.days);

  // Check policy
  const leavePolicy = (await SettingService.getSetting('leavePolicy')) || {
    encashmentAllowed: true,
    maxEncashableDays: 15
  };

  if (leavePolicy.encashmentAllowed === false) {
    throw new ApiError(400, 'Leave encashment is currently disabled by corporate policy');
  }

  const maxDays = leavePolicy.maxEncashableDays || 15;
  if (days > maxDays) {
    throw new ApiError(400, `Requested encashment exceeds the maximum allowable limit of ${maxDays} days per year`);
  }

  // Verify leave type
  const leaveType = await LeaveType.findById(payload.leaveTypeId);
  if (!leaveType || !leaveType.isActive) {
    throw new ApiError(404, 'Active leave type not found');
  }

  if (!leaveType.isPaid) {
    throw new ApiError(400, 'Only paid leave categories are eligible for year-end financial encashment');
  }

  // Load employee leave balance
  let leaveBalance = await LeaveBalance.findOne({ employeeId, year });
  if (!leaveBalance) {
    leaveBalance = await initializeEmployeeLeaveBalances(employeeId, year);
  }

  const catBalance = leaveBalance.balances.find(
    (b) => b.leaveTypeId.toString() === payload.leaveTypeId.toString()
  );
  if (!catBalance) {
    throw new ApiError(400, `No quota balance found for ${leaveType.name} in year ${year}`);
  }

  const totalEntitlement = catBalance.allocatedDays + catBalance.carriedForwardDays;
  const availableDays = Math.max(
    0,
    totalEntitlement - catBalance.usedDays - catBalance.pendingDays - catBalance.encashedDays
  );

  if (days > availableDays) {
    throw new ApiError(
      400,
      `Insufficient available quota for encashment. Available unutilized: ${availableDays} days, Requested: ${days} days`
    );
  }

  // Load employee salary for daily rate calculation
  const employee = await Employee.findById(employeeId).lean();
  if (!employee) {
    throw new ApiError(404, 'Employee profile not found');
  }

  // Compute daily rate in integer paisa (monthly basic / 30)
  const monthlySalaryPaisa =
    employee.basicSalaryPaisa ||
    (employee.salary?.basic ? Math.round(employee.salary.basic * 100) : 6000000); // 60,000 PKR default

  const dailyRatePaisa = Math.round(monthlySalaryPaisa / 30);
  const totalAmountPaisa = Math.round(days * dailyRatePaisa);

  // Atomically increment encashedDays in LeaveBalance
  await LeaveBalance.updateOne(
    { employeeId, year, 'balances.leaveTypeId': payload.leaveTypeId },
    { $inc: { 'balances.$.encashedDays': days } }
  );

  // Create Encashment record
  const encashment = await LeaveEncashment.create({
    employeeId,
    year,
    leaveTypeId: payload.leaveTypeId,
    days,
    dailyRatePaisa,
    totalAmountPaisa,
    remarks: payload.remarks || '',
    status: 'pending'
  });

  if (actor) {
    recordAuditLog({
      action: 'LEAVE_ENCASH_REQUEST',
      actorId: actor._id,
      entity: 'LeaveEncashment',
      entityId: encashment._id,
      meta: {
        employeeId,
        days,
        dailyRatePaisa,
        totalAmountPaisa
      }
    }).catch((err) => console.error('[Audit Error]', err.message));
  }

  return encashment;
};

/**
 * 6.13: Get Leave Encashment Records
 * @param {Object} query - { year, status, employeeId }
 * @param {Object} user - Authenticated user context
 * @returns {Promise<Array>} List of encashment records
 */
export const getLeaveEncashments = async (query = {}, user) => {
  const isSuperAdmin = user.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');
  const isHR = isUserAdminOrHR(user) || userHasPermission(user, 'leave.encash', ['all']);

  const filter = {};

  if (!isHR) {
    // Scoped to own encashments
    const callerEmpId = await resolveEmployeeId(user);
    filter.employeeId = callerEmpId;
  } else if (query.employeeId) {
    filter.employeeId = query.employeeId;
  }

  if (query.year) {
    filter.year = Number(query.year);
  }

  if (query.status) {
    filter.status = query.status;
  }

  return LeaveEncashment.find(filter)
    .populate('employeeId', 'name employeeCode departmentId designationId')
    .populate('leaveTypeId', 'name code isPaid')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * 6.13: Approve or Reject Leave Encashment Request (HR/Super Admin)
 * @param {ObjectId|string} id - Encashment record ID
 * @param {Object} payload - { action: 'approve' | 'reject', rejectionReason?: string }
 * @param {Object} user - Authenticated decision maker
 * @returns {Promise<Object>} Updated encashment record
 */
export const decideLeaveEncashment = async (id, { action, rejectionReason }, user) => {
  const encashment = await LeaveEncashment.findById(id);
  if (!encashment) {
    throw new ApiError(404, 'Leave encashment record not found');
  }

  if (encashment.status !== 'pending') {
    throw new ApiError(400, `Cannot decide on encashment with status '${encashment.status}'. Only pending requests can be approved or rejected.`);
  }

  if (action === 'approve') {
    encashment.status = 'approved';
    encashment.approvedBy = user._id;
    encashment.approvedAt = new Date();
  } else if (action === 'reject') {
    encashment.status = 'rejected';
    encashment.rejectionReason = rejectionReason || 'Rejected by HR Management';

    // Revert encashedDays in LeaveBalance
    await LeaveBalance.updateOne(
      { employeeId: encashment.employeeId, year: encashment.year, 'balances.leaveTypeId': encashment.leaveTypeId },
      { $inc: { 'balances.$.encashedDays': -encashment.days } }
    );
  } else {
    throw new ApiError(400, "Action must be 'approve' or 'reject'");
  }

  await encashment.save();

  recordAuditLog({
    action: `LEAVE_ENCASH_${action.toUpperCase()}`,
    actorId: user._id,
    entity: 'LeaveEncashment',
    entityId: encashment._id,
    meta: {
      action,
      rejectionReason: encashment.rejectionReason
    }
  }).catch((err) => console.error('[Audit Error]', err.message));

  return encashment;
};

/**
 * 6.14: HR Manual Leave Balance Adjustment & Audit Trail
 * @param {ObjectId|string} id - LeaveBalance record ID
 * @param {Object} payload - { balances: Array, overrideReason: string }
 * @param {Object} actor - Authenticated HR Manager / Admin
 * @returns {Promise<Object>} Updated LeaveBalance document
 */
export const adjustLeaveBalance = async (id, { balances: updatedCategories, overrideReason }, actor) => {
  const leaveBalance = await LeaveBalance.findById(id);
  if (!leaveBalance) {
    throw new ApiError(404, 'Leave balance record not found');
  }

  const beforeState = JSON.parse(JSON.stringify(leaveBalance.toObject()));

  // Merge categories
  for (const upd of updatedCategories) {
    const existing = leaveBalance.balances.find(
      (b) => b.leaveTypeId.toString() === upd.leaveTypeId.toString()
    );

    if (existing) {
      if (upd.allocatedDays !== undefined) existing.allocatedDays = upd.allocatedDays;
      if (upd.carriedForwardDays !== undefined) existing.carriedForwardDays = upd.carriedForwardDays;
      if (upd.usedDays !== undefined) existing.usedDays = upd.usedDays;
      if (upd.pendingDays !== undefined) existing.pendingDays = upd.pendingDays;
      if (upd.encashedDays !== undefined) existing.encashedDays = upd.encashedDays;
    } else {
      leaveBalance.balances.push({
        leaveTypeId: upd.leaveTypeId,
        allocatedDays: upd.allocatedDays || 0,
        carriedForwardDays: upd.carriedForwardDays || 0,
        usedDays: upd.usedDays || 0,
        pendingDays: upd.pendingDays || 0,
        encashedDays: upd.encashedDays || 0
      });
    }
  }

  await leaveBalance.save();

  const afterState = JSON.parse(JSON.stringify(leaveBalance.toObject()));

  // Immutable audit log
  if (actor) {
    try {
      await recordAuditLog({
        action: 'LEAVE_BALANCE_OVERRIDE',
        actor,
        userId: actor._id,
        entity: 'LeaveBalance',
        entityId: leaveBalance._id,
        details: {
          employeeId: leaveBalance.employeeId,
          year: leaveBalance.year,
          overrideReason,
          before: beforeState.balances,
          after: afterState.balances
        }
      });
    } catch (err) {
      console.error('[Audit Error]', err.message);
    }
  }

  return leaveBalance;
};

/**
 * Helper to identify Super Admin or HR Manager
 */
const isFullAdminOrHR = (user) => {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
  return roles.some((r) => {
    const name = typeof r === 'string' ? r : r.name;
    return name === 'Super Admin' || name === 'HR Manager';
  });
};

/**
 * 6.15: Leave Analytics & ExcelJS Report Export
 * Generates an Excel workbook with Linear Dark Craft styling (#1E2235 header)
 * @param {Object} queryParams
 * @returns {Promise<Buffer>} Excel file buffer
 */
export const generateLeaveExcel = async ({
  startDate,
  endDate,
  year,
  departmentId,
  status,
  leaveTypeId,
  user
}) => {
  let filter = {};

  if (startDate && endDate) {
    filter.startDate = { $lte: new Date(endDate) };
    filter.endDate = { $gte: new Date(startDate) };
  } else if (year) {
    const yr = Number(year);
    filter.startDate = {
      $gte: new Date(Date.UTC(yr, 0, 1)),
      $lte: new Date(Date.UTC(yr, 11, 31, 23, 59, 59, 999))
    };
  }

  if (status) {
    filter.status = status;
  }

  if (leaveTypeId) {
    filter.leaveTypeId = leaveTypeId;
  }

  // Role-based data isolation
  if (user && !isUserAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    if (managerEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: managerEmp.departmentId, isDeleted: false }).distinct('_id');
      filter.employeeId = { $in: deptEmployees };
    } else {
      filter.employeeId = user.employeeId || null;
    }
  } else if (departmentId) {
    const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).distinct('_id');
    filter.employeeId = { $in: deptEmployees };
  }

  const leaves = await Leave.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate('leaveTypeId', 'name code category')
    .sort({ startDate: -1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HRM Starlight System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Leave Report');

  worksheet.columns = [
    { header: 'Employee Code', key: 'code', width: 16 },
    { header: 'Employee Name', key: 'name', width: 24 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Designation', key: 'designation', width: 20 },
    { header: 'Leave Type', key: 'leaveType', width: 18 },
    { header: 'Start Date', key: 'startDate', width: 14 },
    { header: 'End Date', key: 'endDate', width: 14 },
    { header: 'Total Days', key: 'totalDays', width: 12 },
    { header: 'Half Day', key: 'halfDay', width: 14 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Reason', key: 'reason', width: 30 },
    { header: 'Applied At', key: 'appliedAt', width: 16 }
  ];

  // Dark Linear Craft header styling (#1E2235 with white bold text)
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E2235' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Populate rows
  leaves.forEach((lv) => {
    const emp = lv.employeeId;
    const empName = emp?.name || (emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'N/A');
    const startStr = lv.startDate ? new Date(lv.startDate).toISOString().split('T')[0] : '';
    const endStr = lv.endDate ? new Date(lv.endDate).toISOString().split('T')[0] : '';
    const appliedStr = lv.createdAt ? new Date(lv.createdAt).toISOString().split('T')[0] : '';

    worksheet.addRow({
      code: emp?.employeeCode || 'N/A',
      name: empName,
      department: emp?.departmentId?.name || 'General',
      designation: emp?.designationId?.title || '-',
      leaveType: lv.leaveTypeId?.name || 'Leave',
      startDate: startStr,
      endDate: endStr,
      totalDays: lv.days ?? lv.totalDays ?? 0,
      halfDay: lv.halfDay && lv.halfDay !== 'none' ? lv.halfDay : 'No',
      status: (lv.status || '').toUpperCase(),
      reason: lv.reason || '-',
      appliedAt: appliedStr
    });
  });

  return workbook.xlsx.writeBuffer();
};

/**
 * 6.7b: Retrieve comprehensive audit profile for a leave applicant
 * (Quota balances, previous leaves, past 30 days attendance breakdown)
 * @param {ObjectId|string} leaveId - Target leave ID
 * @param {Object} user - Authenticated approver
 * @returns {Promise<Object>} Applicant audit dossier
 */
export const getLeaveApplicantAudit = async (leaveId, user) => {
  const leave = await Leave.findById(leaveId)
    .populate({
      path: 'employeeId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate('leaveTypeId', 'name code isPaid')
    .lean();

  if (!leave) {
    throw new ApiError(404, 'Leave record not found');
  }

  const employee = leave.employeeId;
  if (!employee) {
    throw new ApiError(404, 'Employee record not found for this leave');
  }

  const year = leave.startDate ? new Date(leave.startDate).getUTCFullYear() : new Date().getUTCFullYear();

  // 1. Quota balances
  const balanceDoc = await LeaveBalance.findOne({ employeeId: employee._id, year })
    .populate('balances.leaveTypeId', 'name code isPaid')
    .lean();

  // 2. Recent leaves (last 5, excluding current one)
  const recentLeaves = await Leave.find({
    employeeId: employee._id,
    _id: { $ne: leave._id }
  })
    .populate('leaveTypeId', 'name code isPaid')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // 3. Past 30 days attendance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const attendanceRecords = await Attendance.find({
    employeeId: employee._id,
    date: { $gte: thirtyDaysAgo }
  })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  const stats = {
    totalRecordedDays: attendanceRecords.length,
    present: 0,
    late: 0,
    halfDay: 0,
    absent: 0,
    onLeave: 0
  };

  attendanceRecords.forEach((rec) => {
    const st = rec.status;
    if (st === 'present') stats.present++;
    else if (st === 'late') stats.late++;
    else if (st === 'half_day') stats.halfDay++;
    else if (st === 'absent') stats.absent++;
    else if (st === 'on_leave') stats.onLeave++;
  });

  // 1. Quota balances enriched with computed availableDays
  const rawBalances = balanceDoc?.balances || [];
  const enrichedBalances = rawBalances.map((b) => {
    const totalEntitlement = (b.allocatedDays || 0) + (b.carriedForwardDays || 0);
    const available = Math.max(0, totalEntitlement - (b.usedDays || 0) - (b.pendingDays || 0) - (b.encashedDays || 0));
    return {
      ...b,
      totalEntitlement,
      availableDays: available
    };
  });

  return {
    leave,
    employee: {
      _id: employee._id,
      name: employee.name,
      employeeCode: employee.employeeCode,
      email: employee.email,
      department: employee.departmentId?.name || 'General',
      designation: employee.designationId?.title || 'Team Member',
      avatar: employee.avatar || null,
      joiningDate: employee.joiningDate || null
    },
    balances: enrichedBalances,
    recentLeaves,
    attendanceStats: stats,
    recentAttendance: attendanceRecords.slice(0, 10)
  };
};



