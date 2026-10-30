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
import { calculateHaversineDistance, isWithinGeofence } from '../../utils/haversine.js';
import { WfhLocation } from '../../models/wfhLocation.model.js';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { Kiosk } from '../../models/kiosk.model.js';
import { recordAuditLog } from '../../services/audit.service.js';

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
 * 13.3 & 13.4: Verify Dynamic QR Token Signature, Expiry, Direction, and Hardware Device Binding
 * @param {Object} params
 * @param {string} params.qrToken
 * @param {string} [params.deviceId]
 * @param {string} [params.deviceModel]
 * @param {Object} params.user
 * @param {string} [params.expectedDirection] - 'entry' | 'exit'
 * @returns {Promise<Object>} The authenticated Kiosk document
 */
// Anti-replay cache for dynamic QR tokens (prevents token reuse / double-punch within validity window)
const consumedQrTokens = new Map();

export const checkAndConsumeQrToken = (nonce, userId) => {
  const key = `${userId}:${nonce}`;
  const now = Date.now();
  // Cleanup tokens older than 60 seconds
  for (const [k, exp] of consumedQrTokens.entries()) {
    if (now > exp) consumedQrTokens.delete(k);
  }
  if (consumedQrTokens.has(key)) {
    return false; // Replayed!
  }
  consumedQrTokens.set(key, now + 60 * 1000);
  return true;
};

export const verifyQrTokenAndDevice = async ({ qrToken, deviceId, deviceModel, user, expectedDirection }) => {
  // 13.6 System-level governance: Check if QR attendance is enabled globally
  const qrSetting = await Setting.findOne({ key: 'qrAttendance' }).lean();
  if (qrSetting && qrSetting.value?.isEnabled === false) {
    throw new ApiError(400, 'Dynamic QR Code attendance is currently disabled by administrator.');
  }
  if (!qrToken) {
    throw new ApiError(400, 'QR token is required for QR attendance punch.');
  }

  // Mandatory hardware device validation when punching via QR (Anti-Bypass)
  if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
    throw new ApiError(400, 'Hardware device ID is mandatory for QR code attendance verification.');
  }

  const parts = qrToken.split('.');
  if (parts.length !== 2) {
    throw new ApiError(400, 'Invalid QR code token format.');
  }

  const [payloadB64, signature] = parts;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch (err) {
    throw new ApiError(400, 'Malformed QR code payload.');
  }

  const { kId, kType, ts, ttl, nonce } = payload;
  if (!kId || !ts || !ttl || !nonce) {
    throw new ApiError(400, 'Incomplete QR code payload.');
  }

  // Future timestamp defense (clock skew ceiling of 10s)
  const nowSec = Math.floor(Date.now() / 1000);
  if (ts > nowSec + 10) {
    throw new ApiError(400, 'QR Code timestamp is in the future. Please synchronize kiosk clock.');
  }

  // Token bounds check
  if (typeof ttl !== 'number' || ttl <= 0 || ttl > 300) {
    throw new ApiError(400, 'Invalid QR code token expiration parameter.');
  }

  // 13.2 Expiration validation (10-second grace window for mobile network/clock drift)
  if (nowSec > ts + ttl + 10) {
    throw new ApiError(400, 'QR Code has expired. Please scan the current live code.');
  }

  // Find kiosk with secretKey
  const kiosk = await Kiosk.findOne({ _id: kId, isDeleted: false }).select('+secretKey');
  if (!kiosk || !kiosk.isActive) {
    throw new ApiError(400, 'Kiosk is inactive or not registered in the system.');
  }

  // HMAC SHA-256 Signature verification with constant-time comparison (timing attack defense)
  const expectedSig = crypto.createHmac('sha256', kiosk.secretKey).update(payloadB64).digest('base64url');
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new ApiError(400, 'Tampered or invalid QR code signature.');
  }

  // Anti-Token-Replay validation: ensure this specific nonce has not already been punched by this user
  const userIdStr = (user?._id || user?.id || '').toString();
  if (userIdStr && !checkAndConsumeQrToken(nonce, userIdStr)) {
    throw new ApiError(400, 'This QR code token has already been consumed for attendance punch. Please scan a fresh QR code.');
  }

  // 13.1 Directionality enforcement
  if (kiosk.type !== 'both') {
    if (expectedDirection && kiosk.type !== expectedDirection) {
      throw new ApiError(400, `This kiosk is designated for ${kiosk.type} only. Cannot record ${expectedDirection}.`);
    }
  }

  // 13.4 Hardware Device Binding enforcement
  const userDoc = await User.findById(user._id || user.id);
  if (userDoc) {
    if (!userDoc.deviceId) {
      // First-time scan: automatically bind hardware device ID
      userDoc.deviceId = deviceId;
      userDoc.deviceBoundAt = new Date();
      if (deviceModel) userDoc.deviceModel = deviceModel;
      await userDoc.save();
    } else if (userDoc.deviceId !== deviceId) {
      // Mismatched device ID: Reject punch with 403 Forbidden
      throw new ApiError(
        403,
        'Device binding mismatch. Your account is bound to another registered device. Please contact HR to reset your device binding.'
      );
    }
  }

  return kiosk;
};

