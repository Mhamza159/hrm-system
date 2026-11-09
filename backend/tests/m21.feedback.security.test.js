/**
 * @file m21.feedback.security.test.js
 * @description Security, Quarantine & PBAC Isolation Test Suite for Module M21 (BUILD-GUIDE Rows 21.3 & 21.6).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Feedback } from '../src/models/feedback.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M21 — Security & PBAC Isolation Suite', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken, committeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser, committeeUser;
  let harassmentCaseId;
  let regularCaseId;

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        roles: user.roles.map((r) => r.name || r)
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }
    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    superAdminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' }).populate('roles');
    superAdminToken = generateToken(superAdminUser);

    hrManagerUser = await User.findOneAndUpdate(
      { email: 'hr.sec.m21@hrm.local' },
      {
        email: 'hr.sec.m21@hrm.local',
        passwordHash: '$2a$10$hashedpassm21sec',
        roles: [hrRole._id],
        role: 'HR Manager',
        isActive: true,
        permissions: hrRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    hrManagerToken = generateToken(hrManagerUser);

    deptManagerUser = await User.findOneAndUpdate(
      { email: 'dept.sec.m21@hrm.local' },
      {
        email: 'dept.sec.m21@hrm.local',
        passwordHash: '$2a$10$hashedpassm21sec',
        roles: [deptRole._id],
        role: 'Department Manager',
        isActive: true,
        permissions: deptRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    deptManagerToken = generateToken(deptManagerUser);

    employeeUser = await User.findOneAndUpdate(
      { email: 'emp.sec.m21@hrm.local' },
      {
        email: 'emp.sec.m21@hrm.local',
        passwordHash: '$2a$10$hashedpassm21sec',
        roles: [empRole._id],
        role: 'Employee',
        isActive: true,
        permissions: empRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    employeeToken = generateToken(employeeUser);

    // Designated committee role and user with grievance.committee permission
    const committeeRole = await Role.findOneAndUpdate(
      { name: 'Inquiry Committee' },
      {
        name: 'Inquiry Committee',
        description: 'Designated Workplace Harassment Inquiry Committee',
        permissions: [
          { action: 'feedback.manage', subject: 'Feedback', scope: 'all' },
          { action: 'grievance.committee', subject: 'Feedback', scope: 'all' }
        ]
      },
      { upsert: true, new: true }
    );

    committeeUser = await User.findOneAndUpdate(
      { email: 'committee.sec.m21@hrm.local' },
      {
        email: 'committee.sec.m21@hrm.local',
        passwordHash: '$2a$10$hashedpassm21sec',
        roles: [committeeRole._id],
        role: 'Inquiry Committee',
        isActive: true
      },
      { upsert: true, new: true }
    ).populate('roles');
    committeeToken = generateToken(committeeUser);

    // Seed a standard grievance and a quarantined harassment complaint
    const regCase = await Feedback.create({
      title: 'M21 SEC: Standard facility request',
      description: 'Air conditioning on the 2nd floor is not cooling.',
      category: 'Workplace Issue',
      priority: 'Low',
      trackingCode: 'TRK-SEC-REG01',
      status: 'Submitted'
    });
    regularCaseId = regCase._id.toString();

    const harCase = await Feedback.create({
      title: 'M21 SEC: Confidential harassment incident',
      description: 'Hostile conduct occurred during off-site team event.',
      category: 'Harassment',
      priority: 'Urgent',
      trackingCode: 'TRK-SEC-HAR01',
      status: 'Submitted',
      isAnonymous: true
    });
    harassmentCaseId = harCase._id.toString();
  });

  afterAll(async () => {
    await Feedback.deleteMany({ title: /M21 SEC:/ });
  });

  // ==========================================
  // ROW 21.3: Harassment Quarantine Channel
  // ==========================================
  describe('Row 21.3: Harassment Quarantine Invariants', () => {
    it('1. Regular HR Manager listing feedback NEVER receives Harassment cases in results', async () => {
      const res = await request(app)
        .get('/api/v1/feedback')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.data;
      const hasHarassment = items.some((i) => i.category === 'Harassment');
      expect(hasHarassment).toBe(false);

      // Verify regular case is visible
      const hasReg = items.some((i) => i._id.toString() === regularCaseId);
      expect(hasReg).toBe(true);
    });

    it('2. Regular HR Manager direct ID access to Harassment complaint is blocked (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/feedback/${harassmentCaseId}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Harassment complaints are restricted to the Inquiry Committee');
    });

    it('3. Inquiry Committee Member can access quarantined Harassment complaint (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/feedback/${harassmentCaseId}`)
        .set('Authorization', `Bearer ${committeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Harassment');
      expect(res.body.data.trackingCode).toBe('TRK-SEC-HAR01');
    });

    it('4. Super Admin has master compliance access to Harassment complaint (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/feedback/${harassmentCaseId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Harassment');
    });
  });

  // ==========================================
  // ROW 21.6: Department Manager Isolation Rule
  // ==========================================
  describe('Row 21.6: Department Manager PBAC Isolation', () => {
    it('1. Department Manager is blocked from listing grievances (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/feedback')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('2. Department Manager is blocked from viewing case details (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/feedback/${regularCaseId}`)
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('3. Department Manager is blocked from changing status (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/feedback/${regularCaseId}/status`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({ status: 'Resolved' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('4. Department Manager is blocked from adding notes (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/${regularCaseId}/notes`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({ note: 'Unauthorized note attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('5. Regular Employee is blocked from administrative listing (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/feedback')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
