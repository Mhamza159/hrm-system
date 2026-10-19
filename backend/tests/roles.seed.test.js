import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import { Role } from '../src/models/role.model.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';
import { seedRolesAndAdmin, CORE_ROLES_DEFINITIONS } from '../src/seed/roles.seed.js';

describe('Roles & Permissions Seed Script (Slice 26.2-TEST)', () => {
  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_seed');
    await mongoose.connect(testDbUri);
    await Role.deleteMany({});
    await User.deleteMany({});
  }, 30000);

  afterAll(async () => {
    await Role.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('should successfully bootstrap all 4 core roles with isSystem: true and correct permissions', async () => {
    const seeded = await seedRolesAndAdmin();

    expect(seeded['Super Admin']).toBeDefined();
    expect(seeded['HR Manager']).toBeDefined();
    expect(seeded['Department Manager']).toBeDefined();
    expect(seeded['Employee']).toBeDefined();

    // Verify system flag
    for (const name of ['Super Admin', 'HR Manager', 'Department Manager', 'Employee']) {
      const dbRole = await Role.findOne({ name });
      expect(dbRole).toBeDefined();
      expect(dbRole.isSystem).toBe(true);
      expect(dbRole.permissions.length).toBeGreaterThan(0);
    }

    // Verify Super Admin user created
    const adminEmail = process.env.ADMIN_EMAIL || 'mhamzaofficial159@gmail.com';
    const adminUser = await User.findOne({ email: { $in: [adminEmail, 'admin@hrm.company.pk'] } }).populate('roles');
    expect(adminUser).toBeDefined();
    expect(adminUser.isActive).toBe(true);
    expect(adminUser.roles.some((r) => r.name === 'Super Admin')).toBe(true);
  });

  it('should be safely idempotent on re-execution without duplicate key errors', async () => {
    // Re-run seed on already seeded database
    await expect(seedRolesAndAdmin()).resolves.toBeDefined();

    // Verify count of roles is exactly 4
    const count = await Role.countDocuments({ isDeleted: false });
    expect(count).toBe(4);
  });
});
