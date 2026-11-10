/**
 * @file recruitment.service.js
 * @description Core Domain Business Logic for Module M15 Recruitment & AI Screening.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1 to 15.13)
 * - Layer: Domain Service (No direct HTTP/Express coupling)
 * - Financial Invariant: All compensation stored as minor units (paisa).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Requisition } from '../../models/requisition.model.js';
import { Job } from '../../models/job.model.js';
import { Candidate } from '../../models/candidate.model.js';
import { CandidateCv } from '../../models/candidateCv.model.js';
import { Interview } from '../../models/interview.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { Department } from '../../models/department.model.js';
import { Designation } from '../../models/designation.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { paginate } from '../../utils/paginate.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { notify } from '../../services/notify.service.js';
import { emailService } from '../../services/email.service.js';
import { parseResumeText, screenCandidateFit } from '../../services/ai.service.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../../config/cloudinary.js';
import * as employeeService from '../employees/employee.service.js';

/**
 * Generates an SEO & URL friendly unique slug for Job postings
 */
export const generateUniqueJobSlug = async (title = 'job-opening') => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (await Job.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

/**
 * Resolves the actor's associated departmentId from their user or employee profile.
 */
export const resolveActorDepartmentId = async (actor) => {
  if (!actor) return null;
  if (actor.departmentId) return actor.departmentId;
  if (actor.employeeId) {
    const emp = await Employee.findById(actor.employeeId).select('departmentId').lean();
    return emp?.departmentId || null;
  }
  if (actor._id) {
    const emp = await Employee.findOne({ userId: actor._id, isDeleted: false }).select('departmentId').lean();
    return emp?.departmentId || null;
  }
  return null;
};

// =========================================================================
// 15.1: JOB REQUISITIONS
// =========================================================================

export const createRequisition = async (payload, actor) => {
  let requestedBy = actor.employeeId;
  if (!requestedBy) {
    const actorEmp = await Employee.findOne({ userId: actor._id, isDeleted: false });
    if (actorEmp) requestedBy = actorEmp._id;
  }

  if (!requestedBy) {
    throw new ApiError(400, 'Requisition requester must be an active employee profile.');
  }

  const requisition = await Requisition.create({
    departmentId: payload.departmentId,
    designationId: payload.designationId,
    requestedBy,
    openingsCount: payload.openingsCount || 1,
    employmentType: payload.employmentType || 'Full-time',
    minExperienceYears: payload.minExperienceYears || 0,
    minSalaryPaisa: payload.minSalaryPaisa,
    maxSalaryPaisa: payload.maxSalaryPaisa,
    justification: payload.justification,
    requiredSkills: payload.requiredSkills || [],
    status: 'Pending_Approval'
  });

  // Notify Super Admin & HR users
  try {
    const adminUsers = await User.find({ isActive: true })
      .populate({ path: 'roles', match: { name: { $in: ['Super Admin', 'HR Manager'] } } })
      .lean();

    const recipientIds = adminUsers.filter((u) => u.roles?.length > 0).map((u) => u._id);
    if (recipientIds.length > 0) {
      await notify(recipientIds, {
        type: 'system',
        title: 'New Job Requisition Submitted',
        body: `Headcount requisition submitted for ${payload.openingsCount} position(s).`,
        link: '/recruitment/jobs'
      });
    }
  } catch (notifyErr) {
    console.error('Failed to dispatch requisition notifications:', notifyErr.message);
  }

  await recordAuditLog({
    actor,
    action: 'recruitment.requisition.create',
    entity: 'Requisition',
    entityId: requisition._id,
    after: requisition.toObject()
  });

  return requisition;
};

export const getRequisitions = async (query = {}, actor, permissionScope = 'all') => {
  const filter = { isDeleted: false };

  if (typeof query.status === 'string' && query.status) {
    filter.status = query.status;
  }

  if (permissionScope === 'own') {
    filter.requestedBy = actor.employeeId || actor._id;
  } else if (permissionScope === 'department' || permissionScope === 'team') {
    const actorDept = await resolveActorDepartmentId(actor);
    if (actorDept) {
      filter.departmentId = actorDept;
    } else {
      filter.departmentId = new mongoose.Types.ObjectId();
    }
  }

  if (typeof query.departmentId === 'string' && mongoose.Types.ObjectId.isValid(query.departmentId)) {
    filter.departmentId = query.departmentId;
  }

  return await paginate(Requisition, filter, {
    page: Math.max(1, parseInt(query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20)),
    sort: { createdAt: -1 },
    populate: [
      { path: 'departmentId', select: 'name code' },
      { path: 'designationId', select: 'title code grade' },
      {
        path: 'requestedBy',
        select: 'name employeeCode email designationId userId',
        populate: [
          { path: 'designationId', select: 'title code' },
          { path: 'userId', select: 'roles email', populate: { path: 'roles', select: 'name' } }
        ]
      },
      { path: 'decidedBy', select: 'email name' },
      { path: 'jobId', select: 'title slug status' }
    ]
  });
};

// =========================================================================
// 15.2: REQUISITION DECISION (SUPER ADMIN) -> AUTO DRAFT JOB
// =========================================================================

export const decideRequisition = async (id, { decision, remarks }, actor) => {
  const requisition = await Requisition.findOne({ _id: id, isDeleted: false })
    .populate('departmentId')
    .populate('designationId')
    .populate({
      path: 'requestedBy',
      select: 'name employeeCode email designationId userId',
      populate: [
        { path: 'designationId', select: 'title code' },
        { path: 'userId', select: 'roles email', populate: { path: 'roles', select: 'name' } }
      ]
    });

  if (!requisition) {
    throw new ApiError(404, 'Requisition not found.');
  }

  if (requisition.status !== 'Pending_Approval') {
    throw new ApiError(400, `Requisition has already been decided (${requisition.status}).`);
  }

  const isApproved = decision === 'approved';
  requisition.status = isApproved ? 'Approved' : 'Rejected';
  requisition.decidedBy = actor._id;
  requisition.decidedAt = new Date();
  requisition.decisionRemarks = remarks || '';

  let createdJob = null;

  // On approval, automatically create a draft Job opening
  if (isApproved) {
    const title = requisition.designationId?.title || 'Open Position';
    const slug = await generateUniqueJobSlug(title);

    createdJob = await Job.create({
      requisitionId: requisition._id,
      title,
      slug,
      departmentId: requisition.departmentId._id,
      designationId: requisition.designationId._id,
      employmentType: requisition.employmentType,
      minExperienceYears: requisition.minExperienceYears,
      minSalaryPaisa: requisition.minSalaryPaisa,
      maxSalaryPaisa: requisition.maxSalaryPaisa,
      description: `We are looking for a skilled ${title} to join our ${requisition.departmentId?.name || ''} team.\n\nJustification:\n${requisition.justification}`,
      requirements: requisition.requiredSkills || [],
      responsibilities: ['Collaborate with engineering and product teams', 'Execute assigned deliverables within deadlines'],
      status: 'Draft',
      createdBy: actor._id
    });

    requisition.jobId = createdJob._id;
  }

  await requisition.save();

  // Notify requesting manager
  if (requisition.requestedBy?.userId) {
    try {
      await notify([requisition.requestedBy.userId], {
        type: 'system',
        title: `Requisition ${isApproved ? 'Approved' : 'Rejected'}`,
        body: `Your requisition for ${requisition.designationId?.title || 'headcount'} was ${requisition.status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        link: '/recruitment/jobs'
      });
    } catch (err) {
      console.error('Requisition decision notification failed:', err.message);
    }
  }

  await recordAuditLog({
    actor,
    action: 'recruitment.requisition.decide',
    entity: 'Requisition',
    entityId: requisition._id,
    after: requisition.toObject()
  });

  return { requisition, job: createdJob };
};

// =========================================================================
// 15.3: JOB POSTINGS (ADMIN CRUD & PUBLIC)
// =========================================================================

export const createJob = async (payload, actor) => {
  const slug = await generateUniqueJobSlug(payload.title);

  const job = await Job.create({
    ...payload,
    slug,
    createdBy: actor._id
  });

  await recordAuditLog({
    actor,
    action: 'recruitment.job.manage',
    entity: 'Job',
    entityId: job._id,
    after: job.toObject()
  });

  return job;
};

export const getJobs = async (query = {}, actor, permissionScope = 'all') => {
  const filter = { isDeleted: false };

  if (typeof query.status === 'string' && query.status) {
    filter.status = query.status;
  }

  if (permissionScope === 'department') {
    const actorDept = await resolveActorDepartmentId(actor);
    if (actorDept) {
      filter.departmentId = actorDept;
    } else {
      filter.departmentId = new mongoose.Types.ObjectId();
    }
  }

  if (typeof query.departmentId === 'string' && mongoose.Types.ObjectId.isValid(query.departmentId)) {
    filter.departmentId = query.departmentId;
  }

  return await paginate(Job, filter, {
    page: Math.max(1, parseInt(query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20)),
    sort: { createdAt: -1 },
    search: typeof query.search === 'string' ? query.search : '',
    searchFields: ['title', 'description', 'location'],
    populate: [
      { path: 'departmentId', select: 'name code' },
      { path: 'designationId', select: 'title code grade' },
      { path: 'requisitionId', select: 'openingsCount status' }
    ]
  });
};

export const getJobById = async (id) => {
  const job = await Job.findOne({ _id: id, isDeleted: false })
    .populate('departmentId', 'name code')
    .populate('designationId', 'title code grade')
    .populate('requisitionId');

  if (!job) {
    throw new ApiError(404, 'Job opening not found.');
  }

  return job;
};

export const updateJob = async (id, payload, actor) => {
  const job = await Job.findOne({ _id: id, isDeleted: false });
  if (!job) {
    throw new ApiError(404, 'Job opening not found.');
  }

  // Guard: Closed jobs cannot be republished
  if (job.status === 'Closed' && payload.status === 'Published') {
    throw new ApiError(400, 'Closed jobs cannot be republished. A new requisition or job opening must be initiated.');
  }

  Object.assign(job, payload);
  await job.save();

  await recordAuditLog({
    actor,
    action: 'recruitment.job.manage',
    entity: 'Job',
    entityId: job._id,
    after: job.toObject()
  });

  return job;
};

export const deleteJob = async (id, actor) => {
  const job = await Job.findOne({ _id: id, isDeleted: false });
  if (!job) {
    throw new ApiError(404, 'Job opening not found.');
  }

  if (job.status === 'Published') {
    throw new ApiError(400, 'Active published jobs cannot be deleted. Please close the job before deleting.');
  }

  job.isDeleted = true;
  await job.save();

  await recordAuditLog({
    actor,
    action: 'recruitment.job.delete',
    entity: 'Job',
    entityId: job._id,
    after: { isDeleted: true }
  });

  return { message: 'Job opening deleted successfully.' };
};

export const getPublicJobs = async (query = {}) => {
  const filter = { status: 'Published', isDeleted: false };

  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.employmentType) filter.employmentType = query.employmentType;

  return await paginate(Job, filter, {
    page: query.page || 1,
    limit: query.limit || 20,
    sort: { createdAt: -1 },
    search: query.search,
    searchFields: ['title', 'description', 'location'],
    populate: [
      { path: 'departmentId', select: 'name code' },
      { path: 'designationId', select: 'title code' }
    ]
  });
};

export const getPublicJobBySlug = async (slug) => {
  const job = await Job.findOne({ slug: slug.toLowerCase(), status: 'Published', isDeleted: false })
    .populate('departmentId', 'name code')
    .populate('designationId', 'title code');

  if (!job) {
    throw new ApiError(404, 'Published job opening not found.');
  }

  return job;
};

// =========================================================================
// 15.4: CANDIDATE APPLICATION & CV INGESTION
// =========================================================================

export const applyForJob = async (jobId, candidateData, file) => {
  const job = await Job.findOne({ _id: jobId, status: 'Published', isDeleted: false });
  if (!job) {
    throw new ApiError(404, 'Job opening is not currently open for applications.');
  }

  // 30-day anti-duplicate submission check
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const existingApp = await Candidate.findOne({
    jobId,
    email: candidateData.email.toLowerCase(),
    createdAt: { $gte: thirtyDaysAgo },
    isDeleted: false
  });

  if (existingApp) {
    throw new ApiError(400, 'You have already submitted an application for this position within the last 30 days.');
  }

  // Save file to uploads/resumes if present
  let cvUrl = candidateData.cvUrl || '';
  let rawCvText = candidateData.cvText || '';

  if (file && file.buffer) {
    const rawExt = (file.originalname ? file.originalname.slice(file.originalname.lastIndexOf('.')) : '').toLowerCase();
    const safeExts = ['.pdf', '.doc', '.docx', '.txt'];
    const safeExt = safeExts.includes(rawExt) ? rawExt : '.pdf';

    // Magic bytes check for PDF
    if (safeExt === '.pdf') {
      const header = file.buffer.toString('utf8', 0, 5);
      if (!header.startsWith('%PDF')) {
        throw new ApiError(400, 'Invalid file content: Provided file does not contain a valid PDF document header.');
      }
    }

    // 1. Cloudinary upload if configured (persistent cloud media across Render deploys)
    if (isCloudinaryConfigured()) {
      try {
        const publicId = `cv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const cloudRes = await uploadBufferToCloudinary(file.buffer, {
          folder: 'hrm/resumes',
          resource_type: safeExt === '.pdf' ? 'raw' : 'auto',
          public_id: `${publicId}${safeExt}`
        });
        if (cloudRes?.secure_url || cloudRes?.url) {
          cvUrl = cloudRes.secure_url || cloudRes.url;
        }
      } catch (cloudErr) {
        console.warn('[Recruitment] Cloudinary CV upload failed, falling back to disk:', cloudErr.message);
      }
    }

    // 2. Local disk fallback
    if (!cvUrl) {
      const filename = `cv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${safeExt}`;
      const uploadDirs = [
        path.resolve(process.cwd(), 'uploads', 'resumes'),
        path.resolve(process.cwd(), 'backend', 'uploads', 'resumes')
      ];

      for (const dir of uploadDirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, filename), file.buffer);
      }
      cvUrl = `/uploads/resumes/${filename}`;
    }

    // Extract raw text heuristic from buffer if plain/utf8 (guard binary PDF bytecode)
    try {
      const header = file.buffer.toString('utf8', 0, 5);
      if (header.startsWith('%PDF')) {
        rawCvText = `Applicant: ${candidateData.name}\nEmail: ${candidateData.email}\nPhone: ${candidateData.phone || ''}\n${candidateData.linkedinUrl ? `LinkedIn: ${candidateData.linkedinUrl}\n` : ''}${candidateData.portfolioUrl ? `Portfolio: ${candidateData.portfolioUrl}\n` : ''}Target Job: ${job.title}\nCandidate submitted document: ${file.originalname || 'Resume.pdf'}`;
      } else {
        rawCvText = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 12000));
      }
    } catch {
      rawCvText = `${candidateData.name} CV Document`;
    }
  }

  // Cap CV text length to prevent prompt bloat / memory DoS
  if (rawCvText.length > 15000) {
    rawCvText = rawCvText.slice(0, 15000);
  }

  // Fallback cvText if none extracted
  if (!rawCvText || rawCvText.length < 20) {
    rawCvText = `Applicant: ${candidateData.name}\nEmail: ${candidateData.email}\nPhone: ${candidateData.phone}\n${candidateData.linkedinUrl ? `LinkedIn: ${candidateData.linkedinUrl}` : ''}`;
  }

  // 15.5 & 15.6: Run AI parsing & fit screening
  let parsedProfile = null;
  let aiScore = null;
  let aiScreeningReason = '';

  try {
    parsedProfile = await parseResumeText(rawCvText);
    const screening = await screenCandidateFit({
      parsedProfile,
      cvText: rawCvText,
      jobTitle: job.title,
      jobDescription: job.description,
      jobRequirements: job.requirements,
      minExperienceYears: job.minExperienceYears
    });
    aiScore = screening.aiScore;
    aiScreeningReason = screening.screeningSummary;
    parsedProfile.matchingStrengths = screening.matchingStrengths;
    parsedProfile.missingSkills = screening.missingSkills;
  } catch (err) {
    console.error('AI CV parsing/screening error:', err.message);
  }

  const candidate = await Candidate.create({
    jobId,
    name: candidateData.name,
    email: candidateData.email.toLowerCase(),
    phone: candidateData.phone,
    cvUrl: cvUrl || '/uploads/resumes/default.pdf',
    cvText: rawCvText,
    linkedinUrl: candidateData.linkedinUrl || '',
    portfolioUrl: candidateData.portfolioUrl || '',
    stage: 'Applied',
    aiScore,
    aiScreeningReason,
    parsedProfile: parsedProfile || {},
    parsingStatus: parsedProfile ? 'completed' : 'failed',
    stageHistory: [
      {
        stage: 'Applied',
        notes: 'Initial application received via public portal.',
        timestamp: new Date()
      }
    ]
  });

  // Persistent cloud storage in MongoDB Atlas (guarantees resume survives container wipes)
  if (file && file.buffer) {
    try {
      await CandidateCv.findOneAndUpdate(
        { candidateId: candidate._id },
        {
          candidateId: candidate._id,
          filename: file.originalname || `${candidateData.name}_Resume${safeExt}`,
          contentType: file.mimetype || 'application/pdf',
          size: file.buffer.length,
          fileBuffer: file.buffer
        },
        { upsert: true, new: true }
      );
    } catch (cvDbErr) {
      console.warn('[Recruitment] CandidateCv binary persistence warning:', cvDbErr.message);
    }
  }

  // Automated candidate acknowledgment email
  try {
    await emailService.sendMail({
      to: candidate.email,
      subject: `Application Received: ${job.title}`,
      text: `Dear ${candidate.name},\n\nThank you for applying for the ${job.title} position at HRM Enterprise. Our talent acquisition team will review your credentials and get back to you.\n\nBest regards,\nTalent Acquisition Team`
    });
  } catch (mailErr) {
    console.error('Candidate acknowledgment email failed:', mailErr.message);
  }

  return candidate;
};

