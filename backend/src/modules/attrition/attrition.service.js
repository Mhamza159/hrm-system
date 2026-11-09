/**
 * @file attrition.service.js
 * @description Core Predictive Scoring Engine & Management Service for Employee Attrition.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Rows 17.1 to 17.5)
 * - Layer: Business Logic Service
 * - Confidentiality Invariant: Regular Employees are strictly blocked with 403 Forbidden.
 *   Department Managers only see employees belonging to their assigned department.
 */

import { AttritionScore } from '../../models/attritionScore.model.js';
import { Employee } from '../../models/employee.model.js';
import { Department } from '../../models/department.model.js';
import { Attendance } from '../../models/attendance.model.js';
import { SalaryStructure } from '../../models/salaryStructure.model.js';
import Review from '../../models/review.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Escape regex metacharacters to immunize against ReDoS attacks
 */
function escapeRegex(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper to resolve department scoping for the acting user
 */
async function resolveUserScope(user) {
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => r.name || r)
    : [user?.role?.name || user?.role].filter(Boolean);

  // Super Admin & HR Manager have full company-wide visibility
  if (userRoles.includes('Super Admin') || userRoles.includes('HR Manager')) {
    return { scope: 'all' };
  }

  // Department Manager is strictly scoped to their assigned department
  if (userRoles.includes('Department Manager')) {
    let deptId = user.departmentId;
    if (!deptId && user.employeeId) {
      const emp = await Employee.findById(user.employeeId).lean();
      deptId = emp?.departmentId;
    }
    if (!deptId) {
      const managedDept = await Department.findOne({ managerId: user._id }).lean();
      deptId = managedDept?._id;
    }
    if (!deptId) {
      const linkedEmp = await Employee.findOne({ userId: user._id }).lean();
      deptId = linkedEmp?.departmentId;
    }

    if (!deptId) {
      throw new ApiError(403, 'Access denied: No department assigned to manager.');
    }
    return { scope: 'team', departmentId: deptId };
  }

  // Regular Employee or any unassigned role has ZERO access to attrition prediction
  throw new ApiError(403, 'Access denied: Attrition prediction data is strictly confidential.');
}

/**
 * 17.1: Calculate single employee flight risk score (0 - 100)
 */
