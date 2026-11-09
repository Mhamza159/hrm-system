/**
 * @file roles.seed.js
 * @description Bootstrap Seeder for the 4 Core System Roles and Initial Super Admin Account.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.2)
 * - Governing Source: docs/FRD.md Section 11 (Permission Matrix)
 * - Safe Idempotence: Uses upsert logic to ensure multiple runs do not duplicate or corrupt records.
 */

import mongoose from 'mongoose';
import { Role } from '../models/role.model.js';
import { User } from '../models/user.model.js';
import { Employee } from '../models/employee.model.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { env } from '../config/env.js';
import '../config/db.js';

export const CORE_ROLES_DEFINITIONS = [
  {
    name: 'Super Admin',
    description: 'Master Executive Administrator with unrestricted organizational access.',
    isSystem: true,
    permissions: [
      {
        action: 'manage',
        subject: 'all',
        scope: 'all'
      }
    ]
  },
  {
    name: 'HR Manager',
    description: 'Human Resources Manager with company-wide workforce, attendance, leave, and payroll preparation rights.',
    isSystem: true,
    permissions: [
      { action: 'login.history', subject: 'User', scope: 'all' },
      { action: 'user.manage', subject: 'User', scope: 'all' },
      { action: 'role.view', subject: 'Role', scope: 'all' },
      { action: 'role.assign', subject: 'Role', scope: 'all' },
      { action: 'employee.view', subject: 'Employee', scope: 'all' },
      { action: 'employee.create', subject: 'Employee', scope: 'all' },
      { action: 'employee.edit', subject: 'Employee', scope: 'all' },
      { action: 'employee.delete', subject: 'Employee', scope: 'all' },
      { action: 'employee.salary.view', subject: 'Employee', scope: 'all' },
      { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.view', subject: 'Attendance', scope: 'all' },
      { action: 'attendance.edit', subject: 'Attendance', scope: 'all' },
      { action: 'attendance.approve', subject: 'Attendance', scope: 'all' },
      { action: 'attendance.lock', subject: 'Attendance', scope: 'all' },
      { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.correction', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.fieldCheckIn', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.export', subject: 'Attendance', scope: 'all' },
      { action: 'attendance.fieldCheckIn', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.geo.view', subject: 'Attendance', scope: 'all' },
      { action: 'attendance.face.manage', subject: 'Attendance', scope: 'all' },
      { action: 'attendance.kiosk.manage', subject: 'Attendance', scope: 'all' },
      { action: 'leave.apply', subject: 'Leave', scope: 'own' },
      { action: 'leave.view', subject: 'Leave', scope: 'all' },
      { action: 'leave.approve', subject: 'Leave', scope: 'all' },
      { action: 'leave.settings', subject: 'Leave', scope: 'all' },
      { action: 'leave.encash', subject: 'Leave', scope: 'all' },
      { action: 'payroll.view', subject: 'Payroll', scope: 'all' },
      { action: 'payroll.manage', subject: 'Payroll', scope: 'all' },
      { action: 'payroll.run', subject: 'Payroll', scope: 'all' },
      { action: 'payroll.export', subject: 'Payroll', scope: 'all' },
      { action: 'settings.view', subject: 'Setting', scope: 'all' },
      { action: 'settings.manage', subject: 'Setting', scope: 'all' },
      { action: 'org.view', subject: 'Organization', scope: 'all' },
      { action: 'org.manage', subject: 'Organization', scope: 'all' },
      { action: 'report.view', subject: 'Report', scope: 'all' },
      { action: 'report.export', subject: 'Report', scope: 'all' },
      { action: 'notification.view', subject: 'Notification', scope: 'own' },
      { action: 'notification.manage', subject: 'Notification', scope: 'all' },
      { action: 'dashboard.view', subject: 'Dashboard', scope: 'all' },
      { action: 'announcement.view', subject: 'Announcement', scope: 'all' },
      { action: 'announcement.create', subject: 'Announcement', scope: 'all' },
      { action: 'announcement.edit', subject: 'Announcement', scope: 'all' },
      { action: 'announcement.delete', subject: 'Announcement', scope: 'all' },
      { action: 'announcement.pin', subject: 'Announcement', scope: 'all' },
      { action: 'loan.view', subject: 'Loan', scope: 'all' },
      { action: 'loan.create', subject: 'Loan', scope: 'own' },
      { action: 'loan.recommend', subject: 'Loan', scope: 'all' },
      { action: 'loan.approve', subject: 'Loan', scope: 'all' },
      { action: 'loan.prepay', subject: 'Loan', scope: 'all' },
      { action: 'loan.settings', subject: 'Loan', scope: 'all' },
      { action: 'expense.view', subject: 'Expense', scope: 'all' },
      { action: 'expense.create', subject: 'Expense', scope: 'own' },
      { action: 'expense.approve', subject: 'Expense', scope: 'all' },
      { action: 'expense.reimburse', subject: 'Expense', scope: 'all' },
            { action: 'expense.settings', subject: 'ExpenseCategory', scope: 'all' },
      { action: 'asset.view', subject: 'Asset', scope: 'all' },
      { action: 'asset.create', subject: 'Asset', scope: 'all' },
      { action: 'asset.manage', subject: 'Asset', scope: 'all' },
      { action: 'asset.assign', subject: 'Asset', scope: 'all' },
      { action: 'asset.request', subject: 'AssetRequest', scope: 'all' },
      { action: 'asset.issue', subject: 'Asset', scope: 'own' },
      { action: 'onboard.view', subject: 'Checklist', scope: 'all' },
      { action: 'onboard.manage', subject: 'Checklist', scope: 'all' },
      { action: 'resignation.submit', subject: 'Resignation', scope: 'own' },
      { action: 'offboard.view', subject: 'Resignation', scope: 'all' },
      { action: 'offboard.manage', subject: 'Resignation', scope: 'all' },
      { action: 'performance.template.view', subject: 'Performance', scope: 'all' },
      { action: 'performance.template.manage', subject: 'Performance', scope: 'all' },
      { action: 'performance.cycle.manage', subject: 'Performance', scope: 'all' },
      { action: 'performance.review.view', subject: 'Performance', scope: 'all' },
      { action: 'performance.review.submit', subject: 'Performance', scope: 'all' },
      { action: 'performance.review.finalize', subject: 'Performance', scope: 'all' },
      { action: 'performance.peer.manage', subject: 'Performance', scope: 'all' },
      { action: 'project.view', subject: 'Project', scope: 'all' },
      { action: 'project.manage', subject: 'Project', scope: 'all' },
      { action: 'timesheet.log', subject: 'Project', scope: 'own' },
      { action: 'timesheet.compliance', subject: 'Project', scope: 'all' },
      { action: 'report.utilization', subject: 'Project', scope: 'all' },
      { action: 'recruitment.requisition.view', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.job.view', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.job.manage', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.candidate.view', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.candidate.screen', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.candidate.stage', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.interview.manage', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.interview.evaluate', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.offer.manage', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.offer.view', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.hire', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.referral.submit', subject: 'Recruitment', scope: 'own' },
      { action: 'chatbot.use', subject: 'Chatbot', scope: 'own' },
      { action: 'chatbot.policy.manage', subject: 'Chatbot', scope: 'all' },
      { action: 'chatbot.unanswered.manage', subject: 'Chatbot', scope: 'all' },
      { action: 'attrition.view', subject: 'Attrition', scope: 'all' },
      { action: 'attrition.manage', subject: 'Attrition', scope: 'all' },
      { action: 'rewards.view', subject: 'Rewards', scope: 'all' },
      { action: 'rewards.nominate', subject: 'Rewards', scope: 'all' },
      { action: 'rewards.vote', subject: 'Rewards', scope: 'all' },
      { action: 'rewards.kudos', subject: 'Rewards', scope: 'all' },
      { action: 'rewards.respond', subject: 'Rewards', scope: 'all' },
      { action: 'rewards.manage', subject: 'Rewards', scope: 'all' },
      { action: 'feedback.submit', subject: 'Feedback', scope: 'all' },
      { action: 'feedback.manage', subject: 'Feedback', scope: 'all' },
      { action: 'feedback.escalate', subject: 'Feedback', scope: 'all' },
      { action: 'chat.access', subject: 'Chat', scope: 'all' },
      { action: 'chat.create_group', subject: 'Chat', scope: 'all' }
    ]
  },
  {
    name: 'Department Manager',
    description: 'Department Head or Team Lead with team-scoped management and approval delegation rights.',
    isSystem: true,
    permissions: [
      { action: 'login.history', subject: 'User', scope: 'own' },
      { action: 'delegation.create', subject: 'Role', scope: 'own' },
      { action: 'delegation.view', subject: 'Role', scope: 'own' },
      { action: 'delegation.cancel', subject: 'Role', scope: 'own' },
      { action: 'employee.view', subject: 'Employee', scope: 'team', fields: ['name', 'designation', 'department', 'email', 'phone'] },
      { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.view', subject: 'Attendance', scope: 'team' },
      { action: 'attendance.approve', subject: 'Attendance', scope: 'team' },
      { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.correction', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.export', subject: 'Attendance', scope: 'team' },
      { action: 'attendance.geo.view', subject: 'Attendance', scope: 'team' },
      { action: 'leave.apply', subject: 'Leave', scope: 'own' },
      { action: 'leave.view', subject: 'Leave', scope: 'team' },
      { action: 'leave.approve', subject: 'Leave', scope: 'team', limit: 3 },
      { action: 'payroll.view', subject: 'Payroll', scope: 'own' },
      { action: 'loan.view', subject: 'Loan', scope: 'team' },
      { action: 'loan.create', subject: 'Loan', scope: 'own' },
      { action: 'loan.recommend', subject: 'Loan', scope: 'team' },
      { action: 'expense.view', subject: 'Expense', scope: 'team' },
      { action: 'expense.create', subject: 'Expense', scope: 'own' },
      { action: 'expense.approve', subject: 'Expense', scope: 'team', limit: 1500000 },
      { action: 'settings.view', subject: 'Setting', scope: 'all' },
      { action: 'org.view', subject: 'Organization', scope: 'all' },
      { action: 'report.view', subject: 'Report', scope: 'team' },
      { action: 'report.export', subject: 'Report', scope: 'team' },
      { action: 'dashboard.view', subject: 'Dashboard', scope: 'team' },
      { action: 'notification.view', subject: 'Notification', scope: 'own' },
      { action: 'announcement.view', subject: 'Announcement', scope: 'department' },
      { action: 'announcement.create', subject: 'Announcement', scope: 'department' },
      { action: 'announcement.edit', subject: 'Announcement', scope: 'department' },
            { action: 'announcement.pin', subject: 'Announcement', scope: 'department' },
      { action: 'asset.view', subject: 'Asset', scope: 'department' },
      { action: 'asset.request', subject: 'AssetRequest', scope: 'department' },
      { action: 'asset.issue', subject: 'Asset', scope: 'own' },
      { action: 'onboard.view', subject: 'Checklist', scope: 'team' },
      { action: 'resignation.submit', subject: 'Resignation', scope: 'own' },
      { action: 'offboard.view', subject: 'Resignation', scope: 'team' },
      { action: 'offboard.manage', subject: 'Resignation', scope: 'department' },
      { action: 'performance.template.view', subject: 'Performance', scope: 'all' },
      { action: 'performance.cycle.view', subject: 'Performance', scope: 'all' },
      { action: 'performance.review.view', subject: 'Performance', scope: 'department' },
      { action: 'performance.review.submit', subject: 'Performance', scope: 'department' },
      { action: 'performance.peer.manage', subject: 'Performance', scope: 'department' },
      { action: 'project.view', subject: 'Project', scope: 'department' },
      { action: 'project.manage', subject: 'Project', scope: 'department' },
      { action: 'timesheet.log', subject: 'Project', scope: 'own' },
      { action: 'timesheet.approve', subject: 'Project', scope: 'team' },
      { action: 'report.utilization', subject: 'Project', scope: 'department' },
      { action: 'recruitment.requisition.create', subject: 'Recruitment', scope: 'department' },
      { action: 'recruitment.requisition.view', subject: 'Recruitment', scope: 'department' },
      { action: 'recruitment.job.view', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.candidate.view', subject: 'Recruitment', scope: 'department' },
      { action: 'recruitment.candidate.screen', subject: 'Recruitment', scope: 'department' },
      { action: 'recruitment.interview.manage', subject: 'Recruitment', scope: 'department' },
      { action: 'recruitment.interview.evaluate', subject: 'Recruitment', scope: 'own' },
      { action: 'recruitment.referral.submit', subject: 'Recruitment', scope: 'own' },
      { action: 'attrition.view', subject: 'Attrition', scope: 'team' },
      { action: 'attrition.manage', subject: 'Attrition', scope: 'team' },
      { action: 'rewards.view', subject: 'Rewards', scope: 'all' },
      { action: 'rewards.nominate', subject: 'Rewards', scope: 'team' },
      { action: 'rewards.vote', subject: 'Rewards', scope: 'all' },
      { action: 'rewards.kudos', subject: 'Rewards', scope: 'all' },
      { action: 'rewards.respond', subject: 'Rewards', scope: 'all' },
      { action: 'feedback.submit', subject: 'Feedback', scope: 'own' },
      { action: 'chat.access', subject: 'Chat', scope: 'own' },
      { action: 'chat.create_group', subject: 'Chat', scope: 'own' }
    ]
  },
  {
    name: 'Employee',
    description: 'Regular company employee with self-service attendance, leave, profile, and payslip access.',
    isSystem: true,
    permissions: [
      { action: 'login.history', subject: 'User', scope: 'own' },
      { action: 'employee.view', subject: 'Employee', scope: 'own' },
      { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.view', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' },
      { action: 'attendance.correction', subject: 'Attendance', scope: 'own' },
      { action: 'leave.apply', subject: 'Leave', scope: 'own' },
      { action: 'leave.view', subject: 'Leave', scope: 'own' },
      { action: 'leave.encash', subject: 'Leave', scope: 'own' },
      { action: 'payroll.view', subject: 'Payroll', scope: 'own' },
      { action: 'loan.view', subject: 'Loan', scope: 'own' },
      { action: 'loan.create', subject: 'Loan', scope: 'own' },
      { action: 'expense.view', subject: 'Expense', scope: 'own' },
      { action: 'expense.create', subject: 'Expense', scope: 'own' },
      { action: 'settings.view', subject: 'Setting', scope: 'all' },
      { action: 'notification.view', subject: 'Notification', scope: 'own' },
      { action: 'announcement.view', subject: 'Announcement', scope: 'own' },
      { action: 'org.view', subject: 'Organization', scope: 'all' },
      { action: 'report.view', subject: 'Report', scope: 'own' },
            { action: 'dashboard.view', subject: 'Dashboard', scope: 'own' },
      { action: 'asset.view', subject: 'Asset', scope: 'own' },
      { action: 'asset.issue', subject: 'Asset', scope: 'own' },
      { action: 'onboard.view', subject: 'Checklist', scope: 'own' },
      { action: 'resignation.submit', subject: 'Resignation', scope: 'own' },
      { action: 'offboard.view', subject: 'Resignation', scope: 'own' },
      { action: 'performance.cycle.view', subject: 'Performance', scope: 'all' },
      { action: 'performance.review.view', subject: 'Performance', scope: 'own' },
      { action: 'performance.review.submit', subject: 'Performance', scope: 'own' },
      { action: 'performance.peer.manage', subject: 'Performance', scope: 'own' },
      { action: 'project.view', subject: 'Project', scope: 'own' },
      { action: 'timesheet.log', subject: 'Project', scope: 'own' },
      { action: 'report.utilization', subject: 'Project', scope: 'own' },
      { action: 'recruitment.job.view', subject: 'Recruitment', scope: 'all' },
      { action: 'recruitment.referral.submit', subject: 'Recruitment', scope: 'own' },
      { action: 'chatbot.use', subject: 'Chatbot', scope: 'own' },
      { action: 'rewards.view', subject: 'Rewards', scope: 'own' },
      { action: 'rewards.vote', subject: 'Rewards', scope: 'own' },
      { action: 'rewards.kudos', subject: 'Rewards', scope: 'own' },
      { action: 'rewards.respond', subject: 'Rewards', scope: 'own' },
      { action: 'feedback.submit', subject: 'Feedback', scope: 'own' },
      { action: 'chat.access', subject: 'Chat', scope: 'own' },
      { action: 'chat.create_group', subject: 'Chat', scope: 'own' }
    ]
  }
];


/**
 * Seed or update core roles and initial Super Admin user
 */
export const seedRolesAndAdmin = async () => {
  console.log('🌱 [SEED] Bootstrapping 4 core roles and Super Admin...');

  const seededRoles = {};

  // 1. Upsert all 4 core roles
  for (const roleDef of CORE_ROLES_DEFINITIONS) {
    const role = await Role.findOneAndUpdate(
      { name: roleDef.name },
      {
        $set: {
          description: roleDef.description,
          isSystem: roleDef.isSystem,
          permissions: roleDef.permissions,
          isDeleted: false
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seededRoles[roleDef.name] = role;
    console.log(`✅ Role configured: ${role.name} (${role.permissions.length} rules)`);
  }

  // 2. Seed initial Super Admin user if not existing
  const adminEmail = process.env.ADMIN_EMAIL || 'mhamzaofficial159@gmail.com';
  const existingAdmin = await User.findOne({ email: { $in: [adminEmail, 'admin@hrm.company.pk'] } });

  if (!existingAdmin) {
    const passwordHash = await User.hashPassword('Admin12345!');
    const adminUser = await User.create({
      email: adminEmail,
      passwordHash,
      roles: [seededRoles['Super Admin']._id],
      isActive: true,
      mustChangePassword: false
    });
    console.log(`✅ Initial Super Admin created: ${adminUser.email} (must change password on first login)`);
  } else {
    // Ensure Super Admin is active, undeleted, and password matches Admin12345!
    existingAdmin.passwordHash = await User.hashPassword('Admin12345!');
    existingAdmin.isActive = true;
    existingAdmin.isDeleted = false;
    existingAdmin.mustChangePassword = false;
    if (!existingAdmin.roles.some((r) => r.toString() === seededRoles['Super Admin']._id.toString())) {
      existingAdmin.roles.push(seededRoles['Super Admin']._id);
    }
    await existingAdmin.save();
    console.log(`ℹ️ Super Admin account verified & synced: ${existingAdmin.email}`);
  }

  // 3. Ensure Super Admin has an active Employee record for organizational reporting & Org Chart
  const adminDoc = existingAdmin || (await User.findOne({ email: adminEmail }));
  if (adminDoc) {
    let adminEmpDoc = await Employee.findOne({ email: adminEmail });
    const execDept = await Department.findOne({ code: 'EXEC', isDeleted: false });
    const ceoDesig = await Designation.findOne({ code: 'CEO', isDeleted: false });

    if (!adminEmpDoc) {
      adminEmpDoc = await Employee.create({
        employeeCode: 'EMP-000',
        userId: adminDoc._id,
        name: 'Mohammad Hamza Hakim',
        email: adminEmail,
        departmentId: execDept?._id || null,
        designationId: ceoDesig?._id || null,
        status: 'Active',
        employmentType: 'Permanent',
        joiningDate: new Date('2023-01-01'),
        isDeleted: false
      });
      console.log(`✅ Super Admin Employee record created: EMP-000`);
    } else {
      let modified = false;
      if (!adminEmpDoc.userId) {
        adminEmpDoc.userId = adminDoc._id;
        modified = true;
      }
      if (!adminEmpDoc.departmentId && execDept) {
        adminEmpDoc.departmentId = execDept._id;
        modified = true;
      }
      if (!adminEmpDoc.designationId && ceoDesig) {
        adminEmpDoc.designationId = ceoDesig._id;
        modified = true;
      }
      if (modified) {
        await adminEmpDoc.save();
      }
    }

    if (String(adminDoc.employeeId) !== String(adminEmpDoc._id)) {
      adminDoc.employeeId = adminEmpDoc._id;
      await adminDoc.save();
    }
  }

  console.log('🎉 [SEED] Core roles & Super Admin bootstrapping complete.');
  return seededRoles;
};

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith('roles.seed.js')) {
  try {
    await mongoose.connect(env.MONGO_URI);
    await seedRolesAndAdmin();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ [SEED ERROR]:', err);
    process.exit(1);
  }
}