// =========================================================================
// 15.7: CANDIDATE PIPELINE BOARD & KANBAN TRANSITIONS
// =========================================================================

export const getCandidates = async (query = {}, actor, permissionScope = 'all') => {
  const filter = { isDeleted: false };

  if (typeof query.jobId === 'string' && mongoose.Types.ObjectId.isValid(query.jobId)) {
    filter.jobId = query.jobId;
  }
  if (typeof query.stage === 'string' && query.stage) {
    filter.stage = query.stage;
  }

  if (permissionScope === 'department') {
    const actorDept = await resolveActorDepartmentId(actor);
    if (actorDept) {
      const deptJobs = await Job.find({ departmentId: actorDept, isDeleted: false }).select('_id');
      filter.jobId = { $in: deptJobs.map((j) => j._id) };
    } else {
      filter.jobId = new mongoose.Types.ObjectId();
    }
  }

  const sort = query.sortByScore ? { aiScore: -1, createdAt: -1 } : { createdAt: -1 };

  return await paginate(Candidate, filter, {
    page: Math.max(1, parseInt(query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50)),
    sort,
    search: typeof query.search === 'string' ? query.search : '',
    searchFields: ['name', 'email', 'phone'],
    populate: [
      {
        path: 'jobId',
        select: 'title departmentId status',
        populate: { path: 'departmentId', select: 'name code' }
      },
      { path: 'referredBy', select: 'name employeeCode' }
    ]
  });
};

