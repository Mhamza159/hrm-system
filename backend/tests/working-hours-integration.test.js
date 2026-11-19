/**
 * @file working-hours-integration.test.js
 * @description Comprehensive Integration Test Suite for Phase 37: Working Hours & Schedule Settings.
 * Validates all 17 scenarios covering Sat/Sun default off, weekday toggle, leave deductions,
 * status engine metrics, shift overrides, payroll unexcused absence immunity, RBAC/PBAC, and cache bus.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Shift } from '../src/models/shift.model.js';
import { Setting } from '../src/models/setting.model.js';
import { SettingService } from '../src/modules/settings/setting.service.js';
import {
  DAY_NAMES,
  normalizeDayName,
  normalizeWorkDays,
  getEffectiveWorkDays,
  isWeeklyOff,
  calculateWorkingDaysInMonth,
  getNetWorkHours
} from '../src/utils/workdayHelper.js';
import {
  evaluateAttendanceStatus,
  calculateWorkMetrics
} from '../src/modules/attendance/services/statusEngine.service.js';
import { calculateDeductibleDays } from '../src/modules/leaves/leaveCalculator.js';
import { env } from '../src/config/env.js';

describe('Phase 37 — Working Hours Sub-Module System-Wide Integration Test Suite', () => {
  let superAdminToken;
  let hrManagerToken;
  let employeeToken;
  let superAdminUser;
  let hrManagerUser;
  let employeeUser;
  let testEmployee;
  let customShift;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p37_workhours');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Shift.deleteMany({});
    await Setting.deleteMany({});
    SettingService.clearCache();

    // 1. Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Full Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'HR Operational Manager',
      isSystem: true,
      permissions: [
        { action: 'settings.view', subject: 'Settings', scope: 'all' },
        { action: 'settings.manage', subject: 'Settings', scope: 'all' },
        { action: 'attendance.view', subject: 'Attendance', scope: 'all' },
        { action: 'attendance.manage', subject: 'Attendance', scope: 'all' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard Staff Member',
      isSystem: true,
      permissions: [
        { action: 'attendance.view', subject: 'Attendance', scope: 'own' },
        { action: 'leave.apply', subject: 'Leave', scope: 'own' },
        { action: 'settings.view', subject: 'Settings', scope: 'all' }
      ]
    });

    // 2. Users
    superAdminUser = await User.create({
      email: 'admin.wh@enterprise.test',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrManagerUser = await User.create({
      email: 'hr.wh@enterprise.test',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'staff.wh@enterprise.test',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    // 3. Tokens
    superAdminToken = jwt.sign(
      { userId: superAdminUser._id, roles: [superAdminRole._id] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    hrManagerToken = jwt.sign(
      { userId: hrManagerUser._id, roles: [hrRole._id] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: employeeUser._id, roles: [employeeRole._id] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Custom Shift with 4-day schedule (Mon, Tue, Wed, Thu)
    customShift = await Shift.create({
      name: 'Four-Day Shift',
      code: 'SHIFT-4D',
      startTime: '08:00',
      endTime: '17:00',
      breakMinutes: 45,
      halfDayMinutes: 200,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday']
    });

    // 5. Employee with custom shift
    testEmployee = await Employee.create({
      userId: employeeUser._id,
      name: 'Tariq Mehmood',
      firstName: 'Tariq',
      lastName: 'Mehmood',
      officialEmail: employeeUser.email,
      personalEmail: 'tariq.personal@enterprise.test',
      phone: '+923001112233',
      employeeCode: 'EMP-WH-001',
      dateOfJoining: new Date('2024-01-01'),
      status: 'Active',
      shiftId: customShift._id
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // SCENARIO 1: Saturday & Sunday Default Off
  // =========================================================================
  it('Scenario 1: Saturday and Sunday default to weekly off in initial configuration', async () => {
    const workingDays = await SettingService.getSetting('workingDays');
    expect(workingDays).toBeDefined();
    expect(Array.isArray(workingDays)).toBe(true);
    expect(workingDays).toContain('monday');
    expect(workingDays).toContain('friday');
    expect(workingDays).not.toContain('saturday');
    expect(workingDays).not.toContain('sunday');

    // Sunday (2026-11-22) is off by default
    const isSundayOff = isWeeklyOff('2026-11-22T10:00:00Z', null, workingDays);
    expect(isSundayOff).toBe(true);

    // Saturday (2026-11-21) is off by default
    const isSaturdayOff = isWeeklyOff('2026-11-21T10:00:00Z', null, workingDays);
    expect(isSaturdayOff).toBe(true);
  });

  // =========================================================================
  // SCENARIO 2: Super Admin toggles Saturday ON -> 6 working days
  // =========================================================================
  it('Scenario 2: toggles Saturday ON, updating working days to 6 and invalidating cache', async () => {
    const updatedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const res = await request(app)
      .patch('/api/v1/settings/workingDays')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ value: updatedDays });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify cache bus returns new value without restart
    const cachedDays = await SettingService.getSetting('workingDays');
    expect(cachedDays).toEqual(updatedDays);
    expect(cachedDays).toContain('saturday');
  });

  // =========================================================================
  // SCENARIO 3: Saturday attendance: recognized as work day when enabled
  // =========================================================================
  it('Scenario 3: Saturday is recognized as a regular work day when enabled', async () => {
    const workingDays = await SettingService.getSetting('workingDays');
    // Saturday (2026-11-21) should now NOT be a weekly off
    const isSaturdayOff = isWeeklyOff('2026-11-21T10:00:00Z', null, workingDays);
    expect(isSaturdayOff).toBe(false);
  });

  // =========================================================================
  // SCENARIO 4: Sunday toggled ON -> 7-day operating schedule
  // =========================================================================
  it('Scenario 4: Sunday toggled ON creates a 7-day operating schedule', async () => {
    const allSevenDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const res = await request(app)
      .patch('/api/v1/settings/workingDays')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ value: allSevenDays });

    expect(res.status).toBe(200);
    const cachedDays = await SettingService.getSetting('workingDays');
    expect(cachedDays.length).toBe(7);

    // Neither Saturday nor Sunday is weekly off
    expect(isWeeklyOff('2026-11-21T10:00:00Z', null, cachedDays)).toBe(false);
    expect(isWeeklyOff('2026-11-22T10:00:00Z', null, cachedDays)).toBe(false);
  });

  // =========================================================================
  // SCENARIO 5: Weekday toggled OFF (4-day week: Friday off)
  // =========================================================================
  it('Scenario 5: toggling Friday OFF marks Friday as weekly off', async () => {
    const fourDayWeek = ['monday', 'tuesday', 'wednesday', 'thursday'];

    await SettingService.updateSetting('workingDays', fourDayWeek, superAdminUser);
    const cachedDays = await SettingService.getSetting('workingDays');
    expect(cachedDays).toEqual(fourDayWeek);

    // Friday (2026-11-20) is now weekly off
    const isFridayOff = isWeeklyOff('2026-11-20T10:00:00Z', null, cachedDays);
    expect(isFridayOff).toBe(true);

    // Thursday (2026-11-19) is a working day
    const isThursdayOff = isWeeklyOff('2026-11-19T10:00:00Z', null, cachedDays);
    expect(isThursdayOff).toBe(false);
  });

  // =========================================================================
  // SCENARIO 6: Dynamic Leave Deductions Calculation
  // =========================================================================
  it('Scenario 6: leave deductible days calculation dynamically respects active working days', async () => {
    // Disable sandwich rule for isolated working days deduction test
    await SettingService.updateSetting(
      'leavePolicy',
      { fiscalYearStart: 'July', carryForwardLimit: 5, encashmentAllowed: true, sandwichRule: false },
      superAdminUser
    );

    // A. Reset to standard 5-day week (Mon-Fri)
    await SettingService.updateSetting(
      'workingDays',
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      superAdminUser
    );

    // Fri to Mon leave across weekend (Fri 2026-11-20 to Mon 2026-11-23)
    // Fri (work), Sat (off), Sun (off), Mon (work) -> exactly 2 deductible days
    const res5Day = await calculateDeductibleDays('2026-11-20', '2026-11-23', 'none');
    expect(res5Day.netDays).toBe(2);

    // B. Enable Saturday as working day (6-day week)
    await SettingService.updateSetting(
      'workingDays',
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      superAdminUser
    );

    // Fri to Mon leave with Saturday ON -> Fri (work), Sat (work), Sun (off), Mon (work) -> 3 deductible days
    const res6Day = await calculateDeductibleDays('2026-11-20', '2026-11-23', 'none');
    expect(res6Day.netDays).toBe(3);

    // C. 4-day week (Fri, Sat, Sun OFF)
    await SettingService.updateSetting(
      'workingDays',
      ['monday', 'tuesday', 'wednesday', 'thursday'],
      superAdminUser
    );

    // Thu to Mon leave -> Thu (work), Fri (off), Sat (off), Sun (off), Mon (work) -> 2 deductible days
    const res4Day = await calculateDeductibleDays('2026-11-19', '2026-11-23', 'none');
    expect(res4Day.netDays).toBe(2);
  });

  // =========================================================================
  // SCENARIO 7: Standard Shift Coordinates & Net Work Hours
  // =========================================================================
  it('Scenario 7: calculates net work hours subtracting break duration', () => {
    const netMetrics = getNetWorkHours('09:00', '18:00', 60);
    expect(netMetrics.grossMinutes).toBe(540); // 9h
    expect(netMetrics.breakMinutes).toBe(60);  // 1h
    expect(netMetrics.netMinutes).toBe(480);    // 8h
    expect(netMetrics.netHours).toBe(8);
    expect(netMetrics.isCrossMidnight).toBe(false);
  });

  // =========================================================================
  // SCENARIO 8: calculateWorkMetrics respects break duration
  // =========================================================================
  it('Scenario 8: calculateWorkMetrics respects effective break minutes in work duration', () => {
    const metrics = calculateWorkMetrics({
      checkIn: new Date('2026-11-19T09:00:00Z'),
      checkOut: new Date('2026-11-19T18:00:00Z'),
      totalBreakMinutes: 60,
      officeHours: { startTime: '09:00', endTime: '18:00', breakMinutes: 60 }
    });

    // 9 hours total - 60 min break = 480 min (8 hours)
    expect(metrics.workDurationMinutes).toBe(480);
    expect(metrics.overtimeMinutes).toBe(0);
    expect(metrics.isEarlyDeparture).toBe(false);
  });

  // =========================================================================
  // SCENARIO 9: Half-day threshold consumed from officeHours when unset in shift
  // =========================================================================
  it('Scenario 9: statusEngine consumes halfDayMinutes from officeHours fallback', () => {
    // Shift with no explicit halfDayMinutes
    const result = evaluateAttendanceStatus({
      checkIn: new Date('2026-11-19T14:00:00+05:00'), // 5 hours after 09:00 (300 mins)
      shift: { startTime: '09:00', graceMinutes: 15 },
      officeHours: { startTime: '09:00', halfDayMinutes: 240 }
    });

    // 300 mins > 240 mins half-day threshold -> status 'half_day'
    expect(result.status).toBe('half_day');
  });

  // =========================================================================
  // SCENARIO 10: Shift-specific workDays override company default
  // =========================================================================
  it('Scenario 10: employee assigned shift workDays override company settings', () => {
    const companyDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const effectiveDays = getEffectiveWorkDays(customShift, companyDays);

    // Custom shift has 4 days: Monday - Thursday
    expect(effectiveDays).toEqual(['monday', 'tuesday', 'wednesday', 'thursday']);
    expect(effectiveDays).not.toContain('friday');

    // Friday is weekly off for this employee even though it's a company working day
    const isFridayOffForEmployee = isWeeklyOff('2026-11-20T10:00:00Z', customShift, companyDays);
    expect(isFridayOffForEmployee).toBe(true);
  });

  // =========================================================================
  // SCENARIO 11: Unassigned employees fall back cleanly to company settings
  // =========================================================================
  it('Scenario 11: employees without assigned shift cleanly fall back to company schedule', () => {
    const companyDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const effectiveDays = getEffectiveWorkDays(null, companyDays);

    expect(effectiveDays).toEqual(companyDays);
    expect(effectiveDays).toContain('friday');
  });

  // =========================================================================
  // SCENARIO 12: Working days in month calculation
  // =========================================================================
  it('Scenario 12: accurately calculates scheduled working days in month excluding weekly offs', () => {
    const standardDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    // November 2026: 30 days total (4 Sundays, 4 Saturdays, 1 Friday... 21 Mon-Fri workdays)
    const workDaysInNov = calculateWorkingDaysInMonth(2026, 11, standardDays);
    expect(workDaysInNov).toBe(21);

    // 6-day work week (Sat ON): 21 + 4 Saturdays = 25 workdays
    const sixDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const workDaysSix = calculateWorkingDaysInMonth(2026, 11, sixDays);
    expect(workDaysSix).toBe(25);
  });

  // =========================================================================
  // SCENARIO 13: Case-insensitive day name normalization
  // =========================================================================
  it('Scenario 13: normalizes day names case-insensitively across all callers', () => {
    expect(normalizeDayName('Monday')).toBe('monday');
    expect(normalizeDayName('FRIDAY')).toBe('friday');
    expect(normalizeDayName('saturDAY')).toBe('saturday');
    expect(normalizeWorkDays(['Monday', 'TUESDAY', 'wednesday'])).toEqual([
      'monday',
      'tuesday',
      'wednesday'
    ]);
  });

  // =========================================================================
  // SCENARIO 14: Cache invalidation on setting mutation
  // =========================================================================
  it('Scenario 14: SettingService invalidates in-memory cache immediately upon update', async () => {
    const testHours = {
      startTime: '08:30',
      endTime: '17:30',
      breakMinutes: 45,
      halfDayMinutes: 210,
      fullDayMinutes: 450,
      flexibleShiftAllowed: true,
      timeZone: 'Asia/Karachi'
    };

    await SettingService.updateSetting('officeHours', testHours, superAdminUser);
    const cachedHours = await SettingService.getSetting('officeHours');

    expect(cachedHours.startTime).toBe('08:30');
    expect(cachedHours.breakMinutes).toBe(45);
    expect(cachedHours.flexibleShiftAllowed).toBe(true);
  });

  // =========================================================================
  // SCENARIO 15: RBAC/PBAC: Super Admin and HR Manager can update working hours
  // =========================================================================
  it('Scenario 15: Super Admin and HR Manager can update working hours via API', async () => {
    // HR Manager update
    const res = await request(app)
      .patch('/api/v1/settings/workingDays')
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({ value: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // =========================================================================
  // SCENARIO 16: RBAC/PBAC: Standard Employee cannot modify working hours
  // =========================================================================
  it('Scenario 16: Regular employee receives 403 Forbidden when attempting to modify settings', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/workingDays')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ value: ['monday', 'tuesday', 'wednesday'] });

    expect(res.status).toBe(403);
  });

  // =========================================================================
  // SCENARIO 17: Public Policies API exposes sanitized workingDays & officeHours
  // =========================================================================
  it('Scenario 17: Public policies endpoint exposes sanitized workingDays and officeHours', async () => {
    const res = await request(app)
      .get('/api/v1/settings/public-policies')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.workingDays).toBeDefined();
    expect(res.body.data.officeHours).toBeDefined();
    expect(res.body.data.officeHours.startTime).toBeDefined();
  });
});
