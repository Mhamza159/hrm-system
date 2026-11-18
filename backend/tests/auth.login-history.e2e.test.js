/**
 * @file auth.login-history.e2e.test.js
 * @description End-to-end integration test suite for the Phase 24 Login History Module.
 * Covers authentication events, user-agent parsing, threat correlation, stats aggregation,
 * multi-filter search, CSV export, and PBAC/RBAC data scope isolation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { LoginHistory } from '../src/models/loginHistory.model.js';
import { env } from '../src/config/env.js';

describe('Phase 24: Login History Module E2E Test Suite', () => {
  const adminEmail = 'superadmin.e2e@company.pk';
  const employeeEmail = 'employee.e2e@company.pk';
  const deactivatedEmail = 'deactivated.e2e@company.pk';
  const twoFactorEmail = 'twofactor.e2e@company.pk';
  const testPassword = 'Password123!';

  let adminToken;
  let employeeToken;
  let adminUser;
  let employeeUser;
  let deactivatedUser;
  let twoFactorUser;
  let testDepartment;
  let testEmployee;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p24_history');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await LoginHistory.deleteMany({});

    // 1. Seed Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'System Super Administrator',
      permissions: [{ action: 'manage', subject: 'all' }]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard Employee',
      permissions: [
        { action: 'login.history', subject: 'User', scope: 'own' },
        { action: 'read', subject: 'attendance' }
      ]
    });

    // 2. Seed Department & Employee
    testDepartment = await Department.create({
      name: 'Engineering',
      code: 'ENG'
    });

    const passwordHash = await User.hashPassword(testPassword);

    // 3. Seed Super Admin User
    adminUser = await User.create({
      email: adminEmail,
      passwordHash,
      roles: [superAdminRole._id],
      isActive: true
    });

    // 4. Seed Employee User & Link Employee record
    employeeUser = await User.create({
      email: employeeEmail,
      passwordHash,
      roles: [employeeRole._id],
      isActive: true
    });

    testEmployee = await Employee.create({
      userId: employeeUser._id,
      name: 'John Doe',
      employeeCode: 'EMP-001',
      email: employeeEmail,
      departmentId: testDepartment._id
    });

    // 5. Seed Deactivated User
    deactivatedUser = await User.create({
      email: deactivatedEmail,
      passwordHash,
      roles: [employeeRole._id],
      isActive: false
    });

    // 6. Seed 2FA Enabled User
    twoFactorUser = await User.create({
      email: twoFactorEmail,
      passwordHash,
      roles: [employeeRole._id],
      isActive: true,
      twoFactorEnabled: true
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await LoginHistory.deleteMany({});
    await mongoose.disconnect();
  });

  it('1. POST /api/v1/auth/login creates a SUCCESS record with parsed browser, OS, and employee snapshot', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      .send({ email: employeeEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    employeeToken = res.body.data.accessToken;

    const record = await LoginHistory.findOne({ email: employeeEmail, status: 'SUCCESS' }).sort({ createdAt: -1 });
    expect(record).toBeDefined();
    expect(record.employeeName).toBe('John Doe');
    expect(record.employeeCode).toBe('EMP-001');
    expect(record.department).toBe('Engineering');
    expect(record.browser).toContain('Chrome');
    expect(record.os).toContain('Windows');
    expect(record.deviceType).toBe('DESKTOP');
  });

  it('2. Failed login with wrong password generates FAILED record with failureReason: Invalid email or password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: 'WrongPassword999!' });

    expect(res.status).toBe(401);

    const record = await LoginHistory.findOne({ email: employeeEmail, status: 'FAILED' }).sort({ createdAt: -1 });
    expect(record).toBeDefined();
    expect(record.failureReason).toContain('Invalid');
    expect(record.employeeName).toBe('John Doe');
  });

  it('3. Login attempt with unregistered email generates FAILED record without user enumeration leak', async () => {
    const unknownEmail = 'nonexistent.user.999@company.pk';
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: unknownEmail, password: 'SomePassword123!' });

    expect(res.status).toBe(401);

    const record = await LoginHistory.findOne({ email: unknownEmail });
    expect(record).toBeDefined();
    expect(record.status).toBe('FAILED');
    expect(record.employeeName).toBe('Unregistered Account');
    expect(record.userId).toBeNull();
  });

  it('4. Deactivated user login generates RESTRICTED record with descriptive reason', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: deactivatedEmail, password: testPassword });

    expect(res.status).toBe(403);

    const record = await LoginHistory.findOne({ email: deactivatedEmail, status: 'RESTRICTED' });
    expect(record).toBeDefined();
    expect(record.failureReason).toBe('Account is deactivated');
  });

  it('5. Five consecutive wrong passwords trigger account lockout and record LOCKED', async () => {
    const bruteEmail = 'brute.target@company.pk';
    const bruteHash = await User.hashPassword(testPassword);
    await User.create({
      email: bruteEmail,
      passwordHash: bruteHash,
      isActive: true,
      failedAttempts: 4
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: bruteEmail, password: 'FinalWrongPassword!' });

    expect(res.status).toBe(423);

    const lockedRecord = await LoginHistory.findOne({ email: bruteEmail, status: 'LOCKED' });
    expect(lockedRecord).toBeDefined();
    expect(lockedRecord.failureReason).toContain('Account locked');
  });

  it('6. 2FA challenge generates 2FA_PENDING record when twoFactorEnabled is active', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: twoFactorEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.twoFactorRequired).toBe(true);
    expect(res.body.data.tempToken).toBeDefined();

    const record = await LoginHistory.findOne({ email: twoFactorEmail, status: '2FA_PENDING' }).sort({ createdAt: -1 });
    expect(record).toBeDefined();
    expect(record.failureReason).toContain('Two-factor');
  });

  it('7. Successful 2FA verification creates SUCCESS record and issues tokens', async () => {
    // Generate valid OTP
    const validOtp = '654321';
    const otpHash = await bcrypt.hash(validOtp, 10);
    await User.updateOne(
      { email: twoFactorEmail },
      {
        twoFactorOtpHash: otpHash,
        twoFactorOtpExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    );

    const tempToken = jwt.sign(
      { userId: twoFactorUser._id, stage: '2fa_pending' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '10m' }
    );

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ tempToken, otp: validOtp });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    const record = await LoginHistory.findOne({ email: twoFactorEmail, status: 'SUCCESS' }).sort({ createdAt: -1 });
    expect(record).toBeDefined();
    expect(record.status).toBe('SUCCESS');
  });

  it('8. Failed 2FA verification creates 2FA_FAILED record', async () => {
    const wrongOtp = '999999';
    const tempToken = jwt.sign(
      { userId: twoFactorUser._id, stage: '2fa_pending' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '10m' }
    );

    // Set valid OTP hash in DB
    const otpHash = await bcrypt.hash('123456', 10);
    await User.updateOne(
      { email: twoFactorEmail },
      {
        twoFactorOtpHash: otpHash,
        twoFactorOtpExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    );

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ tempToken, otp: wrongOtp });

    expect(res.status).toBe(400);

    const record = await LoginHistory.findOne({ email: twoFactorEmail, status: '2FA_FAILED' }).sort({ createdAt: -1 });
    expect(record).toBeDefined();
    expect(record.failureReason).toContain('Invalid two-factor');
  });

  it('9. GET /api/v1/auth/login-history supports status and device filtering', async () => {
    // Login as Super Admin
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = adminLoginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/login-history?status=SUCCESS&deviceType=DESKTOP')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.docs.length).toBeGreaterThanOrEqual(1);

    res.body.data.docs.forEach((doc) => {
      expect(doc.status).toBe('SUCCESS');
      expect(doc.deviceType).toBe('DESKTOP');
    });
  });

  it('10. GET /api/v1/auth/login-history supports keyword search across email and name', async () => {
    const res = await request(app)
      .get('/api/v1/auth/login-history?search=John%20Doe')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.docs.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.docs[0].employeeName).toBe('John Doe');
  });

  it('11. GET /api/v1/auth/login-history/stats returns accurate aggregated metrics', async () => {
    const res = await request(app)
      .get('/api/v1/auth/login-history/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const stats = res.body.data;
    expect(stats.totalAttempts).toBeGreaterThan(0);
    expect(stats.successfulLogins).toBeGreaterThan(0);
    expect(stats.failedLogins).toBeGreaterThan(0);
    expect(stats.lockedAttempts).toBeGreaterThanOrEqual(1);
    expect(stats.uniqueAccounts).toBeGreaterThan(0);
    expect(stats.successRate).toBeGreaterThanOrEqual(0);
  });

  it('12. GET /api/v1/auth/login-history/:id returns attempt details with security correlation', async () => {
    const anyRecord = await LoginHistory.findOne({ email: employeeEmail });
    expect(anyRecord).toBeDefined();

    const res = await request(app)
      .get(`/api/v1/auth/login-history/${anyRecord._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(anyRecord._id.toString());
    expect(res.body.data.securityCorrelation).toBeDefined();
    expect(typeof res.body.data.securityCorrelation.recentFailuresFromIp).toBe('number');
  });

  it('13. GET /api/v1/auth/login-history/export streams well-formatted CSV with appropriate headers', async () => {
    const res = await request(app)
      .get('/api/v1/auth/login-history/export')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment; filename=');
    expect(res.text).toContain('Timestamp (PKT),Account Email,Employee Name');
  });

  it('14. Employee with scope: own is isolated from other users in logs and export', async () => {
    const listRes = await request(app)
      .get('/api/v1/auth/login-history')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(listRes.status).toBe(200);
    listRes.body.data.docs.forEach((doc) => {
      expect(doc.email).toBe(employeeEmail);
    });

    const exportRes = await request(app)
      .get('/api/v1/auth/login-history/export')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(exportRes.status).toBe(200);
    expect(exportRes.text).toContain(employeeEmail);
    expect(exportRes.text).not.toContain(adminEmail);
  });

  it('15. Unauthenticated callers receive 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/auth/login-history');
    expect(res.status).toBe(401);
  });
});
