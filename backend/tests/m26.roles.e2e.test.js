/**
 * @file m26.roles.e2e.test.js
 * @description Comprehensive Multi-Role End-to-End Verification for Module M26.
 * 
 * SPECIFICATION & COVERAGE:
 * - Module: M26 Roles & Permissions (RBAC & CASL) (BUILD-GUIDE Section 5 · Rows 26.1 - 26.17)
 * - Roles Tested:
 *   1. Super Admin: Role authoring, permissions configuration, cloning, assignment.
 *   2. HR Manager: Role assignment, privilege escalation prevention, system protection.
 *   3. Department Manager: Approvals delegation lifecycle, dynamic ability inheritance.
 *   4. Employee: Self-service access profile, unauthorized route denial.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Delegation } from '../src/models/delegation.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M26 End-to-End Multi-Role Verification (E2E-M26)', () => {
  let superAdminToken;
  let hrManagerToken;
  let deptManagerToken;
  let employeeToken;

  let superAdminRole;
  let hrManagerRole;
  let deptManagerRole;
  let employeeRole;

  let employeeUser;
  let peerManagerUser;
  let createdCustomRoleId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_e2e_full');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});
    await Delegation.deleteMany({});

    // 1. Seed Core System Roles
    superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    hrManagerRole = await Role.create({
      name: 'HR Manager',
      description: 'Human Resources Management',
      isSystem: true,
      permissions: [
        { action: 'role.view', subject: 'Role', scope: 'all' },
        { action: 'role.assign', subject: 'Role', scope: 'all' },
        { action: 'user.manage', subject: 'User', scope: 'all' },
        { action: 'employee.view', subject: 'Employee', scope: 'all' },
        { action: 'leave.view', subject: 'Leave', scope: 'all' }
      ]
    });

    deptManagerRole = await Role.create({
      name: 'Department Manager',
      description: 'Department Head & Line Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.approve', subject: 'Leave', scope: 'department' },
        { action: 'expense.approve', subject: 'Expense', scope: 'department', limit: 50000 },
        { action: 'team.view', subject: 'Employee', scope: 'team' }
      ]
    });

    employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard Organization Staff',
      isSystem: true,
      permissions: [
        { action: 'profile.view', subject: 'Employee', scope: 'own' },
        { action: 'leave.request', subject: 'Leave', scope: 'own' },
        { action: 'attendance.clock', subject: 'Attendance', scope: 'own' }
      ]
    });

    // 2. Seed Users for 4 Roles
    const superAdminUser = await User.create({
      email: 'admin.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    const hrManagerUser = await User.create({
      email: 'hr.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrManagerRole._id],
      isActive: true
    });

    const deptManagerUser = await User.create({
      email: 'dept.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [deptManagerRole._id],
      isActive: true
    });

    peerManagerUser = await User.create({
      email: 'peer.dept.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'emp.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    // 3. Issue JWT Access Tokens
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    hrManagerToken = jwt.sign({ userId: hrManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    deptManagerToken = jwt.sign({ userId: deptManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Delegation.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Role 1: Super Admin Flow', () => {
    it('1.1: Super Admin creates custom role "Finance Officer"', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Finance Officer',
          description: 'Payroll processing and ledger sign-off',
          permissions: [
            { action: 'payroll.process', subject: 'Payroll', scope: 'all' },
            { action: 'expense.approve', subject: 'Expense', scope: 'department', limit: 100000 }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Finance Officer');
      expect(res.body.data.isSystem).toBe(false);
      createdCustomRoleId = res.body.data._id;
    });

    it('1.2: Super Admin clones "Finance Officer" to "Assistant Finance"', async () => {
      const res = await request(app)
        .post(`/api/v1/roles/${createdCustomRoleId}/clone`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ newName: 'Assistant Finance' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Assistant Finance');
      expect(res.body.data.isSystem).toBe(false);
      expect(res.body.data.permissions).toHaveLength(2);
    });

    it('1.3: Super Admin assigns custom role to Employee', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employeeUser._id}/roles`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          roleIds: [employeeRole._id.toString(), createdCustomRoleId]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toHaveLength(2);
    });
  });

  describe('Role 2: HR Manager Flow & Security Guards', () => {
    it('2.1: HR Manager retrieves role list and permissions catalogue', async () => {
      const permsRes = await request(app)
        .get('/api/v1/permissions')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(permsRes.status).toBe(200);
      expect(permsRes.body.success).toBe(true);

      const rolesRes = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(rolesRes.status).toBe(200);
      expect(rolesRes.body.success).toBe(true);
      expect(rolesRes.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('2.2: HR Manager is blocked from privilege escalation (assigning Super Admin role)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employeeUser._id}/roles`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          roleIds: [superAdminRole._id.toString()]
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Privilege Escalation Guard/i);
    });

    it('2.3: HR Manager is blocked from deleting or renaming system roles', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/roles/${superAdminRole._id}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(deleteRes.status).toBe(403); // Forbidden for HR Manager without role.manage

      const renameRes = await request(app)
        .patch(`/api/v1/roles/${superAdminRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Hacked Super Admin' });

      expect(renameRes.status).toBe(400); // 400 Bad Request: system roles cannot be renamed
      expect(renameRes.body.message).toMatch(/cannot be renamed/i);
    });
  });

  describe('Role 3: Department Manager Approvals Delegation Lifecycle', () => {
    let delegationId;

    it('3.1: Department Manager creates 7-day approval delegation to peer', async () => {
      const now = Date.now();
      const res = await request(app)
        .post('/api/v1/delegations')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          toUserId: peerManagerUser._id.toString(),
          startDate: new Date(now - 1000).toISOString(),
          endDate: new Date(now + 7 * 86400000).toISOString(),
          permissions: [
            { action: 'leave.approve', subject: 'Leave', scope: 'department' }
          ],
          reason: 'Coverage for medical leave'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
      delegationId = res.body.data._id;
    });

    it('3.2: Peer user profile dynamically reflects inherited delegation', async () => {
      const peerToken = jwt.sign({ userId: peerManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${peerToken}`);

      expect(res.status).toBe(200);
      const delegated = res.body.data.effectivePermissions.find((p) => p.action === 'leave.approve');
      expect(delegated).toBeDefined();
      expect(delegated.isDelegated).toBe(true);
    });

    it('3.3: Delegator revokes delegation, removing temporary abilities', async () => {
      const cancelRes = await request(app)
        .delete(`/api/v1/delegations/${delegationId}`)
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(cancelRes.status).toBe(200);

      const peerToken = jwt.sign({ userId: peerManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
      const verifyRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${peerToken}`);

      const delegated = verifyRes.body.data.effectivePermissions.find((p) => p.action === 'leave.approve');
      expect(delegated).toBeUndefined();
    });
  });

  describe('Role 4: Employee Self-Service & Access Restrictions', () => {
    it('4.1: Employee views self-service identity and active permissions', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toBeDefined();
      expect(res.body.data.effectivePermissions.length).toBeGreaterThanOrEqual(1);
    });

    it('4.2: Employee attempt to call privileged role endpoints is rejected with 403', async () => {
      const createRoleRes = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Hacker Role' });

      expect(createRoleRes.status).toBe(403);
      expect(createRoleRes.body.success).toBe(false);

      const viewRolesRes = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(viewRolesRes.status).toBe(403);
      expect(viewRolesRes.body.success).toBe(false);
    });
  });
});