export const getCandidateById = async (id, actor = null, permissionScope = 'all') => {
  const candidate = await Candidate.findOne({ _id: id, isDeleted: false })
    .populate({
      path: 'jobId',
      select: 'title departmentId designationId employmentType location description requirements',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title code' }
      ]
    })
    .populate('referredBy', 'name employeeCode email')
    .populate('hiredEmployeeId', 'name employeeCode email');

  if (!candidate) {
    throw new ApiError(404, 'Candidate not found.');
  }

  // Department scope verification
  if (permissionScope === 'department' && actor) {
    const actorDept = await resolveActorDepartmentId(actor);
    const candDeptId = candidate.jobId?.departmentId?._id || candidate.jobId?.departmentId;
    if (actorDept && candDeptId && String(actorDept) !== String(candDeptId)) {
      throw new ApiError(403, 'Access denied. You can only view candidates within your assigned department.');
    }
  } else if (permissionScope === 'own' && actor) {
    const actorEmpId = actor.employeeId;
    if (!actorEmpId || String(candidate.referredBy?._id || candidate.referredBy) !== String(actorEmpId)) {
      throw new ApiError(403, 'Access denied. You can only view candidates you referred.');
    }
  }

  // Fetch candidate's interviews
  const interviews = await Interview.find({ candidateId: candidate._id, isDeleted: false })
    .populate('interviewers', 'name employeeCode email')
    .populate('scorecards.interviewerId', 'name employeeCode')
    .sort({ roundNumber: 1 });

  return { candidate, interviews };
};

