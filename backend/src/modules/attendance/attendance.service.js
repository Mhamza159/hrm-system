/**
 * @file attendance.service.js
 * @description Attendance, Shifts, Breaks, WFH, and Payroll Lock Domain Business Logic.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10)
 * - Layer: Service (Domain Logic)
 */

import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { Attendance } from '../../models/attendance.model.js';
import { Shift } from '../../models/shift.model.js';
import { MonthLock } from '../../models/monthLock.model.js';
import { WFHRequest } from '../../models/wfh.model.js';
import { AttendanceCorrection } from '../../models/correction.model.js';
import { Employee } from '../../models/employee.model.js';
import { Setting } from '../../models/setting.model.js';
import { User } from '../../models/user.model.js';
import { Role } from '../../models/role.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { evaluateAttendanceStatus, calculateWorkMetrics } from './services/statusEngine.service.js';
import { emitToCompany, emitToDepartment } from '../../services/socket.service.js';
import { notify } from '../../services/notify.service.js';

/**
 * Normalizes any Date or date string to UTC Midnight (00:00:00.000Z)
 * @param {Date|string} inputDate 
 * @returns {Date}
 */
export const normalizeToUtcMidnight = (inputDate = new Date()) => {
  const d = new Date(inputDate);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

/**
 * Converts date to YYYY-MM month string
 * @param {Date|string} date 
 * @returns {string}
 */
export const getYearMonth = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Asserts that the month containing the target date is not locked for payroll.
 * @param {Date|string} targetDate 
 */
export const assertMonthNotLocked = async (targetDate) => {
  const ym = getYearMonth(targetDate);
  const lock = await MonthLock.findOne({ yearMonth: ym, isLocked: true }).lean();
  if (lock) {
    throw new ApiError(423, `Attendance for ${ym} is locked for payroll processing and cannot be modified.`);
  }
};

/**
 * Resolves shift schedule, company office hours, and late penalty rules.
 * @param {import('mongoose').Types.ObjectId|string} employeeId 
 */
export const getShiftAndPolicies = async (employeeId) => {
  const employee = await Employee.findById(employeeId)
    .populate('shiftId')
    .populate('designationId')
    .populate('departmentId')
    .lean();
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  const settingsDocs = await Setting.find({
    key: { $in: ['officeHours', 'lateRules', 'workingDays'] }
  }).lean();

  const settingsMap = {};
  for (const doc of settingsDocs) {
    settingsMap[doc.key] = doc.value;
  }

  return {
    employee,
    shift: employee.shiftId || null,
    officeHours: settingsMap.officeHours || null,
    lateRules: settingsMap.lateRules || null,
    workingDays: settingsMap.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  };
};

/**
 * Helper to fetch employee ID associated with user account
 * @param {Object} user 
 * @returns {Promise<import('mongoose').Types.ObjectId>}
 */
export const resolveEmployeeId = async (user) => {
  if (user.employeeId) return user.employeeId;
  const emp = await Employee.findOne({ userId: user._id, isDeleted: false }, '_id').lean();
  if (!emp) {
    throw new ApiError(404, 'No active employee profile linked to this user account');
  }
  return emp._id;
};

/**
 * 5.3: Web Clock-In
 */
export const checkIn = async ({ user, source = 'web', location, ipAddress, userAgent }) => {
  const employeeId = await resolveEmployeeId(user);
  const todayUtc = normalizeToUtcMidnight(new Date());

  await assertMonthNotLocked(todayUtc);

  // Check for existing attendance record
  let attendance = await Attendance.findOne({ employeeId, date: todayUtc });
  if (attendance && attendance.checkIn) {
    throw new ApiError(400, 'Already clocked in for today');
  }

  const { employee, shift, officeHours, lateRules } = await getShiftAndPolicies(employeeId);

  const now = new Date();
  const isSuperAdmin =
    user?.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin') ||
    employee?.employeeCode === 'EMP-000' ||
    employee?.email === 'mhamzaofficial159@gmail.com';

  const evalResult = evaluateAttendanceStatus({ checkIn: now, shift, officeHours, lateRules });
  const status = isSuperAdmin ? 'present' : evalResult.status;
  const flags = isSuperAdmin ? ['flexible_executive'] : evalResult.flags;

  // Check if approved WFH exists for today
  const wfh = await WFHRequest.findOne({ employeeId, date: todayUtc, status: 'approved' }).lean();
  let punchSource = source;
  if (wfh) {
    flags.push('wfh');
    punchSource = 'wfh';
  }

  if (!attendance) {
    attendance = new Attendance({
      employeeId,
      date: todayUtc,
      shiftId: shift?._id || null,
      checkIn: now,
      status,
      flags,
      source: punchSource,
      location: location || {},
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });
  } else {
    attendance.checkIn = now;
    attendance.status = status;
    attendance.flags = flags;
    attendance.source = punchSource;
    attendance.location = location || attendance.location;
    attendance.ipAddress = ipAddress || attendance.ipAddress;
    attendance.userAgent = userAgent || attendance.userAgent;
  }

  await attendance.save();

  // Socket notification
  const payload = {
    employeeId: String(employeeId),
    employeeName: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee',
    departmentId: employee.departmentId ? String(employee.departmentId) : null,
    checkIn: attendance.checkIn,
    status: attendance.status,
    flags: attendance.flags,
    date: attendance.date
  };

  emitToCompany('attendance:punch', payload);
  if (employee.departmentId) {
    emitToDepartment(employee.departmentId, 'attendance:punch', payload);
  }

  return attendance;
};

/**
 * 5.4: Web Clock-Out
 */
export const checkOut = async ({ user, location }) => {
  const employeeId = await resolveEmployeeId(user);
  const todayUtc = normalizeToUtcMidnight(new Date());

  await assertMonthNotLocked(todayUtc);

  const attendance = await Attendance.findOne({ employeeId, date: todayUtc });
  if (!attendance || !attendance.checkIn) {
    throw new ApiError(400, 'No active clock-in found for today');
  }
  if (attendance.checkOut) {
    throw new ApiError(400, 'Already clocked out for today');
  }

  const { employee, shift, officeHours, lateRules } = await getShiftAndPolicies(employeeId);
  const now = new Date();

  const metrics = calculateWorkMetrics({
    checkIn: attendance.checkIn,
    checkOut: now,
    totalBreakMinutes: attendance.totalBreakMinutes || 0,
    shift,
    officeHours,
    lateRules
  });

  attendance.checkOut = now;
  attendance.workDurationMinutes = metrics.workDurationMinutes;
  attendance.overtimeMinutes = metrics.overtimeMinutes;

  const isSuperAdmin =
    user?.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin') ||
    employee?.employeeCode === 'EMP-000' ||
    employee?.email === 'mhamzaofficial159@gmail.com';

  if (!isSuperAdmin && metrics.isEarlyDeparture && !attendance.flags.includes('earlyDeparture')) {
    attendance.flags.push('earlyDeparture');
  }
  if (location) {
    attendance.location = { ...attendance.location, ...location };
  }

  await attendance.save();

  const payload = {
    employeeId: String(employeeId),
    employeeName: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee',
    departmentId: employee.departmentId ? String(employee.departmentId) : null,
    checkOut: attendance.checkOut,
    workDurationMinutes: attendance.workDurationMinutes,
    status: attendance.status,
    flags: attendance.flags,
    date: attendance.date
  };

  emitToCompany('attendance:punch', payload);
  if (employee.departmentId) {
    emitToDepartment(employee.departmentId, 'attendance:punch', payload);
  }

  return attendance;
};

/**
 * 5.5: Start Break
 */
export const startBreak = async ({ user, type = 'meal' }) => {
  const employeeId = await resolveEmployeeId(user);
  const todayUtc = normalizeToUtcMidnight(new Date());

  await assertMonthNotLocked(todayUtc);

  const attendance = await Attendance.findOne({ employeeId, date: todayUtc });
  if (!attendance || !attendance.checkIn) {
    throw new ApiError(400, 'Cannot start a break without an active check-in');
  }
  if (attendance.checkOut) {
    throw new ApiError(400, 'Cannot start a break after clocking out');
  }

  // Check if open break exists
  const hasOpenBreak = attendance.breaks.some((b) => b.endTime === null);
  if (hasOpenBreak) {
    throw new ApiError(400, 'An active break is already in progress');
  }

  attendance.breaks.push({
    type,
    startTime: new Date(),
    endTime: null,
    durationMinutes: 0
  });

  await attendance.save();
  return attendance;
};

/**
 * 5.5: End Break
 */
export const endBreak = async ({ user }) => {
  const employeeId = await resolveEmployeeId(user);
  const todayUtc = normalizeToUtcMidnight(new Date());

  await assertMonthNotLocked(todayUtc);

  const attendance = await Attendance.findOne({ employeeId, date: todayUtc });
  if (!attendance) {
    throw new ApiError(400, 'Attendance record not found for today');
  }

  const openBreak = attendance.breaks.find((b) => b.endTime === null);
  if (!openBreak) {
    throw new ApiError(400, 'No active break in progress to end');
  }

  const now = new Date();
  openBreak.endTime = now;
  openBreak.durationMinutes = Math.max(1, Math.round((now - new Date(openBreak.startTime)) / 60000));

  attendance.totalBreakMinutes = attendance.breaks.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  await attendance.save();
  return attendance;
};

/**
 * 5.9: Monthly Attendance Calendar for Employee
 */
export const getMyAttendance = async ({ user, month, date }) => {
  const employeeId = await resolveEmployeeId(user);

  let filter = { employeeId: new mongoose.Types.ObjectId(employeeId) };

  if (month) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const end = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
    filter.date = { $gte: start, $lte: end };
  } else if (date) {
    filter.date = normalizeToUtcMidnight(new Date(date));
  } else {
    // Current month by default
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
    filter.date = { $gte: start, $lte: end };
  }

  const records = await Attendance.find(filter).sort({ date: 1 }).lean();

  // Compute monthly stats
  let presentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let totalWorkMinutes = 0;
  let totalOvertimeMinutes = 0;

  for (const r of records) {
    if (r.status === 'present') presentCount++;
    else if (r.status === 'late') lateCount++;
    else if (r.status === 'half_day') halfDayCount++;
    else if (r.status === 'absent') absentCount++;
    else if (r.status === 'on_leave' || r.status === 'holiday') leaveCount++;

    totalWorkMinutes += r.workDurationMinutes || 0;
    totalOvertimeMinutes += r.overtimeMinutes || 0;
  }

  // Check if target month is locked
  const ym = month || getYearMonth(new Date());
  const monthLock = await MonthLock.findOne({ yearMonth: ym, isLocked: true }).lean();

  // Resolve shift & employee details if available
  let shiftInfo = null;
  let employeeInfo = null;
  try {
    const shiftData = await getShiftAndPolicies(employeeId);
    if (shiftData?.employee) {
      const isEmpSuperAdmin =
        shiftData.employee.employeeCode === 'EMP-000' ||
        shiftData.employee.email === 'mhamzaofficial159@gmail.com' ||
        user?.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin');

      employeeInfo = {
        name: shiftData.employee.name || `${shiftData.employee.firstName || ''} ${shiftData.employee.lastName || ''}`.trim(),
        employeeCode: shiftData.employee.employeeCode,
        avatar: shiftData.employee.avatar || '',
        designation: shiftData.employee.designationId?.title || (isEmpSuperAdmin ? 'Chief Executive Officer' : 'Staff'),
        department: shiftData.employee.departmentId?.name || (isEmpSuperAdmin ? 'Executive Management' : 'General'),
        role: isEmpSuperAdmin ? 'Super Admin' : (user?.role || user?.roles?.[0]?.name || 'Employee')
      };
    }
    if (shiftData?.shift) {
      shiftInfo = {
        name: shiftData.shift.name,
        startTime: shiftData.shift.startTime,
        endTime: shiftData.shift.endTime
      };
    } else if (shiftData?.officeHours) {
      shiftInfo = {
        name: 'Standard Office Shift',
        startTime: shiftData.officeHours.startTime || '11:00 AM',
        endTime: shiftData.officeHours.endTime || '05:00 PM'
      };
    }
  } catch {
    // Super admin or employee without assigned shift
  }

  return {
    records,
    employee: employeeInfo,
    shift: shiftInfo,
    summary: {
      totalDays: records.length,
      presentCount,
      lateCount,
      halfDayCount,
      absentCount,
      leaveCount,
      totalWorkHours: Number((totalWorkMinutes / 60).toFixed(1)),
      totalOvertimeHours: Number((totalOvertimeMinutes / 60).toFixed(1))
    },
    isMonthLocked: Boolean(monthLock)
  };
};

