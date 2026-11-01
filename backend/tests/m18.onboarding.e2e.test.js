/**
 * @file m18.onboarding.e2e.test.js
 * @description Comprehensive Multi-Role Functional & Security Test Suite for Module M18 (Onboarding & Offboarding Lifecycle).
 * 
 * SPECIFICATION & COVERAGE:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.1 to 18.11)
 * - Roles: Super Admin, HR Manager, Department Manager, Employee
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Asset } from '../src/models/asset.model.js';
import ChecklistTemplate from '../src/models/checklistTemplate.model.js';
import Checklist from '../src/models/checklist.model.js';
import Resignation from '../src/models/resignation.model.js';
import ExitInterview from '../src/models/exitInterview.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';
import { createEmployee } from '../src/modules/employees/employee.service.js';

describe('Module M18 — Onboarding & Offboarding Lifecycle E2E Test Suite', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken, otherEmpToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser, otherEmpUser;
  let engineeringDept;
  let employeeEmp, deptManagerEmp, newHireEmp;
  let testTemplateId;
  let activeChecklistId;
  let activeResignationId;
  let activeOffboardingId;

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        roles: user.roles.map((r) => r.name || r)
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m18_onboarding');
      await mongoose.connect(testDbUri);
    }

    // Clean test collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Asset.deleteMany({}),
      ChecklistTemplate.deleteMany({}),
      Checklist.deleteMany({}),
      Resignation.deleteMany({}),
      ExitInterview.deleteMany({})
    ]);

    // Bootstrap roles and Super Admin
    await seedRolesAndAdmin();

    superAdminUser = await User.findOne({
      email: { $in: ['mhamzaofficial159@gmail.com', 'admin@hrm.company.pk', env.ADMIN_EMAIL] }
    }).populate('roles');
    if (!superAdminUser) {
      const saRole = await Role.findOne({ name: 'Super Admin' });
      superAdminUser = await User.findOne({ roles: saRole._id }).populate('roles');
    }
    superAdminToken = generateToken(superAdminUser);

    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    engineeringDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    // Create HR Manager
    hrManagerUser = await User.create({
      name: 'Sarah HR',
      email: 'hr.manager.m18@company.com',
      passwordHash: 'hashed_pw_test',
      roles: [hrRole._id],
      status: 'active',
      isActive: true
    });
    hrManagerUser.roles = [hrRole];
    hrManagerToken = generateToken(hrManagerUser);

    // Create Department Manager
    deptManagerUser = await User.create({
      name: 'David Manager',
      email: 'eng.manager.m18@company.com',
      passwordHash: 'hashed_pw_test',
      roles: [deptRole._id],
      status: 'active',
      isActive: true
    });
    deptManagerUser.roles = [deptRole];
    deptManagerToken = generateToken(deptManagerUser);

    deptManagerEmp = await Employee.create({
      userId: deptManagerUser._id,
      name: 'David Manager',
      firstName: 'David',
      lastName: 'Manager',
      employeeCode: 'EMP-MGR-M18',
      workEmail: deptManagerUser.email,
      departmentId: engineeringDept._id,
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });
    engineeringDept.departmentHead = deptManagerEmp._id;
    await engineeringDept.save();

    // Create Primary Employee (Bob)
    employeeUser = await User.create({
      name: 'Bob Developer',
      email: 'bob.dev.m18@company.com',
      passwordHash: 'hashed_pw_test',
      roles: [empRole._id],
      status: 'active',
      isActive: true
    });
    employeeUser.roles = [empRole];
    employeeToken = generateToken(employeeUser);

    employeeEmp = await Employee.create({
      userId: employeeUser._id,
      name: 'Bob Developer',
      firstName: 'Bob',
      lastName: 'Developer',
      employeeCode: 'EMP-DEV-M18',
      workEmail: employeeUser.email,
      email: employeeUser.email,
      departmentId: engineeringDept._id,
      managerId: deptManagerEmp._id,
      joiningDate: new Date('2024-06-01'),
      status: 'Active'
    });

    // Create Other Employee (Charlie)
    otherEmpUser = await User.create({
      name: 'Charlie QA',
      email: 'charlie.qa.m18@company.com',
      passwordHash: 'hashed_pw_test',
      roles: [empRole._id],
      status: 'active',
      isActive: true
    });
    otherEmpUser.roles = [empRole];
    otherEmpToken = generateToken(otherEmpUser);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Asset.deleteMany({}),
      ChecklistTemplate.deleteMany({}),
      Checklist.deleteMany({}),
      Resignation.deleteMany({}),
      ExitInterview.deleteMany({})
    ]);
    await mongoose.disconnect();
  });

  // =========================================================================
  // SLICE 1: CHECKLIST TEMPLATE MASTER AUTHORING (BUILD-GUIDE Row 18.1)
  // =========================================================================
  describe('Slice 1: Checklist Template Master Authoring (Row 18.1)', () => {
    it('18.1-1: HR Manager creates an onboarding checklist template with tasks array', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/templates')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          name: 'Standard Software Engineer Onboarding',
          type: 'onboarding',
          departmentId: engineeringDept._id.toString(),
          tasks: [
            {
              title: 'Sign Non-Disclosure & Security Policy Agreement',
              description: 'Review and e-sign information security policies.',
              category: 'hr',
              roleAssignee: 'employee',
              dueDaysOffset: 1,
              isMandatory: true
            },
            {
              title: 'Setup Laptop, SSH Keys & GitHub Access',
              description: 'Configure corporate workstation and install developer tooling.',
              category: 'it',
              roleAssignee: 'it_admin',
              dueDaysOffset: 0,
              isMandatory: true
            },
            {
              title: 'Initial Sprint Onboarding & Buddy Meetup',
              description: 'Pair with assigned mentor and review Jira backlog.',
              category: 'department',
              roleAssignee: 'manager',
              dueDaysOffset: 3,
              isMandatory: true
            }
          ],
          isActive: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Standard Software Engineer Onboarding');
      expect(res.body.data.tasks).toHaveLength(3);
      testTemplateId = res.body.data._id;
    });

    it('18.1-2: Rejects duplicate checklist template name with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/templates')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          name: 'Standard Software Engineer Onboarding',
          type: 'onboarding',
          tasks: [
            {
              title: 'Duplicate test task',
              category: 'hr',
              roleAssignee: 'employee'
            }
          ]
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('18.1-3: Regular Employee cannot create checklist template (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding/templates')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Rogue Employee Template',
          type: 'onboarding',
          tasks: [{ title: 'Unauthorized Task', category: 'hr' }]
        });

      expect(res.status).toBe(403);
    });

    it('18.1-4: List checklist templates filtered by department and type', async () => {
      const res = await request(app)
        .get(`/api/v1/onboarding/templates?type=onboarding&departmentId=${engineeringDept._id}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('18.1-5: Update template tasks and details', async () => {
      const res = await request(app)
        .put(`/api/v1/onboarding/templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          name: 'Updated Engineering Onboarding Blueprint',
          tasks: [
            {
              title: 'Sign Agreement',
              category: 'hr',
              roleAssignee: 'employee',
              dueDaysOffset: 1,
              isMandatory: true
            },
            {
              title: 'Setup Laptop',
              category: 'it',
              roleAssignee: 'it_admin',
              dueDaysOffset: 0,
              isMandatory: true
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Engineering Onboarding Blueprint');
      expect(res.body.data.tasks).toHaveLength(2);
    });
  });

  // =========================================================================
  // SLICE 2: AUTOMATED ONBOARDING CHECKLIST INGESTION (BUILD-GUIDE Row 18.2)
  // =========================================================================
  describe('Slice 2: Automated Employee Onboarding Ingestion (Row 18.2)', () => {
    it('18.2-1: Automatically instantiates onboarding checklist upon employee creation', async () => {
      newHireEmp = await createEmployee(
        {
          name: 'Diana Newhire',
          firstName: 'Diana',
          lastName: 'Newhire',
          email: 'diana.hire@company.com',
          phone: '+92-300-1122334',
          cnic: '42101-9988776-5',
          departmentId: engineeringDept._id.toString(),
          managerId: deptManagerEmp._id.toString(),
          joiningDate: new Date('2025-01-10'),
          employmentType: 'Permanent',
          status: 'Active'
        },
        hrManagerUser
      );

      expect(newHireEmp).toBeDefined();
      expect(newHireEmp._id).toBeDefined();

      // Assert Checklist Instance was auto-created
      const checklist = await Checklist.findOne({
        employeeId: newHireEmp._id,
        type: 'onboarding'
      });

      expect(checklist).toBeDefined();
      expect(checklist.status).toBe('in_progress');
      expect(checklist.tasks.length).toBeGreaterThanOrEqual(2);
      activeChecklistId = checklist._id;
    });

    it('18.2-2: Horizontal Scoping: HR Manager sees all onboarding workflows', async () => {
      const res = await request(app)
        .get('/api/v1/onboarding')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some((c) => c._id === activeChecklistId.toString())).toBe(true);
    });

    it('18.2-3: Horizontal Scoping: Department Manager sees department onboarding instances', async () => {
      const res = await request(app)
        .get('/api/v1/onboarding')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some((c) => c._id === activeChecklistId.toString())).toBe(true);
    });
  });

  // =========================================================================
  // SLICE 3: TASK OWNERSHIP & COMPLETION TRACKING (BUILD-GUIDE Row 18.3)
  // =========================================================================
  describe('Slice 3: Task Ownership & Completion Tracking (Row 18.3)', () => {
    it('18.3-1: HR Manager / Admin can mark task as complete and update progress percentage', async () => {
      const checklist = await Checklist.findById(activeChecklistId);
      const firstTask = checklist.tasks[0];

      const res = await request(app)
        .patch(`/api/v1/onboarding/tasks/${firstTask._id}/complete`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ notes: 'Signed via DocuSign by candidate' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Checklist.findById(activeChecklistId);
      expect(updated.tasks[0].completed).toBe(true);
      expect(updated.progressPercent).toBeGreaterThan(0);
    });

    it('18.3-2: Non-owner employee cannot complete tasks assigned to other employees (HTTP 403)', async () => {
      const checklist = await Checklist.findById(activeChecklistId);
      const pendingTask = checklist.tasks.find((t) => !t.completed);

      const res = await request(app)
        .patch(`/api/v1/onboarding/tasks/${pendingTask._id}/complete`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ notes: 'Unauthorized attempt' });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SLICE 4: EMPLOYEE RESIGNATION SUBMISSION (BUILD-GUIDE Row 18.5)
  // =========================================================================
  describe('Slice 4: Employee Resignation Submission (Row 18.5)', () => {
    it('18.5-1: Employee submits formal resignation with intended last working day', async () => {
      const intendedDate = new Date();
      intendedDate.setDate(intendedDate.getDate() + 30);

      const res = await request(app)
        .post('/api/v1/resignations')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          intendedLastWorkingDay: intendedDate.toISOString().split('T')[0],
          reason: 'better_opportunity',
          comments: 'Pursuing higher responsibilities elsewhere. Thank you for the opportunity.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('submitted');
      activeResignationId = res.body.data._id;
    });

    it('18.5-2: Blocks duplicate resignation submission while active under review (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/resignations')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          intendedLastWorkingDay: new Date().toISOString().split('T')[0],
          reason: 'relocation'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already in progress/i);
    });

    it('18.5-3: Employee views their own active resignation status', async () => {
      const res = await request(app)
        .get('/api/v1/resignations/my')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(activeResignationId);
      expect(res.body.data.status).toBe('submitted');
    });
  });

  // =========================================================================
  // SLICE 5: RESIGNATION DECISION & NOTICE PERIOD (BUILD-GUIDE Row 18.6)
  // =========================================================================
  describe('Slice 5: Resignation Decision & Notice Period Management (Row 18.6)', () => {
    it('18.6-1: Manager / HR accepts resignation and establishes official last working day', async () => {
      const lwd = new Date();
      lwd.setDate(lwd.getDate() + 14);

      const res = await request(app)
        .patch(`/api/v1/resignations/${activeResignationId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          status: 'accepted',
          officialLastWorkingDay: lwd.toISOString().split('T')[0],
          comments: 'Accepted with standard 2-week knowledge transfer.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('accepted');

      // Verify employee status transitioned to 'Notice'
      const updatedEmp = await Employee.findById(employeeEmp._id);
      expect(updatedEmp.status).toBe('Notice');

      // Verify Offboarding checklist automatically created
      const offboardChecklist = await Checklist.findOne({
        employeeId: employeeEmp._id,
        type: 'offboarding'
      });
      expect(offboardChecklist).toBeDefined();
      activeOffboardingId = offboardChecklist._id;
    });
  });

  // =========================================================================
  // SLICE 9: WELCOME EMAIL DISPATCH (BUILD-GUIDE Row 18.4)
  // =========================================================================
  describe('Slice 9: Welcome Email Dispatch (Row 18.4)', () => {
    it('18.4-1: HR Manager dispatches welcome email to new hire', async () => {
      const res = await request(app)
        .post(`/api/v1/onboarding/${activeChecklistId}/welcome-email`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =========================================================================
  // SLICE 10: CONFIDENTIAL EXIT INTERVIEW (BUILD-GUIDE Row 18.8)
  // (Submitted during notice period while user account is active)
  // =========================================================================
  describe('Slice 10: Confidential Exit Interview Questionnaire (Row 18.8)', () => {
    it('18.8-1: Employee submits exit interview feedback during notice period', async () => {
      const res = await request(app)
        .post('/api/v1/exit-interviews')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          resignationId: activeResignationId.toString(),
          ratings: {
            cultureRating: 4,
            managementRating: 4,
            compensationRating: 3,
            workLifeBalanceRating: 5,
            careerGrowthRating: 3
          },
          primaryReason: 'Higher compensation and leadership opportunity.',
          feedbackManagement: 'Great leadership and technical guidance.',
          feedbackCompany: 'Competitive benefits and supportive culture.',
          wouldRecommend: true
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isConfidential).toBe(true);
    });

    it('18.8-2: Department Manager is blocked from viewing confidential exit interview (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/exit-interviews/${activeResignationId}`)
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(403);
    });

    it('18.8-3: HR Manager can inspect confidential exit interview', async () => {
      const res = await request(app)
        .get(`/api/v1/exit-interviews/${activeResignationId}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.primaryReason).toMatch(/Higher compensation/i);
    });
  });

  // =========================================================================
  // SLICE 6: CROSS-DEPARTMENTAL EXIT CLEARANCE & ASSET LOCK (BUILD-GUIDE Row 18.7)
  // =========================================================================
  describe('Slice 6: Cross-Departmental Exit Clearance & Asset Return Lock (Row 18.7)', () => {
    let assignedAsset;

    it('18.7-1: Exit clearance is blocked with HTTP 400 if employee holds active company assets', async () => {
      // Assign physical laptop to Bob
      assignedAsset = await Asset.create({
        assetTag: 'AST-LTP-099',
        name: 'MacBook Pro M3',
        type: 'laptop',
        serialNumber: 'SN-MBP-099',
        status: 'assigned',
        assignedTo: employeeEmp._id
      });

      const res = await request(app)
        .post(`/api/v1/offboarding/${activeOffboardingId}/clear`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ departmentCategory: 'it' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/AST-LTP-099/i);
    });

    it('18.7-2: Clearance sign-off succeeds once all assets are returned', async () => {
      // Mark asset returned
      assignedAsset.status = 'available';
      assignedAsset.assignedTo = null;
      await assignedAsset.save();

      const res = await request(app)
        .post(`/api/v1/offboarding/${activeOffboardingId}/clear`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ departmentCategory: 'it', notes: 'MacBook returned in good condition' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checklist = await Checklist.findById(activeOffboardingId);
      const itTask = checklist.tasks.find((t) => t.category === 'it');
      expect(itTask.completed).toBe(true);
    });
  });

  // =========================================================================
  // SLICE 7: FINAL SETTLEMENT LINKAGE (BUILD-GUIDE Row 18.9)
  // =========================================================================
  describe('Slice 7: Final Settlement Linkage (Row 18.9)', () => {
    it('18.9-1: Aggregates settlement summary for cleared staff', async () => {
      const res = await request(app)
        .get(`/api/v1/offboarding/${activeOffboardingId}/settlement-summary`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.employeeId).toBe(employeeEmp._id.toString());
      expect(res.body.data.employeeName).toBe('Bob Developer');
    });
  });

  // =========================================================================
  // SLICE 11: EXPERIENCE & RELIEVING LETTER PDF STREAMING (BUILD-GUIDE Row 18.10)
  // =========================================================================
  describe('Slice 11: Experience & Relieving Letter PDF Generation (Row 18.10)', () => {
    it('18.10-1: Rejects letter download if clearance is incomplete (HTTP 400)', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${employeeEmp._id}/letters/relieving`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/clearances must be completed/i);
    });

    it('18.10-2: Streams Experience Letter PDF when all clearances are completed', async () => {
      // Complete remaining clearance categories: finance, department, hr
      await request(app)
        .post(`/api/v1/offboarding/${activeOffboardingId}/clear`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ departmentCategory: 'finance' });

      await request(app)
        .post(`/api/v1/offboarding/${activeOffboardingId}/clear`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ departmentCategory: 'department' });

      await request(app)
        .post(`/api/v1/offboarding/${activeOffboardingId}/clear`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ departmentCategory: 'hr' });

      const res = await request(app)
        .get(`/api/v1/employees/${employeeEmp._id}/letters/experience`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('18.10-3: Streams Relieving Letter PDF', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${employeeEmp._id}/letters/relieving`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });

  // =========================================================================
  // SLICE 8: SCHEDULED ACCOUNT DEACTIVATION (BUILD-GUIDE Row 18.11)
  // =========================================================================
  describe('Slice 8: Scheduled Account Deactivation (Row 18.11)', () => {
    it('18.11-1: Deactivates user portal access and transitions status to Resigned when LWD arrives', async () => {
      // Set officialLastWorkingDay to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await Resignation.findByIdAndUpdate(activeResignationId, {
        officialLastWorkingDay: yesterday
      });

      const res = await request(app)
        .post('/api/v1/offboarding/trigger-deactivation')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deactivatedCount).toBeGreaterThanOrEqual(1);

      // Verify user account deactivated
      const user = await User.findById(employeeUser._id);
      expect(user.isActive).toBe(false);

      // Verify employee status is Resigned
      const emp = await Employee.findById(employeeEmp._id);
      expect(emp.status).toBe('Resigned');
    });
  });
});