export const updateCandidateStage = async (id, { stage, notes }, actor) => {
  const candidate = await Candidate.findOne({ _id: id, isDeleted: false });
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found.');
  }

  const validStages = ['Applied', 'Shortlisted', 'Interview', 'Technical_Test', 'Offer', 'Hired', 'Rejected'];
  if (!validStages.includes(stage)) {
    throw new ApiError(400, `Invalid stage '${stage}'.`);
  }

  candidate.stage = stage;
  candidate.stageHistory.push({
    stage,
    changedBy: actor._id,
    notes: notes || `Moved to ${stage}`,
    timestamp: new Date()
  });

  await candidate.save();

  await recordAuditLog({
    actor,
    action: 'recruitment.candidate.stage',
    entity: 'Candidate',
    entityId: candidate._id,
    after: { stage, notes }
  });

  return candidate;
};

export const deleteCandidate = async (candidateId, actor) => {
  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false });
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found.');
  }

  candidate.isDeleted = true;
  await candidate.save();

  // Cascade cancellation to scheduled interviews
  await Interview.updateMany(
    { candidateId: candidate._id, status: 'Scheduled', isDeleted: false },
    { $set: { status: 'Cancelled' } }
  );

  await recordAuditLog({
    actor,
    action: 'recruitment.candidate.delete',
    entity: 'Candidate',
    entityId: candidate._id,
    after: { isDeleted: true }
  });

  return { message: 'Candidate application deleted successfully.' };
};