const isFullAdminOrHR = (user) => {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
  return roles.some((r) => {
    const name = typeof r === 'string' ? r : r.name;
    return name === 'Super Admin' || name === 'HR Manager';
  });
};

/**
 * 5.10: Team Live Attendance Grid
 */
export const getTeamAttendance = async ({ user, date, departmentId, status, page = 1, limit = 50 }) => {
  const targetDate = date ? normalizeToUtcMidnight(new Date(date)) : normalizeToUtcMidnight(new Date());

  // Determine authorized employee IDs
  const empFilter = { isDeleted: false, status: { $in: ['Active', 'Probation', 'active'] } };

  if (departmentId) {
    empFilter.departmentId = new mongoose.Types.ObjectId(departmentId);
  } else if (!isFullAdminOrHR(user)) {
    // Limit to manager's own department or team
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    if (managerEmp?.departmentId) {
      empFilter.departmentId = managerEmp.departmentId;
    }
  }

  const employees = await Employee.find(empFilter)
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .populate('shiftId', 'name startTime endTime')
    .populate('userId', 'role roles email')
    .lean();

  const employeeIds = employees.map((e) => e._id);

  const attendanceFilter = {
    employeeId: { $in: employeeIds },
    date: targetDate
  };

  if (status) {
    attendanceFilter.status = status;
  }

  const attendances = await Attendance.find(attendanceFilter).lean();
  const attMap = new Map();
  attendances.forEach((a) => attMap.set(String(a.employeeId), a));

  const items = employees.map((emp) => {
    const att = attMap.get(String(emp._id));
    let presence = 'absent';
    if (att) {
      if (att.checkIn && !att.checkOut) {
        const hasOpenBreak = att.breaks?.some((b) => b.endTime === null);
        presence = hasOpenBreak ? 'on_break' : 'online';
      } else if (att.checkIn && att.checkOut) {
        presence = 'clocked_out';
      } else {
        presence = att.status || 'absent';
      }
    }

    const isEmpSuperAdmin =
      emp.employeeCode === 'EMP-000' ||
      emp.email === 'mhamzaofficial159@gmail.com' ||
      emp.userId?.role === 'Super Admin' ||
      emp.userId?.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin');

    let roleName = isEmpSuperAdmin ? 'Super Admin' : null;
    if (!roleName) {
      const candidate = emp.userId?.role || emp.userId?.roles?.[0]?.name;
      if (candidate && typeof candidate === 'string' && !/^[0-9a-fA-F]{24}$/.test(candidate) && candidate !== 'Employee') {
        roleName = candidate;
      }
    }

    return {
      employee: {
        _id: emp._id,
        name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
        employeeCode: emp.employeeCode,
        avatar: emp.avatar || '',
        department: emp.departmentId?.name || (isEmpSuperAdmin ? 'Executive Management' : 'General'),
        designation: emp.designationId?.title || (isEmpSuperAdmin ? 'Chief Executive Officer' : 'Staff'),
        role: roleName,
        shift: emp.shiftId || null
      },
      attendance: att || null,
      presence
    };
  });

  return {
    items,
    date: targetDate,
    total: items.length
  };
};

