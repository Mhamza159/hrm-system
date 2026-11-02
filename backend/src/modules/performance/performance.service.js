/**
 * @file performance.service.js
 * @description Core Domain Service for Module M19 Performance & Appraisal.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Rows 19.1 to 19.9)
 * - Security: PBAC Scoped Access Control & Immutable Field-Level Audit Trails.
 * - Integrations: M8 Notification Service, M9 Payroll Salary Structure Revisions.
 */

import mongoose from 'mongoose';
import KpiTemplate from '../../models/kpiTemplate.model.js';
import ReviewCycle from '../../models/reviewCycle.model.js';
import Review from '../../models/review.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { Department } from '../../models/department.model.js';
import { Designation } from '../../models/designation.model.js';
import { SalaryStructure } from '../../models/salaryStructure.model.js';
import { ApiError } from '../../utils/apiError.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isUserAdminOrHr = (user) => {
  const roles = (user?.roles || []).map((r) => (typeof r === 'string' ? r : r?.name));
  return roles.includes('Super Admin') || roles.includes('HR Manager');
};


// =========================================================================
// SLICE 1: KPI TEMPLATE MASTER AUTHORING (19.1)
// =========================================================================

export const createKpiTemplate = async ({ templateData, user, ipAddress, userAgent }) => {
  const existing = await KpiTemplate.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(templateData.name.trim())}$`, 'i') },
    designationId: templateData.designationId,
    isDeleted: false
  });

  if (existing) {
    throw new ApiError(409, `KPI Template "${templateData.name}" already exists for this designation`);
  }

  const template = await KpiTemplate.create({
    ...templateData,
    createdBy: user._id
  });

  await recordAuditLog({
    action: 'CREATE',
    module: 'performance',
    entity: 'KpiTemplate',
    entityId: template._id,
    user,
    details: { name: template.name, designationId: template.designationId, kpiCount: template.kpis.length },
    ipAddress,
    userAgent
  });

  return template;
};

export const getKpiTemplates = async ({ query = {}, user }) => {
  const filter = { isDeleted: false };
  if (query.designationId) filter.designationId = query.designationId;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true' || query.isActive === true;
  if (query.search) {
    filter.name = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
  }

  return await KpiTemplate.find(filter)
    .populate('designationId', 'title departmentId')
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

export const getKpiTemplateById = async (id) => {
  const template = await KpiTemplate.findOne({ _id: id, isDeleted: false })
    .populate('designationId', 'title departmentId')
    .populate('createdBy', 'firstName lastName email');

  if (!template) {
    throw new ApiError(404, 'KPI Template not found');
  }

  return template;
};

export const updateKpiTemplate = async ({ id, templateData, user, ipAddress, userAgent }) => {
  const template = await KpiTemplate.findOne({ _id: id, isDeleted: false });
  if (!template) {
    throw new ApiError(404, 'KPI Template not found');
  }

  const beforeState = template.toObject();

  if (templateData.name && templateData.name !== template.name) {
    const duplicate = await KpiTemplate.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${escapeRegex(templateData.name.trim())}$`, 'i') },
      designationId: templateData.designationId || template.designationId,
      isDeleted: false
    });
    if (duplicate) {
      throw new ApiError(409, `KPI Template "${templateData.name}" already exists for this designation`);
    }
  }

  Object.assign(template, templateData);
  await template.save();

  await recordAuditLog({
    action: 'UPDATE',
    module: 'performance',
    entity: 'KpiTemplate',
    entityId: template._id,
    user,
    before: beforeState,
    after: template.toObject(),
    ipAddress,
    userAgent
  });

  return template;
};

export const deleteKpiTemplate = async ({ id, user, ipAddress, userAgent }) => {
  const template = await KpiTemplate.findOne({ _id: id, isDeleted: false });
  if (!template) {
    throw new ApiError(404, 'KPI Template not found');
  }

  template.isDeleted = true;
  await template.save();

  await recordAuditLog({
    action: 'DELETE',
    module: 'performance',
    entity: 'KpiTemplate',
    entityId: template._id,
    user,
    details: { name: template.name },
    ipAddress,
    userAgent
  });

  return { message: 'KPI Template deleted successfully' };
};