// 15.6: Re-run AI Screening
export const screenCandidate = async (candidateId, actor) => {
  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false }).populate('jobId');
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found.');
  }

  const job = candidate.jobId;
  const parsed = await parseResumeText(candidate.cvText || candidate.name);
  const screening = await screenCandidateFit({
    parsedProfile: parsed,
    cvText: candidate.cvText,
    jobTitle: job.title,
    jobDescription: job.description,
    jobRequirements: job.requirements,
    minExperienceYears: job.minExperienceYears
  });

  candidate.aiScore = screening.aiScore;
  candidate.aiScreeningReason = screening.screeningSummary;
  candidate.parsedProfile = {
    ...parsed,
    matchingStrengths: screening.matchingStrengths,
    missingSkills: screening.missingSkills
  };
  candidate.parsingStatus = 'completed';

  await candidate.save();

  await recordAuditLog({
    actor,
    action: 'recruitment.candidate.screen',
    entity: 'Candidate',
    entityId: candidate._id,
    after: { aiScore: candidate.aiScore, aiScreeningReason: candidate.aiScreeningReason }
  });

  return candidate;
};

// =========================================================================
// 15.8: INTERVIEWS & SCORECARDS
// =========================================================================

export const scheduleInterview = async (candidateId, payload, actor) => {
  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false });
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found.');
  }

  // Anti-Collision Check: Prevent double-booking for the same candidate within +/- 45 minutes
  const targetDate = new Date(payload.scheduledDate);
  const targetStart = targetDate.getTime();
  const bufferMs = 45 * 60 * 1000;
  const conflictWindowStart = new Date(targetStart - bufferMs);
  const conflictWindowEnd = new Date(targetStart + bufferMs);

  const existingConflict = await Interview.findOne({
    candidateId,
    status: 'Scheduled',
    isDeleted: false,
    scheduledDate: { $gte: conflictWindowStart, $lte: conflictWindowEnd }
  });

  if (existingConflict) {
    const conflictTime = new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(existingConflict.scheduledDate));
    throw new ApiError(
      400,
      `Candidate already has an interview scheduled at ${conflictTime} (PKT). Please select a non-overlapping time.`
    );
  }

  const interview = await Interview.create({
    candidateId,
    jobId: candidate.jobId,
    roundNumber: payload.roundNumber || 1,
    roundType: payload.roundType || 'Technical',
    interviewers: payload.interviewers,
    scheduledDate: targetDate,
    durationMinutes: payload.durationMinutes || 45,
    meetingLink: payload.meetingLink || '',
    status: 'Scheduled'
  });

  // Advance stage to Interview if not already further
  if (['Applied', 'Shortlisted'].includes(candidate.stage)) {
    candidate.stage = 'Interview';
    candidate.stageHistory.push({
      stage: 'Interview',
      changedBy: actor._id,
      notes: `Scheduled Round ${interview.roundNumber} (${interview.roundType})`,
      timestamp: new Date()
    });
    await candidate.save();
  }

  // Notify interviewers
  try {
    const interviewerEmployees = await Employee.find({ _id: { $in: payload.interviewers } }).select('userId email name');
    const recipientUserIds = interviewerEmployees.map((e) => e.userId).filter(Boolean);

    if (recipientUserIds.length > 0) {
      await notify(recipientUserIds, {
        type: 'system',
        title: `Interview Scheduled: ${candidate.name}`,
        body: `Round ${interview.roundNumber} (${interview.roundType}) scheduled for ${targetDate.toLocaleString('en-PK')}.`,
        link: `/recruitment/pipeline`
      });
    }
  } catch (err) {
    console.error('Interview schedule notifications failed:', err.message);
  }

  // Dispatch candidate invitation email
  try {
    if (candidate.email) {
      const job = await Job.findById(candidate.jobId).select('title').lean();
      await emailService.sendInterviewScheduledEmail({
        to: candidate.email,
        candidateName: candidate.name,
        jobTitle: job?.title || 'Applied Position',
        roundNumber: interview.roundNumber,
        roundType: interview.roundType,
        scheduledDate: interview.scheduledDate,
        durationMinutes: interview.durationMinutes,
        meetingLink: interview.meetingLink
      });
    }
  } catch (emailErr) {
    console.error('Candidate interview email notification failed:', emailErr.message);
  }

  return interview;
};

