/**
 * @file leave.archive-lifecycle.test.js
 * @description Vitest test suite for Leave Types Archive Bucket & Lifecycle Management
 *              (Move to Archive, Revert, Duplicate Code Conflict, Blocked Permanent Delete, Clean Permanent Delete).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Employee } from '../src/models/employee.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';
import { Leave } from '../src/models/leave.model.js';
import { Role } from '../src/models/role.model.js';
import {
  createLeaveType,
  getLeaveTypes,
  deleteLeaveType,
  restoreLeaveType,
  permanentDeleteLeaveType,
  getEmployeeLeaveBalance
} from '../src/modules/leaves/leave.service.js';

dotenv.config();

describe('Module M6 — Leave Types Archive Bucket & Lifecycle Management', () => {
  let adminUser;
  let regularUser;
  let testEmpId;
  let activeCat;
  let archiveCandidate;
  const currentYear = new Date().getUTCFullYear();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clean any previous test records
    await LeaveType.deleteMany({ code: { $in: ['TEST_ARC_1', 'TEST_ARC_2', 'TEST_ARC_DUP'] } });
    await User.deleteMany({ email: { $in: ['admin_arc@test.hrm', 'employee_arc@test.hrm'] } });
    await Employee.deleteMany({ employeeCode: { $in: ['EMP-TEST-ARC'] } });

    // 1. Setup Admin User
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const adminDoc = await User.create({
      name: 'Archive Admin',
      email: 'admin_arc@test.hrm',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      roles: superAdminRole ? [superAdminRole._id] : []
    });
    adminUser = await User.findById(adminDoc._id).populate('roles').lean();
    adminUser.role = 'Super Admin';

    // 2. Setup Regular Employee User & Profile
    const empRole = await Role.findOne({ name: 'Employee' });
    const empDoc = await User.create({
      name: 'Regular Staff',
      email: 'employee_arc@test.hrm',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      roles: empRole ? [empRole._id] : []
    });
    regularUser = await User.findById(empDoc._id).populate('roles').lean();
    regularUser.role = 'Employee';

    const emp = await Employee.create({
      userId: regularUser._id,
      employeeCode: 'EMP-TEST-ARC',
      name: 'Regular Staff',
      firstName: 'Regular',
      lastName: 'Staff',
      email: 'employee_arc@test.hrm',
      gender: 'Male',
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });
    testEmpId = emp._id;
    await User.findByIdAndUpdate(empDoc._id, { employeeId: emp._id });
    regularUser.employeeId = emp._id;

    // 3. Create test leave types
    archiveCandidate = await createLeaveType({
      name: 'Archived Seasonal Category',
      code: 'TEST_ARC_1',
      daysPerYear: 7,
      isPaid: true
    }, adminUser);

    activeCat = await createLeaveType({
      name: 'Active Permanent Category',
      code: 'TEST_ARC_2',
      daysPerYear: 10,
      isPaid: true
    }, adminUser);
  });

  afterAll(async () => {
    await LeaveType.deleteMany({ code: { $in: ['TEST_ARC_1', 'TEST_ARC_2', 'TEST_ARC_DUP'] } });
    await User.deleteMany({ email: { $in: ['admin_arc@test.hrm', 'employee_arc@test.hrm'] } });
    await Employee.deleteMany({ employeeCode: { $in: ['EMP-TEST-ARC'] } });
    await LeaveBalance.deleteMany({ employeeId: testEmpId });
  });

  it('1. Soft-archive: Moving an active category to archive sets isArchived: true, isActive: false and prunes from active quota', async () => {
    const archived = await deleteLeaveType(archiveCandidate._id, adminUser);

    expect(archived.isArchived).toBe(true);
    expect(archived.isActive).toBe(false);
    expect(archived.archivedAt).toBeDefined();

    // Verify it appears when querying archived=true
    const archivedList = await getLeaveTypes({ archived: 'true' }, adminUser);
    expect(archivedList.some(c => String(c._id) === String(archiveCandidate._id))).toBe(true);

    // Verify it is excluded when querying activeOnly=true
    const activeList = await getLeaveTypes({ activeOnly: 'true' }, adminUser);
    expect(activeList.some(c => String(c._id) === String(archiveCandidate._id))).toBe(false);

    // Verify regular employee balance does NOT list the archived category
    const balanceDoc = await getEmployeeLeaveBalance(testEmpId, currentYear);
    const hasCategory = balanceDoc.balances.some(b => String(b.leaveType?._id || b.leaveType) === String(archiveCandidate._id));
    expect(hasCategory).toBe(false);
  });

  it('2. Regular employee queries strictly exclude archived categories', async () => {
    const employeeList = await getLeaveTypes({}, regularUser);
    expect(employeeList.some(c => c.isArchived === true)).toBe(false);
    expect(employeeList.some(c => String(c._id) === String(archiveCandidate._id))).toBe(false);
  });

  it('3. Reverting an archived category restores isActive: true, isArchived: false and restores employee balances', async () => {
    const restored = await restoreLeaveType(archiveCandidate._id, adminUser);

    expect(restored.isArchived).toBe(false);
    expect(restored.isActive).toBe(true);
    expect(restored.archivedAt).toBeNull();

    // Verify employee balance receives the restored category again
    const balanceDoc = await getEmployeeLeaveBalance(testEmpId, currentYear);
    const restoredBal = balanceDoc.balances.find(b => String(b.leaveType?._id || b.leaveType) === String(archiveCandidate._id));
    expect(restoredBal).toBeDefined();
    expect(restoredBal.allocatedDays).toBe(7);
  });

  it('4. Reverting rejects with HTTP 400 if category is already active and not archived', async () => {
    // archiveCandidate is currently restored and active
    await expect(restoreLeaveType(archiveCandidate._id, adminUser)).rejects.toThrow(/Leave category is already active and not archived/);
  });

  it('5. Permanent deletion is rejected with 409 Conflict if active or approved leave applications exist', async () => {
    // Re-archive archiveCandidate to attempt permanent deletion
    await deleteLeaveType(archiveCandidate._id, adminUser);

    // Create an approved leave linked to archiveCandidate
    const activeLeave = await Leave.create({
      employeeId: testEmpId,
      leaveTypeId: archiveCandidate._id,
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-02'),
      days: 2,
      halfDay: 'none',
      reason: 'Medical procedure',
      status: 'approved',
      approvalChain: [{ step: 1, approverRole: 'Super Admin', status: 'approved' }]
    });

    // Attempting permanent deletion must be rejected
    await expect(permanentDeleteLeaveType(archiveCandidate._id, adminUser)).rejects.toThrow(/Cannot permanently delete/);

    // Clean up test leave
    await Leave.findByIdAndDelete(activeLeave._id);
  });

  it('6. Permanent deletion succeeds when zero active leaves exist and cleanly prunes LeaveBalance documents', async () => {
    const result = await permanentDeleteLeaveType(archiveCandidate._id, adminUser);

    expect(result._id).toBeDefined();

    // Verify document is completely removed from LeaveType
    const deletedDoc = await LeaveType.findById(archiveCandidate._id);
    expect(deletedDoc).toBeNull();

    // Verify pruned from employee LeaveBalance
    const balanceDoc = await LeaveBalance.findOne({ employeeId: testEmpId, year: currentYear });
    const hasCategory = balanceDoc.balances.some(b => String(b.leaveTypeId) === String(archiveCandidate._id));
    expect(hasCategory).toBe(false);
  });
});
