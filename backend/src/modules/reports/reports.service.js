/**
 * @file reports.service.js
 * @description Aggregation engine for Multi-Axis Organizational Reports.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Rows 7.6, 7.7, 7.8)
 * - Layer: Service (Domain Logic & MongoDB Aggregations)
 * - Scope: Enforces strict data scope (all vs team); blocks financial reports for managers
 */

import dayjs from 'dayjs';
import { ApiError } from '../../utils/ApiError.js';
import { Employee } from '../../models/employee.model.js';
import { Department } from '../../models/department.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { Leave } from '../../models/leave.model.js';
import { LeaveBalance } from '../../models/leaveBalance.model.js';
import { PayrollRun } from '../../models/payrollRun.model.js';
import { Payslip } from '../../models/payslip.model.js';

/**
 * Helper to resolve team employee IDs for a Department Manager
 */
export const resolveTeamMemberIds = async (user) => {
  let managerEmp = null;
  if (user?.employeeId) {
    managerEmp = await Employee.findById(user.employeeId).lean();
  }
  if (!managerEmp && user?._id) {
    managerEmp = await Employee.findOne({ userId: user._id }).lean();
  }

  const managedDepts = managerEmp
    ? await Department.find({ headId: managerEmp._id, isDeleted: false }).select('_id')
    : [];
  const deptIds = managedDepts.map((d) => d._id);

  const teamQuery = {
    isDeleted: false,
    $or: []
  };

  if (managerEmp) teamQuery.$or.push({ managerId: managerEmp._id });
  if (deptIds.length > 0) teamQuery.$or.push({ departmentId: { $in: deptIds } });

  if (teamQuery.$or.length === 0) return [];

  const team = await Employee.find(teamQuery).select('_id').lean();
  return team.map((t) => t._id);
};

/**
 * 7.6-BE: Generate Multi-Axis Report Data
 */
export const generateReportData = async ({
  type,
  from,
  to,
  departmentId,
  employeeId,
  status,
  view = 'daily',
  page = 1,
  limit = 25,
  user,
  userScope = 'all'
}) => {
  // 1. Strict Security Barrier: Prohibit managers from accessing financial/turnover reports
  const financialReports = ['payroll', 'turnover', 'department-cost'];
  if (financialReports.includes(type) && userScope !== 'all') {
    throw new ApiError(
      403,
      'Access Denied: Managers are strictly prohibited from accessing company financial and turnover reports.'
    );
  }

  // 2. Resolve team scoping for Department Managers
  let teamMemberIds = null;
  if (userScope === 'team') {
    teamMemberIds = await resolveTeamMemberIds(user);
    if (teamMemberIds.length === 0) {
      return { columns: [], items: [], total: 0, page, limit, summary: {} };
    }
  }

  // 3. Dispatch by Report Type
  let result;
  switch (type) {
    case 'attendance':
      result = await generateAttendanceReport({ from, to, departmentId, employeeId, status, view, page, limit, teamMemberIds });
      break;

    case 'leave':
      result = await generateLeaveReport({ from, to, departmentId, employeeId, status, view, page, limit, teamMemberIds });
      break;

    case 'payroll':
      result = await generatePayrollReport({ from, to, departmentId, page, limit });
      break;

    case 'headcount':
      result = await generateHeadcountReport({ from, to, departmentId, status, page, limit });
      break;

    case 'turnover':
      result = await generateTurnoverReport({ from, to, departmentId, page, limit });
      break;

    case 'department-cost':
      result = await generateDepartmentCostReport({ from, to });
      break;

    case 'expenses': {
      const { getExpenseMonthlyReport } = await import('../expenses/expense.service.js');
      const monthStr = from ? from.slice(0, 7) : undefined;
      const report = await getExpenseMonthlyReport({ month: monthStr }, user);
      const items = (report.breakdown || []).map((b) => ({
        category: b._id,
        categoryCode: b.categoryCode,
        totalClaims: b.totalClaims,
        totalPkr: Math.round(b.totalAmountPaisa / 100).toLocaleString('en-PK'),
        approvedPkr: Math.round(b.approvedAmountPaisa / 100).toLocaleString('en-PK'),
        reimbursedPkr: Math.round(b.reimbursedAmountPaisa / 100).toLocaleString('en-PK'),
        pendingPkr: Math.round(b.pendingAmountPaisa / 100).toLocaleString('en-PK')
      }));
      result = {
        columns: [
          { header: 'Category', key: 'category' },
          { header: 'Code', key: 'categoryCode' },
          { header: 'Total Claims', key: 'totalClaims' },
          { header: 'Total Amount (PKR)', key: 'totalPkr' },
          { header: 'Approved (PKR)', key: 'approvedPkr' },
          { header: 'Reimbursed (PKR)', key: 'reimbursedPkr' },
          { header: 'Pending (PKR)', key: 'pendingPkr' }
        ],
        items,
        total: items.length,
        page: 1,
        limit: Math.max(items.length, 1),
        summary: {
          grandTotals: report.grandTotals,
          totalClaims: report.grandTotals.totalClaims,
          totalAmountPkr: Math.round(report.grandTotals.totalAmountPaisa / 100).toLocaleString('en-PK'),
          reimbursedPkr: Math.round(report.grandTotals.reimbursedAmountPaisa / 100).toLocaleString('en-PK')
        }
      };
      break;
    }

    default:
      throw new ApiError(400, `Unsupported report type: ${type}`);
  }

  const items = result.items || [];
  return {
    reportType: type,
    ...result,
    items,
    records: items,
    summary: result.summary || {
      totalRecords: result.total ?? items.length,
      totalApplications: result.total ?? items.length
    },
    chartData: result.chartData || {}
  };
};

/**
 * Attendance Report
 */
