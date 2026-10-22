/**
 * @file cleanProductionDb.js
 * @description Production Database Reset Script.
 * Retains ONLY the 4 Core System Roles and the initial Super Admin Account.
 * Cleans out all test employees, test users, attendances, leaves, payrolls, and audit logs.
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Employee } from '../models/employee.model.js';
import { Role } from '../models/role.model.js';
import { Attendance } from '../models/attendance.model.js';
import { Leave } from '../models/leave.model.js';
import { LeaveBalance } from '../models/leaveBalance.model.js';
import { LeaveEncashment } from '../models/leaveEncashment.model.js';
import { AttendanceCorrection } from '../models/correction.model.js';
import { WFHRequest } from '../models/wfh.model.js';
import { PayrollRun } from '../models/payrollRun.model.js';
import { Payslip } from '../models/payslip.model.js';
import { Notification } from '../models/notification.model.js';
import { Announcement } from '../models/announcement.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { LoginHistory } from '../models/loginHistory.model.js';
import { ProfileChangeRequest } from '../models/profileChangeRequest.model.js';
import { Delegation } from '../models/delegation.model.js';
import { MonthLock } from '../models/monthLock.model.js';
import { EmployeeHistory } from '../models/employeeHistory.model.js';
import { seedRolesAndAdmin } from '../seed/roles.seed.js';

async function resetDb() {
  console.log('🚀 Connecting to MongoDB for Production Clean...');
  await mongoose.connect(env.MONGO_URI);

  const adminEmail = (env.SUPER_ADMIN_EMAIL || 'admin@hrm.local').toLowerCase();
  const superAdmin = await User.findOne({ email: adminEmail });

  if (!superAdmin) {
    console.log('⚠️ No Super Admin found with email:', adminEmail, '- Seeding will initialize it.');
  }

  console.log('🧹 Purging operational test records...');
  await Promise.all([
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    LeaveBalance.deleteMany({}),
    LeaveEncashment.deleteMany({}),
    AttendanceCorrection.deleteMany({}),
    WFHRequest.deleteMany({}),
    PayrollRun.deleteMany({}),
    Payslip.deleteMany({}),
    Notification.deleteMany({}),
    Announcement.deleteMany({}),
    AuditLog.deleteMany({}),
    LoginHistory.deleteMany({}),
    ProfileChangeRequest.deleteMany({}),
    Delegation.deleteMany({}),
    MonthLock.deleteMany({}),
    EmployeeHistory.deleteMany({})
  ]);

  console.log('🧹 Purging test users and employees (preserving Super Admin)...');
  if (superAdmin) {
    await User.deleteMany({ _id: { $ne: superAdmin._id } });
    await Employee.deleteMany({
      $and: [
        { userId: { $ne: superAdmin._id } },
        { email: { $ne: adminEmail } },
        { employeeCode: { $ne: 'EMP-000' } }
      ]
    });
  } else {
    await User.deleteMany({});
    await Employee.deleteMany({});
  }

  // Remove non-system custom roles to leave only clean Core Roles
  await Role.deleteMany({ isSystem: { $ne: true } });

  console.log('🌱 Ensuring Core Roles & Super Admin are perfectly initialized...');
  await seedRolesAndAdmin();

  console.log('✨ Production Database Reset Complete! Only Super Admin and Core Roles remain.');
  await mongoose.disconnect();
}

resetDb()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Reset error:', err);
    process.exit(1);
  });
