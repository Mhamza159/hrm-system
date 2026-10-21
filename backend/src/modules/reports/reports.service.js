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
      result = await generateAttendanceReport({ from, to, departmentId, employeeId, status, page, limit, teamMemberIds });
      break;

    case 'leave':
      result = await generateLeaveReport({ from, to, departmentId, employeeId, status, page, limit, teamMemberIds });
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
async function generateAttendanceReport({ from, to, departmentId, employeeId, status, page, limit, teamMemberIds }) {
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

  const total = await Attendance.countDocuments(query);
  const records = await Attendance.find(query)
    .populate({
      path: 'employeeId',
      select: 'name employeeCode departmentId',
      populate: { path: 'departmentId', select: 'name' }
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
    { header: 'Overtime (Mins)', key: 'overtimeMinutes' }
  ];

  const items = records.map((r) => ({
    _id: r._id,
    employeeCode: r.employeeId?.employeeCode || 'N/A',
    name: r.employeeId?.name || 'Staff',
    department: r.employeeId?.departmentId?.name || 'General',
    date: r.date,
    status: r.status?.toUpperCase() || 'PRESENT',
    checkIn: r.checkIn?.time ? dayjs(r.checkIn.time).format('hh:mm A') : '-',
    checkOut: r.checkOut?.time ? dayjs(r.checkOut.time).format('hh:mm A') : '-',
    workHours: Math.round(((r.workDurationMinutes || 0) / 60) * 10) / 10,
    lateMinutes: r.lateMinutes || 0,
    overtimeMinutes: r.overtimeMinutes || 0
  }));

  return { columns, items, total, page, limit, title: 'Attendance Summary Report' };
}

/**
 * Leave Utilization Report
 */
async function generateLeaveReport({ from, to, departmentId, employeeId, status, page, limit, teamMemberIds }) {
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

  const total = await Leave.countDocuments(query);
  const records = await Leave.find(query)
    .populate({
      path: 'employeeId',
      select: 'name employeeCode departmentId',
      populate: { path: 'departmentId', select: 'name' }
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
    employeeCode: l.employeeId?.employeeCode || 'N/A',
    name: l.employeeId?.name || 'Staff',
    department: l.employeeId?.departmentId?.name || 'General',
    leaveType: l.leaveTypeId?.name || 'Leave',
    startDate: l.startDate ? dayjs(l.startDate).format('YYYY-MM-DD') : '-',
    endDate: l.endDate ? dayjs(l.endDate).format('YYYY-MM-DD') : '-',
    totalDays: l.days ?? l.totalDays ?? 1,
    status: l.status?.toUpperCase() || 'PENDING',
    reason: l.reason || '-'
  }));

  return { columns, items, total, page, limit, title: 'Leave Utilization Report' };
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