export const submitScorecard = async (interviewId, scorecardData, actor) => {
  const interview = await Interview.findOne({ _id: interviewId, isDeleted: false });
  if (!interview) {
    throw new ApiError(404, 'Interview session not found.');
  }

  let interviewerEmpId = actor.employeeId;
  if (!interviewerEmpId) {
    const actorEmp = await Employee.findOne({ userId: actor._id });
    if (actorEmp) interviewerEmpId = actorEmp._id;
  }

  if (!interviewerEmpId) {
    throw new ApiError(400, 'Scorecard evaluator must be an active employee.');
  }

  // Immutability Check: Submitted ratings cannot be changed
  const existingScorecard = interview.scorecards?.find(
    (sc) => String(sc.interviewerId) === String(interviewerEmpId)
  );

  if (existingScorecard) {
    throw new ApiError(400, 'Interview evaluation is locked. Submitted ratings cannot be modified.');
  }

  interview.scorecards.push({
    interviewerId: interviewerEmpId,
    technicalRating: scorecardData.technicalRating,
    communicationRating: scorecardData.communicationRating,
    culturalRating: scorecardData.culturalRating,
    recommendation: scorecardData.recommendation,
    notes: scorecardData.notes || '',
    submittedAt: new Date()
  });

  if (interview.scorecards.length >= interview.interviewers.length) {
    interview.status = 'Completed';
  }

  await interview.save();
  return interview;
};

