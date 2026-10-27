import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { Role } from '../src/models/role.model.js';
import '../src/models/setting.model.js';
import '../src/models/department.model.js';

import { env } from '../src/config/env.js';

describe('Module M5 — Overtime Approvals & Team Overtime Query', () => {
  let adminToken;
  let testDbUri;
  let testAttendanceId;

  beforeAll(async () => {
    testDbUri = 'mongodb://localhost:27017/hrm_test_overtime_isolated';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    await User.deleteMany({ email: /@overtime-test\.com$/ });
    await Employee.deleteMany({ email: /@overtime-test\.com$/ });
    await Role.deleteMany({ name: 'Admin_Overtime_Role' });

    let adminRole = await Role.findOne({ name: 'Super Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin_Overtime_Role',
        permissions: [
          { action: 'attendance.view', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.approve', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.edit', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.mark', subject: 'Attendance', scope: 'all' }
        ]
      });
    }

    const passwordHash = await bcrypt.hash('Password123!', 10);
    const adminUser = await User.create({
      name: 'Overtime Admin',
      email: 'admin@overtime-test.com',
      passwordHash,
      isActive: true,
      roles: [adminRole._id]
    });

    const emp = await Employee.create({
      userId: adminUser._id,
      employeeCode: 'EMP-OT-01',
      name: 'Overtime Tester',
      email: 'tester@overtime-test.com',
      status: 'Active'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id, email: adminUser.email, role: 'Super Admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const testAtt = await Attendance.create({
      employeeId: emp._id,
      date: new Date(Date.UTC(2026, 6, 10)),
      checkIn: new Date(Date.UTC(2026, 6, 10, 4, 0, 0)),
      checkOut: new Date(Date.UTC(2026, 6, 10, 15, 0, 0)),
      workDurationMinutes: 660,
      overtimeMinutes: 180, // 3 hours
      overtimeApproved: false,
      status: 'present'
    });

    testAttendanceId = testAtt._id.toString();
  });

  afterAll(async () => {
    await Attendance.deleteMany({ _id: testAttendanceId });
    await User.deleteMany({ email: /@overtime-test\.com$/ });
    await Employee.deleteMany({ email: /@overtime-test\.com$/ });
    await mongoose.disconnect();
  });

  it('1. GET /api/v1/attendance/overtime/team returns pending overtime records', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/overtime/team?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    const found = res.body.data.items.find((i) => i._id.toString() === testAttendanceId);
    expect(found).toBeDefined();
    expect(found.overtimeMinutes).toBe(180);
    expect(found.overtimeApproved).toBe(false);
  });

  it('2. PATCH /api/v1/attendance/:id/overtime-decide approves overtime and updates audit trail', async () => {
    const res = await request(app)
      .patch(`/api/v1/attendance/${testAttendanceId}/overtime-decide`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        approved: true,
        reason: 'Approved for urgent client release'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overtimeApproved).toBe(true);

    const updated = await Attendance.findById(testAttendanceId);
    expect(updated.overtimeApproved).toBe(true);
    expect(updated.auditLogs.length).toBeGreaterThan(0);
    expect(updated.auditLogs[updated.auditLogs.length - 1].reason).toContain('Approved for urgent client release');
  });
});
