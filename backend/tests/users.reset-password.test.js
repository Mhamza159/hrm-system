/**
 * @file users.reset-password.test.js
 * @description Vitest Test Suite for HR-Initiated Emergency Password Reset (Slice 1.14-TEST).
 * 
 * SPECIFICATION & SECURITY VERIFICATIONS:
 * 1. Admin/HR with 'user.manage' triggers emergency password reset for an employee account.
 * 2. System generates secure temporary password, hashes with bcrypt, sets mustChangePassword: true.
 * 3. Existing refresh tokens are nullified (evicting active sessions).
 * 4. Employee logs in with temporary password and is flagged for mandatory password change.
 * 5. Department Manager or unauthorized caller receives 403 Forbidden.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { env } from '../src/config/env.js';

describe('HR Emergency Password Reset (Slice 1.14-TEST)', () => {
  const adminEmail = 'admin.reset@company.pk';
  const managerEmail = 'deptmanager.reset@company.pk';
  const employeeEmail = 'employee.reset@company.pk';
  const initialPassword = 'InitialPassword123!';

  let adminToken;
  let managerToken;
  let employeeUser;
  let issuedTempPassword;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1_admin_reset');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});

    // Seed roles
    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'Human Resources Manager',
      permissions: [
        { action: 'manage', subject: 'user' },
        { action: 'manage', subject: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Departmental Head',
      permissions: [
        { action: 'read', subject: 'team' }
      ]
    });

    const empRole = await Role.create({
      name: 'Employee',
      description: 'Standard Employee',
      permissions: [
        { action: 'read', subject: 'self' }
      ]
    });

    // Seed HR admin user
    const adminHash = await User.hashPassword(initialPassword);
    await User.create({
      email: adminEmail,
      passwordHash: adminHash,
      roles: [hrRole._id],
      isActive: true
    });

    // Seed Department Manager
    const managerHash = await User.hashPassword(initialPassword);
    await User.create({
      email: managerEmail,
      passwordHash: managerHash,
      roles: [managerRole._id],
      isActive: true
    });

    // Seed Employee
    const empHash = await User.hashPassword(initialPassword);
    employeeUser = await User.create({
      email: employeeEmail,
      passwordHash: empHash,
      roles: [empRole._id],
      isActive: true
    });

    // Obtain access tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: initialPassword });
    adminToken = adminLogin.body.data.accessToken;

    const managerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: managerEmail, password: initialPassword });
    managerToken = managerLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await mongoose.disconnect();
  });

  it('should allow HR Manager to trigger emergency password reset for an employee', async () => {
    const res = await request(app)
      .post(`/api/v1/users/${employeeUser._id}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tempPassword).toBeDefined();

    issuedTempPassword = res.body.data.tempPassword;

    // Verify DB state for employee
    const updatedUser = await User.findById(employeeUser._id);
    expect(updatedUser.mustChangePassword).toBe(true);
    expect(updatedUser.refreshTokenHash).toBeNull();
    expect(updatedUser.failedAttempts).toBe(0);
    expect(updatedUser.lockUntil).toBeNull();
  });

  it('should allow employee to sign in with temporary password and enforce mustChangePassword', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: employeeEmail,
        password: issuedTempPassword
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeDefined();
    expect(loginRes.body.data.user.mustChangePassword).toBe(true);
  });

  it('should reject emergency password reset initiated by unauthorized Department Manager with 403', async () => {
    const res = await request(app)
      .post(`/api/v1/users/${employeeUser._id}/reset-password`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
