import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Roles & Permissions Comprehensive Overhaul E2E & Security Suite (Plan 28-09)', () => {
  let superAdminToken;
  let hrManagerToken;
  let deptManagerToken;
  let employeeToken;

  let superAdminRole;
  let hrManagerRole;
  let deptManagerRole;
  let employeeRole;

  let superAdminUser;
  let hrManagerUser;
  let deptManagerUser;
  let employeeUser;

  let customRoleId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_roles_overhaul');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});

    // 1. Seed Core System Roles
    superAdminRole = await Role.create({
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Master Administrator with unrestricted access',
      isSystem: true,
      isActive: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    hrManagerRole = await Role.create({
      name: 'HR Manager',
      slug: 'hr-manager',
      description: 'Human Resources Manager',
      isSystem: true,
      isActive: true,
      permissions: [
        { action: 'role.view', subject: 'Role', scope: 'all' },
        { action: 'role.manage', subject: 'Role', scope: 'all' },
        { action: 'employee.view', subject: 'Employee', scope: 'all' },
        { action: 'employee.create', subject: 'Employee', scope: 'all' },
        { action: 'employee.edit', subject: 'Employee', scope: 'all' },
        { action: 'department.view', subject: 'Department', scope: 'all' },
        { action: 'department.create', subject: 'Department', scope: 'all' },
        { action: 'user.manage', subject: 'User', scope: 'all' }
      ]
    });

    deptManagerRole = await Role.create({
      name: 'Department Manager',
      slug: 'department-manager',
      description: 'Departmental Leadership',
      isSystem: true,
      isActive: true,
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'department' },
        { action: 'attendance.view', subject: 'Attendance', scope: 'department' },
        { action: 'attendance.approve', subject: 'Attendance', scope: 'department' },
        { action: 'leave.view', subject: 'Leave', scope: 'department' },
        { action: 'leave.approve', subject: 'Leave', scope: 'department' }
      ]
    });

    employeeRole = await Role.create({
      name: 'Employee',
      slug: 'employee',
      description: 'Standard Employee with personal access',
      isSystem: true,
      isActive: true,
      permissions: [
        { action: 'attendance.view', subject: 'Attendance', scope: 'own' },
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.request', subject: 'Leave', scope: 'own' }
      ]
    });

    // 2. Seed Users for each role
    superAdminUser = await User.create({
      name: 'Root Admin',
      email: 'root@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrManagerUser = await User.create({
      name: 'Sarah HR',
      email: 'sarah.hr@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrManagerRole._id],
      isActive: true
    });

    deptManagerUser = await User.create({
      name: 'Bilal Manager',
      email: 'bilal.lead@company.pk',
      passwordHash: 'dummy_hash',
      roles: [deptManagerRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      name: 'Usman Staff',
      email: 'usman.staff@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    // 3. Issue JWT Access Tokens
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    hrManagerToken = jwt.sign({ userId: hrManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    deptManagerToken = jwt.sign({ userId: deptManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Core System Roles Immunity & Protection', () => {
    it('Super Admin role cannot be deleted (returns 400)', async () => {
      const res = await request(app)
        .delete(`/api/v1/roles/${superAdminRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot be deleted/i);
    });

    it('Super Admin role cannot be renamed or demoted (returns 400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/roles/${superAdminRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Demoted Admin' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot be renamed/i);
    });

    it('HR Manager, Dept Manager, Employee roles cannot be deleted (returns 400)', async () => {
      for (const role of [hrManagerRole, deptManagerRole, employeeRole]) {
        const res = await request(app)
          .delete(`/api/v1/roles/${role._id}`)
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });
  });

  describe('2. Custom Role Full Lifecycle & Assignment Safeguards', () => {
    it('Super Admin can create a custom role with permissions and scopes', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Talent Acquisition Lead',
          description: 'Recruitment and interview workflows lead',
          permissions: [
            { action: 'recruitment.job.view', subject: 'Job', scope: 'all' },
            { action: 'recruitment.candidate.view', subject: 'Candidate', scope: 'all' },
            { action: 'recruitment.candidate.create', subject: 'Candidate', scope: 'all' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Talent Acquisition Lead');
      expect(res.body.data.slug).toBe('talent-acquisition-lead');
      expect(res.body.data.isSystem).toBe(false);
      expect(res.body.data.permissions).toHaveLength(3);

      customRoleId = res.body.data._id;
    });

    it('Newly created role appears in GET /api/v1/roles with correct headcount (0)', async () => {
      const res = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const created = res.body.data.find((r) => r._id === customRoleId);
      expect(created).toBeDefined();
      expect(created.userCount).toBe(0);
    });

    it('Update custom role permissions and metadata (PATCH /api/v1/roles/:id)', async () => {
      const res = await request(app)
        .patch(`/api/v1/roles/${customRoleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          description: 'Updated talent lead duties',
          permissions: [
            { action: 'recruitment.job.view', subject: 'Job', scope: 'all' },
            { action: 'recruitment.job.create', subject: 'Job', scope: 'all' },
            { action: 'recruitment.candidate.view', subject: 'Candidate', scope: 'department' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated talent lead duties');
      expect(res.body.data.permissions).toHaveLength(3);
    });

    it('Clone custom role under a new name (POST /api/v1/roles/:id/clone)', async () => {
      const res = await request(app)
        .post(`/api/v1/roles/${customRoleId}/clone`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ newName: 'Junior Recruiter' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Junior Recruiter');
      expect(res.body.data.slug).toBe('junior-recruiter');
      expect(res.body.data.isSystem).toBe(false);
      expect(res.body.data.permissions).toHaveLength(3);
    });

    it('Assign custom role to user (PATCH /api/v1/users/:id/roles)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employeeUser._id}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ roleIds: [employeeRole._id, customRoleId] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toHaveLength(2);
    });

    it('Deleting a custom role with active assigned users throws 409 Conflict', async () => {
      const res = await request(app)
        .delete(`/api/v1/roles/${customRoleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/assigned.*reassign/i);
    });

    it('Reassign user to clear role, then soft delete successfully (200 OK)', async () => {
      // Reassign user to remove customRoleId
      await request(app)
        .patch(`/api/v1/users/${employeeUser._id}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ roleIds: [employeeRole._id] });

      // Now delete should succeed
      const res = await request(app)
        .delete(`/api/v1/roles/${customRoleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft deleted
      const checkRes = await request(app)
        .get(`/api/v1/roles/${customRoleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(checkRes.status).toBe(404);
    });
  });

  describe('3. Privilege Escalation & Authorization Boundaries', () => {
    it('Regular Employee cannot create a role (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Hacker Role', permissions: [] });

      expect(res.status).toBe(403);
    });

    it('Regular Employee cannot delete any role (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/roles/${employeeRole._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('Unauthenticated request to /api/v1/roles returns 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/roles');
      expect(res.status).toBe(401);
    });
  });

  describe('4. Cross-Module API 403 Verification (Zero Unauthorized Bypass)', () => {
    it('Employee token calling POST /api/v1/roles receives 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Unauthorized Role' });

      expect(res.status).toBe(403);
    });

    it('Employee token calling GET /api/v1/roles/stats receives 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/roles/stats')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('Department Manager token calling GET /api/v1/roles/stats receives 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/roles/stats')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('5. Live Analytics & Aggregation Endpoints', () => {
    it('Super Admin calling GET /api/v1/roles/stats returns all 8 KPI metrics', async () => {
      const res = await request(app)
        .get('/api/v1/roles/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const stats = res.body.data;

      expect(stats).toHaveProperty('totalRoles');
      expect(stats).toHaveProperty('activeRoles');
      expect(stats).toHaveProperty('systemRoles');
      expect(stats).toHaveProperty('customRoles');
      expect(stats).toHaveProperty('totalUsersWithRoles');
      expect(stats).toHaveProperty('totalRegisteredPermissions');
      expect(stats).toHaveProperty('averagePermissionsPerRole');
      expect(stats).toHaveProperty('activeDelegations');

      expect(stats.systemRoles).toBe(4);
      expect(stats.totalUsersWithRoles).toBeGreaterThanOrEqual(4);
      expect(stats.totalRegisteredPermissions).toBeGreaterThanOrEqual(127);
    });

    it('Super Admin calling GET /api/v1/roles/analytics returns user distribution and module coverage', async () => {
      const res = await request(app)
        .get('/api/v1/roles/analytics')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const analytics = res.body.data;

      expect(analytics).toHaveProperty('userDistribution');
      expect(analytics).toHaveProperty('moduleCoverage');
      expect(analytics).toHaveProperty('systemVsCustom');

      expect(Array.isArray(analytics.userDistribution)).toBe(true);
      expect(Array.isArray(analytics.moduleCoverage)).toBe(true);
      expect(analytics.systemVsCustom.systemRolesCount).toBe(4);
    });
  });
});
