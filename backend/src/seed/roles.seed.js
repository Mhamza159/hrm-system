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
      { action: 'attendance.approve', subject: 'Attendance', scope: 'all' },
      { action: 'attendance.lock', subject: 'Attendance', scope: 'all' },
      { action: 'leave.apply', subject: 'Leave', scope: 'own' },
      { action: 'leave.view', subject: 'Leave', scope: 'all' },
      { action: 'leave.approve', subject: 'Leave', scope: 'all' },
      { action: 'leave.settings', subject: 'Leave', scope: 'all' },
      { action: 'payroll.view', subject: 'Payroll', scope: 'all' },
      { action: 'payroll.manage', subject: 'Payroll', scope: 'all' },
      { action: 'payroll.run', subject: 'Payroll', scope: 'all' },
      { action: 'payroll.export', subject: 'Payroll', scope: 'all' },
      { action: 'settings.view', subject: 'Setting', scope: 'all' },
      { action: 'settings.manage', subject: 'Setting', scope: 'all' },
      { action: 'org.view', subject: 'Organization', scope: 'all' },
      { action: 'org.manage', subject: 'Organization', scope: 'all' },
      { action: 'report.view', subject: 'Report', scope: 'all' },
      { action: 'report.export', subject: 'Report', scope: 'all' }
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
      { action: 'leave.apply', subject: 'Leave', scope: 'own' },
      { action: 'leave.view', subject: 'Leave', scope: 'team' },
      { action: 'leave.approve', subject: 'Leave', scope: 'team', limit: 3 },
      { action: 'payroll.view', subject: 'Payroll', scope: 'own' },
      { action: 'settings.view', subject: 'Setting', scope: 'all' },
      { action: 'org.view', subject: 'Organization', scope: 'all' },
      { action: 'report.view', subject: 'Report', scope: 'team' },
      { action: 'report.export', subject: 'Report', scope: 'team' }
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
      { action: 'leave.apply', subject: 'Leave', scope: 'own' },
      { action: 'leave.view', subject: 'Leave', scope: 'own' },
      { action: 'payroll.view', subject: 'Payroll', scope: 'own' },
      { action: 'settings.view', subject: 'Setting', scope: 'all' },
      { action: 'org.view', subject: 'Organization', scope: 'all' },
      { action: 'report.view', subject: 'Report', scope: 'own' }
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
  const adminEmail = 'admin@hrm.company.pk';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const passwordHash = await User.hashPassword('Admin12345!');
    const adminUser = await User.create({
      email: adminEmail,
      passwordHash,
      roles: [seededRoles['Super Admin']._id],
      isActive: true,
      mustChangePassword: true
    });
    console.log(`✅ Initial Super Admin created: ${adminUser.email} (must change password on first login)`);
  } else {
    // Ensure Super Admin has the Super Admin role assigned
    if (!existingAdmin.roles.some((r) => r.toString() === seededRoles['Super Admin']._id.toString())) {
      existingAdmin.roles.push(seededRoles['Super Admin']._id);
      await existingAdmin.save();
    }
    console.log(`ℹ️ Super Admin account verified: ${existingAdmin.email}`);
  }

  // 3. Ensure Super Admin has an active Employee record for organizational reporting & Org Chart
  const adminDoc = existingAdmin || (await User.findOne({ email: adminEmail }));
  if (adminDoc) {
    const existingAdminEmp = await Employee.findOne({ email: adminEmail });
    if (!existingAdminEmp) {
      await Employee.create({
        employeeCode: 'EMP-000',
        userId: adminDoc._id,
        name: 'Super Admin',
        email: adminEmail,
        status: 'Active',
        employmentType: 'Permanent',
        joiningDate: new Date('2023-01-01'),
        isDeleted: false
      });
      console.log(`✅ Super Admin Employee record created: EMP-000`);
    } else if (!existingAdminEmp.userId) {
      existingAdminEmp.userId = adminDoc._id;
      await existingAdminEmp.save();
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
