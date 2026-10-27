/**
 * @file payroll.preaudit.test.js
 * @description Integration Tests for Pre-Payroll Audit & Readiness API.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { Leave } from '../src/models/leave.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { MonthLock } from '../src/models/monthLock.model.js';
import { PayrollService } from '../src/modules/payroll/payroll.service.js';

describe('Module M9 — Pre-Payroll Attendance & Leave Audit Console', () => {
  let adminToken, adminUser, testEmp;

  beforeAll(async () => {
    const testDbUri = 'mongodb://localhost:27017/hrm_test_payroll_preaudit';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await SalaryStructure.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await LeaveType.deleteMany({});
    await MonthLock.deleteMany({});

    const adminRole = await Role.create({
      name: 'Super Admin',
      description: 'System Administrator',
      isSystem: true,
      permissions: [
        { action: 'payroll.view', subject: 'Payroll', scope: 'all' },
        { action: 'payroll.run', subject: 'Payroll', scope: 'all' }
      ]
    });

    adminUser = await User.create({
      email: 'admin.preaudit@company.pk',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456789',
      roles: [adminRole._id],
      isActive: true,
      mustChangePassword: false
    });

    adminToken = jwt.sign(
      { userId: adminUser._id, roles: ['Super Admin'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    testEmp = await Employee.create({
      employeeCode: 'TEST-001',
      name: 'Audit Test Employee',
      status: 'Active',
      email: 'audit.emp@company.pk'
    });

    // Gross = 60,000 PKR (6,000,000 paisa), Basic = 36,000 PKR (3,600,000 paisa)
    await SalaryStructure.create({
      employeeId: testEmp._id,
      effectiveFrom: new Date('2026-01-01'),
      basicSalary: 3600000,
      houseRentAllowance: 1500000,
      medicalAllowance: 500000,
      conveyanceAllowance: 400000,
      otherAllowances: 0,
      grossSalary: 6000000,
      eobiEnabled: true,
      status: 'active'
    });

    // Seed 3 late attendances in July 2026 (Month 7)
    for (const d of [2, 9, 23]) {
      await Attendance.create({
        employeeId: testEmp._id,
        date: new Date(Date.UTC(2026, 6, d)),
        status: 'late',
        checkIn: new Date(Date.UTC(2026, 6, d, 9, 40)),
        workDurationMinutes: 480
      });
    }

    // Seed approved overtime in July 2026 (4 hours)
    await Attendance.create({
      employeeId: testEmp._id,
      date: new Date(Date.UTC(2026, 6, 27)),
      status: 'present',
      checkIn: new Date(Date.UTC(2026, 6, 27, 8, 55)),
      checkOut: new Date(Date.UTC(2026, 6, 27, 22, 0)),
      overtimeMinutes: 240, // 4 hrs
      overtimeApproved: true
    });

    // Seed MonthLock for 2026-07
    await MonthLock.create({
      yearMonth: '2026-07',
      isLocked: true,
      lockedBy: adminUser._id
    });
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
    } catch {
      // ignore
    }
    await mongoose.connection.close();
  });

  it('1. Computes pre-payroll audit factors accurately with itemized timelines', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/pre-audit?month=7&year=2026')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.month).toBe(7);
    expect(res.body.data.year).toBe(2026);
    expect(res.body.data.isMonthLocked).toBe(true);

    const empAudit = res.body.data.employees.find((e) => e.employeeCode === 'TEST-001');
    expect(empAudit).toBeDefined();

    // 3 lates -> 1 day penalty
    expect(empAudit.lateCount).toBe(3);
    expect(empAudit.latePenaltyDays).toBe(1);
    expect(empAudit.latePenaltyPaisa).toBe(200000); // 60,000 / 30 = 2,000 PKR = 200,000 paisa

    // 4 hours approved overtime
    expect(empAudit.overtimeHours).toBe(4);
    // ((36,000 / 30) / 8) * 1.5 * 4 = 900 PKR = 90,000 paisa
    expect(empAudit.overtimePayPaisa).toBe(90000);

    // Timeline arrays exist and are populated
    expect(empAudit.auditBreakdown.lates.length).toBe(3);
    expect(empAudit.auditBreakdown.approvedOvertime.length).toBe(1);
  });

  it('2. Flags isMonthLocked: false when month lock is missing', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/pre-audit?month=11&year=2026')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isMonthLocked).toBe(false);
  });
});
