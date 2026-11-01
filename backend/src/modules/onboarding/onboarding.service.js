/**
 * @file onboarding.service.js
 * @description Core Domain Service for Employee Lifecycle (M18 Onboarding & Offboarding).
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.1 to 18.11)
 * - Security: PBAC Scoped Access Control & Field-Level Audit Trails.
 * - Integrations: Asset Clearance assertion (M23), Email Service (M2), PDFKit streaming.
 */

import PDFDocument from 'pdfkit';
import ChecklistTemplate from '../../models/checklistTemplate.model.js';
import Checklist from '../../models/checklist.model.js';
import Resignation from '../../models/resignation.model.js';
import ExitInterview from '../../models/exitInterview.model.js';
import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';
import { Department } from '../../models/department.model.js';
import { Role } from '../../models/role.model.js';
import { ApiError } from '../../utils/apiError.js';
import { recordAuditLog } from '../../services/audit.service.js';
import { emailService } from '../../services/email.service.js';
import { notify } from '../../services/notify.service.js';
import { assertEmployeeAssetClearance } from '../assets/asset.service.js';

// =========================================================================
// SLICE 1: CHECKLIST TEMPLATE MASTER AUTHORING (18.1)
// =========================================================================

export const createChecklistTemplate = async ({ templateData, user, ipAddress, userAgent }) => {
  const normalizedName = templateData.name.trim();

  const existing = await ChecklistTemplate.findOne({
    name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    isDeleted: false
  });

  if (existing) {
    throw new ApiError(409, `Checklist template '${normalizedName}' already exists`);
  }

  const template = await ChecklistTemplate.create({
    ...templateData,
    name: normalizedName,
    createdBy: user._id
  });

  await recordAuditLog({
    actorId: user._id,
    action: 'onboard.manage',
    module: 'onboarding',
    resource: 'ChecklistTemplate',
    resourceId: template._id,
    after: template.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return template;
};

export const getChecklistTemplates = async ({ filters = {}, user }) => {
  const query = { isDeleted: false };

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.departmentId) {
    query.departmentId = filters.departmentId;
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === 'true' || filters.isActive === true;
  }

  const templates = await ChecklistTemplate.find(query)
    .populate('departmentId', 'name code')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  return templates;
};

export const getChecklistTemplateById = async (id) => {
  const template = await ChecklistTemplate.findOne({ _id: id, isDeleted: false })
    .populate('departmentId', 'name code')
    .populate('createdBy', 'name email');

  if (!template) {
    throw new ApiError(404, 'Checklist template not found');
  }

  return template;
};

export const updateChecklistTemplate = async ({ id, updateData, user, ipAddress, userAgent }) => {
  const template = await ChecklistTemplate.findOne({ _id: id, isDeleted: false });

  if (!template) {
    throw new ApiError(404, 'Checklist template not found');
  }

  if (updateData.name && updateData.name.trim().toLowerCase() !== template.name.toLowerCase()) {
    const duplicate = await ChecklistTemplate.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
      isDeleted: false
    });
    if (duplicate) {
      throw new ApiError(409, `A checklist template named '${updateData.name.trim()}' already exists`);
    }
    template.name = updateData.name.trim();
  }

  const before = template.toObject();

  if (updateData.type !== undefined) template.type = updateData.type;
  if (updateData.departmentId !== undefined) template.departmentId = updateData.departmentId;
  if (updateData.tasks !== undefined) template.tasks = updateData.tasks;
  if (updateData.isActive !== undefined) template.isActive = updateData.isActive;

  await template.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'onboard.manage',
    module: 'onboarding',
    resource: 'ChecklistTemplate',
    resourceId: template._id,
    before,
    after: template.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return template;
};

export const deleteChecklistTemplate = async ({ id, user, ipAddress, userAgent }) => {
  const template = await ChecklistTemplate.findOne({ _id: id, isDeleted: false });

  if (!template) {
    throw new ApiError(404, 'Checklist template not found');
  }

  const before = template.toObject();
  template.isDeleted = true;
  await template.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'onboard.manage',
    module: 'onboarding',
    resource: 'ChecklistTemplate',
    resourceId: template._id,
    before,
    after: { isDeleted: true },
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return { message: 'Checklist template deleted successfully' };
};

// =========================================================================
// SLICE 2: AUTOMATED ONBOARDING CHECKLIST INGESTION (18.2)
// =========================================================================

