/**
 * @file m10.loans.e2e.test.js
 * @description Comprehensive Multi-Role End-to-End User Journey Tests for Module M10 (Loans & Salary Advances).
 * 
 * ROLE JOURNEYS VERIFIED:
 * 1. Employee:
 *    - Queries personal borrowing limits (advance <= 1x gross, loan <= 2x basic).
 *    - Submits valid salary advance application.
 *    - Receives draft schedule and status 'pending_recommendation'.
 *    - Blocked from requesting over policy cap (HTTP 422).
 *    - Views personal loans and installment schedule.
 * 2. Department Manager:
 *    - Inspects pending team loan applications.
 *    - Recommends application with remarks (transitions to 'pending_hr').
 *    - Unauthorized to disburse or bypass approval tiers (HTTP 403).
 * 3. HR Manager:
 *    - Inspects company-wide pending HR verification queue.
 *    - Forwards verified loan to executive desk (transitions to 'pending_admin').
 * 4. Super Admin:
 *    - Inspects pending executive disbursement queue.
 *    - Approves and disburses loan via bank transfer (transitions to 'active').
 *    - Inspects company borrowing ledger summary and KPI metrics.
 *    - Executes early settlement / prepayment, transitioning loan to 'closed'.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Employee } from '../src/models/employee.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { Loan } from '../src/models/loan.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M10 — Multi-Role End-to-End Verification (All 4 Default Roles)', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser;
  let engineeringDept;
  let deptManagerEmp, staffEmp;
  let createdLoanId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m10_e2e');
    await mongoose.connect(testDbUri);

    // Clean test database
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      SalaryStructure.deleteMany({}),
      Loan.deleteMany({})
    ]);

    // Bootstrap roles and base admin
    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptManagerRole = await Role.findOne({ name: 'Department Manager' });
    const employeeRole = await Role.findOne({ name: 'Employee' });

    // Ensure permissions include loans module
    const rolesToUpdate = [
      { role: superAdminRole, perms: ['loan.view', 'loan.create', 'loan.recommend', 'loan.approve', 'loan.prepay', 'loan.settings'] },
      { role: hrRole, perms: ['loan.view', 'loan.create', 'loan.recommend', 'loan.approve', 'loan.prepay'] },
      { role: deptManagerRole, perms: ['loan.view', 'loan.create', 'loan.recommend'] },
      { role: employeeRole, perms: ['loan.view', 'loan.create'] }
    ];

    for (const { role, perms } of rolesToUpdate) {
      if (role) {
        for (const action of perms) {
          if (!role.permissions.some(p => p.action === action)) {
            role.permissions.push({
              action,
              subject: 'Loan',
              scope: role.name === 'Super Admin' || role.name === 'HR Manager' ? 'all' : (role.name === 'Department Manager' ? 'department' : 'own'),
              conditions: {}
            });
          }
        }
        await role.save();
      }
    }

    // Create Departments
    engineeringDept = await Department.create({
      name: 'Engineering M10',
      code: 'ENG10',
      isActive: true
    });

    // Create Employee Profiles first
    deptManagerEmp = await Employee.create({
      employeeCode: 'EMP-M10-MGR',
      name: 'Tariq Manager',
      email: 'deptmanager.m10@test.com',
      phone: '+923001112233',
      departmentId: engineeringDept._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    staffEmp = await Employee.create({
      employeeCode: 'EMP-M10-DEV',
      name: 'Hamza Engineer',
      email: 'employee.m10@test.com',
      phone: '+923004445566',
      departmentId: engineeringDept._id,
      managerId: deptManagerEmp._id,
      status: 'Active',
      joiningDate: new Date('2024-01-01')
    });

    // Create Users linked to employees
    superAdminUser = await User.create({
      name: 'Super Admin M10',
      email: 'superadmin.m10@test.com',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrManagerUser = await User.create({
      name: 'HR Manager M10',
      email: 'hrmanager.m10@test.com',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    deptManagerUser = await User.create({
      name: 'Tariq Manager',
      email: 'deptmanager.m10@test.com',
      passwordHash: 'dummy_hash',
      roles: [deptManagerRole._id],
      employeeId: deptManagerEmp._id,
      isActive: true
    });

    employeeUser = await User.create({
      name: 'Hamza Engineer',
      email: 'employee.m10@test.com',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      employeeId: staffEmp._id,
      isActive: true
    });

    deptManagerEmp.userId = deptManagerUser._id;
    await deptManagerEmp.save();

    staffEmp.userId = employeeUser._id;
    await staffEmp.save();

    // Create Salary Structure for staff (Gross = 100,000 PKR = 10,000,000 paisa, Basic = 60,000 PKR = 6,000,000 paisa)
    await SalaryStructure.create({
      employeeId: staffEmp._id,
      effectiveFrom: new Date('2024-01-01'),
      currency: 'PKR',
      basicSalary: 6000000,
      houseRentAllowance: 2500000,
      medicalAllowance: 1000000,
      conveyanceAllowance: 500000,
      otherAllowances: 0,
      isActive: true
    });

    // Helper function for signing valid tokens
    const signToken = (user, roleName) => jwt.sign(
      { userId: user._id, email: user.email, roles: [roleName] },
      env.JWT_ACCESS_SECRET || env.JWT_SECRET || 'test_jwt_secret',
      { expiresIn: '1h' }
    );

    superAdminToken = signToken(superAdminUser, 'Super Admin');
    hrManagerToken = signToken(hrManagerUser, 'HR Manager');
    deptManagerToken = signToken(deptManagerUser, 'Department Manager');
    employeeToken = signToken(employeeUser, 'Employee');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==========================================
  // 1. Employee Journey
  // ==========================================
  describe('Role 1: Employee Journey', () => {
    it('1.1 Employee checks their personal borrowing eligibility limits', async () => {
      const res = await request(app)
        .get('/api/v1/loans/my-eligibility')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.advanceMaxPaisa).toBe(10000000); // 1x Gross
      expect(res.body.data.loanMaxPaisa).toBe(12000000); // 2x Basic (2 * 60,000 = 120,000 PKR)
      expect(res.body.data.hasActiveLoan).toBe(false);
    });

    it('1.2 Employee is blocked from applying for amount exceeding policy cap (HTTP 422)', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'advance',
          amount: 15000000, // 150,000 PKR > 100,000 PKR cap
          repaymentTenureMonths: 1,
          reason: 'Excessive advance request that exceeds policy limits',
          effectiveStartMonth: '2026-11'
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/exceeds/i);
    });

    it('1.3 Employee successfully submits an advance request within cap', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'advance',
          amount: 5000000, // 50,000 PKR
          repaymentTenureMonths: 2,
          reason: 'Emergency household medical expense advance',
          effectiveStartMonth: '2026-11'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending_recommendation');
      expect(res.body.data.schedule).toHaveLength(2);
      expect(res.body.data.remainingBalance).toBe(5000000);

      createdLoanId = res.body.data._id;
    });

    it('1.4 Employee can view their personal loans and itemized schedule', async () => {
      const res = await request(app)
        .get('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const scheduleRes = await request(app)
        .get(`/api/v1/loans/${createdLoanId}/schedule`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(scheduleRes.status).toBe(200);
      expect(scheduleRes.body.data).toHaveLength(2);
      expect(scheduleRes.body.data[0].amount).toBe(2500000);
      expect(scheduleRes.body.data[1].amount).toBe(2500000);
    });
  });

  // ==========================================
  // 2. Department Manager Journey
  // ==========================================
  describe('Role 2: Department Manager Journey', () => {
    it('2.1 Department Manager lists team pending requests', async () => {
      const res = await request(app)
        .get('/api/v1/loans?status=pending_recommendation')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      const found = res.body.data.find(l => l._id.toString() === createdLoanId.toString());
      expect(found).toBeDefined();
    });

    it('2.2 Department Manager cannot directly disburse or approve (HTTP 403 on bypass)', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'approve',
          comments: 'Attempting to bypass tier hierarchy directly'
        });

      // deptManager only has loan.recommend, not loan.approve
      expect([400, 403]).toContain(res.status);
    });

    it('2.3 Department Manager recommends the loan to HR', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'recommend',
          comments: 'Verified genuine emergency. Strong employee track record.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending_hr');
      expect(res.body.data.recommendation).toBeDefined();
      expect(res.body.data.recommendation.decision).toBe('recommended');
    });
  });

  // ==========================================
  // 3. HR Manager Journey
  // ==========================================
  describe('Role 3: HR Manager Journey', () => {
    it('3.1 HR Manager views the pending HR verification queue', async () => {
      const res = await request(app)
        .get('/api/v1/loans?status=pending_hr')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      const target = res.body.data.find(l => l._id.toString() === createdLoanId.toString());
      expect(target).toBeDefined();
    });

    it('3.2 HR Manager verifies employment/salary and forwards to Super Admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanId}/decide`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          decision: 'forward',
          comments: 'HR audit complete: Salary structure confirmed, tenure >= 6 months.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending_admin');
      expect(res.body.data.hrReview).toBeDefined();
      expect(res.body.data.hrReview.decision).toBe('forwarded');
    });
  });

  // ==========================================
  // 4. Super Admin Journey
  // ==========================================
  describe('Role 4: Super Admin Journey', () => {
    it('4.1 Super Admin views pending disbursement queue', async () => {
      const res = await request(app)
        .get('/api/v1/loans?status=pending_admin')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      const target = res.body.data.find(l => l._id.toString() === createdLoanId.toString());
      expect(target).toBeDefined();
    });

    it('4.2 Super Admin gives executive approval and disburses loan via bank transfer', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanId}/decide`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          decision: 'approve',
          comments: 'Approved by executive committee. Disbursed via corporate payroll account.',
          disbursementMethod: 'bank_transfer'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.adminApproval).toBeDefined();
      expect(res.body.data.adminApproval.decision).toBe('approved');
      expect(res.body.data.adminApproval.disbursementMethod).toBe('bank_transfer');
    });

    it('4.3 Super Admin inspects company-wide loan ledger summary', async () => {
      const res = await request(app)
        .get('/api/v1/loans/ledger/summary')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalDisbursedPaisa).toBeGreaterThanOrEqual(5000000);
      expect(res.body.data.totalOutstandingPaisa).toBeGreaterThanOrEqual(5000000);
    });

    it('4.4 Super Admin executes early full settlement on behalf of employee', async () => {
      const res = await request(app)
        .post(`/api/v1/loans/${createdLoanId}/prepay`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          amount: 5000000,
          paymentMethod: 'bank_transfer',
          reference: 'TRX-E2E-FULL-SETTLE'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.remainingBalance).toBe(0);
      expect(res.body.data.status).toBe('closed');
      expect(res.body.data.schedule.every(s => s.status === 'prepaid')).toBe(true);
    });
  });
});
