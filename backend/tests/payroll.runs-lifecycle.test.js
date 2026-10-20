/**
 * @file payroll.runs-lifecycle.test.js
 * @description Integration Tests for Payroll Batch Generation, 4-Stage Lifecycle, Adjustments & Distribution.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.7, 9.8, 9.9, 9.11)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { MonthLock } from '../src/models/monthLock.model.js';
import { PayrollRun } from '../src/models/payrollRun.model.js';
import { Payslip } from '../src/models/payslip.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M9 — Batch Payroll Run & 4-Stage Lifecycle Test Suite (Slices 9.7, 9.8, 9.9, 9.11)', { timeout: 25000 }, () => {
  let superAdminToken;
  let hrToken;
  let employeeToken;

  let testEmployee;
  let superAdminUser;
  let testPayslipId;
  let generatedRunId;

  const targetMonth = 10;
  const targetYear = 2026;
  const yearMonth = '2026-10';

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m9_runs');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await SalaryStructure.deleteMany({});
    await Attendance.deleteMany({});
    await MonthLock.deleteMany({});
    await PayrollRun.deleteMany({});
    await Payslip.deleteMany({});

    // Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'payroll.manage', subject: 'Payroll', scope: 'all' },
        { action: 'payroll.view', subject: 'Payroll', scope: 'all' },
        { action: 'payroll.run', subject: 'Payroll', scope: 'all' }
        // Notice: payroll.approve is NOT granted to HR Manager
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [{ action: 'payroll.view', subject: 'Payroll', scope: 'own' }]
    });

    // Users
    superAdminUser = await User.create({
      name: 'Super Admin',
      email: 'admin.lifecycle@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id]
    });

    const hrUser = await User.create({
      name: 'HR Manager',
      email: 'hr.lifecycle@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id]
    });

    const empUser = await User.create({
      name: 'Zahid Khan',
      email: 'zahid.khan@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id]
    });

    // Employee
    testEmployee = await Employee.create({
      employeeCode: 'EMP-PAY-002',
      name: 'Zahid Khan',
      email: 'zahid.khan@hrm.local',
      phone: '+923009876543',
      joiningDate: new Date('2024-01-01'),
      status: 'Active',
      userId: empUser._id
    });

    // Salary Structure
    await SalaryStructure.create({
      employeeId: testEmployee._id,
      effectiveFrom: new Date('2026-01-01'),
      currency: 'PKR',
      basicSalary: 10000000,         // PKR 100,000
      houseRentAllowance: 4000000,   // PKR 40,000
      medicalAllowance: 1000000,     // PKR 10,000
      conveyanceAllowance: 1000000,  // PKR 10,000
      grossSalary: 16000000,         // PKR 160,000
      eobiEnabled: true,
      status: 'active'
    });

    // Approved Overtime in M5 Attendance (e.g. 10 hours)
    await Attendance.create({
      employeeId: testEmployee._id,
      date: new Date('2026-10-15T00:00:00.000Z'),
      status: 'present',
      overtimeMinutes: 600, // 10 hours
      overtimeApproved: true
    });

    // Tokens
    const signToken = (user, roleName) =>
      jwt.sign(
        { userId: user._id, email: user.email, roles: [roleName] },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin');
    hrToken = signToken(hrUser, 'HR Manager');
    employeeToken = signToken(empUser, 'Employee');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('9.7-BE: Rejects batch payroll generation if attendance month is NOT locked (422 Unprocessable Entity)', async () => {
    const res = await request(app)
      .post('/api/v1/payroll/runs/generate')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ month: targetMonth, year: targetYear });

    expect(res.status).toBe(422);
    expect(res.body.message).toContain('must be locked before payroll generation');
  });

  it('9.7-BE: Successfully generates batch payroll after month is locked and creates draft slips with overtime', async () => {
    // 1. Lock the month
    await MonthLock.create({
      yearMonth,
      isLocked: true,
      lockedBy: superAdminUser._id
    });

    // 2. Trigger Generation
    const res = await request(app)
      .post('/api/v1/payroll/runs/generate')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ month: targetMonth, year: targetYear });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.month).toBe(10);
    expect(res.body.data.year).toBe(2026);
    expect(res.body.data.status).toBe('review');
    expect(res.body.data.totalEmployees).toBe(1);

    generatedRunId = res.body.data._id;

    // Verify generated Payslip
    const slip = await Payslip.findOne({ payrollRunId: generatedRunId, employeeId: testEmployee._id });
    expect(slip).toBeTruthy();
    expect(slip.status).toBe('draft');
    expect(slip.overtimeHours).toBe(10);
    // Overtime pay = (100,000 / 30 / 8) * 1.5 * 10 = ~6,250 PKR (625,000 paisa)
    expect(slip.overtimePay).toBe(625000);
    expect(slip.grossPay).toBe(16625000); // 160,000 + 6,250 = 166,250 PKR
    expect(slip.taxWithheld).toBeGreaterThan(0);
    expect(slip.eobiEmployee).toBe(37000);

    testPayslipId = slip._id.toString();
  });

  it('9.9-BE: HR adjusts draft payslip with Eid Bonus and recalculates gross, tax, and run totals', async () => {
    const bonusPaisa = 2500000; // PKR 25,000

    const res = await request(app)
      .patch(`/api/v1/payroll/runs/${generatedRunId}/payslips/${testPayslipId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        type: 'earning',
        name: 'Eid Special Bonus',
        category: 'bonus',
        amount: bonusPaisa,
        description: 'Festival performance bonus'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // New gross should increase by 25,000 PKR
    expect(res.body.data.grossPay).toBe(16625000 + 2500000); // 191,250 PKR
    expect(res.body.data.earnings.some((e) => e.name === 'Eid Special Bonus')).toBe(true);

    // Verify parent run totals updated
    const updatedRun = await PayrollRun.findById(generatedRunId);
    expect(updatedRun.totalGrossPay).toBe(19125000);
  });

  it('9.8-BE: HR Manager is blocked from approving payroll run (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/payroll/runs/${generatedRunId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(403);
  });

  it('9.8-BE: Super Admin successfully approves payroll run, transitioning status to approved', async () => {
    const res = await request(app)
      .patch(`/api/v1/payroll/runs/${generatedRunId}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.isLocked).toBe(true);

    // Slips should be marked 'approved'
    const slip = await Payslip.findById(testPayslipId);
    expect(slip.status).toBe('approved');
  });

  it('9.9-BE: Rejects payslip adjustment after payroll run is approved (409 Conflict)', async () => {
    const res = await request(app)
      .patch(`/api/v1/payroll/runs/${generatedRunId}/payslips/${testPayslipId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        type: 'earning',
        name: 'Late Allowance',
        category: 'allowance',
        amount: 500000
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Cannot adjust payslips on an approved payroll run');
  });

  it('9.8-BE: Super Admin marks payroll run as paid', async () => {
    const res = await request(app)
      .patch(`/api/v1/payroll/runs/${generatedRunId}/mark-paid`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ paymentMethod: 'bank_transfer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('paid');

    const slip = await Payslip.findById(testPayslipId);
    expect(slip.status).toBe('paid');
  });

  it('9.11-BE: Employee retrieves their own paid payslip via /api/v1/payslips/my', async () => {
    const res = await request(app)
      .get('/api/v1/payslips/my')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('paid');
    expect(res.body.data[0].month).toBe(10);
  });
});