// =========================================================================
// SLICE 2: REVIEW CYCLES & AUTO-INSTANTIATION (19.2)
// =========================================================================

export const launchReviewCycle = async ({ cycleData, user, ipAddress, userAgent }) => {
  const existing = await ReviewCycle.findOne({
    title: { $regex: new RegExp(`^${escapeRegex(cycleData.title.trim())}$`, 'i') },
    periodYear: cycleData.periodYear,
    isDeleted: false
  });

  if (existing) {
    throw new ApiError(409, `Review Cycle "${cycleData.title}" already exists for year ${cycleData.periodYear}`);
  }

  const cycle = await ReviewCycle.create({
    ...cycleData,
    status: 'Active',
    createdBy: user._id
  });

  // Query all eligible active employees
  const activeEmployees = await Employee.find({
    status: 'Active',
    isDeleted: false
  });

  let instantiatedCount = 0;

  for (const emp of activeEmployees) {
    // Find designation-specific template or fallback
    let template = null;
    if (emp.designationId) {
      template = await KpiTemplate.findOne({
        designationId: emp.designationId,
        isActive: true,
        isDeleted: false
      });
    }

    if (!template) {
      template = await KpiTemplate.findOne({ isActive: true, isDeleted: false });
    }

    const clonedKpis = template?.kpis?.map((k) => ({
      title: k.title,
      description: k.description,
      weightage: k.weightage,
      targetCriteria: k.targetCriteria
    })) || [];

    try {
      await Review.create({
        cycleId: cycle._id,
        employeeId: emp._id,
        departmentId: emp.departmentId || null,
        designationId: emp.designationId || null,
        managerId: emp.reportingTo || null,
        status: 'Active',
        kpis: clonedKpis,
        goals: []
      });
      instantiatedCount++;
    } catch (err) {
      // Ignore duplicate compound index collisions gracefully
      if (err.code !== 11000) throw err;
    }
  }

  cycle.totalReviewsCount = instantiatedCount;
  await cycle.save();

  await recordAuditLog({
    action: 'CREATE',
    module: 'performance',
    entity: 'ReviewCycle',
    entityId: cycle._id,
    user,
    details: { title: cycle.title, periodYear: cycle.periodYear, totalReviews: instantiatedCount },
    ipAddress,
    userAgent
  });

  return cycle;
};

export const getReviewCycles = async ({ query = {}, user }) => {
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.periodYear) filter.periodYear = Number(query.periodYear);

  return await ReviewCycle.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

export const getReviewCycleById = async (id) => {
  const cycle = await ReviewCycle.findOne({ _id: id, isDeleted: false })
    .populate('createdBy', 'firstName lastName email');

  if (!cycle) {
    throw new ApiError(404, 'Review Cycle not found');
  }

  return cycle;
};

export const updateCycleStatus = async ({ id, status, user, ipAddress, userAgent }) => {
  const cycle = await ReviewCycle.findOne({ _id: id, isDeleted: false });
  if (!cycle) {
    throw new ApiError(404, 'Review Cycle not found');
  }

  const beforeStatus = cycle.status;
  cycle.status = status;
  await cycle.save();

  await recordAuditLog({
    action: 'STATUS_CHANGE',
    module: 'performance',
    entity: 'ReviewCycle',
    entityId: cycle._id,
    user,
    details: { before: beforeStatus, after: status },
    ipAddress,
    userAgent
  });

  return cycle;
};

// =========================================================================
// SLICE 3: GOALS / OKRs MANAGEMENT (19.3)
// =========================================================================

