import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Roles CRUD API (Slice 26.7-TEST & 26.13-TEST)', () => {
  let superAdminToken;
  let employeeToken;
  let superAdminRole;
  let customRoleId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_crud');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});

    // 1. Create Super Admin role & user
    superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const superAdminUser = await User.create({
      email: 'admin.crud@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    superAdminToken = jwt.sign(
      { userId: superAdminUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // 2. Create unprivileged Employee role & user
    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard Employee',
      isSystem: true,
      permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
    });

    const employeeUser = await User.create({
      email: 'employee.crud@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    employeeToken = jwt.sign(
      { userId: employeeUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await mongoose.disconnect();
  });

  it('POST /api/v1/roles should create a new custom role', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Finance Officer',
        description: 'Manages payroll and expenses',
        permissions: [
          { action: 'payroll.manage', subject: 'Payroll', scope: 'all' },
          { action: 'expense.approve', subject: 'Expense', scope: 'department' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Finance Officer');
    expect(res.body.data.isSystem).toBe(false);
    expect(res.body.data.permissions).toHaveLength(2);
    customRoleId = res.body.data._id;
  });

  it('POST /api/v1/roles should reject creation when called by unprivileged employee (403)', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Hacker Role',
        permissions: []
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/roles should return paginated roles list', async () => {
    const res = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/v1/roles/:id should return role details', async () => {
    const res = await request(app)
      .get(`/api/v1/roles/${customRoleId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(customRoleId);
    expect(res.body.data.name).toBe('Finance Officer');
  });

  it('PATCH /api/v1/roles/:id should update custom role details and permissions', async () => {
    const res = await request(app)
      .patch(`/api/v1/roles/${customRoleId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        description: 'Updated payroll manager description',
        permissions: [
          { action: 'payroll.manage', subject: 'Payroll', scope: 'all' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe('Updated payroll manager description');
    expect(res.body.data.permissions).toHaveLength(1);
  });

  it('PATCH /api/v1/roles/:id should block renaming system role (Slice 26.13-TEST)', async () => {
    const res = await request(app)
      .patch(`/api/v1/roles/${superAdminRole._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Renamed Admin'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot be renamed/i);
  });

  it('DELETE /api/v1/roles/:id should block deleting system role (Slice 26.13-TEST)', async () => {
    const res = await request(app)
      .delete(`/api/v1/roles/${superAdminRole._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/protected and cannot be deleted/i);
  });

  it('DELETE /api/v1/roles/:id should soft-delete custom role successfully', async () => {
    const res = await request(app)
      .delete(`/api/v1/roles/${customRoleId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is no longer returned in getRoleById
    const verifyRes = await request(app)
      .get(`/api/v1/roles/${customRoleId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(verifyRes.status).toBe(404);
  });
});
