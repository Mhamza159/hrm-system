/**
 * @file rewards.service.js
 * @description Core Business Logic Service for Module M20: Rewards, Celebrations & Surveys.
 * 
 * SPECIFICATION & INVARIANTS:
 * - Module: M20 Rewards, Celebrations & Surveys (BUILD-GUIDE Section 27 · Rows 20.1 to 20.5)
 * - Row 20.1: Award cycles, manager nominations, atomic single-ballot voting, winner announcements.
 * - Row 20.2: Peer recognition kudos wall, recognition badges, likes, real-time broadcasts.
 * - Row 20.3: Daily celebration wall (birthdays & work anniversaries) with lookahead.
 * - Row 20.4: Company pulse surveys & polls with cryptographic single-response guarantee.
 * - Row 20.5: Survey analytics, participation tracking, rating distributions, departmental breakdown.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import Award from '../../models/award.model.js';
import AwardVote from '../../models/awardVote.model.js';
import Appreciation from '../../models/appreciation.model.js';
import Survey from '../../models/survey.model.js';
import SurveyResponse from '../../models/surveyResponse.model.js';
import { Employee } from '../../models/employee.model.js';
import { Department } from '../../models/department.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { getIO } from '../../services/socket.service.js';
import { env } from '../../config/env.js';

/**
 * Generate cryptographic hash for anonymous survey response tracking
 * Prevents multiple submissions while maintaining complete identity anonymity.
 */
function generateSurveyUserHash(userId, surveyId) {
  const salt = env.JWT_ACCESS_SECRET || 'survey_anonymity_salt_key_2026';
  return crypto
    .createHash('sha256')
    .update(`${String(userId)}:${String(surveyId)}:${salt}`)
    .digest('hex');
}

/**
 * Helper to get user's linked department and employee record
 */
async function resolveEmployeeProfile(user) {
  let employee = null;
  if (user.employeeId) {
    employee = await Employee.findById(user.employeeId).lean();
  }
  if (!employee && user._id) {
    employee = await Employee.findOne({ userId: user._id }).lean();
  }
  return employee;
}

// ==========================================
// ROW 20.1: EMPLOYEE OF THE MONTH & AWARDS
// ==========================================

export const createAwardCycle = async (user, data) => {
  const existing = await Award.findOne({
    month: data.month,
    departmentId: data.departmentId || null,
    isDeleted: false
  });

  if (existing) {
    throw new ApiError(409, `An award cycle already exists for month ${data.month}`);
  }

  const award = await Award.create({
    title: data.title,
    month: data.month,
    departmentId: data.departmentId || null,
    nominationDeadline: data.nominationDeadline,
    votingDeadline: data.votingDeadline,
    prizeDetails: data.prizeDetails || '',
    status: 'nomination',
    createdBy: user._id
  });

  await AuditLog.create({
    action: 'CREATE',
    module: 'rewards',
    performedBy: user._id,
    targetModel: 'Award',
    targetId: award._id,
    details: { title: award.title, month: award.month }
  });

  return award;
};

