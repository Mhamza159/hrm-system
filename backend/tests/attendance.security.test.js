/**
 * @file attendance.security.test.js
 * @description Adversarial Security, Hardening & Stress-Test Suite for Module M5.
 * 
 * TESTS COVER:
 * 1. Impersonation prevention (cannot punch for other employees)
 * 2. Server-side time enforcement (ignores client-supplied timestamps)
 * 3. Double-click & race-condition concurrency stress test (Promise.all)
 * 4. NoSQL injection & schema boundary defenses
 * 5. State machine integrity (punch order, double break, premature clockout)
 * 6. PBAC horizontal data scope boundary enforcement
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { MonthLock } from '../src/models/monthLock.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M5 Security, Hardening & Concurrency Stress Suite', { timeout: 35000 }, () => {
  let emp1Token, emp2Token, managerToken;
  let emp1User, emp2User, managerUser;
  let emp1Doc, emp2Doc, managerDoc;
  let deptA, deptB;

  const createToken = (user, role) => {
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
      env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_hrm_2026',
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m5_security');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    await MonthLock.deleteMany({});

    // Roles
    const empRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.view', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.correction', subject: 'Attendance', scope: 'own' }
      ]
    });

    const mgrRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.view', subject: 'Attendance', scope: 'team' },
        { action: 'attendance.approve', subject: 'Attendance', scope: 'team' },
        { action: 'attendance.export', subject: 'Attendance', scope: 'team' }
      ]
    });

    // Departments
    deptA = await Department.create({ name: 'Security Engineering', code: 'SEC' });
    deptB = await Department.create({ name: 'Finance Operations', code: 'FIN' });

    // Users & Employees
    emp1User = await User.create({ email: 'attacker@hrm.test', passwordHash: 'hash', roles: [empRole._id] });
    emp1Doc = await Employee.create({
      userId: emp1User._id,
      name: 'Attacker User',
      firstName: 'Attacker',
      lastName: 'User',
      employeeCode: 'EMP-9001',
      departmentId: deptA._id,
      status: 'Active'
    });

    emp2User = await User.create({ email: 'victim@hrm.test', passwordHash: 'hash', roles: [empRole._id] });
    emp2Doc = await Employee.create({
      userId: emp2User._id,
      name: 'Victim Colleague',
      firstName: 'Victim',
      lastName: 'Colleague',
      employeeCode: 'EMP-9002',
      departmentId: deptB._id,
      status: 'Active'
    });

    managerUser = await User.create({ email: 'sec.manager@hrm.test', passwordHash: 'hash', roles: [mgrRole._id] });
    managerDoc = await Employee.create({
      userId: managerUser._id,
      name: 'Sec Manager',
      firstName: 'Sec',
      lastName: 'Manager',
      employeeCode: 'MGR-9001',
      departmentId: deptA._id,
      status: 'Active'
    });

    emp1Token = createToken(emp1User, empRole);
    emp2Token = createToken(emp2User, empRole);
    managerToken = createToken(managerUser, mgrRole);
  });

  afterAll(async () => {
    await Attendance.deleteMany({});
    await Employee.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await mongoose.connection.close();
  });

  // ==========================================
  // THREAT 1: IMPERSONATION & PUNCH HIJACKING
  // ==========================================
  describe('Threat 1: Impersonation Prevention', () => {
    it('Blocks attacker from clocking in on behalf of victim via explicit employeeId injection', async () => {
      // Attacker attempts to punch in for Victim by passing victim's employeeId in body
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${emp1Token}`)
        .send({
          employeeId: emp2Doc._id.toString(), // Injected victim ID
          source: 'web'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB that Attacker's record was created, NOT Victim's!
      const attackerAtt = await Attendance.findOne({ employeeId: emp1Doc._id });
      expect(attackerAtt).not.toBeNull();
      expect(attackerAtt.employeeId.toString()).toBe(emp1Doc._id.toString());

      const victimAtt = await Attendance.findOne({ employeeId: emp2Doc._id });
      expect(victimAtt).toBeNull(); // Victim remains un-punched
    });

    it('Prevents employee from inspecting peers calendar via employeeId query parameter override', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/my?employeeId=${emp2Doc._id.toString()}`)
        .set('Authorization', `Bearer ${emp1Token}`);

      expect(res.status).toBe(200);
      // Data returned should be for emp1 (attacker), not emp2 (victim)
      expect(res.body.data.records.length).toBe(1);
      expect(res.body.data.records[0].employeeId.toString()).toBe(emp1Doc._id.toString());
    });
  });

  // ==========================================
  // THREAT 2: SERVER TIME INTEGRITY
  // ==========================================
  describe('Threat 2: Server-Side Time Enforcement', () => {
    it('Ignores client-supplied spoofed timestamp in request body', async () => {
      const spoofedTime = '2020-01-01T00:00:00.000Z'; // Client attempts to backdate punch

      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${emp1Token}`)
        .send({
          checkOut: spoofedTime,
          timestamp: spoofedTime
        });

      expect(res.status).toBe(200);
      const record = await Attendance.findOne({ employeeId: emp1Doc._id });
      expect(record.checkOut).not.toBeNull();
      // Server timestamp should be today, not 2020
      expect(new Date(record.checkOut).getFullYear()).toBeGreaterThanOrEqual(2025);
    });
  });

  // ==========================================
  // THREAT 3: CONCURRENCY & RACE CONDITIONS
  // ==========================================
  describe('Threat 3: Double-Click & Concurrent Race Stress Test', () => {
    it('Handles 10 simultaneous clock-in requests without creating duplicate records or throwing 500', async () => {
      // Clean previous attendance for emp2
      await Attendance.deleteMany({ employeeId: emp2Doc._id });

      // Simulate 10 simultaneous clicks in parallel
      const promises = Array.from({ length: 10 }).map(() =>
        request(app)
          .post('/api/v1/attendance/check-in')
          .set('Authorization', `Bearer ${emp2Token}`)
          .send({ source: 'web' })
      );

      const results = await Promise.all(promises);

      // Exactly ONE request must succeed with 200 Created/OK
      const successCount = results.filter((r) => r.status === 200).length;
      expect(successCount).toBe(1);

      // All others must be gracefully rejected with 400 (Already clocked in) or 409 (Duplicate entry) or 429
      const rejectedStatuses = results.filter((r) => r.status !== 200).map((r) => r.status);
      expect(rejectedStatuses.every((s) => [400, 409, 429].includes(s))).toBe(true);

      // Exactly ONE record must exist in DB for emp2 today
      const dbCount = await Attendance.countDocuments({ employeeId: emp2Doc._id });
      expect(dbCount).toBe(1);
    });
  });

  // ==========================================
  // THREAT 4: INJECTION DEFENSES
  // ==========================================
  describe('Threat 4: NoSQL Injection & Schema Defenses', () => {
    it('Rejects NoSQL operator query in month parameter with 400 Validation Error', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/my?month[$gt]=')
        .set('Authorization', `Bearer ${emp1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Rejects malformed month format (e.g. SQL injection payload)', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/my?month=2026-10;DROP TABLE attendance;')
        .set('Authorization', `Bearer ${emp1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // THREAT 5: STATE MACHINE GUARDS
  // ==========================================
  describe('Threat 5: State Machine & Premature Operations', () => {
    it('Blocks break start when user is not clocked in', async () => {
      await Attendance.deleteMany({ employeeId: emp2Doc._id });

      const res = await request(app)
        .post('/api/v1/attendance/break-start')
        .set('Authorization', `Bearer ${emp2Token}`)
        .send({ type: 'tea' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot start a break without an active check-in/i);
    });

    it('Blocks break end when no active break is in progress', async () => {
      // Clock in emp2 first
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${emp2Token}`);

      const res = await request(app)
        .post('/api/v1/attendance/break-end')
        .set('Authorization', `Bearer ${emp2Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/No active break in progress to end/i);
    });

    it('Blocks double break start while prior break is open', async () => {
      // Start break 1
      await request(app)
        .post('/api/v1/attendance/break-start')
        .set('Authorization', `Bearer ${emp2Token}`)
        .send({ type: 'tea' });

      // Start break 2 while break 1 is still open
      const res = await request(app)
        .post('/api/v1/attendance/break-start')
        .set('Authorization', `Bearer ${emp2Token}`)
        .send({ type: 'meal' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/An active break is already in progress/i);
    });
  });

  // ==========================================
  // THREAT 6: HORIZONTAL PBAC SCOPING
  // ==========================================
  describe('Threat 6: Horizontal PBAC Boundaries', () => {
    it('Restricts Department Manager to viewing only members in their assigned department', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/team')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;

      // Manager is in Dept A (Security Engineering). Should see emp1 (Dept A) and self, but NOT emp2 (Dept B)
      const empIds = items.map((i) => i.employee._id.toString());
      expect(empIds).toContain(emp1Doc._id.toString());
      expect(empIds).not.toContain(emp2Doc._id.toString());
    });

    it('Blocks regular employee from accessing team attendance grid with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/team')
        .set('Authorization', `Bearer ${emp1Token}`);

      expect(res.status).toBe(403);
    });

    it('Blocks regular employee and department manager from month lock controls with 403 Forbidden', async () => {
      const empRes = await request(app)
        .post('/api/v1/attendance/lock')
        .set('Authorization', `Bearer ${emp1Token}`)
        .send({ yearMonth: '2026-10' });

      expect(empRes.status).toBe(403);

      const mgrRes = await request(app)
        .post('/api/v1/attendance/lock')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ yearMonth: '2026-10' });

      expect(mgrRes.status).toBe(403);
    });
  });
});
