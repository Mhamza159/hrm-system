import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Permissions Catalogue API (Slice 26.1-TEST)', () => {
  let superAdminToken;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_permissions');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});

    // Create Super Admin role and user
    const adminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const adminUser = await User.create({
      email: 'admin.permissions@company.pk',
      passwordHash: 'dummy_hash',
      roles: [adminRole._id],
      isActive: true
    });

    superAdminToken = jwt.sign(
      { userId: adminUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await mongoose.disconnect();
  });

  it('should reject unauthenticated call with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/permissions');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 with complete categorized permission catalogue for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/permissions')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const modules = res.body.data.map((m) => m.module);
    expect(modules).toContain('auth');
    expect(modules).toContain('roles');
    expect(modules).toContain('employees');
    expect(modules).toContain('attendance');
    expect(modules).toContain('leaves');
    expect(modules).toContain('payroll');

    // Verify role actions are present
    const rolesModule = res.body.data.find((m) => m.module === 'roles');
    expect(rolesModule).toBeDefined();
    const actionNames = rolesModule.actions.map((a) => a.action);
    expect(actionNames).toContain('role.view');
    expect(actionNames).toContain('role.manage');
    expect(actionNames).toContain('role.assign');
  });
});
