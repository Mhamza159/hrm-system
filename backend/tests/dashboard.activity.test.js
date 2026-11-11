import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Leave } from '../src/models/leave.model.js';
import { getRecentActivity, formatActionLabel } from '../src/modules/dashboard/dashboard.activity.js';

const oid = () => new mongoose.Types.ObjectId();

describe('Dashboard recent activity', () => {
  // Raw collection inserts: only the fields the service reads are needed, so skip model validation.
  const mU = oid(), sU = oid(), xU = oid(), hU = oid();
  const mE = oid(), sE = oid(), xE = oid(), L1 = oid(), L2 = oid();
  const team = { teamEmployeeIds: [mE, sE], teamUserIds: [mU, sU] };

  beforeAll(async () => {
    await mongoose.connect(env.MONGO_URI.replace('hrm_development', 'hrm_test_dash_activity'));
    await Employee.collection.deleteMany({});
    await Leave.collection.deleteMany({});
    await Employee.collection.insertMany([
      { _id: mE, userId: mU, name: 'Manny Manager', employeeCode: 'E1' },
      { _id: sE, userId: sU, name: 'Sam Staff', employeeCode: 'E2' },
      { _id: xE, userId: xU, name: 'Xavier Other', employeeCode: 'E3' },
    ]);
    await Leave.collection.insertMany([{ _id: L1, employeeId: sE }, { _id: L2, employeeId: xE }]);
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });
  beforeEach(async () => {
    await AuditLog.deleteMany({});
  });

  it('shows a team member leave approved by HR (target-owner rule)', async () => {
    await AuditLog.create({ actorId: hU, action: 'LEAVE_APPROVED', module: 'leave', targetModel: 'Leave', targetId: L1 });
    const items = await getRecentActivity({ team });
    expect(items.map((i) => i.action)).toContain('LEAVE_APPROVED');
  });

  it('hides another department entry', async () => {
    await AuditLog.create({ actorId: hU, action: 'LEAVE_REJECTED', module: 'leave', targetModel: 'Leave', targetId: L2 });
    const items = await getRecentActivity({ team });
    expect(items.find((i) => i.action === 'LEAVE_REJECTED')).toBeUndefined();
  });

  it.each(['payslip', 'salarystructure', 'employee', 'loan', 'payrollrun'])(
    'never shows %s to a manager even for a team member', async (module) => {
      await AuditLog.create({ actorId: sU, action: `${module.toUpperCase()}_X`, module, targetId: sE });
      const items = await getRecentActivity({ team });
      expect(items.find((i) => i.module === module)).toBeUndefined();
    });

  it('company-wide feed excludes auth and includes payroll', async () => {
    await AuditLog.create({ action: 'USER_LOGIN', module: 'AUTH' });
    await AuditLog.create({ actorId: hU, action: 'PAYROLL_RUN_APPROVED', module: 'payrollrun' });
    const items = await getRecentActivity();
    expect(items.some((i) => i.module.toLowerCase() === 'auth')).toBe(false);
    expect(items.some((i) => i.module === 'payrollrun')).toBe(true);
  });

  it('null actor shows as System', async () => {
    await AuditLog.create({ actorId: null, action: 'LEAVE_AUTO_LAPSED', module: 'leave', targetModel: 'Leave', targetId: L1 });
    const items = await getRecentActivity();
    expect(items.find((i) => i.action === 'LEAVE_AUTO_LAPSED').actorName).toBe('System');
  });

  it('resolves actor name from Employee, falling back to actorEmail', async () => {
    await AuditLog.create({ actorId: sU, action: 'LEAVE_APPLY', module: 'leave' });
    await AuditLog.create({ actorId: hU, actorEmail: 'hr@x.com', action: 'LEAVE_APPROVED', module: 'leave' });
    const items = await getRecentActivity();
    expect(items.find((i) => i.action === 'LEAVE_APPLY').actorName).toBe('Sam Staff');
    expect(items.find((i) => i.action === 'LEAVE_APPROVED').actorName).toBe('hr@x.com');
  });

  it('deleted target falls back to actor rule without throwing', async () => {
    await AuditLog.create({ actorId: sU, action: 'EXPENSE_SUBMITTED', module: 'expense', targetModel: 'Expense', targetId: oid() });
    const items = await getRecentActivity({ team });
    expect(items.map((i) => i.action)).toContain('EXPENSE_SUBMITTED');
  });

  it('caps at limit and sorts newest first', async () => {
    const base = Date.now();
    await AuditLog.insertMany(Array.from({ length: 10 }, (_, i) => ({
      actorId: hU, action: `LEAVE_APPLY`, module: 'leave', details: { i }, createdAt: new Date(base + i * 1000),
    })));
    const items = await getRecentActivity({ limit: 8 });
    expect(items).toHaveLength(8);
    const times = items.map((i) => new Date(i.createdAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
    const scoped = await getRecentActivity({ team: { teamEmployeeIds: [], teamUserIds: [hU] }, limit: 8 });
    expect(scoped).toHaveLength(8);
  });

  it('formatActionLabel falls back to title case', () => {
    expect(formatActionLabel('SOME_NEW_THING')).toBe('Some New Thing');
  });
});