export const updateReviewGoals = async ({ reviewId, goals, user, ipAddress, userAgent }) => {
  const review = await Review.findOne({ _id: reviewId, isDeleted: false });
  if (!review) {
    throw new ApiError(404, 'Performance Review not found');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot modify goals on an already finalized appraisal');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot submit manager review on an already finalized appraisal');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot modify goals on an already finalized appraisal');
  }

  // Lock goals once self-review has been submitted
  if (review.selfReview?.submitted) {
    throw new ApiError(400, 'Goals cannot be modified after self-review submission');
  }

  const actorEmp = await Employee.findOne({ userId: user._id });
  const isOwner = actorEmp && review.employeeId.toString() === actorEmp._id.toString();
  const isManager = actorEmp && review.managerId && review.managerId.toString() === actorEmp._id.toString();
  const isAdminOrHr = isUserAdminOrHr(user);

  if (!isOwner && !isManager && !isAdminOrHr) {
    throw new ApiError(403, 'You do not have permission to edit goals for this review');
  }

  review.goals = goals;
  await review.save();

  await recordAuditLog({
    action: 'UPDATE',
    module: 'performance',
    entity: 'Review',
    entityId: review._id,
    user,
    details: { updatedField: 'goals', count: goals.length },
    ipAddress,
    userAgent
  });

  return review;
};

// =========================================================================
// SLICE 4: EMPLOYEE SELF-REVIEW SUBMISSION (19.4)
// =========================================================================

export const submitSelfReview = async ({ reviewId, kpiRatings, goalRatings = [], overallSummary = '', user, ipAddress, userAgent }) => {
  const review = await Review.findOne({ _id: reviewId, isDeleted: false });
  if (!review) {
    throw new ApiError(404, 'Performance Review not found');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot submit manager review on an already finalized appraisal');
  }

  const actorEmp = await Employee.findOne({ userId: user._id });
  if (!actorEmp || review.employeeId.toString() !== actorEmp._id.toString()) {
    throw new ApiError(403, 'You can only submit self-review for your own appraisal instance');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot submit self-review on an already finalized appraisal');
  }

  if (review.selfReview?.submitted) {
    throw new ApiError(400, 'Self-review has already been submitted for this appraisal instance');
  }

  const cycle = await ReviewCycle.findOne({ _id: review.cycleId, isDeleted: false });
  if (!cycle) {
    throw new ApiError(404, 'Linked Review Cycle not found');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot submit self-review on an already finalized appraisal');
  }

  if (review.selfReview?.submitted) {
    throw new ApiError(400, 'Self-review has already been submitted for this appraisal instance');
  }

  // Deadline Enforcement
  if (cycle.selfReviewDeadline && new Date() > new Date(cycle.selfReviewDeadline)) {
    throw new ApiError(400, 'Self-review deadline has passed for this appraisal cycle');
  }

  // Update KPI self-ratings
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const item of kpiRatings) {
    const kpi = review.kpis.id(item.kpiId);
    if (kpi) {
      kpi.selfRating = item.rating;
      kpi.selfComments = item.comments || '';
      totalWeightedScore += (item.rating * kpi.weightage);
      totalWeight += kpi.weightage;
    }
  }

  // Update Goal self-ratings if present
  for (const item of goalRatings) {
    const goal = review.goals.id(item.goalId);
    if (goal) {
      goal.selfRating = item.rating;
      goal.selfComments = item.comments || '';
    }
  }

  const calculatedSelfScore = totalWeight > 0
    ? Number((totalWeightedScore / totalWeight).toFixed(2))
    : 0;

  review.selfReview = {
    submitted: true,
    submittedAt: new Date(),
    overallSummary,
    calculatedScore: calculatedSelfScore
  };

  review.status = 'Manager_Review';
  await review.save();

  // Notify Manager if designated
  if (review.managerId) {
    const managerEmp = await Employee.findById(review.managerId);
    if (managerEmp?.userId) {
      await notify({
        userId: managerEmp.userId,
        title: 'Subordinate Self-Review Submitted',
        message: `${actorEmp.firstName} ${actorEmp.lastName} has submitted their self-appraisal.`,
        type: 'performance',
        link: `/performance/team-reviews`
      });
    }
  }

  await recordAuditLog({
    action: 'SUBMIT_SELF_REVIEW',
    module: 'performance',
    entity: 'Review',
    entityId: review._id,
    user,
    details: { selfScore: calculatedSelfScore },
    ipAddress,
    userAgent
  });

  return review;
};

