/**
 * @file m2.settings.e2e.test.js
 * @description Comprehensive Multi-Role End-to-End Verification for Module M2 Company Settings (E2E-M2).
 * 
 * SPECIFICATION & COVERAGE:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11 & E2E-M2)
 * - Roles Tested:
 *   1. Super Admin: Master settings management, company profile & logo upload, tax brackets, geo-fences, backup snapshot.
 *   2. HR Manager: Leave policy, office hours, notification templates, verification of backup trigger denial (403).
 *   3. Department Manager: Verification of administrative settings denial (403), read-only public policies access (200).
 *   4. Employee: Self-service public company policies access (200), administrative mutation denial (403).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Setting } from '../src/models/setting.model.js';
import { SettingService } from '../src/modules/settings/setting.service.js';
import { env } from '../src/config/env.js';

describe('Module M2 End-to-End Multi-Role Verification (E2E-M2)', () => {
  let superAdminToken;
  let hrManagerToken;
  let deptManagerToken;
  let employeeToken;

  let superAdminUser;
  let hrManagerUser;
  let deptManagerUser;
  let employeeUser;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m2_e2e_full');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Setting.deleteMany({});
    SettingService.clearCache();

    // 1. Seed Super Admin
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    superAdminUser = await User.create({
      email: 'superadmin.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 2. Seed HR Manager
    const hrManagerRole = await Role.create({
      name: 'HR Manager',
      description: 'HR Operations Lead',
      isSystem: true,
      permissions: [
        { action: 'settings.manage', subject: 'Setting', scope: 'all' },
        { action: 'settings.view', subject: 'Setting', scope: 'all' }
      ]
    });

    hrManagerUser = await User.create({
      email: 'hr.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrManagerRole._id],
      isActive: true
    });
    hrManagerToken = jwt.sign({ userId: hrManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 3. Seed Department Manager
    const deptManagerRole = await Role.create({
      name: 'Department Manager',
      description: 'Department Lead',
      isSystem: true,
      permissions: [{ action: 'settings.view', subject: 'Setting', scope: 'all' }]
    });

    deptManagerUser = await User.create({
      email: 'manager.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [deptManagerRole._id],
      isActive: true
    });
    deptManagerToken = jwt.sign({ userId: deptManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 4. Seed Employee
    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'General Employee',
      isSystem: true,
      permissions: [{ action: 'settings.view', subject: 'Setting', scope: 'all' }]
    });

    employeeUser = await User.create({
      email: 'employee.e2e@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Setting.deleteMany({});
    SettingService.clearCache();
    await mongoose.disconnect();
  });

  // ============================================================================
  // FLOW 1: SUPER ADMIN FULL GOVERNANCE LIFECYCLE
  // ============================================================================
  describe('Flow 1: Super Admin Complete Configuration & Backup Flow', () => {
    it('Super Admin fetches all system settings and updates company legal profile', async () => {
      // 1. Fetch settings
      const getRes = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(getRes.status).toBe(200);

      // 2. Update company legal profile
      const companyPayload = {
        name: 'Apex Software House (Pvt) Ltd',
        address: 'Floor 5, Software Technology Park 1, Islamabad, Pakistan',
        phone: '+92 51 8887766',
        email: 'contact@apexsoft.pk',
        website: 'https://apexsoft.pk',
        ntn: '4928104-7',
        strn: '1700492810419',
        logoUrl: ''
      };

      const updateRes = await request(app)
        .patch('/api/v1/settings/company')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ value: companyPayload });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.value.name).toBe('Apex Software House (Pvt) Ltd');
      expect(updateRes.body.data.value.ntn).toBe('4928104-7');
    });

    it('Super Admin uploads company official logo PNG asset', async () => {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const res = await request(app)
        .post('/api/v1/settings/company/logo')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('logo', pngBuffer, 'apex-logo.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logoUrl).toMatch(/^\/uploads\/logos\/company-logo-/);
      expect(res.body.data.company.logoUrl).toMatch(/^\/uploads\/logos\/company-logo-/);
    });

    it('Super Admin sets FBR salaried progressive tax slabs with paisa precision', async () => {
      const taxSlabsPayload = {
        taxYear: '2024-2025',
        slabs: [
          { minPaisa: 0, maxPaisa: 60000000, fixedTaxPaisa: 0, ratePercent: 0 },
          { minPaisa: 60000001, maxPaisa: 120000000, fixedTaxPaisa: 0, ratePercent: 5 },
          { minPaisa: 120000001, maxPaisa: 220000000, fixedTaxPaisa: 3000000, ratePercent: 15 },
          { minPaisa: 220000001, maxPaisa: 320000000, fixedTaxPaisa: 18000000, ratePercent: 25 },
          { minPaisa: 320000001, maxPaisa: 410000000, fixedTaxPaisa: 43000000, ratePercent: 30 },
          { minPaisa: 410000001, maxPaisa: null, fixedTaxPaisa: 70000000, ratePercent: 35 }
        ]
      };

      const res = await request(app)
        .patch('/api/v1/settings/taxSlabs')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ value: taxSlabsPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.slabs).toHaveLength(6);
    });

    it('Super Admin configures multi-office Leaflet geo-fences with custom spatial radii', async () => {
      const geoPayload = [
        {
          name: 'Islamabad HQ STP-1',
          latitude: 33.6844,
          longitude: 73.0479,
          radiusMeters: 180,
          isActive: true
        }
      ];

      const geoRes = await request(app)
        .patch('/api/v1/settings/geoFences')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ value: geoPayload });

      expect(geoRes.status).toBe(200);
      expect(geoRes.body.success).toBe(true);
      expect(geoRes.body.data.value).toHaveLength(1);
      expect(geoRes.body.data.value[0].name).toBe('Islamabad HQ STP-1');
    });

    it('Super Admin triggers on-demand database backup and inspects backup metrics', async () => {
      // Trigger immediate backup snapshot
      const backupRes = await request(app)
        .post('/api/v1/settings/backup-now')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(backupRes.status).toBe(200);
      expect(backupRes.body.data.status).toBe('success');
      expect(backupRes.body.data.filename).toBeDefined();

      // Check status
      const statusRes = await request(app)
        .get('/api/v1/settings/backup-status')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.totalBackups).toBeGreaterThanOrEqual(1);
    }, 15000);
  });

  // ============================================================================
  // FLOW 2: HR MANAGER OPERATIONAL GOVERNANCE & PRIVILEGE BOUNDARY
  // ============================================================================
  describe('Flow 2: HR Manager Operational Policy Management & Privilege Guarding', () => {
    it('HR Manager updates leave policy and office attendance timings', async () => {
      const leavePayload = {
        fiscalYearStart: 'July',
        approvalChainLevels: 2,
        carryForwardLimit: 8,
        encashmentAllowed: true,
        sandwichRule: true,
        probationLeaveAllowed: false
      };

      const leaveRes = await request(app)
        .patch('/api/v1/settings/leavePolicy')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ value: leavePayload });

      expect(leaveRes.status).toBe(200);
      expect(leaveRes.body.data.value.carryForwardLimit).toBe(8);

      const hoursPayload = {
        startTime: '09:00',
        endTime: '18:00',
        halfDayMinutes: 240,
        flexibleShiftAllowed: false
      };

      const hoursRes = await request(app)
        .patch('/api/v1/settings/officeHours')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ value: hoursPayload });

      expect(hoursRes.status).toBe(200);
    });

    it('HR Manager update to email notification templates succeeds', async () => {
      const templatesPayload = {
        welcomeEmail: {
          subject: 'Welcome to Apex Software House',
          body: 'Dear {{name}},\nWelcome to Apex! Your portal account is live.'
        }
      };

      const res = await request(app)
        .patch('/api/v1/settings/templates')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ value: templatesPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.welcomeEmail.subject).toBe('Welcome to Apex Software House');
    });

    it('HR Manager is strictly forbidden from triggering manual database backup (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/v1/settings/backup-now')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Super Admin');
    });
  });

  // ============================================================================
  // FLOW 3: DEPARTMENT MANAGER SCOPING & PUBLIC POLICIES ACCESS
  // ============================================================================
  describe('Flow 3: Department Manager Administrative Guarding & Policies Reading', () => {
    it('Department Manager cannot access administrative settings routes (HTTP 403)', async () => {
      const getRes = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${deptManagerToken}`);
      expect(getRes.status).toBe(403);

      const patchRes = await request(app)
        .patch('/api/v1/settings/officeHours')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({ value: {} });
      expect(patchRes.status).toBe(403);

      const backupRes = await request(app)
        .post('/api/v1/settings/backup-now')
        .set('Authorization', `Bearer ${deptManagerToken}`);
      expect(backupRes.status).toBe(403);
    });

    it('Department Manager can access read-only public company policies (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/settings/public-policies')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const policies = res.body.data;
      expect(policies.company.name).toBe('Apex Software House (Pvt) Ltd');
      expect(policies.leavePolicy.carryForwardLimit).toBe(8);
      expect(policies.workingDays).toBeDefined();

      // Ensure sensitive data is not leaked
      expect(policies.company.ntn).toBeUndefined();
      expect(policies.company.strn).toBeUndefined();
    });
  });

  // ============================================================================
  // FLOW 4: EMPLOYEE ACCESS SCOPING & PUBLIC POLICIES ACCESS
  // ============================================================================
  describe('Flow 4: Employee Self-Service Public Policies Access', () => {
    it('Employee cannot access or mutate administrative settings (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);

      const mutateRes = await request(app)
        .patch('/api/v1/settings/lateRules')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ value: { graceMinutes: 60 } });
      expect(mutateRes.status).toBe(403);
    });

    it('Employee successfully reads public handbook from /public-policies (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/settings/public-policies')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const handbook = res.body.data;
      expect(handbook.company.name).toBe('Apex Software House (Pvt) Ltd');
      expect(handbook.officeHours.startTime).toBe('09:00');
      expect(handbook.lateRules.graceMinutes).toBeDefined();
      expect(handbook.geoFences).toHaveLength(1);
    });

    it('Anonymous/unauthenticated requests to /public-policies are rejected with HTTP 401', async () => {
      const res = await request(app).get('/api/v1/settings/public-policies');
      expect(res.status).toBe(401);
    });
  });
});