async function generateAttendanceReport({ from, to, departmentId, employeeId, status, view = 'daily', page, limit, teamMemberIds }) {
  const query = {};

  if (from && to) {
    const fromDate = dayjs(from).startOf('day').toDate();
    const toDate = dayjs(to).endOf('day').toDate();
    query.$or = [
      { date: { $gte: from, $lte: to } },
      { date: { $gte: fromDate, $lte: toDate } }
    ];
  } else if (from) {
    const fromDate = dayjs(from).startOf('day').toDate();
    query.$or = [
      { date: { $gte: from } },
      { date: { $gte: fromDate } }
    ];
  } else if (to) {
    const toDate = dayjs(to).endOf('day').toDate();
    query.$or = [
      { date: { $lte: to } },
      { date: { $lte: toDate } }
    ];
  }

  if (status) query.status = status;

  if (teamMemberIds) {
    const allowedTeamSet = new Set(teamMemberIds.map((id) => id.toString()));
    if (departmentId) {
      const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).select('_id');
      const deptEmpIds = deptEmployees
        .map((e) => e._id)
        .filter((id) => allowedTeamSet.has(id.toString()));
      if (employeeId) {
        query.employeeId = deptEmpIds.some((id) => id.toString() === employeeId.toString())
          ? employeeId
          : { $in: [] };
      } else {
        query.employeeId = { $in: deptEmpIds };
      }
    } else if (employeeId) {
      query.employeeId = allowedTeamSet.has(employeeId.toString()) ? employeeId : { $in: [] };
    } else {
      query.employeeId = { $in: teamMemberIds };
    }
  } else {
    if (departmentId) {
      const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).select('_id');
      const deptEmpIds = deptEmployees.map((e) => e._id);
      if (employeeId) {
        query.employeeId = deptEmpIds.some((id) => id.toString() === employeeId.toString())
          ? employeeId
          : { $in: [] };
      } else {
        query.employeeId = { $in: deptEmpIds };
      }
    } else if (employeeId) {
      query.employeeId = employeeId;
    }
  }

  // 1. Compute Overall KPI Summary Across All Matching Records
  const allMatched = await Attendance.find(query)
    .select('status workDurationMinutes overtimeMinutes overtimeApproved checkIn date')
    .lean();

  const totalWorkedMinutes = allMatched.reduce((acc, a) => acc + (a.workDurationMinutes || 0), 0);
  const totalOtMinutes = allMatched.reduce((acc, a) => acc + (a.overtimeMinutes || 0), 0);
  const presentCount = allMatched.filter((a) => a.status === 'present').length;
  const lateCount = allMatched.filter((a) => a.status === 'late').length;
  const halfDayCount = allMatched.filter((a) => a.status === 'half_day').length;
  const absentCount = allMatched.filter((a) => a.status === 'absent').length;
  const totalPunches = allMatched.length;
  const rate = totalPunches > 0 ? Math.round(((presentCount + lateCount + halfDayCount * 0.5) / totalPunches) * 1000) / 10 : 0;

  const summary = {
    totalRecords: totalPunches,
    totalWorkHours: Math.round((totalWorkedMinutes / 60) * 10) / 10,
    totalOvertimeHours: Math.round((totalOtMinutes / 60) * 10) / 10,
    totalLates: lateCount,
    totalHalfDays: halfDayCount,
    totalAbsents: absentCount,
    attendanceRate: rate
  };

  // Visual analytics chart data
  const statusDistribution = [
    { status: 'Present', count: presentCount, pct: totalPunches > 0 ? Math.round((presentCount / totalPunches) * 100) : 0, color: '#00C471' },
    { status: 'Late', count: lateCount, pct: totalPunches > 0 ? Math.round((lateCount / totalPunches) * 100) : 0, color: '#F59E0B' },
    { status: 'Half-Day', count: halfDayCount, pct: totalPunches > 0 ? Math.round((halfDayCount / totalPunches) * 100) : 0, color: '#3B82F6' },
    { status: 'Absent', count: absentCount, pct: totalPunches > 0 ? Math.round((absentCount / totalPunches) * 100) : 0, color: '#EF4444' }
  ];

  const dailyMap = {};
  for (const a of allMatched) {
    if (!a.date) continue;
    const dStr = dayjs(a.date).format('YYYY-MM-DD');
    if (!dailyMap[dStr]) {
      dailyMap[dStr] = { date: dStr, label: dayjs(a.date).format('DD MMM'), present: 0, late: 0, halfDay: 0, absent: 0, total: 0 };
    }
    dailyMap[dStr].total += 1;
    if (a.status === 'present') dailyMap[dStr].present += 1;
    else if (a.status === 'late') dailyMap[dStr].late += 1;
    else if (a.status === 'half_day') dailyMap[dStr].halfDay += 1;
    else if (a.status === 'absent') dailyMap[dStr].absent += 1;
  }
  const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-31);

  const chartData = {
    statusDistribution,
    dailyTrend
  };

  // 2. View Mode: Employee-wise Aggregated Rollup with Drill-Down
  if (view === 'employee') {
    const allRecords = await Attendance.find(query)
      .populate({
        path: 'employeeId',
        select: 'name employeeCode avatar departmentId designationId',
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' }
        ]
      })
      .sort({ date: -1 })
      .lean();

    // Group by Employee ID
    const empGroups = {};
    for (const r of allRecords) {
      const eId = r.employeeId?._id?.toString() || 'unknown';
      if (!empGroups[eId]) {
        empGroups[eId] = {
          _id: eId,
          employeeId: r.employeeId?._id,
          employeeCode: r.employeeId?.employeeCode || 'N/A',
          name: r.employeeId?.name || 'Staff',
          avatar: r.employeeId?.avatar || null,
          department: r.employeeId?.departmentId?.name || 'General',
          designation: r.employeeId?.designationId?.title || 'Team Member',
          presentDays: 0,
          lateDays: 0,
          halfDays: 0,
          absentDays: 0,
          totalWorkMinutes: 0,
          totalOtMinutes: 0,
          approvedOtMinutes: 0,
          totalDays: 0,
          punches: []
        };
      }

      const g = empGroups[eId];
      g.totalDays += 1;
      if (r.status === 'present') g.presentDays += 1;
      else if (r.status === 'late') g.lateDays += 1;
      else if (r.status === 'half_day') g.halfDays += 1;
      else if (r.status === 'absent') g.absentDays += 1;

      g.totalWorkMinutes += (r.workDurationMinutes || 0);
      g.totalOtMinutes += (r.overtimeMinutes || 0);
      if (r.overtimeApproved) g.approvedOtMinutes += (r.overtimeMinutes || 0);

      let lateMins = 0;
      if (r.status === 'late' && r.checkIn) {
        const d = dayjs(r.checkIn);
        const shiftStart = d.startOf('day').add(9, 'hour');
        lateMins = Math.max(0, d.diff(shiftStart, 'minute'));
      }

      g.punches.push({
        _id: r._id,
        date: r.date ? dayjs(r.date).format('DD MMM YYYY') : '-',
        rawDate: r.date,
        status: r.status,
        checkIn: r.checkIn ? dayjs(r.checkIn).format('hh:mm A') : '-',
        checkOut: r.checkOut ? dayjs(r.checkOut).format('hh:mm A') : '-',
        workHours: Math.round(((r.workDurationMinutes || 0) / 60) * 10) / 10,
        lateMinutes: lateMins,
        overtimeHours: Math.round(((r.overtimeMinutes || 0) / 60) * 10) / 10,
        overtimeApproved: !!r.overtimeApproved
      });
    }

    const employeeRows = Object.values(empGroups).map((g) => {
      const attRate = g.totalDays > 0
        ? Math.round(((g.presentDays + g.lateDays + g.halfDays * 0.5) / g.totalDays) * 1000) / 10
        : 0;

      return {
        _id: g._id,
        employeeCode: g.employeeCode,
        name: g.name,
        avatar: g.avatar,
        department: g.department,
        designation: g.designation,
        presentDays: g.presentDays,
        lateDays: g.lateDays,
        halfDays: g.halfDays,
        absentDays: g.absentDays,
        totalWorkHours: Math.round((g.totalWorkMinutes / 60) * 10) / 10,
        totalOvertimeHours: Math.round((g.totalOtMinutes / 60) * 10) / 10,
        approvedOvertimeHours: Math.round((g.approvedOtMinutes / 60) * 10) / 10,
        attendanceRate: `${attRate}%`,
        punches: g.punches
      };
    });

    const columns = [
      { header: 'Employee', key: 'name' },
      { header: 'Department', key: 'department' },
      { header: 'Present Days', key: 'presentDays' },
      { header: 'Late Days', key: 'lateDays' },
      { header: 'Half Days', key: 'halfDays' },
      { header: 'Absent Days', key: 'absentDays' },
      { header: 'Worked Hours', key: 'totalWorkHours' },
      { header: 'Overtime (hrs)', key: 'totalOvertimeHours' },
      { header: 'Attendance Rate', key: 'attendanceRate' }
    ];

    const totalEmps = employeeRows.length;
    const paginatedItems = employeeRows.slice((page - 1) * limit, page * limit);

    return {
      columns,
      items: paginatedItems,
      total: totalEmps,
      page,
      limit,
      summary,
      chartData,
      title: 'Employee Attendance Rollup & Analytics'
    };
  }

  // 3. View Mode: Daily Transactional Log
  const total = await Attendance.countDocuments(query);
  const records = await Attendance.find(query)
    .populate({
      path: 'employeeId',
      select: 'name employeeCode avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const columns = [
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Name', key: 'name' },
    { header: 'Department', key: 'department' },
    { header: 'Date', key: 'date' },
    { header: 'Status', key: 'status' },
    { header: 'Check In', key: 'checkIn' },
    { header: 'Check Out', key: 'checkOut' },
    { header: 'Work Hours', key: 'workHours' },
    { header: 'Late (Mins)', key: 'lateMinutes' },
    { header: 'Overtime', key: 'overtimeMinutes' }
  ];

  const items = records.map((r) => {
    let lateMins = 0;
    if (r.status === 'late' && r.checkIn) {
      const d = dayjs(r.checkIn);
      const shiftStart = d.startOf('day').add(9, 'hour');
      lateMins = Math.max(0, d.diff(shiftStart, 'minute'));
    }

    return {
      _id: r._id,
      employeeId: r.employeeId?._id,
      employeeCode: r.employeeId?.employeeCode || 'N/A',
      name: r.employeeId?.name || 'Staff',
      avatar: r.employeeId?.avatar || null,
      department: r.employeeId?.departmentId?.name || 'General',
      designation: r.employeeId?.designationId?.title || 'Staff',
      date: r.date ? dayjs(r.date).format('DD MMM YYYY') : '-',
      rawDate: r.date,
      status: r.status?.toUpperCase() || 'PRESENT',
      checkIn: r.checkIn ? dayjs(r.checkIn).format('hh:mm A') : '-',
      checkOut: r.checkOut ? dayjs(r.checkOut).format('hh:mm A') : '-',
      workHours: Math.round(((r.workDurationMinutes || 0) / 60) * 10) / 10,
      lateMinutes: lateMins,
      overtimeMinutes: r.overtimeMinutes || 0,
      overtimeApproved: !!r.overtimeApproved
    };
  });

  return { columns, items, total, page, limit, summary, chartData, title: 'Attendance Summary Report' };
}