// =========================================================================
// SLICE 5: DEPARTMENT MANAGER REVIEW & SCORING (19.5)
// =========================================================================

export const submitManagerReview = async ({
  reviewId,
  managerKpiRatings,
  managerGoalRatings = [],
  strengths = '',
  improvements = '',
  recommendedIncrementPercent = 0,
  recommendationNotes = '',
  user,
  ipAddress,
  userAgent
}) => {
  const review = await Review.findOne({ _id: reviewId, isDeleted: false });
  if (!review) {
    throw new ApiError(404, 'Performance Review not found');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot submit manager review on an already finalized appraisal');
  }

  const actorEmp = await Employee.findOne({ userId: user._id });
  const isAdminOrHr = isUserAdminOrHr(user);
  const isDirectManager = actorEmp && review.managerId && review.managerId.toString() === actorEmp._id.toString();
  const isDeptManager = actorEmp?.departmentId && review.departmentId && review.departmentId.toString() === actorEmp.departmentId.toString();

  if (!isAdminOrHr && !isDirectManager && !isDeptManager) {
    throw new ApiError(403, 'You are not authorized to conduct manager review for this employee');
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const item of managerKpiRatings) {
    const kpi = review.kpis.id(item.kpiId);
    if (kpi) {
      kpi.managerRating = item.rating;
      kpi.managerComments = item.comments || '';
      totalWeightedScore += (item.rating * kpi.weightage);
      totalWeight += kpi.weightage;
    }
  }

  for (const item of managerGoalRatings) {
    const goal = review.goals.id(item.goalId);
    if (goal) {
      goal.managerRating = item.rating;
      goal.managerComments = item.comments || '';
    }
  }

  const calculatedManagerScore = totalWeight > 0
    ? Number((totalWeightedScore / totalWeight).toFixed(2))
    : 0;

  review.managerReview = {
    submitted: true,
    submittedAt: new Date(),
    strengths,
    improvements,
    recommendedIncrementPercent,
    recommendationNotes,
    calculatedScore: calculatedManagerScore
  };

  review.status = 'Ready_For_Finalization';
  await review.save();

  await recordAuditLog({
    action: 'SUBMIT_MANAGER_REVIEW',
    module: 'performance',
    entity: 'Review',
    entityId: review._id,
    user,
    details: { managerScore: calculatedManagerScore, recommendedIncrementPercent },
    ipAddress,
    userAgent
  });

  return review;
};

// =========================================================================
// SLICE 6: FINAL APPRAISAL & M9 SALARY REVISION LINKAGE (19.7)
// =========================================================================