/**
 * 5.11: Manual Attendance Edit (HR Admin) with Audit Log
 */
export const updateAttendanceRecord = async ({ attendanceId, user, checkIn, checkOut, status, overrideReason }) => {
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  await assertMonthNotLocked(attendance.date);

  const previousValues = {
    checkIn: attendance.checkIn,
    checkOut: attendance.checkOut,
    status: attendance.status,
    workDurationMinutes: attendance.workDurationMinutes,
    overtimeMinutes: attendance.overtimeMinutes,
    flags: attendance.flags
  };

  if (checkIn !== undefined) {
    attendance.checkIn = checkIn ? new Date(checkIn) : null;
  }
  if (checkOut !== undefined) {
    attendance.checkOut = checkOut ? new Date(checkOut) : null;
  }
  if (status) {
    attendance.status = status;
  }

  // Recalculate duration & overtime if both checkIn and checkOut exist
  if (attendance.checkIn && attendance.checkOut) {
    const { shift, officeHours, lateRules } = await getShiftAndPolicies(attendance.employeeId);
    const metrics = calculateWorkMetrics({
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      totalBreakMinutes: attendance.totalBreakMinutes || 0,
      shift,
      officeHours,
      lateRules
    });
    attendance.workDurationMinutes = metrics.workDurationMinutes;
    attendance.overtimeMinutes = metrics.overtimeMinutes;
  }

  if (!attendance.flags.includes('manualAdjustment')) {
    attendance.flags.push('manualAdjustment');
  }

  const newValues = {
    checkIn: attendance.checkIn,
    checkOut: attendance.checkOut,
    status: attendance.status,
    workDurationMinutes: attendance.workDurationMinutes,
    overtimeMinutes: attendance.overtimeMinutes,
    flags: attendance.flags
  };

  attendance.auditLogs.push({
    modifiedBy: user._id,
    modifiedAt: new Date(),
    previousValues,
    newValues,
    reason: overrideReason
  });

  await attendance.save();
  return attendance;
};

