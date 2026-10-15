/**
 * @file m3.employees.e2e.test.js
 * @description Comprehensive End-to-End Multi-Role Verification for Module M3 Employee Management.
 * 
 * SPECIFICATION & COVERAGE:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.1 to 3.17)
 * - Journey 1: Super Admin Flow (Onboarding with Account Provisioning, Document Vault, History, Export, Profile Inspection)
 * - Journey 2: HR Manager Flow (Excel Bulk Ingestion with Errors, Change Request Approval, Termination with Account Revocation)
 * - Journey 3: Department Manager Flow (Horizontal Scope Filtering, Financial Masking, Permission Lockdown)
 * - Journey 4: Employee Self-Service Flow (Personal Profile, Shift View, Skills Tagging, Change Request, Boundary Enforcement)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import bcrypt from 'bcrypt';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Shift } from '../src/models/shift.model.js';
import { EmployeeHistory } from '../src/models/employeeHistory.model.js';
import { ProfileChangeRequest } from '../src/models/profileChangeRequest.model.js';
import { env } from '../src/config/env.js';
import { decrypt } from '../src/utils/crypto.js';

describe('Module M3 — Multi-Role End-to-End User Journeys (E2E-M3)', () => {
  let superAdminToken;
  let hrToken;
  let deptManagerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let deptManagerUser;
  let employeeUser;

  let engineeringDept;
  let hrDept;
  let architectDesig;
  let engineerDesig;
  let morningShift;

  let onboardedEmployeeId;
  let createdDocumentPath;
  let peerEmployeeRecord;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m3_e2e');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Shift.deleteMany({});
    await EmployeeHistory.deleteMany({});
    await ProfileChangeRequest.deleteMany({});

    // 1. Roles
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
        { action: 'employee.create', subject: 'Employee', scope: 'all' },
        { action: 'employee.edit', subject: 'Employee', scope: 'all' },
        { action: 'employee.delete', subject: 'Employee', scope: 'all' },
        { action: 'employee.salary.view', subject: 'Employee', scope: 'all' },
        { action: 'report.export', subject: 'Report', scope: 'all' }
      ]
    });

    const deptManagerRole = await Role.create({
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

    // 2. Organization Structure
    engineeringDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    hrDept = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      isActive: true
    });

    architectDesig = await Designation.create({
      title: 'Principal Architect',
      code: 'PR-ARCH',
      grade: 'Lead',
      departmentId: engineeringDept._id,
      isActive: true
    });

    engineerDesig = await Designation.create({
      title: 'Senior Software Engineer',
      code: 'SR-SWE',
      grade: 'Senior',
      departmentId: engineeringDept._id,
      isActive: true
    });

    morningShift = await Shift.create({
      name: 'Morning Regular Shift',
      code: 'MRN-01',
      startTime: '09:00',
      endTime: '18:00',
      type: 'fixed',
      graceMinutes: 15,
      isActive: true
    });

    // 3. System Users
    superAdminUser = await User.create({
      email: 'admin.e2e@company.pk',
      passwordHash: 'hash',
      roles: [superAdminRole._id],
      isVerified: true,
      isActive: true
    });

    hrUser = await User.create({
      email: 'hr.e2e@company.pk',
      passwordHash: 'hash',
      roles: [hrRole._id],
      isVerified: true,
      isActive: true
    });

    deptManagerUser = await User.create({
      email: 'manager.eng@company.pk',
      passwordHash: 'hash',
      roles: [deptManagerRole._id],
      isVerified: true,
      isActive: true
    });

    const deptManagerEmp = await Employee.create({
      employeeCode: 'EMP-ENG-000',
      name: 'Manager Engineering',
      email: 'manager.eng@company.pk',
      userId: deptManagerUser._id,
      departmentId: engineeringDept._id,
      designationId: architectDesig._id,
      cnic: '35202-0000000-1',
      joiningDate: new Date(),
      status: 'Active',
      employmentType: 'Permanent'
    });
    deptManagerUser.employeeId = deptManagerEmp._id;
    await deptManagerUser.save();

    // 4. Peer employee in HR dept (to test departmental boundary)
    peerEmployeeRecord = await Employee.create({
      employeeCode: 'EMP-HR-001',
      name: 'Sara Siddiqui',
      email: 'sara.hr@company.pk',
      departmentId: hrDept._id,
      cnic: '35201-9999999-9',
      joiningDate: new Date(),
      status: 'Active',
      employmentType: 'Permanent'
    });

    // 5. Auth Tokens
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    deptManagerToken = jwt.sign({ userId: deptManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  }, 25000);

  afterAll(async () => {
    if (createdDocumentPath && fs.existsSync(createdDocumentPath)) {
      try {
        fs.unlinkSync(createdDocumentPath);
      } catch {
        // ignore
      }
    }
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Shift.deleteMany({});
    await EmployeeHistory.deleteMany({});
    await ProfileChangeRequest.deleteMany({});
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. SUPER ADMIN FLOW
  // =========================================================================
  describe('Flow 1: Super Admin Complete Onboarding & Audit Journey', () => {
    it('1.1: Super Admin completes 5-step onboarding wizard for "Zubair Hashmi" with user provisioning (HTTP 201)', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          employeeCode: 'EMP-ENG-100',
          name: 'Zubair Hashmi',
          email: 'zubair.hashmi@company.pk',
          phone: '+92 300 7777777',
          cnic: '35202-7777777-1',
          cnicExpiry: '2030-12-31',
          dob: '1992-05-15',
          gender: 'Male',
          departmentId: engineeringDept._id,
          designationId: engineerDesig._id,
          shiftId: morningShift._id,
          employmentType: 'Permanent',
          joiningDate: '2026-01-01',
          address: {
            street: 'Gulberg III, Block B',
            city: 'Lahore',
            state: 'Punjab',
            postalCode: '54000',
            country: 'Pakistan'
          },
          emergencyContact: {
            name: 'Nadeem Hashmi',
            relationship: 'Brother',
            phone: '+92 300 8888888'
          },
          bankDetails: {
            bankName: 'Meezan Bank',
            accountTitle: 'Zubair Hashmi',
            accountNumber: '010199990000',
            iban: 'PK36MEZN0001019999000012'
          },
          createAccount: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeCode).toBe('EMP-ENG-100');
      expect(res.body.data.name).toBe('Zubair Hashmi');

      onboardedEmployeeId = res.body.data._id;

      // Verify provisioned User account
      const provisionedUser = await User.findOne({ email: 'zubair.hashmi@company.pk' });
      expect(provisionedUser).toBeDefined();
      expect(provisionedUser.isActive).toBe(true);

      employeeUser = provisionedUser;
      employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    }, 20000);

    it('1.2: Super Admin uploads CNIC copy to document vault (HTTP 201)', async () => {
      const fakePdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

      const res = await request(app)
        .post(`/api/v1/employees/${onboardedEmployeeId}/documents`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .field('type', 'CNIC Copy')
        .field('title', 'Zubair CNIC Front & Back')
        .attach('file', fakePdfBuffer, {
          filename: 'cnic_zubair.pdf',
          contentType: 'application/pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('CNIC Copy');

      createdDocumentPath = path.resolve(process.cwd(), res.body.data.fileUrl.replace(/^\//, ''));
      expect(fs.existsSync(createdDocumentPath)).toBe(true);
    }, 15000);

    it('1.3: Super Admin records promotional milestone in history (HTTP 201)', async () => {
      const res = await request(app)
        .post(`/api/v1/employees/${onboardedEmployeeId}/history`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          eventType: 'Promotion',
          previousDesignationId: engineerDesig._id,
          newDesignationId: architectDesig._id,
          effectiveDate: new Date(),
          remarks: 'Promoted to Principal Architect'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const emp = await Employee.findById(onboardedEmployeeId);
      expect(String(emp.designationId)).toBe(String(architectDesig._id));
    }, 15000);

    it('1.4: Super Admin exports employee directory to Excel (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/employees/export')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .buffer(true)
        .parse((res, callback) => {
          const data = [];
          res.on('data', (chunk) => data.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(data)));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(res.body);
      const ws = wb.getWorksheet('Employee Directory');
      expect(ws).toBeDefined();
      expect(ws.rowCount).toBeGreaterThanOrEqual(2);
    }, 20000);

    it('1.5: Super Admin inspects full profile with unmasked salary & decrypted bank details (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${onboardedEmployeeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bankDetails.iban).toBe('PK36MEZN0001019999000012');
      expect(res.body.data.cnic).toBe('35202-7777777-1');
    }, 15000);
  });

  // =========================================================================
  // 2. HR MANAGER FLOW
  // =========================================================================
  describe('Flow 2: HR Manager Bulk Ingestion, Approval & Revocation Journey', () => {
    let changeReqId;

    it('2.1: HR Manager ingests spreadsheet and verifies row-by-row error report (HTTP 200)', async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Staff');
      ws.addRow(['Code', 'Name', 'Email', 'Phone', 'CNIC', 'Dept', 'Desig', 'Type']);
      // 1 Valid row
      ws.addRow(['EMP-HR-002', 'Farhan Ali', 'farhan.ali@company.pk', '+92 300 1234567', '35202-1111222-3', 'HR', 'SR-SWE', 'Permanent']);
      // 1 Invalid row (invalid CNIC)
      ws.addRow(['EMP-HR-003', 'Invalid User', 'invalid@company.pk', '+92 300 1234568', 'INVALID-CNIC', 'HR', 'SR-SWE', 'Permanent']);

      const buffer = await wb.xlsx.writeBuffer();

      const res = await request(app)
        .post('/api/v1/employees/import')
        .set('Authorization', `Bearer ${hrToken}`)
        .attach('file', buffer, {
          filename: 'hr-bulk.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.succeeded).toBe(1);
      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.errors[0].employeeCode).toBe('EMP-HR-003');
    }, 20000);

    it('2.2: Employee submits change request for bank IBAN, and HR Manager approves it (HTTP 200)', async () => {
      const submitRes = await request(app)
        .post('/api/v1/employees/me/change-request')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          field: 'bankDetails',
          requestedValue: {
            bankName: 'Standard Chartered',
            accountTitle: 'Zubair Hashmi',
            accountNumber: '555566667777',
            iban: 'PK12SCBL0000555566667777'
          },
          reason: 'Switched primary salary bank'
        });

      expect(submitRes.status).toBe(201);
      changeReqId = submitRes.body.data._id;

      const approveRes = await request(app)
        .patch(`/api/v1/change-requests/${changeReqId}/decide`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ action: 'approved' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('approved');

      const emp = await Employee.findById(onboardedEmployeeId);
      expect(emp.bankDetails.bankName).toBe('Standard Chartered');
      expect(decrypt(emp.bankDetails.iban)).toBe('PK12SCBL0000555566667777');
    }, 15000);

    it('2.3: HR Manager transitions employee status to Terminated with mandatory reason (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${onboardedEmployeeId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          status: 'Terminated',
          reason: 'Gross violation of corporate information security policy'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Terminated');

      // Verify linked User is deactivated
      const usr = await User.findById(employeeUser._id);
      expect(usr.isActive).toBe(false);
      expect(usr.refreshTokenHash).toBeNull();
    }, 15000);

    it('2.4: Terminated employee login attempt returns HTTP 401 / 400 deactivated', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'zubair.hashmi@company.pk',
          password: 'AnyPassword123!'
        });

      // Should be rejected because account is disabled/deactivated
      expect([400, 401, 403]).toContain(loginRes.status);
    }, 15000);
  });

  // =========================================================================
  // 3. DEPARTMENT MANAGER FLOW
  // =========================================================================
  describe('Flow 3: Department Manager Scoped Boundary Journey', () => {
    it('3.1: Department Manager directory is strictly scoped to own department (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);

      // Verify every returned employee belongs to Engineering dept
      const items = res.body.data.items;
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(String(item.departmentId?._id || item.departmentId)).toBe(String(engineeringDept._id));
      });

      // Ensure peer employee from HR dept is NOT present
      const hrPeer = items.find((e) => e.employeeCode === 'EMP-HR-001');
      expect(hrPeer).toBeUndefined();
    }, 15000);

    it('3.2: Department Manager views subordinate with masked financial details (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${onboardedEmployeeId}`)
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      // Bank details must be omitted or sanitized
      expect(res.body.data.bankDetails).toBeUndefined();
      expect(res.body.data.cnic).toBe('35202-*******-1');
    }, 15000);

    it('3.3: Department Manager attempt to mutate employee record returns HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${onboardedEmployeeId}`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    }, 15000);
  });

  // =========================================================================
  // 4. EMPLOYEE FLOW
  // =========================================================================
  describe('Flow 4: Employee Self-Service & Boundary Enforcement Journey', () => {
    let activeEmpUser;
    let activeEmpToken;
    let activeEmpRecord;

    beforeAll(async () => {
      const empRole = await Role.findOne({ name: 'Employee' });
      activeEmpUser = await User.create({
        email: 'salman.eng@company.pk',
        passwordHash: 'hash',
        roles: [empRole._id],
        isVerified: true,
        isActive: true
      });

      activeEmpRecord = await Employee.create({
        employeeCode: 'EMP-ENG-202',
        name: 'Salman Farooq',
        email: 'salman.eng@company.pk',
        userId: activeEmpUser._id,
        departmentId: engineeringDept._id,
        designationId: engineerDesig._id,
        shiftId: morningShift._id,
        cnic: '35202-8888888-2',
        status: 'Active',
        employmentType: 'Permanent',
        joiningDate: new Date(),
        skills: ['Python']
      });

      activeEmpUser.employeeId = activeEmpRecord._id;
      await activeEmpUser.save();

      activeEmpToken = jwt.sign({ userId: activeEmpUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    });

    it('4.1: Employee queries /me self-service portal (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/employees/me')
        .set('Authorization', `Bearer ${activeEmpToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employeeCode).toBe('EMP-ENG-202');
      expect(res.body.data.shiftId.name).toBe('Morning Regular Shift');
    }, 15000);

    it('4.2: Employee updates personal skill tags (HTTP 200)', async () => {
      const res = await request(app)
        .patch('/api/v1/employees/me/skills')
        .set('Authorization', `Bearer ${activeEmpToken}`)
        .send({ skills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL'] });

      expect(res.status).toBe(200);
      expect(res.body.data).toContain('Docker');
    }, 15000);

    it('4.3: Employee attempt to onboard new staff returns HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${activeEmpToken}`)
        .send({
          employeeCode: 'EMP-ILLEGAL-01',
          name: 'Unauthorized User',
          email: 'unauth@company.pk'
        });

      expect(res.status).toBe(403);
    }, 15000);

    it('4.4: Employee attempt to view peer employee profile returns HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${peerEmployeeRecord._id}`)
        .set('Authorization', `Bearer ${activeEmpToken}`);

      expect(res.status).toBe(403);
    }, 15000);
  });
});