/**
 * Leave Utilization Report
 */
async function generateLeaveReport({ from, to, departmentId, employeeId, status, view = 'daily', page, limit, teamMemberIds }) {
  const query = {};

  if (from && to) {
    query.startDate = { $gte: new Date(from), $lte: new Date(to) };
  }
  if (status) query.status = status;

  if (teamMemberIds) {
    const allowedTeamSet = new Set(teamMemberIds.map((id) => id.toString()));
    if (departmentId) {
      const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).select('_id');
      const deptEmpIds = deptEmployees
        .map((e) => e._id)
        .filter((id) => allowedTeamSet.has(id.toString()));
      if (employeeId) {
        query.employeeId = deptEmpIds.some((id) => id.toString() === employeeId.toString())
          ? employeeId
          : { $in: [] };
      } else {
        query.employeeId = { $in: deptEmpIds };
      }
    } else if (employeeId) {
      query.employeeId = allowedTeamSet.has(employeeId.toString()) ? employeeId : { $in: [] };
    } else {
      query.employeeId = { $in: teamMemberIds };
    }
  } else {
    if (departmentId) {
      const deptEmployees = await Employee.find({ departmentId, isDeleted: false }).select('_id');
      const deptEmpIds = deptEmployees.map((e) => e._id);
      if (employeeId) {
        query.employeeId = deptEmpIds.some((id) => id.toString() === employeeId.toString())
          ? employeeId
          : { $in: [] };
      } else {
        query.employeeId = { $in: deptEmpIds };
      }
    } else if (employeeId) {
      query.employeeId = employeeId;
    }
  }

  // 1. KPI Summary
  const allLeaves = await Leave.find(query).populate('leaveTypeId', 'name code isPaid').lean();
  let totalApprovedDays = 0;
  let paidDays = 0;
  let unpaidDays = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  for (const l of allLeaves) {
    const d = l.days ?? l.totalDays ?? 1;
    if (l.status === 'approved') {
      approvedCount += 1;
      totalApprovedDays += d;
      if (l.leaveTypeId?.isPaid !== false && l.leaveTypeId?.code !== 'UNPAID') {
        paidDays += d;
      } else {
        unpaidDays += d;
      }
    } else if (l.status === 'pending') {
      pendingCount += 1;
    } else if (l.status === 'rejected') {
      rejectedCount += 1;
    }
  }

  const summary = {
    totalApplications: allLeaves.length,
    totalLeaveDays: totalApprovedDays,
    paidLeaveDays: paidDays,
    unpaidLeaveDays: unpaidDays,
    pendingApplications: pendingCount,
    approvedApplications: approvedCount,
    rejectedApplications: rejectedCount
  };

  const leaveStatusDist = [
    { status: 'Approved', count: approvedCount, pct: allLeaves.length > 0 ? Math.round((approvedCount / allLeaves.length) * 100) : 0, color: '#00C471' },
    { status: 'Pending', count: pendingCount, pct: allLeaves.length > 0 ? Math.round((pendingCount / allLeaves.length) * 100) : 0, color: '#F59E0B' },
    { status: 'Rejected', count: rejectedCount, pct: allLeaves.length > 0 ? Math.round((rejectedCount / allLeaves.length) * 100) : 0, color: '#EF4444' }
  ];

  const typeMap = {};
  for (const l of allLeaves) {
    if (l.status !== 'approved') continue;
    const tName = l.leaveTypeId?.name || 'Other Leave';
    const tCode = (l.leaveTypeId?.code || 'OTHER').toUpperCase();
    const d = l.days ?? l.totalDays ?? 1;
    if (!typeMap[tCode]) {
      typeMap[tCode] = { name: tName, code: tCode, days: 0 };
    }
    typeMap[tCode].days += d;
  }
  const typeColors = ['#00C471', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];
  const typeBreakdown = Object.values(typeMap).map((t, idx) => ({
    ...t,
    pct: totalApprovedDays > 0 ? Math.round((t.days / totalApprovedDays) * 100) : 0,
    color: typeColors[idx % typeColors.length]
  }));

  const chartData = {
    statusDistribution: leaveStatusDist,
    typeBreakdown
  };

  // 2. View Mode: Employee-wise Aggregated Rollup with Drill-Down
  if (view === 'employee') {
    const empGroups = {};
    for (const l of allLeaves) {
      const eId = l.employeeId?.toString() || 'unknown';
      if (!empGroups[eId]) {
        empGroups[eId] = {
          _id: eId,
          employeeId: l.employeeId,
          casualDays: 0,
          annualDays: 0,
          sickDays: 0,
          unpaidDays: 0,
          totalApprovedDays: 0,
          pendingRequests: 0,
          applications: []
        };
      }

      const g = empGroups[eId];
      const d = l.days ?? l.totalDays ?? 1;
      const code = (l.leaveTypeId?.code || '').toUpperCase();

      if (l.status === 'approved') {
        g.totalApprovedDays += d;
        if (code === 'CASUAL') g.casualDays += d;
        else if (code === 'ANNUAL') g.annualDays += d;
        else if (code === 'SICK') g.sickDays += d;
        else if (code === 'UNPAID') g.unpaidDays += d;
      } else if (l.status === 'pending') {
        g.pendingRequests += 1;
      }

      g.applications.push({
        _id: l._id,
        leaveType: l.leaveTypeId?.name || 'Leave',
        code: l.leaveTypeId?.code || 'LEAVE',
        startDate: l.startDate ? dayjs(l.startDate).format('DD MMM YYYY') : '-',
        endDate: l.endDate ? dayjs(l.endDate).format('DD MMM YYYY') : '-',
        totalDays: d,
        status: l.status ? l.status.toUpperCase() : 'PENDING',
        reason: l.reason || '-'
      });
    }

    // Populate employee details for the groups
    const empIds = Object.keys(empGroups);
    const emps = await Employee.find({ _id: { $in: empIds } })
      .populate('departmentId', 'name')
      .populate('designationId', 'title')
      .lean();

    const empInfoMap = {};
    for (const e of emps) {
      empInfoMap[e._id.toString()] = e;
    }

    const employeeRows = Object.values(empGroups).map((g) => {
      const emp = empInfoMap[g._id] || {};
      return {
        _id: g._id,
        employeeCode: emp.employeeCode || 'N/A',
        name: emp.name || 'Staff',
        avatar: emp.avatar || null,
        department: emp.departmentId?.name || 'General',
        designation: emp.designationId?.title || 'Staff',
        casualDays: g.casualDays,
        annualDays: g.annualDays,
        sickDays: g.sickDays,
        unpaidDays: g.unpaidDays,
        totalApprovedDays: g.totalApprovedDays,
        pendingRequests: g.pendingRequests,
        applications: g.applications
      };
    });

    const columns = [
      { header: 'Employee', key: 'name' },
      { header: 'Department', key: 'department' },
      { header: 'Casual Used', key: 'casualDays' },
      { header: 'Annual Used', key: 'annualDays' },
      { header: 'Sick Used', key: 'sickDays' },
      { header: 'Unpaid (LWP)', key: 'unpaidDays' },
      { header: 'Total Approved', key: 'totalApprovedDays' },
      { header: 'Pending Requests', key: 'pendingRequests' }
    ];

    const totalEmps = employeeRows.length;
    const paginatedItems = employeeRows.slice((page - 1) * limit, page * limit);

    return {
      columns,
      items: paginatedItems,
      total: totalEmps,
      page,
      limit,
      summary,
      chartData,
      title: 'Employee Leave Ledger & Utilization'
    };
  }

  // 3. View Mode: Daily Transactional Log
  const total = await Leave.countDocuments(query);
  const records = await Leave.find(query)
    .populate({
      path: 'employeeId',
      select: 'name employeeCode avatar departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate('leaveTypeId', 'name code')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const columns = [
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Name', key: 'name' },
    { header: 'Department', key: 'department' },
    { header: 'Leave Type', key: 'leaveType' },
    { header: 'Start Date', key: 'startDate' },
    { header: 'End Date', key: 'endDate' },
    { header: 'Days', key: 'totalDays' },
    { header: 'Status', key: 'status' },
    { header: 'Reason', key: 'reason' }
  ];

  const items = records.map((l) => ({
    _id: l._id,
    employeeId: l.employeeId?._id,
    employeeCode: l.employeeId?.employeeCode || 'N/A',
    name: l.employeeId?.name || 'Staff',
    avatar: l.employeeId?.avatar || null,
    department: l.employeeId?.departmentId?.name || 'General',
    designation: l.employeeId?.designationId?.title || 'Staff',
    leaveType: l.leaveTypeId?.name || 'Leave',
    startDate: l.startDate ? dayjs(l.startDate).format('DD MMM YYYY') : '-',
    endDate: l.endDate ? dayjs(l.endDate).format('DD MMM YYYY') : '-',
    totalDays: l.days ?? l.totalDays ?? 1,
    status: l.status?.toUpperCase() || 'PENDING',
    reason: l.reason || '-'
  }));

  return { columns, items, total, page, limit, summary, chartData, title: 'Leave Utilization Report' };
}

