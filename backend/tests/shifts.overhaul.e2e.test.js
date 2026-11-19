/**
 * @file shifts.overhaul.e2e.test.js
 * @description Comprehensive E2E integration test suite for Phase 27:
 * Work Shifts Module Archival Lifecycle, KPI Stats, Workforce Analytics,
 * Employee Roster Assignment, Cross-Midnight Overnight Schedules,
 * Cross-Module Assignment Guards, and Critical Employee Assignment Restriction Guard.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Shift } from '../src/models/shift.model.js';
import { env } from '../src/config/env.js';

describe('Phase 27: Work Shifts Module Overhaul, Archival Lifecycle & Employee Guard E2E', () => {
  const adminEmail = 'admin.shifts@company.pk';
  const staffEmail = 'staff.shifts@company.pk';
  const testPassword = 'Password123!';

  let adminToken;
  let staffToken;
  let adminUser;
  let staffUser;

  let testDept;
  let dayShift;
  let nightShift;
  let testEmployee;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p27_shifts');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Shift.deleteMany({});

    // 1. Seed Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'System Super Administrator',
      permissions: [{ action: 'manage', subject: 'all' }]
    });

    const staffRole = await Role.create({
      name: 'Employee',
      description: 'Standard Staff Member',
      permissions: [{ action: 'org.view', subject: 'Organization' }]
    });

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // 3. Seed Users
    adminUser = await User.create({
      email: adminEmail,
      passwordHash,
      roles: [superAdminRole._id],
      isActive: true
    });

    staffUser = await User.create({
      email: staffEmail,
      passwordHash,
      roles: [staffRole._id],
      isActive: true
    });

    // 4. Generate Tokens
    adminToken = jwt.sign(
      { userId: adminUser._id, _id: adminUser._id, id: adminUser._id, email: adminUser.email, roles: ['Super Admin'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    staffToken = jwt.sign(
      { userId: staffUser._id, _id: staffUser._id, id: staffUser._id, email: staffUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Seed Test Department
    testDept = await Department.create({
      name: 'Operations Division',
      code: 'OPS',
      isActive: true
    });

    // 6. Seed Test Employee
    testEmployee = await Employee.create({
      userId: staffUser._id,
      name: 'Hamza Shifts Tester',
      employeeCode: 'EMP-SH01',
      email: 'hamza.shift@company.pk',
      joiningDate: new Date('2025-01-01'),
      status: 'Active',
      departmentId: testDept._id
    });
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
    } catch {}
    await mongoose.disconnect();
  });

  // 1. Creation & Overnight Calculations
  it('1. POST /api/v1/shifts - Super Admin creates standard day shift (201 Created)', async () => {
    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Standard Morning Shift',
        code: 'MRN-01',
        type: 'fixed',
        startTime: '09:00',
        endTime: '18:00',
        graceMinutes: 15,
        breakMinutes: 60,
        halfDayMinutes: 240,
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        departmentId: testDept._id.toString(),
        capacity: 10,
        color: '#00C471'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Standard Morning Shift');
    expect(res.body.data.code).toBe('MRN-01');
    expect(res.body.data.isCrossMidnight).toBe(false);
    expect(res.body.data.durationMinutes).toBe(480); // (9h * 60) - 60m break = 480m (8h net)
    expect(res.body.data.capacity).toBe(10);

    dayShift = res.body.data;
  });

  it('2. POST /api/v1/shifts - Super Admin creates cross-midnight night shift (201 Created)', async () => {
    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Overnight Graveyard Shift',
        code: 'NGT-01',
        type: 'night',
        startTime: '22:00',
        endTime: '06:00',
        graceMinutes: 15,
        breakMinutes: 60,
        halfDayMinutes: 240,
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        capacity: 5,
        color: '#818CF8'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isCrossMidnight).toBe(true);
    expect(res.body.data.durationMinutes).toBe(420); // (8h * 60) - 60m break = 420m (7h net)

    nightShift = res.body.data;
  });

  it('3. POST /api/v1/shifts - Rejects shift when break minutes exceed total duration (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Invalid Break Shift',
        code: 'INV-01',
        type: 'fixed',
        startTime: '09:00',
        endTime: '11:00', // 2h = 120m
        breakMinutes: 120 // Equal to total duration
      });

    expect(res.status).toBe(400);
  });

  it('4. POST /api/v1/shifts - Rejects duplicate shift code (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Code Shift',
        code: 'MRN-01',
        type: 'fixed',
        startTime: '10:00',
        endTime: '19:00'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already exists');
  });

  // 2. Statistics & Analytics
  it('5. GET /api/v1/shifts/stats - Returns 7 aggregated KPI statistics', async () => {
    const res = await request(app)
      .get('/api/v1/shifts/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.active).toBe(2);
    expect(res.body.data.archived).toBe(0);
    expect(res.body.data.nightShifts).toBe(1);
  });

  it('6. GET /api/v1/shifts/analytics - Returns shift type distribution and headcounts', async () => {
    const res = await request(app)
      .get('/api/v1/shifts/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.typeDistribution)).toBe(true);
    expect(Array.isArray(res.body.data.shiftHeadcounts)).toBe(true);
    expect(res.body.data.dayNightRatio).toBeDefined();
    expect(res.body.data.dayNightRatio.night.shiftCount).toBe(1);
  });

  // 3. Employee Roster Assignment & Capacity Enforcement
  it('7. POST /api/v1/shifts/:id/assign - Assigns employee to shift with capacity check', async () => {
    const res = await request(app)
      .post(`/api/v1/shifts/${dayShift._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeIds: [testEmployee._id.toString()],
        action: 'add'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.headcount).toBe(1);

    // Verify employee record was updated
    const updatedEmp = await Employee.findById(testEmployee._id);
    expect(updatedEmp.shiftId?.toString()).toBe(dayShift._id.toString());
  });

  it('8. GET /api/v1/shifts/:id/employees - Returns assigned staff roster with search', async () => {
    const res = await request(app)
      .get(`/api/v1/shifts/${dayShift._id}/employees?search=Hamza`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].employeeCode).toBe('EMP-SH01');
  });

  it('9. GET /api/v1/shifts/:id - Single inspection returns enriched shift with headcount', async () => {
    const res = await request(app)
      .get(`/api/v1/shifts/${dayShift._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.headcount).toBe(1);
    expect(res.body.data.departmentId?.code).toBe('OPS');
  });

  // 4. Archival Lifecycle
  it('10. PATCH /api/v1/shifts/:id/archive - Soft-archives a shift', async () => {
    const res = await request(app)
      .patch(`/api/v1/shifts/${nightShift._id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isArchived).toBe(true);
    expect(res.body.data.archivedAt).toBeDefined();

    // Verify stats reflect archived shift
    const statsRes = await request(app)
      .get('/api/v1/shifts/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(statsRes.body.data.archived).toBe(1);
    expect(statsRes.body.data.active).toBe(1);
  });

  it('11. Cross-Module Guard: Cannot assign employee to an archived shift', async () => {
    const res = await request(app)
      .post(`/api/v1/shifts/${nightShift._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeIds: [testEmployee._id.toString()],
        action: 'add'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('because it is archived');
  });

  it('12. GET /api/v1/shifts/archived - Returns archived shifts list', async () => {
    const res = await request(app)
      .get('/api/v1/shifts/archived')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].code).toBe('NGT-01');
  });

  it('13. PATCH /api/v1/shifts/:id/restore - Restores shift back to active', async () => {
    const res = await request(app)
      .patch(`/api/v1/shifts/${nightShift._id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isArchived).toBe(false);
    expect(res.body.data.archivedAt).toBeNull();
  });

  // 5. CRITICAL EMPLOYEE ASSIGNMENT RESTRICTION GUARD
  it('14. DELETE /api/v1/shifts/:id/permanent - STRICTLY BLOCKS permanent delete when ≥1 employee is assigned (400 Bad Request)', async () => {
    const res = await request(app)
      .delete(`/api/v1/shifts/${dayShift._id}/permanent`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('cannot be permanently deleted because 1 employee(s) are currently assigned to it');
  });

  it('15. Reassign employee to unblock shift and permanently delete (200 OK)', async () => {
    // Unassign employee from dayShift
    await request(app)
      .post(`/api/v1/shifts/${dayShift._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeIds: [testEmployee._id.toString()],
        action: 'remove'
      });

    // Permanent delete should now succeed
    const res = await request(app)
      .delete(`/api/v1/shifts/${dayShift._id}/permanent`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('permanently deleted');

    // Confirm it no longer exists
    const checkDb = await Shift.findById(dayShift._id);
    expect(checkDb).toBeNull();
  });

  // 6. RBAC Enforcement
  it('16. Standard Employee receives 403 Forbidden on shift mutations', async () => {
    const res = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        name: 'Unauthorized Shift',
        code: 'UNAUTH-01',
        type: 'fixed',
        startTime: '09:00',
        endTime: '17:00'
      });

    expect(res.status).toBe(403);
  });

  // 7. Code Review Hardening Verifications
  it('17. POST /api/v1/shifts/:id/assign with action: clear completely unassigns all staff (WR-01)', async () => {
    // Assign employee to nightShift first
    await request(app)
      .post(`/api/v1/shifts/${nightShift._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeIds: [testEmployee._id.toString()],
        action: 'add'
      });

    let emp = await Employee.findById(testEmployee._id);
    expect(emp.shiftId?.toString()).toBe(nightShift._id.toString());

    // Execute clear action
    const clearRes = await request(app)
      .post(`/api/v1/shifts/${nightShift._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'clear'
      });

    expect(clearRes.status).toBe(200);
    expect(clearRes.body.data.headcount).toBe(0);

    emp = await Employee.findById(testEmployee._id);
    expect(emp.shiftId).toBeNull();
  });

  it('18. GET /api/v1/shifts/invalid-id returns 400 on malformed ID & 404 on non-existent ID (WR-03)', async () => {
    // 1. Malformed non-ObjectId string -> intercepted by Zod schema with 400
    const malformedRes = await request(app)
      .get('/api/v1/shifts/invalid-non-objectid')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(malformedRes.status).toBe(400);
    expect(malformedRes.body.success).toBe(false);

    // 2. Syntactically valid ObjectId that does not exist -> returns 404
    const notFoundRes = await request(app)
      .get('/api/v1/shifts/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.success).toBe(false);
    expect(notFoundRes.body.message).toContain('Shift not found');
  });

  it('19. PATCH /api/v1/shifts/:id/restore unlinks department if department is archived (IN-01)', async () => {
    // Create a temporary shift with testDept
    const createRes = await request(app)
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Department Test Shift',
        code: 'DTS-01',
        type: 'fixed',
        startTime: '08:00',
        endTime: '16:00',
        departmentId: testDept._id.toString()
      });
    expect(createRes.status).toBe(201);
    const tempShiftId = createRes.body.data._id;

    // Soft-archive the shift
    await request(app)
      .patch(`/api/v1/shifts/${tempShiftId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Soft-archive the department
    await Department.findByIdAndUpdate(testDept._id, { isArchived: true, archivedAt: new Date() });

    // Restore the shift
    const restoreRes = await request(app)
      .patch(`/api/v1/shifts/${tempShiftId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isArchived).toBe(false);
    // departmentId should be unlinked because testDept is archived
    expect(restoreRes.body.data.departmentId).toBeNull();

    // Cleanup: restore department for any other tests
    await Department.findByIdAndUpdate(testDept._id, { isArchived: false, archivedAt: null });
  });
});