/**
 * 5.14: Month Lock Management
 */
export const lockAttendanceMonth = async ({ yearMonth, user, notes = '' }) => {
  const lock = await MonthLock.findOneAndUpdate(
    { yearMonth },
    {
      $set: {
        isLocked: true,
        lockedBy: user._id,
        lockedAt: new Date(),
        notes
      }
    },
    { upsert: true, new: true }
  );
  return lock;
};

export const unlockAttendanceMonth = async ({ yearMonth, user, notes = '' }) => {
  const lock = await MonthLock.findOne({ yearMonth });
  if (!lock) {
    throw new ApiError(404, `No lock record found for ${yearMonth}`);
  }

  lock.isLocked = false;
  lock.unlockedBy = user._id;
  lock.unlockedAt = new Date();
  if (notes) lock.notes = notes;

  await lock.save();
  return lock;
};

export const getMonthLockStatus = async (yearMonth) => {
  const [yearStr, monthStr] = (yearMonth || '').split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 1));

  const [lock, recentHistory, pendingCorrections, pendingWFH, totalRecords] = await Promise.all([
    MonthLock.findOne({ yearMonth }).populate('lockedBy unlockedBy', 'name email').lean(),
    MonthLock.find().sort({ yearMonth: -1 }).limit(10).populate('lockedBy unlockedBy', 'name email').lean(),
    AttendanceCorrection.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth }, status: 'pending' }),
    WFHRequest.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth }, status: 'pending' }),
    Attendance.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth } })
  ]);

  return {
    ...(lock || { yearMonth, isLocked: false }),
    metrics: {
      pendingCorrections,
      pendingWFH,
      totalRecords
    },
    recentHistory: recentHistory || []
  };
};

/**
 * Helper to fetch all recipient User IDs for management notifications
 * (Direct Manager + HR Managers + Super Admins)
 */
const getApprovalNotificationRecipients = async (applicantEmp) => {
  const recipientIds = new Set();

  // 1. Direct manager
  if (applicantEmp?.managerId?.userId) {
    recipientIds.add(String(applicantEmp.managerId.userId));
  }

  // 2. HR Managers and Super Admins
  try {
    const adminRoles = await Role.find({ name: { $in: ['Super Admin', 'HR Manager'] } }, '_id').lean();
    const adminRoleIds = adminRoles.map((r) => r._id);
    if (adminRoleIds.length > 0) {
      const adminUsers = await User.find(
        {
          roles: { $in: adminRoleIds },
          isActive: true,
          isDeleted: { $ne: true }
        },
        '_id'
      ).lean();
      adminUsers.forEach((u) => recipientIds.add(String(u._id)));
    }
  } catch (err) {
    console.warn(`[attendance.service] Failed to fetch admin recipient user IDs: ${err.message}`);
  }

  // Don't send notification to the applicant themselves if they are an admin
  if (applicantEmp?.userId) {
    recipientIds.delete(String(applicantEmp.userId));
  }

  return Array.from(recipientIds);
};

/**
 * 5.8: Work-From-Home (WFH) Workflow
 */
export const applyWFH = async ({ user, date, reason }) => {
  const employeeId = await resolveEmployeeId(user);
  const targetDate = normalizeToUtcMidnight(new Date(date));

  await assertMonthNotLocked(targetDate);

  const existing = await WFHRequest.findOne({ employeeId, date: targetDate });
  if (existing) {
    throw new ApiError(400, 'A WFH request already exists for this date');
  }

  const wfh = new WFHRequest({
    employeeId,
    date: targetDate,
    reason,
    status: 'pending'
  });

  await wfh.save();

  // Notify manager + HR Managers + Super Admin about new WFH request
  try {
    const applicantEmp = await Employee.findById(employeeId)
      .select('name userId managerId')
      .populate('managerId', 'userId');
    const recipientUserIds = await getApprovalNotificationRecipients(applicantEmp);
    if (recipientUserIds.length > 0) {
      notify(recipientUserIds, {
        type: 'attendance',
        title: 'New WFH Request',
        body: `${applicantEmp?.name || 'Team member'} applied for WFH on ${targetDate.toISOString().split('T')[0]}.`,
        link: '/attendance/team'
      }).catch(() => {});
    }
  } catch (notifErr) {
    console.warn(`[attendance.service] WFH submission notification failed: ${notifErr.message}`);
  }

  return wfh;
};

export const getMyWFHRequests = async (user, query = {}) => {
  const employeeId = await resolveEmployeeId(user);
  const { status } = query;
  const filter = { employeeId };
  if (status && status !== 'all') {
    filter.status = status;
  }
  return WFHRequest.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate('decisionBy', 'name email role roles')
    .sort({ createdAt: -1, date: -1 })
    .lean();
};

export const getTeamWFHRequests = async (user, query = {}) => {
  const { status } = query;
  let filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    if (managerEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: managerEmp.departmentId, isDeleted: false }).distinct('_id');
      filter.employeeId = { $in: deptEmployees };
    }
  }

  return WFHRequest.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate('decisionBy', 'name email role roles')
    .sort({ createdAt: -1, date: -1 })
    .lean();
};

