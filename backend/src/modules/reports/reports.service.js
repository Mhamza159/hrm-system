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
import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { Employee } from '../../models/employee.model.js';
import { Department } from '../../models/department.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { Leave } from '../../models/leave.model.js';
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
      result = await generateHeadcountReport({ departmentId, status, page, limit });
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
      const report = await getExpenseMonthlyReport({ month: monthStr });
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
    }
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
    .select('status workDurationMinutes overtimeMinutes overtimeApproved checkIn')
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
    totalAbsents: absentCount,
    attendanceRate: rate
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

  return { columns, items, total, page, limit, summary, title: 'Attendance Summary Report' };
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

  for (const l of allLeaves) {
    const d = l.days ?? l.totalDays ?? 1;
    if (l.status === 'approved') {
      totalApprovedDays += d;
      if (l.leaveTypeId?.isPaid !== false && l.leaveTypeId?.code !== 'UNPAID') {
        paidDays += d;
      } else {
        unpaidDays += d;
      }
    } else if (l.status === 'pending') {
      pendingCount += 1;
    }
  }

  const summary = {
    totalApplications: allLeaves.length,
    totalLeaveDays: totalApprovedDays,
    paidLeaveDays: paidDays,
    unpaidLeaveDays: unpaidDays,
    pendingApplications: pendingCount
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

  return { columns, items, total, page, limit, summary, title: 'Leave Utilization Report' };
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
      grossPkr: Math.round(((r.totalGrossPay ?? r.totalGross) || 0) / 100).toLocaleString(),
      taxPkr: Math.round((r.totalTaxWithheld || 0) / 100).toLocaleString(),
      deductionsPkr: Math.round((r.totalDeductions || 0) / 100).toLocaleString(),
      netPkr: Math.round(((r.totalNetPay ?? r.totalNetPayable) || 0) / 100).toLocaleString()
    };
  });

  return { columns, items, total, page, limit, title: 'Payroll Summary Report' };
}

/**
 * Headcount & Demographics Report
 */
async function generateHeadcountReport({ departmentId, status, page, limit }) {
  const query = { isDeleted: false };
  if (departmentId) query.departmentId = departmentId;
  if (status) query.status = status;

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
    department: e.departmentId?.name || 'Unassigned',
    designation: e.designationId?.title || 'Staff',
    gender: e.gender || 'Not Specified',
    status: e.status,
    employmentType: e.employmentType || 'Permanent',
    joiningDate: e.joiningDate ? dayjs(e.joiningDate).format('YYYY-MM-DD') : '-'
  }));

  return { columns, items, total, page, limit, title: 'Headcount & Demographics Report' };
}

/**
 * Turnover & Attrition Report
 */
async function generateTurnoverReport({ from, to, page, limit }) {
  const query = {
    isDeleted: false,
    status: { $in: ['Resigned', 'Terminated'] }
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
    department: e.departmentId?.name || 'Unassigned',
    designation: e.designationId?.title || 'Staff',
    status: e.status,
    statusReason: e.statusReason || 'Separation completed',
    joiningDate: e.joiningDate ? dayjs(e.joiningDate).format('YYYY-MM-DD') : '-',
    exitDate: dayjs(e.updatedAt).format('YYYY-MM-DD')
  }));

  return { columns, items, total, page, limit, title: 'Workforce Turnover & Attrition Report' };
}

/**
 * Departmental Cost Analytics Report
 */
async function generateDepartmentCostReport() {
  const latestRun = await PayrollRun.findOne({ status: { $in: ['approved', 'paid'] } })
    .sort({ year: -1, month: -1 })
    .lean();

  if (!latestRun) {
    return { columns: [], items: [], total: 0, page: 1, limit: 10, title: 'Department Cost Report' };
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
        totalTaxPaisa: { $sum: '$taxWithheld' },
        totalNetPaisa: { $sum: { $ifNull: ['$netPay', '$netPayable'] } },
        headcount: { $sum: 1 }
      }
    },
    { $sort: { totalGrossPaisa: -1 } }
  ]);

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
    grossPkr: Math.round(d.totalGrossPaisa / 100).toLocaleString(),
    taxPkr: Math.round(d.totalTaxPaisa / 100).toLocaleString(),
    netPkr: Math.round(d.totalNetPaisa / 100).toLocaleString()
  }));

  const monthLabel = latestRun.year && latestRun.month
    ? `${latestRun.year}-${String(latestRun.month).padStart(2, '0')}`
    : latestRun.month || 'Current';

  return {
    columns,
    items,
    total: items.length,
    page: 1,
    limit: items.length,
    title: `Department Cost Report (${monthLabel})`
  };
}
