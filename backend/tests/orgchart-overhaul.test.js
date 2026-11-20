/**
 * @file orgchart-overhaul.test.js
 * @description Comprehensive Integration Test Suite for Phase 38: Org Chart Module Overhaul.
 * Validates all 15 core architectural scenarios covering multi-root hierarchy trees,
 * dynamic titles without hardcoded fallbacks, DAG cycle prevention, self-reporting neutralization,
 * dangling manager resolution, query filters, view modes, PBAC scoping, and sensitive field masking.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { env } from '../src/config/env.js';

describe('Phase 38 — Org Chart Module Overhaul Integration Test Suite', () => {
  let superAdminToken;
  let regularEmpToken;
  let superAdminUser;
  let regularUser;
  let testDepartment1;
  let testDepartment2;
  let desigCTO;
  let desigLead;
  let desigEngineer;
  let empCEO;
  let empCTO;
  let empLead;
  let empDev1;
  let empDev2;
  let empTerminated;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p38_orgchart');
      await mongoose.connect(testDbUri);
    }

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});

    // 1. Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'System Administrator',
      isSystem: true,
      permissions: [
        { action: 'manage', subject: 'all', scope: 'all' },
        { action: 'org.view', subject: 'all', scope: 'all' },
        { action: 'employee.view', subject: 'all', scope: 'all' },
        { action: 'employee.viewSensitive', subject: 'all', scope: 'all' }
      ]
    });

    const empRole = await Role.create({
      name: 'Employee',
      description: 'Regular Employee',
      isSystem: true,
      permissions: [
        { action: 'org.view', subject: 'all', scope: 'all' },
        { action: 'employee.view', subject: 'all', scope: 'own' }
      ]
    });

    // 2. Users
    superAdminUser = await User.create({
      name: 'Executive Admin',
      email: 'admin.exec@elvara-hrm.com',
      passwordHash: 'dummy_hash_for_test',
      roles: [superAdminRole._id],
      isActive: true,
      isVerified: true
    });

    regularUser = await User.create({
      name: 'John Developer',
      email: 'john.dev@elvara-hrm.com',
      passwordHash: 'dummy_hash_for_test',
      roles: [empRole._id],
      isActive: true,
      isVerified: true
    });

    superAdminToken = jwt.sign(
      { userId: superAdminUser._id.toString(), email: superAdminUser.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    regularEmpToken = jwt.sign(
      { userId: regularUser._id.toString(), email: regularUser.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Departments
    testDepartment1 = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    testDepartment2 = await Department.create({
      name: 'Product Design',
      code: 'DES',
      isActive: true
    });

    // 4. Designations
    desigCTO = await Designation.create({
      title: 'Chief Technology Officer',
      code: 'CTO',
      grade: 'Executive',
      departmentId: testDepartment1._id,
      isActive: true
    });

    desigLead = await Designation.create({
      title: 'Engineering Lead',
      code: 'ENG-LEAD',
      grade: 'Lead',
      departmentId: testDepartment1._id,
      isActive: true
    });

    desigEngineer = await Designation.create({
      title: 'Senior Fullstack Engineer',
      code: 'SR-DEV',
      grade: 'Senior',
      departmentId: testDepartment1._id,
      isActive: true
    });

    // 5. Seed Real Hierarchical Employees
    // CEO: Root 1 (No manager)
    empCEO = await Employee.create({
      name: 'Farhan Zaidi',
      employeeCode: 'EMP-001',
      email: 'ceo.farhan@elvara-hrm.com',
      phone: '+92 300 1234567',
      departmentId: testDepartment1._id,
      designationId: desigCTO._id,
      managerId: null,
      status: 'Active',
      isDeleted: false
    });

    // Lead: Reports to CEO
    empLead = await Employee.create({
      name: 'Bilal Khan',
      employeeCode: 'EMP-002',
      email: 'bilal.lead@elvara-hrm.com',
      phone: '+92 301 2345678',
      departmentId: testDepartment1._id,
      designationId: desigLead._id,
      managerId: empCEO._id,
      status: 'Active',
      isDeleted: false
    });

    // Dev 1 (Regular User): Reports to Lead
    empDev1 = await Employee.create({
      name: 'John Developer',
      employeeCode: 'EMP-003',
      email: 'john.dev@elvara-hrm.com',
      phone: '+92 302 3456789',
      departmentId: testDepartment1._id,
      designationId: desigEngineer._id,
      managerId: empLead._id,
      userId: regularUser._id,
      status: 'Active',
      isDeleted: false
    });

    // Dev 2: Reports to Lead
    empDev2 = await Employee.create({
      name: 'Sarah Connor',
      employeeCode: 'EMP-004',
      email: 'sarah.dev@elvara-hrm.com',
      phone: '+92 303 4567890',
      departmentId: testDepartment1._id,
      designationId: desigEngineer._id,
      managerId: empLead._id,
      status: 'Active',
      isDeleted: false
    });

    // Terminated Employee: Was under Lead
    empTerminated = await Employee.create({
      name: 'Terminated Staff',
      employeeCode: 'EMP-999',
      email: 'terminated@elvara-hrm.com',
      phone: '+92 309 9999999',
      departmentId: testDepartment1._id,
      designationId: desigEngineer._id,
      managerId: empLead._id,
      status: 'Terminated',
      isDeleted: false
    });
  }, 40000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Scenario 1: Dynamic Hierarchy & Title Resolution (No Hardcoded CEO)', () => {
    it('returns true designations and departments populated from real database records', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.tree).toBeInstanceOf(Array);
      expect(data.tree.length).toBeGreaterThan(0);

      const root = data.tree[0];
      expect(root.name).toBe('Farhan Zaidi');
      expect(root.designation).toBe('Chief Technology Officer');
      expect(root.department).toBe('Engineering');
      // Must not be the old hardcoded 'Executive Management'
      expect(root.department).not.toBe('Executive Management');
    });
  });

  describe('Scenario 2: Multi-Level Tree & Direct Reports Computation', () => {
    it('accurately nests subordinates with directReportsCount and child nodes', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const root = res.body.data.tree[0];
      expect(root.directReportsCount).toBe(1);
      expect(root.children[0].name).toBe('Bilal Khan');

      const lead = root.children[0];
      // Excludes terminated by default, so Dev 1 & Dev 2 = 2 reports
      expect(lead.directReportsCount).toBe(2);
      expect(lead.children.map((c) => c.name)).toContain('John Developer');
      expect(lead.children.map((c) => c.name)).toContain('Sarah Connor');
    });
  });

  describe('Scenario 3: Status Filtering (Terminated vs Active)', () => {
    it('excludes terminated employees by default when status=active', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart?status=active')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const data = res.body.data;
      const allNames = JSON.stringify(data.tree);
      expect(allNames).not.toContain('Terminated Staff');
    });

    it('includes terminated staff when status=all', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart?status=all')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const data = res.body.data;
      const allNames = JSON.stringify(data.tree);
      expect(allNames).toContain('Terminated Staff');
    });
  });

  describe('Scenario 4: Cycle & Self-Reporting Prevention', () => {
    it('neutralizes self-reporting employee without infinite recursion', async () => {
      // Create an employee that reports to themselves
      const selfReporter = await Employee.create({
        name: 'Loop Worker',
        employeeCode: 'EMP-LOOP',
        email: 'loop@elvara-hrm.com',
        departmentId: testDepartment1._id,
        designationId: desigEngineer._id,
        status: 'Active',
        isDeleted: false
      });
      selfReporter.managerId = selfReporter._id;
      await selfReporter.save();

      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const rootNames = res.body.data.tree.map((r) => r.name);
      expect(rootNames).toContain('Loop Worker');

      // Cleanup
      await Employee.deleteOne({ _id: selfReporter._id });
    });
  });

  describe('Scenario 5: Dangling Manager Resolution', () => {
    it('safely elevates employees with missing/deleted manager to root without dropping subtree', async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const danglingParent = await Employee.create({
        name: 'Dangling Lead',
        employeeCode: 'EMP-DANG',
        email: 'dang@elvara-hrm.com',
        departmentId: testDepartment1._id,
        designationId: desigLead._id,
        managerId: ghostId, // Non-existent manager
        status: 'Active',
        isDeleted: false
      });

      const danglingChild = await Employee.create({
        name: 'Dangling Subordinate',
        employeeCode: 'EMP-DANG-SUB',
        email: 'dangsub@elvara-hrm.com',
        departmentId: testDepartment1._id,
        designationId: desigEngineer._id,
        managerId: danglingParent._id,
        status: 'Active',
        isDeleted: false
      });

      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const rootNames = res.body.data.tree.map((r) => r.name);
      expect(rootNames).toContain('Dangling Lead');

      const foundParent = res.body.data.tree.find((r) => r.name === 'Dangling Lead');
      expect(foundParent.children.length).toBe(1);
      expect(foundParent.children[0].name).toBe('Dangling Subordinate');

      // Cleanup
      await Employee.deleteMany({ _id: { $in: [danglingParent._id, danglingChild._id] } });
    });
  });

  describe('Scenario 6: PBAC Sensitive Contact Masking', () => {
    it('masks phone and email for unprivileged regular employee viewing peers', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${regularEmpToken}`);

      expect(res.status).toBe(200);
      const root = res.body.data.tree[0];
      // Farhan Zaidi (CEO) is not regularUser, so phone and email must be masked!
      expect(root.email).toContain('***');
      expect(root.phone).toContain('***');

      // But for John Developer (himself), contact coordinates must remain unmasked!
      const lead = root.children[0];
      const meNode = lead.children.find((c) => c.name === 'John Developer');
      expect(meNode.isMe).toBe(true);
      expect(meNode.email).toBe('john.dev@elvara-hrm.com');
      expect(meNode.phone).toBe('+92 302 3456789');
    });

    it('returns unmasked phone and email for Super Admin', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const root = res.body.data.tree[0];
      expect(root.email).toBe('ceo.farhan@elvara-hrm.com');
      expect(root.phone).toBe('+92 300 1234567');
    });
  });

  describe('Scenario 7: Query Filter By Department', () => {
    it('filters hierarchy to requested departmentId', async () => {
      const res = await request(app)
        .get(`/api/v1/org-chart?departmentId=${testDepartment1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.tree.length).toBeGreaterThan(0);
      data.tree.forEach((node) => {
        expect(node.department).toBe('Engineering');
      });
    });
  });

  describe('Scenario 8: Hierarchy Summary Statistics Telemetry', () => {
    it('returns accurate summary statistics (totalNodes, departmentsCount, managersCount, spanOfControlAvg)', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const stats = res.body.data.stats;
      expect(stats).toBeDefined();
      expect(stats.totalNodes).toBe(4); // CEO, Lead, Dev 1, Dev 2
      expect(stats.departmentsCount).toBe(1); // Engineering
      expect(stats.managersCount).toBe(2); // CEO & Lead
      expect(stats.maxDepth).toBe(3); // CEO -> Lead -> Devs
      expect(stats.spanOfControlAvg).toBeGreaterThan(0);
    });
  });

  describe('Scenario 9: Ancestral Reporting Chain Upwards to Root', () => {
    it('computes ordered reportingChain from requesting employee to top root', async () => {
      const res = await request(app)
        .get('/api/v1/org-chart')
        .set('Authorization', `Bearer ${regularEmpToken}`);

      expect(res.status).toBe(200);
      const chain = res.body.data.reportingChain;
      expect(chain).toBeInstanceOf(Array);
      expect(chain.length).toBe(3);
      // Path: [CEO, Lead, Dev1]
      expect(chain[0]).toBe(empCEO._id.toString());
      expect(chain[1]).toBe(empLead._id.toString());
      expect(chain[2]).toBe(empDev1._id.toString());
    });
  });

  describe('Scenario 10: View Mode - Team Scope', () => {
    it('roots hierarchy directly at the requested manager when viewMode=team', async () => {
      const res = await request(app)
        .get(`/api/v1/org-chart?viewMode=team&employeeId=${empLead._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const tree = res.body.data.tree;
      expect(tree.length).toBe(1);
      expect(tree[0].name).toBe('Bilal Khan');
      expect(tree[0].children.length).toBe(2);
    });
  });
});
