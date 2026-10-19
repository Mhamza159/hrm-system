/**
 * @file auth.login-history.test.js
 * @description Vitest Test Suite for Login History Tracking & Audit Records (Slice 1.12-TEST).
 * 
 * SPECIFICATION & SECURITY VERIFICATIONS:
 * 1. Logins write audit records to the LoginHistory collection.
 * 2. Regular employees calling GET /auth/login-history see only their own login history.
 * 3. Super Admin & HR Manager calling GET /auth/login-history see records across all company users.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { LoginHistory } from '../src/models/loginHistory.model.js';
import { env } from '../src/config/env.js';

describe('Login History Tracking (Slice 1.12-TEST)', () => {
  const adminEmail = 'superadmin.history@company.pk';
  const employeeEmail = 'employee.history@company.pk';
  const testPassword = 'Password123!';

  let adminToken;
  let employeeToken;
  let employeeUser;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_history');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});
    await LoginHistory.deleteMany({});

    // Seed roles
    const adminRole = await Role.create({
      name: 'Super Admin',
      description: 'System Super Administrator',
      permissions: [
        { action: 'manage', subject: 'all' },
        { action: 'read', subject: 'auth.history' }
      ]
    });

    const empRole = await Role.create({
      name: 'Employee',
      description: 'Standard Employee',
      permissions: [
        { action: 'login.history', subject: 'User', scope: 'own' },
        { action: 'read', subject: 'attendance' }
      ]
    });

    // Seed admin user
    const adminHash = await User.hashPassword(testPassword);
    await User.create({
      email: adminEmail,
      passwordHash: adminHash,
      roles: [adminRole._id],
      isActive: true
    });

    // Seed employee user
    const empHash = await User.hashPassword(testPassword);
    employeeUser = await User.create({
      email: employeeEmail,
      passwordHash: empHash,
      roles: [empRole._id],
      isActive: true
    });

    // Perform successful login for admin
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = adminLoginRes.body.data.accessToken;

    // Perform successful login for employee
    const empLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: testPassword });
    employeeToken = empLoginRes.body.data.accessToken;

    // Perform failed login attempt
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: employeeEmail, password: 'WrongPassword999!' });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await LoginHistory.deleteMany({});
    await mongoose.disconnect();
  });

  it('should create audit records for both successful and failed logins', async () => {
    const records = await LoginHistory.find({ email: employeeEmail });
    expect(records.length).toBeGreaterThanOrEqual(2);

    const successRecord = records.find((r) => r.status === 'SUCCESS');
    expect(successRecord).toBeDefined();
    expect(successRecord.userId.toString()).toBe(employeeUser._id.toString());

    const failedRecord = records.find((r) => r.status === 'FAILED');
    expect(failedRecord).toBeDefined();
    expect(failedRecord.failureReason).toBeDefined();
  });

  it('should restrict employee to view only their own login history', async () => {
    const res = await request(app)
      .get('/api/v1/auth/login-history')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.docs).toBeDefined();

    // Verify all returned records belong strictly to the employee
    res.body.data.docs.forEach((doc) => {
      expect(doc.email).toBe(employeeEmail);
    });
  });

  it('should allow Super Admin to view login history across all users', async () => {
    const res = await request(app)
      .get('/api/v1/auth/login-history')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.docs.length).toBeGreaterThanOrEqual(3);

    const emails = res.body.data.docs.map((d) => d.email);
    expect(emails).toContain(adminEmail);
    expect(emails).toContain(employeeEmail);
  });

  it('should return 403 Forbidden if user lacks login.history permission', async () => {
    // Create role without login.history
    const restrictedRole = await Role.create({
      name: 'Restricted Employee',
      description: 'Employee without login history permission',
      permissions: [
        { action: 'read', subject: 'attendance' }
      ]
    });

    const restrictedEmail = 'restricted@company.pk';
    const restrictedHash = await User.hashPassword(testPassword);
    await User.create({
      email: restrictedEmail,
      passwordHash: restrictedHash,
      roles: [restrictedRole._id],
      isActive: true
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: restrictedEmail, password: testPassword });
    const restrictedToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/login-history')
      .set('Authorization', `Bearer ${restrictedToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

