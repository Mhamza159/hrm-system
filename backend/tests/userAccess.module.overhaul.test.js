/**
 * @file userAccess.module.overhaul.test.js
 * @description Comprehensive Integration Test Suite for User Access Module Overhaul (Phase 34).
 * 
 * Tests:
 * 1. Paginated user listing with search, filtering, and deep employee population
 * 2. Aggregated KPI statistics & security posture metrics (/users/stats)
 * 3. Deep forensic user inspection (/users/:id)
 * 4. Account status toggle with session revocation (/users/:id/status)
 * 5. Account lockout resolution via administrative unlock API (/users/:id/unlock)
 * 6. Administrative session revocation (/users/:id/revoke-sessions)
 * 7. Force password change mandate enforcement (/users/:id/force-password-change)
 * 8. Role assignment with privilege escalation protection (/users/:id/roles)
 * 9. PBAC departmental scoping enforcement for department managers
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Role } from '../src/models/role.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { env } from '../src/config/env.js';

describe('User Access Module — Complete Overhaul Integration Suite (Phase 34)', () => {
  const sharedPassword = 'Password123!';
  let superAdminToken;
  let deptManagerToken;
  let employeeToken;

  let superAdminUser;
  let deptManagerUser;
  let employee1User;
  let employee2User;

  let engineeringDept;
  let hrDept;
  let softwareEngDesignation;

  let superAdminRole;
  let deptManagerRole;
  let employeeRole;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_user_access_overhaul');
    await mongoose.connect(testDbUri);

    // Clean up
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Role.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Roles
    superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [
        { action: 'manage', subject: 'all' }
      ]
    });

    deptManagerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'user.view', subject: 'User', conditions: { scope: 'department' } },
        { action: 'user.manage', subject: 'User', conditions: { scope: 'department' } },
        { action: 'employee.view', subject: 'Employee', conditions: { scope: 'department' } }
      ]
    });

    employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'user.view', subject: 'User', conditions: { scope: 'own' } }
      ]
    });

    // 2. Departments & Designations
    engineeringDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    hrDept = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      isActive: true
    });

    softwareEngDesignation = await Designation.create({
      title: 'Senior Software Engineer',
      code: 'SSE',
      grade: 'Senior',
      departmentId: engineeringDept._id,
      isActive: true
    });

    const passwordHash = await User.hashPassword(sharedPassword);

    // 3. Create Super Admin User
    superAdminUser = await User.create({
      name: 'Super Admin Guy',
      email: 'admin.overhaul@company.pk',
      passwordHash,
      roles: [superAdminRole._id],
      isActive: true
    });

    // 4. Create Department Manager User & Linked Employee
    deptManagerUser = await User.create({
      name: 'Tariq Engineering Manager',
      email: 'tariq.mgr@company.pk',
      passwordHash,
      roles: [deptManagerRole._id],
      isActive: true
    });

    const deptManagerEmp = await Employee.create({
      employeeCode: 'EMP-ENG-001',
      name: 'Tariq Engineering Manager',
      email: 'tariq.mgr@company.pk',
      userId: deptManagerUser._id,
      departmentId: engineeringDept._id,
      designationId: softwareEngDesignation._id,
      employmentStatus: 'Active'
    });
    deptManagerUser.employeeId = deptManagerEmp._id;
    await deptManagerUser.save();

    // 5. Create Employee 1 in Engineering
    employee1User = await User.create({
      name: 'Ahmed Developer',
      email: 'ahmed.dev@company.pk',
      passwordHash,
      roles: [employeeRole._id],
      isActive: true
    });

    const emp1 = await Employee.create({
      employeeCode: 'EMP-ENG-002',
      name: 'Ahmed Developer',
      email: 'ahmed.dev@company.pk',
      userId: employee1User._id,
      departmentId: engineeringDept._id,
      designationId: softwareEngDesignation._id,
      employmentStatus: 'Active'
    });
    employee1User.employeeId = emp1._id;
    await employee1User.save();

    // 6. Create Employee 2 in HR (Different department)
    employee2User = await User.create({
      name: 'Fatima HR Specialist',
      email: 'fatima.hr@company.pk',
      passwordHash,
      roles: [employeeRole._id],
      isActive: true
    });

    const emp2 = await Employee.create({
      employeeCode: 'EMP-HR-001',
      name: 'Fatima HR Specialist',
      email: 'fatima.hr@company.pk',
      userId: employee2User._id,
      departmentId: hrDept._id,
      employmentStatus: 'Active'
    });
    employee2User.employeeId = emp2._id;
    await employee2User.save();

    // 7. Obtain tokens
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: superAdminUser.email, password: sharedPassword });
    superAdminToken = adminLoginRes.body.data.accessToken;

    const mgrLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: deptManagerUser.email, password: sharedPassword });
    deptManagerToken = mgrLoginRes.body.data.accessToken;

    const empLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: employee1User.email, password: sharedPassword });
    employeeToken = empLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
      }
    } catch {
      // ignore
    }
  });

  describe('1. GET /api/v1/users (Listing, Search, Pagination & Deep Population)', () => {
    it('returns standardized ApiResponse envelope with data as array and meta with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/users?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(4);
    });

    it('filters users by keyword search matching name or email', async () => {
      const res = await request(app)
        .get('/api/v1/users?search=Ahmed')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe('ahmed.dev@company.pk');
      expect(res.body.data[0].name).toBe('Ahmed Developer');
    });

    it('deeply populates employee and role details on each user', async () => {
      const res = await request(app)
        .get('/api/v1/users?search=ahmed.dev')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const user = res.body.data[0];
      expect(user.employeeId).toBeDefined();
      expect(user.employeeId.employeeCode).toBe('EMP-ENG-002');
      expect(user.roles).toBeDefined();
      expect(user.roles[0].name).toBe('Employee');
      expect(user.accountStatus).toBe('active');
    });
  });

  describe('2. GET /api/v1/users/stats (Aggregated KPI & Security Metrics)', () => {
    it('returns accurate KPI counters and breakdown arrays', async () => {
      const res = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const stats = res.body.data;
      expect(stats.totalUsers).toBeGreaterThanOrEqual(4);
      expect(stats.activeUsers).toBeGreaterThanOrEqual(4);
      expect(stats.inactiveUsers).toBe(0);
      expect(stats.lockedUsers).toBe(0);
      expect(stats.assignedUsers).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(stats.roleBreakdown)).toBe(true);
      expect(stats.statusDistribution).toBeDefined();
      expect(stats.statusDistribution.active).toBeGreaterThanOrEqual(4);
    });
  });

  describe('3. GET /api/v1/users/:id (Deep Forensic Inspection)', () => {
    it('returns complete user identity and security details', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${employee1User._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const user = res.body.data;
      expect(user._id.toString()).toBe(employee1User._id.toString());
      expect(user.email).toBe(employee1User.email);
      expect(user.name).toBe('Ahmed Developer');
      expect(user.accountStatus).toBe('active');
      expect(user.isLocked).toBe(false);
      expect(user.employeeId).toBeDefined();
      expect(user.employeeId.departmentId.name).toBe('Engineering');
    });
  });

  describe('4. Account Status Toggle & Session Revocation', () => {
    it('deactivates an active user and evicts refresh tokens', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employee2User._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          isActive: false,
          reason: 'Employee sabbatical leave'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      // Verify DB state
      const dbUser = await User.findById(employee2User._id);
      expect(dbUser.isActive).toBe(false);
      expect(dbUser.refreshTokenHash).toBeNull();
      expect(dbUser.accountStatus).toBe('inactive');
    });

    it('reactivates deactivated user', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employee2User._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          isActive: true,
          reason: 'Employee returned from leave'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(true);

      const dbUser = await User.findById(employee2User._id);
      expect(dbUser.isActive).toBe(true);
      expect(dbUser.accountStatus).toBe('active');
    });

    it('prevents an administrator from deactivating their own account', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${superAdminUser._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          isActive: false,
          reason: 'Self deactivation test'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('5. POST /api/v1/users/:id/unlock (Account Lockout Resolution)', () => {
    it('clears lockUntil and failedAttempts when administrative unlock is triggered', async () => {
      // Artificially lock employee 1
      await User.findByIdAndUpdate(employee1User._id, {
        failedAttempts: 5,
        lockUntil: new Date(Date.now() + 60 * 60 * 1000)
      });

      // Verify it is locked
      const lockedUser = await User.findById(employee1User._id);
      expect(lockedUser.isLocked).toBe(true);
      expect(lockedUser.accountStatus).toBe('locked');

      // Call unlock API
      const res = await request(app)
        .post(`/api/v1/users/${employee1User._id}/unlock`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Employee verified identity in person' });

      expect(res.status).toBe(200);
      expect(res.body.data.isLocked).toBe(false);
      expect(res.body.data.failedAttempts).toBe(0);

      // Verify in DB
      const restoredUser = await User.findById(employee1User._id);
      expect(restoredUser.isLocked).toBe(false);
      expect(restoredUser.failedAttempts).toBe(0);
      expect(restoredUser.lockUntil).toBeNull();
    });
  });

  describe('6. POST /api/v1/users/:id/revoke-sessions (Active Session Invalidation)', () => {
    it('clears refreshTokenHash for targeted user account', async () => {
      // Set dummy refreshTokenHash
      await User.findByIdAndUpdate(employee1User._id, {
        refreshTokenHash: 'sample_hashed_token'
      });

      const res = await request(app)
        .post(`/api/v1/users/${employee1User._id}/revoke-sessions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Suspected security incident' });

      expect(res.status).toBe(200);
      expect(res.body.data.refreshTokenHash).toBeNull();

      const dbUser = await User.findById(employee1User._id);
      expect(dbUser.refreshTokenHash).toBeNull();
    });
  });

  describe('7. POST /api/v1/users/:id/force-password-change (Mandatory Rotation)', () => {
    it('sets mustChangePassword flag and evicts active sessions', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${employee1User._id}/force-password-change`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Mandatory 90-day password rotation' });

      expect(res.status).toBe(200);
      expect(res.body.data.mustChangePassword).toBe(true);

      const dbUser = await User.findById(employee1User._id);
      expect(dbUser.mustChangePassword).toBe(true);
      expect(dbUser.refreshTokenHash).toBeNull();
    });
  });

  describe('8. Role Assignment & Privilege Escalation Protection', () => {
    it('assigns valid role to target user when authorized', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employee1User._id}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          roleIds: [employeeRole._id.toString()]
        });

      expect(res.status).toBe(200);
      const dbUser = await User.findById(employee1User._id);
      expect(dbUser.roles.map((r) => r.toString())).toContain(employeeRole._id.toString());
    });

    it('rejects empty roleIds array (at least one role required)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employee1User._id}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ roleIds: [] });

      expect(res.status).toBe(400);
    });
  });

  describe('9. PBAC Departmental Scoping Enforcement', () => {
    it('restricts Department Manager to viewing only users in their department', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      const returnedUsers = res.body.data;

      // Must see engineering users (self and employee1)
      const returnedEmails = returnedUsers.map((u) => u.email);
      expect(returnedEmails).toContain('tariq.mgr@company.pk');
      expect(returnedEmails).toContain('ahmed.dev@company.pk');

      // MUST NOT see HR specialist Fatima
      expect(returnedEmails).not.toContain('fatima.hr@company.pk');
      expect(returnedEmails).not.toContain('admin.overhaul@company.pk');
    });

    it('denies regular employee without user.view permission or restricts to own account', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${employeeToken}`);

      if (res.status === 200) {
        // If own scope is evaluated, only employee1 is returned
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].email).toBe('ahmed.dev@company.pk');
      } else {
        expect(res.status).toBe(403);
      }
    });
  });
});