export const decideWFH = async ({ requestId, user, decision, decisionReason }) => {
  const wfh = await WFHRequest.findById(requestId);
  if (!wfh) {
    throw new ApiError(404, 'WFH request not found');
  }

  // PBAC Boundaries: Verify department scope and block self-approval
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, '_id departmentId').lean();
    const applicantEmp = await Employee.findById(wfh.employeeId).select('_id departmentId managerId').lean();

    if (managerEmp && String(wfh.employeeId) === String(managerEmp._id)) {
      throw new ApiError(403, 'Forbidden: You cannot approve your own WFH request. It must be reviewed by HR.');
    }
    if (managerEmp?.departmentId && applicantEmp?.departmentId && String(managerEmp.departmentId) !== String(applicantEmp.departmentId)) {
      throw new ApiError(403, 'Forbidden: You do not have permission to decide WFH requests outside your department.');
    }
  }

  wfh.status = decision;
  wfh.decisionBy = user._id;
  wfh.decisionAt = new Date();
  wfh.decisionReason = decisionReason || null;

  await wfh.save();

  // Synchronize with Attendance record
  const targetDateMidnight = normalizeToUtcMidnight(new Date(wfh.date));
  if (decision === 'approved') {
    await assertMonthNotLocked(targetDateMidnight);
    let att = await Attendance.findOne({ employeeId: wfh.employeeId, date: targetDateMidnight });
    const emp = await Employee.findById(wfh.employeeId).select('shiftId').lean();

    if (!att) {
      att = new Attendance({
        employeeId: wfh.employeeId,
        date: targetDateMidnight,
        shiftId: emp?.shiftId || null,
        status: 'present',
        flags: ['wfh'],
        source: 'wfh'
      });
      await att.save();
    } else {
      if (!att.flags) att.flags = [];
      if (!att.flags.includes('wfh')) att.flags.push('wfh');
      if (att.status === 'absent' || !att.status) att.status = 'present';
      att.source = 'wfh';
      await att.save();
    }
  } else if (decision === 'rejected') {
    const existingAtt = await Attendance.findOne({ employeeId: wfh.employeeId, date: targetDateMidnight });
    if (existingAtt && existingAtt.source === 'wfh' && !existingAtt.checkIn) {
      await Attendance.deleteOne({ _id: existingAtt._id });
    } else if (existingAtt && existingAtt.flags?.includes('wfh')) {
      existingAtt.flags = existingAtt.flags.filter((f) => f !== 'wfh');
      await existingAtt.save();
    }
  }

  // Notify applicant of manager decision (BUG-04 Fix)
  try {
    const applicantEmp = await Employee.findById(wfh.employeeId).select('userId name');
    if (applicantEmp?.userId) {
      notify(applicantEmp.userId, {
        type: 'attendance',
        title: `WFH Request ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
        body: `Your WFH request for ${wfh.date.toISOString().split('T')[0]} has been ${decision}.`,
        link: '/attendance/my'
      }).catch(() => {});
    }
  } catch (notifErr) {
    console.warn(`[attendance.service] WFH decision notification failed: ${notifErr.message}`);
  }

  return wfh;
};

/**
 * Audit Context for WFH Request Review
 */
export const getWFHAuditContext = async ({ requestId, user }) => {
  const wfh = await WFHRequest.findById(requestId)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode avatar departmentId designationId shiftId userId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' },
        { path: 'shiftId', select: 'name startTime endTime gracePeriodMinutes workDays' }
      ]
    })
    .populate('decisionBy', 'name email role roles')
    .lean();

  if (!wfh) {
    throw new ApiError(404, 'WFH request not found');
  }

  // PBAC Check: If not full Admin or HR, verify manager shares department
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    const applicantDeptId = String(wfh.employeeId?.departmentId?._id || wfh.employeeId?.departmentId || '');
    if (managerEmp?.departmentId && applicantDeptId && String(managerEmp.departmentId) !== applicantDeptId) {
      throw new ApiError(403, 'Forbidden: You do not have permission to view WFH requests outside your department.');
    }
  }

  const targetDate = new Date(wfh.date);
  const year = targetDate.getUTCFullYear();
  const month = targetDate.getUTCMonth();
  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  // Fetch monthly attendances for track record history
  const monthlyAttendances = await Attendance.find({
    employeeId: wfh.employeeId?._id,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).sort({ date: 1 }).lean();

  // Fetch total WFH requests for this month
  const monthlyWFHRequests = await WFHRequest.find({
    employeeId: wfh.employeeId?._id,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).lean();

  const approvedWFHCount = monthlyWFHRequests.filter((r) => r.status === 'approved').length;
  const pendingWFHCount = monthlyWFHRequests.filter((r) => r.status === 'pending').length;

  const summary = {
    totalRecords: monthlyAttendances.length,
    presentCount: monthlyAttendances.filter((a) => a.status === 'present').length,
    lateCount: monthlyAttendances.filter((a) => a.status === 'late' || a.flags?.includes('late')).length,
    absentCount: monthlyAttendances.filter((a) => a.status === 'absent').length,
    halfDayCount: monthlyAttendances.filter((a) => a.status === 'half_day').length,
    leaveCount: monthlyAttendances.filter((a) => a.status === 'on_leave' || a.status === 'holiday').length,
    wfhCount: approvedWFHCount
  };

  const recentRecords = monthlyAttendances.slice(-7).map((a) => ({
    date: a.date,
    checkIn: a.checkIn,
    checkOut: a.checkOut,
    status: a.status,
    flags: a.flags,
    isLate: a.status === 'late' || a.flags?.includes('late'),
    isWFH: a.flags?.includes('wfh') || a.source === 'wfh'
  }));

  const existingAttendance = await Attendance.findOne({
    employeeId: wfh.employeeId?._id,
    date: normalizeToUtcMidnight(targetDate)
  }).lean();

  const { shift } = await getShiftAndPolicies(wfh.employeeId?._id);

  return {
    wfh,
    employee: wfh.employeeId,
    shift: shift || wfh.employeeId?.shiftId || null,
    existingAttendance: existingAttendance || null,
    monthSummary: summary,
    wfhStats: {
      approvedThisMonth: approvedWFHCount,
      pendingThisMonth: pendingWFHCount,
      totalThisMonth: monthlyWFHRequests.length
    },
    recentRecords
  };
};

/**
 * 5.12: Attendance Correction Workflow
 */
export const applyCorrection = async ({ user, date, requestedCheckIn, requestedCheckOut, reason }) => {
  const employeeId = await resolveEmployeeId(user);
  const targetDate = normalizeToUtcMidnight(new Date(date));
  const todayMidnight = normalizeToUtcMidnight(new Date());

  // 1. Cannot request punch correction for coming / future dates
  if (targetDate.getTime() > todayMidnight.getTime()) {
    throw new ApiError(400, 'Cannot request punch correction for future dates.');
  }

  // 2. Only allow punch corrections for the current active month
  const currentYM = getYearMonth(new Date());
  const targetYM = getYearMonth(targetDate);
  if (targetYM !== currentYM) {
    throw new ApiError(400, 'Punch corrections are only allowed for the current active month.');
  }

  await assertMonthNotLocked(targetDate);

  const existingAtt = await Attendance.findOne({ employeeId, date: targetDate });

  // 3. If targetDate is today: cannot request missed punch if currently clocked in without clocking out
  if (targetDate.getTime() === todayMidnight.getTime()) {
    if (existingAtt && existingAtt.checkIn && !existingAtt.checkOut) {
      throw new ApiError(400, 'Cannot request missed punch for today while duty session is active. Please clock out first.');
    }
  }

  const correction = new AttendanceCorrection({
    employeeId,
    attendanceId: existingAtt?._id || null,
    date: targetDate,
    requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : null,
    requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : null,
    reason,
    status: 'pending'
  });

  await correction.save();

  // Notify manager + HR Managers + Super Admin about new attendance correction request
  try {
    const applicantEmp = await Employee.findById(employeeId)
      .select('name userId managerId')
      .populate('managerId', 'userId');
    const recipientUserIds = await getApprovalNotificationRecipients(applicantEmp);
    if (recipientUserIds.length > 0) {
      notify(recipientUserIds, {
        type: 'attendance',
        title: 'New Attendance Correction Request',
        body: `${applicantEmp?.name || 'Team member'} submitted an attendance correction request for ${targetDate.toISOString().split('T')[0]}.`,
        link: '/attendance/team'
      }).catch(() => {});
    }
  } catch (notifErr) {
    console.warn(`[attendance.service] Correction submission notification failed: ${notifErr.message}`);
  }

  return correction;
};

export const getMyCorrections = async (user, query = {}) => {
  const employeeId = await resolveEmployeeId(user);
  const { status } = query;
  const filter = { employeeId };
  if (status && status !== 'all') {
    filter.status = status;
  }
  return AttendanceCorrection.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate({
      path: 'attendanceId',
      select: 'checkIn checkOut status workDurationMinutes'
    })
    .populate('decisionBy', 'name email role roles')
    .sort({ createdAt: -1, date: -1 })
    .lean();
};

export const getTeamCorrections = async (user, query = {}) => {
  const { status } = query;
  let filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    if (managerEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: managerEmp.departmentId, isDeleted: false }).distinct('_id');
      filter.employeeId = { $in: deptEmployees };
    }
  }

  return AttendanceCorrection.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate({
      path: 'attendanceId',
      select: 'checkIn checkOut status workDurationMinutes'
    })
    .populate('decisionBy', 'name email role roles')
    .sort({ createdAt: -1, date: -1 })
    .lean();
};

export const decideCorrection = async ({ correctionId, user, decision, decisionNotes }) => {
  const correction = await AttendanceCorrection.findById(correctionId);
  if (!correction) {
    throw new ApiError(404, 'Correction request not found');
  }

  // PBAC Boundaries: Verify department scope and block self-approval
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, '_id departmentId').lean();
    const applicantEmp = await Employee.findById(correction.employeeId).select('_id departmentId managerId').lean();

    if (managerEmp && String(correction.employeeId) === String(managerEmp._id)) {
      throw new ApiError(403, 'Forbidden: You cannot approve your own correction request. It must be reviewed by HR.');
    }
    if (managerEmp?.departmentId && applicantEmp?.departmentId && String(managerEmp.departmentId) !== String(applicantEmp.departmentId)) {
      throw new ApiError(403, 'Forbidden: You do not have permission to decide correction requests outside your department.');
    }
  }

  correction.status = decision;
  correction.decisionBy = user._id;
  correction.decisionAt = new Date();
  correction.decisionNotes = decisionNotes || null;
  await correction.save();

  if (decision === 'approved') {
    await assertMonthNotLocked(correction.date);
    let att = await Attendance.findOne({ employeeId: correction.employeeId, date: correction.date });
    const { shift, officeHours, lateRules } = await getShiftAndPolicies(correction.employeeId);

    const previousValues = att ? { checkIn: att.checkIn, checkOut: att.checkOut, status: att.status } : {};

    if (!att) {
      att = new Attendance({
        employeeId: correction.employeeId,
        date: correction.date,
        shiftId: shift?._id || null,
        flags: ['manualAdjustment'],
        source: 'manual_hr'
      });
    }

    if (correction.requestedCheckIn) {
      att.checkIn = correction.requestedCheckIn;
      const statusRes = evaluateAttendanceStatus({ checkIn: att.checkIn, shift, officeHours, lateRules });
      att.status = statusRes.status;
    }
    if (correction.requestedCheckOut) {
      att.checkOut = correction.requestedCheckOut;
    }

    if (att.checkIn && att.checkOut) {
      const metrics = calculateWorkMetrics({
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        totalBreakMinutes: att.totalBreakMinutes || 0,
        shift,
        officeHours,
        lateRules
      });
      att.workDurationMinutes = metrics.workDurationMinutes;
      att.overtimeMinutes = metrics.overtimeMinutes;
    }

    att.auditLogs.push({
      modifiedBy: user._id,
      modifiedAt: new Date(),
      previousValues,
      newValues: { checkIn: att.checkIn, checkOut: att.checkOut, status: att.status },
      reason: `Approved Correction: ${correction.reason}`
    });

    await att.save();
  }

  // Notify applicant of decision (BUG-04 Fix)
  try {
    const applicantEmp = await Employee.findById(correction.employeeId).select('userId name');
    if (applicantEmp?.userId) {
      notify(applicantEmp.userId, {
        type: 'attendance',
        title: `Attendance Correction ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
        body: `Your attendance correction for ${correction.date.toISOString().split('T')[0]} has been ${decision}.`,
        link: '/attendance/my'
      }).catch(() => {});
    }
  } catch (notifErr) {
    console.warn(`[attendance.service] Correction decision notification failed: ${notifErr.message}`);
  }

  return correction;
};

