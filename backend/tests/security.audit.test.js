/**
 * @file security.audit.test.js
 * @description Universal multi-role 403 Forbidden and 401 Unauthorized PBAC security audit matrix.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module X1.4 — Universal Server-Side PBAC Route Enforcement & 403 Audit Matrix', { timeout: 30000 }, () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_x1_sec_audit');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});

    // 1. Roles Setup
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'all' },
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'attendance.view', subject: 'Attendance', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'attendance.view', subject: 'Attendance', scope: 'team' },
        { action: 'leave.view', subject: 'Leave', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
        { action: 'leave.view', subject: 'Leave', scope: 'own' }
      ]
    });

    // 2. Users Setup
    superAdminUser = await User.create({
      email: 'sec.admin@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [superAdminRole._id],
      status: 'active'
    });

    hrUser = await User.create({
      email: 'sec.hr@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [hrRole._id],
      status: 'active'
    });

    managerUser = await User.create({
      email: 'sec.mgr@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [managerRole._id],
      status: 'active'
    });

    employeeUser = await User.create({
      email: 'sec.emp@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [employeeRole._id],
      status: 'active'
    });

    // 3. Tokens
    const signToken = (user, roleName) =>
      jwt.sign(
        {
          userId: user._id,
          email: user.email,
          roles: [roleName]
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin');
    hrToken = signToken(hrUser, 'HR Manager');
    managerToken = signToken(managerUser, 'Department Manager');
    employeeToken = signToken(employeeUser, 'Employee');
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Unauthenticated Perimeter Gate (401 Unauthorized)', () => {
    const endpoints = [
      '/api/v1/audit-logs',
      '/api/v1/settings',
      '/api/v1/roles',
      '/api/v1/payroll/runs',
      '/api/v1/employees',
      '/api/v1/leaves/balance',
      '/api/v1/dashboard/admin'
    ];

    endpoints.forEach((ep) => {
      it(`X1.4-TEST: Unauthenticated request to ${ep} strictly returns 401`, async () => {
        const res = await request(app).get(ep);
        expect(res.status).toBe(401);
      });
    });
  });

  describe('Administrative Privilege Isolation (Audit Logs)', () => {
    it('X1.4-TEST: Super Admin can access /api/v1/audit-logs (200 OK)', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('X1.4-TEST: HR Manager is blocked from /api/v1/audit-logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(res.status).toBe(403);
    });

    it('X1.4-TEST: Department Manager is blocked from /api/v1/audit-logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });

    it('X1.4-TEST: Regular Employee is blocked from /api/v1/audit-logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Financial Data Isolation (Payroll & Financial Reports)', () => {
    it('X1.4-TEST: Department Manager is blocked from /api/v1/payroll/runs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/payroll/runs')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });

    it('X1.4-TEST: Department Manager is blocked from /api/v1/reports/payroll (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/payroll')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });

    it('X1.4-TEST: Employee is blocked from /api/v1/payroll/runs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/payroll/runs')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Configuration & RBAC Isolation', () => {
    it('X1.4-TEST: Department Manager is blocked from /api/v1/roles (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });

    it('X1.4-TEST: Employee is blocked from /api/v1/roles (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('X1.4-TEST: Employee is blocked from /api/v1/dashboard/admin (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });
});
