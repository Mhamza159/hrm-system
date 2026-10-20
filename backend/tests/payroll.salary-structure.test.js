/**
 * @file payroll.salary-structure.test.js
 * @description Integration Tests for Module M9 Salary Structure & Revisions (BUILD-GUIDE 9.1 & 9.2).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M9 — Salary Structure & Revision Test Suite (Slices 9.1-TEST & 9.2-TEST)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let testEmployee;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m9_payroll');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await SalaryStructure.deleteMany({});

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
        { action: 'payroll.manage', subject: 'Payroll', scope: 'all' },
        { action: 'payroll.view', subject: 'Payroll', scope: 'all' },
        { action: 'payroll.run', subject: 'Payroll', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'payroll.view', subject: 'Payroll', scope: 'own' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'payroll.view', subject: 'Payroll', scope: 'own' }
      ]
    });

    // 2. Users Setup
    const superAdminUser = await User.create({
      name: 'Payroll Admin',
      email: 'admin.payroll@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id]
    });

    const hrUser = await User.create({
      name: 'Payroll HR',
      email: 'hr.payroll@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id]
    });

    const managerUser = await User.create({
      name: 'Dept Manager',
      email: 'manager.payroll@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id]
    });

    const empUser = await User.create({
      name: 'Test Staff',
      email: 'staff.payroll@hrm.local',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id]
    });

    // 3. Test Employee
    testEmployee = await Employee.create({
      employeeCode: 'EMP-PAY-001',
      name: 'Ali Raza',
      email: 'ali.raza@hrm.local',
      phone: '+923001234567',
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    // 4. Issue Tokens
    const signToken = (user, roleName) =>
      jwt.sign(
        {
          userId: user._id,
          email: user.email,
          roles: [roleName]
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin');
    hrToken = signToken(hrUser, 'HR Manager');
    managerToken = signToken(managerUser, 'Department Manager');
    employeeToken = signToken(empUser, 'Employee');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('9.1-BE: Disallows non-HR / non-Admin roles from assigning salary structures (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/salary-structures')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employeeId: testEmployee._id.toString(),
        effectiveFrom: '2026-01-01',
        basicSalary: 10000000 // PKR 100,000.00
      });

    expect(res.status).toBe(403);
  });

  it('9.1-BE: HR Manager successfully assigns initial salary structure in integer paisa', async () => {
    const res = await request(app)
      .post('/api/v1/salary-structures')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId: testEmployee._id.toString(),
        effectiveFrom: '2026-01-01',
        currency: 'PKR',
        basicSalary: 10000000,          // PKR 100,000.00
        houseRentAllowance: 4000000,    // PKR 40,000.00
        medicalAllowance: 1000000,      // PKR 10,000.00
        conveyanceAllowance: 1000000,   // PKR 10,000.00
        otherAllowances: 0,
        eobiEnabled: true,
        pessiEnabled: false
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId).toBe(testEmployee._id.toString());
    expect(res.body.data.basicSalary).toBe(10000000);
    expect(res.body.data.grossSalary).toBe(16000000); // PKR 160,000.00
    expect(res.body.data.status).toBe('active');
  });

  it('9.1-BE: Prevents duplicate initial active salary structure creation (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/salary-structures')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId: testEmployee._id.toString(),
        effectiveFrom: '2026-06-01',
        basicSalary: 12000000
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already has an active salary structure');
  });

  it('9.1-BE: Lists paginated salary structures with populated employee info', async () => {
    const res = await request(app)
      .get('/api/v1/salary-structures?page=1&limit=10')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].employeeId.employeeCode).toBe('EMP-PAY-001');
    expect(res.body.meta.totalDocs).toBeGreaterThanOrEqual(1);
  });

  it('9.2-BE: HR Manager successfully revises salary structure with mandatory audit reason', async () => {
    const res = await request(app)
      .put(`/api/v1/salary-structures/employee/${testEmployee._id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        effectiveFrom: '2026-07-01',
        basicSalary: 12000000,          // PKR 120,000
        houseRentAllowance: 4800000,    // PKR 48,000
        medicalAllowance: 1200000,      // PKR 12,000
        conveyanceAllowance: 1200000,   // PKR 12,000
        otherAllowances: 0,
        revisionReason: 'Annual performance increment 20%'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.grossSalary).toBe(19200000); // PKR 192,000
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.revisionReason).toBe('Annual performance increment 20%');

    // Verify previous structure is marked 'superseded'
    const superseded = await SalaryStructure.find({
      employeeId: testEmployee._id,
      status: 'superseded'
    });
    expect(superseded.length).toBe(1);
    expect(superseded[0].grossSalary).toBe(16000000);
  });

  it('9.2-BE: Retrieves employee salary structure and full historical revisions', async () => {
    const res = await request(app)
      .get(`/api/v1/salary-structures/employee/${testEmployee._id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.current.grossSalary).toBe(19200000);
    expect(res.body.data.history.length).toBe(1);
    expect(res.body.data.history[0].grossSalary).toBe(16000000);
  });
});
