/**
 * @file audit.module.overhaul.test.js
 * @description Comprehensive automated test suite for Phase 31 Audit Log Module Overhaul.
 * Verifies RBAC, PBAC, statistics, analytics, export, retention, sanitization, and immutability.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { AuditService } from '../src/services/audit.service.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Phase 31 — Audit Log Module Overhaul & Security Integration Tests', () => {
  let superAdminToken;
  let auditorToken;
  let hrToken;
  let employeeToken;

  let superAdminUser;
  let auditorUser;
  let hrUser;
  let employeeUser;

  let testLogId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p31_auditlogs');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const auditorRole = await Role.create({
      name: 'Compliance Auditor',
      isSystem: false,
      permissions: [
        { action: 'audit.view', subject: 'AuditLog', scope: 'all' },
        { action: 'audit.analytics', subject: 'AuditLog', scope: 'all' },
        { action: 'audit.export', subject: 'AuditLog', scope: 'all' }
      ]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'all' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' }
      ]
    });

    // 2. Users
    superAdminUser = await User.create({
      email: 'admin.audit31@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [superAdminRole._id],
      status: 'active'
    });

    auditorUser = await User.create({
      email: 'auditor.audit31@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [auditorRole._id],
      status: 'active'
    });

    hrUser = await User.create({
      email: 'hr.audit31@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [hrRole._id],
      status: 'active'
    });

    employeeUser = await User.create({
      email: 'emp.audit31@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [employeeRole._id],
      status: 'active'
    });

    // Generate JWT tokens
    const sign = (u, r) =>
      jwt.sign(
        {
          userId: u._id,
          email: u.email,
          roles: [r.name]
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );
    superAdminToken = sign(superAdminUser, superAdminRole);
    auditorToken = sign(auditorUser, auditorRole);
    hrToken = sign(hrUser, hrRole);
    employeeToken = sign(employeeUser, employeeRole);

    // 3. Seed Realistic Audit Log Events
    const log1 = await AuditService.log({
      actorId: superAdminUser._id,
      actorEmail: superAdminUser.email,
      actorRole: 'Super Admin',
      action: 'ROLE_CREATED',
      module: 'role',
      status: 'SUCCESS',
      severity: 'HIGH',
      category: 'ADMINISTRATIVE',
      description: 'Role Compliance Auditor created by Admin',
      targetModel: 'Role',
      ipAddress: '192.168.1.10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      details: {
        after: { name: 'Compliance Auditor', permissions: ['audit.view'] }
      }
    });
    testLogId = log1._id;

    await AuditService.log({
      actorId: hrUser._id,
      actorEmail: hrUser.email,
      actorRole: 'HR Manager',
      action: 'EMPLOYEE_UPDATED',
      module: 'employee',
      status: 'SUCCESS',
      severity: 'MEDIUM',
      category: 'DATA_CHANGE',
      description: 'Employee designation updated to Senior Engineer',
      targetModel: 'Employee',
      ipAddress: '192.168.1.20',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      details: {
        before: { designation: 'Junior Engineer' },
        after: { designation: 'Senior Engineer' }
      }
    });

    await AuditService.log({
      actorId: null,
      actorEmail: 'attacker@evil.com',
      actorRole: 'ANONYMOUS',
      action: 'LOGIN_FAILED',
      module: 'auth',
      status: 'FAILURE',
      severity: 'HIGH',
      category: 'SECURITY',
      description: 'Multiple invalid password attempts detected',
      ipAddress: '203.0.113.42',
      userAgent: 'curl/7.68.0',
      details: {
        reason: 'Invalid credentials',
        password: 'AttemptedPassword123!',
        token: 'secret_leak_attempt'
      }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. should allow Super Admin and Auditor to retrieve paginated audit logs', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3);

    const auditorRes = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${auditorToken}`);
    expect(auditorRes.status).toBe(200);
  });

  it('2. should filter audit logs by module, status, category, and severity', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?module=auth&status=FAILURE&category=SECURITY')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].action).toBe('LOGIN_FAILED');
    expect(res.body.data[0].status).toBe('FAILURE');
    expect(res.body.data[0].category).toBe('SECURITY');
  });

  it('3. should retrieve a single audit log with full before/after diff metadata', async () => {
    const res = await request(app)
      .get(`/api/v1/audit-logs/${testLogId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(String(testLogId));
    expect(res.body.data.action).toBe('ROLE_CREATED');
    expect(res.body.data.device.browser).toBe('Chrome');
    expect(res.body.data.device.os).toBe('Windows 10/11');
    expect(res.body.data.device.deviceType).toBe('Desktop');
  });

  it('4. should retrieve real-time audit statistics from database aggregation', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs/stats')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalEvents).toBeGreaterThanOrEqual(3);
    expect(res.body.data.failureEvents).toBe(1);
    expect(res.body.data.securityEvents).toBe(1);
    expect(res.body.data.adminEvents).toBe(1);
    expect(typeof res.body.data.successRate).toBe('number');
  });

  it('5. should retrieve analytics timeline, module distribution, and security trends', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs/analytics?timeRange=7d')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.timeRange).toBe('7d');
    expect(Array.isArray(res.body.data.timeline)).toBe(true);
    expect(Array.isArray(res.body.data.moduleDistribution)).toBe(true);
    expect(Array.isArray(res.body.data.securityTrends)).toBe(true);

    const authModule = res.body.data.moduleDistribution.find((m) => m.module === 'auth');
    expect(authModule).toBeDefined();
    expect(authModule.count).toBe(1);
  });

  it('6. should stream CSV export and record AUDIT_LOGS_EXPORTED event', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs/export')
      .set('Authorization', `Bearer ${auditorToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Event ID');
    expect(res.text).toContain('Timestamp (PKT)');
    expect(res.text).toContain('LOGIN_FAILED');

    // Verify internal audit record was created for the export
    const exportAudit = await AuditLog.findOne({ action: 'AUDIT_LOGS_EXPORTED' });
    expect(exportAudit).toBeDefined();
    expect(exportAudit.actorEmail).toBe(auditorUser.email);
  });

  it('7. should retrieve statutory retention summary', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs/retention')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalActive).toBeGreaterThanOrEqual(3);
    expect(res.body.data.statutoryRetentionDays).toBe(365);
    expect(res.body.data.immutablePolicyEnforced).toBe(true);
  });

  it('8. should sanitize and redact sensitive credentials from details payload', async () => {
    const failedLog = await AuditLog.findOne({ action: 'LOGIN_FAILED' });
    expect(failedLog).toBeDefined();
    expect(failedLog.details.password).toBe('[REDACTED]');
    expect(failedLog.details.token).toBe('[REDACTED]');
    expect(failedLog.details.reason).toBe('Invalid credentials');
  });

  it('9. should reject unauthorized roles without audit permissions (HTTP 403)', async () => {
    const hrRes = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(hrRes.status).toBe(403);

    const empRes = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(empRes.status).toBe(403);

    const unauthRes = await request(app).get('/api/v1/audit-logs');
    expect(unauthRes.status).toBe(401);
  });

  it('10. should enforce immutability: reject PUT, PATCH, DELETE mutations (404/405)', async () => {
    const putRes = await request(app)
      .put(`/api/v1/audit-logs/${testLogId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ action: 'MUTATED_ACTION' });
    expect(putRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/audit-logs/${testLogId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ action: 'MUTATED_ACTION' });
    expect(patchRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/v1/audit-logs/${testLogId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(deleteRes.status).toBe(404);

    // Verify record in database remains untouched
    const intactRecord = await AuditLog.findById(testLogId);
    expect(intactRecord.action).toBe('ROLE_CREATED');
  });
});
