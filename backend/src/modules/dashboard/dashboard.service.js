/**
 * @file dashboard.service.js
 * @description Centralized aggregation service for role-based dashboards & KPI widgets.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Rows 7.1, 7.2, 7.3, 7.4, 7.5)
 * - Layer: Service (Domain Logic & MongoDB Aggregations)
 * - Optimization: Runs strictly against indexed fields ({date, status}, {departmentId}, {managerId})
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import mongoose from 'mongoose';

import { Employee } from '../../models/employee.model.js';
import { Department } from '../../models/department.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { Leave } from '../../models/leave.model.js';
import { AttendanceCorrection } from '../../models/correction.model.js';
import { WFHRequest } from '../../models/wfh.model.js';
import { PayrollRun } from '../../models/payrollRun.model.js';
import { Payslip } from '../../models/payslip.model.js';
import { LeaveBalance } from '../../models/leaveBalance.model.js';
import { Announcement } from '../../models/announcement.model.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Karachi';

/**
 * Helper to get current date formatted in Asia/Karachi (YYYY-MM-DD)
 */
export const getTodayDateString = () => {
  return dayjs().tz(TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Helper to get date list for last N days
 */
export const getLastNDaysList = (n = 7) => {
  const dates = [];
  const today = dayjs().tz(TIMEZONE);
  for (let i = n - 1; i >= 0; i--) {
    dates.push(today.subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
};

/**
 * 7.5-BE: Attendance Trend Aggregation over last N days
 */
export const getAttendanceTrendData = async (days = 7, employeeIds = null) => {
  const dates = getLastNDaysList(days);
  const dateObjs = dates.map((d) => dayjs.utc(d).toDate());
  const startDate = dayjs.tz(dates[0], TIMEZONE).startOf('day').toDate();
  const endDate = dayjs.tz(dates[dates.length - 1], TIMEZONE).endOf('day').toDate();

  const matchQuery = {
    $or: [
      { date: { $in: dates } },
      { date: { $in: dateObjs } },
      { date: { $gte: startDate, $lte: endDate } }
    ]
  };

  if (employeeIds && employeeIds.length > 0) {
    matchQuery.employeeId = { $in: employeeIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  const rawStats = await Attendance.aggregate([
    { $match: matchQuery },
    {
      $project: {
        status: 1,
        dateStr: {
          $cond: {
            if: { $eq: [{ $type: '$date' }, 'date'] },
            then: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: TIMEZONE } },
            else: '$date'
          }
        }
      }
    },
    {
      $group: {
        _id: { date: '$dateStr', status: '$status' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Map into contiguous dates array with default 0s
  const trendMap = {};
  dates.forEach((d) => {
    trendMap[d] = { date: d, present: 0, late: 0, half_day: 0, on_leave: 0, absent: 0 };
  });

  rawStats.forEach((stat) => {
    const { date, status } = stat._id;
    if (trendMap[date] && trendMap[date][status] !== undefined) {
      trendMap[date][status] = stat.count;
    }
  });

  return dates.map((d) => trendMap[d]);
};

/**
 * 7.5-BE: Upcoming Birthdays within next N days
 */
export const getUpcomingBirthdays = async (daysWindow = 14, scopeFilter = {}) => {
  const employees = await Employee.find({
    isDeleted: false,
    status: { $in: ['Active', 'Probation'] },
    $or: [{ dob: { $ne: null } }, { dateOfBirth: { $ne: null } }],
    ...scopeFilter
  })
    .select('name employeeCode avatar dob dateOfBirth departmentId')
    .populate('departmentId', 'name')
    .lean();

  const today = dayjs().tz(TIMEZONE);
  const currentYear = today.year();

  const birthdays = [];

  employees.forEach((emp) => {
    const rawDob = emp.dob || emp.dateOfBirth;
    if (!rawDob) return;
    const dob = dayjs(rawDob).tz(TIMEZONE);
    let birthdayThisYear = dob.year(currentYear);

    // If birthday already passed this year, check next year
    if (birthdayThisYear.isBefore(today, 'day')) {
      birthdayThisYear = dob.year(currentYear + 1);
    }

    const diffDays = birthdayThisYear.diff(today, 'day');
    if (diffDays >= 0 && diffDays <= daysWindow) {
      birthdays.push({
        _id: emp._id,
        name: emp.name,
        employeeCode: emp.employeeCode,
        avatar: emp.avatar || null,
        department: emp.departmentId?.name || 'General',
        birthDate: birthdayThisYear.format('MMM DD'),
        daysRemaining: diffDays
      });
    }
  });

  return birthdays.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

/**
 * 7.5-BE: Pending Approvals Queue
 */
export const getPendingApprovalsQueue = async (scopeFilter = {}) => {
  const pendingLeaves = await Leave.find({ status: 'pending', ...scopeFilter })
    .populate('employeeId', 'name employeeCode avatar departmentId')
    .populate('leaveTypeId', 'name code')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const pendingCorrections = await AttendanceCorrection.find({ status: 'pending', ...scopeFilter })
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const pendingWFH = await WFHRequest.find({ status: 'pending', ...scopeFilter })
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    pendingLeavesCount: await Leave.countDocuments({ status: 'pending', ...scopeFilter }),
    pendingCorrectionsCount: await AttendanceCorrection.countDocuments({ status: 'pending', ...scopeFilter }),
    pendingWFHCount: await WFHRequest.countDocuments({ status: 'pending', ...scopeFilter }),
    leaves: pendingLeaves.map((l) => ({
      _id: l._id,
      type: 'leave',
      employeeName: l.employeeId?.name || 'Employee',
      employeeCode: l.employeeId?.employeeCode || '',
      avatar: l.employeeId?.avatar || null,
      leaveType: l.leaveTypeId?.name || 'Leave',
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.days ?? l.totalDays ?? 1,
      reason: l.reason,
      createdAt: l.createdAt
    })),
    corrections: pendingCorrections.map((c) => ({
      _id: c._id,
      type: 'correction',
      employeeName: c.employeeId?.name || `${c.employeeId?.firstName || ''} ${c.employeeId?.lastName || ''}`.trim() || 'Employee',
      employeeCode: c.employeeId?.employeeCode || '',
      avatar: c.employeeId?.avatar || null,
      department: c.employeeId?.departmentId?.name || 'General',
      designation: c.employeeId?.designationId?.title || 'Staff',
      date: c.date,
      requestedIn: c.requestedCheckIn,
      requestedOut: c.requestedCheckOut,
      reason: c.reason,
      createdAt: c.createdAt
    })),
    wfh: pendingWFH.map((w) => ({
      _id: w._id,
      type: 'wfh',
      employeeName: w.employeeId?.name || `${w.employeeId?.firstName || ''} ${w.employeeId?.lastName || ''}`.trim() || 'Employee',
      employeeCode: w.employeeId?.employeeCode || '',
      avatar: w.employeeId?.avatar || null,
      department: w.employeeId?.departmentId?.name || 'General',
      designation: w.employeeId?.designationId?.title || 'Staff',
      date: w.date,
      reason: w.reason,
      createdAt: w.createdAt
    }))
  };
};

/**
 * 7.5-BE: Department Cost Distribution
 */
export const getDepartmentCostDistribution = async () => {
  const latestRun = await PayrollRun.findOne({ status: { $in: ['approved', 'paid'] } })
    .sort({ year: -1, month: -1 })
    .lean();

  if (!latestRun) {
    return [];
  }

  const departmentCosts = await Payslip.aggregate([
    { $match: { $or: [{ payrollRunId: latestRun._id }, { runId: latestRun._id }] } },
    {
      $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'emp'
      }
    },
    { $unwind: '$emp' },
    {
      $lookup: {
        from: 'departments',
        localField: 'emp.departmentId',
        foreignField: '_id',
        as: 'dept'
      }
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$emp.departmentId',
        departmentName: { $first: { $ifNull: ['$dept.name', 'Unassigned'] } },
        totalGrossPaisa: { $sum: '$grossPay' },
        totalNetPaisa: { $sum: { $ifNull: ['$netPay', '$netPayable'] } },
        employeeCount: { $sum: 1 }
      }
    },
    { $sort: { totalGrossPaisa: -1 } }
  ]);

  return departmentCosts.map((d) => ({
    departmentId: d._id,
    departmentName: d.departmentName,
    totalGrossPaisa: d.totalGrossPaisa,
    totalNetPaisa: d.totalNetPaisa,
    grossPkr: Math.round(d.totalGrossPaisa / 100),
    employeeCount: d.employeeCount
  }));
};

/**
 * 7.1-BE: Super Admin Executive Dashboard
 */
export const getAdminDashboardData = async () => {
  const todayStr = getTodayDateString();
  const todayStart = dayjs().tz(TIMEZONE).startOf('day').toDate();
  const todayEnd = dayjs().tz(TIMEZONE).endOf('day').toDate();
  const todayUtc = dayjs.utc(todayStr).toDate();

  const [
    totalEmployees,
    activeEmployees,
    totalDepartments,
    todayAttendanceRaw,
    latestPayrollRun,
    pendingLeavesCount,
    attendanceTrend,
    departmentCosts
  ] = await Promise.all([
    Employee.countDocuments({ isDeleted: false }),
    Employee.countDocuments({ isDeleted: false, status: { $in: ['Active', 'active', 'Probation', 'probation'] } }),
    Department.countDocuments({ isDeleted: false }),
    Attendance.aggregate([
      {
        $match: {
          $or: [
            { date: todayStr },
            { date: todayUtc },
            { date: { $gte: todayStart, $lte: todayEnd } }
          ]
        }
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    PayrollRun.findOne({ status: { $in: ['approved', 'paid'] } })
      .sort({ year: -1, month: -1 })
      .lean(),
    Leave.countDocuments({ status: 'pending' }),
    getAttendanceTrendData(7),
    getDepartmentCostDistribution()
  ]);

  const todayStatus = {
    present: 0,
    late: 0,
    half_day: 0,
    on_leave: 0,
    absent: 0
  };

  todayAttendanceRaw.forEach((row) => {
    if (todayStatus[row._id] !== undefined) {
      todayStatus[row._id] = row.count;
    }
  });

  const totalPunched = todayStatus.present + todayStatus.late + todayStatus.half_day;
  const attendanceRate = activeEmployees > 0 ? Math.round((totalPunched / activeEmployees) * 100) : 0;

  return {
    kpis: {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      attendanceRate,
      todayPresent: todayStatus.present,
      todayLate: todayStatus.late,
      todayOnLeave: todayStatus.on_leave,
      todayAbsent: todayStatus.absent,
      pendingApprovals: pendingLeavesCount,
      latestPayrollMonth: latestPayrollRun?.year && latestPayrollRun?.month
        ? `${latestPayrollRun.year}-${String(latestPayrollRun.month).padStart(2, '0')}`
        : latestPayrollRun?.month || null,
      monthlyPayrollCostPaisa: (latestPayrollRun?.totalGrossPay ?? latestPayrollRun?.totalGross) || 0,
      monthlyPayrollCostPkr: Math.round(((latestPayrollRun?.totalGrossPay ?? latestPayrollRun?.totalGross) || 0) / 100)
    },
    todayBreakdown: todayStatus,
    attendanceTrend,
    departmentCosts
  };
};

/**
 * 7.2-BE: HR Manager Operational Dashboard
 */
export const getHrDashboardData = async () => {
  const todayStr = getTodayDateString();
  const todayStart = dayjs().tz(TIMEZONE).startOf('day').toDate();
  const todayEnd = dayjs().tz(TIMEZONE).endOf('day').toDate();
  const todayUtc = dayjs.utc(todayStr).toDate();

  const [
    activeEmployees,
    todayAttendanceRaw,
    pendingQueues,
    todayOnLeaveStaff,
    upcomingBirthdays,
    probationDueEmployees
  ] = await Promise.all([
    Employee.countDocuments({ isDeleted: false, status: { $in: ['Active', 'active', 'Probation', 'probation'] } }),
    Attendance.aggregate([
      {
        $match: {
          $or: [
            { date: todayStr },
            { date: todayUtc },
            { date: { $gte: todayStart, $lte: todayEnd } }
          ]
        }
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    getPendingApprovalsQueue(),
    Leave.find({
      status: 'approved',
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart }
    })
      .populate('employeeId', 'name employeeCode departmentId avatar')
      .populate('leaveTypeId', 'name')
      .lean(),
    getUpcomingBirthdays(14),
    Employee.find({
      isDeleted: false,
      status: { $in: ['Active', 'active', 'Probation', 'probation'] },
      probationEndDate: {
        $gte: todayStart,
        $lte: dayjs().tz(TIMEZONE).add(30, 'day').toDate()
      }
    })
      .select('name employeeCode probationEndDate departmentId')
      .populate('departmentId', 'name')
      .lean()
  ]);

  const todayStatus = {
    present: 0,
    late: 0,
    half_day: 0,
    on_leave: 0,
    absent: 0
  };

  todayAttendanceRaw.forEach((row) => {
    if (todayStatus[row._id] !== undefined) {
      todayStatus[row._id] = row.count;
    }
  });

  return {
    kpis: {
      activeEmployees,
      todayPresent: todayStatus.present,
      todayLate: todayStatus.late,
      todayOnLeave: todayStatus.on_leave,
      todayAbsent: todayStatus.absent,
      pendingLeavesCount: pendingQueues.pendingLeavesCount,
      pendingCorrectionsCount: pendingQueues.pendingCorrectionsCount,
      pendingWFHCount: pendingQueues.pendingWFHCount,
      probationReviewsCount: probationDueEmployees.length
    },
    todayBreakdown: todayStatus,
    pendingLeaves: pendingQueues.leaves,
    pendingCorrections: pendingQueues.corrections,
    pendingWFH: pendingQueues.wfh,
    todayOnLeaveRoster: todayOnLeaveStaff.map((l) => ({
      _id: l._id,
      employeeName: l.employeeId?.name || 'Staff',
      employeeCode: l.employeeId?.employeeCode || '',
      avatar: l.employeeId?.avatar || null,
      leaveType: l.leaveTypeId?.name || 'Leave',
      startDate: l.startDate,
      endDate: l.endDate
    })),
    upcomingBirthdays,
    probationReviews: probationDueEmployees.map((e) => ({
      _id: e._id,
      name: e.name,
      employeeCode: e.employeeCode,
      department: e.departmentId?.name || 'General',
      probationEndDate: e.probationEndDate
    }))
  };
};

/**
 * 7.3-BE: Department Manager Team Overview Dashboard (Salaries Strictly Redacted)
 */
export const getManagerDashboardData = async (user) => {
  const todayStr = getTodayDateString();
  const todayStart = dayjs.tz(todayStr, TIMEZONE).startOf('day').toDate();
  const todayEnd = dayjs.tz(todayStr, TIMEZONE).endOf('day').toDate();
  const todayUtc = dayjs.utc(todayStr).toDate();
  const currentMonth = dayjs().tz(TIMEZONE).format('YYYY-MM');
  const startOfMonth = dayjs.tz(`${currentMonth}-01`, TIMEZONE).startOf('month').toDate();
  const endOfMonth = dayjs.tz(`${currentMonth}-01`, TIMEZONE).endOf('month').toDate();

  // Find manager employee record
  let managerEmp = null;
  if (user?.employeeId) {
    managerEmp = await Employee.findById(user.employeeId).lean();
  }
  if (!managerEmp && user?._id) {
    managerEmp = await Employee.findOne({ userId: user._id }).lean();
  }

  // Find managed departments and team employees
  const managedDepts = managerEmp
    ? await Department.find({ headId: managerEmp._id, isDeleted: false }).select('_id')
    : [];
  const managedDeptIds = managedDepts.map((d) => d._id);

  const teamQuery = {
    isDeleted: false,
    status: { $in: ['Active', 'active', 'Probation', 'probation'] },
    $or: []
  };

  if (managerEmp) {
    teamQuery.$or.push({ managerId: managerEmp._id });
  }
  if (managedDeptIds.length > 0) {
    teamQuery.$or.push({ departmentId: { $in: managedDeptIds } });
  }

  // If no team found, return safe empty state
  if (teamQuery.$or.length === 0) {
    return {
      kpis: { teamCount: 0, todayPresent: 0, todayLate: 0, todayAbsent: 0, todayOnLeave: 0, pendingApprovals: 0, teamOvertimeHours: 0 },
      teamMembers: [],
      pendingApprovals: [],
      attendanceTrend: []
    };
  }

  const teamMembers = await Employee.find(teamQuery)
    .select('_id name employeeCode departmentId avatar designationId')
    .populate('designationId', 'title')
    .lean();

  const teamMemberIds = teamMembers.map((m) => m._id);

  const [todayAttendanceRaw, pendingLeaves, pendingCorrections, pendingWFH, overtimeData, attendanceTrend] = await Promise.all([
    Attendance.aggregate([
      {
        $match: {
          employeeId: { $in: teamMemberIds },
          $or: [
            { date: todayStr },
            { date: todayUtc },
            { date: { $gte: todayStart, $lte: todayEnd } }
          ]
        }
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Leave.find({ employeeId: { $in: teamMemberIds }, status: 'pending' })
      .populate('employeeId', 'name employeeCode avatar')
      .populate('leaveTypeId', 'name')
      .lean(),
    AttendanceCorrection.find({ employeeId: { $in: teamMemberIds }, status: 'pending' })
      .populate({
        path: 'employeeId',
        select: 'name firstName lastName employeeCode avatar departmentId designationId',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean(),
    WFHRequest.find({ employeeId: { $in: teamMemberIds }, status: 'pending' })
      .populate({
        path: 'employeeId',
        select: 'name firstName lastName employeeCode avatar departmentId designationId',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean(),
    Attendance.aggregate([
      {
        $match: {
          employeeId: { $in: teamMemberIds },
          overtimeApproved: true,
          $or: [
            { date: { $regex: `^${currentMonth}` } },
            { date: { $gte: startOfMonth, $lte: endOfMonth } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalOtMinutes: { $sum: '$overtimeMinutes' }
        }
      }
    ]),
    getAttendanceTrendData(7, teamMemberIds)
  ]);

  const todayStatus = {
    present: 0,
    late: 0,
    half_day: 0,
    on_leave: 0,
    absent: 0
  };

  todayAttendanceRaw.forEach((row) => {
    if (todayStatus[row._id] !== undefined) {
      todayStatus[row._id] = row.count;
    }
  });

  const totalOtMinutes = overtimeData[0]?.totalOtMinutes || 0;
  const teamOvertimeHours = Math.round((totalOtMinutes / 60) * 10) / 10;

  return {
    kpis: {
      teamCount: teamMembers.length,
      todayPresent: todayStatus.present,
      todayLate: todayStatus.late,
      todayAbsent: todayStatus.absent,
      todayOnLeave: todayStatus.on_leave,
      pendingApprovals: pendingLeaves.length + pendingCorrections.length + pendingWFH.length,
      teamOvertimeHours
    },
    todayBreakdown: todayStatus,
    pendingApprovals: pendingLeaves.map((l) => ({
      _id: l._id,
      employeeName: l.employeeId?.name || 'Team Member',
      employeeCode: l.employeeId?.employeeCode || '',
      avatar: l.employeeId?.avatar || null,
      leaveType: l.leaveTypeId?.name || 'Leave',
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.days ?? l.totalDays ?? 1,
      reason: l.reason
    })),
    pendingCorrections: pendingCorrections.map((c) => ({
      _id: c._id,
      type: 'correction',
      employeeName: c.employeeId?.name || `${c.employeeId?.firstName || ''} ${c.employeeId?.lastName || ''}`.trim() || 'Employee',
      employeeCode: c.employeeId?.employeeCode || '',
      avatar: c.employeeId?.avatar || null,
      department: c.employeeId?.departmentId?.name || 'General',
      designation: c.employeeId?.designationId?.title || 'Staff',
      date: c.date,
      requestedIn: c.requestedCheckIn,
      requestedOut: c.requestedCheckOut,
      reason: c.reason,
      createdAt: c.createdAt
    })),
    pendingWFH: pendingWFH.map((w) => ({
      _id: w._id,
      type: 'wfh',
      employeeName: w.employeeId?.name || `${w.employeeId?.firstName || ''} ${w.employeeId?.lastName || ''}`.trim() || 'Employee',
      employeeCode: w.employeeId?.employeeCode || '',
      avatar: w.employeeId?.avatar || null,
      department: w.employeeId?.departmentId?.name || 'General',
      designation: w.employeeId?.designationId?.title || 'Staff',
      date: w.date,
      reason: w.reason,
      createdAt: w.createdAt
    })),
    teamMembers: teamMembers.map((m) => ({
      _id: m._id,
      name: m.name,
      employeeCode: m.employeeCode,
      designation: m.designationId?.title || 'Team Member',
      avatar: m.avatar || null
    })),
    attendanceTrend
  };
};

/**
 * 7.4-BE: Employee Personal Self-Service Dashboard
 */
export const getEmployeeDashboardData = async (user) => {
  const todayStr = getTodayDateString();
  const todayStart = dayjs.tz(todayStr, TIMEZONE).startOf('day').toDate();
  const todayEnd = dayjs.tz(todayStr, TIMEZONE).endOf('day').toDate();
  const todayUtc = dayjs.utc(todayStr).toDate();
  const currentYear = dayjs().tz(TIMEZONE).year();

  let employee = null;
  if (user?.employeeId) {
    employee = await Employee.findById(user.employeeId).populate('designationId', 'title').populate('departmentId', 'name').lean();
  }
  if (!employee && user?._id) {
    employee = await Employee.findOne({ userId: user._id }).populate('designationId', 'title').populate('departmentId', 'name').lean();
  }

  if (!employee) {
    return {
      employee: null,
      todayAttendance: null,
      leaveBalances: [],
      latestPayslip: null,
      announcements: []
    };
  }

  const [todayAttendance, leaveBalanceDoc, latestPayslip, announcements] = await Promise.all([
    Attendance.findOne({
      employeeId: employee._id,
      $or: [
        { date: todayStr },
        { date: todayUtc },
        { date: { $gte: todayStart, $lte: todayEnd } }
      ]
    }).lean(),
    LeaveBalance.findOne({ employeeId: employee._id, year: currentYear })
      .populate('balances.leaveTypeId', 'name code isPaid')
      .lean(),
    Payslip.findOne({
      employeeId: employee._id,
      status: { $in: ['approved', 'paid'] }
    })
      .sort({ year: -1, month: -1 })
      .select('month year netPay netPayable grossPay totalGrossPay status')
      .lean(),
    Announcement.find({ pinned: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()
  ]);

  const formattedBalances = (leaveBalanceDoc?.balances || []).map((b) => {
    const allocated = (b.allocatedDays || 0) + (b.carriedForwardDays || 0);
    const used = (b.usedDays || 0) + (b.pendingDays || 0);
    const available = Math.max(0, allocated - used);
    return {
      _id: b.leaveTypeId?._id || b.leaveTypeId || String(Math.random()),
      leaveType: b.leaveTypeId?.name || 'Leave',
      code: b.leaveTypeId?.code || 'LV',
      allocated,
      used,
      available
    };
  });

  return {
    employee: {
      _id: employee._id,
      name: employee.name,
      employeeCode: employee.employeeCode,
      department: employee.departmentId?.name || 'Department',
      designation: employee.designationId?.title || 'Employee',
      avatar: employee.avatar || null
    },
    todayAttendance: todayAttendance
      ? {
          status: todayAttendance.status,
          checkInTime: todayAttendance.checkIn?.time || null,
          checkOutTime: todayAttendance.checkOut?.time || null,
          workDurationMinutes: todayAttendance.workDurationMinutes || 0,
          onBreak: todayAttendance.breaks?.some((b) => !b.endTime) || false
        }
      : {
          status: 'not_marked',
          checkInTime: null,
          checkOutTime: null,
          workDurationMinutes: 0,
          onBreak: false
        },
    leaveBalances: formattedBalances,
    latestPayslip: latestPayslip
      ? {
          _id: latestPayslip._id,
          month: latestPayslip.year && latestPayslip.month
            ? `${latestPayslip.year}-${String(latestPayslip.month).padStart(2, '0')}`
            : latestPayslip.month,
          netPayablePaisa: (latestPayslip.netPay ?? latestPayslip.netPayable) || 0,
          netPayablePkr: Math.round(((latestPayslip.netPay ?? latestPayslip.netPayable) || 0) / 100),
          status: latestPayslip.status
        }
      : null,
    announcements: announcements.map((a) => ({
      _id: a._id,
      title: a.title,
      body: a.body,
      createdAt: a.createdAt
    }))
  };
};
