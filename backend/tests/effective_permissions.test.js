import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Effective Permissions Inspector API (Slice 26.15-TEST & 26.17-TEST)', () => {
  let superAdminToken;
  let employeeToken;
  let targetUser;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_effective');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});

    // Super Admin
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const superAdmin = await User.create({
      email: 'admin.effective@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    superAdminToken = jwt.sign(
      { userId: superAdmin._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Multi-role target user
    const role1 = await Role.create({
      name: 'Team Lead',
      permissions: [
        { action: 'task.assign', subject: 'Task', scope: 'team' }
      ]
    });

    const role2 = await Role.create({
      name: 'Recruiter',
      permissions: [
        { action: 'candidate.view', subject: 'Recruitment', scope: 'all' }
      ]
    });

    targetUser = await User.create({
      email: 'multi.role.user@company.pk',
      passwordHash: 'dummy_hash',
      roles: [role1._id, role2._id],
      isActive: true
    });

    // Plain Employee without role.view
    const plainEmployeeRole = await Role.create({
      name: 'Employee',
      permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
    });

    const plainEmployee = await User.create({
      email: 'plain.employee@company.pk',
      passwordHash: 'dummy_hash',
      roles: [plainEmployeeRole._id],
      isActive: true
    });

    employeeToken = jwt.sign(
      { userId: plainEmployee._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await mongoose.disconnect();
  });

  it('GET /api/v1/users/:id/effective-permissions should return unified permissions list for multi-role user', async () => {
    const res = await request(app)
      .get(`/api/v1/users/${targetUser._id}/effective-permissions`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roles).toHaveLength(2);

    const effective = res.body.data.effectivePermissions;
    expect(effective).toBeInstanceOf(Array);
    const actions = effective.map((p) => p.action);
    expect(actions).toContain('task.assign');
    expect(actions).toContain('candidate.view');
  });

  it('GET /api/v1/users/:id/effective-permissions should reject unauthorized employee (403)', async () => {
    const res = await request(app)
      .get(`/api/v1/users/${targetUser._id}/effective-permissions`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
