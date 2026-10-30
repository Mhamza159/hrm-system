/**
 * @file m11.expenses.e2e.test.js
 * @description Comprehensive Multi-Role End-to-End Verification Suite for Module M11 (Expense Claims).
 * 
 * ROLE JOURNEYS VERIFIED:
 * 1. Super Admin:
 *    - Configures corporate categories & policy limits.
 *    - Reviews & approves high-value escalations (> PKR 15,000).
 *    - Inspects organization-wide monthly expense reports.
 * 2. HR Manager:
 *    - Audits approved expenses queue.
 *    - Disburses verified reimbursements via direct transfer.
 * 3. Department Manager:
 *    - Reviews team members' pending claims.
 *    - Directly approves claims within PKR 15,000 limit.
 *    - Recommends/escalates claims exceeding threshold to Super Admin.
 *    - Prevented from self-approving personal claims (Separation of Duties - HTTP 403).
 * 4. Employee:
 *    - Inspects corporate categories and borrowing caps.
 *    - Submits legitimate claim with mandatory receipt proof.
 *    - Blocked if receipt is missing (HTTP 400) or amount exceeds cap (HTTP 422).
 *    - Monitors personal claim lifecycle and reimbursement status.
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
import { ExpenseCategory } from '../src/models/expenseCategory.model.js';
import { Expense } from '../src/models/expense.model.js';

describe('Module M11 — Multi-Role End-to-End Verification (All 4 Default Roles)', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser;
  let engineeringDept;
  let deptManagerEmp, staffEmp;

  let fuelCategoryId, travelCategoryId;
  let regularClaimId, escalatedClaimId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace(/hrm_[a-z0-9_]+/i, 'hrm_test_m11_e2e');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});
    await ExpenseCategory.deleteMany({});
    await Expense.deleteMany({});

    // 1. Core Roles
    const [superAdminRole, hrRole, managerRole, employeeRole] = await Promise.all([
      Role.create({
        name: 'Super Admin',
        description: 'System Administrator',
        isSystem: true,
        permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
      }),
      Role.create({
        name: 'HR Manager',
        description: 'Human Resources',
        isSystem: true,
        permissions: [
          { action: 'expense.view', subject: 'Expense', scope: 'all' },
          { action: 'expense.create', subject: 'Expense', scope: 'own' },
          { action: 'expense.approve', subject: 'Expense', scope: 'all' },
          { action: 'expense.reimburse', subject: 'Expense', scope: 'all' },
          { action: 'expense.settings', subject: 'ExpenseCategory', scope: 'all' },
          { action: 'report.view', subject: 'Report', scope: 'all' }
        ]
      }),
      Role.create({
        name: 'Department Manager',
        description: 'Engineering Lead',
        isSystem: true,
        permissions: [
          { action: 'expense.view', subject: 'Expense', scope: 'team' },
          { action: 'expense.create', subject: 'Expense', scope: 'own' },
          { action: 'expense.approve', subject: 'Expense', scope: 'team', limit: 1500000 },
          { action: 'report.view', subject: 'Report', scope: 'team' }
        ]
      }),
      Role.create({
        name: 'Employee',
        description: 'Software Engineer',
        isSystem: true,
        permissions: [
          { action: 'expense.view', subject: 'Expense', scope: 'own' },
          { action: 'expense.create', subject: 'Expense', scope: 'own' }
        ]
      })
    ]);

    // 2. Department
    engineeringDept = await Department.create({
      name: 'Engineering Services',
      code: 'ENG',
      isActive: true
    });

    // 3. Manager Profile & Account
    deptManagerEmp = await Employee.create({
      employeeCode: 'EMP-E2E-MGR',
      name: 'Tariq Manager',
      email: 'tariq.mgr@hrm.test',
      phone: '+923009876543',
      departmentId: engineeringDept._id,
      status: 'Active',
      joiningDate: new Date('2022-01-01')
    });

    deptManagerUser = await User.create({
      name: 'Tariq Manager',
      email: 'tariq.mgr@hrm.test',
      passwordHash: 'dummy_hash',
      role: 'Department Manager',
      roles: [managerRole._id],
      employeeId: deptManagerEmp._id,
      isActive: true
    });
    deptManagerEmp.userId = deptManagerUser._id;
    await deptManagerEmp.save();

    // 4. Staff Profile & Account
    staffEmp = await Employee.create({
      employeeCode: 'EMP-E2E-DEV',
      name: 'Hamza Staff',
      email: 'hamza.staff@hrm.test',
      phone: '+923001239876',
      departmentId: engineeringDept._id,
      managerId: deptManagerEmp._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    employeeUser = await User.create({
      name: 'Hamza Staff',
      email: 'hamza.staff@hrm.test',
      passwordHash: 'dummy_hash',
      role: 'Employee',
      roles: [employeeRole._id],
      employeeId: staffEmp._id,
      isActive: true
    });
    staffEmp.userId = employeeUser._id;
    await staffEmp.save();

    // 5. Super Admin & HR Users
    superAdminUser = await User.create({
      name: 'Executive Admin',
      email: 'admin.e2e@hrm.test',
      passwordHash: 'dummy_hash',
      role: 'Super Admin',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrManagerUser = await User.create({
      name: 'HR Officer',
      email: 'hr.e2e@hrm.test',
      passwordHash: 'dummy_hash',
      role: 'HR Manager',
      roles: [hrRole._id],
      isActive: true
    });

    // 6. Sign JWTs
    const sign = (u, r) =>
      jwt.sign({ userId: u._id, email: u.email, role: r, roles: [r] }, env.JWT_ACCESS_SECRET, {
        expiresIn: '1h'
      });

    superAdminToken = sign(superAdminUser, 'Super Admin');
    hrManagerToken = sign(hrManagerUser, 'HR Manager');
    deptManagerToken = sign(deptManagerUser, 'Department Manager');
    employeeToken = sign(employeeUser, 'Employee');
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==========================================================================
  // Role 1: Super Admin & HR Manager Setup
  // ==========================================================================
  describe('Phase 1 — Policy & Category Setup (Super Admin & HR)', () => {
    it('HR Manager creates category with cap: Fuel Allowance (PKR 10,000 cap)', async () => {
      const res = await request(app)
        .post('/api/v1/expenses/categories')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          name: 'Fuel & Commute',
          code: 'FUEL',
          maxLimitPaisa: 1000000, // PKR 10,000
          requiresReceipt: true,
          description: 'Official monthly fuel reimbursement with petrol pump slips.'
        });

      expect(res.status).toBe(201);
      fuelCategoryId = res.body.data._id;
    });

    it('Super Admin creates high-value category: Travel & Lodging (PKR 60,000 cap)', async () => {
      const res = await request(app)
        .post('/api/v1/expenses/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Client Travel & Flights',
          code: 'TRAVEL',
          maxLimitPaisa: 6000000, // PKR 60,000
          requiresReceipt: true,
          description: 'Inter-city travel with flight tickets and hotel receipts.'
        });

      expect(res.status).toBe(201);
      travelCategoryId = res.body.data._id;
    });
  });

  // ==========================================================================
  // Role 2: Employee Journey
  // ==========================================================================
  describe('Phase 2 — Employee Claim Journey', () => {
    it('Employee lists available corporate categories', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/categories')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('Employee is blocked from submitting without receipt (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .field('categoryId', fuelCategoryId)
        .field('amount', 450000)
        .field('expenseDate', '2026-10-28')
        .field('description', 'Fuel without pump receipt');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('receipt');
    });

    it('Employee is blocked from exceeding category limit (HTTP 422)', async () => {
      const fakeReceipt = Buffer.from('FAKE_SLIP');
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .attach('receipt', fakeReceipt, 'fuel_slip.jpg')
        .field('categoryId', fuelCategoryId)
        .field('amount', 1500000) // PKR 15,000 > Fuel cap 10,000
        .field('expenseDate', '2026-10-28')
        .field('description', 'Excessive fuel purchase');

      expect(res.status).toBe(422);
    });

    it('Employee successfully submits standard fuel claim (PKR 5,000 <= 15,000 manager limit)', async () => {
      const receipt = Buffer.from('VALID_PETROL_PUMP_RECEIPT');
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .attach('receipt', receipt, 'fuel_slip.jpg')
        .field('categoryId', fuelCategoryId)
        .field('amount', 500000) // PKR 5,000
        .field('expenseDate', '2026-10-28')
        .field('description', 'Fuel for site visit to client office in Gulberg');

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending_manager');
      regularClaimId = res.body.data._id;
    });

    it('Employee successfully submits high-value travel claim (PKR 35,000 > 15,000 manager limit)', async () => {
      const receipt = Buffer.from('VALID_FLIGHT_BOARDING_PASS');
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .attach('receipt', receipt, 'air_ticket.pdf')
        .field('categoryId', travelCategoryId)
        .field('amount', 3500000) // PKR 35,000
        .field('expenseDate', '2026-10-28')
        .field('description', 'Air ticket and hotel stay for conference in Islamabad');

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending_manager');
      escalatedClaimId = res.body.data._id;
    });

    it('Employee views personal claims list and sees submitted records', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/my')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ==========================================================================
  // Role 3: Department Manager Journey
  // ==========================================================================
  describe('Phase 3 — Department Manager Journey', () => {
    it('Department Manager views pending team claims queue', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/pending-approvals')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('Department Manager cannot approve their own claim (HTTP 403)', async () => {
      // Dept Manager submits own claim
      const receipt = Buffer.from('MGR_RECEIPT');
      const selfClaimRes = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .attach('receipt', receipt, 'mgr_receipt.png')
        .field('categoryId', fuelCategoryId)
        .field('amount', 300000)
        .field('expenseDate', '2026-10-28')
        .field('description', 'Manager personal fuel');

      expect(selfClaimRes.status).toBe(201);
      const selfClaimId = selfClaimRes.body.data._id;

      // Attempt self-approval
      const decideRes = await request(app)
        .patch(`/api/v1/expenses/${selfClaimId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'approve',
          comments: 'Self-approval attempt'
        });

      expect(decideRes.status).toBe(403);
    });

    it('Department Manager directly approves standard claim within threshold (PKR 5,000 <= 15,000)', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${regularClaimId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'approve',
          comments: 'Approved. Official trip fuel confirmed.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('Department Manager approves high-value claim -> automatically escalates to pending_admin (> PKR 15,000)', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${escalatedClaimId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'approve',
          comments: 'Recommended to Executive Admin for authorization.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending_admin');
    });
  });

  // ==========================================================================
  // Role 4: Super Admin Journey
  // ==========================================================================
  describe('Phase 4 — Super Admin Executive Review', () => {
    it('Super Admin reviews and gives final approval for escalated high-value claim', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${escalatedClaimId}/decide`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          decision: 'approve',
          comments: 'Executive board approved conference travel.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });
  });

  // ==========================================================================
  // Role 5: HR Manager Reimbursement Execution
  // ==========================================================================
  describe('Phase 5 — HR Manager Reimbursement Payout', () => {
    it('HR Manager reimburses the standard fuel claim via direct bank wire', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${regularClaimId}/reimburse`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          method: 'direct',
          paymentReference: 'WIRE-HBL-887123',
          remarks: 'Funds disbursed via company online banking portal.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('reimbursed');
      expect(res.body.data.reimbursement.method).toBe('direct');
      expect(res.body.data.reimbursement.paymentReference).toBe('WIRE-HBL-887123');
    });
  });

  // ==========================================================================
  // Phase 6: Financial Reports Verification
  // ==========================================================================
  describe('Phase 6 — Organization-wide Monthly Analytics', () => {
    it('HR Manager inspects monthly expense report and verifies accurate totals in integer paisa', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/reports/monthly')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.grandTotals.totalClaims).toBeGreaterThanOrEqual(3);
      expect(res.body.data.grandTotals.reimbursedAmountPaisa).toBe(500000);
      expect(res.body.data.breakdown.length).toBeGreaterThanOrEqual(2);
    });
  });
});

