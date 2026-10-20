/**
 * @file leave.balance-allocation.test.js
 * @description Unit & Integration Tests for Leave Quota Allocation & Yearly Rollover (BUILD-GUIDE Row 6.2).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import { User } from '../src/models/user.model.js';
import { Employee } from '../src/models/employee.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';
import {
  initializeEmployeeLeaveBalances,
  rolloverYearlyBalances,
  getEmployeeLeaveBalance
} from '../src/modules/leaves/leave.service.js';
import { env } from '../src/config/env.js';

describe('Module M6 — Leave Balance Allocation & Rollover (Slice 6.2-TEST)', () => {
  let annualTypeId;
  let casualTypeId;
  let testEmployeeId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_balances');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});

    // Create standard Leave Types
    const annualType = await LeaveType.create({
      name: 'Annual Leave',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      carryForwardMax: 5,
      isActive: true
    });
    annualTypeId = annualType._id;

    const casualType = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CASUAL',
      daysPerYear: 10,
      isPaid: true,
      carryForwardMax: 0, // No carry over
      isActive: true
    });
    casualTypeId = casualType._id;

    // Create test employee
    const emp = await Employee.create({
      employeeCode: 'EMP-9001',
      name: 'Test Balance Employee',
      email: 'balance.test@company.pk',
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });
    testEmployeeId = emp._id;
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await mongoose.disconnect();
  }, 30000);

  it('1. initializeEmployeeLeaveBalances creates balances for all active leave types', async () => {
    const balance = await initializeEmployeeLeaveBalances(testEmployeeId, 2025);
    expect(balance).toBeDefined();
    expect(balance.employeeId.toString()).toBe(testEmployeeId.toString());
    expect(balance.year).toBe(2025);
    expect(balance.balances.length).toBe(2);

    const annual = balance.balances.find((b) => b.leaveTypeId.toString() === annualTypeId.toString());
    expect(annual.allocatedDays).toBe(14);
    expect(annual.carriedForwardDays).toBe(0);
    expect(annual.usedDays).toBe(0);

    const casual = balance.balances.find((b) => b.leaveTypeId.toString() === casualTypeId.toString());
    expect(casual.allocatedDays).toBe(10);
  });

  it('2. Returns existing balance document on duplicate initialization without error', async () => {
    const duplicate = await initializeEmployeeLeaveBalances(testEmployeeId, 2025);
    expect(duplicate._id).toBeDefined();

    const count = await LeaveBalance.countDocuments({ employeeId: testEmployeeId, year: 2025 });
    expect(count).toBe(1);
  });

  it('3. Yearly rollover carries over unused days up to carryForwardMax and resets new quotas', async () => {
    // Simulate usage in 2025: employee used 4 annual days (10 unused) and 2 casual days (8 unused)
    await LeaveBalance.findOneAndUpdate(
      { employeeId: testEmployeeId, year: 2025 },
      {
        $set: {
          'balances.$[ann].usedDays': 4,
          'balances.$[cas].usedDays': 2
        }
      },
      {
        arrayFilters: [
          { 'ann.leaveTypeId': annualTypeId },
          { 'cas.leaveTypeId': casualTypeId }
        ]
      }
    );

    // Run rollover from 2025 to 2026
    const rolloverResult = await rolloverYearlyBalances(2025, 2026);
    expect(rolloverResult.employeesProcessed).toBeGreaterThanOrEqual(1);
    expect(rolloverResult.targetYear).toBe(2026);

    // Verify 2026 balance
    const balance2026 = await LeaveBalance.findOne({ employeeId: testEmployeeId, year: 2026 });
    expect(balance2026).toBeDefined();

    const annual2026 = balance2026.balances.find(
      (b) => b.leaveTypeId.toString() === annualTypeId.toString()
    );
    expect(annual2026.allocatedDays).toBe(14);
    // Unused was 10, max carry forward is 5 -> should carry exactly 5 days
    expect(annual2026.carriedForwardDays).toBe(5);
    expect(annual2026.usedDays).toBe(0);

    const casual2026 = balance2026.balances.find(
      (b) => b.leaveTypeId.toString() === casualTypeId.toString()
    );
    expect(casual2026.allocatedDays).toBe(10);
    // Casual carryForwardMax is 0 -> should carry 0
    expect(casual2026.carriedForwardDays).toBe(0);
  });

  it('4. getEmployeeLeaveBalance calculates live totalEntitlement and availableDays accurately', async () => {
    const summary = await getEmployeeLeaveBalance(testEmployeeId, 2026);
    expect(summary.employeeId.toString()).toBe(testEmployeeId.toString());
    expect(summary.year).toBe(2026);

    const annual = summary.balances.find((b) => b.leaveType._id.toString() === annualTypeId.toString());
    // 14 allocated + 5 carried = 19 entitlement, 0 used = 19 available
    expect(annual.totalEntitlement).toBe(19);
    expect(annual.availableDays).toBe(19);

    const casual = summary.balances.find((b) => b.leaveType._id.toString() === casualTypeId.toString());
    expect(casual.totalEntitlement).toBe(10);
    expect(casual.availableDays).toBe(10);
  });
});
