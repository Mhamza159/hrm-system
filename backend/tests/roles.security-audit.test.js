/**
 * @file roles.security-audit.test.js
 * @description Adversarial Security Hardening, Boundary Integrity & Stress Tests for Module M26.
 * 
 * METHODOLOGY:
 * Doubt-Driven Development & Security Hardening across 5 Critical Pillars:
 * 1. Privilege Escalation & Authority Spoofing Guards
 * 2. System Role Immutability & Structural Invariants
 * 3. NoSQL Injection, Payload Sanitization & XSS Defenses
 * 4. Approval Delegation Logic & Temporal Integrity
 * 5. Concurrent Requests, Double-Clicks & Race Condition Stress Tests
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

describe('Module M26 — Adversarial Security Hardening & Stress-Test Audit', () => {
  let superAdminToken;
  let hrManagerToken;
  let deptManagerToken;
  let employeeToken;

  let superAdminUser;
  let hrManagerUser;
  let deptManagerUser;
  let employeeUser;

  let superAdminRole;
  let hrManagerRole;
  let deptManagerRole;
  let employeeRole;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_sec_audit');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});
    await Delegation.deleteMany({});

    // 1. Seed Core Roles
    superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Executive Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    hrManagerRole = await Role.create({
      name: 'HR Manager',
      description: 'HR Administrator',
      isSystem: true,
      permissions: [
        { action: 'role.view', subject: 'Role', scope: 'all' },
        { action: 'role.assign', subject: 'Role', scope: 'all' },
        { action: 'user.manage', subject: 'User', scope: 'all' },
        { action: 'employee.view', subject: 'Employee', scope: 'all' }
      ]
    });

    deptManagerRole = await Role.create({
      name: 'Department Manager',
      description: 'Department Head',
      isSystem: true,
      permissions: [
        { action: 'leave.approve', subject: 'Leave', scope: 'department' },
        { action: 'delegation.create', subject: 'Role', scope: 'own' }
      ]
    });

    employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard Organization Staff',
      isSystem: true,
      permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
    });

    // 2. Seed Users
    superAdminUser = await User.create({
      email: 'sec.admin@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrManagerUser = await User.create({
      email: 'sec.hr@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrManagerRole._id],
      isActive: true
    });

    deptManagerUser = await User.create({
      email: 'sec.manager@company.pk',
      passwordHash: 'dummy_hash',
      roles: [deptManagerRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'sec.employee@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    // Sign Tokens
    superAdminToken = jwt.sign(
      { userId: superAdminUser._id, email: superAdminUser.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    hrManagerToken = jwt.sign(
      { userId: hrManagerUser._id, email: hrManagerUser.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    deptManagerToken = jwt.sign(
      { userId: deptManagerUser._id, email: deptManagerUser.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    employeeToken = jwt.sign(
      { userId: employeeUser._id, email: employeeUser.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Delegation.deleteMany({});
    await mongoose.disconnect();
  });

  // ============================================================================
  // PILLAR 1: Privilege Escalation & Authority Spoofing Guards
  // ============================================================================
  describe('Pillar 1: Privilege Escalation & Authority Spoofing Guards', () => {
    it('1.1: HR Manager cannot assign Super Admin role to any user (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employeeUser._id}/roles`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ roleIds: [superAdminRole._id.toString()] });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Privilege Escalation Guard');
    });

    it('1.2: HR Manager cannot assign custom roles containing permissions exceeding their own (HTTP 403)', async () => {
      // Create a high-privilege custom role (contains settings.manage which HR does not have)
      const highPrivRole = await Role.create({
        name: 'Infrastructure Lead',
        description: 'Server & settings manager',
        isSystem: false,
        permissions: [{ action: 'settings.manage', subject: 'Setting', scope: 'all' }]
      });

      const res = await request(app)
        .patch(`/api/v1/users/${employeeUser._id}/roles`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ roleIds: [highPrivRole._id.toString()] });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('exceeds your own administrative authorizations');
    });

    it('1.3: Regular Employee cannot mutate, create, or delete roles (HTTP 403)', async () => {
      const createRes = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Hacker Role',
          permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
        });
      expect(createRes.status).toBe(403);

      const deleteRes = await request(app)
        .delete(`/api/v1/roles/${employeeRole._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(deleteRes.status).toBe(403);
    });

    it('1.4: Department Manager cannot call role assignment endpoint (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${employeeUser._id}/roles`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({ roleIds: [employeeRole._id.toString()] });

      expect(res.status).toBe(403);
    });
  });

  // ============================================================================
  // PILLAR 2: System Role Immutability & Structural Invariants
  // ============================================================================
  describe('Pillar 2: System Role Immutability & Invariants', () => {
    it('2.1: Deleting a system role returns HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .delete(`/api/v1/roles/${superAdminRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('System core roles are protected');
    });

    it('2.2: Renaming a system role returns HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/v1/roles/${superAdminRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Demoted Admin' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('System default roles cannot be renamed');
    });

    it('2.3: Wiping all permissions from Super Admin role returns HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/v1/roles/${superAdminRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ permissions: [] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Super Admin role must retain permissions');
    });

    it('2.4: Deleting a custom role currently assigned to active users returns HTTP 409 Conflict', async () => {
      const customRole = await Role.create({
        name: 'Temporary Assigned Role',
        isSystem: false,
        permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
      });

      // Assign to employee
      await User.findByIdAndUpdate(employeeUser._id, { roles: [customRole._id] });

      const res = await request(app)
        .delete(`/api/v1/roles/${customRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('assigned to 1 user(s)');
    });
  });

  // ============================================================================
  // PILLAR 3: NoSQL Injection, Payload Sanitization & XSS Defenses
  // ============================================================================
  describe('Pillar 3: NoSQL Injection & Payload Boundary Attacks', () => {
    it('3.1: NoSQL operator injection in role creation payload is rejected with HTTP 400 by Zod', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: { $gt: '' },
          permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('3.2: Malicious regex injection in role search query is safely escaped and does not crash', async () => {
      const res = await request(app)
        .get('/api/v1/roles?search=.*((a+)+)+$')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('3.3: Empty role name, whitespace-only name, or single-character name returns HTTP 400', async () => {
      const emptyNameRes = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: '   ',
          permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
        });
      expect(emptyNameRes.status).toBe(400);

      const shortNameRes = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'A',
          permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
        });
      expect(shortNameRes.status).toBe(400);
    });

    it('3.4: Oversized payload (>16KB) is rejected with HTTP 413 Payload Too Large', async () => {
      const hugeData = 'A'.repeat(25 * 1024);
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Huge', description: hugeData });

      expect(res.status).toBe(413);
    });
  });

  // ============================================================================
  // PILLAR 4: Approval Delegation Boundary Stress Tests
  // ============================================================================
  describe('Pillar 4: Approval Delegation Temporal & Authority Bounds', () => {
    it('4.1: Manager cannot delegate approvals to themselves (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/delegations')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          toUserId: deptManagerUser._id.toString(),
          permissions: [{ action: 'leave.approve', subject: 'Leave', scope: 'department' }],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          reason: 'Self delegation attempt'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delegate approvals to yourself');
    });

    it('4.2: Delegation where endDate precedes or equals startDate returns HTTP 400 Bad Request', async () => {
      const now = new Date();
      const yesterday = new Date(Date.now() - 86400000);

      const res = await request(app)
        .post('/api/v1/delegations')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          toUserId: employeeUser._id.toString(),
          permissions: [{ action: 'leave.approve', subject: 'Leave', scope: 'department' }],
          startDate: now.toISOString(),
          endDate: yesterday.toISOString(),
          reason: 'Backdated delegation'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('End date must occur after start date');
    });

    it('4.3: Unauthorized third-party user cannot cancel another user\'s delegation (HTTP 403)', async () => {
      // 1. Manager delegates to employee
      const delegation = await Delegation.create({
        fromUserId: deptManagerUser._id,
        toUserId: employeeUser._id,
        permissions: [{ action: 'leave.approve', subject: 'Leave', scope: 'department' }],
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status: 'active'
      });

      // 2. HR attempts to cancel manager's delegation (only delegator or Super Admin can cancel)
      const res = await request(app)
        .delete(`/api/v1/delegations/${delegation._id}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the delegating manager or Super Admin can cancel this delegation');
    });
  });

  // ============================================================================
  // PILLAR 5: Concurrency, Double-Click & Race Conditions
  // ============================================================================
  describe('Pillar 5: Concurrency, Double-Click & Race Conditions', () => {
    it('5.1: 5 concurrent parallel role assignment requests evaluate cleanly without deadlock', async () => {
      const targetUser = await User.create({
        email: 'concurrent.roles@company.pk',
        passwordHash: 'dummy',
        isActive: true
      });

      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .patch(`/api/v1/users/${targetUser._id}/roles`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ roleIds: [employeeRole._id.toString()] })
      );

      const results = await Promise.all(promises);
      for (const res of results) {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }

      const finalUser = await User.findById(targetUser._id);
      expect(finalUser.roles.length).toBe(1);
      expect(finalUser.roles[0].toString()).toBe(employeeRole._id.toString());
    });

    it('5.2: Concurrent duplicate role creation with identical name allows exactly one success (HTTP 201) and rejects duplicate (HTTP 409)', async () => {
      const roleName = `RaceRole_${Date.now()}`;

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/v1/roles')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            name: roleName,
            permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
          }),
        request(app)
          .post('/api/v1/roles')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            name: roleName,
            permissions: [{ action: 'profile.view', subject: 'Employee', scope: 'own' }]
          })
      ]);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);
    });
  });
});