// =========================================================================
// 15.9: TECHNICAL TEST ASSIGNMENT
// =========================================================================

export const assignTechnicalTest = async (candidateId, { testUrl, instructions }, actor) => {
  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false }).populate('jobId');
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found.');
  }

  candidate.technicalTest = {
    testUrl,
    assignedDate: new Date(),
    status: 'Pending_Submission',
    notes: instructions || ''
  };

  candidate.stage = 'Technical_Test';
  candidate.stageHistory.push({
    stage: 'Technical_Test',
    changedBy: actor._id,
    notes: `Sent technical test link: ${testUrl}`,
    timestamp: new Date()
  });

  await candidate.save();

  // Send email to candidate
  try {
    await emailService.sendMail({
      to: candidate.email,
      subject: `Technical Assessment: ${candidate.jobId?.title || 'Job Opening'}`,
      text: `Dear ${candidate.name},\n\nPlease complete your technical assessment at the following link:\n${testUrl}\n\nInstructions: ${instructions || 'Please submit your code within 48 hours.'}\n\nBest regards,\nTalent Acquisition Team`
    });
  } catch (err) {
    console.error('Technical test email failed:', err.message);
  }

  return candidate;
};

// =========================================================================
// 15.10: OFFER MANAGEMENT
// =========================================================================

export const issueOfferLetter = async (candidateId, offerPayload, actor) => {
  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false }).populate('jobId');
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found.');
  }

  candidate.offerDetails = {
    baseSalaryPaisa: offerPayload.baseSalaryPaisa,
    joiningDate: new Date(offerPayload.joiningDate),
    allowances: offerPayload.allowances || [],
    letterUrl: `/api/v1/recruitment/candidates/${candidate._id}/offer/pdf`,
    issuedAt: new Date(),
    status: 'Issued'
  };

  candidate.stage = 'Offer';
  candidate.stageHistory.push({
    stage: 'Offer',
    changedBy: actor._id,
    notes: `Formal offer issued with Base Salary PKR ${(offerPayload.baseSalaryPaisa / 100).toLocaleString('en-PK')}`,
    timestamp: new Date()
  });

  await candidate.save();

  await recordAuditLog({
    actor,
    action: 'recruitment.offer.manage',
    entity: 'Candidate',
    entityId: candidate._id,
    after: candidate.offerDetails
  });

  // Dispatch formal offer letter email to candidate
  try {
    if (candidate.email) {
      const baseSalaryFormatted = ((offerPayload.baseSalaryPaisa || 0) / 100).toLocaleString('en-PK');
      const joiningDateFormatted = new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        dateStyle: 'full'
      }).format(new Date(candidate.offerDetails.joiningDate));

      await emailService.sendOfferLetterEmail({
        to: candidate.email,
        candidateName: candidate.name,
        jobTitle: candidate.jobId?.title || 'Offered Position',
        baseSalaryFormatted,
        joiningDateFormatted
      });
    }
  } catch (emailErr) {
    console.error('Candidate offer letter email notification failed:', emailErr.message);
  }

  return candidate;
};

// =========================================================================
// 15.11: ONE-CLICK HIRE TO M3 EMPLOYEE & M18 ONBOARDING
// =========================================================================

