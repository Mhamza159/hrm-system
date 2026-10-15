/**
 * @file employee-workflows.api.test.js
 * @description Integration Tests for Career History, Salary Revision, Skills Taxonomy,
 * Self-Service Profile, Change Requests, and Scheduled Probation Expiry Alerts (Slices 3.10-3.12, 3.15-3.17).
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.10, 3.11, 3.12, 3.15, 3.16, 3.17)
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
import { Designation } from '../src/models/designation.model.js';
import { EmployeeHistory } from '../src/models/employeeHistory.model.js';
import { ProfileChangeRequest } from '../src/models/profileChangeRequest.model.js';
import { env } from '../src/config/env.js';
import { decrypt } from '../src/utils/crypto.js';

describe('Module M3 — Advanced Workflows & History Tests (Slices 3.10-3.12, 3.15-3.17)', () => {
  let superAdminToken;
  let hrToken;
  let deptManagerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let deptManagerUser;
  let employeeUser;

  let testDept;
  let juniorDesig;
  let seniorDesig;
  let testEmployeeRecord;
  let changeRequestId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m3_workflows');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await EmployeeHistory.deleteMany({});
    await ProfileChangeRequest.deleteMany({});

    // 1. Seed Roles
    const adminRole = await Role.create({
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
        { action: 'employee.salary.view', subject: 'Employee', scope: 'all' }
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

    // 2. Reference Department & Designations
    testDept = await Department.create({
      name: 'Product Engineering',
      code: 'PE',
      isActive: true
    });

    juniorDesig = await Designation.create({
      title: 'Junior Frontend Engineer',
      code: 'JFE',
      grade: 'Junior',
      departmentId: testDept._id,
      isActive: true
    });

    seniorDesig = await Designation.create({
      title: 'Senior Fullstack Architect',
      code: 'SFA',
      grade: 'Senior',
      departmentId: testDept._id,
      isActive: true
    });

    // 3. Seed Users
    superAdminUser = await User.create({
      email: 'admin.wf@test.com',
      passwordHash: 'dummy_hash',
      roles: [adminRole._id],
      isVerified: true,
      isActive: true
    });

    hrUser = await User.create({
      email: 'hr.wf@test.com',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isVerified: true,
      isActive: true
    });

    deptManagerUser = await User.create({
      email: 'manager.wf@test.com',
      passwordHash: 'dummy_hash',
      roles: [deptManagerRole._id],
      departmentId: testDept._id,
      isVerified: true,
      isActive: true
    });

    employeeUser = await User.create({
      email: 'staff.wf@test.com',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      departmentId: testDept._id,
      isVerified: true,
      isActive: true
    });

    // 4. Tokens
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    deptManagerToken = jwt.sign({ userId: deptManagerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    // 5. Seed Test Employee linked to employeeUser
    const probationDate = new Date();
    probationDate.setDate(probationDate.getDate() + 7);

    testEmployeeRecord = await Employee.create({
      employeeCode: 'EMP-WF-001',
      name: 'Usman Ghani',
      email: 'staff.wf@test.com',
      userId: employeeUser._id,
      cnic: '35202-1234567-9',
      departmentId: testDept._id,
      designationId: juniorDesig._id,
      managerId: null,
      status: 'Probation',
      employmentType: 'Probation',
      joiningDate: new Date(),
      probationEndDate: probationDate,
      skills: ['JavaScript', 'HTML5'],
      bankDetails: {
        bankName: 'Meezan Bank',
        accountTitle: 'Usman Ghani',
        accountNumber: '1234567890',
        iban: 'PK36MEZN0001234567890123'
      }
    });

    employeeUser.employeeId = testEmployeeRecord._id;
    await employeeUser.save();
  }, 20000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await EmployeeHistory.deleteMany({});
    await ProfileChangeRequest.deleteMany({});
    await mongoose.connection.close();
  });

  // --- Slice 3.15: Self-Service "My Profile" Portal ---
  describe('Slice 3.15: Self-Service My Profile', () => {
    it('3.15.1: unauthenticated access to /me returns HTTP 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/employees/me');
      expect(res.status).toBe(401);
    });

    it('3.15.2: authenticated employee accesses /me and retrieves own linked record (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/employees/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeCode).toBe('EMP-WF-001');
      expect(res.body.data.name).toBe('Usman Ghani');
      expect(res.body.data.email).toBe('staff.wf@test.com');
    });
  });

  // --- Slice 3.12: Skills Taxonomy & Tech Stack Tagging ---
  describe('Slice 3.12: Skills Taxonomy', () => {
    it('3.12.1: employee updates their own skills tags via PATCH /me/skills (HTTP 200)', async () => {
      const res = await request(app)
        .patch('/api/v1/employees/me/skills')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ skills: ['React', 'Node.js', 'MongoDB', 'MERN Stack'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(expect.arrayContaining(['React', 'Node.js', 'MongoDB', 'MERN Stack']));

      const emp = await Employee.findById(testEmployeeRecord._id);
      expect(emp.skills).toContain('React');
    });

    it('3.12.2: filtering directory by skill returns only matching employees (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/employees?skill=React')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].employeeCode).toBe('EMP-WF-001');
    });

    it('3.12.3: invalid non-array skills payload returns HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/employees/me/skills')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ skills: 'not-an-array' });

      expect(res.status).toBe(400);
    });
  });

  // --- Slice 3.10: Career & Promotional Job History Timeline ---
  describe('Slice 3.10: Career Promotion & Job History', () => {
    it('3.10.1: non-admin employee receives HTTP 403 trying to record career history', async () => {
      const res = await request(app)
        .post(`/api/v1/employees/${testEmployeeRecord._id}/history`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          eventType: 'Promotion',
          newDesignationId: seniorDesig._id,
          remarks: 'Self-promotion attempt'
        });

      expect(res.status).toBe(403);
    });

    it('3.10.2: HR Manager records promotion with new designation (HTTP 201)', async () => {
      const res = await request(app)
        .post(`/api/v1/employees/${testEmployeeRecord._id}/history`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          eventType: 'Promotion',
          previousDesignationId: juniorDesig._id,
          newDesignationId: seniorDesig._id,
          effectiveDate: new Date(),
          remarks: 'Promoted to Senior Fullstack Architect for stellar delivery'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eventType).toBe('Promotion');

      // Verify employee record's designationId was updated
      const updatedEmp = await Employee.findById(testEmployeeRecord._id);
      expect(String(updatedEmp.designationId)).toBe(String(seniorDesig._id));
    });

    it('3.10.3: query job history timeline returns recorded milestone (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${testEmployeeRecord._id}/history`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].eventType).toBe('Promotion');
      expect(res.body.data[0].remarks).toContain('Promoted');
    });
  });

  // --- Slice 3.11: Salary Revision History (Permission Guarded) ---
  describe('Slice 3.11: Salary Revision History', () => {
    beforeAll(async () => {
      // Record a salary revision in history
      await EmployeeHistory.create({
        employeeId: testEmployeeRecord._id,
        eventType: 'Salary Revision',
        previousSalary: 120000,
        newSalary: 180000,
        incrementAmount: 60000,
        incrementPercentage: 50,
        effectiveDate: new Date(),
        remarks: 'Annual merit salary revision',
        createdBy: hrUser._id
      });
    });

    it('3.11.1: Super Admin and HR Manager access salary history (HTTP 200)', async () => {
      const resAdmin = await request(app)
        .get(`/api/v1/employees/${testEmployeeRecord._id}/salary-history`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.data.length).toBeGreaterThanOrEqual(1);
      expect(resAdmin.body.data[0].newSalary).toBe(180000);

      const resHr = await request(app)
        .get(`/api/v1/employees/${testEmployeeRecord._id}/salary-history`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(resHr.status).toBe(200);
    });

    it('3.11.2: Department Manager receives HTTP 403 Forbidden accessing salary history', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${testEmployeeRecord._id}/salary-history`)
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // --- Slice 3.16: Sensitive Field Profile Change Request Workflow ---
  describe('Slice 3.16: Profile Change Requests', () => {
    it('3.16.1: employee submits change request for updated Bank IBAN (HTTP 201)', async () => {
      const res = await request(app)
        .post('/api/v1/employees/me/change-request')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          field: 'bankDetails',
          requestedValue: {
            bankName: 'HBL',
            accountTitle: 'Usman Ghani',
            accountNumber: '9876543210',
            iban: 'PK42HABB0009876543210987'
          },
          reason: 'Switched primary salary disbursement account to HBL'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.field).toBe('bankDetails');

      changeRequestId = res.body.data._id;
    });

    it('3.16.2: HR Manager lists pending change requests (HTTP 200)', async () => {
      const res = await request(app)
        .get('/api/v1/change-requests?status=pending')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('3.16.3: HR Manager approves request and verifies employee model updated with encrypted IBAN (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/change-requests/${changeRequestId}/decide`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ action: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');

      // Verify Employee record now has the new HBL details and encrypted IBAN
      const updatedEmp = await Employee.findById(testEmployeeRecord._id);
      expect(updatedEmp.bankDetails.bankName).toBe('HBL');
      expect(updatedEmp.bankDetails.accountNumber).toBe('9876543210');

      const decryptedIban = decrypt(updatedEmp.bankDetails.iban);
      expect(decryptedIban).toBe('PK42HABB0009876543210987');
    });

    it('3.16.4: rejecting a change request keeps original employee data intact (HTTP 200)', async () => {
      // Submit a second request
      const reqRes = await request(app)
        .post('/api/v1/employees/me/change-request')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          field: 'address',
          requestedValue: { street: 'Fake Address 123', city: 'Karachi' },
          reason: 'Moved home'
        });

      const secondReqId = reqRes.body.data._id;

      // HR Rejects it
      const rejectRes = await request(app)
        .patch(`/api/v1/change-requests/${secondReqId}/decide`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          action: 'rejected',
          rejectionReason: 'Invalid proof of residence submitted'
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('rejected');
      expect(rejectRes.body.data.rejectionReason).toBe('Invalid proof of residence submitted');
    });
  });

  // --- Slice 3.17: Scheduled Probation Period Expiry Alerts ---
  describe('Slice 3.17: Scheduled Probation Expiry Alerts', () => {
    it('3.17.1: manual probation check trigger alerts employees expiring in 7 days (HTTP 200)', async () => {
      const res = await request(app)
        .post('/api/v1/employees/jobs/check-probation')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expiringCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.alertsSent.length).toBeGreaterThanOrEqual(1);

      const alert = res.body.data.alertsSent.find((a) => a.employeeCode === 'EMP-WF-001');
      expect(alert).toBeDefined();
      expect(alert.recipients).toContain('hr.wf@test.com');
    });
  });
});