/**
 * Payroll Summary Report
 */
async function generatePayrollReport({ from, to, page, limit }) {
  const query = { status: { $in: ['approved', 'paid'] } };

  if (from && to) {
    const fromMonth = from.slice(0, 7);
    const toMonth = to.slice(0, 7);
    const fromDate = dayjs(from).startOf('day').toDate();
    const toDate = dayjs(to).endOf('day').toDate();
    query.$or = [
      { month: { $gte: fromMonth, $lte: toMonth } },
      { cycleStartDate: { $gte: fromDate, $lte: toDate } }
    ];
  } else if (from) {
    const fromMonth = from.slice(0, 7);
    const fromDate = dayjs(from).startOf('day').toDate();
    query.$or = [
      { month: { $gte: fromMonth } },
      { cycleStartDate: { $gte: fromDate } }
    ];
  } else if (to) {
    const toMonth = to.slice(0, 7);
    const toDate = dayjs(to).endOf('day').toDate();
    query.$or = [
      { month: { $lte: toMonth } },
      { cycleStartDate: { $lte: toDate } }
    ];
  }

  const allRuns = await PayrollRun.find(query).sort({ year: 1, month: 1 }).lean();
  let totalGrossPaisa = 0;
  let totalNetPaisa = 0;
  let totalTaxPaisa = 0;
  let totalDeductionsPaisa = 0;
  let totalEmployeesPaid = 0;

  for (const r of allRuns) {
    totalGrossPaisa += (r.totalGrossPay ?? r.totalGross) || 0;
    totalNetPaisa += (r.totalNetPay ?? r.totalNetPayable) || 0;
    totalTaxPaisa += r.totalTaxWithheld || 0;
    totalDeductionsPaisa += r.totalDeductions || 0;
    totalEmployeesPaid += r.totalEmployees || 0;
  }

  const summary = {
    totalGrossPkr: Math.round(totalGrossPaisa / 100).toLocaleString('en-PK'),
    totalNetPkr: Math.round(totalNetPaisa / 100).toLocaleString('en-PK'),
    totalTaxPkr: Math.round(totalTaxPaisa / 100).toLocaleString('en-PK'),
    totalDeductionsPkr: Math.round(totalDeductionsPaisa / 100).toLocaleString('en-PK'),
    totalRuns: allRuns.length,
    totalEmployees: totalEmployeesPaid
  };

  const monthlyTrend = allRuns.map((r) => {
    const monthStr = r.year && r.month ? `${r.year}-${String(r.month).padStart(2, '0')}` : r.month || '-';
    return {
      runId: r._id,
      month: monthStr,
      grossPkr: Math.round(((r.totalGrossPay ?? r.totalGross) || 0) / 100),
      netPkr: Math.round(((r.totalNetPay ?? r.totalNetPayable) || 0) / 100),
      taxPkr: Math.round((r.totalTaxWithheld || 0) / 100),
      deductionsPkr: Math.round((r.totalDeductions || 0) / 100)
    };
  });

  const chartData = {
    monthlyTrend
  };

  const total = await PayrollRun.countDocuments(query);
  const runs = await PayrollRun.find(query)
    .sort({ year: -1, month: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const columns = [
    { header: 'Payroll Month', key: 'month' },
    { header: 'Status', key: 'status' },
    { header: 'Headcount', key: 'totalEmployees' },
    { header: 'Gross Pay (PKR)', key: 'grossPkr' },
    { header: 'FBR Tax (PKR)', key: 'taxPkr' },
    { header: 'Deductions (PKR)', key: 'deductionsPkr' },
    { header: 'Net Payable (PKR)', key: 'netPkr' }
  ];

  const items = runs.map((r) => {
    const monthStr = r.year && r.month ? `${r.year}-${String(r.month).padStart(2, '0')}` : r.month || '-';
    return {
      _id: r._id,
      month: monthStr,
      status: r.status?.toUpperCase(),
      totalEmployees: r.totalEmployees || 0,
      grossPkr: Math.round(((r.totalGrossPay ?? r.totalGross) || 0) / 100).toLocaleString('en-PK'),
      taxPkr: Math.round((r.totalTaxWithheld || 0) / 100).toLocaleString('en-PK'),
      deductionsPkr: Math.round((r.totalDeductions || 0) / 100).toLocaleString('en-PK'),
      netPkr: Math.round(((r.totalNetPay ?? r.totalNetPayable) || 0) / 100).toLocaleString('en-PK')
    };
  });

  return { columns, items, total, page, limit, summary, chartData, title: 'Payroll Summary Report' };
}

/**
 * Headcount & Demographics Report
 */
async function generateHeadcountReport({ from, to, departmentId, status, page, limit }) {
  const query = { isDeleted: false };
  if (departmentId) query.departmentId = departmentId;
  if (status) query.status = status;

  const totalHeadcount = await Employee.countDocuments({ ...query, status: 'Active' });

  // Period-aware calculations
  const hireQuery = { isDeleted: false };
  if (departmentId) hireQuery.departmentId = departmentId;
  if (from && to) {
    hireQuery.joiningDate = { $gte: new Date(from), $lte: new Date(to) };
  } else if (from) {
    hireQuery.joiningDate = { $gte: new Date(from) };
  } else if (to) {
    hireQuery.joiningDate = { $lte: new Date(to) };
  }
  const newHiresCount = await Employee.countDocuments(hireQuery);

  const exitQuery = {
    isDeleted: false,
    status: { $in: ['Resigned', 'Terminated'] }
  };
  if (departmentId) exitQuery.departmentId = departmentId;
  if (from && to) {
    exitQuery.updatedAt = { $gte: new Date(from), $lte: new Date(to) };
  }
  const periodExitsCount = await Employee.countDocuments(exitQuery);

  const today = new Date();
  const onLeaveCount = await Leave.countDocuments({
    status: 'approved',
    startDate: { $lte: today },
    endDate: { $gte: today }
  });

  const summary = {
    totalHeadcount,
    newHires: newHiresCount,
    periodExits: periodExitsCount,
    onLeave: onLeaveCount
  };

  // Department-wise breakdown
  const allEmps = await Employee.find({ isDeleted: false, status: 'Active' })
    .populate('departmentId', 'name')
    .select('departmentId employmentType')
    .lean();

  const deptMap = {};
  const empTypeMap = { Permanent: 0, Contract: 0, Probation: 0, Intern: 0 };
  for (const e of allEmps) {
    const dName = e.departmentId?.name || 'Unassigned';
    deptMap[dName] = (deptMap[dName] || 0) + 1;
    const eType = e.employmentType || 'Permanent';
    empTypeMap[eType] = (empTypeMap[eType] || 0) + 1;
  }

  const departmentBreakdown = Object.entries(deptMap)
    .map(([departmentName, count]) => ({
      departmentName,
      count,
      pct: allEmps.length > 0 ? Math.round((count / allEmps.length) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const employmentTypeBreakdown = Object.entries(empTypeMap).map(([type, count]) => ({
    type,
    count,
    pct: allEmps.length > 0 ? Math.round((count / allEmps.length) * 100) : 0
  }));

  const chartData = {
    departmentBreakdown,
    employmentTypeBreakdown
  };

  const total = await Employee.countDocuments(query);
  const records = await Employee.find(query)
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .sort({ employeeCode: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const columns = [
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Name', key: 'name' },
    { header: 'Department', key: 'department' },
    { header: 'Designation', key: 'designation' },
    { header: 'Gender', key: 'gender' },
    { header: 'Status', key: 'status' },
    { header: 'Employment Type', key: 'employmentType' },
    { header: 'Joining Date', key: 'joiningDate' }
  ];

  const items = records.map((e) => ({
    _id: e._id,
    employeeCode: e.employeeCode,
    name: e.name,
    avatar: e.avatar || null,
    department: e.departmentId?.name || 'Unassigned',
    designation: e.designationId?.title || 'Staff',
    gender: e.gender || 'Not Specified',
    status: e.status,
    employmentType: e.employmentType || 'Permanent',
    joiningDate: e.joiningDate ? dayjs(e.joiningDate).format('YYYY-MM-DD') : '-'
  }));

  return { columns, items, total, page, limit, summary, chartData, title: 'Headcount & Demographics Report' };
}

/**
 * Turnover & Attrition Report
 */
async function generateTurnoverReport({ from, to, departmentId, page, limit }) {
  const query = {
    isDeleted: false,
    status: { $in: ['Resigned', 'Terminated'] }
  };
  if (departmentId) query.departmentId = departmentId;
  if (from && to) {
    query.updatedAt = { $gte: new Date(from), $lte: new Date(to) };
  } else if (from) {
    query.updatedAt = { $gte: new Date(from) };
  } else if (to) {
    query.updatedAt = { $lte: new Date(to) };
  }

  const allExits = await Employee.find(query).lean();
  const voluntaryResignations = allExits.filter((e) => e.status === 'Resigned').length;
  const involuntaryTerminations = allExits.filter((e) => e.status === 'Terminated').length;
  const totalExits = allExits.length;

  const currentHeadcount = await Employee.countDocuments({ isDeleted: false, status: 'Active' });
  const startHeadcount = currentHeadcount + totalExits;
  const avgHeadcount = (startHeadcount + currentHeadcount) / 2 || 1;
  const turnoverRate = Math.round((totalExits / avgHeadcount) * 1000) / 10;

  let totalTenureMonths = 0;
  for (const e of allExits) {
    if (e.joiningDate && e.updatedAt) {
      const months = Math.max(0, dayjs(e.updatedAt).diff(dayjs(e.joiningDate), 'month'));
      totalTenureMonths += months;
    }
  }
  const averageTenureMonths = totalExits > 0 ? Math.round((totalTenureMonths / totalExits) * 10) / 10 : 0;

  const summary = {
    totalExits,
    voluntaryResignations,
    involuntaryTerminations,
    turnoverRate: `${turnoverRate}%`,
    averageTenureMonths
  };

  const exitTypeDistribution = [
    { type: 'Voluntary Resignation', count: voluntaryResignations, pct: totalExits > 0 ? Math.round((voluntaryResignations / totalExits) * 100) : 0, color: '#F59E0B' },
    { type: 'Involuntary Termination', count: involuntaryTerminations, pct: totalExits > 0 ? Math.round((involuntaryTerminations / totalExits) * 100) : 0, color: '#EF4444' }
  ];

  const monthExitsMap = {};
  for (const e of allExits) {
    const mStr = dayjs(e.updatedAt).format('YYYY-MM');
    monthExitsMap[mStr] = (monthExitsMap[mStr] || 0) + 1;
  }
  const monthlyExitTrend = Object.entries(monthExitsMap)
    .map(([month, exits]) => ({ month, exits }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const chartData = {
    exitTypeDistribution,
    monthlyExitTrend
  };

  const total = await Employee.countDocuments(query);
  const records = await Employee.find(query)
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const columns = [
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Name', key: 'name' },
    { header: 'Department', key: 'department' },
    { header: 'Designation', key: 'designation' },
    { header: 'Separation Status', key: 'status' },
    { header: 'Reason / Notes', key: 'statusReason' },
    { header: 'Joined Date', key: 'joiningDate' },
    { header: 'Exit Recorded', key: 'exitDate' }
  ];

  const items = records.map((e) => ({
    _id: e._id,
    employeeCode: e.employeeCode,
    name: e.name,
    avatar: e.avatar || null,
    department: e.departmentId?.name || 'Unassigned',
    designation: e.designationId?.title || 'Staff',
    status: e.status,
    statusReason: e.statusReason || 'Separation completed',
    joiningDate: e.joiningDate ? dayjs(e.joiningDate).format('YYYY-MM-DD') : '-',
    exitDate: dayjs(e.updatedAt).format('YYYY-MM-DD')
  }));

  return { columns, items, total, page, limit, summary, chartData, title: 'Workforce Turnover & Attrition Report' };
}

/**
 * Departmental Cost Analytics Report
 */
async function generateDepartmentCostReport({ from, to }) {
  const runQuery = { status: { $in: ['approved', 'paid'] } };
  if (from && to) {
    const fromMonth = from.slice(0, 7);
    const toMonth = to.slice(0, 7);
    const fromDate = dayjs(from).startOf('day').toDate();
    const toDate = dayjs(to).endOf('day').toDate();
    runQuery.$or = [
      { month: { $gte: fromMonth, $lte: toMonth } },
      { cycleStartDate: { $gte: fromDate, $lte: toDate } }
    ];
  }

  let matchingRuns = await PayrollRun.find(runQuery).select('_id year month').lean();
  if (matchingRuns.length === 0) {
    const latest = await PayrollRun.findOne({ status: { $in: ['approved', 'paid'] } })
      .sort({ year: -1, month: -1 })
      .lean();
    if (latest) matchingRuns = [latest];
  }

  if (matchingRuns.length === 0) {
    return { columns: [], items: [], total: 0, page: 1, limit: 10, summary: {}, chartData: {}, title: 'Department Cost Report' };
  }

  const runIds = matchingRuns.map((r) => r._id);

  const departmentCosts = await Payslip.aggregate([
    { $match: { $or: [{ payrollRunId: { $in: runIds } }, { runId: { $in: runIds } }] } },
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
        totalTaxPaisa: { $sum: '$taxWithheld' },
        totalNetPaisa: { $sum: { $ifNull: ['$netPay', '$netPayable'] } },
        headcount: { $sum: 1 }
      }
    },
    { $sort: { totalGrossPaisa: -1 } }
  ]);

  let grandTotalGrossPaisa = 0;
  let grandTotalTaxPaisa = 0;
  let totalStaff = 0;
  for (const d of departmentCosts) {
    grandTotalGrossPaisa += d.totalGrossPaisa;
    grandTotalTaxPaisa += d.totalTaxPaisa;
    totalStaff += d.headcount;
  }
  const topDept = departmentCosts[0];

  const summary = {
    totalCostPkr: Math.round(grandTotalGrossPaisa / 100).toLocaleString('en-PK'),
    avgCostPerEmployeePkr: totalStaff > 0 ? Math.round((grandTotalGrossPaisa / totalStaff) / 100).toLocaleString('en-PK') : '0',
    topDepartmentName: topDept?.departmentName || 'N/A',
    topDepartmentCostPkr: topDept ? Math.round(topDept.totalGrossPaisa / 100).toLocaleString('en-PK') : '0',
    totalTaxComponentPkr: Math.round(grandTotalTaxPaisa / 100).toLocaleString('en-PK')
  };

  const departmentCostComparison = departmentCosts.map((d) => ({
    departmentName: d.departmentName,
    headcount: d.headcount,
    grossPkr: Math.round(d.totalGrossPaisa / 100),
    taxPkr: Math.round(d.totalTaxPaisa / 100),
    netPkr: Math.round(d.totalNetPaisa / 100),
    avgCostPerEmpPkr: d.headcount > 0 ? Math.round((d.totalGrossPaisa / d.headcount) / 100) : 0
  }));

  const chartData = {
    departmentCostComparison
  };

  const columns = [
    { header: 'Department', key: 'departmentName' },
    { header: 'Headcount', key: 'headcount' },
    { header: 'Gross Pay (PKR)', key: 'grossPkr' },
    { header: 'Tax Withheld (PKR)', key: 'taxPkr' },
    { header: 'Net Payout (PKR)', key: 'netPkr' }
  ];

  const items = departmentCosts.map((d) => ({
    _id: d._id,
    departmentName: d.departmentName,
    headcount: d.headcount,
    grossPkr: Math.round(d.totalGrossPaisa / 100).toLocaleString('en-PK'),
    taxPkr: Math.round(d.totalTaxPaisa / 100).toLocaleString('en-PK'),
    netPkr: Math.round(d.totalNetPaisa / 100).toLocaleString('en-PK')
  }));

  return {
    columns,
    items,
    total: items.length,
    page: 1,
    limit: items.length,
    summary,
    chartData,
    title: 'Department Cost Analytics Report'
  };
}

/**
 * Deep Inspection Details for Modals & Dossier Sheets
 */
export const getReportInspectionDetails = async ({
  type,
  employeeId,
  departmentId,
  runId,
  from,
  to,
  user,
  userScope = 'all'
}) => {
  // Prohibit managers from inspecting financial reports
  const financialReports = ['payroll', 'department-cost'];
  if (financialReports.includes(type) && userScope !== 'all') {
    throw new ApiError(
      403,
      'Access Denied: You do not have permission to inspect financial and cost reports.'
    );
  }

  // If team-scoped, check that employeeId belongs to the manager's team
  if (userScope === 'team' && employeeId) {
    const teamMemberIds = await resolveTeamMemberIds(user);
    const isTeamMember = teamMemberIds.some((id) => id.toString() === employeeId.toString());
    if (!isTeamMember) {
      throw new ApiError(403, 'Access Denied: Employee is not part of your managed team.');
    }
  }

  switch (type) {
    case 'attendance': {
      if (!employeeId) throw new ApiError(400, 'Employee ID is required for attendance inspection.');
      const emp = await Employee.findById(employeeId)
        .populate('departmentId', 'name')
        .populate('designationId', 'title')
        .lean();
      if (!emp) throw new ApiError(404, 'Employee not found.');

      const query = { employeeId };
      if (from && to) {
        query.date = { $gte: from, $lte: to };
      }

      const punches = await Attendance.find(query).sort({ date: -1 }).lean();

      const totalDays = punches.length;
      const presentDays = punches.filter((p) => p.status === 'present').length;
      const lateDays = punches.filter((p) => p.status === 'late').length;
      const halfDays = punches.filter((p) => p.status === 'half_day').length;
      const absentDays = punches.filter((p) => p.status === 'absent').length;
      const totalWorkMins = punches.reduce((acc, p) => acc + (p.workDurationMinutes || 0), 0);
      const totalOtMins = punches.reduce((acc, p) => acc + (p.overtimeMinutes || 0), 0);
      const punctualityRate = totalDays > 0 ? Math.round(((presentDays + halfDays * 0.5) / totalDays) * 100) : 0;

      return {
        type: 'attendance',
        employee: {
          _id: emp._id,
          name: emp.name,
          employeeCode: emp.employeeCode,
          avatar: emp.avatar,
          department: emp.departmentId?.name || 'Unassigned',
          designation: emp.designationId?.title || 'Staff',
          joiningDate: emp.joiningDate ? dayjs(emp.joiningDate).format('YYYY-MM-DD') : '-'
        },
        summary: {
          totalDays,
          presentDays,
          lateDays,
          halfDays,
          absentDays,
          totalWorkHours: Math.round((totalWorkMins / 60) * 10) / 10,
          totalOvertimeHours: Math.round((totalOtMins / 60) * 10) / 10,
          punctualityRate: `${punctualityRate}%`
        },
        punches: punches.map((p) => ({
          _id: p._id,
          date: dayjs(p.date).format('DD MMM YYYY'),
          rawDate: p.date,
          status: p.status?.toUpperCase() || 'PRESENT',
          checkIn: p.checkIn ? dayjs(p.checkIn).format('hh:mm A') : '-',
          checkOut: p.checkOut ? dayjs(p.checkOut).format('hh:mm A') : '-',
          workHours: Math.round(((p.workDurationMinutes || 0) / 60) * 10) / 10,
          lateMinutes: p.lateMinutes || 0,
          overtimeHours: Math.round(((p.overtimeMinutes || 0) / 60) * 10) / 10,
          overtimeApproved: !!p.overtimeApproved
        }))
      };
    }

    case 'leave': {
      if (!employeeId) throw new ApiError(400, 'Employee ID is required for leave inspection.');
      const emp = await Employee.findById(employeeId)
        .populate('departmentId', 'name')
        .populate('designationId', 'title')
        .lean();
      if (!emp) throw new ApiError(404, 'Employee not found.');

      const currentYear = new Date().getFullYear();
      const balances = await LeaveBalance.findOne({ employeeId, year: currentYear })
        .populate('balances.leaveTypeId', 'name code isPaid')
        .lean();

      const leaves = await Leave.find({ employeeId })
        .populate('leaveTypeId', 'name code')
        .sort({ createdAt: -1 })
        .lean();

      const totalApprovedDays = leaves
        .filter((l) => l.status === 'approved')
        .reduce((sum, l) => sum + (l.days ?? l.totalDays ?? 1), 0);

      const pendingRequests = leaves.filter((l) => l.status === 'pending').length;

      return {
        type: 'leave',
        employee: {
          _id: emp._id,
          name: emp.name,
          employeeCode: emp.employeeCode,
          avatar: emp.avatar,
          department: emp.departmentId?.name || 'Unassigned',
          designation: emp.designationId?.title || 'Staff'
        },
        balances: balances?.balances || [],
        summary: {
          totalApprovedDays,
          pendingRequests,
          totalApplications: leaves.length
        },
        applications: leaves.map((l) => ({
          _id: l._id,
          leaveType: l.leaveTypeId?.name || 'Leave',
          code: l.leaveTypeId?.code || 'LEAVE',
          startDate: l.startDate ? dayjs(l.startDate).format('DD MMM YYYY') : '-',
          endDate: l.endDate ? dayjs(l.endDate).format('DD MMM YYYY') : '-',
          totalDays: l.days ?? l.totalDays ?? 1,
          status: l.status?.toUpperCase() || 'PENDING',
          reason: l.reason || '-',
          createdAt: dayjs(l.createdAt).format('DD MMM YYYY')
        }))
      };
    }

    case 'payroll': {
      if (!runId && !employeeId) {
        throw new ApiError(400, 'Either runId or employeeId is required for payroll inspection.');
      }

      if (runId) {
        const run = await PayrollRun.findById(runId).lean();
        if (!run) throw new ApiError(404, 'Payroll run not found.');

        const payslips = await Payslip.find({
          $or: [{ payrollRunId: runId }, { runId: runId }]
        })
          .populate({
            path: 'employeeId',
            select: 'name employeeCode departmentId designationId avatar',
            populate: [
              { path: 'departmentId', select: 'name' },
              { path: 'designationId', select: 'title' }
            ]
          })
          .sort({ grossPay: -1 })
          .lean();

        return {
          type: 'payroll',
          run: {
            _id: run._id,
            month: run.month,
            year: run.year,
            status: run.status?.toUpperCase(),
            totalEmployees: run.totalEmployees || payslips.length,
            grossPkr: Math.round(((run.totalGrossPay ?? run.totalGross) || 0) / 100).toLocaleString('en-PK'),
            netPkr: Math.round(((run.totalNetPay ?? run.totalNetPayable) || 0) / 100).toLocaleString('en-PK'),
            taxPkr: Math.round((run.totalTaxWithheld || 0) / 100).toLocaleString('en-PK'),
            deductionsPkr: Math.round((run.totalDeductions || 0) / 100).toLocaleString('en-PK')
          },
          payslips: payslips.map((ps) => ({
            _id: ps._id,
            employeeCode: ps.employeeId?.employeeCode || 'N/A',
            name: ps.employeeId?.name || 'Staff',
            avatar: ps.employeeId?.avatar || null,
            department: ps.employeeId?.departmentId?.name || 'General',
            designation: ps.employeeId?.designationId?.title || 'Staff',
            grossPkr: Math.round((ps.grossPay || 0) / 100).toLocaleString('en-PK'),
            netPkr: Math.round(((ps.netPay ?? ps.netPayable) || 0) / 100).toLocaleString('en-PK'),
            taxPkr: Math.round((ps.taxWithheld || 0) / 100).toLocaleString('en-PK'),
            deductionsPkr: Math.round((ps.totalDeductions || 0) / 100).toLocaleString('en-PK'),
            status: ps.status?.toUpperCase() || 'PAID'
          }))
        };
      }

      // employeeId payslip history
      const emp = await Employee.findById(employeeId).populate('departmentId', 'name').lean();
      const payslips = await Payslip.find({ employeeId }).sort({ createdAt: -1 }).limit(12).lean();
      return {
        type: 'payroll',
        employee: emp,
        payslips: payslips.map((ps) => ({
          _id: ps._id,
          month: ps.month || dayjs(ps.createdAt).format('YYYY-MM'),
          grossPkr: Math.round((ps.grossPay || 0) / 100).toLocaleString('en-PK'),
          netPkr: Math.round(((ps.netPay ?? ps.netPayable) || 0) / 100).toLocaleString('en-PK'),
          taxPkr: Math.round((ps.taxWithheld || 0) / 100).toLocaleString('en-PK'),
          status: ps.status?.toUpperCase() || 'PAID'
        }))
      };
    }

    case 'department-cost': {
      if (!departmentId) throw new ApiError(400, 'Department ID is required for cost inspection.');
      const dept = await Department.findById(departmentId).lean();
      if (!dept) throw new ApiError(404, 'Department not found.');

      const staff = await Employee.find({ departmentId, isDeleted: false })
        .populate('designationId', 'title')
        .sort({ name: 1 })
        .lean();

      // Find payslips for these employees from latest approved run
      const staffIds = staff.map((s) => s._id);
      const latestRun = await PayrollRun.findOne({ status: { $in: ['approved', 'paid'] } })
        .sort({ year: -1, month: -1 })
        .lean();

      let staffPayslips = [];
      if (latestRun) {
        staffPayslips = await Payslip.find({
          employeeId: { $in: staffIds },
          $or: [{ payrollRunId: latestRun._id }, { runId: latestRun._id }]
        }).lean();
      }

      const psMap = {};
      for (const ps of staffPayslips) {
        psMap[ps.employeeId.toString()] = ps;
      }

      let deptGrossPaisa = 0;
      let deptTaxPaisa = 0;
      let deptNetPaisa = 0;

      const roster = staff.map((s) => {
        const ps = psMap[s._id.toString()];
        const gross = ps?.grossPay || (s.salary ? s.salary * 100 : 0);
        const tax = ps?.taxWithheld || 0;
        const net = ps?.netPay || ps?.netPayable || gross - tax;

        deptGrossPaisa += gross;
        deptTaxPaisa += tax;
        deptNetPaisa += net;

        return {
          _id: s._id,
          employeeCode: s.employeeCode,
          name: s.name,
          avatar: s.avatar || null,
          designation: s.designationId?.title || 'Staff',
          grossPkr: Math.round(gross / 100).toLocaleString('en-PK'),
          taxPkr: Math.round(tax / 100).toLocaleString('en-PK'),
          netPkr: Math.round(net / 100).toLocaleString('en-PK')
        };
      });

      return {
        type: 'department-cost',
        department: {
          _id: dept._id,
          name: dept.name,
          code: dept.code
        },
        summary: {
          headcount: staff.length,
          totalCostPkr: Math.round(deptGrossPaisa / 100).toLocaleString('en-PK'),
          totalTaxPkr: Math.round(deptTaxPaisa / 100).toLocaleString('en-PK'),
          totalNetPkr: Math.round(deptNetPaisa / 100).toLocaleString('en-PK'),
          avgCostPerEmpPkr: staff.length > 0 ? Math.round((deptGrossPaisa / staff.length) / 100).toLocaleString('en-PK') : '0'
        },
        roster
      };
    }

    default:
      throw new ApiError(400, `Unsupported inspection type: ${type}`);
  }
};
