/**
 * @file company-profile-id-card.test.js
 * @description Integration Tests for Phase 36: Company Profile, ID Card Studio, and System-Wide Settings Integrations.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Setting } from '../src/models/setting.model.js';
import { SettingService } from '../src/modules/settings/setting.service.js';
import { env } from '../src/config/env.js';

describe('Phase 36 — Company Profile & Employee ID Card Integration Test Suite', () => {
  let superAdminToken;
  let regularToken;
  let superAdminUser;
  let regularUser;
  let employeeA;
  let employeeB;
  let department;
  let designation;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p36_idcard');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Setting.deleteMany({});
    SettingService.clearCache();

    // 1. Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'System Administrator',
      isSystem: true,
      permissions: [
        { action: 'manage', subject: 'all', scope: 'all' }
      ]
    });

    const regularRole = await Role.create({
      name: 'Employee',
      description: 'Regular Employee',
      isSystem: false,
      permissions: [
        { action: 'employees.view', subject: 'Employee', scope: 'own' },
        { action: 'settings.view', subject: 'Setting', scope: 'all' }
      ]
    });

    // 2. Department & Designation
    department = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    designation = await Designation.create({
      title: 'Senior Systems Engineer',
      code: 'SSE',
      grade: 'Senior',
      departmentId: department._id,
      isActive: true
    });

    // 3. Employees
    employeeA = await Employee.create({
      employeeCode: 'EMP-001',
      name: 'Hamza Hakim',
      firstName: 'Hamza',
      lastName: 'Hakim',
      officialEmail: 'hamza@example.com',
      personalEmail: 'hamza.personal@example.com',
      phone: '+923001234567',
      departmentId: department._id,
      designationId: designation._id,
      joiningDate: new Date('2024-01-15'),
      status: 'Active',
      bloodGroup: 'B+',
      emergencyContact: {
        name: 'Father',
        relationship: 'Parent',
        phone: '+923007654321'
      }
    });

    employeeB = await Employee.create({
      employeeCode: 'EMP-002',
      name: 'Ayesha Khan',
      firstName: 'Ayesha',
      lastName: 'Khan',
      officialEmail: 'ayesha@example.com',
      personalEmail: 'ayesha.personal@example.com',
      phone: '+923009876543',
      departmentId: department._id,
      designationId: designation._id,
      joiningDate: new Date('2024-06-01'),
      status: 'Active',
      bloodGroup: 'O+',
      emergencyContact: {
        name: 'Mother',
        relationship: 'Parent',
        phone: '+923001122334'
      }
    });

    // 4. Users
    superAdminUser = await User.create({
      email: 'admin@elvara.com',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      employeeId: employeeA._id,
      isActive: true,
      status: 'active'
    });

    regularUser = await User.create({
      email: 'ayesha@elvara.com',
      passwordHash: 'dummy_hash',
      roles: [regularRole._id],
      employeeId: employeeB._id,
      isActive: true,
      status: 'active'
    });

    employeeA.userId = superAdminUser._id;
    await employeeA.save();

    employeeB.userId = regularUser._id;
    await employeeB.save();

    superAdminToken = jwt.sign(
      { userId: superAdminUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    regularToken = jwt.sign(
      { userId: regularUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('36.1: Company Profile & ID Card Studio Configuration', () => {
    it('updates company profile with full coordinates and custom ID card settings', async () => {
      const payload = {
        name: 'Elvara Technologies Inc.',
        legalName: 'Elvara Global Systems Ltd.',
        registrationNumber: 'REG-2026-9988',
        email: 'info@elvara.com',
        phone: '+92 21 34567890',
        website: 'https://elvara.io',
        ntn: '1234567-8',
        address: 'Tower A, Financial District',
        city: 'Karachi',
        state: 'Sindh',
        postalCode: '74200',
        country: 'Pakistan',
        timezone: 'Asia/Karachi',
        currency: 'PKR',
        industry: 'Enterprise Software & Cloud Platforms',
        businessType: 'Corporation',
        description: 'Next-generation AI-driven human resource management suite.',
        logoUrl: '/uploads/company/logo-test.png',
        idCardConfig: {
          theme: 'forest',
          layout: 'vertical',
          showBloodGroup: true,
          showEmergencyContact: true,
          showDepartment: true,
          showDesignation: true,
          showJoiningDate: true,
          showBarcode: true,
          qrCodeType: 'verification',
          cardValidityYears: 3,
          primaryColor: '#00C471',
          backDisclaimer: 'Property of Elvara Technologies Inc. Found badge must be returned immediately.'
        }
      };

      const res = await request(app)
        .patch('/api/v1/settings/company')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.value.name).toBe('Elvara Technologies Inc.');
      expect(res.body.data.value.legalName).toBe('Elvara Global Systems Ltd.');
      expect(res.body.data.value.idCardConfig.theme).toBe('forest');
      expect(res.body.data.value.idCardConfig.cardValidityYears).toBe(3);
      expect(res.body.data.value.idCardConfig.primaryColor).toBe('#00C471');
    });

    it('verifies public policies sanitize company information and expose idCardConfig', async () => {
      const res = await request(app)
        .get('/api/v1/settings/public-policies')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company).toBeDefined();
      expect(res.body.data.company.name).toBe('Elvara Technologies Inc.');
      expect(res.body.data.company.legalName).toBe('Elvara Global Systems Ltd.');
      expect(res.body.data.company.city).toBe('Karachi');
      expect(res.body.data.company.idCardConfig).toBeDefined();
      expect(res.body.data.company.idCardConfig.primaryColor).toBe('#00C471');
    });

    it('verifies unauthenticated public-branding endpoint returns branding for login and careers', async () => {
      const res = await request(app)
        .get('/api/v1/settings/public-branding');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Elvara Technologies Inc.');
      expect(res.body.data.legalName).toBe('Elvara Global Systems Ltd.');
    });

    it('removes company logo via dedicated DELETE endpoint', async () => {
      const res = await request(app)
        .delete('/api/v1/settings/company/logo')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logoUrl).toBe('');
    });
  });

  describe('36.2: Employee ID Card Data Retrieval & PBAC Scoping', () => {
    it('allows employee to retrieve their own official ID card via /me/id-card', async () => {
      const res = await request(app)
        .get('/api/v1/employees/me/id-card')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const { employee, company, idCardConfig, meta } = res.body.data;
      expect(employee.employeeCode).toBe('EMP-002');
      expect(employee.firstName).toBe('Ayesha');
      expect(employee.bloodGroup).toBe('O+');
      expect(employee.department).toBe('Engineering');
      expect(employee.designation).toBe('Senior Systems Engineer');
      expect(company.name).toBe('Elvara Technologies Inc.');
      expect(idCardConfig.cardValidityYears).toBe(3);
      expect(meta.qrVerificationPayload).toBeDefined();
      expect(meta.qrVerificationPayload.code).toBe('EMP-002');
    });

    it('allows Super Admin to retrieve any employee ID card via /:id/id-card', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${employeeB._id}/id-card`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employee.employeeCode).toBe('EMP-002');
      expect(res.body.data.employee.fullName).toBe('Ayesha Khan');
    });

    it('blocks regular employee from accessing another employee ID card with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${employeeA._id}/id-card`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
    });
  });
});