export const hireCandidate = async (candidateId, payload = {}, actor) => {
  // 1. Atomically claim candidate in 'Offer' stage to prevent double-click / concurrent race conditions
  const candidate = await Candidate.findOneAndUpdate(
    { _id: candidateId, stage: 'Offer', isDeleted: false },
    { $set: { stage: 'Hiring_In_Progress' } },
    { new: true }
  ).populate('jobId');

  if (!candidate) {
    const existing = await Candidate.findById(candidateId).lean();
    if (!existing || existing.isDeleted) {
      throw new ApiError(404, 'Candidate not found.');
    }
    if (existing.stage === 'Hired') {
      throw new ApiError(400, 'Candidate is already hired.');
    }
    if (existing.stage === 'Hiring_In_Progress') {
      throw new ApiError(409, 'Candidate hire conversion is already in progress. Please wait.');
    }
    throw new ApiError(400, `Cannot hire candidate in stage '${existing.stage}'. Candidate must be in 'Offer' stage.`);
  }

  const job = candidate.jobId;
  if (!job) {
    await Candidate.updateOne({ _id: candidateId }, { $set: { stage: 'Offer' } });
    throw new ApiError(400, 'Candidate must be linked to a valid job opening.');
  }

  // 2. Prepare Employee payload for Module M3 createEmployee
  const salaryPaisa = payload.initialSalaryPaisa || candidate.offerDetails?.baseSalaryPaisa || job.minSalaryPaisa || 5000000;
  const joiningDate = payload.joiningDate || candidate.offerDetails?.joiningDate || new Date();

  // Map job employment type to Employee schema enum ('Permanent', 'Contract', 'Intern', 'Probation')
  let empEmploymentType = 'Probation';
  if (job.employmentType === 'Contract') empEmploymentType = 'Contract';
  else if (job.employmentType === 'Internship') empEmploymentType = 'Intern';
  else if (job.employmentType === 'Full-time' || job.employmentType === 'Permanent') empEmploymentType = 'Probation';

  const newEmployeeData = {
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    cnic: payload.cnic || '35202-1234567-1',
    departmentId: job.departmentId,
    designationId: job.designationId,
    employmentType: empEmploymentType,
    joiningDate,
    status: 'Active',
    managerId: payload.managerId || null,
    salaryDetails: {
      basicSalaryPaisa: salaryPaisa
    },
    skills: candidate.parsedProfile?.parsedSkills || []
  };

  let newEmployee;
  try {
    // 3. Invoke M3 createEmployee (handles employeeCode, leaves, and M18 onboarding)
    newEmployee = await employeeService.createEmployee(newEmployeeData, actor);
  } catch (err) {
    // Revert atomic lock on failure
    await Candidate.updateOne({ _id: candidateId }, { $set: { stage: 'Offer' } });
    throw err;
  }

  // 4. Update Candidate record to Hired
  candidate.stage = 'Hired';
  candidate.hiredEmployeeId = newEmployee._id;
  candidate.stageHistory.push({
    stage: 'Hired',
    changedBy: actor._id,
    notes: `Converted to active employee (${newEmployee.employeeCode})`,
    timestamp: new Date()
  });

  await candidate.save();

  await recordAuditLog({
    actor,
    action: 'recruitment.hire',
    entity: 'Candidate',
    entityId: candidate._id,
    after: { stage: 'Hired', hiredEmployeeId: newEmployee._id }
  });

  return { candidate, employee: newEmployee };
};

// =========================================================================
// 15.12: INTERNAL MOBILITY & EMPLOYEE REFERRALS
// =========================================================================

export const getInternalJobs = async (query = {}) => {
  return await paginate(Job, { status: 'Published', isDeleted: false }, {
    page: query.page || 1,
    limit: query.limit || 20,
    sort: { createdAt: -1 },
    search: query.search,
    searchFields: ['title', 'description', 'location'],
    populate: [
      { path: 'departmentId', select: 'name code' },
      { path: 'designationId', select: 'title code' }
    ]
  });
};

export const submitReferral = async (referralData, file, actor) => {
  let referrerEmployeeId = actor.employeeId;
  if (!referrerEmployeeId) {
    const actorEmp = await Employee.findOne({ userId: actor._id, isDeleted: false });
    if (actorEmp) referrerEmployeeId = actorEmp._id;
  }

  const candidate = await applyForJob(referralData.jobId, referralData, file);
  candidate.referredBy = referrerEmployeeId;
  candidate.referralNotes = referralData.referralNotes || '';
  await candidate.save();

  await recordAuditLog({
    actor,
    action: 'recruitment.referral.submit',
    entity: 'Candidate',
    entityId: candidate._id,
    after: { referredBy: referrerEmployeeId, notes: candidate.referralNotes }
  });

  return candidate;
};

export const getMyReferrals = async (actor) => {
  let referrerEmployeeId = actor?.employeeId;
  if (!referrerEmployeeId && actor?._id) {
    const actorEmp = await Employee.findOne({ userId: actor._id, isDeleted: false });
    if (actorEmp) referrerEmployeeId = actorEmp._id;
  }

  if (!referrerEmployeeId) {
    return [];
  }

  return await Candidate.find({
    referredBy: referrerEmployeeId,
    isDeleted: false
  })
    .populate({
      path: 'jobId',
      select: 'title departmentId status',
      populate: { path: 'departmentId', select: 'name code' }
    })
    .sort({ createdAt: -1 })
    .lean();
};