export const finalizeReview = async ({
  reviewId,
  finalRating,
  finalScore,
  finalComments = '',
  approvedIncrementPercent = 0,
  user,
  ipAddress,
  userAgent
}) => {
  const review = await Review.findOne({ _id: reviewId, isDeleted: false });
  if (!review) {
    throw new ApiError(404, 'Performance Review not found');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot submit manager review on an already finalized appraisal');
  }

  const score = finalScore !== undefined
    ? finalScore
    : (review.managerReview?.calculatedScore || finalRating);

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'This performance appraisal has already been finalized');
  }

  let salaryRevisionId = null;

  // Automated Linkage with Module M9 Payroll Row 9.2 (Salary Revision Draft)
  if (approvedIncrementPercent > 0) {
    try {
      const activeStructure = await SalaryStructure.findOne({
        employeeId: review.employeeId,
        status: 'active',
        isDeleted: false
      });

      if (activeStructure) {
        const incrementFactor = 1 + (approvedIncrementPercent / 100);
        const newBasic = Math.round((activeStructure.basicSalary || 0) * incrementFactor);
        const newHouseRent = Math.round((activeStructure.houseRentAllowance || 0) * incrementFactor);
        const newMedical = Math.round((activeStructure.medicalAllowance || 0) * incrementFactor);
        const newConveyance = Math.round((activeStructure.conveyanceAllowance || 0) * incrementFactor);
        const newOther = Math.round((activeStructure.otherAllowances || 0) * incrementFactor);

        // Mark previous structure as superseded
        activeStructure.status = 'superseded';
        await activeStructure.save();

        const newSalary = await SalaryStructure.create({
          employeeId: review.employeeId,
          effectiveFrom: new Date(),
          basicSalary: newBasic,
          houseRentAllowance: newHouseRent,
          medicalAllowance: newMedical,
          conveyanceAllowance: newConveyance,
          otherAllowances: newOther,
          eobiEnabled: activeStructure.eobiEnabled,
          pessiEnabled: activeStructure.pessiEnabled,
          providentFundEnabled: activeStructure.providentFundEnabled,
          providentFundRate: activeStructure.providentFundRate,
          status: 'active',
          revisionReason: `Performance Appraisal (${approvedIncrementPercent}% approved increment)`,
          revisedBy: user._id
        });

        salaryRevisionId = newSalary._id;
      }
    } catch (payrollErr) {
      console.error('[Appraisal M9 Linkage Warning]', payrollErr.message);
    }
  }

  review.finalAppraisal = {
    finalRating,
    finalScore: score,
    finalComments,
    approvedIncrementPercent,
    finalizedBy: user._id,
    finalizedAt: new Date(),
    salaryRevisionId
  };

  review.status = 'Finalized';
  await review.save();

  // Increment completed reviews on cycle
  await ReviewCycle.findByIdAndUpdate(review.cycleId, {
    $inc: { completedReviewsCount: 1 }
  });

  // Notify Employee of Final Appraisal
  const employee = await Employee.findById(review.employeeId);
  if (employee?.userId) {
    await notify({
      userId: employee.userId,
      title: 'Performance Appraisal Finalized',
      message: `Your performance evaluation has been approved with a final rating of ${finalRating}/5.`,
      type: 'performance',
      link: `/performance/my-review`
    });
  }

  await recordAuditLog({
    action: 'FINALIZE_REVIEW',
    module: 'performance',
    entity: 'Review',
    entityId: review._id,
    user,
    details: { finalRating, finalScore: score, approvedIncrementPercent, salaryRevisionId },
    ipAddress,
    userAgent
  });

  return review;
};

// =========================================================================
// SLICE 7: REVIEW CYCLE PROGRESS & TRACKING (19.9)
// =========================================================================

export const getReviewCycleProgress = async (cycleId) => {
  const cycle = await ReviewCycle.findOne({ _id: cycleId, isDeleted: false });
  if (!cycle) {
    throw new ApiError(404, 'Review Cycle not found');
  }

  const reviews = await Review.find({ cycleId, isDeleted: false })
    .populate('employeeId', 'firstName lastName email departmentId designationId')
    .populate('departmentId', 'name')
    .populate('managerId', 'firstName lastName email');

  const total = reviews.length;
  let selfSubmitted = 0;
  let managerSubmitted = 0;
  let finalized = 0;

  const overdueSelfReviewers = [];
  const overdueManagerReviewers = [];
  const deptStats = {};

  const now = new Date();
  const isPastSelfDeadline = cycle.selfReviewDeadline && now > new Date(cycle.selfReviewDeadline);
  const isPastMgrDeadline = cycle.managerReviewDeadline && now > new Date(cycle.managerReviewDeadline);

  for (const rev of reviews) {
    const deptName = rev.departmentId?.name || 'Unassigned';
    if (!deptStats[deptName]) {
      deptStats[deptName] = { total: 0, completed: 0 };
    }
    deptStats[deptName].total++;

    if (rev.selfReview?.submitted) selfSubmitted++;
    else if (isPastSelfDeadline) {
      overdueSelfReviewers.push({
        reviewId: rev._id,
        employee: rev.employeeId,
        department: rev.departmentId?.name
      });
    }

    if (rev.managerReview?.submitted) managerSubmitted++;
    else if (rev.selfReview?.submitted && isPastMgrDeadline) {
      overdueManagerReviewers.push({
        reviewId: rev._id,
        employee: rev.employeeId,
        manager: rev.managerId,
        department: rev.departmentId?.name
      });
    }

    if (rev.status === 'Finalized') {
      finalized++;
      deptStats[deptName].completed++;
    }
  }

  const completionRatePercent = total > 0
    ? Math.round((finalized / total) * 100)
    : 0;

  return {
    cycleId: cycle._id,
    title: cycle.title,
    periodYear: cycle.periodYear,
    totalReviews: total,
    selfSubmittedCount: selfSubmitted,
    managerSubmittedCount: managerSubmitted,
    finalizedCount: finalized,
    completionRatePercent,
    departmentBreakdown: Object.entries(deptStats).map(([name, data]) => ({
      department: name,
      ...data,
      percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    })),
    overdueSelfReviewers,
    overdueManagerReviewers
  };
};