export const initOnboardingForEmployee = async ({ employee, templateId }) => {
  let template = null;
  if (templateId) {
    template = await ChecklistTemplate.findOne({ _id: templateId, isDeleted: false });
  } else if (employee.departmentId) {
    template = await ChecklistTemplate.findOne({
      type: 'onboarding',
      departmentId: employee.departmentId,
      isActive: true,
      isDeleted: false
    });
  }

  if (!template) {
    template = await ChecklistTemplate.findOne({
      type: 'onboarding',
      departmentId: null,
      isActive: true,
      isDeleted: false
    });
  }

  const rawTasks = template?.tasks?.length
    ? template.tasks
    : [
        {
          title: 'Complete Employee Profile & Emergency Contacts',
          description: 'Fill in personal details, emergency contacts, and bank info.',
          category: 'hr',
          roleAssignee: 'employee',
          dueDaysOffset: 1,
          isMandatory: true
        },
        {
          title: 'Provision Corporate Workstation & Credentials',
          description: 'Setup company laptop, work email, and access permissions.',
          category: 'it',
          roleAssignee: 'it_admin',
          dueDaysOffset: 0,
          isMandatory: true
        },
        {
          title: 'Team Orientation & Sprint Introduction',
          description: 'Meet manager and team, review ongoing sprints and expectations.',
          category: 'department',
          roleAssignee: 'manager',
          dueDaysOffset: 3,
          isMandatory: true
        }
      ];

  // Resolve Manager User
  let managerUserId = null;
  if (employee.managerId) {
    const mgrEmp = await Employee.findById(employee.managerId).select('userId');
    if (mgrEmp?.userId) managerUserId = mgrEmp.userId;
  }
  if (!managerUserId && employee.departmentId) {
    const dept = await Department.findById(employee.departmentId).populate('departmentHead');
    if (dept?.departmentHead?.userId) {
      managerUserId = dept.departmentHead.userId;
    }
  }

  // Resolve HR User
  const hrRole = await Role.findOne({ name: 'HR Manager' });
  const hrUser = hrRole ? await User.findOne({ roles: hrRole._id, isActive: true }) : null;

  // Resolve IT Admin
  const saRole = await Role.findOne({ name: 'Super Admin' });
  const itUser = saRole ? await User.findOne({ roles: saRole._id, isActive: true }) : null;

  const startDate = employee.joiningDate ? new Date(employee.joiningDate) : new Date();

  const instantiatedTasks = rawTasks.map((t) => {
    let ownerId = null;
    if (t.roleAssignee === 'employee') {
      ownerId = employee.userId || null;
    } else if (t.roleAssignee === 'manager') {
      ownerId = managerUserId;
    } else if (t.roleAssignee === 'hr') {
      ownerId = hrUser?._id || null;
    } else if (t.roleAssignee === 'it_admin') {
      ownerId = itUser?._id || hrUser?._id || null;
    }

    const offsetDays = typeof t.dueDaysOffset === 'number' ? t.dueDaysOffset : 0;
    const dueDate = new Date(startDate.getTime() + offsetDays * 86400000);

    return {
      title: t.title,
      description: t.description || '',
      category: t.category || 'hr',
      roleAssignee: t.roleAssignee || 'employee',
      ownerId,
      dueDate,
      completed: false
    };
  });

  const checklist = await Checklist.create({
    employeeId: employee._id,
    templateId: template?._id || null,
    type: 'onboarding',
    status: 'in_progress',
    startDate,
    progressPercent: 0,
    tasks: instantiatedTasks
  });

  return checklist;
};

export const getOnboardings = async ({ query = {}, user }) => {
  const filter = { type: query.type || 'onboarding', isDeleted: false };
  if (query.status) {
    filter.status = query.status;
  }

  const userRoles = user.roles?.map((r) => r.name || r) || [];
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isHR = userRoles.includes('HR Manager');
  const isDeptManager = userRoles.includes('Department Manager');

  if (isSuperAdmin || isHR) {
    // HR & Admin see all
  } else if (isDeptManager) {
    const mgrEmp = await Employee.findOne({ userId: user._id });
    if (mgrEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: mgrEmp.departmentId }).select('_id');
      filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
    } else if (mgrEmp) {
      const subordinates = await Employee.find({ managerId: mgrEmp._id }).select('_id');
      filter.employeeId = { $in: subordinates.map((e) => e._id) };
    }
  } else {
    const emp = await Employee.findOne({ userId: user._id }).select('_id');
    if (emp) {
      filter.employeeId = emp._id;
    } else {
      return [];
    }
  }

  const checklists = await Checklist.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode workEmail departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate('templateId', 'name')
    .sort({ createdAt: -1 });

  return checklists;
};

