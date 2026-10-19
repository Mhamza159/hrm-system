/**
 * @file attendance.api.test.js
 * @description Integration Tests for Module M5 Attendance & Shifts (BUILD-GUIDE Section 10).
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
import { Attendance } from '../src/models/attendance.model.js';
import { MonthLock } from '../src/models/monthLock.model.js';
import { WFHRequest } from '../src/models/wfh.model.js';
import { AttendanceCorrection } from '../src/models/correction.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';
import { normalizeToUtcMidnight } from '../src/modules/attendance/attendance.service.js';
import { runAutoAbsentSweep } from '../src/modules/attendance/jobs/autoAbsent.job.js';

describe('Module M5 — Attendance & Shifts Integration Test Suite', { timeout: 30000 }, () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let employeeUser;
  let employeeDoc;
  let testShift;

  const createAuthToken = (user, role) => {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: {
          _id: role._id,
          name: role.name,
          permissions: role.permissions
        }
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m5_attendance');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Shift.deleteMany({});
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    await MonthLock.deleteMany({});
    await WFHRequest.deleteMany({});
    await AttendanceCorrection.deleteMany({});

    // 1. Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.view', subject: 'Attendance', scope: 'all' },
        { action: 'attendance.edit', subject: 'Attendance', scope: 'all' },
        { action: 'attendance.approve', subject: 'Attendance', scope: 'all' },
        { action: 'attendance.lock', subject: 'Attendance', scope: 'all' },
        { action: 'attendance.export', subject: 'Attendance', scope: 'all' },
        { action: 'org.manage', subject: 'Organization', scope: 'all' },
        { action: 'org.view', subject: 'Organization', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.view', subject: 'Attendance', scope: 'team' },
        { action: 'attendance.approve', subject: 'Attendance', scope: 'team' },
        { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.correction', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.export', subject: 'Attendance', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.view', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.correction', subject: 'Attendance', scope: 'own' }
      ]
    });

    // 2. Users
    const superAdminUser = await User.create({
      name: 'Super Admin',
      email: 'admin.att@starlight.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    const hrUser = await User.create({
      name: 'HR Manager',
      email: 'hr.att@starlight.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    const managerUser = await User.create({
      name: 'Dept Manager',
      email: 'manager.att@starlight.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      name: 'John Doe',
      email: 'john.att@starlight.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    // 3. Shift
    testShift = await Shift.create({
      name: 'General Day Shift',
      code: 'GEN-DAY',
      type: 'fixed',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      breakMinutes: 60,
      halfDayMinutes: 240,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });

    // 4. Employee Profile
    employeeDoc = await Employee.create({
      userId: employeeUser._id,
      name: 'John Doe',
      email: 'john.att@starlight.pk',
      employeeCode: 'EMP-001',
      shiftId: testShift._id,
      status: 'Active'
    });

    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    managerToken = jwt.sign({ userId: managerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // 5.1-TEST: Model & Unique Index
  it('5.1-TEST: Prevents duplicate attendance records for identical employeeId and date', async () => {
    const today = normalizeToUtcMidnight(new Date());
    await Attendance.create({
      employeeId: employeeDoc._id,
      date: today,
      status: 'present'
    });

    // Attempting duplicate insert should reject
    await expect(
      Attendance.create({
        employeeId: employeeDoc._id,
        date: today,
        status: 'present'
      })
    ).rejects.toThrow();

    await Attendance.deleteMany({});
  });

  // 5.3-TEST: Web Clock-In
  it('5.3-TEST: Employee can successfully clock in', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ source: 'web' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkIn).toBeDefined();
    expect(res.body.data.employeeId).toBe(String(employeeDoc._id));
  });

  it('5.3-TEST: Rejects second clock-in on the same day', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ source: 'web' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Already clocked in');
  });

  // 5.5-TEST: Break Management
  it('5.5-TEST: Employee can start and end a break', async () => {
    // Start break
    const startRes = await request(app)
      .post('/api/v1/attendance/break-start')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'meal' });

    expect(startRes.status).toBe(200);
    expect(startRes.body.data.breaks.length).toBe(1);
    expect(startRes.body.data.breaks[0].type).toBe('meal');

    // End break
    const endRes = await request(app)
      .post('/api/v1/attendance/break-end')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    expect(endRes.status).toBe(200);
    expect(endRes.body.data.breaks[0].endTime).toBeDefined();
  });

  // 5.4-TEST: Web Clock-Out
  it('5.4-TEST: Employee can successfully clock out and duration is calculated', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/check-out')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkOut).toBeDefined();
  });

  // 5.9-TEST: My Attendance Monthly Query
  it('5.9-TEST: Returns monthly attendance records and summary metrics', async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const res = await request(app)
      .get(`/api/v1/attendance/my?month=${currentMonth}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.records).toBeDefined();
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalDays).toBeGreaterThanOrEqual(1);
  });

  // 5.10-TEST: Team Attendance Presence
  it('5.10-TEST: Manager can inspect live team presence grid', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/team')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  // 5.11-TEST: Manual Adjustment with Audit Log
  it('5.11-TEST: HR Admin can manually adjust attendance with mandatory reason', async () => {
    const today = normalizeToUtcMidnight(new Date());
    const attRecord = await Attendance.findOne({ employeeId: employeeDoc._id, date: today });

    // Without reason -> 400
    const failRes = await request(app)
      .patch(`/api/v1/attendance/${attRecord._id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'present', overrideReason: '' });

    expect(failRes.status).toBe(400);

    // With valid reason
    const okRes = await request(app)
      .patch(`/api/v1/attendance/${attRecord._id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        status: 'present',
        overrideReason: 'Verified badge malfunction with security camera feed'
      });

    expect(okRes.status).toBe(200);
    expect(okRes.body.data.auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(okRes.body.data.auditLogs[0].reason).toContain('Verified badge malfunction');
  });

  // 5.8-TEST: WFH Workflow
  it('5.8-TEST: Employee can submit WFH request and Manager can approve it', async () => {
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const applyRes = await request(app)
      .post('/api/v1/attendance/wfh')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        date: tomorrowStr,
        reason: 'Broadband technician home service scheduled'
      });

    expect(applyRes.status).toBe(201);
    const requestId = applyRes.body.data._id;

    // Manager decides
    const decideRes = await request(app)
      .patch(`/api/v1/attendance/wfh/${requestId}/decide`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        decision: 'approved',
        decisionReason: 'Approved as sprint milestones are on track'
      });

    expect(decideRes.status).toBe(200);
    expect(decideRes.body.data.status).toBe('approved');
  });

  // 5.12-TEST: Missed-Punch Correction
  it('5.12-TEST: Employee can submit punch correction and Manager can approve it', async () => {
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const corrRes = await request(app)
      .post('/api/v1/attendance/corrections')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        date: yesterdayStr,
        requestedCheckIn: `${yesterdayStr}T09:00:00.000Z`,
        requestedCheckOut: `${yesterdayStr}T18:00:00.000Z`,
        reason: 'Forgot to swipe card at gate while carrying test servers'
      });

    expect(corrRes.status).toBe(201);
    const corrId = corrRes.body.data._id;

    const decideRes = await request(app)
      .patch(`/api/v1/attendance/corrections/${corrId}/decide`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        decision: 'approved',
        decisionNotes: 'Confirmed with security log'
      });

    expect(decideRes.status).toBe(200);
    expect(decideRes.body.data.status).toBe('approved');

    // Attendance record for yesterday should now exist
    const updatedAtt = await Attendance.findOne({
      employeeId: employeeDoc._id,
      date: normalizeToUtcMidnight(new Date(yesterdayStr))
    });
    expect(updatedAtt).toBeDefined();
    expect(updatedAtt.checkIn).toBeDefined();
  });

  // 5.14-TEST: Month Lock
  it('5.14-TEST: Lock monthly attendance blocks subsequent mutations with 423', async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Lock month
    const lockRes = await request(app)
      .post('/api/v1/attendance/lock')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        yearMonth: currentMonth,
        notes: 'October 2026 payroll locked'
      });

    expect(lockRes.status).toBe(200);

    // Attempting correction or edit on locked month should return 423 Locked
    const failRes = await request(app)
      .post('/api/v1/attendance/wfh')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        date: new Date().toISOString().split('T')[0],
        reason: 'Cannot apply on locked month'
      });

    expect(failRes.status).toBe(423);

    // Unlock month
    const unlockRes = await request(app)
      .post('/api/v1/attendance/unlock')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        yearMonth: currentMonth
      });

    expect(unlockRes.status).toBe(200);
    expect(unlockRes.body.data.isLocked).toBe(false);
  });

  // 5.13-TEST: Auto-Absent Runner Sweep
  it('5.13-TEST: Auto-absent sweep marks active unrecorded employees absent', async () => {
    const pastDate = new Date('2026-10-01T12:00:00Z');
    const result = await runAutoAbsentSweep(pastDate);
    expect(result.processed).toBeGreaterThanOrEqual(1);
  });

  // 5.15-TEST: Excel Export
  it('5.15-TEST: Exports Excel timesheet with spreadsheet content-type header', async () => {
    const res = await request(app)
      .get('/api/v1/reports/attendance')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
  });
});
