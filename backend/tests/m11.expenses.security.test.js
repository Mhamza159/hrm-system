/**
 * @file m11.expenses.security.test.js
 * @description Security Hardening, Doubt-Driven Adversarial & Concurrency Stress Test Suite for M11 Expense Claims.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { ExpenseCategory } from '../src/models/expenseCategory.model.js';
import { Expense } from '../src/models/expense.model.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

describe('Module M11 — Security & Hardening Stress Test Suite', () => {
  let superAdminToken, managerToken, employeeAToken, employeeBToken;
  let superAdminUser, managerUser, empAUser, empBUser;
  let empAEmployee, empBEmployee, managerEmployee;
  let testCategory;
  let empAClaimId, empBClaimId, escalatedClaimId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_test_security');
    }

    // Clean test state
    await Expense.deleteMany({});
    await ExpenseCategory.deleteMany({ code: { $in: ['SEC_TEST', 'SEC_CAP'] } });

    // Setup Department & Designations
    let dept = await Department.findOne({ code: 'SEC_DEPT' });
    if (!dept) {
      dept = await Department.create({ name: 'Security Dept', code: 'SEC_DEPT', isActive: true });
    }
    let desig = await Designation.findOne({ code: 'SEC-ANL' });
    if (!desig) {
      desig = await Designation.create({ title: 'Security Analyst', code: 'SEC-ANL', grade: 'Senior', departmentId: dept._id });
    }

    // Roles
    let adminRole = await Role.findOneAndUpdate(
      { name: 'Super Admin' },
      {
        name: 'Super Admin',
        description: 'Administrator',
        isSystem: true,
        permissions: [
          { action: 'expense.view', subject: 'Expense', scope: 'all' },
          { action: 'expense.create', subject: 'Expense', scope: 'own' },
          { action: 'expense.approve', subject: 'Expense', scope: 'all' },
          { action: 'expense.reimburse', subject: 'Expense', scope: 'all' },
          { action: 'expense.settings', subject: 'ExpenseCategory', scope: 'all' }
        ]
      },
      { upsert: true, new: true }
    );

    let mgrRole = await Role.findOneAndUpdate(
      { name: 'Department Manager' },
      {
        name: 'Department Manager',
        description: 'Department Head',
        isSystem: true,
        permissions: [
          { action: 'expense.view', subject: 'Expense', scope: 'team' },
          { action: 'expense.create', subject: 'Expense', scope: 'own' },
          { action: 'expense.approve', subject: 'Expense', scope: 'team', limit: 1500000 }
        ]
      },
      { upsert: true, new: true }
    );

    let empRole = await Role.findOneAndUpdate(
      { name: 'Employee' },
      {
        name: 'Employee',
        description: 'Staff Member',
        isSystem: true,
        permissions: [
          { action: 'expense.view', subject: 'Expense', scope: 'own' },
          { action: 'expense.create', subject: 'Expense', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    // Users & Employees
    superAdminUser = await User.create({
      name: 'Sec Admin',
      email: `sec_admin_${Date.now()}@test.pk`,
      role: 'Super Admin',
      roles: [adminRole._id],
      passwordHash: 'dummy_hash',
      isActive: true
    });
    const signToken = (u, roleName) =>
      jwt.sign(
        { userId: u._id, email: u.email, role: roleName, roles: [roleName] },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin');

    managerEmployee = await Employee.create({
      employeeCode: `EMP-SM-${Date.now().toString().slice(-4)}`,
      name: 'Sec Manager',
      email: `sec_mgr_${Date.now()}@test.pk`,
      departmentId: dept._id,
      designationId: desig._id,
      dateOfJoining: new Date(),
      status: 'Active'
    });
    managerUser = await User.create({
      name: 'Sec Manager',
      email: managerEmployee.email,
      role: 'Department Manager',
      roles: [mgrRole._id],
      employeeId: managerEmployee._id,
      passwordHash: 'dummy_hash',
      isActive: true
    });
    managerEmployee.userId = managerUser._id;
    await managerEmployee.save();

    managerToken = signToken(managerUser, 'Department Manager');

    // Employee A (Reports to manager)
    empAEmployee = await Employee.create({
      employeeCode: `EMP-SA-${Date.now().toString().slice(-4)}`,
      name: 'Employee Alice',
      email: `alice_${Date.now()}@test.pk`,
      departmentId: dept._id,
      designationId: desig._id,
      managerId: managerEmployee._id,
      dateOfJoining: new Date(),
      status: 'Active'
    });
    empAUser = await User.create({
      name: 'Employee Alice',
      email: empAEmployee.email,
      role: 'Employee',
      roles: [empRole._id],
      employeeId: empAEmployee._id,
      passwordHash: 'dummy_hash',
      isActive: true
    });
    empAEmployee.userId = empAUser._id;
    await empAEmployee.save();

    employeeAToken = signToken(empAUser, 'Employee');

    // Employee B (Reports to no one / different dept)
    empBEmployee = await Employee.create({
      employeeCode: `EMP-SB-${Date.now().toString().slice(-4)}`,
      name: 'Employee Bob',
      email: `bob_${Date.now()}@test.pk`,
      departmentId: dept._id,
      designationId: desig._id,
      dateOfJoining: new Date(),
      status: 'Active'
    });
    empBUser = await User.create({
      name: 'Employee Bob',
      email: empBEmployee.email,
      role: 'Employee',
      roles: [empRole._id],
      employeeId: empBEmployee._id,
      passwordHash: 'dummy_hash',
      isActive: true
    });
    empBEmployee.userId = empBUser._id;
    await empBEmployee.save();

    employeeBToken = signToken(empBUser, 'Employee');

    // Category
    testCategory = await ExpenseCategory.create({
      name: 'Security Test Category',
      code: 'SEC_TEST',
      maxLimitPaisa: 5000000, // PKR 50,000
      requiresReceipt: true,
      isActive: true
    });
  });

  afterAll(async () => {
    await Expense.deleteMany({});
    await ExpenseCategory.deleteMany({ code: { $in: ['SEC_TEST', 'SEC_CAP'] } });
  });

  // ============================================================================
  // 1. Mandatory Receipt Defense ("Bina Raseed Reject")
  // ============================================================================
  describe('Mandatory Receipt Defense (Bina Raseed Reject)', () => {
    it('rejects claim submission when receipt is missing completely (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .field('categoryId', testCategory._id.toString())
        .field('amount', 450000)
        .field('expenseDate', '2026-10-25')
        .field('description', 'Attempting submission without receipt file attachment');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects claim submission with zero-byte empty file attachment (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .field('categoryId', testCategory._id.toString())
        .field('amount', 450000)
        .field('expenseDate', '2026-10-25')
        .field('description', 'Attempting submission with empty receipt')
        .attach('receipt', Buffer.from(''), 'empty.png');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects forbidden file types (e.g. .exe / .sh) with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .field('categoryId', testCategory._id.toString())
        .field('amount', 450000)
        .field('expenseDate', '2026-10-25')
        .field('description', 'Attempting malicious executable upload')
        .attach('receipt', Buffer.from('echo malicious'), 'script.sh');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // 2. IDOR / Broken Object Level Authorization Defense
  // ============================================================================
  describe('IDOR & Broken Object Level Authorization Defense', () => {
    it('creates sample expenses for Alice and Bob', async () => {
      const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

      const resA = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .field('categoryId', testCategory._id.toString())
        .field('amount', 800000) // PKR 8,000
        .field('expenseDate', '2026-10-26')
        .field('description', 'Alice client lunch expenses')
        .attach('receipt', dummyPng, 'receipt_alice.png');

      expect(resA.status).toBe(201);
      empAClaimId = resA.body.data._id;

      const resB = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeBToken}`)
        .field('categoryId', testCategory._id.toString())
        .field('amount', 700000) // PKR 7,000
        .field('expenseDate', '2026-10-26')
        .field('description', 'Bob technical conference fees')
        .attach('receipt', dummyPng, 'receipt_bob.png');

      expect(resB.status).toBe(201);
      empBClaimId = resB.body.data._id;
    });

    it('allows Alice to view her own claim details via GET /api/v1/expenses/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/expenses/${empAClaimId}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(empAClaimId);
    });

    it('IDOR BLOCKED: blocks Bob from snooping Alice claim details with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/expenses/${empAClaimId}`)
        .set('Authorization', `Bearer ${employeeBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows Department Manager to view subordinate Alice claim (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/expenses/${empAClaimId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('IDOR BLOCKED: blocks Department Manager from viewing Bob claim (not their direct report) with HTTP 403', async () => {
      const res = await request(app)
        .get(`/api/v1/expenses/${empBClaimId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows Super Admin to view any claim across the entire organization (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/expenses/${empBClaimId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================================================
  // 3. Multi-Tier Escalation ("Bari Raqam Super Admin Tak") & Status Defense
  // ============================================================================
  describe('High-Value Claim Escalation & Lifecycle State Protections', () => {
    it('submits a high-value claim (PKR 30,000 > 15,000 manager limit) for Alice', async () => {
      const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .field('categoryId', testCategory._id.toString())
        .field('amount', 3000000) // PKR 30,000
        .field('expenseDate', '2026-10-27')
        .field('description', 'High value server hardware expense')
        .attach('receipt', dummyPng, 'receipt_high.png');

      expect(res.status).toBe(201);
      escalatedClaimId = res.body.data._id;
    });

    it('ESCALATION ENFORCED: Department Manager approving PKR 30,000 is intercepted and escalated to pending_admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${escalatedClaimId}/decide`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'approve',
          comments: 'Reviewed invoices and verifying hardware utility.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending_admin');
    });

    it('EXECUTIVE BOUNDARY: Department Manager is blocked from deciding escalated pending_admin claims (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${escalatedClaimId}/decide`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'approve',
          comments: 'Attempting to bypass executive escalation'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows Super Admin to approve the escalated claim', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${escalatedClaimId}/decide`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          decision: 'approve',
          comments: 'Board review complete. Approved for reimbursement.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('TERMINAL STATE DEFENSE: Settled claim cannot be re-decided (HTTP 400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${escalatedClaimId}/decide`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          decision: 'reject',
          comments: 'Attempting to re-decide settled claim'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already settled');
    });
  });

  // ============================================================================
  // 4. Double-Reimbursement Race Condition Defense
  // ============================================================================
  describe('Double-Reimbursement Race Condition Defense', () => {
    it('successfully reimburses approved claim once (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${escalatedClaimId}/reimburse`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          method: 'direct',
          paymentReference: 'WIRE-SEC-998877',
          remarks: 'Direct electronic wire transfer'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('reimbursed');
    });

    it('CONCURRENCY DEFENSE: Duplicate/second reimbursement call is rejected (HTTP 400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/expenses/${escalatedClaimId}/reimburse`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          method: 'direct',
          paymentReference: 'WIRE-DUPLICATE',
          remarks: 'Double-click simulation'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Only 'approved' claims can be reimbursed");
    });
  });

  // ============================================================================
  // 5. NoSQL Injection & Input Sanitization
  // ============================================================================
  describe('NoSQL Injection & Input Sanitization Defense', () => {
    it('blocks NoSQL injection in categoryId query parameter', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/my?categoryId[$ne]=dummy')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('blocks malicious/non-numeric amount in expense creation', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .field('categoryId', testCategory._id.toString())
        .field('amount', 'NaN')
        .field('expenseDate', '2026-10-25')
        .field('description', 'Testing malformed amount')
        .attach('receipt', Buffer.from('test'), 'test.png');

      expect(res.status).toBe(400);
    });
  });
});
