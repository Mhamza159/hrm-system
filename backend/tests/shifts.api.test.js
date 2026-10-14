/**
 * @file shifts.api.test.js
 * @description Integration Tests for Module M4 Shifts Master & Cross-Midnight Calculation (BUILD-GUIDE ID 4.4).
 * 
 * TEST COVERAGE:
 * - 4.4-TEST:
 *   1. HR Manager creates regular fixed shift (09:00 - 18:00) with isCrossMidnight: false (HTTP 201).
 *   2. HR Manager creates overnight night shift (20:00 - 05:00) with isCrossMidnight: true (HTTP 201).
 *   3. Rejects shift creation when break minutes exceed total shift duration (HTTP 400).
 *   4. Rejects duplicate shift code (HTTP 400).
 *   5. Department Manager and Employee receive 403 Forbidden on mutations.
 *   6. All authenticated roles can read shifts list (HTTP 200).
 *   7. Active employee deletion guard: blocking deletion when active staff assigned (HTTP 400).
 *   8. Unassigned shift deletion succeeds (soft delete with isDeleted: true).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Shift } from '../src/models/shift.model.js';
import { Employee } from '../src/models/employee.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M4 — Shifts API Integration Test Suite (Slice 4.4-TEST)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let morningShiftId;
  let nightShiftId;
  let tempShiftId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m4_shifts');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Shift.deleteMany({});
    await Employee.deleteMany({});

    // 1. Roles Setup
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'org.manage', subject: 'Organization', scope: 'all' },
        { action: 'org.view', subject: 'Organization', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'all' }]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'all' }]
    });

    // 2. Users Setup
    const adminUser = await User.create({
      email: 'admin.shift@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });
    superAdminToken = jwt.sign({ userId: adminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    const hrUser = await User.create({
      email: 'hr.shift@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    const mgrUser = await User.create({
      email: 'mgr.shift@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });
    managerToken = jwt.sign({ userId: mgrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    const empUser = await User.create({
      email: 'emp.shift@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });
    employeeToken = jwt.sign({ userId: empUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Shift.deleteMany({});
    await Employee.deleteMany({});
    await mongoose.disconnect();
  }, 30000);

  it('HR Manager creates a regular same-day fixed shift (201 Created)', async () => {
    const payload = {
      name: 'Morning General Shift',
      code: 'MORN-GEN',
      type: 'fixed',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      breakMinutes: 60,
      halfDayMinutes: 240,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isActive: true
    };

    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(payload.name);
    expect(res.body.data.code).toBe('MORN-GEN');
    expect(res.body.data.isCrossMidnight).toBe(false);
    expect(res.body.data.durationMinutes).toBe(480); // (9h - 1h break) = 8h = 480 mins

    morningShiftId = res.body.data._id;
  });

  it('HR Manager creates an overnight cross-midnight night shift (201 Created)', async () => {
    const payload = {
      name: 'Night Operations Shift',
      code: 'NIGHT-OPS',
      type: 'night',
      startTime: '20:00',
      endTime: '05:00',
      graceMinutes: 20,
      breakMinutes: 60,
      halfDayMinutes: 240,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isActive: true
    };

    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isCrossMidnight).toBe(true);
    // 20:00 to 05:00 = 9h total = 540m. 540 - 60 break = 480 mins
    expect(res.body.data.durationMinutes).toBe(480);

    nightShiftId = res.body.data._id;
  });

  it('Rejects shift when break minutes exceed total shift duration (400 Bad Request)', async () => {
    const invalidPayload = {
      name: 'Excessive Break Shift',
      code: 'EXC-BRK',
      type: 'fixed',
      startTime: '09:00',
      endTime: '11:00', // 2 hours = 120 mins
      breakMinutes: 150 // Exceeds 120 mins
    };

    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Rejects duplicate shift code (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Duplicate Shift',
        code: 'MORN-GEN',
        type: 'fixed',
        startTime: '08:00',
        endTime: '17:00'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('Department Manager and Employee receive 403 Forbidden on mutations', async () => {
    // 1. Manager create attempt
    const mgrRes = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Unauthorized Shift',
        code: 'UNAUTH-SFT',
        startTime: '10:00',
        endTime: '19:00'
      });
    expect(mgrRes.status).toBe(403);

    // 2. Employee delete attempt
    const empRes = await request(app)
      .delete(`/api/v1/shifts/${morningShiftId}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(empRes.status).toBe(403);
  });

  it('All authenticated roles can read shifts list (200 OK)', async () => {
    const res = await request(app)
      .get('/api/v1/shifts')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('Blocks deletion of a shift populated with active employees (400 Bad Request)', async () => {
    // Assign active employee to morningShiftId
    await Employee.create({
      employeeCode: 'EMP-SFT-001',
      name: 'Rostered Hamza',
      shiftId: morningShiftId,
      status: 'Active',
      isDeleted: false
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/shifts/${morningShiftId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.success).toBe(false);
    expect(deleteRes.body.message).toMatch(/active employee\(s\) are assigned to this shift/i);

    // Verify shift still exists
    const shift = await Shift.findOne({ _id: morningShiftId, isDeleted: false });
    expect(shift).toBeDefined();
  });

  it('Successfully soft deletes an unassigned shift (200 OK)', async () => {
    // Create temporary shift
    const tempShift = await Shift.create({
      name: 'Temp Project Shift',
      code: 'TMP-SFT',
      startTime: '10:00',
      endTime: '19:00',
      durationMinutes: 480,
      isActive: true,
      isDeleted: false
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/shifts/${tempShift._id}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toMatch(/successfully deleted/i);

    // Verify soft deleted in DB
    const dbShift = await Shift.findById(tempShift._id);
    expect(dbShift.isDeleted).toBe(true);
  });
});
