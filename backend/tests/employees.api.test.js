/**
 * @file employees.api.test.js
 * @description Integration Tests for Employee Management (Module M3 · Slices 3.2 to 3.8).
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.2 - 3.8)
 * - Tests complete role permissions, data scopes, account provisioning, CNIC validation, and status revocation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { env } from '../src/config/env.js';
import { decrypt } from '../src/utils/crypto.js';

describe('Module M3 — Employee Management API Integration Tests (Slices 3.2 - 3.8)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  let testDept;
  let otherDept;
  let testManagerEmployee;
  let testEmployeeRecord;
  let createdEmployeeId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m3_employees');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});

    // 1. Seed Core Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'employee.create', subject: 'Employee', scope: 'all' },
        { action: 'employee.view', subject: 'Employee', scope: 'all' },
        { action: 'employee.edit', subject: 'Employee', scope: 'all' },
        { action: 'employee.delete', subject: 'Employee', scope: 'all' },
        { action: 'employee.salary.view', subject: 'Employee', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'department' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'own' }
      ]
    });

    // 2. Seed Departments
    testDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    otherDept = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      isActive: true
    });

    // 3. Seed Users
    superAdminUser = await User.create({
      email: 'admin.emp@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    hrUser = await User.create({
      email: 'hr.emp@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // Seed Manager Employee & User
    testManagerEmployee = await Employee.create({
      employeeCode: 'MGR-001',
      name: 'Dept Manager User',
      email: 'manager.emp@company.pk',
      departmentId: testDept._id,
      status: 'Active'
    });

    managerUser = await User.create({
      email: 'manager.emp@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      departmentId: testDept._id,
      employeeId: testManagerEmployee._id,
      isActive: true
    });
    managerToken = jwt.sign({ userId: managerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // Seed Staff Employee & User
    testEmployeeRecord = await Employee.create({
      employeeCode: 'EMP-001',
      name: 'Regular Employee Staff',
      email: 'staff.emp@company.pk',
      departmentId: testDept._id,
      status: 'Active'
    });

    employeeUser = await User.create({
      email: 'staff.emp@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      departmentId: testDept._id,
      employeeId: testEmployeeRecord._id,
      isActive: true
    });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await mongoose.disconnect();
  });

  // --- Slice 3.2 & 3.3: Employee Onboarding & CNIC Validation ---
  describe('Slice 3.2 & 3.3: Employee Onboarding & CNIC Validation', () => {
    it('should reject creation when CNIC format is invalid (missing hyphens / letters / length)', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeCode: 'EMP-999',
          name: 'Invalid CNIC User',
          email: 'invalid.cnic@company.pk',
          cnic: '3520212345671' // Missing hyphens
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow HR Manager to onboard employee and provision user login account', async () => {
      const payload = {
        employeeCode: 'EMP-102',
        name: 'Zubair Hashmi',
        email: 'zubair.hashmi@company.pk',
        phone: '+92 300 9876543',
        cnic: '35202-7654321-1',
        departmentId: testDept._id.toString(),
        employmentType: 'Permanent',
        bankDetails: {
          bankName: 'Meezan Bank',
          accountTitle: 'Zubair Hashmi',
          accountNumber: '01010102030405',
          iban: 'PK36MEZN0000000101010203'
        },
        createAccount: true
      };

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeCode).toBe('EMP-102');
      expect(res.body.data.name).toBe('Zubair Hashmi');
      expect(res.body.data.userId).toBeDefined();

      createdEmployeeId = res.body.data._id;

      // Verify User record was provisioned
      const createdUser = await User.findOne({ email: payload.email });
      expect(createdUser).not.toBeNull();
      expect(createdUser.isActive).toBe(true);
      expect(createdUser.mustChangePassword).toBe(true);
      expect(createdUser.employeeId.toString()).toBe(createdEmployeeId);

      // Verify raw database encryption of CNIC & IBAN
      const rawDoc = await Employee.collection.findOne({ _id: new mongoose.Types.ObjectId(createdEmployeeId) });
      expect(rawDoc.cnic).toContain(':');
      expect(rawDoc.cnic).not.toBe(payload.cnic);
      expect(decrypt(rawDoc.cnic)).toBe(payload.cnic);
      expect(decrypt(rawDoc.bankDetails.iban)).toBe(payload.bankDetails.iban);
    }, 15000);

    it('should reject duplicate employee code with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeCode: 'EMP-102',
          name: 'Duplicate Code Person',
          email: 'duplicate.code@company.pk'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should reject duplicate email with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeCode: 'EMP-103',
          name: 'Duplicate Email Person',
          email: 'zubair.hashmi@company.pk'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already assigned');
    });

    it('should forbid Department Manager and Employee from creating new employees (HTTP 403)', async () => {
      const resManager = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          employeeCode: 'EMP-104',
          name: 'Manager Attempt',
          email: 'mgr.attempt@company.pk'
        });

      expect(resManager.status).toBe(403);

      const resEmployee = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeCode: 'EMP-105',
          name: 'Staff Attempt',
          email: 'staff.attempt@company.pk'
        });

      expect(resEmployee.status).toBe(403);
    });
  });

  // --- Slice 3.4: Directory Search & Faceted Scoping ---
  describe('Slice 3.4: Scoped Directory & Search', () => {
    it('should allow HR Manager to list all company employees', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter employees by search query (name or code)', async () => {
      const res = await request(app)
        .get('/api/v1/employees?search=Zubair')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].name).toBe('Zubair Hashmi');
    });

    it('should restrict Department Manager to department employees only', async () => {
      // Create employee in another department
      await Employee.create({
        employeeCode: 'HR-STAFF-01',
        name: 'HR Exclusive Staff',
        email: 'hr.exclusive@company.pk',
        departmentId: otherDept._id,
        status: 'Active'
      });

      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      // Ensure no staff from otherDept are present
      const hasOtherDept = res.body.data.items.some(
        (emp) => emp.departmentId?._id?.toString() === otherDept._id.toString()
      );
      expect(hasOtherDept).toBe(false);
    });
  });

  // --- Slice 3.5 & 3.15: Profile Views & Self-Service ---
  describe('Slice 3.5 & 3.15: Profile Access & Self-Service', () => {
    it('should allow HR Manager to view complete decrypted employee profile', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cnic).toBe('35202-7654321-1');
      expect(res.body.data.bankDetails?.iban).toBe('PK36MEZN0000000101010203');
    });

    it('should allow authenticated Employee to view own profile via /me', async () => {
      const res = await request(app)
        .get('/api/v1/employees/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeCode).toBe('EMP-001');
    });

    it('should forbid employee from viewing another employees profile', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  // --- Slice 3.6: Profile Updates ---
  describe('Slice 3.6: Employee Profile Updates', () => {
    it('should allow HR Manager to update employee phone and address', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          phone: '+92 333 1112233',
          address: { city: 'Lahore', country: 'Pakistan' }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('+92 333 1112233');
      expect(res.body.data.address.city).toBe('Lahore');
    });

    it('should forbid Department Manager from editing employee records', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ phone: '+92 333 0000000' });

      expect(res.status).toBe(403);
    });
  });

  // --- Slice 3.7: Status Lifecycle & Automated Login Revocation ---
  describe('Slice 3.7: Status Lifecycle & Account Revocation', () => {
    it('should transition status to Terminated with mandatory reason and deactivate login', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          status: 'Terminated',
          reason: 'Breach of NDA'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Terminated');
      expect(res.body.data.statusReason).toBe('Breach of NDA');

      // Verify linked User account was automatically deactivated
      const linkedUser = await User.findOne({ email: 'zubair.hashmi@company.pk' });
      expect(linkedUser.isActive).toBe(false);
    });

    it('should reject status change without mandatory reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          status: 'Notice'
        });

      expect(res.status).toBe(400);
    });
  });

  // --- Slice 3.8: Soft Deletion ---
  describe('Slice 3.8: Employee Soft Deletion', () => {
    it('should soft delete employee and exclude from active directory', async () => {
      const res = await request(app)
        .delete(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);

      // Verify soft deletion in MongoDB
      const rawDoc = await Employee.collection.findOne({ _id: new mongoose.Types.ObjectId(createdEmployeeId) });
      expect(rawDoc.isDeleted).toBe(true);

      // Verify exclusion from directory
      const listRes = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`);

      const existsInList = listRes.body.data.items.some((e) => e._id === createdEmployeeId);
      expect(existsInList).toBe(false);
    });
  });
});
