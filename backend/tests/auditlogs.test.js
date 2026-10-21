/**
 * @file auditlogs.test.js
 * @description Integration tests for Module X1.1 Audit Log Explorer, forensic filters, and PBAC.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { recordAuditLog } from '../src/services/audit.service.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module X1.1 — Audit Log Explorer & Forensics Integration Tests', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  let sampleLogId;

  const todayStr = dayjs().format('YYYY-MM-DD');
  const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_x1_auditlogs');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await AuditLog.deleteMany({});

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
        { action: 'payroll.view', subject: 'Payroll', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'attendance.view', subject: 'Attendance', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' }
      ]
    });

    // 2. Users Setup
    superAdminUser = await User.create({
      email: 'admin.audit@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [superAdminRole._id],
      status: 'active'
    });

    hrUser = await User.create({
      email: 'hr.audit@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [hrRole._id],
      status: 'active'
    });

    managerUser = await User.create({
      email: 'mgr.audit@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [managerRole._id],
      status: 'active'
    });

    employeeUser = await User.create({
      email: 'emp.audit@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [employeeRole._id],
      status: 'active'
    });

    // 3. JWT Tokens
    const signToken = (user, role) =>
      jwt.sign(
        {
          userId: user._id,
          email: user.email,
          roles: [role.name]
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, superAdminRole);
    hrToken = signToken(hrUser, hrRole);
    managerToken = signToken(managerUser, managerRole);
    employeeToken = signToken(employeeUser, employeeRole);

    // 4. Seed Audit Log entries across multiple modules
    const log1 = await recordAuditLog({
      userId: superAdminUser._id,
      actor: superAdminUser,
      action: 'SALARY_UPDATED',
      entity: 'SalaryStructure',
      entityId: new mongoose.Types.ObjectId(),
      before: { baseSalary: 8000000, grossSalary: 9500000 },
      after: { baseSalary: 9000000, grossSalary: 10500000 },
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Test Suite'
    });
    sampleLogId = log1._id;

    await recordAuditLog({
      userId: hrUser._id,
      actor: hrUser,
      action: 'EMPLOYEE_STATUS_CHANGED',
      entity: 'Employee',
      entityId: new mongoose.Types.ObjectId(),
      before: { status: 'probation' },
      after: { status: 'confirmed' },
      ip: '192.168.1.101',
      userAgent: 'Mozilla/5.0 Test Suite'
    });

    await recordAuditLog({
      userId: managerUser._id,
      actor: managerUser,
      action: 'LEAVE_RECOMMENDED',
      entity: 'Leave',
      entityId: new mongoose.Types.ObjectId(),
      before: { status: 'pending' },
      after: { status: 'manager_approved' },
      ip: '192.168.1.102',
      userAgent: 'Mozilla/5.0 Test Suite'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('X1.1-TEST: GET /api/v1/audit-logs returns 200 with paginated audit logs for Super Admin', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
    expect(res.body.meta.page).toBe(1);
  });

  it('X1.1-TEST: GET /api/v1/audit-logs filters strictly by module', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?module=salarystructure')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].action).toBe('SALARY_UPDATED');
    expect(res.body.data[0].module).toBe('salarystructure');
  });

  it('X1.1-TEST: GET /api/v1/audit-logs filters strictly by action', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?action=EMPLOYEE_STATUS_CHANGED')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].action).toBe('EMPLOYEE_STATUS_CHANGED');
  });

  it('X1.1-TEST: GET /api/v1/audit-logs/:id returns 200 with full diff metadata for Super Admin', async () => {
    const res = await request(app)
      .get(`/api/v1/audit-logs/${sampleLogId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(sampleLogId.toString());
    expect(res.body.data.details).toBeDefined();
    expect(res.body.data.details.before).toEqual({ baseSalary: 8000000, grossSalary: 9500000 });
    expect(res.body.data.details.after).toEqual({ baseSalary: 9000000, grossSalary: 10500000 });
  });

  it('X1.1-TEST: Returns 400 Bad Request when startDate is after endDate', async () => {
    const res = await request(app)
      .get(`/api/v1/audit-logs?startDate=2026-10-25&endDate=2026-10-20`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('X1.1-TEST: Disallows HR Manager from GET /api/v1/audit-logs (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('X1.1-TEST: Disallows Department Manager from GET /api/v1/audit-logs (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('X1.1-TEST: Disallows regular Employee from GET /api/v1/audit-logs (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('X1.1-TEST: Disallows unauthenticated requests (401 Unauthorized)', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs');

    expect(res.status).toBe(401);
  });
});
