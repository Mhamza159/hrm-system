/**
 * @file softdelete.lock.test.js
 * @description Integration tests for Module X1.2: Soft delete invariants and finalized payroll run locking.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { PayrollRun } from '../src/models/payrollRun.model.js';
import { Payslip } from '../src/models/payslip.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module X1.2 — Soft Delete & Finalized Payroll Immutability Lock', () => {
  let superAdminToken;
  let employeeToken;

  let superAdminUser;
  let employeeUser;

  let approvedRunId;
  let paidRunId;
  let draftRunId;
  let testDept;
  let testEmployee;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_x1_softdelete');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await PayrollRun.deleteMany({});
    await Payslip.deleteMany({});

    // 1. Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [
        { action: 'manage', subject: 'all', scope: 'all' },
        { action: 'payroll.manage', subject: 'Payroll', scope: 'all' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'payroll.view', subject: 'Payroll', scope: 'own' }
      ]
    });

    // 2. Users
    superAdminUser = await User.create({
      email: 'admin.lock@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [superAdminRole._id],
      isActive: true,
      status: 'active'
    });

    employeeUser = await User.create({
      email: 'emp.lock@example.com',
      passwordHash: 'HashedPassword123!',
      roles: [employeeRole._id],
      isActive: true,
      status: 'active'
    });

    // 3. JWT Tokens
    const signToken = (user, roleName) =>
      jwt.sign(
        {
          userId: user._id,
          email: user.email,
          roles: [roleName]
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin');
    employeeToken = signToken(employeeUser, 'Employee');

    // 4. Department & Employee
    testDept = await Department.create({
      name: 'Engineering Security',
      code: 'ENGSEC'
    });

    testEmployee = await Employee.create({
      employeeCode: 'EMP-SEC-001',
      name: 'Locked Worker',
      email: 'locked.worker@example.com',
      departmentId: testDept._id,
      status: 'Active',
      isDeleted: false
    });

    // 5. Seed Payroll Runs
    const approvedRun = await PayrollRun.create({
      month: 6,
      year: 2026,
      cycleStartDate: new Date('2026-06-01'),
      cycleEndDate: new Date('2026-06-30'),
      payDate: new Date('2026-07-01'),
      status: 'approved',
      totalGrossPay: 10000000,
      totalNetPay: 9000000,
      generatedBy: superAdminUser._id
    });
    approvedRunId = approvedRun._id;

    const paidRun = await PayrollRun.create({
      month: 7,
      year: 2026,
      cycleStartDate: new Date('2026-07-01'),
      cycleEndDate: new Date('2026-07-31'),
      payDate: new Date('2026-08-01'),
      status: 'paid',
      totalGrossPay: 10000000,
      totalNetPay: 9000000,
      generatedBy: superAdminUser._id
    });
    paidRunId = paidRun._id;

    const draftRun = await PayrollRun.create({
      month: 8,
      year: 2026,
      cycleStartDate: new Date('2026-08-01'),
      cycleEndDate: new Date('2026-08-31'),
      payDate: new Date('2026-09-01'),
      status: 'draft',
      totalGrossPay: 10000000,
      totalNetPay: 9000000,
      generatedBy: superAdminUser._id
    });
    draftRunId = draftRun._id;

    await Payslip.create({
      payrollRunId: draftRunId,
      employeeId: testEmployee._id,
      month: 8,
      year: 2026,
      grossPay: 10000000,
      totalDeductions: 1000000,
      netPay: 9000000
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('X1.2-TEST: Rejects deleting an APPROVED payroll run with 400 Bad Request (Immutability Lock)', async () => {
    const res = await request(app)
      .delete(`/api/v1/payroll/runs/${approvedRunId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot delete an approved, paid, or locked payroll run/i);

    // Verify still exists in DB
    const runInDb = await PayrollRun.findById(approvedRunId);
    expect(runInDb.isDeleted).toBe(false);
  });

  it('X1.2-TEST: Rejects deleting a PAID payroll run with 400 Bad Request (Immutability Lock)', async () => {
    const res = await request(app)
      .delete(`/api/v1/payroll/runs/${paidRunId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot delete an approved, paid, or locked payroll run/i);

    const runInDb = await PayrollRun.findById(paidRunId);
    expect(runInDb.isDeleted).toBe(false);
  });

  it('X1.2-TEST: Allows soft deleting a DRAFT payroll run and marks associated payslips deleted', async () => {
    const res = await request(app)
      .delete(`/api/v1/payroll/runs/${draftRunId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify soft delete flag in DB
    const runInDb = await PayrollRun.findById(draftRunId);
    expect(runInDb.isDeleted).toBe(true);
    expect(runInDb.deletedAt).toBeDefined();

    const slipInDb = await Payslip.findOne({ payrollRunId: draftRunId });
    expect(slipInDb.isDeleted).toBe(true);
  });

  it('X1.2-TEST: Disallows regular Employee from deleting payroll runs (403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/v1/payroll/runs/${approvedRunId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('X1.2-TEST: Verifies isDeleted query isolation on soft-deleted employee', async () => {
    // Soft delete the test employee
    testEmployee.isDeleted = true;
    testEmployee.deletedAt = new Date();
    await testEmployee.save();

    // Verify active find query excludes soft deleted
    const activeEmployees = await Employee.find({ isDeleted: false });
    const found = activeEmployees.some((e) => e._id.toString() === testEmployee._id.toString());
    expect(found).toBe(false);
  });
});