// =========================================================================
// SLICE 8: 360° PEER FEEDBACK (19.6)
// =========================================================================

export const requestPeerFeedback = async ({ reviewId, peerEmployeeId, user, ipAddress, userAgent }) => {
  const review = await Review.findOne({ _id: reviewId, isDeleted: false });
  if (!review) {
    throw new ApiError(404, 'Performance Review not found');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot submit manager review on an already finalized appraisal');
  }

  const peerEmp = await Employee.findOne({ _id: peerEmployeeId, status: 'Active', isDeleted: false });
  if (!peerEmp) {
    throw new ApiError(404, 'Peer employee not found or inactive');
  }

  if (review.employeeId.toString() === peerEmployeeId.toString()) {
    throw new ApiError(400, 'Employee cannot provide peer feedback for themselves');
  }

  const existingRequest = review.peerFeedbacks.find(
    (p) => p.peerEmployeeId.toString() === peerEmployeeId.toString()
  );
  if (existingRequest) {
    throw new ApiError(409, 'Peer feedback already requested from this employee');
  }

  review.peerFeedbacks.push({
    peerEmployeeId,
    requestedBy: user._id,
    requestedAt: new Date(),
    submitted: false
  });

  await review.save();

  if (peerEmp.userId) {
    await notify({
      userId: peerEmp.userId,
      title: '360° Peer Feedback Requested',
      message: `You have been requested to provide confidential peer feedback for an appraisal.`,
      type: 'performance',
      link: `/performance/my-review`
    });
  }

  await recordAuditLog({
    action: 'REQUEST_PEER_FEEDBACK',
    module: 'performance',
    entity: 'Review',
    entityId: review._id,
    user,
    details: { peerEmployeeId },
    ipAddress,
    userAgent
  });

  return review;
};

export const submitPeerFeedback = async ({ requestId, rating, comments, user, ipAddress, userAgent }) => {
  const actorEmp = await Employee.findOne({ userId: user._id });
  if (!actorEmp) {
    throw new ApiError(403, 'Only authenticated company employees can submit peer feedback');
  }

  const review = await Review.findOne({
    'peerFeedbacks._id': requestId,
    isDeleted: false
  });

  if (!review) {
    throw new ApiError(404, 'Peer feedback request not found');
  }

  const peerItem = review.peerFeedbacks.id(requestId);
  if (peerItem.peerEmployeeId.toString() !== actorEmp._id.toString()) {
    throw new ApiError(403, 'You are not authorized to fulfill this peer feedback request');
  }

  peerItem.rating = rating;
  peerItem.comments = comments;
  peerItem.submitted = true;
  peerItem.submittedAt = new Date();

  await review.save();

  await recordAuditLog({
    action: 'SUBMIT_PEER_FEEDBACK',
    module: 'performance',
    entity: 'Review',
    entityId: review._id,
    user,
    details: { rating },
    ipAddress,
    userAgent
  });

  return { message: 'Peer feedback submitted successfully' };
};

// =========================================================================
// SLICE 9: HISTORICAL PERFORMANCE TIMELINE (19.8)
// =========================================================================

