/**
 * @file payroll.cross-module-integration.test.js
 * @description Integration Tests verifying Module M9 (Payroll) cross-module bridges:
 *              1. M5 MonthLock enforcement & unlocking pre-conditions.
 *              2. M5 Attendance metrics persistence in Payslip attendanceSummary.
 *              3. M9 Archived run non-collision during fresh payroll generation.
 *              4. M5 Unexcused absence reconciliation into payroll deductions.
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
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { MonthLock } from '../src/models/monthLock.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { PayrollRun } from '../src/models/payrollRun.model.js';
import { Payslip } from '../src/models/payslip.model.js';
import { executeBatchPayrollCalculation } from '../src/modules/payroll/payrollProcessor.js';

dotenv.config();

describe('Module M9 — Cross-Module Integration & Bug Verification', { timeout: 60000 }, () => {
  let adminUser;
  let testDept;
  let testDesig;
  let testEmp;
  let testStructure;

  const testMonth = 10;
  const testYear = 2026;
  const yearMonth = '2026-10';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clean prior test artifacts
    await PayrollRun.deleteMany({ year: testYear, month: testMonth });
    await Payslip.deleteMany({ year: testYear, month: testMonth });
    await MonthLock.deleteMany({ yearMonth });
    await Attendance.deleteMany({ date: { $gte: new Date('2026-10-01'), $lte: new Date('2026-10-31') } });
    await User.deleteMany({ email: 'admin_cross_mod@test.hrm' });
    await Employee.deleteMany({ employeeCode: 'EMP-CROSS-MOD-01' });

    // Setup Admin User
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    adminUser = await User.create({
      name: 'Integration Admin',
      email: 'admin_cross_mod@test.hrm',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      roles: superAdminRole ? [superAdminRole._id] : []
    });

    testDept = await Department.findOne({ isDeleted: false }) || await Department.create({ name: 'Engineering', code: 'ENG' });
    testDesig = await Designation.findOne({ isDeleted: false }) || await Designation.create({ title: 'Staff Engineer', code: 'SE' });

    testEmp = await Employee.create({
      firstName: 'Integration',
      lastName: 'Tester',
      name: 'Integration Tester',
      employeeCode: 'EMP-CROSS-MOD-01',
      employeeId: 'EMP-CROSS-MOD-01',
      email: 'tester_cross_mod@test.hrm',
      departmentId: testDept._id,
      designationId: testDesig._id,
      cnic: '42101-9999999-1',
      paymentMethod: 'cash',
      employmentType: 'Permanent',
      status: 'Active',
      hireDate: new Date('2024-01-01')
    });

    // Create 100,000 PKR gross salary structure
    testStructure = await SalaryStructure.create({
      employeeId: testEmp._id,
      basicSalary: 6000000,
      houseRentAllowance: 2500000,
      medicalAllowance: 1000000,
      conveyanceAllowance: 500000,
      grossSalary: 10000000,
      effectiveFrom: new Date('2024-01-01'),
      status: 'active',
      isDeleted: false,
      createdBy: adminUser._id
    });
  }, 60000);

  afterAll(async () => {
    await PayrollRun.deleteMany({ year: testYear, month: testMonth });
    await Payslip.deleteMany({ year: testYear, month: testMonth });
    await MonthLock.deleteMany({ yearMonth });
    await Attendance.deleteMany({ employeeId: testEmp?._id });
    if (testStructure) await SalaryStructure.deleteOne({ _id: testStructure._id });
    if (testEmp) await Employee.deleteOne({ _id: testEmp._id });
    if (adminUser) await User.deleteOne({ _id: adminUser._id });
  }, 60000);

  it('Bug 1: executeBatchPayrollCalculation throws 422 if attendance month is unlocked', async () => {
    // Ensure no month lock exists
    await MonthLock.deleteOne({ yearMonth });

    await expect(
      executeBatchPayrollCalculation({ month: testMonth, year: testYear, actor: adminUser })
    ).rejects.toThrow(/must be locked before payroll generation/);
  });

  it('Bug 2 & 4: Records attendanceSummary and unexcused absence deductions when month is locked', async () => {
    // 1. Lock the month
    await MonthLock.create({
      yearMonth,
      isLocked: true,
      lockedAt: new Date(),
      lockedBy: adminUser._id,
      notes: 'Locked for integration test'
    });

    // 2. Seed attendance records: 20 present, 2 late, 1 unexcused absent, 1 with 120 mins overtime
    const attDate1 = new Date(Date.UTC(testYear, testMonth - 1, 5));
    const attDate2 = new Date(Date.UTC(testYear, testMonth - 1, 6));
    const attDate3 = new Date(Date.UTC(testYear, testMonth - 1, 7));

    await Attendance.create([
      {
        employeeId: testEmp._id,
        date: attDate1,
        status: 'present',
        overtimeApproved: true,
        overtimeMinutes: 120
      },
      {
        employeeId: testEmp._id,
        date: attDate2,
        status: 'late'
      },
      {
        employeeId: testEmp._id,
        date: attDate3,
        status: 'absent' // Unexcused absence
      }
    ]);

    // 3. Execute batch calculation
    const run = await executeBatchPayrollCalculation({ month: testMonth, year: testYear, actor: adminUser });
    expect(run).toBeDefined();
    expect(run.status).toBe('review');

    // 4. Inspect generated payslip
    const slip = await Payslip.findOne({ payrollRunId: run._id, employeeId: testEmp._id });
    expect(slip).toBeDefined();

    // Verify Bug 2: attendanceSummary populated
    expect(slip.attendanceSummary).toBeDefined();
    expect(slip.attendanceSummary.workingDays).toBe(30);
    expect(slip.attendanceSummary.presentDays).toBe(2); // 1 present + 1 late
    expect(slip.attendanceSummary.unpaidLeaves).toBe(1); // 1 unexcused absence
    expect(slip.attendanceSummary.overtimeHours).toBe(2); // 120 mins = 2 hrs

    // Verify Bug 4: Unexcused absence deduction line item created
    const absenceDeduction = slip.deductions.find(d => d.name.includes('Unexcused Absence'));
    expect(absenceDeduction).toBeDefined();
    expect(absenceDeduction.category).toBe('unpaid_leave');
    expect(absenceDeduction.amount).toBe(Math.round(10000000 / 30)); // 1 day of 100k gross
  });

  it('Bug 3: Re-generating payroll when prior run is soft-archived does not throw HTTP 409', async () => {
    // 1. Soft-archive the current run
    const currentRun = await PayrollRun.findOne({ month: testMonth, year: testYear, isDeleted: false });
    expect(currentRun).toBeDefined();
    currentRun.isDeleted = true;
    currentRun.status = 'paid';
    await currentRun.save();

    // Also mark its slip deleted
    await Payslip.updateMany({ payrollRunId: currentRun._id }, { isDeleted: true });

    // 2. Generate new payroll run for the same month/year
    const newRun = await executeBatchPayrollCalculation({ month: testMonth, year: testYear, actor: adminUser });
    expect(newRun).toBeDefined();
    expect(newRun.isDeleted).toBe(false);
    expect(newRun.status).toBe('review');
    expect(newRun._id.toString()).not.toBe(currentRun._id.toString());
  });
});