/**
 * 5.12-EXT: Comprehensive Audit Context for Punch Correction Review
 * (Shift details, variance, original punch record, and applicant monthly attendance history)
 */
export const getCorrectionAuditContext = async ({ correctionId, user }) => {
  const correction = await AttendanceCorrection.findById(correctionId)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode avatar departmentId designationId shiftId userId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' },
        { path: 'shiftId', select: 'name startTime endTime gracePeriodMinutes workDays' }
      ]
    })
    .populate('attendanceId')
    .populate('decisionBy', 'name email role roles')
    .lean();

  if (!correction) {
    throw new ApiError(404, 'Correction request not found');
  }

  // PBAC Check: If not full Admin or HR, verify manager shares department
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    const applicantDeptId = String(correction.employeeId?.departmentId?._id || correction.employeeId?.departmentId || '');
    if (!managerEmp?.departmentId || String(managerEmp.departmentId) !== applicantDeptId) {
      throw new ApiError(403, 'Forbidden: You do not have permission to view correction requests outside your department.');
    }
  }

  const targetDate = new Date(correction.date);
  const year = targetDate.getUTCFullYear();
  const month = targetDate.getUTCMonth();
  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  // Fetch monthly attendances for track record history
  const monthlyAttendances = await Attendance.find({
    employeeId: correction.employeeId?._id,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).sort({ date: 1 }).lean();

  const summary = {
    totalRecords: monthlyAttendances.length,
    presentCount: monthlyAttendances.filter((a) => a.status === 'present').length,
    lateCount: monthlyAttendances.filter((a) => a.status === 'late' || a.flags?.includes('late')).length,
    absentCount: monthlyAttendances.filter((a) => a.status === 'absent').length,
    halfDayCount: monthlyAttendances.filter((a) => a.status === 'half_day').length,
    leaveCount: monthlyAttendances.filter((a) => a.status === 'on_leave' || a.status === 'holiday').length
  };

  const recentRecords = monthlyAttendances.slice(-7).map((a) => ({
    date: a.date,
    checkIn: a.checkIn,
    checkOut: a.checkOut,
    status: a.status,
    isLate: a.status === 'late' || a.flags?.includes('late')
  }));

  const { shift } = await getShiftAndPolicies(correction.employeeId?._id);

  return {
    correction,
    employee: correction.employeeId,
    shift: shift || correction.employeeId?.shiftId || null,
    originalAttendance: correction.attendanceId || null,
    monthSummary: summary,
    recentRecords
  };
};