/**
 * 5.3: Web Clock-In
 */
export const checkIn = async ({ user, source = 'web', location, ipAddress, userAgent, qrToken, deviceId, deviceModel }) => {
  const employeeId = await resolveEmployeeId(user);
  const todayUtc = normalizeToUtcMidnight(new Date());

  await assertMonthNotLocked(todayUtc);
  let kioskId = null;
  let punchSource = source;
  if (source === 'qr' || qrToken) {
    const kiosk = await verifyQrTokenAndDevice({
      qrToken,
      deviceId,
      deviceModel,
      user,
      expectedDirection: 'entry'
    });
    punchSource = 'qr';
    kioskId = kiosk._id;
  }

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
  if (wfh) {
    flags.push('wfh');
    punchSource = 'wfh';
  }

  // --- M14 GPS / Geo-fencing Evaluation (Slices 14.2, 14.3, 14.4, 14.5) ---
  let isFlagged = false;
  let flagReason = null;
  let minDistanceMeters = null;

  if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    const punchLat = location.latitude;
    const punchLon = location.longitude;
    const punchAccuracy = location.accuracy || 0;
    const isMock = Boolean(location.isMock);

    // 14.3 Accuracy & Mock GPS Detection
    if (isMock || punchAccuracy <= 0) {
      isFlagged = true;
      flagReason = isMock ? 'mock_gps' : 'mock_gps';
    } else if (punchAccuracy > 100) {
      isFlagged = true;
      flagReason = 'low_accuracy';
    }

    // 14.2 Office Geofences Distance Evaluation
    const geoFencesDoc = await Setting.findOne({ key: 'geoFences' }).lean();
    const officeGeoFences = (Array.isArray(geoFencesDoc?.value) ? geoFencesDoc.value : []).filter((gf) => gf.isActive !== false);

    let insideOffice = false;
    if (officeGeoFences.length > 0) {
      for (const fence of officeGeoFences) {
        const dist = calculateHaversineDistance(punchLat, punchLon, fence.latitude, fence.longitude);
        if (minDistanceMeters === null || dist < minDistanceMeters) {
          minDistanceMeters = dist;
        }
        if (dist <= fence.radiusMeters) {
          insideOffice = true;
        }
      }
    }

    // 14.5 Client-Site / Field Visit Check
    const allPermissions = [
      ...(user?.permissions || []),
      ...(user?.roles?.flatMap((r) => (typeof r === 'object' && r?.permissions ? r.permissions : [])) || [])
    ];
    const hasFieldPermission = allPermissions.some((p) => p.action === 'attendance.fieldCheckIn') || isSuperAdmin;

    if (location.isClientVisit && hasFieldPermission) {
      flags.push('field');
      punchSource = 'field';
    } else {
      // 14.4 Approved WFH Location Check
      let insideApprovedWfh = false;
      if (!insideOffice) {
        const approvedWfhLocs = await WfhLocation.find({
          employeeId,
          status: 'approved',
          isActive: true,
          isDeleted: false
        }).lean();

        for (const loc of approvedWfhLocs) {
          const dist = calculateHaversineDistance(punchLat, punchLon, loc.latitude, loc.longitude);
          if (dist <= (loc.radiusMeters || 100)) {
            insideApprovedWfh = true;
            flags.push('wfh');
            punchSource = 'wfh';
            break;
          }
        }
      }

      // If outside all office geofences and approved WFH locations
      if (!insideOffice && !insideApprovedWfh && !isSuperAdmin) {
        isFlagged = true;
        flagReason = flagReason || 'geofence_violation';
      }
    }
  }

  if (!attendance) {
    attendance = new Attendance({
      employeeId,
      date: todayUtc,
      shiftId: shift?._id || null,
      kioskId: kioskId || null,
      checkIn: now,
      status,
      flags,
      source: punchSource,
      location: location || {},
      isFlagged,
      flagReason,
      distanceFromOfficeMeters: minDistanceMeters,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });
  } else {
    attendance.checkIn = now;
    if (kioskId) attendance.kioskId = kioskId;
    attendance.status = status;
    attendance.flags = flags;
    attendance.source = punchSource;
    attendance.location = location || attendance.location;
    attendance.isFlagged = isFlagged;
    attendance.flagReason = flagReason;
    attendance.distanceFromOfficeMeters = minDistanceMeters;
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
export const checkOut = async ({ user, location, source = 'web', qrToken, deviceId, deviceModel }) => {
  const employeeId = await resolveEmployeeId(user);
  const todayUtc = normalizeToUtcMidnight(new Date());

  await assertMonthNotLocked(todayUtc);
  let qrKiosk = null;
  if (source === 'qr' || qrToken) {
    qrKiosk = await verifyQrTokenAndDevice({
      qrToken,
      deviceId,
      deviceModel,
      user,
      expectedDirection: 'exit'
    });
  }

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
  if (qrKiosk) {
    attendance.kioskId = qrKiosk._id;
    attendance.source = 'qr';
  }
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

  const records = await Attendance.find(filter).populate('kioskId', 'name code locationDescription').sort({ date: 1 }).lean();

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

  const attendances = await Attendance.find(attendanceFilter).populate('kioskId', 'name code locationDescription').lean();
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
export const updateAttendanceRecord = async ({ attendanceId, user, checkIn, checkOut, status, overtimeApproved, overrideReason }) => {
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
    overtimeApproved: attendance.overtimeApproved,
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
  if (overtimeApproved !== undefined) {
    attendance.overtimeApproved = Boolean(overtimeApproved);
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
    overtimeApproved: attendance.overtimeApproved,
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

  const [lock, recentHistory, pendingCorrections, pendingWFH, pendingFlaggedPunches, totalRecords] = await Promise.all([
    MonthLock.findOne({ yearMonth }).populate('lockedBy unlockedBy', 'name email').lean(),
    MonthLock.find().sort({ yearMonth: -1 }).limit(10).populate('lockedBy unlockedBy', 'name email').lean(),
    AttendanceCorrection.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth }, status: 'pending' }),
    WFHRequest.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth }, status: 'pending' }),
    Attendance.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth }, isFlagged: true, flagResolved: false }),
    Attendance.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth } })
  ]);

  return {
    ...(lock || { yearMonth, isLocked: false }),
    metrics: {
      pendingCorrections,
      pendingWFH,
      pendingFlaggedPunches,
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

/**
 * 5.16: Manager Overtime Approval / Decision
 */
export const decideOvertime = async ({ attendanceId, user, approved, reason }) => {
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  await assertMonthNotLocked(attendance.date);

  // PBAC Boundaries: Verify department scope if not full admin or HR
  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    const applicantEmp = await Employee.findById(attendance.employeeId).select('departmentId').lean();

    if (managerEmp?.departmentId && applicantEmp?.departmentId && String(managerEmp.departmentId) !== String(applicantEmp.departmentId)) {
      throw new ApiError(403, 'Forbidden: You do not have permission to decide overtime outside your department.');
    }
  }

  const previousApproved = Boolean(attendance.overtimeApproved);
  attendance.overtimeApproved = Boolean(approved);

  attendance.auditLogs.push({
    modifiedBy: user._id,
    modifiedAt: new Date(),
    previousValues: { overtimeApproved: previousApproved },
    newValues: { overtimeApproved: Boolean(approved) },
    reason: reason || (approved ? 'Overtime approved by manager' : 'Overtime revoked by manager')
  });

  await attendance.save();

  // Notify employee of overtime approval/revocation
  try {
    const empUser = await Employee.findById(attendance.employeeId).select('userId name');
    if (empUser?.userId) {
      const hrs = ((attendance.overtimeMinutes || 0) / 60).toFixed(1);
      const dateStr = attendance.date ? new Date(attendance.date).toISOString().split('T')[0] : '';
      await notify(empUser.userId, {
        type: 'attendance',
        title: `Overtime ${approved ? 'Approved' : 'Revoked'}`,
        body: `Your ${hrs} hrs overtime for ${dateStr} was ${approved ? 'approved' : 'revoked'}.`,
        link: '/attendance/my'
      });
    }
  } catch (notifErr) {
    console.warn(`[attendance.service] Overtime decision notification failed: ${notifErr.message}`);
  }

  return attendance;
};

/**
 * 5.16: Team Overtime Punches List & Audit
 */
export const getTeamOvertimeRecords = async (user, query = {}) => {
  const { status = 'all', month, search, departmentId, page = 1, limit = 20 } = query;
  const filter = { overtimeMinutes: { $gt: 0 } };

  if (status === 'pending') {
    filter.overtimeApproved = false;
  } else if (status === 'approved') {
    filter.overtimeApproved = true;
  }

  if (month) {
    const [yStr, mStr] = month.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    filter.date = { $gte: start, $lte: end };
  }

  if (!isFullAdminOrHR(user)) {
    const managerEmp = await Employee.findOne({ userId: user._id, isDeleted: false }, 'departmentId').lean();
    if (managerEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: managerEmp.departmentId, isDeleted: false }).distinct('_id');
      filter.employeeId = { $in: deptEmployees };
    }
  } else if (departmentId) {
    const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).distinct('_id');
    filter.employeeId = { $in: deptEmployees };
  }

  if (search && search.trim()) {
    const matchingEmployees = await Employee.find({
      isDeleted: false,
      $or: [
        { name: new RegExp(search.trim(), 'i') },
        { employeeCode: new RegExp(search.trim(), 'i') }
      ]
    }).distinct('_id');

    if (filter.employeeId) {
      const existing = filter.employeeId.$in.map((id) => id.toString());
      filter.employeeId = { $in: matchingEmployees.filter((m) => existing.includes(m.toString())) };
    } else {
      filter.employeeId = { $in: matchingEmployees };
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Attendance.countDocuments(filter);

  const baseCountFilter = { ...filter };
  delete baseCountFilter.overtimeApproved;
  const [pendingCount, approvedCount] = await Promise.all([
    Attendance.countDocuments({ ...baseCountFilter, overtimeApproved: false }),
    Attendance.countDocuments({ ...baseCountFilter, overtimeApproved: true })
  ]);

  const items = await Attendance.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate({
      path: 'employeeId',
      select: 'name employeeCode email avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .lean();

  return {
    items,
    total,
    counts: {
      total: pendingCount + approvedCount,
      pending: pendingCount,
      approved: approvedCount
    },
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)) || 1
  };
};



// ============================================================================
// Module M14: GPS / Geo-fencing Smart Attendance Services (Rows 14.4 - 14.7)
// ============================================================================

/**
 * 14.6-BE: Get flagged attendance punches for managerial review
 */
export const getFlaggedPunches = async ({ user, page = 1, limit = 20, status = 'pending' }) => {
  const isSuperAdmin = user.role === 'Super Admin' || user.roles?.some((r) => r.name === 'Super Admin');
  const isHR = user.role === 'HR Manager' || user.roles?.some((r) => r.name === 'HR Manager');

  const filter = { isFlagged: true };
  if (status === 'pending') {
    filter.flagResolved = false;
  } else if (status === 'resolved') {
    filter.flagResolved = true;
  }

  if (!isSuperAdmin && !isHR) {
    const employeeId = user.employeeId?._id || user.employeeId;
    const teamEmployees = await Employee.find({ managerId: employeeId, isDeleted: false }).select('_id');
    const teamIds = teamEmployees.map((e) => e._id);
    filter.employeeId = { $in: teamIds };
  }

  const skip = (page - 1) * limit;
  const [punches, total] = await Promise.all([
    Attendance.find(filter)
      .populate('employeeId', 'name firstName lastName employeeCode departmentId avatar')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter)
  ]);

  return {
    punches,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * 14.6-BE: Review and regularize or reject a flagged punch
 */
export const reviewFlaggedPunch = async (id, { decision, comments }, actor) => {
  const attendance = await Attendance.findById(id).populate('employeeId');
  if (!attendance) {
    throw new ApiError(404, 'Attendance punch record not found');
  }

  if (!attendance.isFlagged) {
    throw new ApiError(400, 'This attendance record is not flagged.');
  }

  const isSuperAdmin = actor.role === 'Super Admin' || actor.roles?.some((r) => r.name === 'Super Admin');
  const isHR = actor.role === 'HR Manager' || actor.roles?.some((r) => r.name === 'HR Manager');
  const actorEmployeeId = actor.employeeId?._id?.toString() || actor.employeeId?.toString();

  // Prevent self-approval (Separation of Duties)
  const targetEmployeeId = attendance.employeeId?._id?.toString() || attendance.employeeId?.toString();
  if (targetEmployeeId && targetEmployeeId === actorEmployeeId) {
    throw new ApiError(403, 'Separation of duties violation: You cannot review or approve your own flagged attendance.');
  }

  // Separation of duties / team check
  if (!isSuperAdmin && !isHR) {
    const emp = attendance.employeeId;
    if (!emp || emp.managerId?.toString() !== actorEmployeeId) {
      throw new ApiError(403, 'You do not have permission to review flagged punches outside your direct team.');
    }
  }

  attendance.flagResolved = true;
  attendance.flagResolution = {
    decision,
    actorId: actor._id,
    comments: comments.trim(),
    resolvedAt: new Date()
  };

  const previousStatus = attendance.status;
  if (decision === 'rejected') {
    attendance.status = 'absent';
  }

  attendance.auditLogs.push({
    modifiedBy: actor._id,
    modifiedAt: new Date(),
    previousValues: { status: previousStatus, isFlagged: true, flagResolved: false },
    newValues: { status: attendance.status, isFlagged: true, flagResolved: true, decision },
    reason: `Flagged Punch Review (${decision}): ${comments.trim()}`
  });

  await attendance.save();

  // Notify employee
  const applicantUserId = attendance.employeeId?.userId;
  if (applicantUserId) {
    await notify(applicantUserId, {
      type: 'attendance',
      title: `Flagged Punch ${decision.toUpperCase()}`,
      body: `Your flagged attendance on ${new Date(attendance.date).toLocaleDateString()} was ${decision} by management. Remarks: ${comments.trim()}`,
      link: '/attendance'
    }).catch(() => {});
  }

  return attendance;
};

/**
 * 14.7-BE: Punch Locations Aggregation for Interactive Leaflet Map
 */
export const getPunchLocations = async ({ user, date, departmentId, onlyFlagged }) => {
  const queryDate = date ? normalizeToUtcMidnight(new Date(date)) : normalizeToUtcMidnight(new Date());

  const filter = {
    date: queryDate,
    'location.latitude': { $ne: null },
    'location.longitude': { $ne: null }
  };

  if (onlyFlagged) {
    filter.isFlagged = true;
  }

  const isSuperAdmin = user.role === 'Super Admin' || user.roles?.some((r) => r.name === 'Super Admin');
  const isHR = user.role === 'HR Manager' || user.roles?.some((r) => r.name === 'HR Manager');

  if (!isSuperAdmin && !isHR) {
    const employeeId = user.employeeId?._id || user.employeeId;
    const teamEmployees = await Employee.find({ managerId: employeeId, isDeleted: false }).select('_id');
    const teamIds = teamEmployees.map((e) => e._id);
    filter.employeeId = { $in: teamIds };
  } else if (departmentId) {
    const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).select('_id');
    filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
  }

  const [attendances, settingsDoc] = await Promise.all([
    Attendance.find(filter)
      .populate('employeeId', 'name employeeCode avatar departmentId designationId')
      .lean(),
    Setting.findOne({ key: 'geoFences' }).lean()
  ]);

  const activeGeofences = (Array.isArray(settingsDoc?.value) ? settingsDoc.value : []).filter((gf) => gf.isActive !== false);

  return {
    date: queryDate.toISOString().slice(0, 10),
    officeGeofences: activeGeofences,
    punches: attendances.map((a) => ({
      _id: a._id,
      employeeName: a.employeeId?.name || 'Employee',
      employeeCode: a.employeeId?.employeeCode || '',
      avatar: a.employeeId?.avatar || null,
      latitude: a.location.latitude,
      longitude: a.location.longitude,
      accuracy: a.location.accuracy,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      status: a.status,
      isFlagged: a.isFlagged,
      flagReason: a.flagReason,
      isClientVisit: a.location.isClientVisit,
      clientName: a.location.clientName,
      distanceFromOfficeMeters: a.distanceFromOfficeMeters
    }))
  };
};

/**
 * 14.4-BE: WFH Locations Management Services
 */
export const createWfhLocation = async (user, data) => {
  const employeeId = await resolveEmployeeId(user);
  const location = await WfhLocation.create({
    employeeId,
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    radiusMeters: data.radiusMeters || 100,
    status: 'pending'
  });
  return location;
};

export const getWfhLocations = async (user) => {
  const isSuperAdmin = user.role === 'Super Admin' || user.roles?.some((r) => r.name === 'Super Admin');
  const isHR = user.role === 'HR Manager' || user.roles?.some((r) => r.name === 'HR Manager');

  const filter = { isDeleted: false };
  if (!isSuperAdmin && !isHR) {
    const employeeId = await resolveEmployeeId(user);
    filter.employeeId = employeeId;
  }

  return WfhLocation.find(filter)
    .populate('employeeId', 'name employeeCode email')
    .sort({ createdAt: -1 })
    .lean();
};

export const updateWfhLocationStatus = async (id, { status, remarks }, actor) => {
  const location = await WfhLocation.findOne({ _id: id, isDeleted: false });
  if (!location) {
    throw new ApiError(404, 'WFH location not found');
  }

  const isSuperAdmin = actor.role === 'Super Admin' || actor.roles?.some((r) => r.name === 'Super Admin');
  const isHR = actor.role === 'HR Manager' || actor.roles?.some((r) => r.name === 'HR Manager');
  const actorEmployeeId = actor.employeeId?._id?.toString() || actor.employeeId?.toString();

  if (location.employeeId?.toString() === actorEmployeeId) {
    throw new ApiError(403, 'Separation of duties violation: You cannot approve your own WFH location request.');
  }

  if (!isSuperAdmin && !isHR) {
    const emp = await Employee.findById(location.employeeId);
    if (!emp || emp.managerId?.toString() !== actorEmployeeId) {
      throw new ApiError(403, 'You can only approve WFH locations for employees within your direct team.');
    }
  }

  location.status = status;
  location.decisionBy = actor._id;
  location.decisionAt = new Date();
  location.decisionRemarks = remarks || '';
  await location.save();

  // Notify employee
  const emp = await Employee.findById(location.employeeId);
  if (emp?.userId) {
    await notify(emp.userId, {
      type: 'attendance',
      title: `WFH Location ${status.toUpperCase()}`,
      body: `Your WFH remote location '${location.name}' was ${status} by HR.`,
      link: '/attendance'
    }).catch(() => {});
  }

  return location;
};

/**
 * 14.4-BE: Delete / Revoke Registered WFH Location (Soft delete)
 */
export const deleteWfhLocation = async (id, user) => {
  const location = await WfhLocation.findOne({ _id: id, isDeleted: false });
  if (!location) {
    throw new ApiError(404, 'WFH location not found');
  }

  const isSuperAdmin = user.role === 'Super Admin' || user.roles?.some((r) => r.name === 'Super Admin');
  const isHR = user.role === 'HR Manager' || user.roles?.some((r) => r.name === 'HR Manager');
  const userEmployeeId = user.employeeId?._id?.toString() || user.employeeId?.toString();

  if (!isSuperAdmin && !isHR && location.employeeId?.toString() !== userEmployeeId) {
    throw new ApiError(403, 'You do not have permission to delete this WFH location.');
  }

  location.isDeleted = true;
  await location.save();
  return { success: true, message: 'WFH location deleted successfully' };
};

// ============================================================================
// Module M13: Dynamic QR Code Attendance & Kiosks Service Functions
// ============================================================================

/**
 * 13.1-BE: Create a new physical office attendance Kiosk
 */
export const createKiosk = async (data, actor) => {
  const existing = await Kiosk.findOne({ code: data.code.toUpperCase(), isDeleted: false });
  if (existing) {
    throw new ApiError(400, `Kiosk with code '${data.code}' already exists`);
  }

  const secretKey = crypto.randomBytes(16).toString('hex'); // 32-char crypto random string
  const kiosk = new Kiosk({
    name: data.name,
    code: data.code.toUpperCase(),
    type: data.type || 'both',
    locationDescription: data.locationDescription || '',
    secretKey,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdBy: actor?._id || null
  });

  await kiosk.save();

  const kioskObj = kiosk.toObject();
  delete kioskObj.secretKey;

  await recordAuditLog({
    actor: actor,
    action: 'CREATE',
    entity: 'Kiosk',
    entityId: kiosk._id,
    details: { name: kiosk.name, code: kiosk.code, type: kiosk.type }
  });

  return kioskObj;
};

/**
 * 13.1-BE: Query paginated kiosks
 */
export const getKiosks = async ({ search, type, isActive, page = 1, limit = 50 }) => {
  const filter = { isDeleted: false };
  if (search && typeof search === 'string') {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, (m) => '\\' + m);
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ name: regex }, { code: regex }, { locationDescription: regex }];
  }
  if (type && type !== 'all') {
    filter.type = type;
  }
  if (typeof isActive === 'boolean') {
    filter.isActive = isActive;
  }

  const skip = (page - 1) * limit;
  const [kiosks, total] = await Promise.all([
    Kiosk.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Kiosk.countDocuments(filter)
  ]);

  return {
    kiosks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * 13.1-BE: Get Kiosk by ID
 */
export const getKioskById = async (id) => {
  const kiosk = await Kiosk.findOne({ _id: id, isDeleted: false });
  if (!kiosk) {
    throw new ApiError(404, 'Kiosk not found');
  }
  return kiosk;
};

/**
 * 13.1-BE: Update Kiosk details or active status
 */
export const updateKiosk = async (id, data, actor) => {
  const kiosk = await Kiosk.findOne({ _id: id, isDeleted: false });
  if (!kiosk) {
    throw new ApiError(404, 'Kiosk not found');
  }

  if (data.name !== undefined) kiosk.name = data.name;
  if (data.type !== undefined) kiosk.type = data.type;
  if (data.locationDescription !== undefined) kiosk.locationDescription = data.locationDescription;
  if (data.isActive !== undefined) kiosk.isActive = data.isActive;

  await kiosk.save();

  await recordAuditLog({
    actor: actor,
    action: 'UPDATE',
    entity: 'Kiosk',
    entityId: kiosk._id,
    details: { updatedFields: data }
  });

  return kiosk;
};

/**
 * 13.1-BE: Soft delete a Kiosk
 */
export const deleteKiosk = async (id, actor) => {
  const kiosk = await Kiosk.findOne({ _id: id, isDeleted: false });
  if (!kiosk) {
    throw new ApiError(404, 'Kiosk not found');
  }

  kiosk.isDeleted = true;
  kiosk.isActive = false;
  await kiosk.save();

  await recordAuditLog({
    actor: actor,
    action: 'DELETE',
    entity: 'Kiosk',
    entityId: kiosk._id,
    details: { name: kiosk.name, code: kiosk.code }
  });

  return { success: true, message: 'Kiosk device removed successfully' };
};

/**
 * 13.2-BE: Generate dynamic HMAC-signed rotating QR code token with SVG payload
 */
export const getCurrentKioskQr = async (kioskId) => {
  // Check global setting toggle (13.6)
  const qrSetting = await Setting.findOne({ key: 'qrAttendance' }).lean();
  if (qrSetting && qrSetting.value?.isEnabled === false) {
    throw new ApiError(400, 'Dynamic QR Code attendance is currently disabled by administrator.');
  }

  const kiosk = await Kiosk.findOne({ _id: kioskId, isDeleted: false }).select('+secretKey');
  if (!kiosk) {
    throw new ApiError(404, 'Kiosk not found');
  }
  if (!kiosk.isActive) {
    throw new ApiError(400, 'Kiosk is marked inactive and cannot generate QR codes.');
  }

  const ttl = qrSetting?.value?.rotationSeconds || 30;
  const nowSec = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(8).toString('hex');

  const payload = {
    kId: kiosk._id.toString(),
    kType: kiosk.type,
    ts: nowSec,
    ttl,
    nonce
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', kiosk.secretKey).update(payloadB64).digest('base64url');
  const token = `${payloadB64}.${signature}`;

  // Render vector SVG string
  const svg = await QRCode.toString(token, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  // Update kiosk heartbeat
  kiosk.lastHeartbeatAt = new Date();
  await kiosk.save();

  return {
    token,
    svg,
    kiosk: {
      _id: kiosk._id,
      name: kiosk.name,
      code: kiosk.code,
      type: kiosk.type,
      locationDescription: kiosk.locationDescription
    },
    expiresIn: ttl,
    issuedAt: nowSec
  };
};

/**
 * 13.5-BE: Reset User Hardware Device Binding
 */
export const resetDeviceBinding = async (userId, reason, actor) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new ApiError(404, 'User account not found');
  }

  const prevDeviceId = user.deviceId;
  user.deviceId = null;
  user.deviceBoundAt = null;
  user.deviceModel = null;
  await user.save();

  await recordAuditLog({
    actor: actor,
    action: 'RESET_DEVICE_BINDING',
    entity: 'User',
    entityId: user._id,
    details: {
      targetUserId: user._id,
      targetUserName: user.name,
      previousDeviceId: prevDeviceId,
      reason,
      resetBy: actor?._id
    }
  });

  return {
    success: true,
    message: `Hardware device binding for user ${user.name} has been reset successfully.`
  };
};
