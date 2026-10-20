/**
 * @file leave.encashment.test.js
 * @description Integration Tests for Year-End Leave Encashment & M9 Payroll Engine (BUILD-GUIDE Row 6.13).
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
import { LeaveEncashment } from '../src/models/leaveEncashment.model.js';
import { initializeEmployeeLeaveBalances } from '../src/modules/leaves/leave.service.js';

describe('Module M6 — Year-End Leave Encashment Engine (Slice 6.13-TEST)', () => {
  let hrToken, employeeToken, unpaidTypeId, annualTypeId;
  let hrUser, employeeUser, employeeEmp;
  const currentYear = new Date().getUTCFullYear();

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_encashment');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await LeaveEncashment.deleteMany({});

    // Roles
    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.encash', subject: 'Leave', scope: 'all' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.encash', subject: 'Leave', scope: 'own' }
      ]
    });

    // Employee with 60,000 PKR basic salary (= 6,000,000 paisa)
    employeeEmp = await Employee.create({
      name: 'Encashment Applicant',
      employeeCode: 'EMP-ENC-01',
      workEmail: 'encash.applicant@example.com',
      basicSalaryPaisa: 6000000, // 60,000 PKR basic
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    // Users
    hrUser = await User.create({
      email: 'hr.encash@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      roles: [hrRole._id]
    });

    employeeUser = await User.create({
      email: 'encash.applicant@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      employeeId: employeeEmp._id,
      roles: [employeeRole._id]
    });

    employeeEmp.userId = employeeUser._id;
    await employeeEmp.save();

    const signToken = (u, empId) =>
      jwt.sign({ userId: u._id, employeeId: empId, email: u.email }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    hrToken = signToken(hrUser, null);
    employeeToken = signToken(employeeUser, employeeEmp._id);

    // Leave Types: Annual (Paid) & Unpaid
    const annualType = await LeaveType.create({
      name: 'Annual Paid Quota',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true,
      isActive: true
    });
    annualTypeId = annualType._id;

    const unpaidType = await LeaveType.create({
      name: 'Leave Without Pay',
      code: 'LWP',
      daysPerYear: 30,
      isPaid: false,
      isActive: true
    });
    unpaidTypeId = unpaidType._id;

    // Initialize 14 annual days
    await initializeEmployeeLeaveBalances(employeeEmp._id, currentYear);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 30000);

  it('1. should reject encashment request for unpaid leave types', async () => {
    const res = await request(app)
      .post('/api/v1/leaves/encash')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: unpaidTypeId,
        days: 5,
        year: currentYear
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only paid leave categories are eligible/i);
  });

  it('2. should reject encashment request when requested days exceed available unutilized quota', async () => {
    const res = await request(app)
      .post('/api/v1/leaves/encash')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: annualTypeId,
        days: 20, // Only 14 allocated
        year: currentYear
      });

    expect(res.status).toBe(400);
  });

  it('3. should successfully submit encashment request, compute daily rate & payout in integer paisa, and atomically reserve encashedDays', async () => {
    // 5 days encashment
    // Salary = 6,000,000 paisa (60,000 PKR) -> Daily rate = 6,000,000 / 30 = 200,000 paisa (2,000 PKR)
    // Total payout = 5 * 200,000 = 1,000,000 paisa (10,000 PKR)
    const res = await request(app)
      .post('/api/v1/leaves/encash')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: annualTypeId,
        days: 5,
        year: currentYear,
        remarks: 'Year-end financial encashment'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.days).toBe(5);
    expect(res.body.data.dailyRatePaisa).toBe(200000);
    expect(res.body.data.totalAmountPaisa).toBe(1000000);
    expect(res.body.data.status).toBe('pending');

    // Verify atomic update in LeaveBalance
    const balDoc = await LeaveBalance.findOne({ employeeId: employeeEmp._id, year: currentYear });
    const cat = balDoc.balances.find((b) => b.leaveTypeId.toString() === annualTypeId.toString());
    expect(cat.encashedDays).toBe(5);
  });

  it('4. should allow HR Manager to approve encashment request', async () => {
    const pending = await LeaveEncashment.findOne({ employeeId: employeeEmp._id, status: 'pending' });
    expect(pending).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/leaves/encash/${pending._id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ action: 'approve' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
  });

  it('5. should restore encashedDays in LeaveBalance when HR Manager rejects encashment', async () => {
    // Create another pending request for 2 days
    const reqRes = await request(app)
      .post('/api/v1/leaves/encash')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: annualTypeId,
        days: 2,
        year: currentYear,
        remarks: 'Second request'
      });

    expect(reqRes.status).toBe(201);
    const encashmentId = reqRes.body.data._id;

    // Balance should have encashedDays = 5 + 2 = 7
    let balDoc = await LeaveBalance.findOne({ employeeId: employeeEmp._id, year: currentYear });
    let cat = balDoc.balances.find((b) => b.leaveTypeId.toString() === annualTypeId.toString());
    expect(cat.encashedDays).toBe(7);

    // HR Rejection
    const rejectRes = await request(app)
      .patch(`/api/v1/leaves/encash/${encashmentId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ action: 'reject', rejectionReason: 'Corporate budget freeze' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('rejected');

    // Balance should revert: encashedDays = 7 - 2 = 5
    balDoc = await LeaveBalance.findOne({ employeeId: employeeEmp._id, year: currentYear });
    cat = balDoc.balances.find((b) => b.leaveTypeId.toString() === annualTypeId.toString());
    expect(cat.encashedDays).toBe(5);
  });
});
