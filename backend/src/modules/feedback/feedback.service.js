/**
 * @file feedback.service.js
 * @description Core Domain Service for Module M21: Anonymous Feedback & Grievance (BUILD-GUIDE Section 28).
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import { Feedback } from '../../models/feedback.model.js';
import { User } from '../../models/user.model.js';
import { Department } from '../../models/department.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { notify } from '../../services/notify.service.js';

/**
 * Generate a collision-resistant tracking code (e.g. TRK-A8F2C1)
 */
async function generateUniqueTrackingCode() {
  let attempts = 0;
  while (attempts < 10) {
    const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `TRK-${hex}`;
    const exists = await Feedback.exists({ trackingCode: code });
    if (!exists) return code;
    attempts++;
  }
  // Fallback with timestamp bytes
  return `TRK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/**
 * 21.1: Submit feedback or grievance
 * Invariant: If isAnonymous is true, submittedBy and initial case note authorId
 * are strictly sanitized to prevent any user identity leakage.
 */
export async function submitFeedback(data, user) {
  const { title, description, category, priority, isAnonymous, departmentId, attachments } = data;

  let feedback;
  let trackingCode;
  let attempts = 0;
  while (attempts < 3) {
    try {
      trackingCode = await generateUniqueTrackingCode();
      const initialAuthorId = isAnonymous
        ? new mongoose.Types.ObjectId()
        : (user?._id || new mongoose.Types.ObjectId());

      feedback = await Feedback.create({
        title,
        description,
        category,
        priority: priority || 'Medium',
        isAnonymous: Boolean(isAnonymous),
        trackingCode,
        submittedBy: isAnonymous ? null : (user?._id || null),
        departmentId: departmentId || null,
        attachments: attachments || [],
        status: 'Submitted',
        caseNotes: [
          {
            note: `Case registered in category: ${category}.`,
            authorId: initialAuthorId,
            authorRole: isAnonymous ? 'Anonymous Complainant' : (user?.role?.name || user?.role || 'Complainant'),
            isPublicToComplainant: true,
            createdAt: new Date()
          }
        ]
      });
      break;
    } catch (err) {
      if (err.code === 11000 && attempts < 2) {
        attempts++;
        continue;
      }
      throw err;
    }
  }

  // If case is Harassment, dispatch alert to Super Admin / Committee
  if (category === 'Harassment') {
    try {
      const superAdmins = await User.find({ role: 'Super Admin', isActive: true }).select('_id');
      for (const admin of superAdmins) {
        await notify(admin._id, {
          type: 'system',
          title: 'Urgent: Harassment Complaint Filed',
          body: `A new harassment complaint (${trackingCode}) has been filed and quarantined.`,
          link: '/feedback/committee'
        });
      }
    } catch {
      // Notification failure shouldn't fail grievance creation
    }
  }

  return {
    _id: feedback._id,
    trackingCode: feedback.trackingCode,
    title: feedback.title,
    category: feedback.category,
    priority: feedback.priority,
    status: feedback.status,
    isAnonymous: feedback.isAnonymous,
    createdAt: feedback.createdAt
  };
}

function isUserSuperAdmin(user) {
  if (!user) return false;
  const roles = user.roles || [];
  return (
    user.role === 'Super Admin' ||
    user.role?.name === 'Super Admin' ||
    roles.some((r) => r === 'Super Admin' || r?.name === 'Super Admin')
  );
}

function isUserDepartmentManager(user) {
  if (!user) return false;
  if (isUserSuperAdmin(user)) return false;
  const roleName = user.role?.name || user.role || '';
  if (roleName === 'Department Manager') return true;
  const roles = user.roles || [];
  return roles.some((r) => (r?.name || r) === 'Department Manager');
}

function escapeRegex(string) {
  return typeof string === 'string' ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
}

function getUserRoleName(user) {
  return (
    user?.role?.name ||
    user?.role ||
    (Array.isArray(user?.roles) ? user.roles[0]?.name || user.roles[0] : '') ||
    'Investigator'
  );
}

/**
 * 21.2 & 21.3 & 21.6: List feedback / grievances with isolation rules
 */
export async function getFeedbackList(filterQuery, user, hasCommitteePermission) {
  // 21.6: Department Manager Isolation Rule (FRD Section 11: None)
  if (isUserDepartmentManager(user)) {
    throw new ApiError(403, 'Access denied: Department Managers have no access to grievance administration');
  }

  const { page = 1, limit = 20, status, category, priority, isEscalated, search } = filterQuery;
  const skip = (page - 1) * limit;

  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (isEscalated !== undefined) filter.isEscalated = isEscalated;

  // 21.3: Harassment quarantine rule
  const isSuperAdmin = isUserSuperAdmin(user);
  const canSeeHarassment = isSuperAdmin || hasCommitteePermission;

  if (category) {
    if (category === 'Harassment' && !canSeeHarassment) {
      throw new ApiError(403, 'Access denied: Harassment complaints are restricted to the Inquiry Committee');
    }
    filter.category = category;
  } else if (!canSeeHarassment) {
    // Automatically filter out Harassment complaints for non-committee viewers
    filter.category = { $ne: 'Harassment' };
  }

  if (search && search.trim()) {
    const safeRegex = escapeRegex(search.trim());
    filter.$or = [
      { title: { $regex: safeRegex, $options: 'i' } },
      { trackingCode: { $regex: safeRegex, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .populate('submittedBy', 'name email employeeCode')
      .populate('departmentId', 'name')
      .populate('resolvedBy', 'name email')
      .populate('caseNotes.authorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(filter)
  ]);

  return {
    items,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Retrieve single feedback by ID with security checks
 */
export async function getFeedbackById(id, user, hasCommitteePermission) {
  // 21.6: Department Manager Isolation
  if (isUserDepartmentManager(user)) {
    throw new ApiError(403, 'Access denied: Department Managers have no access to grievance administration');
  }

  const feedback = await Feedback.findById(id)
    .populate('submittedBy', 'name email employeeCode')
    .populate('departmentId', 'name')
    .populate('resolvedBy', 'name email')
    .populate('caseNotes.authorId', 'name email')
    .lean();

  if (!feedback) {
    throw new ApiError(404, 'Feedback/Grievance case not found');
  }

  // 21.3: Harassment Quarantine Check
  const isSuperAdmin = isUserSuperAdmin(user);
  const canSeeHarassment = isSuperAdmin || hasCommitteePermission;

  if (feedback.category === 'Harassment' && !canSeeHarassment) {
    throw new ApiError(403, 'Access denied: Harassment complaints are restricted to the Inquiry Committee');
  }

  return feedback;
}

/**
 * 21.4: Public or authenticated lookup by confidential tracking code
 */
export async function getTrackedFeedbackByCode(code) {
  if (!code || typeof code !== 'string') {
    throw new ApiError(400, 'Valid tracking code is required');
  }

  const formattedCode = String(code).trim().toUpperCase();
  const feedback = await Feedback.findOne({ trackingCode: formattedCode })
    .populate('departmentId', 'name')
    .lean();

  if (!feedback) {
    throw new ApiError(404, 'No grievance found with this tracking code');
  }

  // Sanitize: never reveal submittedBy or non-public case notes
  const publicNotes = (feedback.caseNotes || [])
    .filter((n) => n.isPublicToComplainant)
    .map((n) => ({
      _id: n._id,
      note: n.note,
      authorRole: n.authorRole || 'Investigator',
      createdAt: n.createdAt
    }));

  return {
    trackingCode: feedback.trackingCode,
    title: feedback.title,
    description: feedback.description,
    category: feedback.category,
    priority: feedback.priority,
    status: feedback.status,
    isAnonymous: feedback.isAnonymous,
    departmentName: feedback.departmentId?.name || null,
    resolutionNote: feedback.resolutionNote || '',
    resolvedAt: feedback.resolvedAt,
    isEscalated: feedback.isEscalated,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
    caseNotes: publicNotes
  };
}

/**
 * 21.2: Update case status and optional resolution note
 */
export async function updateFeedbackStatus(id, updateData, user, hasCommitteePermission) {
  if (isUserDepartmentManager(user)) {
    throw new ApiError(403, 'Access denied: Department Managers have no access to grievance administration');
  }

  const roleName = getUserRoleName(user);
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new ApiError(404, 'Case not found');
  }

  const isSuperAdmin = isUserSuperAdmin(user);
  const canSeeHarassment = isSuperAdmin || hasCommitteePermission;

  if (feedback.category === 'Harassment' && !canSeeHarassment) {
    throw new ApiError(403, 'Access denied: Harassment complaints are restricted to the Inquiry Committee');
  }

  const prevStatus = feedback.status;
  const { status, resolutionNote } = updateData;

  feedback.status = status;

  if (['Resolved', 'Dismissed'].includes(status)) {
    feedback.resolvedAt = new Date();
    feedback.resolvedBy = user._id;
    if (resolutionNote) {
      feedback.resolutionNote = resolutionNote;
    }
  }

  // Append audit note in case timeline
  feedback.caseNotes.push({
    note: `Status updated from "${prevStatus}" to "${status}".${resolutionNote ? ` Note: ${resolutionNote}` : ''}`,
    authorId: user._id,
    authorRole: roleName || 'Investigator',
    isPublicToComplainant: true,
    createdAt: new Date()
  });

  await feedback.save();

  // Audit log entry
  try {
    await AuditLog.create({
      userId: user._id,
      action: 'UPDATE_GRIEVANCE_STATUS',
      entity: 'Feedback',
      entityId: feedback._id,
      before: { status: prevStatus },
      after: { status, resolutionNote }
    });
  } catch {
    // Non-blocking audit log
  }

  return feedback;
}

/**
 * 21.2: Add investigation case note
 */
export async function addCaseNote(id, noteData, user, hasCommitteePermission) {
  if (isUserDepartmentManager(user)) {
    throw new ApiError(403, 'Access denied: Department Managers have no access to grievance administration');
  }

  const roleName = getUserRoleName(user);
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new ApiError(404, 'Case not found');
  }

  const isSuperAdmin = isUserSuperAdmin(user);
  const canSeeHarassment = isSuperAdmin || hasCommitteePermission;

  if (feedback.category === 'Harassment' && !canSeeHarassment) {
    throw new ApiError(403, 'Access denied: Harassment complaints are restricted to the Inquiry Committee');
  }

  const { note, isPublicToComplainant = true } = noteData;

  feedback.caseNotes.push({
    note,
    authorId: user._id,
    authorRole: roleName || 'Investigator',
    isPublicToComplainant: Boolean(isPublicToComplainant),
    createdAt: new Date()
  });

  await feedback.save();
  return feedback;
}

/**
 * 21.5: Escalate case to Super Admin
 */
export async function escalateFeedback(id, escalateData, user) {
  if (isUserDepartmentManager(user)) {
    throw new ApiError(403, 'Access denied: Department Managers have no access to grievance administration');
  }

  const roleName = getUserRoleName(user);
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new ApiError(404, 'Case not found');
  }

  const { reason } = escalateData;

  feedback.isEscalated = true;
  feedback.status = 'Escalated';
  feedback.escalationDetails = {
    escalatedBy: user._id,
    escalatedAt: new Date(),
    reason
  };

  feedback.caseNotes.push({
    note: `Case escalated to Super Admin. Reason: ${reason}`,
    authorId: user._id,
    authorRole: roleName || 'HR',
    isPublicToComplainant: true,
    createdAt: new Date()
  });

  await feedback.save();

  // Notify Super Admins
  try {
    const superAdmins = await User.find({ role: 'Super Admin', isActive: true }).select('_id');
    for (const admin of superAdmins) {
      await notify(admin._id, {
        type: 'system',
        title: 'Grievance Escalated to Super Admin',
        body: `Case ${feedback.trackingCode} ("${feedback.title}") has been escalated: ${reason}`,
        link: '/feedback/admin'
      });
    }
  } catch {
    // Non-blocking
  }

  return feedback;
}

/**
 * List submissions by currently logged-in user (named only)
 */
export async function getMySubmissions(user, query) {
  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const filter = { submittedBy: user._id };

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(filter)
  ]);

  return {
    items,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Summary metrics for dashboard
 */
export async function getGrievanceStats(user, hasCommitteePermission) {
  if (isUserDepartmentManager(user)) {
    throw new ApiError(403, 'Access denied: Department Managers have no access to grievance administration');
  }

  const isSuperAdmin = isUserSuperAdmin(user);
  const canSeeHarassment = isSuperAdmin || hasCommitteePermission;

  const baseFilter = canSeeHarassment ? {} : { category: { $ne: 'Harassment' } };

  const [total, submitted, underReview, inInvestigation, resolved, escalated, byCategory] = await Promise.all([
    Feedback.countDocuments(baseFilter),
    Feedback.countDocuments({ ...baseFilter, status: 'Submitted' }),
    Feedback.countDocuments({ ...baseFilter, status: 'Under Review' }),
    Feedback.countDocuments({ ...baseFilter, status: 'In Investigation' }),
    Feedback.countDocuments({ ...baseFilter, status: 'Resolved' }),
    Feedback.countDocuments({ ...baseFilter, isEscalated: true }),
    Feedback.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
  ]);

  return {
    total,
    submitted,
    underReview,
    inInvestigation,
    resolved,
    escalated,
    byCategory: byCategory.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {})
  };
}
