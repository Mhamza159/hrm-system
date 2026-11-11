import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
vi.mock('../src/services/socket.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  emitToCompany: vi.fn(),
  emitToDepartment: vi.fn()
}));
import { emitToCompany } from '../src/services/socket.service.js';
import '../src/config/db.js';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Shift } from '../src/models/shift.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { WFHRequest } from '../src/models/wfh.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { applyWFH, decideWFH, buildPunchBroadcast } from '../src/modules/attendance/attendance.service.js';

describe('Attendance dashboard events', { timeout: 30000 }, () => {
  let staffUser, hrUser, employeeToken, empDoc;

  beforeAll(async () => {
    await mongoose.connect(env.MONGO_URI.replace('hrm_development', 'hrm_test_attendance_dash'));
    await Promise.all([User, Role, Shift, Employee, Attendance, WFHRequest, AuditLog].map((m) => m.deleteMany({})));
    const hrRole = await Role.create({ name: 'Super Admin', isSystem: true, permissions: [{ action: 'manage', subject: 'all', scope: 'all' }] });
    const empRole = await Role.create({
      name: 'Employee', isSystem: true,
      permissions: [
        { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
        { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' }
      ]
    });
    hrUser = await User.create({ name: 'Admin', email: 'admin.dash@starlight.pk', passwordHash: 'x', roles: [hrRole._id], isActive: true });
    staffUser = await User.create({ name: 'Ali', email: 'ali.dash@starlight.pk', passwordHash: 'x', roles: [empRole._id], isActive: true });
    const shift = await Shift.create({
      name: 'Day', code: 'DAY', type: 'fixed', startTime: '09:00', endTime: '18:00', graceMinutes: 15,
      breakMinutes: 60, halfDayMinutes: 240, workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    });
    empDoc = await Employee.create({ userId: staffUser._id, name: 'Ali', email: 'ali.dash@starlight.pk', employeeCode: 'EMP-D1', shiftId: shift._id, status: 'Active' });
    employeeToken = jwt.sign({ userId: staffUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buildPunchBroadcast exposes only ids and date', () => {
    const empId = new mongoose.Types.ObjectId();
    const deptId = new mongoose.Types.ObjectId();
    const p = buildPunchBroadcast(
      { date: '2026-11-11', checkIn: new Date(), status: 'late', flags: ['x'] },
      { _id: empId, name: 'Ali', departmentId: deptId }
    );
    expect(Object.keys(p).sort()).toEqual(['date', 'departmentId', 'employeeId']);
    expect(p.employeeId).toBe(String(empId));
    expect(p.departmentId).toBe(String(deptId));
  });

  it('applyWFH and decideWFH write audit logs and emit dashboard:changed', async () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const req = await applyWFH({ user: staffUser, date: tomorrow, reason: 'plumber' });
    await decideWFH({ requestId: req._id, user: hrUser, decision: 'approved' });
    await new Promise((r) => setTimeout(r, 300)); // audit writes are fire-and-forget
    const logs = await AuditLog.find({ module: 'wfhrequest' });
    expect(logs.map((l) => l.action).sort()).toEqual(['WFH_APPROVED', 'WFH_REQUESTED']);
    expect(emitToCompany).toHaveBeenCalledWith('dashboard:changed', { module: 'wfhrequest' });
    expect(emitToCompany).toHaveBeenCalledWith('dashboard:changed', { module: 'attendance' });
  });

  it('checkIn emits dashboard:changed and a narrow punch payload, with no audit log', async () => {
    const res = await request(app).post('/api/v1/attendance/check-in').set('Authorization', `Bearer ${employeeToken}`).send({});
    expect(res.status).toBe(200);
    expect(emitToCompany).toHaveBeenCalledWith('dashboard:changed', { module: 'attendance' });
    const punch = emitToCompany.mock.calls.find((c) => c[0] === 'attendance:punch');
    expect(Object.keys(punch[1]).sort()).toEqual(['date', 'departmentId', 'employeeId']);
    expect(punch[1].employeeId).toBe(String(empDoc._id));
    expect(await AuditLog.countDocuments({ module: 'attendance', action: /CHECK_?IN/i })).toBe(0);
  });
});