export const getAwards = async (user, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.month) {
    filter.month = query.month;
  }

  const [awards, total] = await Promise.all([
    Award.find(filter)
      .populate('departmentId', 'name')
      .populate('winnerId', 'name email designation departmentId avatar')
      .populate('nominations.employeeId', 'name email designation departmentId avatar')
      .populate('nominations.nominatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Award.countDocuments(filter)
  ]);

  // If user is logged in, attach their voting status per award
  const awardIds = awards.map((a) => a._id);
  const userVotes = await AwardVote.find({
    awardId: { $in: awardIds },
    voterId: user._id
  }).lean();

  const voteMap = new Map();
  userVotes.forEach((v) => voteMap.set(v.awardId.toString(), v.nomineeId.toString()));

  const enrichedAwards = awards.map((award) => ({
    ...award,
    hasVoted: voteMap.has(award._id.toString()),
    votedNomineeId: voteMap.get(award._id.toString()) || null
  }));

  return {
    awards: enrichedAwards,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getAwardById = async (user, awardId) => {
  const award = await Award.findOne({ _id: awardId, isDeleted: false })
    .populate('departmentId', 'name')
    .populate('winnerId', 'firstName lastName email designation departmentId avatar')
    .populate('nominations.employeeId', 'firstName lastName email designation departmentId avatar')
    .populate('nominations.nominatedBy', 'name email')
    .lean();

  if (!award) {
    throw new ApiError(404, 'Award cycle not found');
  }

  const userVote = await AwardVote.findOne({ awardId, voterId: user._id }).lean();

  return {
    ...award,
    hasVoted: Boolean(userVote),
    votedNomineeId: userVote?.nomineeId?.toString() || null
  };
};

export const nominateCandidate = async (user, awardId, data) => {
  const award = await Award.findOne({ _id: awardId, isDeleted: false });
  if (!award) {
    throw new ApiError(404, 'Award cycle not found');
  }

  if (award.status !== 'nomination') {
    throw new ApiError(400, 'Award cycle is not currently accepting nominations');
  }

  if (new Date() > new Date(award.nominationDeadline)) {
    throw new ApiError(400, 'Nomination deadline has passed');
  }

  // Verify nominee employee exists
  const nominee = await Employee.findById(data.employeeId).lean();
  if (!nominee) {
    throw new ApiError(404, 'Nominee employee record not found');
  }

  // Prevent duplicate nomination of the same candidate in this cycle
  const isAlreadyNominated = award.nominations.some(
    (n) => n.employeeId.toString() === data.employeeId
  );
  if (isAlreadyNominated) {
    throw new ApiError(400, 'This employee has already been nominated for this award cycle');
  }

  award.nominations.push({
    employeeId: data.employeeId,
    nominatedBy: user._id,
    reason: data.reason,
    shortlisted: false,
    nominatedAt: new Date()
  });

  await award.save();

  await AuditLog.create({
    action: 'NOMINATE',
    module: 'rewards',
    performedBy: user._id,
    targetModel: 'Award',
    targetId: award._id,
    details: { nomineeId: data.employeeId, awardId }
  });

  return award;
};

export const shortlistNomination = async (user, awardId, nominationId, shortlisted) => {
  const award = await Award.findOne({ _id: awardId, isDeleted: false });
  if (!award) {
    throw new ApiError(404, 'Award cycle not found');
  }

  const nomination = award.nominations.id(nominationId);
  if (!nomination) {
    throw new ApiError(404, 'Nomination record not found');
  }

  nomination.shortlisted = Boolean(shortlisted);
  await award.save();

  return award;
};

export const updateAwardStatus = async (user, awardId, status) => {
  const award = await Award.findOne({ _id: awardId, isDeleted: false });
  if (!award) {
    throw new ApiError(404, 'Award cycle not found');
  }

  award.status = status;
  await award.save();

  const io = getIO();
  if (io) {
    io.emit('award:statusUpdated', { awardId: award._id, status: award.status });
  }

  return award;
};

export const castVote = async (user, awardId, nomineeId) => {
  const award = await Award.findOne({ _id: awardId, isDeleted: false });
  if (!award) {
    throw new ApiError(404, 'Award cycle not found');
  }

  if (award.status !== 'voting') {
    throw new ApiError(400, 'Award cycle is not currently open for voting');
  }

  if (new Date() > new Date(award.votingDeadline)) {
    throw new ApiError(400, 'Voting deadline has passed');
  }

  // Nominee must be shortlisted in this cycle
  const isShortlisted = award.nominations.some(
    (n) => n.employeeId.toString() === nomineeId && n.shortlisted === true
  );
  if (!isShortlisted) {
    throw new ApiError(400, 'You can only vote for shortlisted nominees');
  }

  // Atomic single-vote enforcement
  try {
    await AwardVote.create({
      awardId: award._id,
      voterId: user._id,
      nomineeId
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'You have already voted in this award cycle');
    }
    throw err;
  }

  // Tally and real-time broadcast
  const totalVotes = await AwardVote.countDocuments({ awardId });
  const io = getIO();
  if (io) {
    io.emit('award:voted', { awardId, nomineeId, totalVotes });
  }

  return { success: true, message: 'Ballot vote recorded successfully' };
};

export const announceWinner = async (user, awardId, data) => {
  const award = await Award.findOne({ _id: awardId, isDeleted: false });
  if (!award) {
    throw new ApiError(404, 'Award cycle not found');
  }

  award.winnerId = data.winnerId;
  award.winnerCitation = data.winnerCitation;
  if (data.prizeDetails) {
    award.prizeDetails = data.prizeDetails;
  }
  award.status = 'announced';
  award.announcedAt = new Date();

  await award.save();

  const populated = await Award.findById(award._id)
    .populate('winnerId', 'name designation avatar departmentId')
    .lean();

  const io = getIO();
  if (io) {
    io.emit('award:announced', populated);
  }

  await AuditLog.create({
    action: 'ANNOUNCE_WINNER',
    module: 'rewards',
    performedBy: user._id,
    targetModel: 'Award',
    targetId: award._id,
    details: { winnerId: data.winnerId, title: award.title }
  });

  return populated;
};

export const getAwardVoteStats = async (user, awardId) => {
  const award = await Award.findOne({ _id: awardId, isDeleted: false }).lean();
  if (!award) {
    throw new ApiError(404, 'Award cycle not found');
  }

  const rawStats = await AwardVote.aggregate([
    { $match: { awardId: new mongoose.Types.ObjectId(awardId) } },
    { $group: { _id: '$nomineeId', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const nomineeIds = rawStats.map((s) => s._id);
  const nominees = await Employee.find({ _id: { $in: nomineeIds } })
    .select('name designation avatar departmentId')
    .lean();

  const nomineeMap = new Map();
  nominees.forEach((n) => nomineeMap.set(n._id.toString(), n));

  const totalVotes = rawStats.reduce((sum, s) => sum + s.count, 0);

  const stats = rawStats.map((s) => ({
    nominee: nomineeMap.get(s._id.toString()) || null,
    votes: s.count,
    percentage: totalVotes > 0 ? Math.round((s.count / totalVotes) * 100) : 0
  }));

  return {
    awardId,
    totalVotes,
    breakdown: stats
  };
};

// ==========================================
// ROW 20.2: PEER APPRECIATION WALL & BADGES
// ==========================================

export const createKudos = async (user, data) => {
  const linkedEmp = await resolveEmployeeProfile(user);

  // Invariant: Employee cannot send appreciation kudos to themselves
  if (linkedEmp && linkedEmp._id.toString() === data.receiverId) {
    throw new ApiError(400, 'You cannot send recognition kudos to yourself');
  }

  const receiver = await Employee.findById(data.receiverId).lean();
  if (!receiver) {
    throw new ApiError(404, 'Receiver employee record not found');
  }

  const kudos = await Appreciation.create({
    senderId: user._id,
    receiverId: data.receiverId,
    badge: data.badge,
    message: data.message,
    isPublic: data.isPublic !== undefined ? data.isPublic : true
  });

  const populated = await Appreciation.findById(kudos._id)
    .populate('senderId', 'name email avatar')
    .populate('receiverId', 'name designation avatar departmentId')
    .lean();

  const io = getIO();
  if (io) {
    io.emit('kudos:created', populated);
  }

  return populated;
};

export const getKudos = async (user, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 15;
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false, isPublic: true };
  if (query.badge) {
    filter.badge = query.badge;
  }
  if (query.receiverId) {
    filter.receiverId = query.receiverId;
  }

  const [kudosList, total] = await Promise.all([
    Appreciation.find(filter)
      .populate('senderId', 'name email avatar')
      .populate('receiverId', 'name designation avatar departmentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appreciation.countDocuments(filter)
  ]);

  const enrichedList = kudosList.map((k) => ({
    ...k,
    likesCount: (k.likes || []).length,
    hasLiked: (k.likes || []).some((uid) => uid.toString() === user._id.toString())
  }));

  return {
    kudos: enrichedList,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const toggleLikeKudos = async (user, kudosId) => {
  const kudos = await Appreciation.findOne({ _id: kudosId, isDeleted: false });
  if (!kudos) {
    throw new ApiError(404, 'Kudos post not found');
  }

  const userIdx = kudos.likes.findIndex((id) => id.toString() === user._id.toString());
  let hasLiked = false;

  if (userIdx > -1) {
    kudos.likes.splice(userIdx, 1);
    hasLiked = false;
  } else {
    kudos.likes.push(user._id);
    hasLiked = true;
  }

  await kudos.save();

  return {
    kudosId: kudos._id,
    hasLiked,
    likesCount: kudos.likes.length
  };
};

// ==========================================
// ROW 20.3: CELEBRATION WALL & MILESTONES
// ==========================================

export const getTodayCelebrations = async () => {
  const today = new Date();
  const currentMonth = today.getUTCMonth() + 1; // 1-indexed
  const currentDay = today.getUTCDate();
  const currentYear = today.getUTCFullYear();

  const activeEmployees = await Employee.find({ status: { $in: ['Active', 'active'] } })
    .select('name email designation departmentId avatar dob dateOfBirth joiningDate')
    .populate('departmentId', 'name')
    .lean();

  const birthdays = [];
  const anniversaries = [];

  for (const emp of activeEmployees) {
    // Check Birthday (support both dob and dateOfBirth)
    const bdayField = emp.dob || emp.dateOfBirth;
    if (bdayField) {
      const dob = new Date(bdayField);
      if (dob.getUTCMonth() + 1 === currentMonth && dob.getUTCDate() === currentDay) {
        birthdays.push({
          type: 'birthday',
          employee: emp
        });
      }
    }

    // Check Work Anniversary
    if (emp.joiningDate) {
      const doj = new Date(emp.joiningDate);
      if (
        doj.getUTCMonth() + 1 === currentMonth &&
        doj.getUTCDate() === currentDay &&
        doj.getUTCFullYear() < currentYear
      ) {
        const yearsCompleted = currentYear - doj.getUTCFullYear();
        anniversaries.push({
          type: 'anniversary',
          employee: emp,
          yearsCompleted
        });
      }
    }
  }

  return {
    today: new Date().toISOString(),
    birthdays,
    anniversaries
  };
};

export const getUpcomingCelebrations = async (daysAhead = 30) => {
  const activeEmployees = await Employee.find({ status: { $in: ['Active', 'active'] } })
    .select('name email designation departmentId avatar dob dateOfBirth joiningDate')
    .populate('departmentId', 'name')
    .lean();

  const today = new Date();
  const currentYear = today.getFullYear();
  const upcoming = [];

  for (const emp of activeEmployees) {
    // Birthday upcoming
    const bdayField = emp.dob || emp.dateOfBirth;
    if (bdayField) {
      const dob = new Date(bdayField);
      const bdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate());
      let diffDays = Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        const bdayNextYear = new Date(currentYear + 1, dob.getMonth(), dob.getDate());
        diffDays = Math.ceil((bdayNextYear - today) / (1000 * 60 * 60 * 24));
      }
      if (diffDays >= 0 && diffDays <= daysAhead) {
        upcoming.push({
          type: 'birthday',
          employee: emp,
          date: bdayThisYear,
          daysRemaining: diffDays
        });
      }
    }

    // Work Anniversary upcoming
    if (emp.joiningDate) {
      const doj = new Date(emp.joiningDate);
      if (doj.getFullYear() < currentYear) {
        const anniThisYear = new Date(currentYear, doj.getMonth(), doj.getDate());
        let diffDays = Math.ceil((anniThisYear - today) / (1000 * 60 * 60 * 24));
        let yearsCompleted = currentYear - doj.getFullYear();
        if (diffDays < 0) {
          const anniNextYear = new Date(currentYear + 1, doj.getMonth(), doj.getDate());
          diffDays = Math.ceil((anniNextYear - today) / (1000 * 60 * 60 * 24));
          yearsCompleted += 1;
        }
        if (diffDays >= 0 && diffDays <= daysAhead) {
          upcoming.push({
            type: 'anniversary',
            employee: emp,
            yearsCompleted,
            date: anniThisYear,
            daysRemaining: diffDays
          });
        }
      }
    }
  }

  upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return upcoming;
};

// ==========================================
// ROW 20.4: PULSE SURVEYS & COMPANY POLLS
// ==========================================

export const createSurvey = async (user, data) => {
  const survey = await Survey.create({
    title: data.title,
    description: data.description || '',
    type: data.type || 'pulse',
    isAnonymous: data.isAnonymous !== undefined ? data.isAnonymous : true,
    targetAudience: data.targetAudience || 'company',
    departmentId: data.departmentId || null,
    expiresAt: data.expiresAt,
    questions: data.questions,
    createdBy: user._id
  });

  await AuditLog.create({
    action: 'CREATE',
    module: 'rewards',
    performedBy: user._id,
    targetModel: 'Survey',
    targetId: survey._id,
    details: { title: survey.title, type: survey.type, isAnonymous: survey.isAnonymous }
  });

  return survey;
};

export const getSurveys = async (user, query = {}) => {
  const filter = { isDeleted: false };
  if (query.status) {
    filter.status = query.status;
  }

  const surveys = await Survey.find(filter)
    .populate('departmentId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  // Attach whether user has responded to each survey
  const enriched = await Promise.all(
    surveys.map(async (s) => {
      const userHash = generateSurveyUserHash(user._id, s._id);
      const hasResponded = await SurveyResponse.exists({
        surveyId: s._id,
        userHash
      });
      const responseCount = await SurveyResponse.countDocuments({ surveyId: s._id });
      return {
        ...s,
        hasResponded: Boolean(hasResponded),
        responseCount
      };
    })
  );

  return enriched;
};

export const getSurveyById = async (user, surveyId) => {
  const survey = await Survey.findOne({ _id: surveyId, isDeleted: false })
    .populate('departmentId', 'name')
    .lean();

  if (!survey) {
    throw new ApiError(404, 'Survey not found');
  }

  const userHash = generateSurveyUserHash(user._id, surveyId);
  const hasResponded = await SurveyResponse.exists({
    surveyId,
    userHash
  });

  const responseCount = await SurveyResponse.countDocuments({ surveyId });

  return {
    ...survey,
    hasResponded: Boolean(hasResponded),
    responseCount
  };
};

export const submitSurveyResponse = async (user, surveyId, answers) => {
  const survey = await Survey.findOne({ _id: surveyId, isDeleted: false });
  if (!survey) {
    throw new ApiError(404, 'Survey not found');
  }

  if (survey.status !== 'active') {
    throw new ApiError(400, 'Survey is no longer active');
  }

  if (new Date() > new Date(survey.expiresAt)) {
    throw new ApiError(400, 'Survey submission deadline has expired');
  }

  const linkedEmp = await resolveEmployeeProfile(user);

  // If department-targeted survey, verify user matches department
  if (
    survey.targetAudience === 'department' &&
    survey.departmentId &&
    linkedEmp?.departmentId?.toString() !== survey.departmentId.toString()
  ) {
    throw new ApiError(403, 'This survey is restricted to members of another department');
  }

  const userHash = generateSurveyUserHash(user._id, surveyId);

  try {
    await SurveyResponse.create({
      surveyId,
      userHash,
      userId: survey.isAnonymous ? null : user._id,
      departmentId: linkedEmp?.departmentId || null,
      answers
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'You have already submitted a response for this survey');
    }
    throw err;
  }

  return { success: true, message: 'Survey response submitted successfully' };
};

// ==========================================
// ROW 20.5: SURVEY ANALYTICS & PARTICIPATION
// ==========================================

export const getSurveyAnalytics = async (user, surveyId) => {
  const survey = await Survey.findOne({ _id: surveyId, isDeleted: false })
    .populate('departmentId', 'name')
    .lean();

  if (!survey) {
    throw new ApiError(404, 'Survey not found');
  }

  const totalResponses = await SurveyResponse.countDocuments({ surveyId });

  // Calculate eligible employee count
  const empFilter = { status: { $in: ['Active', 'active'] } };
  if (survey.targetAudience === 'department' && survey.departmentId) {
    empFilter.departmentId = survey.departmentId;
  }
  const totalEligible = await Employee.countDocuments(empFilter);

  const participationRate =
    totalEligible > 0 ? Number(((totalResponses / totalEligible) * 100).toFixed(1)) : 0;

  // Retrieve all raw responses for question breakdown
  const responses = await SurveyResponse.find({ surveyId }).lean();

  const questionBreakdown = survey.questions.map((q) => {
    const qAnswers = responses
      .map((r) => r.answers.find((a) => a.questionId === q.id))
      .filter(Boolean)
      .map((a) => a.answerValue);

    if (q.questionType === 'rating_5') {
      const numericRatings = qAnswers.map((val) => Number(val)).filter((n) => !isNaN(n));
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;

      numericRatings.forEach((num) => {
        if (ratingCounts[num] !== undefined) {
          ratingCounts[num] += 1;
        }
        sum += num;
      });

      const avgScore =
        numericRatings.length > 0 ? Number((sum / numericRatings.length).toFixed(2)) : 0;

      return {
        questionId: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        totalAnswers: numericRatings.length,
        averageScore: avgScore,
        ratingCounts
      };
    }

    if (q.questionType === 'multiple_choice') {
      const optionCounts = {};
      (q.options || []).forEach((opt) => (optionCounts[opt] = 0));

      qAnswers.forEach((ans) => {
        if (Array.isArray(ans)) {
          ans.forEach((sub) => {
            optionCounts[sub] = (optionCounts[sub] || 0) + 1;
          });
        } else if (typeof ans === 'string') {
          optionCounts[ans] = (optionCounts[ans] || 0) + 1;
        }
      });

      return {
        questionId: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        totalAnswers: qAnswers.length,
        optionCounts
      };
    }

    // Free text question
    return {
      questionId: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      totalAnswers: qAnswers.length,
      sampleAnswers: qAnswers.slice(0, 10)
    };
  });

  // Departmental distribution
  const deptAgg = await SurveyResponse.aggregate([
    { $match: { surveyId: new mongoose.Types.ObjectId(surveyId) } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } }
  ]);

  const deptIds = deptAgg.map((d) => d._id).filter(Boolean);
  const departments = await Department.find({ _id: { $in: deptIds } })
    .select('name')
    .lean();

  const deptMap = new Map();
  departments.forEach((d) => deptMap.set(d._id.toString(), d.name));

  const departmentBreakdown = deptAgg.map((d) => ({
    departmentId: d._id,
    departmentName: d._id ? deptMap.get(d._id.toString()) || 'Unknown Department' : 'Unassigned',
    responses: d.count
  }));

  return {
    survey: {
      _id: survey._id,
      title: survey.title,
      description: survey.description,
      type: survey.type,
      isAnonymous: survey.isAnonymous,
      targetAudience: survey.targetAudience,
      departmentId: survey.departmentId,
      status: survey.status,
      expiresAt: survey.expiresAt
    },
    totalResponses,
    totalEligible,
    participationRate,
    questionBreakdown,
    departmentBreakdown
  };
};

