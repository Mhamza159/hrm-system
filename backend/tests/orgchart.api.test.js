/**
 * @file orgchart.api.test.js
 * @description Integration Tests for Module M4 Visual Org Chart & Reporting Line (Slices 4.5 & 4.7).
 * 
 * TEST COVERAGE:
 * - 4.5-TEST:
 *   1. Returns valid hierarchical tree for Super Admin, HR Manager, Department Manager, and Employee (HTTP 200).
 *   2. Circular reporting chains DAG cycle prevention (no infinite recursion or stack overflow).
 *   3. Data sanitization: sensitive fields (salary, bank details, cnic) are completely excluded from employee cards.
 * - 4.7-TEST:
 *   4. Employee personal node has `isMe: true` and `reportingChain` populated with ancestors up to root.
 *   5. Unauthenticated request rejected with HTTP 401.
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
import { Employee } from '../src/models/employee.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Module M4 — Org Chart & Reporting Line API Integration Suite (Slice 4.5 & 4.7)', () => {
  let superAdminToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let superAdminUser;
  let hrUser;
  let managerUser;
  let employeeUser;

  let ceoEmp;
  let dirEmp;
  let mgrEmp;
  let staffEmp;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m4_orgchart');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await Employee.deleteMany({});

    // 1. Roles Setup
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Master Administrator',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      description: 'Human Resources Admin',
      isSystem: true,
      permissions: [
        { action: 'org.manage', subject: 'Organization', scope: 'all' },
        { action: 'org.view', subject: 'Organization', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      description: 'Team Manager',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'department' }]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'General Staff',
      isSystem: true,
      permissions: [{ action: 'org.view', subject: 'Organization', scope: 'own' }]
    });

    // 2. Users Setup
    superAdminUser = await User.create({
      email: 'admin.org@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    hrUser = await User.create({
      email: 'hr.org@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    managerUser = await User.create({
      email: 'mgr.org@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });

    employeeUser = await User.create({
      email: 'dev.org@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });

    // Generate tokens
    superAdminToken = jwt.sign({ userId: superAdminUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    hrToken = jwt.sign({ userId: hrUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    managerToken = jwt.sign({ userId: managerUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    employeeToken = jwt.sign({ userId: employeeUser._id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 3. Departments Setup
    const execDept = await Department.create({
      name: 'Executive Leadership',
      code: 'EXEC',
      headId: superAdminUser._id
    });

    const techDept = await Department.create({
      name: 'Technology',
      code: 'TECH',
      parentId: execDept._id,
      headId: managerUser._id
    });

    // 4. Designations Setup
    const ceoDesig = await Designation.create({
      title: 'Chief Executive Officer',
      code: 'CEO',
      grade: 'Executive',
      departmentId: execDept._id
    });

    const dirDesig = await Designation.create({
      title: 'Director of Engineering',
      code: 'DIR-ENG',
      grade: 'Executive',
      departmentId: techDept._id
    });

    const leadDesig = await Designation.create({
      title: 'Engineering Lead',
      code: 'ENG-LEAD',
      grade: 'Lead',
      departmentId: techDept._id
    });

    const sdeDesig = await Designation.create({
      title: 'Senior Software Engineer',
      code: 'SDE-II',
      grade: 'Senior',
      departmentId: techDept._id
    });

    // 5. Hierarchical Employees:
    // CEO (Root) -> Director -> Lead (Manager User) -> SDE (Employee User)
    ceoEmp = await Employee.create({
      employeeCode: 'EMP-001',
      name: 'Tariq Malik',
      email: 'tariq.ceo@company.pk',
      phone: '+92 300 1111111',
      departmentId: execDept._id,
      designationId: ceoDesig._id,
      managerId: null
    });

    dirEmp = await Employee.create({
      employeeCode: 'EMP-002',
      name: 'Zainab Ahmed',
      email: 'zainab.dir@company.pk',
      departmentId: techDept._id,
      designationId: dirDesig._id,
      managerId: ceoEmp._id
    });

    mgrEmp = await Employee.create({
      employeeCode: 'EMP-003',
      name: 'Hamza Khan',
      email: 'mgr.org@company.pk',
      userId: managerUser._id,
      departmentId: techDept._id,
      designationId: leadDesig._id,
      managerId: dirEmp._id
    });

    staffEmp = await Employee.create({
      employeeCode: 'EMP-004',
      name: 'Bilal Farooq',
      email: 'dev.org@company.pk',
      userId: employeeUser._id,
      departmentId: techDept._id,
      designationId: sdeDesig._id,
      managerId: mgrEmp._id
    });
  });

  it('4.5: Unauthenticated request to /api/v1/org-chart returns HTTP 401', async () => {
    const res = await request(app).get('/api/v1/org-chart');
    expect(res.status).toBe(401);
  });

  it('4.5: Super Admin retrieves valid hierarchical org chart tree (HTTP 200)', async () => {
    const res = await request(app)
      .get('/api/v1/org-chart')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { tree, totalNodes } = res.body.data;
    expect(totalNodes).toBe(4);
    expect(Array.isArray(tree)).toBe(true);
    expect(tree.length).toBe(1); // Single root: CEO

    const root = tree[0];
    expect(root.name).toBe('Tariq Malik');
    expect(root.employeeCode).toBe('EMP-001');
    expect(root.children.length).toBe(1);

    const director = root.children[0];
    expect(director.name).toBe('Zainab Ahmed');
    expect(director.children.length).toBe(1);

    const lead = director.children[0];
    expect(lead.name).toBe('Hamza Khan');
    expect(lead.children.length).toBe(1);

    const sde = lead.children[0];
    expect(sde.name).toBe('Bilal Farooq');
    expect(sde.children.length).toBe(0);
  });

  it('4.5: All four default roles can query the org chart (HTTP 200)', async () => {
    for (const token of [hrToken, managerToken, employeeToken]) {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tree).toBeDefined();
    }
  });

  it('4.5: Org chart excludes sensitive financial or personal fields', async () => {
    const res = await request(app)
      .get('/api/v1/org-chart')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    const root = res.body.data.tree[0];
    const sde = root.children[0].children[0].children[0];

    // Ensure no sensitive leakage
    expect(sde.salary).toBeUndefined();
    expect(sde.bankAccount).toBeUndefined();
    expect(sde.cnic).toBeUndefined();
    expect(sde.passwordHash).toBeUndefined();
  });

  it('4.7: Employee query highlights personal node (isMe: true) and vertical reportingChain', async () => {
    const res = await request(app)
      .get('/api/v1/org-chart')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    const { reportingChain, tree } = res.body.data;

    // Reporting chain must trace: CEO -> Director -> Manager -> Employee
    expect(Array.isArray(reportingChain)).toBe(true);
    expect(reportingChain.length).toBe(4);
    expect(reportingChain[0]).toBe(ceoEmp._id.toString());
    expect(reportingChain[1]).toBe(dirEmp._id.toString());
    expect(reportingChain[2]).toBe(mgrEmp._id.toString());
    expect(reportingChain[3]).toBe(staffEmp._id.toString());

    // Personal node has isMe = true
    const root = tree[0];
    const director = root.children[0];
    const lead = director.children[0];
    const sde = lead.children[0];

    expect(root.isMe).toBe(false);
    expect(director.isMe).toBe(false);
    expect(lead.isMe).toBe(false);
    expect(sde.isMe).toBe(true);
  });

  it('4.5: Circular reporting cycle (A -> B -> A) is handled gracefully without stack overflow', async () => {
    // Create circular dependency between two isolated test employees
    const empA = await Employee.create({
      employeeCode: 'LOOP-A',
      name: 'Loop Employee A',
      managerId: null
    });

    const empB = await Employee.create({
      employeeCode: 'LOOP-B',
      name: 'Loop Employee B',
      managerId: empA._id
    });

    // Make circular: empA reports to empB
    empA.managerId = empB._id;
    await empA.save();

    // Query org chart; must not crash or infinite loop
    const res = await request(app)
      .get('/api/v1/org-chart')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Clean up loop records
    await Employee.deleteMany({ employeeCode: { $in: ['LOOP-A', 'LOOP-B'] } });
  });
});