export const getOnboardingById = async (id, user) => {
  const checklist = await Checklist.findOne({ _id: id, isDeleted: false })
    .populate({
      path: 'employeeId',
      select: 'name firstName lastName employeeCode workEmail departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate('templateId', 'name')
    .populate('tasks.ownerId', 'name email')
    .populate('tasks.completedBy', 'name email');

  if (!checklist) {
    throw new ApiError(404, 'Checklist instance not found');
  }

  return checklist;
};

// =========================================================================
// SLICE 3: TASK OWNERSHIP & COMPLETION TRACKING (18.3)
// =========================================================================

export const getMyAssignedTasks = async ({ user }) => {
  const emp = await Employee.findOne({ userId: user._id });

  const query = {
    isDeleted: false,
    $or: [
      { 'tasks.ownerId': user._id }
    ]
  };

  if (emp) {
    query.$or.push({
      employeeId: emp._id,
      'tasks.roleAssignee': 'employee'
    });
  }

  const checklists = await Checklist.find(query).populate('employeeId', 'name employeeCode');

  const myTasks = [];
  for (const chk of checklists) {
    for (const t of chk.tasks) {
      const isOwner =
        (t.ownerId && t.ownerId.toString() === user._id.toString()) ||
        (emp && chk.employeeId?._id?.toString() === emp._id.toString() && t.roleAssignee === 'employee');

      if (isOwner) {
        myTasks.push({
          _id: t._id,
          checklistId: chk._id,
          employeeName: chk.employeeId?.name || 'Employee',
          title: t.title,
          description: t.description,
          category: t.category,
          roleAssignee: t.roleAssignee,
          dueDate: t.dueDate,
          completed: t.completed,
          completedAt: t.completedAt,
          notes: t.notes
        });
      }
    }
  }

  // Sort by dueDate ascending
  myTasks.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return myTasks;
};

export const completeChecklistTask = async ({ taskId, user, notes = '', ipAddress, userAgent }) => {
  const checklist = await Checklist.findOne({
    'tasks._id': taskId,
    isDeleted: false
  });

  if (!checklist) {
    throw new ApiError(404, 'Checklist task not found');
  }

  const task = checklist.tasks.id(taskId);
  if (!task) {
    throw new ApiError(404, 'Task item not found');
  }

  const userRoles = user.roles?.map((r) => r.name || r) || [];
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isHR = userRoles.includes('HR Manager');

  // Verify ownership if not HR/Admin
  if (!isSuperAdmin && !isHR) {
    const isOwner = task.ownerId && task.ownerId.toString() === user._id.toString();
    const emp = await Employee.findOne({ userId: user._id });
    const isSelfTask = emp && checklist.employeeId.toString() === emp._id.toString() && task.roleAssignee === 'employee';

    if (!isOwner && !isSelfTask) {
      throw new ApiError(403, 'You do not have permission to mark this task as completed');
    }
  }

  task.completed = true;
  task.completedAt = new Date();
  task.completedBy = user._id;
  if (notes) task.notes = notes;

  const totalTasks = checklist.tasks.length;
  const completedTasks = checklist.tasks.filter((t) => t.completed).length;
  checklist.progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  if (completedTasks === totalTasks) {
    checklist.status = 'completed';
    checklist.completedDate = new Date();
  } else if (checklist.status === 'pending') {
    checklist.status = 'in_progress';
  }

  await checklist.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'onboard.manage',
    module: 'onboarding',
    resource: 'Checklist',
    resourceId: checklist._id,
    after: { taskId, taskTitle: task.title, progressPercent: checklist.progressPercent },
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return { checklist, task };
};

// =========================================================================
// SLICE 4 & 5: RESIGNATION SUBMISSION & DECISION (18.5, 18.6)
// =========================================================================

export const submitResignation = async ({ resignationData, user, ipAddress, userAgent }) => {
  const employee = await Employee.findOne({ userId: user._id });
  if (!employee) {
    throw new ApiError(404, 'No employee record linked to current user account');
  }

  // Check duplicate active resignation
  const activeResignation = await Resignation.findOne({
    employeeId: employee._id,
    status: { $in: ['submitted', 'accepted'] },
    isDeleted: false
  });

  if (activeResignation) {
    throw new ApiError(400, 'An active resignation is already in progress');
  }

  const resignation = await Resignation.create({
    employeeId: employee._id,
    intendedLastWorkingDay: new Date(resignationData.intendedLastWorkingDay),
    reason: resignationData.reason,
    comments: resignationData.comments || '',
    submissionDate: new Date(),
    status: 'submitted'
  });

  // Notify HR Managers
  const hrRole = await Role.findOne({ name: 'HR Manager' });
  if (hrRole) {
    const hrUsers = await User.find({ roles: hrRole._id, isActive: true }).select('_id');
    if (hrUsers.length > 0) {
      await notify(hrUsers.map((u) => u._id), {
        title: 'New Resignation Submitted',
        body: `${employee.name} has submitted a formal resignation.`,
        type: 'system'
      }).catch((err) => console.error('[Notify Error]', err.message));
    }
  }

  await recordAuditLog({
    actorId: user._id,
    action: 'resignation.submit',
    module: 'onboarding',
    resource: 'Resignation',
    resourceId: resignation._id,
    after: resignation.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return resignation;
};

export const getMyResignation = async ({ user }) => {
  const employee = await Employee.findOne({ userId: user._id });
  if (!employee) return null;

  const resignation = await Resignation.findOne({
    employeeId: employee._id,
    isDeleted: false
  }).sort({ createdAt: -1 });

  return resignation;
};

export const getResignations = async ({ query = {}, user }) => {
  const filter = { isDeleted: false };
  if (query.status) {
    filter.status = query.status;
  }

  const userRoles = user.roles?.map((r) => r.name || r) || [];
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isHR = userRoles.includes('HR Manager');
  const isDeptManager = userRoles.includes('Department Manager');

  if (isSuperAdmin || isHR) {
    // view all
  } else if (isDeptManager) {
    const mgrEmp = await Employee.findOne({ userId: user._id });
    if (mgrEmp?.departmentId) {
      const deptEmployees = await Employee.find({ departmentId: mgrEmp.departmentId }).select('_id');
      filter.employeeId = { $in: deptEmployees.map((e) => e._id) };
    } else if (mgrEmp) {
      const subordinates = await Employee.find({ managerId: mgrEmp._id }).select('_id');
      filter.employeeId = { $in: subordinates.map((e) => e._id) };
    }
  } else {
    const emp = await Employee.findOne({ userId: user._id });
    if (emp) {
      filter.employeeId = emp._id;
    } else {
      return [];
    }
  }

  const resignations = await Resignation.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name employeeCode workEmail departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .populate('decidedBy', 'name email')
    .sort({ submissionDate: -1 });

  return resignations;
};

export const decideResignation = async ({ id, decisionData, user, ipAddress, userAgent }) => {
  const resignation = await Resignation.findOne({ _id: id, isDeleted: false });
  if (!resignation) {
    throw new ApiError(404, 'Resignation record not found');
  }

  const userRoles = user.roles?.map((r) => r.name || r) || [];
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isHR = userRoles.includes('HR Manager');
  const isDeptManager = userRoles.includes('Department Manager');

  // Verify Dept Manager scope
  if (isDeptManager && !isSuperAdmin && !isHR) {
    const mgrEmp = await Employee.findOne({ userId: user._id });
    const targetEmp = await Employee.findById(resignation.employeeId);
    if (!targetEmp || !mgrEmp || targetEmp.departmentId?.toString() !== mgrEmp.departmentId?.toString()) {
      throw new ApiError(403, 'You may only review resignations within your department');
    }
  }

  const before = resignation.toObject();

  resignation.status = decisionData.status;
  resignation.decidedBy = user._id;
  resignation.decidedAt = new Date();

  if (decisionData.status === 'accepted') {
    resignation.officialLastWorkingDay = new Date(decisionData.officialLastWorkingDay);
    if (decisionData.handoverEmployeeId) {
      resignation.handoverEmployeeId = decisionData.handoverEmployeeId;
    }
    // Transition employee status to 'Notice'
    await Employee.findByIdAndUpdate(resignation.employeeId, { status: 'Notice' });

    // Auto-instantiate Offboarding Checklist
    await initOffboardingForEmployee({ employeeId: resignation.employeeId });
  } else if (decisionData.status === 'rejected') {
    resignation.rejectionReason = decisionData.rejectionReason || '';
  }

  if (decisionData.comments) {
    resignation.comments = (resignation.comments ? resignation.comments + '\n' : '') + decisionData.comments;
  }

  await resignation.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'offboard.manage',
    module: 'onboarding',
    resource: 'Resignation',
    resourceId: resignation._id,
    before,
    after: resignation.toObject(),
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return resignation;
};

// =========================================================================
// SLICE 6: CROSS-DEPARTMENTAL EXIT CLEARANCE (18.7)
// =========================================================================

export const initOffboardingForEmployee = async ({ employeeId }) => {
  const existing = await Checklist.findOne({
    employeeId,
    type: 'offboarding',
    isDeleted: false
  });
  if (existing) return existing;

  const employee = await Employee.findById(employeeId);
  if (!employee) return null;

  let template = await ChecklistTemplate.findOne({
    type: 'offboarding',
    departmentId: employee.departmentId,
    isActive: true,
    isDeleted: false
  });

  if (!template) {
    template = await ChecklistTemplate.findOne({
      type: 'offboarding',
      departmentId: null,
      isActive: true,
      isDeleted: false
    });
  }

  const defaultOffboardTasks = template?.tasks?.length
    ? template.tasks
    : [
        {
          title: 'Return Laptop, Access Card & Hardware Tokens',
          description: 'Custody transfer of company physical assets to IT inventory.',
          category: 'it',
          roleAssignee: 'it_admin',
          dueDaysOffset: 0
        },
        {
          title: 'Final Travel & Expense Reimbursement Settlement',
          description: 'Clear pending expense claims and advance balances.',
          category: 'finance',
          roleAssignee: 'hr',
          dueDaysOffset: 0
        },
        {
          title: 'Project Handover & Documentation Sign-off',
          description: 'Handover repository branches, credentials, and work documents.',
          category: 'department',
          roleAssignee: 'manager',
          dueDaysOffset: 0
        },
        {
          title: 'Exit Clearance & Final Payroll Clearance',
          description: 'Verify all asset returns and release service certificates.',
          category: 'hr',
          roleAssignee: 'hr',
          dueDaysOffset: 0
        }
      ];

  const tasks = defaultOffboardTasks.map((t) => ({
    title: t.title,
    description: t.description || '',
    category: t.category,
    roleAssignee: t.roleAssignee,
    completed: false
  }));

  const offboardingChecklist = await Checklist.create({
    employeeId: employee._id,
    templateId: template?._id || null,
    type: 'offboarding',
    status: 'pending',
    startDate: new Date(),
    progressPercent: 0,
    tasks
  });

  return offboardingChecklist;
};

export const getOffboardings = async ({ query = {}, user }) => {
  const filter = { type: 'offboarding', isDeleted: false };
  if (query.status) {
    filter.status = query.status;
  }

  const checklists = await Checklist.find(filter)
    .populate({
      path: 'employeeId',
      select: 'name employeeCode workEmail departmentId designationId',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'designationId', select: 'title' }
      ]
    })
    .sort({ createdAt: -1 });

  return checklists;
};

export const signoffDepartmentClearance = async ({ id, departmentCategory, user, notes = '', ipAddress, userAgent }) => {
  const checklist = await Checklist.findOne({ _id: id, type: 'offboarding', isDeleted: false });
  if (!checklist) {
    throw new ApiError(404, 'Offboarding checklist not found');
  }

  // 18.7: ASSET LOCK CHECK on final clearance (or when signing off IT / HR category)
  if (departmentCategory === 'it' || departmentCategory === 'hr') {
    await assertEmployeeAssetClearance(checklist.employeeId);
  }

  // Mark all tasks in this department category as completed
  let categoryUpdated = false;
  for (const task of checklist.tasks) {
    if (task.category === departmentCategory) {
      task.completed = true;
      task.completedAt = new Date();
      task.completedBy = user._id;
      if (notes) task.notes = notes;
      categoryUpdated = true;
    }
  }

  if (!categoryUpdated) {
    // If no explicit task in category, add signoff task
    checklist.tasks.push({
      title: `${departmentCategory.toUpperCase()} Clearance Sign-off`,
      category: departmentCategory,
      roleAssignee: 'hr',
      completed: true,
      completedAt: new Date(),
      completedBy: user._id,
      notes
    });
  }

  const totalTasks = checklist.tasks.length;
  const completedTasks = checklist.tasks.filter((t) => t.completed).length;
  checklist.progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  if (completedTasks === totalTasks) {
    checklist.status = 'completed';
    checklist.completedDate = new Date();
  } else {
    checklist.status = 'in_progress';
  }

  await checklist.save();

  await recordAuditLog({
    actorId: user._id,
    action: 'offboard.manage',
    module: 'onboarding',
    resource: 'Checklist',
    resourceId: checklist._id,
    after: { departmentCategory, progressPercent: checklist.progressPercent },
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return checklist;
};

// =========================================================================
// SLICE 7: FINAL SETTLEMENT LINKAGE (18.9)
// =========================================================================

export const getEmployeeSettlementSummary = async (checklistId) => {
  const checklist = await Checklist.findOne({ _id: checklistId, isDeleted: false }).populate('employeeId');
  if (!checklist) {
    throw new ApiError(404, 'Checklist not found');
  }

  const employee = checklist.employeeId;

  // Compile settlement summary figures
  const summary = {
    employeeId: employee._id,
    employeeName: employee.name,
    employeeCode: employee.employeeCode,
    joiningDate: employee.joiningDate,
    lastWorkingDay: checklist.completedDate || new Date(),
    clearanceStatus: checklist.status,
    encashableLeaveDays: 0,
    outstandingLoansPaisa: 0,
    proRatedSalaryPaisa: 0
  };

  return summary;
};

// =========================================================================
// SLICE 8: SCHEDULED ACCOUNT DEACTIVATION (18.11)
// =========================================================================

export const runAccountDeactivationJob = async () => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Find accepted resignations where officialLastWorkingDay <= today
  const dueResignations = await Resignation.find({
    status: 'accepted',
    officialLastWorkingDay: { $lte: today },
    isDeleted: false
  });

  let deactivatedCount = 0;
  const processedEmployees = [];

  for (const res of dueResignations) {
    const employee = await Employee.findById(res.employeeId);
    if (!employee || employee.status === 'Resigned' || employee.status === 'Terminated') {
      continue;
    }

    // 1. Transition Employee Status
    employee.status = 'Resigned';
    await employee.save();

    // 2. Revoke linked User account access
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, {
        isActive: false,
        refreshTokenHash: null
      });
    }

    deactivatedCount++;
    processedEmployees.push(employee.name);

    await recordAuditLog({
      actorId: employee.userId || employee._id,
      action: 'offboard.manage',
      module: 'onboarding',
      resource: 'Employee',
      resourceId: employee._id,
      after: { status: 'Resigned', userDeactivated: true },
      notes: 'Automated deactivation on official last working day.'
    }).catch((err) => console.error('[Audit Error]', err.message));
  }

  return { deactivatedCount, processedEmployees };
};

// =========================================================================
// SLICE 9: WELCOME EMAIL (18.4)
// =========================================================================

export const sendWelcomeEmail = async ({ id, user }) => {
  const checklist = await Checklist.findOne({ _id: id, isDeleted: false }).populate('employeeId');
  if (!checklist || !checklist.employeeId) {
    throw new ApiError(404, 'Checklist not found');
  }

  const employee = checklist.employeeId;
  const email = employee.email || employee.workEmail || employee.personalEmail;

  if (!email) {
    throw new ApiError(400, 'Employee does not have an active email address');
  }

  await emailService.sendWelcomeOnboardingEmail(
    email,
    employee.name,
    'Welcome123!'
  );

  return { message: `Welcome email sent successfully to ${email}` };
};

// =========================================================================
// SLICE 10: CONFIDENTIAL EXIT INTERVIEW (18.8)
// =========================================================================

export const submitExitInterview = async ({ interviewData, user, ipAddress, userAgent }) => {
  const employee = await Employee.findOne({ userId: user._id });
  if (!employee) {
    throw new ApiError(404, 'Employee record not found');
  }

  const existing = await ExitInterview.findOne({ resignationId: interviewData.resignationId });
  if (existing) {
    throw new ApiError(400, 'An exit interview has already been submitted for this resignation');
  }

  const interview = await ExitInterview.create({
    employeeId: employee._id,
    resignationId: interviewData.resignationId,
    ratings: interviewData.ratings,
    primaryReason: interviewData.primaryReason,
    feedbackManagement: interviewData.feedbackManagement || '',
    feedbackCompany: interviewData.feedbackCompany || '',
    wouldRecommend: interviewData.wouldRecommend ?? true,
    isConfidential: true
  });

  await recordAuditLog({
    actorId: user._id,
    action: 'offboard.view',
    module: 'onboarding',
    resource: 'ExitInterview',
    resourceId: interview._id,
    after: { resignationId: interview.resignationId, confidential: true },
    ipAddress,
    userAgent
  }).catch((err) => console.error('[Audit Error]', err.message));

  return interview;
};

export const getExitInterviewByResignation = async ({ resignationId, user }) => {
  const userRoles = user.roles?.map((r) => r.name || r) || [];
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isHR = userRoles.includes('HR Manager');

  if (!isSuperAdmin && !isHR) {
    throw new ApiError(403, 'Exit interviews are confidential and restricted strictly to HR Management');
  }

  const interview = await ExitInterview.findOne({ resignationId })
    .populate('employeeId', 'name employeeCode')
    .populate('resignationId');

  if (!interview) {
    throw new ApiError(404, 'Exit interview questionnaire not found');
  }

  return interview;
};

// =========================================================================
// SLICE 11: EXPERIENCE & RELIEVING LETTER PDF STREAMING (18.10)
// =========================================================================

export const streamServiceLetterPdf = async ({ employeeId, type, user, res }) => {
  const employee = await Employee.findById(employeeId).populate('departmentId').populate('designationId');
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  // Check exit clearance status
  const offboarding = await Checklist.findOne({
    employeeId,
    type: 'offboarding',
    isDeleted: false
  });

  if (!offboarding || offboarding.status !== 'completed') {
    throw new ApiError(400, 'Cannot generate service letter: All departmental exit clearances must be completed first.');
  }

  const isRelieving = type === 'relieving';
  const letterTitle = isRelieving ? 'RELIEVING LETTER' : 'EXPERIENCE & SERVICE CERTIFICATE';
  const filename = `${employee.employeeCode || 'EMP'}_${type}_letter.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // Corporate Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('HRM ENTERPRISE SUITE', { align: 'center' })
    .fontSize(10)
    .font('Helvetica')
    .text('Global Corporate Headquarters • Human Resources Operations', { align: 'center' })
    .moveDown(2);

  // Document Title
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(letterTitle, { align: 'center', underline: true })
    .moveDown(1.5);

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const joiningDateStr = employee.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date of Joining';
  const lwdStr = offboarding.completedDate
    ? new Date(offboarding.completedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Last Working Day';

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Date: ${dateStr}`, { align: 'right' })
    .text(`Ref ID: HRM/${new Date().getFullYear()}/${employee.employeeCode || '001'}`)
    .moveDown(1.5);

  // Recipient
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('TO WHOM IT MAY CONCERN')
    .moveDown(1);

  // Body Content
  let bodyText = '';
  if (isRelieving) {
    bodyText = `This is to formally certify that ${employee.name} (Employee Code: ${employee.employeeCode || 'N/A'}) was employed with us as a ${employee.designationId?.title || 'Staff Member'} in the ${employee.departmentId?.name || 'Operations'} Department from ${joiningDateStr} to ${lwdStr}.\n\n` +
      `We confirm that ${employee.name} has completed all necessary handover procedures and received full departmental clearance from all organizational units. They stand relieved of their official duties effective ${lwdStr}.\n\n` +
      `We wish them the very best in all their future professional endeavors.`;
  } else {
    bodyText = `This certificate is presented to certify that ${employee.name} was associated with our organization from ${joiningDateStr} to ${lwdStr}.\n\n` +
      `During their tenure as ${employee.designationId?.title || 'Staff Member'}, we found them to be diligent, dedicated, and a valued professional in our team. All company assets and departmental commitments have been successfully cleared.\n\n` +
      `We thank them for their contributions and wish them continuous success in their future career.`;
  }

  doc
    .font('Helvetica')
    .fontSize(11)
    .text(bodyText, { align: 'justify', lineGap: 6 })
    .moveDown(3);

  // Signatures
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Authorized Signatory,')
    .moveDown(0.5)
    .font('Helvetica')
    .text('Director of Human Resources & Operations')
    .text('HRM Global Systems');

  doc.end();
};
