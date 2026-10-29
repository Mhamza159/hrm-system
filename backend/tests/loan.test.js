/**
 * @file loan.test.js
 * @description Comprehensive Integration Tests for Module M10 Loans & Advances (Slices 10.1, 10.2, 10.3, 10.4, 10.6).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { Loan } from '../src/models/loan.model.js';
import { MonthLock } from '../src/models/monthLock.model.js';
import { PayrollRun } from '../src/models/payrollRun.model.js';
import { Payslip } from '../src/models/payslip.model.js';
import { executeBatchPayrollCalculation } from '../src/modules/payroll/payrollProcessor.js';
import { PayrollService } from '../src/modules/payroll/payroll.service.js';
import { compileAmortizationSchedule } from '../src/modules/loans/loanPolicy.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M10 — Loans & Salary Advances Integration Suite', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let testDept;
  let testEmployee;
  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  let createdLoanId;
  let createdLoanDbId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m10_loans');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await SalaryStructure.deleteMany({});
    await Loan.deleteMany({});

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
        { action: 'loan.view', subject: 'Loan', scope: 'all' },
        { action: 'loan.recommend', subject: 'Loan', scope: 'all' },
        { action: 'loan.approve', subject: 'Loan', scope: 'all' },
        { action: 'loan.prepay', subject: 'Loan', scope: 'all' },
        { action: 'loan.settings', subject: 'Loan', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'loan.view', subject: 'Loan', scope: 'team' },
        { action: 'loan.recommend', subject: 'Loan', scope: 'team' },
        { action: 'loan.create', subject: 'Loan', scope: 'own' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'loan.view', subject: 'Loan', scope: 'own' },
        { action: 'loan.create', subject: 'Loan', scope: 'own' }
      ]
    });

    // 2. Department
    testDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      status: 'active'
    });

    // 3. Users & Employees
    superAdminUser = await User.create({
      name: 'Super Admin',
      email: 'admin.loans@company.com',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrUser = await User.create({
      name: 'HR Officer',
      email: 'hr.loans@company.com',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    const managerEmp = await Employee.create({
      employeeCode: 'EMP-M10-MGR',
      name: 'Eng Manager',
      email: 'manager.loans@company.com',
      phone: '+923007654321',
      departmentId: testDept._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    managerUser = await User.create({
      name: 'Eng Manager',
      email: 'manager.loans@company.com',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      employeeId: managerEmp._id,
      isActive: true
    });
    managerEmp.userId = managerUser._id;
    await managerEmp.save();

    testEmployee = await Employee.create({
      employeeCode: 'EMP-M10-01',
      name: 'Ali Khan',
      email: 'ali.loans@company.com',
      phone: '+923001234567',
      departmentId: testDept._id,
      managerId: managerEmp._id,
      status: 'Active',
      joiningDate: new Date('2024-01-01')
    });

    employeeUser = await User.create({
      name: 'Ali Khan',
      email: 'ali.loans@company.com',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      employeeId: testEmployee._id,
      isActive: true
    });

    testEmployee.userId = employeeUser._id;
    await testEmployee.save();

    // 4. Assign Salary Structure: Gross = 100,000 PKR (10,000,000 paisa), Basic = 60,000 PKR (6,000,000 paisa)
    await SalaryStructure.create({
      employeeId: testEmployee._id,
      version: 1,
      status: 'active',
      effectiveFrom: new Date('2024-01-01'),
      currency: 'PKR',
      basicSalary: 6000000,
      houseRentAllowance: 4000000,
      grossSalary: 10000000,
      netSalary: 9500000,
      status: 'active'
    });

    // 5. Auth Tokens (must include userId for authenticate middleware)
    superAdminToken = jwt.sign(
      { userId: superAdminUser._id, email: superAdminUser.email, roles: ['Super Admin'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    hrToken = jwt.sign(
      { userId: hrUser._id, email: hrUser.email, roles: ['HR Manager'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    managerToken = jwt.sign(
      { userId: managerUser._id, email: managerUser.email, roles: ['Department Manager'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: employeeUser._id, email: employeeUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('10.2: Borrowing Eligibility & Policy Caps', () => {
    it('calculates borrowing limits correctly based on salary structure', async () => {
      const res = await request(app)
        .get('/api/v1/loans/my-eligibility')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Advance: 1x gross = 100,000 PKR = 10,000,000 paisa
      expect(res.body.data.advanceMaxPaisa).toBe(10000000);
      // Loan: 2x basic = 120,000 PKR = 12,000,000 paisa
      expect(res.body.data.loanMaxPaisa).toBe(12000000);
      expect(res.body.data.isProbation).toBe(false);
      expect(res.body.data.hasActiveAdvance).toBe(false);
      expect(res.body.data.hasActiveLoan).toBe(false);
    });

    it('rejects an advance exceeding 1x gross salary with HTTP 422', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'advance',
          amount: 15000000, // 150,000 PKR exceeds 100,000 PKR gross cap
          repaymentTenureMonths: 2,
          effectiveStartMonth: '2026-11',
          reason: 'Excessive advance request testing policy breach'
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/exceeds your maximum borrowing policy limit/i);
    });
  });

  describe('10.1: Application Submission & Draft Amortization Schedule', () => {
    it('successfully submits a valid advance request and generates draft schedule', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'advance',
          amount: 6000000, // 60,000 PKR
          repaymentTenureMonths: 2,
          effectiveStartMonth: '2026-11',
          reason: 'Emergency home repair expense'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loanId).toMatch(/^ADV-/);
      expect(res.body.data.status).toBe('pending_recommendation');
      expect(res.body.data.amount).toBe(6000000);
      expect(res.body.data.remainingBalance).toBe(6000000);
      expect(res.body.data.schedule).toHaveLength(2);

      // Verify schedule amounts sum to 6,000,000 paisa
      const totalSchedulePaisa = res.body.data.schedule.reduce((acc, curr) => acc + curr.amount, 0);
      expect(totalSchedulePaisa).toBe(6000000);

      createdLoanId = res.body.data.loanId;
      createdLoanDbId = res.body.data._id;
    });

    it('rejects duplicate concurrent application of the same type', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'advance',
          amount: 2000000,
          repaymentTenureMonths: 1,
          effectiveStartMonth: '2026-12',
          reason: 'Second duplicate advance while first is pending'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/active or pending/i);
    });
  });

  describe('10.3: Multi-Tier Approval Chain', () => {
    it('Dept Manager recommends application (pending_recommendation -> pending_hr)', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanDbId}/decide`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'recommend',
          comments: 'Recommended for approval. Employee has stellar performance.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending_hr');
      expect(res.body.data.recommendation.decision).toBe('recommended');
    });

    it('HR Manager forwards application (pending_hr -> pending_admin)', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanDbId}/decide`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          decision: 'forward',
          comments: 'Salary history and attendance verified. Forwarding to Executive.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending_admin');
      expect(res.body.data.hrReview.decision).toBe('forwarded');
    });

    it('Super Admin approves & disburses (pending_admin -> active)', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanDbId}/decide`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          decision: 'approve',
          disbursementMethod: 'bank_transfer',
          comments: 'Approved and corporate wire initiated.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.adminApproval.decision).toBe('approved');
      expect(res.body.data.adminApproval.disbursementMethod).toBe('bank_transfer');
    });
  });

  describe('10.4: Installment Repayment Schedule Inspection', () => {
    it('retrieves itemized installment schedule with exact due dates and amounts', async () => {
      const res = await request(app)
        .get(`/api/v1/loans/${createdLoanDbId}/schedule`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].dueMonth).toBe('2026-11');
      expect(res.body.data[1].dueMonth).toBe('2026-12');
      expect(res.body.data[0].status).toBe('pending');
    });
  });

  describe('10.6: Early Prepayment & Full Settlement', () => {
    it('executes full early prepayment, sets remaining balance to zero, and transitions status to closed', async () => {
      const res = await request(app)
        .post(`/api/v1/loans/${createdLoanDbId}/prepay`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          amount: 6000000, // Full 60,000 PKR
          paymentMethod: 'bank_transfer',
          reference: 'TXN-ONLINE-98214'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('closed');
      expect(res.body.data.remainingBalance).toBe(0);
      expect(res.body.data.totalRepaid).toBe(6000000);
      expect(res.body.data.repayments).toHaveLength(1);
      expect(res.body.data.repayments[0].reference).toBe('TXN-ONLINE-98214');

      // Check installments marked prepaid
      const scheduleRes = await request(app)
        .get(`/api/v1/loans/${createdLoanDbId}/schedule`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(scheduleRes.body.data.every((inst) => inst.status === 'prepaid')).toBe(true);
    });

    it('returns executive loan ledger summary with accurate recovered and outstanding totals', async () => {
      const res = await request(app)
        .get('/api/v1/loans/ledger/summary')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalDisbursedPaisa).toBe(6000000);
      expect(res.body.data.totalRepaidPaisa).toBe(6000000);
      expect(res.body.data.totalOutstandingPaisa).toBe(0);
    });
  });

  describe('10.5: Automated Payroll Deduction Integration', () => {
    it('appends loan installment to draft payslip and settles loan installment on payroll mark paid', async () => {
      // 1. Create an active loan with November 2026 installment
      const schedule = compileAmortizationSchedule(10000000, 10, '2026-11');
      const payrollLoan = await Loan.create({
        loanId: 'LN-2026-TESTPAY',
        employeeId: testEmployee._id,
        type: 'loan',
        amount: 10000000,
        repaymentTenureMonths: 10,
        monthlyInstallment: 1000000,
        remainingBalance: 10000000,
        totalRepaid: 0,
        reason: 'Payroll deduction automated test loan',
        status: 'active',
        effectiveStartMonth: '2026-11',
        schedule
      });

      // 2. Ensure MonthLock exists for 2026-11 and clean up any prior test run
      await PayrollRun.deleteMany({ year: 2026, month: 11 });
      await Payslip.deleteMany({ year: 2026, month: 11 });
      await MonthLock.deleteMany({ yearMonth: '2026-11' });
      await MonthLock.create({
        yearMonth: '2026-11',
        isLocked: true,
        lockedBy: superAdminUser._id
      });

      // 3. Execute batch payroll calculation
      const run = await executeBatchPayrollCalculation({
        month: 11,
        year: 2026,
        actor: superAdminUser
      });

      expect(run).toBeDefined();

      // 4. Verify payslip has loan_installment deduction line item
      const payslip = await Payslip.findOne({
        payrollRunId: run._id,
        employeeId: testEmployee._id
      });

      expect(payslip).toBeDefined();
      const loanDeduction = payslip.deductions.find((d) => d.category === 'loan_installment');
      expect(loanDeduction).toBeDefined();
      expect(loanDeduction.amount).toBe(1000000);

      // 5. Approve and Mark Payroll Paid
      run.status = 'approved';
      await run.save();

      await PayrollService.markPayrollPaid(run._id, superAdminUser, { paymentMethod: 'bank_transfer' });

      // 6. Assert loan schedule and balance updated
      const updatedLoan = await Loan.findById(payrollLoan._id);
      expect(updatedLoan.remainingBalance).toBe(9000000);
      expect(updatedLoan.totalRepaid).toBe(1000000);
      expect(updatedLoan.repayments).toHaveLength(1);
      expect(updatedLoan.repayments[0].paymentMethod).toBe('payroll');

      const novInst = updatedLoan.schedule.find((s) => s.dueMonth === '2026-11');
      expect(novInst.status).toBe('deducted');
      expect(novInst.payslipId.toString()).toBe(payslip._id.toString());
    });
  });
});
