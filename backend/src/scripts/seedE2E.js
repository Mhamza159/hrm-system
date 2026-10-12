/**
 * @file seedE2E.js
 * @description Seeds initial roles and test accounts for Multi-Role E2E verification.
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';

const seedE2E = async () => {
  try {
    await connectDB();
    console.log('[Seed] Database connected.');

    // 1. Ensure system roles exist
    const roleNames = ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'];
    const rolesMap = {};

    for (const name of roleNames) {
      let role = await Role.findOne({ name });
      if (!role) {
        role = await Role.create({
          name,
          isSystem: true,
          description: `System defined ${name} role`
        });
        console.log(`[Seed] Created role: ${name}`);
      }
      rolesMap[name] = role._id;
    }

    // 2. Test users definitions
    const testUsers = [
      {
        email: 'admin@company.pk',
        password: 'AdminPass123!',
        roles: [rolesMap['Super Admin']],
        isActive: true,
        mustChangePassword: false
      },
      {
        email: 'hr@company.pk',
        password: 'HrPass123!',
        roles: [rolesMap['HR Manager']],
        isActive: true,
        mustChangePassword: false
      },
      
      {
        email: 'manager@company.pk',
        password: 'ManagerPass123!',
        roles: [rolesMap['Department Manager']],
        isActive: true,
        mustChangePassword: false
      },
      {
        email: 'employee@company.pk',
        password: 'EmpPass123!',
        roles: [rolesMap['Employee']],
        isActive: true,
        mustChangePassword: false
      },
      {
        email: 'target.user@company.pk',
        password: 'TargetPass123!',
        roles: [rolesMap['Employee']],
        isActive: true,
        mustChangePassword: false
      }
    ];

    for (const u of testUsers) {
      const passwordHash = await User.hashPassword(u.password);
      await User.findOneAndUpdate(
        { email: u.email },
        {
          email: u.email,
          passwordHash,
          roles: u.roles,
          isActive: u.isActive,
          mustChangePassword: u.mustChangePassword,
          failedAttempts: 0,
          lockUntil: null,
          refreshTokenHash: null
        },
        { upsert: true, new: true }
      );
      console.log(`[Seed] Seeded user: ${u.email} (Password: ${u.password})`);
    }

    console.log('[Seed] All E2E test users seeded successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding E2E users:', error);
    process.exit(1);
  }
};

seedE2E();
