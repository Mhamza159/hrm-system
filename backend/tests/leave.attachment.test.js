/**
 * @file leave.attachment.test.js
 * @description Integration Tests for Medical Proof Attachment & Validation (BUILD-GUIDE Row 6.5).
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

describe('Module M6 — Sick Leave Medical Certificate Proof (Slice 6.5-TEST)', () => {
  let employeeToken, employeeId, sickTypeId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_attachment');
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

    // Sick leave requiring attachment for >= 2 days
    const sickType = await LeaveType.create({
      name: 'Sick Leave',
      code: 'SICK',
      daysPerYear: 8,
      isPaid: true,
      requiresAttachment: true,
      minDaysForAttachment: 2,
      carryForwardMax: 0,
      isActive: true
    });
    sickTypeId = sickType._id;

    const emp = await Employee.create({
      employeeCode: 'EMP-SICK-01',
      name: 'Usman Ghani',
      email: 'usman.sick@company.pk',
      joiningDate: new Date('2025-01-01'),
      status: 'Active'
    });
    employeeId = emp._id;

    await initializeEmployeeLeaveBalances(employeeId, 2026);

    const empUser = await User.create({
      name: 'Usman User',
      email: 'usman.user@company.pk',
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
    await mongoose.disconnect();
  });

  it('1. Sick leave under minDaysForAttachment (1 day) does not require attachment (201 Created)', async () => {
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: sickTypeId.toString(),
        startDate: '2026-07-01',
        endDate: '2026-07-01',
        reason: 'Mild fever and rest for one day'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.days).toBe(1);
    expect(res.body.data.attachmentUrl).toBeNull();
  });

  it('2. Sick leave exceeding threshold (>= 2 days) without attachment is rejected with 400 Bad Request', async () => {
    // 3 days: 2026-07-06 to 2026-07-08 (Mon-Wed)
    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        leaveTypeId: sickTypeId.toString(),
        startDate: '2026-07-06',
        endDate: '2026-07-08',
        reason: 'Severe food poisoning and doctor advised rest'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/medical proof attachment is mandatory/i);
  });

  it('3. Sick leave with valid PDF attachment buffer succeeds and persists attachmentUrl (201 Created)', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 Mock Doctor Certificate Content');

    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('leaveTypeId', sickTypeId.toString())
      .field('startDate', '2026-07-06')
      .field('endDate', '2026-07-08')
      .field('reason', 'Severe food poisoning with doctor prescription attached')
      .attach('attachment', pdfBuffer, 'doctor_prescription.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.days).toBe(3);
    expect(res.body.data.attachmentUrl).toBeDefined();
    expect(res.body.data.attachmentUrl).toMatch(/\/uploads\/leaves\/|http/);
  });

  it('4. Uploading disallowed file extension (.txt / .exe) is rejected by multer filter (400 Bad Request)', async () => {
    const textBuffer = Buffer.from('Plain text fake prescription');

    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('leaveTypeId', sickTypeId.toString())
      .field('startDate', '2026-07-13')
      .field('endDate', '2026-07-15')
      .field('reason', 'Rest period')
      .attach('attachment', textBuffer, 'malicious_script.txt');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid file format/i);
  });
});