/**
 * 5.15: ExcelJS Attendance Export
 */
export const generateAttendanceExcel = async ({ startDate, endDate, month, departmentId, status, user }) => {
  let filter = {};

  if (month) {
    const [year, m] = month.split('-').map(Number);
    filter.date = {
      $gte: new Date(Date.UTC(year, m - 1, 1)),
      $lte: new Date(Date.UTC(year, m, 0, 23, 59, 59, 999))
    };
  } else if (startDate && endDate) {
    filter.date = {
      $gte: normalizeToUtcMidnight(new Date(startDate)),
      $lte: new Date(Date.UTC(new Date(endDate).getFullYear(), new Date(endDate).getMonth(), new Date(endDate).getDate(), 23, 59, 59, 999))
    };
  }

  if (status) {
    filter.status = status;
  }

  if (user && !isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    if (managerEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: managerEmp.departmentId, isDeleted: false }).distinct('_id');
      filter.employeeId = { $in: deptEmployees };
    }
  } else if (departmentId) {
    const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).distinct('_id');
    filter.employeeId = { $in: deptEmployees };
  }

  const attendances = await Attendance.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode departmentId',
      populate: { path: 'departmentId', select: 'name' }
    })
    .populate('shiftId', 'name')
    .sort({ date: -1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HRM Starlight System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Attendance Report');

  // Columns specification
  worksheet.columns = [
    { header: 'Employee Code', key: 'code', width: 16 },
    { header: 'Employee Name', key: 'name', width: 24 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Shift', key: 'shift', width: 16 },
    { header: 'Check In', key: 'checkIn', width: 12 },
    { header: 'Check Out', key: 'checkOut', width: 12 },
    { header: 'Work (Hrs)', key: 'duration', width: 12 },
    { header: 'Breaks (Mins)', key: 'breaks', width: 14 },
    { header: 'Overtime (Hrs)', key: 'overtime', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Flags', key: 'flags', width: 22 }
  ];

  // Header Styling: Navy blue fill with white bold text
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Populate rows
  attendances.forEach((att) => {
    const emp = att.employeeId;
    const dateStr = att.date ? new Date(att.date).toISOString().split('T')[0] : '';
    const inTime = att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-';
    const outTime = att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-';
    const workHours = (att.workDurationMinutes / 60).toFixed(1);
    const otHours = (att.overtimeMinutes / 60).toFixed(1);

    worksheet.addRow({
      code: emp?.employeeCode || 'N/A',
      name: emp?.name || (emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'N/A'),
      department: emp?.departmentId?.name || 'General',
      date: dateStr,
      shift: att.shiftId?.name || 'Standard',
      checkIn: inTime,
      checkOut: outTime,
      duration: workHours,
      breaks: att.totalBreakMinutes || 0,
      overtime: otHours,
      status: (att.status || '').toUpperCase(),
      flags: (att.flags || []).join(', ')
    });
  });

  return workbook.xlsx.writeBuffer();
};

/**
 * 5.15: Monthly Attendance History Matrix
 */
export const getAttendanceHistory = async ({ user, month, search, departmentId, selfOnly = false, page = 1, limit = 50 }) => {
  const currentYM = getYearMonth(new Date());
  const targetYM = month || currentYM;
  const [yearStr, monthStr] = targetYM.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const startDate = normalizeToUtcMidnight(new Date(year, monthNum - 1, 1));
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const endDate = normalizeToUtcMidnight(new Date(year, monthNum - 1, daysInMonth));

  // Determine authorized employee IDs
  const empFilter = { isDeleted: false, status: { $in: ['Active', 'Probation', 'active'] } };

  if (selfOnly) {
    const selfEmpId = await resolveEmployeeId(user);
    empFilter._id = selfEmpId;
  } else if (departmentId) {
    empFilter.departmentId = new mongoose.Types.ObjectId(departmentId);
  } else if (!isFullAdminOrHR(user)) {
    // Check if user is manager or regular employee
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }).lean();
    if (managerEmp) {
      const hasTeamPerm = user?.roles?.some((r) => {
        const name = typeof r === 'string' ? r : r?.name;
        return name === 'Department Manager';
      });
      if (hasTeamPerm && managerEmp.departmentId) {
        empFilter.departmentId = managerEmp.departmentId;
      } else {
        empFilter._id = managerEmp._id;
      }
    }
  }

  if (search && search.trim()) {
    const q = search.trim();
    empFilter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { employeeCode: { $regex: q, $options: 'i' } }
    ];
  }

  const totalEmployees = await Employee.countDocuments(empFilter);
  const skip = (page - 1) * limit;

  const employees = await Employee.find(empFilter)
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .populate('shiftId', 'name startTime endTime workDays')
    .populate('userId', 'role roles email')
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const employeeIds = employees.map((e) => e._id);

  // Fetch all attendance records for these employees in this month
  const attendances = await Attendance.find({
    employeeId: { $in: employeeIds },
    date: { $gte: startDate, $lte: endDate }
  }).lean();

  // Create lookup map: employeeId_YYYY-MM-DD -> record
  const attLookup = new Map();
  attendances.forEach((a) => {
    const dKey = a.date.toISOString().split('T')[0];
    const key = `${String(a.employeeId)}_${dKey}`;
    attLookup.set(key, a);
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const items = employees.map((emp) => {
    const workDays =
      emp.shiftId?.workDays && emp.shiftId.workDays.length > 0
        ? emp.shiftId.workDays
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const weeklyOffDays = allDays.filter((d) => !workDays.includes(d));
    let offLabel = 'Sun Off';
    if (weeklyOffDays.length === 1) {
      offLabel = `${weeklyOffDays[0].slice(0, 3)} Off`;
    } else if (weeklyOffDays.length > 1) {
      offLabel = `${weeklyOffDays.map((d) => d.slice(0, 3)).join('-')} Off`;
    }

    const records = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, monthNum - 1, day);
      const dateKey = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayNameLong = allDays[dayDate.getDay()];
      const dayNameShort = dayNameLong.slice(0, 3).toUpperCase();
      const isWeeklyOff = !workDays.includes(dayNameLong);
      const isFuture = dateKey > todayStr;

      const att = attLookup.get(`${String(emp._id)}_${dateKey}`);

      let status = 'absent';
      if (att) {
        status = att.status;
      } else if (isFuture) {
        status = 'upcoming';
      } else if (isWeeklyOff) {
        status = 'weekly_off';
      } else {
        status = 'absent';
      }

      records[dateKey] = {
        date: dateKey,
        dayNum: day,
        dayName: dayNameShort,
        status,
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        workDurationMinutes: att?.workDurationMinutes || 0,
        isLate: att?.status === 'late' || att?.flags?.includes('late') || false,
        isWeeklyOff,
        isUpcoming: isFuture
      };
    }

    const isEmpSuperAdmin =
      emp.employeeCode === 'EMP-000' ||
      emp.email === 'mhamzaofficial159@gmail.com' ||
      emp.userId?.role === 'Super Admin' ||
      emp.userId?.roles?.some((r) => (typeof r === 'string' ? r : r?.name) === 'Super Admin');

    let roleName = isEmpSuperAdmin ? 'Super Admin' : null;
    if (!roleName) {
      const candidate = emp.userId?.role || emp.userId?.roles?.[0]?.name;
      if (candidate && typeof candidate === 'string' && !/^[0-9a-fA-F]{24}$/.test(candidate) && candidate !== 'Employee') {
        roleName = candidate;
      }
    }

    return {
      employee: {
        _id: emp._id,
        name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        employeeCode: emp.employeeCode,
        avatar: emp.avatar || '',
        department: emp.departmentId?.name || (isEmpSuperAdmin ? 'Executive Management' : 'General'),
        designation: emp.designationId?.title || (isEmpSuperAdmin ? 'Chief Executive Officer' : 'Staff'),
        role: roleName,
        shift: emp.shiftId?.name || 'Morning Regular',
        offLabel
      },
      records
    };
  });

  return {
    month: targetYM,
    daysInMonth,
    total: totalEmployees,
    page,
    limit,
    pages: Math.ceil(totalEmployees / limit) || 1,
    items
  };
};

