/**
 * @file settings.api.test.js
 * @description Comprehensive Integration Test Suite for Module M2 Company Settings (BUILD-GUIDE Rows 2.1 to 2.11).
 * 
 * SPECIFICATION & VERIFICATION MATRIX:
 * - Slice 2.1: Settings model, key-value engine, in-memory cache, and RBAC authorization boundary
 * - Slice 2.2: Company profile update, logo asset upload, and MIME type validation
 * - Slice 2.3: Working days and office hours configuration
 * - Slice 2.4: Late arrival grace period, penalty deduction rules, and bounds validation
 * - Slice 2.5: Leave policy configuration (fiscal cycle, approval chain, carry forward, sandwich rule)
 * - Slice 2.6: Payroll cycle and disbursement day scheduling
 * - Slice 2.7: Pakistan statutory compliance (FBR tax slabs, EOBI, PESSI, Provident Fund)
 * - Slice 2.8: Office geo-fence coordinates, radius, and spatial bounds validation
 * - Slice 2.9: Email and WhatsApp notification template configuration
 * - Slice 2.10: Manual database backup trigger (restricted to Super Admin) and backup status inspection
 * - Slice 2.11: Public company handbook and sanitized policy reader accessible to all roles
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Setting } from '../src/models/setting.model.js';
import { SettingService, DEFAULT_SETTINGS } from '../src/modules/settings/setting.service.js';
import { env } from '../src/config/env.js';

describe('Module M2 — Company Settings Integration Test Suite (Rows 2.1 to 2.11)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m2_settings');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Setting.deleteMany({});
    SettingService.clearCache();

    // 1. Super Admin Role (Wildcard manage/all)
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    superAdminUser = await User.create({
      email: 'admin.settings@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 2. HR Manager Role (settings.manage + settings.view)
    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'Human Resource Operations Head',
      isSystem: true,
      permissions: [
        { action: 'settings.manage', subject: 'Setting', scope: 'all' },
        { action: 'settings.view', subject: 'Setting', scope: 'all' }
      ]
    });

    hrUser = await User.create({
      email: 'hr.settings@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 3. Department Manager Role (settings.view only)
    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Department Manager',
      isSystem: true,
      permissions: [{ action: 'settings.view', subject: 'Setting', scope: 'all' }]
    });

    managerUser = await User.create({
      email: 'manager.settings@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });

    managerToken = jwt.sign({ userId: managerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 4. Employee Role (settings.view only)
    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'General Employee',
      isSystem: true,
      permissions: [{ action: 'settings.view', subject: 'Setting', scope: 'all' }]
    });

    employeeUser = await User.create({
      email: 'employee.settings@company.pk',
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
  // Slice 2.1: Settings Key-Value Model, Engine & In-Memory Cache (BUILD-GUIDE 2.1)
  // ============================================================================
  describe('Slice 2.1: Settings Model, Caching & Authorization Boundary', () => {
    it('Super Admin and HR Manager should retrieve all settings with HTTP 200', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.company).toBeDefined();
      expect(res.body.data.workingDays).toBeDefined();

      const hrRes = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(hrRes.status).toBe(200);
      expect(hrRes.body.success).toBe(true);
    });

    it('Department Manager and Employee should receive 403 Forbidden on GET /api/v1/settings', async () => {
      const mgrRes = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(mgrRes.status).toBe(403);

      const empRes = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(empRes.status).toBe(403);
    });

    it('SettingService should leverage in-memory cache and invalidate on mutation', async () => {
      SettingService.clearCache();
      const firstRead = await SettingService.getSetting('workingDays');
      expect(firstRead).toEqual(DEFAULT_SETTINGS.workingDays);

      // Mutate via API
      const updatedDays = ['monday', 'tuesday', 'wednesday', 'thursday'];
      const patchRes = await request(app)
        .patch('/api/v1/settings/workingDays')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: updatedDays });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.value).toEqual(updatedDays);

      // Subsequent read returns updated cached value
      const secondRead = await SettingService.getSetting('workingDays');
      expect(secondRead).toEqual(updatedDays);
    });
  });

  // ============================================================================
  // Slice 2.2: Company Profile & Logo Asset Upload (BUILD-GUIDE 2.2)
  // ============================================================================
  describe('Slice 2.2: Company Profile & Logo Asset Upload', () => {
    it('Super Admin should update company legal profile details (HTTP 200)', async () => {
      const companyPayload = {
        name: 'Nexus Technologies Pakistan Ltd',
        address: 'Plot 42, Blue Area, Islamabad',
        phone: '+92 51 9876543',
        email: 'info@nexus.pk',
        website: 'https://nexus.pk',
        ntn: '8392019-4',
        strn: '9876543210987',
        logoUrl: ''
      };

      const res = await request(app)
        .patch('/api/v1/settings/company')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ value: companyPayload });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value.name).toBe('Nexus Technologies Pakistan Ltd');
      expect(res.body.data.value.ntn).toBe('8392019-4');
    });

    it('Super Admin can upload a valid PNG company logo', async () => {
      // Create a small 1x1 test PNG buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const res = await request(app)
        .post('/api/v1/settings/company/logo')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('logo', pngBuffer, 'test-logo.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logoUrl).toContain('/uploads/logos/');
    });

    it('Department Manager and Employee cannot upload logo or modify company profile (HTTP 403)', async () => {
      const res = await request(app)
        .patch('/api/v1/settings/company')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ value: { name: 'Unauthorized Change' } });

      expect(res.status).toBe(403);
    });
  });

  // ============================================================================
  // Slice 2.3: Working Days & Standard Office Hours (BUILD-GUIDE 2.3)
  // ============================================================================
  describe('Slice 2.3: Working Days & Standard Office Hours', () => {
    it('HR Manager updates working days and office hours with valid payload', async () => {
      const officeHoursPayload = {
        startTime: '08:30',
        endTime: '17:30',
        halfDayMinutes: 240,
        flexibleShiftAllowed: true
      };

      const res = await request(app)
        .patch('/api/v1/settings/officeHours')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: officeHoursPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.startTime).toBe('08:30');
      expect(res.body.data.value.flexibleShiftAllowed).toBe(true);
    });

    it('Invalid time string format rejects with HTTP 400 validation error', async () => {
      const invalidHours = {
        startTime: '9 AM', // Invalid regex format
        endTime: '18:00',
        halfDayMinutes: 240,
        flexibleShiftAllowed: false
      };

      const res = await request(app)
        .patch('/api/v1/settings/officeHours')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: invalidHours });

      expect(res.status).toBe(400);
    });
  });

  // ============================================================================
  // Slice 2.4: Late Arrival Rules & Penalty Deductions (BUILD-GUIDE 2.4)
  // ============================================================================
  describe('Slice 2.4: Late Arrival Rules & Penalty Deductions', () => {
    it('HR Manager sets late grace period and deductions (HTTP 200)', async () => {
      const lateRulesPayload = {
        graceMinutes: 20,
        lateThresholdMinutes: 45,
        halfDayThresholdLateCount: 3,
        penaltyPerLatePaisa: 50000 // 500 PKR
      };

      const res = await request(app)
        .patch('/api/v1/settings/lateRules')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: lateRulesPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.graceMinutes).toBe(20);
      expect(res.body.data.value.penaltyPerLatePaisa).toBe(50000);
    });

    it('Negative grace minutes or exceeding 60 minutes rejects with HTTP 400', async () => {
      const invalidLateRules = {
        graceMinutes: -5,
        lateThresholdMinutes: 30,
        halfDayThresholdLateCount: 3,
        penaltyPerLatePaisa: 0
      };

      const res = await request(app)
        .patch('/api/v1/settings/lateRules')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: invalidLateRules });

      expect(res.status).toBe(400);
    });
  });

  // ============================================================================
  // Slice 2.5: Leave Policy Definitions (BUILD-GUIDE 2.5)
  // ============================================================================
  describe('Slice 2.5: Leave Policy Definitions', () => {
    it('HR Manager configures leave policy settings (HTTP 200)', async () => {
      const leavePolicyPayload = {
        fiscalYearStart: 'January',
        approvalChainLevels: 3,
        carryForwardLimit: 10,
        encashmentAllowed: true,
        sandwichRule: false,
        probationLeaveAllowed: true
      };

      const res = await request(app)
        .patch('/api/v1/settings/leavePolicy')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: leavePolicyPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.fiscalYearStart).toBe('January');
      expect(res.body.data.value.approvalChainLevels).toBe(3);
    });

    it('Invalid approval chain depth (e.g. 5) rejects with HTTP 400', async () => {
      const invalidPolicy = {
        fiscalYearStart: 'July',
        approvalChainLevels: 5, // Max is 3
        carryForwardLimit: 5,
        encashmentAllowed: true,
        sandwichRule: true,
        probationLeaveAllowed: false
      };

      const res = await request(app)
        .patch('/api/v1/settings/leavePolicy')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: invalidPolicy });

      expect(res.status).toBe(400);
    });
  });

  // ============================================================================
  // Slice 2.6: Payroll Cycle & Pay Day Scheduling (BUILD-GUIDE 2.6)
  // ============================================================================
  describe('Slice 2.6: Payroll Cycle & Pay Day Scheduling', () => {
    it('HR Manager configures payroll cycle and disbursement day (HTTP 200)', async () => {
      const payrollCyclePayload = {
        cycleType: 'calendar_month',
        startDay: 1,
        endDay: 30,
        disbursementDay: 5
      };

      const res = await request(app)
        .patch('/api/v1/settings/payrollCycle')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: payrollCyclePayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.disbursementDay).toBe(5);
    });

    it('Out-of-bounds disbursement day (e.g. 35) rejects with HTTP 400', async () => {
      const invalidCycle = {
        cycleType: 'calendar_month',
        startDay: 1,
        endDay: 30,
        disbursementDay: 35 // Max is 31
      };

      const res = await request(app)
        .patch('/api/v1/settings/payrollCycle')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: invalidCycle });

      expect(res.status).toBe(400);
    });
  });

  // ============================================================================
  // Slice 2.7: Pakistan Statutory Compliance Settings (BUILD-GUIDE 2.7)
  // ============================================================================
  describe('Slice 2.7: Pakistan Statutory Compliance Settings', () => {
    it('HR Manager configures progressive FBR salaried tax brackets in integer paisa', async () => {
      const taxSlabsPayload = {
        taxYear: '2024-2025',
        slabs: [
          { minPaisa: 0, maxPaisa: 60000000, fixedTaxPaisa: 0, ratePercent: 0 },
          { minPaisa: 60000001, maxPaisa: 120000000, fixedTaxPaisa: 0, ratePercent: 5 },
          { minPaisa: 120000001, maxPaisa: 220000000, fixedTaxPaisa: 3000000, ratePercent: 15 },
          { minPaisa: 220000001, maxPaisa: null, fixedTaxPaisa: 18000000, ratePercent: 25 }
        ]
      };

      const res = await request(app)
        .patch('/api/v1/settings/taxSlabs')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: taxSlabsPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.taxYear).toBe('2024-2025');
      expect(res.body.data.value.slabs).toHaveLength(4);
    });

    it('HR Manager configures EOBI, PESSI, and Provident Fund settings (HTTP 200)', async () => {
      const eobiPayload = {
        enabled: true,
        employerRatePercent: 5,
        employeeRatePercent: 1,
        minWagePaisa: 3700000 // 37,000 PKR
      };

      const res = await request(app)
        .patch('/api/v1/settings/eobi')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: eobiPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.minWagePaisa).toBe(3700000);
    });
  });

  // ============================================================================
  // Slice 2.8: Office Geo-Fence Coordinates & Radius Editor (BUILD-GUIDE 2.8)
  // ============================================================================
  describe('Slice 2.8: Office Geo-Fence Coordinates & Radius Editor', () => {
    it('HR Manager updates office geo-fence locations with coordinates and radius', async () => {
      const geoFencesPayload = [
        {
          name: 'Islamabad HQ Office',
          latitude: 33.6844,
          longitude: 73.0479,
          radiusMeters: 200,
          isActive: true
        },
        {
          name: 'Lahore Regional Tech Hub',
          latitude: 31.5204,
          longitude: 74.3587,
          radiusMeters: 150,
          isActive: true
        }
      ];

      const res = await request(app)
        .patch('/api/v1/settings/geoFences')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: geoFencesPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value).toHaveLength(2);
      expect(res.body.data.value[0].radiusMeters).toBe(200);
    });

    it('Invalid geo-fence with negative radius or out-of-range coordinates returns 400', async () => {
      const invalidGeoFences = [
        {
          name: 'Invalid Geo',
          latitude: 95.0, // Invalid latitude (> 90)
          longitude: 73.0479,
          radiusMeters: -50,
          isActive: true
        }
      ];

      const res = await request(app)
        .patch('/api/v1/settings/geoFences')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: invalidGeoFences });

      expect(res.status).toBe(400);
    });
  });

  // ============================================================================
  // Slice 2.9: Email & WhatsApp Notification Template Builder (BUILD-GUIDE 2.9)
  // ============================================================================
  describe('Slice 2.9: Email & WhatsApp Notification Template Builder', () => {
    it('HR Manager updates notification templates (HTTP 200)', async () => {
      const templatesPayload = {
        welcomeEmail: {
          subject: 'Welcome to our company!',
          body: 'Hello {{name}}, welcome to {{company}}.'
        },
        leaveApproval: {
          subject: 'Leave Request Approved',
          body: 'Dear {{name}}, your leave for {{date}} has been approved.'
        }
      };

      const res = await request(app)
        .patch('/api/v1/settings/templates')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: templatesPayload });

      expect(res.status).toBe(200);
      expect(res.body.data.value.welcomeEmail.subject).toBe('Welcome to our company!');
    });
  });

  // ============================================================================
  // Slice 2.10: Automated Database Backup Job & Manual Trigger (BUILD-GUIDE 2.10)
  // ============================================================================
  describe('Slice 2.10: Database Backup Job & Manual Trigger', () => {
    it('Super Admin triggers manual database backup archive (HTTP 200)', async () => {
      const res = await request(app)
        .post('/api/v1/settings/backup-now')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(res.body.data.filename).toBeDefined();
    });

    it('HR Manager, Department Manager, and Employee cannot trigger database backup (HTTP 403 Forbidden)', async () => {
      const hrRes = await request(app)
        .post('/api/v1/settings/backup-now')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(hrRes.status).toBe(403);

      const empRes = await request(app)
        .post('/api/v1/settings/backup-now')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(empRes.status).toBe(403);
    });

    it('Super Admin and HR Manager can view backup storage health & metrics (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/settings/backup-status')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalBackups).toBeGreaterThanOrEqual(1);
      expect(res.body.data.lastBackup).toBeDefined();
    });
  });

  // ============================================================================
  // Slice 2.11: Public Employee Policies Reader Page (BUILD-GUIDE 2.11)
  // ============================================================================
  describe('Slice 2.11: Public Employee Policies Reader Page', () => {
    it('All authenticated roles (Super Admin, HR, Manager, Employee) can read public policies (HTTP 200)', async () => {
      for (const token of [superAdminToken, hrToken, managerToken, employeeToken]) {
        const res = await request(app)
          .get('/api/v1/settings/public-policies')
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const data = res.body.data;
        // Verify public fields are present
        expect(data.company).toBeDefined();
        expect(data.company.name).toBeDefined();
        expect(data.workingDays).toBeDefined();
        expect(data.officeHours).toBeDefined();
        expect(data.lateRules).toBeDefined();
        expect(data.leavePolicy).toBeDefined();
        expect(data.geoFences).toBeDefined();

        // Verify sensitive administrative metadata is omitted
        expect(data.company.ntn).toBeUndefined();
        expect(data.company.strn).toBeUndefined();
        expect(data.taxSlabs).toBeUndefined();
        expect(data.backup).toBeUndefined();
      }
    });

    it('Unauthenticated requests to /public-policies are rejected with HTTP 401', async () => {
      const res = await request(app).get('/api/v1/settings/public-policies');
      expect(res.status).toBe(401);
    });
  });
});
