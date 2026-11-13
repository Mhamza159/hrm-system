/**
 * @file leave.quota-sync.test.js
 * @description Automated vitest suite verifying dynamic leave quota synchronization,
 *              gender-constraint reconciliation, and policy update propagation across all roles.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Role } from '../src/models/role.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';
import { Leave } from '../src/models/leave.model.js';
import {
  createLeaveType,
  updateLeaveType,
  getEmployeeLeaveBalance,
  reconcileEmployeeLeaveBalance,
  syncAllEmployeesLeaveBalances,
  applyLeave
} from '../src/modules/leaves/leave.service.js';

dotenv.config();

describe('Module M6 — Dynamic Leave Quota Synchronization & Gender Reconciliation', () => {
  let maleEmpId;
  let femaleEmpId;
  let maleUser;
  let femaleUser;
  let annualType;
  let sickType;
  let maternityType;
  let paternityType;
  const currentYear = new Date().getUTCFullYear();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clean test data
    await LeaveType.deleteMany({ code: { $in: ['TEST_ANNUAL', 'TEST_SICK', 'TEST_MAT', 'TEST_PAT'] } });
    await User.deleteMany({ email: { $in: ['test_male_emp@test.hrm', 'test_female_emp@test.hrm'] } });
    await Employee.deleteMany({ employeeCode: { $in: ['TEST-EMP-MALE', 'TEST-EMP-FEMALE'] } });

    // 1. Create Leave Types
    annualType = await LeaveType.create({
      name: 'Test Annual',
      code: 'TEST_ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      genderConstraint: 'any',
      isActive: true
    });

    sickType = await LeaveType.create({
      name: 'Test Sick',
      code: 'TEST_SICK',
      daysPerYear: 8, // Initial 8 days
      isPaid: true,
      genderConstraint: 'any',
      isActive: true
    });

    maternityType = await LeaveType.create({
      name: 'Test Maternity',
      code: 'TEST_MAT',
      daysPerYear: 30, // Initial 30 days
      isPaid: true,
      genderConstraint: 'female',
      isActive: true
    });

    // 2. Create Male and Female Test Employees
    maleUser = await User.create({
      name: 'Test Male Employee',
      email: 'test_male_emp@test.hrm',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      status: 'active'
    });

    const maleEmp = await Employee.create({
      userId: maleUser._id,
      name: 'Test Male',
      employeeCode: 'TEST-EMP-MALE',
      firstName: 'Test',
      lastName: 'Male',
      email: maleUser.email,
      gender: 'Male',
      status: 'Active',
      isDeleted: false
    });
    maleEmpId = maleEmp._id;

    femaleUser = await User.create({
      name: 'Test Female Employee',
      email: 'test_female_emp@test.hrm',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      status: 'active'
    });

    const femaleEmp = await Employee.create({
      userId: femaleUser._id,
      name: 'Test Female',
      employeeCode: 'TEST-EMP-FEMALE',
      firstName: 'Test',
      lastName: 'Female',
      email: femaleUser.email,
      gender: 'Female',
      status: 'Active',
      isDeleted: false
    });
    femaleEmpId = femaleEmp._id;

    // Simulate stale pre-existing balances (e.g. Male employee had Maternity with 30 days)
    await LeaveBalance.create({
      employeeId: maleEmpId,
      year: currentYear,
      balances: [
        { leaveTypeId: annualType._id, allocatedDays: 14, carriedForwardDays: 0, usedDays: 0, pendingDays: 0, encashedDays: 0 },
        { leaveTypeId: sickType._id, allocatedDays: 8, carriedForwardDays: 0, usedDays: 0, pendingDays: 0, encashedDays: 0 },
        { leaveTypeId: maternityType._id, allocatedDays: 30, carriedForwardDays: 0, usedDays: 0, pendingDays: 0, encashedDays: 0 }
      ]
    });
  });

  afterAll(async () => {
    await LeaveType.deleteMany({ code: { $in: ['TEST_ANNUAL', 'TEST_SICK', 'TEST_MAT', 'TEST_PAT'] } });
    await LeaveBalance.deleteMany({ employeeId: { $in: [maleEmpId, femaleEmpId] } });
    await Leave.deleteMany({ employeeId: { $in: [maleEmpId, femaleEmpId] } });
    await User.deleteMany({ email: { $in: ['test_male_emp@test.hrm', 'test_female_emp@test.hrm'] } });
    await Employee.deleteMany({ employeeCode: { $in: ['TEST-EMP-MALE', 'TEST-EMP-FEMALE'] } });
  });

  it('1. Reconciles stale balances: updates policy days and prunes ineligible gender categories', async () => {
    // Before reconcile, male balance has Maternity (30) and Sick (8)
    const result = await getEmployeeLeaveBalance(maleEmpId, currentYear);
    expect(result).toBeDefined();

    // Ineligible Maternity should be pruned for male employee
    const matCat = result.balances.find((b) => String(b.leaveType._id) === String(maternityType._id));
    expect(matCat).toBeUndefined();

    // Annual and Sick should be present
    const annualCat = result.balances.find((b) => String(b.leaveType._id) === String(annualType._id));
    expect(annualCat).toBeDefined();
    expect(annualCat.allocatedDays).toBe(14);

    const sickCat = result.balances.find((b) => String(b.leaveType._id) === String(sickType._id));
    expect(sickCat).toBeDefined();
    expect(sickCat.allocatedDays).toBe(8);
  });

  it('2. Updating LeaveType daysPerYear propagates to employee balances immediately', async () => {
    // Admin updates Sick Leave from 8 to 10 days
    await updateLeaveType(sickType._id, { daysPerYear: 10 }, null);

    const updated = await getEmployeeLeaveBalance(maleEmpId, currentYear);
    const sickCat = updated.balances.find((b) => String(b.leaveType._id) === String(sickType._id));
    expect(sickCat).toBeDefined();
    expect(sickCat.allocatedDays).toBe(10);
    expect(sickCat.availableDays).toBe(10);
  });

  it('3. Creating a new LeaveType automatically provisions it to eligible employees', async () => {
    // Admin creates Paternity Leave (14 days, Male only)
    paternityType = await createLeaveType({
      name: 'Test Paternity',
      code: 'TEST_PAT',
      daysPerYear: 14,
      isPaid: true,
      genderConstraint: 'male',
      isActive: true
    }, null);

    // Male employee should now have Paternity provisioned
    const maleBalance = await getEmployeeLeaveBalance(maleEmpId, currentYear);
    const patCatMale = maleBalance.balances.find((b) => String(b.leaveType._id) === String(paternityType._id));
    expect(patCatMale).toBeDefined();
    expect(patCatMale.allocatedDays).toBe(14);
    expect(patCatMale.availableDays).toBe(14);

    // Female employee should NOT have Paternity provisioned, but SHOULD have Maternity
    const femaleBalance = await getEmployeeLeaveBalance(femaleEmpId, currentYear);
    const patCatFemale = femaleBalance.balances.find((b) => String(b.leaveType._id) === String(paternityType._id));
    expect(patCatFemale).toBeUndefined();

    const matCatFemale = femaleBalance.balances.find((b) => String(b.leaveType._id) === String(maternityType._id));
    expect(matCatFemale).toBeDefined();
  });

  it('4. Employee can apply for the newly added leave type without quota errors', async () => {
    // Next Monday date
    const nextMonday = new Date();
    nextMonday.setUTCDate(nextMonday.getUTCDate() + ((1 + 7 - nextMonday.getUTCDay()) % 7 || 7));
    const nextTuesday = new Date(nextMonday);
    nextTuesday.setUTCDate(nextTuesday.getUTCDate() + 1);

    const leave = await applyLeave(maleEmpId, {
      leaveTypeId: paternityType._id,
      startDate: nextMonday.toISOString().split('T')[0],
      endDate: nextTuesday.toISOString().split('T')[0],
      reason: 'Paternity leave application'
    }, maleUser);

    expect(leave).toBeDefined();
    expect(leave.days).toBe(2);

    // Verify pending days incremented
    const updatedMaleBalance = await getEmployeeLeaveBalance(maleEmpId, currentYear);
    const patCat = updatedMaleBalance.balances.find((b) => String(b.leaveType._id) === String(paternityType._id));
    expect(patCat.pendingDays).toBe(2);
    expect(patCat.availableDays).toBe(12); // 14 - 2 = 12
  });

  it('5. Applying for an ineligible gender category fails with validation error', async () => {
    const nextWed = new Date();
    nextWed.setUTCDate(nextWed.getUTCDate() + 14);

    await expect(
      applyLeave(maleEmpId, {
        leaveTypeId: maternityType._id,
        startDate: nextWed.toISOString().split('T')[0],
        endDate: nextWed.toISOString().split('T')[0],
        reason: 'Invalid gender application'
      }, maleUser)
    ).rejects.toThrow(/applicable to female employees/i);
  });
});