export const getEmployeePerformanceHistory = async ({ employeeId, user, dataScope }) => {
  const actorEmp = await Employee.findOne({ userId: user._id });

  // Authorization check
  if (dataScope === 'own') {
    if (!actorEmp || actorEmp._id.toString() !== employeeId.toString()) {
      throw new ApiError(403, 'You do not have permission to view this employee appraisal history');
    }
  } else if (dataScope === 'department') {
    const targetEmp = await Employee.findById(employeeId);
    if (!targetEmp || targetEmp.departmentId?.toString() !== actorEmp?.departmentId?.toString()) {
      throw new ApiError(403, 'You can only view appraisal history for your department subordinates');
    }
  }

  return await Review.find({
    employeeId,
    status: 'Finalized',
    isDeleted: false
  })
    .populate('cycleId', 'title periodType periodQuarter periodYear startDate endDate')
    .populate('designationId', 'title')
    .populate('departmentId', 'name')
    .sort({ createdAt: -1 });
};

// =========================================================================
// COMMON REVIEWS QUERY & HORIZONTAL SCOPING
// =========================================================================

export const getReviews = async ({ query = {}, user, dataScope }) => {
  const filter = { isDeleted: false };
  if (query.cycleId) filter.cycleId = query.cycleId;
  if (query.status) filter.status = query.status;

  const actorEmp = await Employee.findOne({ userId: user._id });

  if (dataScope === 'own') {
    if (!actorEmp) return [];
    filter.employeeId = actorEmp._id;
  } else if (dataScope === 'department' || dataScope === 'team') {
    if (actorEmp?.departmentId) {
      filter.departmentId = actorEmp.departmentId;
    } else if (actorEmp) {
      filter.managerId = actorEmp._id;
    }
  }

  return await Review.find(filter)
    .populate('employeeId', 'firstName lastName email employeeCode profilePicture')
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .populate('cycleId', 'title periodYear selfReviewDeadline managerReviewDeadline status')
    .populate('managerId', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

export const getReviewById = async ({ id, user, dataScope }) => {
  const review = await Review.findOne({ _id: id, isDeleted: false })
    .populate('employeeId', 'firstName lastName email employeeCode profilePicture departmentId designationId')
    .populate('departmentId', 'name')
    .populate('designationId', 'title')
    .populate('cycleId', 'title periodYear selfReviewDeadline managerReviewDeadline status')
    .populate('managerId', 'firstName lastName email');

  if (!review) {
    throw new ApiError(404, 'Performance Review not found');
  }

  if (review.status === 'Finalized') {
    throw new ApiError(400, 'Cannot submit manager review on an already finalized appraisal');
  }

  const actorEmp = await Employee.findOne({ userId: user._id });

  if (dataScope === 'own') {
    if (!actorEmp || review.employeeId._id.toString() !== actorEmp._id.toString()) {
      throw new ApiError(403, 'Forbidden: You can only view your own performance review');
    }
  } else if (dataScope === 'department' || dataScope === 'team') {
    const isDirectManager = actorEmp && review.managerId && review.managerId._id.toString() === actorEmp._id.toString();
    const isSameDept = actorEmp?.departmentId && review.departmentId && (review.departmentId._id?.toString() || review.departmentId.toString()) === actorEmp.departmentId.toString();
    if (!isDirectManager && !isSameDept) {
      throw new ApiError(403, 'Forbidden: You can only view reviews for your department subordinates');
    }
  }

  // Anonymize peer feedback reviewer identities if viewing employee is the review subject
  if (actorEmp && review.employeeId._id.toString() === actorEmp._id.toString()) {
    const sanitizedReview = review.toObject();
    sanitizedReview.peerFeedbacks = sanitizedReview.peerFeedbacks?.map((p) => ({
      _id: p._id,
      rating: p.rating,
      comments: p.comments,
      submitted: p.submitted,
      submittedAt: p.submittedAt
    }));
    return sanitizedReview;
  }

  return review;
};

