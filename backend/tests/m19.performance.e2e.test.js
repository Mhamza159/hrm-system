/**
 * @file m19.performance.e2e.test.js
 * @description Comprehensive Multi-Role Functional & Security E2E Test Suite for Module M19 (Performance & Appraisal).
 * 
 * SPECIFICATION & COVERAGE:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Rows 19.1 to 19.9)
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
import { Designation } from '../src/models/designation.model.js';
import { Employee } from '../src/models/employee.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import KpiTemplate from '../src/models/kpiTemplate.model.js';
import ReviewCycle from '../src/models/reviewCycle.model.js';
import Review from '../src/models/review.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M19 — Performance & Appraisal E2E Test Suite', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken, otherEmpToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser, otherEmpUser;
  let engineeringDept, salesDept;
  let devDesignation;
  let employeeEmp, deptManagerEmp, otherEmp;
  let activeKpiTemplateId;
  let activeReviewCycleId;
  let activeEmployeeReviewId;
  let activePeerRequestId;

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
      const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m19_performance');
      await mongoose.connect(testDbUri);
    }

    // Clean test collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Designation.deleteMany({}),
      Employee.deleteMany({}),
      SalaryStructure.deleteMany({}),
      KpiTemplate.deleteMany({}),
      ReviewCycle.deleteMany({}),
      Review.deleteMany({})
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
    const mgrRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    // Seed Departments
    engineeringDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    salesDept = await Department.create({
      name: 'Sales & Marketing',
      code: 'SAL',
      isActive: true
    });

    // Seed Designation
    devDesignation = await Designation.create({
      title: 'Full Stack Engineer',
      code: 'FSE',
      departmentId: engineeringDept._id,
      grade: 'Mid',
      isActive: true
    });

    // Seed HR Manager User
    hrManagerUser = await User.create({
      name: 'Fatima HR',
      email: 'hr.performance@hrm.company.pk',
      passwordHash: 'hashed_pw_test',
      roles: [hrRole._id],
      status: 'active',
      departmentId: engineeringDept._id
    });
    hrManagerUser.roles = [hrRole];
    hrManagerToken = generateToken(hrManagerUser);

    // Seed Department Manager User & Employee
    deptManagerUser = await User.create({
      name: 'Tariq Lead',
      email: 'tariq.lead@hrm.company.pk',
      passwordHash: 'hashed_pw_test',
      roles: [mgrRole._id],
      status: 'active',
      departmentId: engineeringDept._id
    });
    deptManagerUser.roles = [mgrRole];
    deptManagerToken = generateToken(deptManagerUser);

    deptManagerEmp = await Employee.create({
      userId: deptManagerUser._id,
      name: 'Tariq Lead',
      email: 'tariq.lead@hrm.company.pk',
      employeeCode: 'EMP-MGR-01',
      departmentId: engineeringDept._id,
      designationId: devDesignation._id,
      status: 'Active',
      joinDate: new Date('2022-01-01')
    });

    // Seed Employee User & Employee
    employeeUser = await User.create({
      name: 'Hamza Staff',
      email: 'hamza.staff@hrm.company.pk',
      passwordHash: 'hashed_pw_test',
      roles: [empRole._id],
      status: 'active',
      departmentId: engineeringDept._id
    });
    employeeUser.roles = [empRole];
    employeeToken = generateToken(employeeUser);

    employeeEmp = await Employee.create({
      userId: employeeUser._id,
      name: 'Hamza Staff',
      email: 'hamza.staff@hrm.company.pk',
      employeeCode: 'EMP-DEV-01',
      departmentId: engineeringDept._id,
      designationId: devDesignation._id,
      reportingTo: deptManagerEmp._id,
      status: 'Active',
      joinDate: new Date('2023-01-15')
    });

    // Seed active salary structure for employee (PKR 100,000 = 10,000,000 paisa)
    await SalaryStructure.create({
      employeeId: employeeEmp._id,
      effectiveFrom: new Date('2025-01-01'),
      currency: 'PKR',
      basicSalary: 10000000,
      houseRentAllowance: 4000000,
      medicalAllowance: 1000000,
      conveyanceAllowance: 1000000,
      otherAllowances: 0,
      grossSalary: 16000000,
      eobiEnabled: true,
      pessiEnabled: false,
      providentFundEnabled: false,
      status: 'active'
    });

    // Seed Peer Colleague
    otherEmpUser = await User.create({
      name: 'Ayesha Peer',
      email: 'ayesha.peer@hrm.company.pk',
      passwordHash: 'hashed_pw_test',
      roles: [empRole._id],
      status: 'active',
      departmentId: engineeringDept._id
    });
    otherEmpUser.roles = [empRole];
    otherEmpToken = generateToken(otherEmpUser);

    otherEmp = await Employee.create({
      userId: otherEmpUser._id,
      name: 'Ayesha Peer',
      email: 'ayesha.peer@hrm.company.pk',
      employeeCode: 'EMP-DEV-02',
      departmentId: engineeringDept._id,
      designationId: devDesignation._id,
      status: 'Active',
      joinDate: new Date('2023-03-01')
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // SLICE 1: KPI TEMPLATE MASTER AUTHORING (Row 19.1)
  // =========================================================================
  describe('Slice 1: Designation-Wise KPI Template Master Authoring (Row 19.1)', () => {
    it('19.1-1: HR Manager creates valid KPI template with weightage summing to 100%', async () => {
      const res = await request(app)
        .post('/api/v1/performance/templates')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          name: 'Engineering Core Technical KPIs',
          designationId: devDesignation._id.toString(),
          description: 'Core evaluation metrics for Full Stack Engineers',
          kpis: [
            {
              title: 'Code Delivery & Velocity',
              description: 'Deliver assigned sprint tickets on time',
              weightage: 50,
              targetCriteria: '>= 90% sprint goals met'
            },
            {
              title: 'Test Coverage & Code Quality',
              description: 'Maintain unit and integration tests',
              weightage: 30,
              targetCriteria: '>= 80% test coverage'
            },
            {
              title: 'Team Mentorship & Reviews',
              description: 'Review peers PRs and mentor junior devs',
              weightage: 20,
              targetCriteria: 'Positive feedback in peer reviews'
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Engineering Core Technical KPIs');
      expect(res.body.data.kpis).toHaveLength(3);
      activeKpiTemplateId = res.body.data._id;
    });

    it('19.1-2: Rejects KPI template when total weightage does not equal 100%', async () => {
      const res = await request(app)
        .post('/api/v1/performance/templates')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          name: 'Invalid Weightage Template',
          designationId: devDesignation._id.toString(),
          kpis: [
            {
              title: 'Partial Metric',
              weightage: 60,
              targetCriteria: 'Delivery'
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/100%/);
    });

    it('19.1-3: Rejects duplicate KPI template name for same designation with HTTP 409', async () => {
      const res = await request(app)
        .post('/api/v1/performance/templates')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          name: 'Engineering Core Technical KPIs',
          designationId: devDesignation._id.toString(),
          kpis: [
            {
              title: 'Solo Metric',
              weightage: 100,
              targetCriteria: 'Sole criteria'
            }
          ]
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('19.1-4: Lists KPI templates filtered by designation', async () => {
      const res = await request(app)
        .get(`/api/v1/performance/templates?designationId=${devDesignation._id.toString()}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('19.1-5: Regular employee blocked from creating KPI template (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/v1/performance/templates')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Unauthorized Template',
          designationId: devDesignation._id.toString(),
          kpis: [{ title: 'Metric', weightage: 100, targetCriteria: 'Done' }]
        });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SLICE 2: REVIEW CYCLES & AUTO-INSTANTIATION (Row 19.2)
  // =========================================================================
  describe('Slice 2: Review Cycles Orchestrator & Auto-Instantiation (Row 19.2)', () => {
    it('19.2-1: Rejects cycle when self-review deadline is after manager deadline (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/performance/cycles')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          title: 'Chronologically Invalid Cycle',
          periodType: 'quarterly',
          periodQuarter: 'Q3',
          periodYear: 2026,
          startDate: '2026-07-01',
          endDate: '2026-09-30',
          selfReviewDeadline: '2026-08-30',
          managerReviewDeadline: '2026-08-15' // Invalid: before self review deadline
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('19.2-2: HR Manager launches valid review cycle and auto-instantiates employee reviews', async () => {
      const res = await request(app)
        .post('/api/v1/performance/cycles')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          title: '2026 Q3 Enterprise Appraisal',
          periodType: 'quarterly',
          periodQuarter: 'Q3',
          periodYear: 2026,
          startDate: '2026-10-01',
          endDate: '2026-12-31',
          selfReviewDeadline: '2026-11-15',
          managerReviewDeadline: '2026-11-30'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Active');
      expect(res.body.data.totalReviewsCount).toBeGreaterThanOrEqual(2);
      activeReviewCycleId = res.body.data._id;

      // Verify Review was automatically instantiated for Hamza Staff with cloned KPIs
      const empReview = await Review.findOne({
        cycleId: activeReviewCycleId,
        employeeId: employeeEmp._id
      });

      expect(empReview).toBeTruthy();
      expect(empReview.status).toBe('Active');
      expect(empReview.kpis).toHaveLength(3);
      expect(empReview.kpis[0].title).toBe('Code Delivery & Velocity');
      activeEmployeeReviewId = empReview._id.toString();
    });

    it('19.2-3: Employee can query their active review instance', async () => {
      const res = await request(app)
        .get('/api/v1/performance/reviews')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]._id).toBe(activeEmployeeReviewId);
    });
  });

  // =========================================================================
  // SLICE 3: GOALS / OKRs MANAGEMENT (Row 19.3)
  // =========================================================================
  describe('Slice 3: Goals / OKRs Management & Period Setup (Row 19.3)', () => {
    it('19.3-1: Employee sets custom quarterly OKRs on active review', async () => {
      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${activeEmployeeReviewId}/goals`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          goals: [
            {
              title: 'Migrate Legacy Auth to PKCE & MFA',
              description: 'Zero downtime migration with 100% test coverage',
              targetValue: '100% migrated',
              metricUnit: 'Percentage',
              weightage: 50
            },
            {
              title: 'Maintain API Response Latency Under 200ms',
              description: 'Optimize MongoDB aggregation pipelines and add Redis caching',
              targetValue: '<200ms',
              metricUnit: 'Milliseconds',
              weightage: 50
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.goals).toHaveLength(2);
      expect(res.body.data.goals[0].title).toBe('Migrate Legacy Auth to PKCE & MFA');
    });

    it('19.3-2: Non-owner employee blocked from editing another employee goals (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${activeEmployeeReviewId}/goals`)
        .set('Authorization', `Bearer ${otherEmpToken}`)
        .send({
          goals: [{ title: 'Malicious Goal Modification', weightage: 100 }]
        });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SLICE 4: EMPLOYEE SELF-REVIEW SUBMISSION (Row 19.4)
  // =========================================================================
  describe('Slice 4: Employee Self-Review Submission with Deadline Locking (Row 19.4)', () => {
    it('19.4-1: Employee submits self-review ratings and weighted self-score is calculated', async () => {
      const reviewDoc = await Review.findById(activeEmployeeReviewId);
      const kpis = reviewDoc.kpis;
      const goals = reviewDoc.goals;

      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${activeEmployeeReviewId}/self`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          kpiRatings: [
            { kpiId: kpis[0]._id.toString(), rating: 5, comments: 'Exceeded sprint delivery expectations' },
            { kpiId: kpis[1]._id.toString(), rating: 4, comments: 'Maintained 85% coverage' },
            { kpiId: kpis[2]._id.toString(), rating: 5, comments: 'Mentored 2 junior engineers' }
          ],
          goalRatings: [
            { goalId: goals[0]._id.toString(), rating: 5, comments: 'Completed ahead of schedule' },
            { goalId: goals[1]._id.toString(), rating: 4, comments: 'Achieved average latency of 180ms' }
          ],
          overallSummary: 'Highly productive quarter with significant architecture and delivery milestones.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Manager_Review');
      expect(res.body.data.selfReview.submitted).toBe(true);
      // Expected weighted score: (5*50 + 4*30 + 5*20) / 100 = (250 + 120 + 100) / 100 = 4.7
      expect(res.body.data.selfReview.calculatedScore).toBe(4.7);
    });

    it('19.4-2: Rejects goal modification after self-review submission (HTTP 400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${activeEmployeeReviewId}/goals`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          goals: [{ title: 'Attempt to change goal post-submission' }]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/after self-review submission/i);
    });

    it('19.4-3: Blocks self-review submission if cycle deadline has passed (HTTP 400)', async () => {
      // Create an expired review cycle
      const expiredCycle = await ReviewCycle.create({
        title: '2025 Expired Cycle',
        periodType: 'annual',
        periodYear: 2025,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        selfReviewDeadline: new Date('2025-06-01'), // Past deadline
        managerReviewDeadline: new Date('2025-07-01'),
        status: 'Active',
        createdBy: hrManagerUser._id
      });

      const expiredReview = await Review.create({
        cycleId: expiredCycle._id,
        employeeId: otherEmp._id,
        departmentId: engineeringDept._id,
        designationId: devDesignation._id,
        kpis: [{ title: 'Test KPI', weightage: 100, targetCriteria: 'Done' }]
      });

      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${expiredReview._id}/self`)
        .set('Authorization', `Bearer ${otherEmpToken}`)
        .send({
          kpiRatings: [{ kpiId: expiredReview.kpis[0]._id.toString(), rating: 4 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/deadline has passed/i);
    });
  });

  // =========================================================================
  // SLICE 5: DEPARTMENT MANAGER REVIEW & SCORING (Row 19.5)
  // =========================================================================
  describe('Slice 5: Department Manager Review & Scoring (Row 19.5)', () => {
    it('19.5-1: Department Manager rates department subordinate with scores & recommendations', async () => {
      const reviewDoc = await Review.findById(activeEmployeeReviewId);
      const kpis = reviewDoc.kpis;

      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${activeEmployeeReviewId}/manager`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          kpiRatings: [
            { kpiId: kpis[0]._id.toString(), rating: 5, comments: 'Consistent delivery machine' },
            { kpiId: kpis[1]._id.toString(), rating: 4, comments: 'Solid test practices' },
            { kpiId: kpis[2]._id.toString(), rating: 4, comments: 'Great team player' }
          ],
          strengths: 'Outstanding problem solving and system architectural clarity',
          improvements: 'Continue building deeper domain expertise in cloud infrastructure',
          recommendedIncrementPercent: 12,
          recommendationNotes: 'Strongly recommend promotion to Senior Full Stack Engineer'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Ready_For_Finalization');
      expect(res.body.data.managerReview.submitted).toBe(true);
      // Expected manager score: (5*50 + 4*30 + 4*20) / 100 = (250 + 120 + 80) / 100 = 4.5
      expect(res.body.data.managerReview.calculatedScore).toBe(4.5);
      expect(res.body.data.managerReview.recommendedIncrementPercent).toBe(12);
    });

    it('19.5-2: Unauthorized manager outside department blocked from reviewing (HTTP 403)', async () => {
      // Create manager in Sales department
      const salesMgrRole = await Role.findOne({ name: 'Department Manager' });
      const salesMgrUser = await User.create({
        name: 'Farhan Sales',
        email: 'farhan.sales@hrm.company.pk',
        passwordHash: 'hashed_pw_test',
        roles: [salesMgrRole._id],
        departmentId: salesDept._id,
        status: 'active'
      });
      salesMgrUser.roles = [salesMgrRole];
      const salesMgrToken = generateToken(salesMgrUser);

      const reviewDoc = await Review.findById(activeEmployeeReviewId);
      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${activeEmployeeReviewId}/manager`)
        .set('Authorization', `Bearer ${salesMgrToken}`)
        .send({
          kpiRatings: [{ kpiId: reviewDoc.kpis[0]._id.toString(), rating: 3 }]
        });

      expect(res.status).toBe(403);
    });

    it('19.5-3: Department Manager sees department subordinates reviews in queue', async () => {
      const res = await request(app)
        .get('/api/v1/performance/reviews')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // SLICE 8: 360° PEER FEEDBACK (Row 19.6)
  // =========================================================================
  describe('Slice 8: 360° Peer Feedback (Row 19.6)', () => {
    it('19.6-1: Manager requests peer review from colleague Ayesha', async () => {
      const res = await request(app)
        .post(`/api/v1/performance/reviews/${activeEmployeeReviewId}/peer-request`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          peerEmployeeId: otherEmp._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.peerFeedbacks).toHaveLength(1);
      activePeerRequestId = res.body.data.peerFeedbacks[0]._id.toString();
    });

    it('19.6-2: Colleague submits confidential 360 peer feedback', async () => {
      const res = await request(app)
        .post(`/api/v1/performance/peer-feedback/${activePeerRequestId}`)
        .set('Authorization', `Bearer ${otherEmpToken}`)
        .send({
          rating: 5,
          comments: 'Hamza is an exceptional collaborator who consistently unblocks team members.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('19.6-3: Employee cannot view peer identity when retrieving review (Confidentiality)', async () => {
      const res = await request(app)
        .get(`/api/v1/performance/reviews/${activeEmployeeReviewId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const peer = res.body.data.peerFeedbacks[0];
      expect(peer).toBeTruthy();
      expect(peer.rating).toBe(5);
      // Confidentiality assertion: peerEmployeeId and requestedBy must be stripped
      expect(peer.peerEmployeeId).toBeUndefined();
      expect(peer.requestedBy).toBeUndefined();
    });
  });

  // =========================================================================
  // SLICE 6: FINAL APPRAISAL & M9 SALARY REVISION LINKAGE (Row 19.7)
  // =========================================================================
  describe('Slice 6: Final Appraisal & M9 Salary Revision Draft Linkage (Row 19.7)', () => {
    it('19.7-1: Department Manager blocked from final sign-off (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${activeEmployeeReviewId}/finalize`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          finalRating: 5,
          approvedIncrementPercent: 12
        });

      expect(res.status).toBe(403);
    });

    it('19.7-2: Super Admin finalizes appraisal with approved 12% increment and creates M9 draft salary revision', async () => {
      const res = await request(app)
        .patch(`/api/v1/performance/reviews/${activeEmployeeReviewId}/finalize`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          finalRating: 5,
          finalScore: 4.8,
          finalComments: 'Promoted to Senior Full Stack Engineer with approved 12% increment.',
          approvedIncrementPercent: 12
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Finalized');
      expect(res.body.data.finalAppraisal.finalRating).toBe(5);
      expect(res.body.data.finalAppraisal.approvedIncrementPercent).toBe(12);

      // Verify that M9 Payroll active SalaryStructure was updated with 12% increase
      const activeStructure = await SalaryStructure.findOne({
        employeeId: employeeEmp._id,
        status: 'active'
      });

      expect(activeStructure).toBeTruthy();
      // Original basic: 10,000,000 paisa * 1.12 = 11,200,000 paisa
      expect(activeStructure.basicSalary).toBe(11200000);
      expect(activeStructure.revisionReason).toMatch(/Performance Appraisal/);
    });
  });

  // =========================================================================
  // SLICE 9: HISTORICAL PERFORMANCE TIMELINE (Row 19.8)
  // =========================================================================
  describe('Slice 9: Historical Performance Appraisal Timeline (Row 19.8)', () => {
    it('19.8-1: Employee views their own finalized performance history', async () => {
      const res = await request(app)
        .get(`/api/v1/performance/employees/${employeeEmp._id}/history`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].finalAppraisal.finalRating).toBe(5);
      expect(res.body.data[0].finalAppraisal.approvedIncrementPercent).toBe(12);
    });

    it('19.8-2: Employee blocked from accessing another employee performance history (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/performance/employees/${deptManagerEmp._id}/history`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // SLICE 7: REVIEW CYCLE PROGRESS TRACKING (Row 19.9)
  // =========================================================================
  describe('Slice 7: Review Cycle Progress & Completion Tracking (Row 19.9)', () => {
    it('19.9-1: HR Manager queries cycle progress telemetry and aggregates completion rates', async () => {
      const res = await request(app)
        .get(`/api/v1/performance/cycles/${activeReviewCycleId}/progress`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cycleId).toBe(activeReviewCycleId);
      expect(res.body.data.finalizedCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.departmentBreakdown).toBeDefined();
    });
  });
});

