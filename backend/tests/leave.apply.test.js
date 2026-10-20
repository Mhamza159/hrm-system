/**
 * @file leave.apply.test.js
 * @description Integration Tests for Leave Application, Working Day Math, and Conflict Engine (BUILD-GUIDE Row 6.3).
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
import { Holiday } from '../src/models/holiday.model.js';
import { initializeEmployeeLeaveBalances } from '../src/modules/leaves/leave.service.js';

describe('Module M6 — Leave Application & Working Days Validation (Slice 6.3-TEST)', () => {
  let employeeToken, employeeId, annualTypeId, casualTypeId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_apply');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Holiday.deleteMany({});

    // Roles
    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard staff',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' }
      ]
    });

    // Leave Types
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
      carryForwardMax: 0,
      isActive: true
    });
    casualTypeId = casualType._id;

    // Public Holiday: Friday, 2026-05-01 (Labour Day)
    await Holiday.create({
      name: 'Labour Day',
      date: new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0)),
      year: 2026,
      type: 'gazetted',
      isActive: true
    });

    // Employee
    const emp = await Employee.create({
      employeeCode: 'EMP-APP-01',
      name: 'Zahid Khan',
      email: 'zahid.app@company.pk',
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });
    employeeId = emp._id;

    // Initialize 2026 Leave Balances (14 annual, 10 casual)
    await initializeEmployeeLeaveBalances(employeeId, 2026);

    // User
    const empUser = await User.create({
      name: 'Zahid User',
      email: 'zahid.user@company.pk',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId,
      roles: [employeeRole._id]
    });

    employeeToken = jwt.sign(
      { userId: empUser._id, employeeId, roles: [employeeRole] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Holiday.deleteMany({});
    await mongoose.disconnect();
  });

  it('1. Net deductible days calculation excludes weekend and gazetted holiday (201 Created)', async () => {
    // Dates: Thursday 2026-04-30 to Monday 2026-05-04
    // Thursday (April 30): Working Day (1 day)
    // Friday (May 1): Labour Day Gazetted Holiday (0 days)
    // Saturday (May 2): Weekend (0 days)
    // Sunday (May 3): Weekend (0 days)
    // Monday (May 4): Working Day (1 day)
    // Total deductible days should be exactly 2.0 days!
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: annualTypeId.toString(),
        startDate: '2026-04-30',
        endDate: '2026-05-04',
        halfDay: 'none',
        reason: 'Family event and rest'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.days).toBe(2);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.approvalChain.length).toBeGreaterThanOrEqual(1);

    // Verify pendingDays in LeaveBalance was atomically incremented by 2
    const balance = await LeaveBalance.findOne({ employeeId, year: 2026 });
    const annual = balance.balances.find((b) => b.leaveTypeId.toString() === annualTypeId.toString());
    expect(annual.pendingDays).toBe(2);
  });

  it('2. Half-day leave application deducts exactly 0.5 days', async () => {
    // Tuesday 2026-05-05 (first_half)
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: casualTypeId.toString(),
        startDate: '2026-05-05',
        endDate: '2026-05-05',
        halfDay: 'first_half',
        reason: 'Urgent doctor appointment in morning'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.days).toBe(0.5);
    expect(res.body.data.halfDay).toBe('first_half');

    const balance = await LeaveBalance.findOne({ employeeId, year: 2026 });
    const casual = balance.balances.find((b) => b.leaveTypeId.toString() === casualTypeId.toString());
    expect(casual.pendingDays).toBe(0.5);
  });

  it('3. Overlapping date range is rejected with 409 Conflict', async () => {
    // Attempting to apply again on 2026-05-04 (already part of leave 1)
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: casualTypeId.toString(),
        startDate: '2026-05-04',
        endDate: '2026-05-06',
        reason: 'Conflicting request'
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/overlapping/i);
  });

  it('4. Insufficient quota is rejected with 400 Bad Request without modifying pendingDays', async () => {
    // Annual leave available: 14 allocated - 2 pending = 12 available.
    // Requesting 15 working days (e.g. from June 1 to June 19, 15 weekdays)
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: annualTypeId.toString(),
        startDate: '2026-06-01',
        endDate: '2026-06-19',
        reason: 'Long summer holiday exceeding remaining quota'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient leave balance/i);

    // Verify annual pendingDays is still 2
    const balance = await LeaveBalance.findOne({ employeeId, year: 2026 });
    const annual = balance.balances.find((b) => b.leaveTypeId.toString() === annualTypeId.toString());
    expect(annual.pendingDays).toBe(2);
  });

  it('5. GET /api/v1/leaves/my returns authenticated employee\'s leaves list', async () => {
    const res = await request(app)
      .get('/api/v1/leaves/my?year=2026')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
  });
});