export async function calculateEmployeeRisk(employeeId) {
  const employee = await Employee.findById(employeeId).lean();
  if (!employee || !['Active', 'Probation'].includes(employee.status)) {
    return null;
  }

  let totalScore = 0;
  const breakdown = {
    attendance: 0,
    salaryStagnation: 0,
    appraisal: 0,
    tenure: 0,
    engagement: 0
  };
  const topFactors = [];

  // --- 1. Attendance & Tardiness Signals (Weight: 30%) ---
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const attendanceRecords = await Attendance.find({
    employeeId: employee._id,
    date: { $gte: ninetyDaysAgo }
  }).lean();

  const absences = attendanceRecords.filter((a) => a.status?.toLowerCase() === 'absent').length;
  const latePunches = attendanceRecords.filter((a) => a.isLate === true || a.status?.toLowerCase() === 'late').length;

  let attendancePts = 0;
  if (absences > 3) {
    attendancePts += 15;
    topFactors.push(`Unplanned Absences: ${absences} days in last 90 days (+15)`);
  }
  if (latePunches > 5) {
    attendancePts += 15;
    topFactors.push(`Frequent Late Arrivals: ${latePunches} times in last 90 days (+15)`);
  }
  breakdown.attendance = attendancePts;
  totalScore += attendancePts;

  // --- 2. Compensation Stagnation Signal (Weight: 25%) ---
  const latestSalary = await SalaryStructure.findOne({ employeeId: employee._id })
    .sort({ effectiveFrom: -1 })
    .lean();

  const salaryDate = latestSalary?.effectiveFrom
    ? new Date(latestSalary.effectiveFrom)
    : employee.joiningDate
    ? new Date(employee.joiningDate)
    : new Date();

  const monthsWithoutIncrement = Math.max(
    0,
    Math.floor((Date.now() - salaryDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  );

  let salaryPts = 0;
  if (monthsWithoutIncrement >= 18) {
    salaryPts = 25;
    topFactors.push(`Salary Stagnation: No increment for ${monthsWithoutIncrement} months (+25)`);
  } else if (monthsWithoutIncrement >= 12) {
    salaryPts = 12;
    topFactors.push(`Salary Stagnation: No increment for ${monthsWithoutIncrement} months (+12)`);
  }
  breakdown.salaryStagnation = salaryPts;
  totalScore += salaryPts;

  // --- 3. Performance & Appraisal Trajectory (Weight: 20%) ---
  const latestReview = await Review.findOne({
    employeeId: employee._id,
    status: 'Finalized'
  })
    .sort({ createdAt: -1 })
    .lean();

  let appraisalPts = 0;
  if (!latestReview) {
    // If employed > 6 months with no appraisal
    const tenureMonths = Math.floor(
      (Date.now() - new Date(employee.joiningDate || Date.now()).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    );
    if (tenureMonths >= 6) {
      appraisalPts = 10;
      topFactors.push('Overdue Appraisal: No performance appraisal completed (+10)');
    }
  } else {
    const monthsSinceReview = Math.floor(
      (Date.now() - new Date(latestReview.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );
    if (monthsSinceReview > 12) {
      appraisalPts += 10;
      topFactors.push(`Appraisal Delay: Over ${monthsSinceReview} months since last review (+10)`);
    }

    const rating = latestReview.finalAppraisal?.finalRating || latestReview.managerReview?.calculatedScore / 20;
    if (rating && rating <= 2.5) {
      appraisalPts += 10;
      topFactors.push(`Low Performance Rating: Recent score was ${rating.toFixed(1)}/5.0 (+10)`);
    }
  }
  breakdown.appraisal = Math.min(20, appraisalPts);
  totalScore += breakdown.appraisal;

  // --- 4. Tenure in Current Role / Designation (Weight: 15%) ---
  const tenureMonths = Math.floor(
    (Date.now() - new Date(employee.joiningDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  let tenurePts = 0;
  if (tenureMonths >= 24) {
    tenurePts = 15;
    topFactors.push(`Role Stagnation: Over 2 years in same designation (+15)`);
  } else if (tenureMonths >= 18) {
    tenurePts = 8;
    topFactors.push(`Tenure Stagnation: Over 18 months without title change (+8)`);
  }
  breakdown.tenure = tenurePts;
  totalScore += tenurePts;

  // --- 5. Engagement & Grievance Signal (Weight: 10%) ---
  // Default to baseline 0 unless disciplinary/grievance records exist
  breakdown.engagement = 0;

  // Normalize final score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, totalScore));

  let riskLevel = 'Low';
  if (normalizedScore >= 70) {
    riskLevel = 'High';
  } else if (normalizedScore >= 40) {
    riskLevel = 'Medium';
  }

  // Persist or update AttritionScore record
  const savedScore = await AttritionScore.findOneAndUpdate(
    { employeeId: employee._id },
    {
      employeeId: employee._id,
      departmentId: employee.departmentId,
      riskScore: normalizedScore,
      riskLevel,
      breakdown,
      topFactors,
      calculatedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return savedScore;
}

/**
 * 17.1: Batch recalculation for all active employees
 */
export async function runWeeklyAttritionScoring() {
  const activeEmployees = await Employee.find({
    status: { $in: ['Active', 'Probation'] }
  })
    .select('_id')
    .lean();

  let evaluatedCount = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;

  for (const emp of activeEmployees) {
    const result = await calculateEmployeeRisk(emp._id);
    if (result) {
      evaluatedCount++;
      if (result.riskLevel === 'High') highRiskCount++;
      else if (result.riskLevel === 'Medium') mediumRiskCount++;
      else lowRiskCount++;
    }
  }

  return {
    evaluatedCount,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    calculatedAt: new Date()
  };
}

/**
 * 17.2: Paginated list of scored employees with role-wise scoping and filters
 */
export async function getAttritionScores(queryParams, user) {
  const scopeInfo = await resolveUserScope(user);

  const {
    page = 1,
    limit = 10,
    departmentId,
    riskLevel,
    search,
    sortBy = 'riskScore',
    sortOrder = 'desc'
  } = queryParams;

  const filter = {};

  // Enforce PBAC Scope
  if (scopeInfo.scope === 'team') {
    filter.departmentId = scopeInfo.departmentId;
  } else if (departmentId) {
    filter.departmentId = departmentId;
  }

  if (riskLevel) {
    filter.riskLevel = riskLevel;
  }

  // Search by employee name or code via Employee lookup
  if (search && search.trim()) {
    const cleanSearch = escapeRegex(search.trim());
    const matchedEmps = await Employee.find({
      $or: [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { employeeCode: { $regex: cleanSearch, $options: 'i' } },
        { email: { $regex: cleanSearch, $options: 'i' } }
      ]
    })
      .select('_id')
      .lean();

    const matchedIds = matchedEmps.map((e) => e._id);
    filter.employeeId = { $in: matchedIds };
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortObj = {};
  sortObj[sortBy] = sortDirection;

  const [total, scores] = await Promise.all([
    AttritionScore.countDocuments(filter),
    AttritionScore.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('employeeId', 'name employeeCode avatar email status designationId departmentId joiningDate')
      .populate('departmentId', 'name code')
      .lean()
  ]);

  return {
    scores,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * 17.2: Single employee detailed attrition profile
 */
export async function getAttritionScoreById(id, user) {
  const scopeInfo = await resolveUserScope(user);

  const score = await AttritionScore.findById(id)
    .populate('employeeId', 'name employeeCode avatar email status designationId departmentId joiningDate')
    .populate('departmentId', 'name code')
    .lean();

  if (!score) {
    throw new ApiError(404, 'Attrition risk score record not found.');
  }

  if (scopeInfo.scope === 'team' && String(score.departmentId?._id || score.departmentId) !== String(scopeInfo.departmentId)) {
    throw new ApiError(403, 'Access denied: Employee does not belong to your assigned department.');
  }

  return score;
}

/**
 * 17.3: Aggregate department-wise attrition distribution for Recharts
 */
export async function getDepartmentRiskAnalytics(user) {
  const scopeInfo = await resolveUserScope(user);

  const matchStage = {};
  if (scopeInfo.scope === 'team') {
    matchStage.departmentId = scopeInfo.departmentId;
  }

  const departments = await Department.find(
    scopeInfo.scope === 'team' ? { _id: scopeInfo.departmentId } : {}
  )
    .select('name code')
    .lean();

  const deptMap = new Map();
  departments.forEach((d) => {
    deptMap.set(String(d._id), {
      departmentId: String(d._id),
      departmentName: d.name,
      departmentCode: d.code,
      totalEmployees: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      totalScoreSum: 0,
      averageRiskScore: 0
    });
  });

  const aggregateResults = await AttritionScore.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          departmentId: '$departmentId',
          riskLevel: '$riskLevel'
        },
        count: { $sum: 1 },
        scoreSum: { $sum: '$riskScore' }
      }
    }
  ]);

  aggregateResults.forEach((item) => {
    const deptId = String(item._id.departmentId);
    let entry = deptMap.get(deptId);
    if (!entry) {
      entry = {
        departmentId: deptId,
        departmentName: 'Other / Unassigned',
        departmentCode: 'N/A',
        totalEmployees: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        totalScoreSum: 0,
        averageRiskScore: 0
      };
      deptMap.set(deptId, entry);
    }

    entry.totalEmployees += item.count;
    entry.totalScoreSum += item.scoreSum;

    if (item._id.riskLevel === 'High') entry.highRisk += item.count;
    else if (item._id.riskLevel === 'Medium') entry.mediumRisk += item.count;
    else if (item._id.riskLevel === 'Low') entry.lowRisk += item.count;
  });

  const departmentStats = Array.from(deptMap.values()).map((dept) => ({
    ...dept,
    averageRiskScore:
      dept.totalEmployees > 0 ? Math.round(dept.totalScoreSum / dept.totalEmployees) : 0
  }));

  return departmentStats;
}

/**
 * 17.4: Add retention intervention note
 */
export async function addRetentionNote(scoreId, notePayload, user) {
  const scopeInfo = await resolveUserScope(user);

  const score = await AttritionScore.findById(scoreId);
  if (!score) {
    throw new ApiError(404, 'Attrition score document not found.');
  }

  if (scopeInfo.scope === 'team' && String(score.departmentId) !== String(scopeInfo.departmentId)) {
    throw new ApiError(403, 'Access denied: Cannot add notes for employees outside your department.');
  }

  const newNote = {
    note: notePayload.note,
    actionTaken: notePayload.actionTaken || 'One-on-One Wellness Check',
    authorId: user._id,
    authorName: user.name || user.email || 'HR Professional',
    followUpDate: notePayload.followUpDate || null
  };

  score.notes.push(newNote);
  await score.save();

  // Create audit trail record
  await AuditLog.create({
    actorId: user._id,
    actorEmail: user.email || 'unknown',
    actorRole: user?.role?.name || user?.role || 'HR Manager',
    action: 'ATTRITION_NOTE_ADDED',
    module: 'attrition',
    targetId: score._id,
    targetModel: 'AttritionScore',
    details: {
      actionTaken: newNote.actionTaken,
      followUpDate: newNote.followUpDate
    }
  });

  return score;
}

/**
 * 17.4: Get retention intervention notes for an employee
 */
export async function getRetentionNotes(scoreId, user) {
  const scopeInfo = await resolveUserScope(user);

  const score = await AttritionScore.findById(scoreId).select('notes departmentId employeeId').lean();
  if (!score) {
    throw new ApiError(404, 'Attrition score document not found.');
  }

  if (scopeInfo.scope === 'team' && String(score.departmentId) !== String(scopeInfo.departmentId)) {
    throw new ApiError(403, 'Access denied: Cannot view notes for employees outside your department.');
  }

  return score.notes || [];
}
