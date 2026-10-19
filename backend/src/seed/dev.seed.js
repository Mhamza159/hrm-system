/**
 * @file dev.seed.js
 * @description Comprehensive development & E2E seed data for Module M1 Authentication & Core Roles.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import '../config/db.js';
import { env } from '../config/env.js';
import { Role } from '../models/role.model.js';
import { User } from '../models/user.model.js';
import { seedRolesAndAdmin } from './roles.seed.js';

export const seedDevUsers = async () => {
  console.log('🌱 [DEV SEED] Starting development & test seed...');

  // 1. Seed or verify 4 core roles
  const roles = await seedRolesAndAdmin();

  // Helper to hash passwords
  const hash = async (pwd) => bcrypt.hash(pwd, 12);

  const usersToSeed = [
    {
      email: process.env.ADMIN_EMAIL || 'mhamzaofficial159@gmail.com',
      password: 'Admin12345!',
      roles: [roles['Super Admin']._id],
      isActive: true,
      mustChangePassword: false
    },
    {
      email: 'hr@hrm.company.pk',
      password: 'HrManager123!',
      roles: [roles['HR Manager']._id],
      isActive: true,
      mustChangePassword: false
    },
    {
      email: 'manager@hrm.company.pk',
      password: 'DeptManager123!',
      roles: [roles['Department Manager']._id],
      isActive: true,
      mustChangePassword: false
    },
    {
      email: 'employee@hrm.company.pk',
      password: 'Employee123!',
      roles: [roles['Employee']._id],
      isActive: true,
      mustChangePassword: false
    },
    {
      email: 'locked@hrm.company.pk',
      password: 'TargetPass123!',
      roles: [roles['Employee']._id],
      isActive: true,
      mustChangePassword: false,
      failedAttempts: 0,
      lockUntil: null
    },
    {
      email: 'firstlogin@hrm.company.pk',
      password: 'TempPass123!',
      roles: [roles['Employee']._id],
      isActive: true,
      mustChangePassword: true
    },
    {
      email: 'deactivated@hrm.company.pk',
      password: 'DeactivatedPass123!',
      roles: [roles['Employee']._id],
      isActive: false,
      mustChangePassword: false
    },
    {
      email: 'twofa@hrm.company.pk',
      password: 'TwoFactorPass123!',
      roles: [roles['Employee']._id],
      isActive: true,
      twoFactorEnabled: true,
      mustChangePassword: false
    }
  ];

  for (const u of usersToSeed) {
    const passwordHash = await hash(u.password);
    await User.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          passwordHash,
          roles: u.roles,
          isActive: u.isActive,
          mustChangePassword: u.mustChangePassword,
          twoFactorEnabled: u.twoFactorEnabled || false,
          failedAttempts: u.failedAttempts || 0,
          lockUntil: u.lockUntil || null,
          isDeleted: false
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ User seeded: ${u.email} | Active: ${u.isActive} | MustChange: ${u.mustChangePassword}`);
  }

  console.log('🎉 [DEV SEED] Successfully seeded all test roles and accounts.');
};

if (process.argv[1]?.endsWith('dev.seed.js')) {
  try {
    await mongoose.connect(env.MONGO_URI);
    await seedDevUsers();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ [DEV SEED ERROR]:', err);
    process.exit(1);
  }
}
