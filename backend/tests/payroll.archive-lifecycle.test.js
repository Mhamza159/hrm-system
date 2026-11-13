/**
 * @file payroll.archive-lifecycle.test.js
 * @description Integration Tests for Payroll Run Archive Bucket, Soft-Deletion, Revert,
 *              Duplicate Conflict Prevention, Permanent Delete, and Deep Data Population.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · User Stories 1, 2, 3, 4, 5)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { PayrollRun } from '../src/models/payrollRun.model.js';
import { Payslip } from '../src/models/payslip.model.js';
import { PayrollService } from '../src/modules/payroll/payroll.service.js';

dotenv.config();

describe('Module M9 — Payroll Archive Lifecycle & Deep Population (US1 - US5)', { timeout: 30000 }, () => {
  let adminUser;
  let regularUser;
  let testDept;
  let testDesig;
  let testEmp;
  let testRun;
  let testSlip;

  const testMonth = 11;
  const testYear = 2026;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Drop legacy non-partial index if present and sync partial unique index
    try {
      await PayrollRun.collection.dropIndex('month_1_year_1');
    } catch (e) {
      // index may not exist or already be partial
    }
    await PayrollRun.syncIndexes();

    // Clean any prior test artifacts
    await PayrollRun.deleteMany({ year: testYear, month: { $in: [testMonth, 12] } });
    await Payslip.deleteMany({ year: testYear, month: { $in: [testMonth, 12] } });
    await User.deleteMany({ email: { $in: ['admin_payroll_arc@test.hrm', 'emp_payroll_arc@test.hrm'] } });
    await Employee.deleteMany({ employeeCode: { $in: ['EMP-TEST-PAY-ARC'] } });

    // Setup Admin Role & User
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const adminDoc = await User.create({
      name: 'Super Admin Actor',
      email: 'admin_payroll_arc@test.hrm',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      roles: superAdminRole ? [superAdminRole._id] : []
    });
    adminUser = await User.findById(adminDoc._id).populate('roles').lean();
    adminUser.role = 'Super Admin';

    // Setup Department & Designation
    testDept = await Department.findOne({ isDeleted: false }) || await Department.create({ name: 'Engineering & Tech', code: 'ENG' });
    testDesig = await Designation.findOne({ isDeleted: false }) || await Designation.create({ title: 'Lead Software Engineer', code: 'LSE' });

    // Setup Employee
    testEmp = await Employee.create({
      firstName: 'Hamza',
      lastName: 'Hakim',
      name: 'Hamza Hakim',
      employeeCode: 'EMP-TEST-PAY-ARC',
      employeeId: 'EMP-TEST-PAY-ARC',
      email: 'emp_payroll_arc@test.hrm',
      departmentId: testDept._id,
      designationId: testDesig._id,
      cnic: '42101-1234567-1',
      paymentMethod: 'cash',
      bankDetails: {
        bankName: 'Cash Disbursement',
        accountTitle: 'Hamza Hakim',
        accountNumber: ''
      },
      employmentType: 'Permanent',
      status: 'Active',
      hireDate: new Date('2024-01-01')
    });

    const empRole = await Role.findOne({ name: 'Employee' });
    const regUserDoc = await User.create({
      name: 'Hamza Hakim',
      email: 'emp_payroll_arc@test.hrm',
      employeeId: testEmp._id,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      roles: empRole ? [empRole._id] : []
    });
    regularUser = await User.findById(regUserDoc._id).populate('roles').lean();

    // Create Initial Payroll Run & Child Payslip
    testRun = await PayrollRun.create({
      month: testMonth,
      year: testYear,
      cycleStartDate: new Date(Date.UTC(testYear, testMonth - 1, 1)),
      cycleEndDate: new Date(Date.UTC(testYear, testMonth, 0)),
      payDate: new Date(Date.UTC(testYear, testMonth - 1, 30)),
      status: 'draft',
      paymentMethod: 'cash',
      totalEmployees: 1,
      totalGrossPay: 10000000,
      totalNetPay: 9750000,
      totalTaxWithheld: 250000,
      generatedBy: adminUser._id
    });

    testSlip = await Payslip.create({
      payrollRunId: testRun._id,
      employeeId: testEmp._id,
      month: testMonth,
      year: testYear,
      grossPay: 10000000,
      totalDeductions: 250000,
      netPay: 9750000,
      taxWithheld: 250000,
      paymentMethod: 'cash',
      bankName: 'Cash Disbursement',
      status: 'approved',
      earnings: [
        { name: 'Basic Salary', category: 'basic', amount: 8000000 },
        { name: 'House Rent', category: 'house_rent', amount: 2000000 }
      ],
      deductions: [
        { name: 'Income Tax', category: 'tax', amount: 250000 }
      ]
    });
  });

  afterAll(async () => {
    await PayrollRun.deleteMany({ year: testYear, month: { $in: [testMonth, 12] } });
    await Payslip.deleteMany({ year: testYear, month: { $in: [testMonth, 12] } });
    await User.deleteMany({ email: { $in: ['admin_payroll_arc@test.hrm', 'emp_payroll_arc@test.hrm'] } });
    await Employee.deleteMany({ employeeCode: { $in: ['EMP-TEST-PAY-ARC'] } });
  });

  it('Test 1: Deep employee population returns non-null name, code, designation, department, and default cash', async () => {
    const runResult = await PayrollService.getPayrollRunById(testRun._id);
    expect(runResult.payslips.length).toBeGreaterThan(0);

    const slip = runResult.payslips[0];
    const emp = slip.employeeId;

    expect(emp).toBeDefined();
    expect(emp.name).toBe('Hamza Hakim');
    expect(emp.employeeCode).toBe('EMP-TEST-PAY-ARC');
    expect(emp.designationId?.title).toBe(testDesig.title);
    expect(emp.departmentId?.name).toBe(testDept.name);
    expect(slip.paymentMethod).toBe('cash');
  });

  it('Test 2: Self-service getMyPayslips populates full employee metadata and filters out archived slips', async () => {
    const myPayslips = await PayrollService.getMyPayslips(regularUser);
    expect(myPayslips.docs.length).toBeGreaterThan(0);

    const mySlip = myPayslips.docs[0];
    expect(mySlip.employeeId?.name).toBe('Hamza Hakim');
    expect(mySlip.employeeId?.designationId?.title).toBe(testDesig.title);
    expect(mySlip.employeeId?.departmentId?.name).toBe(testDept.name);
    expect(mySlip.payrollRunId?.paymentMethod).toBe('cash');
  });

  it('Test 3: Soft-archive moves run and child payslips to isDeleted: true', async () => {
    const archiveResult = await PayrollService.deletePayrollRun(testRun._id, adminUser);
    expect(archiveResult.message).toContain('moved to Archive');

    const runInDb = await PayrollRun.findById(testRun._id);
    expect(runInDb.isDeleted).toBe(true);
    expect(runInDb.deletedAt).toBeDefined();

    const slipInDb = await Payslip.findById(testSlip._id);
    expect(slipInDb.isDeleted).toBe(true);

    // Verify self-service no longer sees archived slip
    const myPayslips = await PayrollService.getMyPayslips(regularUser);
    const hasArchivedSlip = myPayslips.docs.some((s) => s._id.toString() === testSlip._id.toString());
    expect(hasArchivedSlip).toBe(false);
  });

  it('Test 4: Revert restores isDeleted: false for run and child payslips', async () => {
    const restoredRun = await PayrollService.restorePayrollRun(testRun._id, adminUser);
    expect(restoredRun.isDeleted).toBe(false);
    expect(restoredRun.deletedAt).toBeNull();

    const slipInDb = await Payslip.findById(testSlip._id);
    expect(slipInDb.isDeleted).toBe(false);

    // Self-service can view it again
    const myPayslips = await PayrollService.getMyPayslips(regularUser);
    const hasRestoredSlip = myPayslips.docs.some((s) => s._id.toString() === testSlip._id.toString());
    expect(hasRestoredSlip).toBe(true);
  });

  it('Test 5: Revert rejects duplicate active month/year run with HTTP 409 Conflict', async () => {
    // 1. Archive the run again
    await PayrollService.deletePayrollRun(testRun._id, adminUser);

    // 2. Create another active run for the same month/year
    const duplicateActiveRun = await PayrollRun.create({
      month: testMonth,
      year: testYear,
      cycleStartDate: new Date(Date.UTC(testYear, testMonth - 1, 1)),
      cycleEndDate: new Date(Date.UTC(testYear, testMonth, 0)),
      payDate: new Date(Date.UTC(testYear, testMonth - 1, 30)),
      status: 'draft',
      generatedBy: adminUser._id
    });

    // 3. Attempting to restore the archived run must throw 409 Conflict
    await expect(
      PayrollService.restorePayrollRun(testRun._id, adminUser)
    ).rejects.toThrow(/already exists/i);

    // Clean up duplicate run
    await duplicateActiveRun.deleteOne();
  });

  it('Test 6: Permanent delete purges run and child payslips from database (Super Admin only)', async () => {
    // Regular employee cannot permanent delete
    await expect(
      PayrollService.permanentDeletePayrollRun(testRun._id, regularUser)
    ).rejects.toThrow(/restricted to Super Admin/i);

    // Super Admin permanent delete
    const result = await PayrollService.permanentDeletePayrollRun(testRun._id, adminUser);
    expect(result.message).toContain('permanently deleted');

    const runInDb = await PayrollRun.findById(testRun._id);
    expect(runInDb).toBeNull();

    const slipInDb = await Payslip.findById(testSlip._id);
    expect(slipInDb).toBeNull();
  });
});
