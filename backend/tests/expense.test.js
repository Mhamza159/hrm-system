/**
 * @file expense.test.js
 * @description Integration Tests for Module M11 Expense Claims (BUILD-GUIDE Section 16 · Rows 11.1 to 11.5).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { ExpenseCategory } from '../src/models/expenseCategory.model.js';
import { Expense } from '../src/models/expense.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M11 — Expense Claims Integration Suite', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let testDept;
  let testEmployee;
  let managerEmployee;
  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  let createdCategoryId;
  let createdClaimId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace(/hrm_[a-z0-9_]+/i, 'hrm_test_m11_expenses');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await ExpenseCategory.deleteMany({});
    await Expense.deleteMany({});

    // 1. Roles
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
          { action: 'expense.settings', subject: 'ExpenseCategory', scope: 'all' }
        ]
      }),
      Role.create({
        name: 'Department Manager',
        description: 'Department Head',
        isSystem: true,
        permissions: [
          { action: 'expense.view', subject: 'Expense', scope: 'team' },
          { action: 'expense.create', subject: 'Expense', scope: 'own' },
          { action: 'expense.approve', subject: 'Expense', scope: 'team', limit: 1500000 }
        ]
      }),
      Role.create({
        name: 'Employee',
        description: 'Staff Member',
        isSystem: true,
        permissions: [
          { action: 'expense.view', subject: 'Expense', scope: 'own' },
          { action: 'expense.create', subject: 'Expense', scope: 'own' }
        ]
      })
    ]);

    // 2. Department
    testDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    // 3. Manager Profile & User
    managerEmployee = await Employee.create({
      employeeCode: 'EMP-M11-MGR',
      name: 'Asad Manager',
      email: 'manager@hrm.test',
      phone: '+923007654321',
      departmentId: testDept._id,
      status: 'Active',
      joiningDate: new Date('2022-01-01')
    });

    managerUser = await User.create({
      name: 'Asad Manager',
      email: 'manager@hrm.test',
      passwordHash: 'dummy_hash',
      role: 'Department Manager',
      roles: [managerRole._id],
      employeeId: managerEmployee._id,
      isActive: true
    });
    managerEmployee.userId = managerUser._id;
    await managerEmployee.save();

    // 4. Employee Profile & User
    testEmployee = await Employee.create({
      employeeCode: 'EMP-M11-DEV',
      name: 'Bilal Khan',
      email: 'employee@hrm.test',
      phone: '+923001234567',
      departmentId: testDept._id,
      managerId: managerEmployee._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    employeeUser = await User.create({
      name: 'Bilal Employee',
      email: 'employee@hrm.test',
      passwordHash: 'dummy_hash',
      role: 'Employee',
      roles: [employeeRole._id],
      employeeId: testEmployee._id,
      isActive: true
    });
    testEmployee.userId = employeeUser._id;
    await testEmployee.save();

    // 5. Super Admin & HR Users
    superAdminUser = await User.create({
      name: 'Hamza Super Admin',
      email: 'superadmin@hrm.test',
      passwordHash: 'dummy_hash',
      role: 'Super Admin',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrUser = await User.create({
      name: 'Sara HR',
      email: 'hr@hrm.test',
      passwordHash: 'dummy_hash',
      role: 'HR Manager',
      roles: [hrRole._id],
      isActive: true
    });

    // 6. Sign JWT Tokens (authenticate middleware checks userId and env.JWT_ACCESS_SECRET)
    const signToken = (u, roleName) =>
      jwt.sign(
        { userId: u._id, email: u.email, role: roleName, roles: [roleName] },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin');
    hrToken = signToken(hrUser, 'HR Manager');
    managerToken = signToken(managerUser, 'Department Manager');
    employeeToken = signToken(employeeUser, 'Employee');
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==========================================================================
  // Slice 11.1: Expense Categories & Policy Limits (BUILD-GUIDE Row 11.1)
  // ==========================================================================
  describe('11.1: Expense Categories & Policy Limits', () => {
    it('allows HR Manager to create a category with a positive limit and receipt mandate', async () => {
      const res = await request(app)
        .post('/api/v1/expenses/categories')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Travel & Lodging',
          code: 'TRAVEL',
          maxLimitPaisa: 5000000, // PKR 50,000
          requiresReceipt: true,
          description: 'Official out-of-station client visits'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('TRAVEL');
      expect(res.body.data.maxLimitPaisa).toBe(5000000);
      expect(res.body.data.requiresReceipt).toBe(true);
      createdCategoryId = res.body.data._id;
    });

    it('rejects duplicate category code with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/expenses/categories')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Another Travel Category',
          code: 'TRAVEL',
          maxLimitPaisa: 2000000
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('blocks regular Employee from creating categories with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/expenses/categories')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Unauthorized Category',
          code: 'HACK',
          maxLimitPaisa: 1000000
        });

      expect(res.status).toBe(403);
    });

    it('allows Employee to list categories to populate the claim dropdown', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/categories')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c) => c.code === 'TRAVEL')).toBe(true);
    });
  });

  // ==========================================================================
  // Slice 11.2: Expense Claim Submission with Mandatory Receipt (BUILD-GUIDE Row 11.2)
  // ==========================================================================
  describe('11.2: Expense Claim Submission with Mandatory Receipt', () => {
    it('strictly rejects submission without a receipt with HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .field('categoryId', createdCategoryId)
        .field('amount', 250000) // PKR 2,500
        .field('expenseDate', '2026-10-25')
        .field('description', 'Client lunch meeting without receipt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects claim amount exceeding category limit with HTTP 422', async () => {
      const fakeReceiptBuffer = Buffer.from('FAKE_RECEIPT_IMAGE_CONTENT');

      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .attach('receipt', fakeReceiptBuffer, 'bill.jpg')
        .field('categoryId', createdCategoryId)
        .field('amount', 6000000) // PKR 60,000 > max limit 50,000
        .field('expenseDate', '2026-10-25')
        .field('description', 'Luxury flight ticket');

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('exceeds category');
    });

    it('successfully submits claim within category limit with receipt attached', async () => {
      const fakeReceiptBuffer = Buffer.from('VALID_PNG_RECEIPT_CONTENT');

      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .attach('receipt', fakeReceiptBuffer, 'ticket.png')
        .field('categoryId', createdCategoryId)
        .field('amount', 1200000) // PKR 12,000 (< 15,000 PKR manager threshold)
        .field('expenseDate', '2026-10-26')
        .field('description', 'Inter-city travel fuel and tolls');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.claimNumber).toMatch(/^EXP-\d{6}-\d{4}$/);
      expect(res.body.data.status).toBe('pending_manager');
      expect(res.body.data.receiptUrl).toBeDefined();
      createdClaimId = res.body.data._id;
    });

    it('allows employee to view their personal expense claims', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/my')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]._id).toBe(createdClaimId);
    });
  });

  // ==========================================================================
  // Slice 11.3: Multi-Tier Approval Chain & Limit Checks (BUILD-GUIDE Row 11.3)
  // ==========================================================================
  describe('11.3: Multi-Tier Approval Chain', () => {
    it('blocks applicant employee from self-approving their own claim with HTTP 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${createdClaimId}/decide`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          decision: 'approve',
          comments: 'Approving my own claim'
        });

      expect(res.status).toBe(403);
    });

    it('allows Department Manager to directly approve claim within threshold (<= 15,000 PKR)', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${createdClaimId}/decide`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'approve',
          comments: 'Approved, legitimate travel expenses with verified receipt.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.approvedAmount).toBe(1200000);
    });

    it('escalates claim exceeding manager limit (> 15,000 PKR) to Super Admin (pending_admin)', async () => {
      // 1. Submit large claim: PKR 25,000
      const fakeReceiptBuffer = Buffer.from('EXPENSIVE_HOTEL_RECEIPT');
      const submitRes = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .attach('receipt', fakeReceiptBuffer, 'hotel.jpg')
        .field('categoryId', createdCategoryId)
        .field('amount', 2500000) // PKR 25,000 > manager limit 15,000
        .field('expenseDate', '2026-10-27')
        .field('description', '5-day conference hotel accommodation');

      expect(submitRes.status).toBe(201);
      const largeClaimId = submitRes.body.data._id;

      // 2. Department Manager tries to approve -> automatically escalates to pending_admin
      const decideRes = await request(app)
        .patch(`/api/v1/expenses/${largeClaimId}/decide`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'approve',
          comments: 'Team approved; exceeds my threshold so recommending to Admin.'
        });

      expect(decideRes.status).toBe(200);
      expect(decideRes.body.data.status).toBe('pending_admin');

      // 3. Super Admin approves executive escalation
      const adminRes = await request(app)
        .patch(`/api/v1/expenses/${largeClaimId}/decide`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          decision: 'approve',
          comments: 'Executive board approved conference lodging.'
        });

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.status).toBe('approved');
    });
  });

  // ==========================================================================
  // Slice 11.4: Reimbursement Execution (BUILD-GUIDE Row 11.4)
  // ==========================================================================
  describe('11.4: Reimbursement Execution', () => {
    it('allows HR Manager to reimburse approved claim via direct corporate payout', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${createdClaimId}/reimburse`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          method: 'direct',
          paymentReference: 'FT-HBL-992384',
          remarks: 'Direct bank transfer executed to employee account.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('reimbursed');
      expect(res.body.data.reimbursement.method).toBe('direct');
      expect(res.body.data.reimbursement.paymentReference).toBe('FT-HBL-992384');
    });
  });

  // ==========================================================================
  // Slice 11.5: Monthly Expense Report & Aggregation (BUILD-GUIDE Row 11.5)
  // ==========================================================================
  describe('11.5: Monthly Expense Report & Aggregation', () => {
    it('aggregates corporate expenses accurately by category and returns grand totals in paisa', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/reports/monthly')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grandTotals.totalClaims).toBeGreaterThanOrEqual(2);
      expect(res.body.data.grandTotals.reimbursedAmountPaisa).toBe(1200000);
      expect(Array.isArray(res.body.data.breakdown)).toBe(true);
    });
  });
});
