/**
 * @file teams.api.test.js
 * @description Integration Tests for Module M4 Manager "My Team" View (BUILD-GUIDE ID 4.6).
 * 
 * TEST COVERAGE:
 * - 4.6-TEST:
 *   1. Department Manager queries GET /api/v1/teams/my and receives direct subordinates (HTTP 200).
 *   2. Employee with zero direct reports receives directReports: [] and totalCount: 0.
 *   3. Sensitive financial fields (salary, bankAccount, cnic) are omitted.
 *   4. Direct reports include subordinate name, designation, department, and assigned shift details.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Shift } from '../src/models/shift.model.js';
import { Employee } from '../src/models/employee.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M4 — Manager "My Team" View API Integration Suite (Slice 4.6-TEST)', () => {
  let managerToken;
  let employeeToken;

  let managerUser;
  let employeeUser;

  let managerEmp;
  let sub1Emp;
  let sub2Emp;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m4_teams');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Shift.deleteMany({});
    await Employee.deleteMany({});

    // 1. Roles
    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Manager Role',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'department' }]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Employee Role',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'own' }]
    });

    // 2. Users
    managerUser = await User.create({
      email: 'manager.team@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'dev.team@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    managerToken = jwt.sign({ userId: managerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 3. Department, Designation, and Shift
    const devDept = await Department.create({
      name: 'Engineering',
      code: 'DEV-TEAM'
    });

    const leadDesig = await Designation.create({
      title: 'Engineering Manager',
      code: 'EM',
      grade: 'Lead',
      departmentId: devDept._id
    });

    const devDesig = await Designation.create({
      title: 'Software Engineer',
      code: 'SWE',
      grade: 'Mid',
      departmentId: devDept._id
    });

    const morningShift = await Shift.create({
      name: 'Morning General Shift',
      code: 'MORN-TEAM',
      type: 'fixed',
      startTime: '09:00',
      endTime: '18:00',
      durationMinutes: 480
    });

    // 4. Employees
    managerEmp = await Employee.create({
      employeeCode: 'MGR-001',
      name: 'Kamran Akmal',
      email: 'manager.team@company.pk',
      userId: managerUser._id,
      departmentId: devDept._id,
      designationId: leadDesig._id,
      shiftId: morningShift._id,
      managerId: null
    });

    sub1Emp = await Employee.create({
      employeeCode: 'DEV-001',
      name: 'Ayesha Omer',
      email: 'ayesha.team@company.pk',
      phone: '+92 300 2223334',
      departmentId: devDept._id,
      designationId: devDesig._id,
      shiftId: morningShift._id,
      managerId: managerEmp._id
    });

    sub2Emp = await Employee.create({
      employeeCode: 'DEV-002',
      name: 'Sohail Tanvir',
      email: 'sohail.team@company.pk',
      phone: '+92 300 3334445',
      departmentId: devDept._id,
      designationId: devDesig._id,
      shiftId: morningShift._id,
      managerId: managerEmp._id
    });

    // employeeUser is an employee with 0 direct reports
    await Employee.create({
      employeeCode: 'DEV-003',
      name: 'Fawad Alam',
      email: 'dev.team@company.pk',
      userId: employeeUser._id,
      departmentId: devDept._id,
      designationId: devDesig._id,
      shiftId: morningShift._id,
      managerId: managerEmp._id
    });
  });

  it('4.6: Unauthenticated request returns HTTP 401', async () => {
    const res = await request(app).get('/api/v1/teams/my');
    expect(res.status).toBe(401);
  });

  it('4.6: Department Manager retrieves direct subordinates and shift distribution (HTTP 200)', async () => {
    const res = await request(app)
      .get('/api/v1/teams/my')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { manager, directReports, totalCount } = res.body.data;
    expect(manager).toBeDefined();
    expect(manager.name).toBe('Kamran Akmal');
    expect(totalCount).toBe(3); // Ayesha, Sohail, Fawad
    expect(directReports.length).toBe(3);

    // Check member details
    const ayesha = directReports.find((r) => r.name === 'Ayesha Omer');
    expect(ayesha).toBeDefined();
    expect(ayesha.employeeCode).toBe('DEV-001');
    expect(ayesha.email).toBe('ayesha.team@company.pk');
    expect(ayesha.phone).toBe('+92 300 2223334');
    expect(ayesha.department).toBe('Engineering');
    expect(ayesha.designation).toBe('Software Engineer');
    expect(ayesha.shift.name).toBe('Morning General Shift');
    expect(ayesha.shift.startTime).toBe('09:00');
    expect(ayesha.shift.endTime).toBe('18:00');
  });

  it('4.6: Employee with zero subordinates receives empty reports list (HTTP 200)', async () => {
    const res = await request(app)
      .get('/api/v1/teams/my')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { directReports, totalCount } = res.body.data;
    expect(totalCount).toBe(0);
    expect(directReports).toEqual([]);
  });

  it('4.6: Sensitive financial fields (salary, bankAccount, cnic) are not leaked in team view', async () => {
    const res = await request(app)
      .get('/api/v1/teams/my')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    for (const report of res.body.data.directReports) {
      expect(report.salary).toBeUndefined();
      expect(report.bankAccount).toBeUndefined();
      expect(report.cnic).toBeUndefined();
      expect(report.passwordHash).toBeUndefined();
    }
  });
});
