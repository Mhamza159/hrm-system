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
import { ApiError } from '../../utils/apiError.js';
import { evaluateAttendanceStatus, calculateWorkMetrics } from './services/statusEngine.service.js';
import { emitToCompany, emitToDepartment } from '../../services/socket.service.js';

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
  const employee = await Employee.findById(employeeId).populate('shiftId').lean();
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
export const checkIn = async ({ user, employeeId: explicitEmpId, source = 'web', location, ipAddress, userAgent }) => {
  const employeeId = explicitEmpId || (await resolveEmployeeId(user));
  const todayUtc = normalizeToUtcMidnight(new Date());

  await assertMonthNotLocked(todayUtc);

  // Check for existing attendance record
  let attendance = await Attendance.findOne({ employeeId, date: todayUtc });
  if (attendance && attendance.checkIn) {
    throw new ApiError(400, 'Already clocked in for today');
  }

  const { employee, shift, officeHours, lateRules } = await getShiftAndPolicies(employeeId);

  const now = new Date();
  const { status, flags } = evaluateAttendanceStatus({ checkIn: now, shift, officeHours, lateRules });

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
export const checkOut = async ({ user, employeeId: explicitEmpId, location }) => {
  const employeeId = explicitEmpId || (await resolveEmployeeId(user));
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

  if (metrics.isEarlyDeparture && !attendance.flags.includes('earlyDeparture')) {
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
export const startBreak = async ({ user, employeeId: explicitEmpId, type = 'meal' }) => {
  const employeeId = explicitEmpId || (await resolveEmployeeId(user));
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
export const endBreak = async ({ user, employeeId: explicitEmpId }) => {
  const employeeId = explicitEmpId || (await resolveEmployeeId(user));
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
export const getMyAttendance = async ({ user, employeeId: explicitEmpId, month, date }) => {
  const employeeId = explicitEmpId || (await resolveEmployeeId(user));

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

  return {
    records,
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

    return {
      employee: {
        _id: emp._id,
        name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        employeeCode: emp.employeeCode,
        department: emp.departmentId?.name || 'General',
        designation: emp.designationId?.title || 'Staff',
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
  const lock = await MonthLock.findOne({ yearMonth }).populate('lockedBy unlockedBy', 'name email').lean();
  return lock || { yearMonth, isLocked: false };
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
  return wfh;
};

export const getMyWFHRequests = async (user) => {
  const employeeId = await resolveEmployeeId(user);
  return WFHRequest.find({ employeeId }).sort({ date: -1 }).lean();
};

export const getTeamWFHRequests = async (user) => {
  let filter = { status: 'pending' };
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    if (managerEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: managerEmp.departmentId, isDeleted: false }).distinct('_id');
      filter.employeeId = { $in: deptEmployees };
    }
  }

  return WFHRequest.find(filter)
    .populate('employeeId', 'firstName lastName employeeCode departmentId')
    .sort({ date: -1 })
    .lean();
};

export const decideWFH = async ({ requestId, user, decision, decisionReason }) => {
  const wfh = await WFHRequest.findById(requestId);
  if (!wfh) {
    throw new ApiError(404, 'WFH request not found');
  }

  wfh.status = decision;
  wfh.decisionBy = user._id;
  wfh.decisionAt = new Date();
  wfh.decisionReason = decisionReason || null;

  await wfh.save();
  return wfh;
};

/**
 * 5.12: Attendance Correction Workflow
 */
export const applyCorrection = async ({ user, date, requestedCheckIn, requestedCheckOut, reason }) => {
  const employeeId = await resolveEmployeeId(user);
  const targetDate = normalizeToUtcMidnight(new Date(date));

  await assertMonthNotLocked(targetDate);

  const existingAtt = await Attendance.findOne({ employeeId, date: targetDate });

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
  return correction;
};

export const getMyCorrections = async (user) => {
  const employeeId = await resolveEmployeeId(user);
  return AttendanceCorrection.find({ employeeId }).sort({ date: -1 }).lean();
};

export const getTeamCorrections = async (user) => {
  let filter = { status: 'pending' };
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    if (managerEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: managerEmp.departmentId, isDeleted: false }).distinct('_id');
      filter.employeeId = { $in: deptEmployees };
    }
  }

  return AttendanceCorrection.find(filter)
    .populate('employeeId', 'firstName lastName employeeCode departmentId')
    .sort({ date: -1 })
    .lean();
};

export const decideCorrection = async ({ correctionId, user, decision, decisionNotes }) => {
  const correction = await AttendanceCorrection.findById(correctionId);
  if (!correction) {
    throw new ApiError(404, 'Correction request not found');
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

  return correction;
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
