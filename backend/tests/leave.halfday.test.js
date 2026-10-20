/**
 * @file leave.halfday.test.js
 * @description Integration Tests for Half-Day Leave Application & Single-Date Constraints (BUILD-GUIDE Row 6.4).
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
import { LeaveType } from '../src/models/leaveType.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';
import { Leave } from '../src/models/leave.model.js';
import { initializeEmployeeLeaveBalances } from '../src/modules/leaves/leave.service.js';

describe('Module M6 — Half-Day Leave Support (Slice 6.4-TEST)', () => {
  let employeeToken, employeeId, casualTypeId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_halfday');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard staff',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    const casualType = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CASUAL',
      daysPerYear: 10,
      isPaid: true,
      carryForwardMax: 0,
      isActive: true
    });
    casualTypeId = casualType._id;

    const emp = await Employee.create({
      employeeCode: 'EMP-HD-01',
      name: 'Farhan Ali',
      email: 'farhan.hd@company.pk',
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });
    employeeId = emp._id;

    await initializeEmployeeLeaveBalances(employeeId, 2026);

    const empUser = await User.create({
      name: 'Farhan User',
      email: 'farhan.user@company.pk',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId,
      roles: [employeeRole._id]
    });

    employeeToken = jwt.sign(
      { userId: empUser._id, employeeId, roles: [employeeRole] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await mongoose.disconnect();
  }, 30000);

  it('1. Half-day leave on a single calendar day succeeds with 0.5 days deduction (201 Created)', async () => {
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: casualTypeId.toString(),
        startDate: '2026-06-10',
        endDate: '2026-06-10',
        halfDay: 'second_half',
        reason: 'Personal work in afternoon'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.days).toBe(0.5);
    expect(res.body.data.halfDay).toBe('second_half');

    const balance = await LeaveBalance.findOne({ employeeId, year: 2026 });
    const casual = balance.balances.find((b) => b.leaveTypeId.toString() === casualTypeId.toString());
    expect(casual.pendingDays).toBe(0.5);
  });

  it('2. Half-day leave spanning multiple calendar days is rejected with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: casualTypeId.toString(),
        startDate: '2026-06-11',
        endDate: '2026-06-12',
        halfDay: 'first_half',
        reason: 'Invalid multi-day half-day request'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/single calendar day/i);
  });

  it('3. Consecutive half-day on next working day succeeds and accumulates pendingDays to 1.0', async () => {
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: casualTypeId.toString(),
        startDate: '2026-06-11',
        endDate: '2026-06-11',
        halfDay: 'first_half',
        reason: 'Morning routine on Thursday'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.days).toBe(0.5);

    const balance = await LeaveBalance.findOne({ employeeId, year: 2026 });
    const casual = balance.balances.find((b) => b.leaveTypeId.toString() === casualTypeId.toString());
    expect(casual.pendingDays).toBe(1.0);
  });
});
