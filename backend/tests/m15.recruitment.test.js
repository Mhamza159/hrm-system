/**
 * @file m15.recruitment.test.js
 * @description Comprehensive Multi-Role Test Suite for Module M15 (Recruitment & AI Screening).
 * 
 * SPECIFICATION & COVERAGE:
 * - BUILD-GUIDE Section 24 · Rows 15.1 to 15.13
 * - Roles: Super Admin, HR Manager, Department Manager, Employee, Public Unauthenticated
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
import { Requisition } from '../src/models/requisition.model.js';
import { Job } from '../src/models/job.model.js';
import { Candidate } from '../src/models/candidate.model.js';
import { Interview } from '../src/models/interview.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M15 — Recruitment & AI Screening Test Suite (Rows 15.1 - 15.13)', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser;
  let engineeringDept;
  let softwareEngDesig;
  let deptManagerEmp, employeeEmp;

  let createdRequisitionId;
  let createdJobId;
  let createdJobSlug;
  let createdCandidateId;
  let createdInterviewId;

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
    const testDbUri = env.MONGO_URI.replace(/\/hrm_[a-zA-Z0-9_]+(\?|$)/, '/hrm_test_m15_recruitment$1');
    await mongoose.connect(testDbUri);

    // Clean test collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Designation.deleteMany({}),
      Employee.deleteMany({}),
      Requisition.deleteMany({}),
      Job.deleteMany({}),
      Candidate.deleteMany({}),
      Interview.deleteMany({})
    ]);

    // Bootstrap roles and Super Admin
    await seedRolesAndAdmin();

    superAdminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' }).populate('roles');
    superAdminToken = generateToken(superAdminUser);

    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    // Create Test Department & Designation
    engineeringDept = await Department.create({
      name: 'Engineering & Technology',
      code: 'ENG'
    });

    softwareEngDesig = await Designation.create({
      title: 'Senior Full Stack Engineer',
      code: 'SR-FSE',
      grade: 'Senior',
      departmentId: engineeringDept._id
    });

    // Create Department Manager User & Employee
    deptManagerUser = await User.create({
      name: 'Basit Aulakh',
      email: 'basit.manager@hrm.test',
      passwordHash: 'dummyhash',
      isActive: true,
      roles: [deptRole._id]
    });
    deptManagerUser.roles = [deptRole];
    deptManagerToken = generateToken(deptManagerUser);

    deptManagerEmp = await Employee.create({
      userId: deptManagerUser._id,
      name: 'Basit Aulakh',
      employeeCode: 'EMP-M15-01',
      email: 'basit.manager@hrm.test',
      phone: '03001234567',
      departmentId: engineeringDept._id,
      designationId: softwareEngDesig._id,
      joiningDate: new Date('2024-01-01'),
      status: 'Active'
    });

    // Create HR Manager User
    hrManagerUser = await User.create({
      name: 'Bilawal HR',
      email: 'bilawal.hr@hrm.test',
      passwordHash: 'dummyhash',
      isActive: true,
      roles: [hrRole._id]
    });
    hrManagerUser.roles = [hrRole];
    hrManagerToken = generateToken(hrManagerUser);

    // Create Regular Employee User
    employeeUser = await User.create({
      name: 'Zeeshan Staff',
      email: 'zeeshan.staff@hrm.test',
      passwordHash: 'dummyhash',
      isActive: true,
      roles: [empRole._id]
    });
    employeeUser.roles = [empRole];
    employeeToken = generateToken(employeeUser);

    employeeEmp = await Employee.create({
      userId: employeeUser._id,
      name: 'Zeeshan Staff',
      employeeCode: 'EMP-M15-02',
      email: 'zeeshan.staff@hrm.test',
      phone: '03009876543',
      departmentId: engineeringDept._id,
      designationId: softwareEngDesig._id,
      joiningDate: new Date('2024-02-01'),
      status: 'Active'
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // =========================================================================
  // 15.1: JOB REQUISITION CREATION
  // =========================================================================
  it('15.1: Department Manager creates headcount requisition (Pending_Approval)', async () => {
    const res = await request(app)
      .post('/api/v1/recruitment/requisitions')
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({
        departmentId: engineeringDept._id.toString(),
        designationId: softwareEngDesig._id.toString(),
        openingsCount: 2,
        employmentType: 'Full-time',
        minExperienceYears: 3,
        minSalaryPaisa: 20000000, // PKR 200,000
        maxSalaryPaisa: 30000000, // PKR 300,000
        justification: 'Urgent headcount required for high-throughput messaging microservices.',
        requiredSkills: ['Node.js', 'React', 'MongoDB', 'Docker']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Pending_Approval');
    expect(res.body.data.openingsCount).toBe(2);
    expect(res.body.data.minSalaryPaisa).toBe(20000000);

    createdRequisitionId = res.body.data._id;
  });

  // =========================================================================
  // 15.2: REQUISITION DECISION & AUTOMATIC JOB DRAFT
  // =========================================================================
  it('15.2: Super Admin approves requisition, automatically creating a Draft Job', async () => {
    const res = await request(app)
      .patch(`/api/v1/recruitment/requisitions/${createdRequisitionId}/decide`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        decision: 'approved',
        remarks: 'Approved for Q4 engineering expansion.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requisition.status).toBe('Approved');
    expect(res.body.data.job).toBeDefined();
    expect(res.body.data.job.status).toBe('Draft');
    expect(res.body.data.job.slug).toBeDefined();

    createdJobId = res.body.data.job._id;
    createdJobSlug = res.body.data.job.slug;
  });

  // =========================================================================
  // 15.3: JOB PUBLISHING & PUBLIC CAREERS PORTAL
  // =========================================================================
  it('15.3: HR Manager publishes the job; Public endpoint displays published job only', async () => {
    // 1. Before publishing, public listing should NOT show the draft job
    const prePublicRes = await request(app).get('/api/v1/recruitment/public/jobs');
    expect(prePublicRes.status).toBe(200);
    expect(prePublicRes.body.data.items.length).toBe(0);

    // 2. HR publishes the job
    const updateRes = await request(app)
      .patch(`/api/v1/recruitment/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        status: 'Published',
        requirements: ['Node.js', 'React', 'MongoDB', 'REST API', 'Redis']
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('Published');

    // 3. Public endpoint now returns the published job without authentication
    const postPublicRes = await request(app).get('/api/v1/recruitment/public/jobs');
    expect(postPublicRes.status).toBe(200);
    expect(postPublicRes.body.data.items.length).toBe(1);
    expect(postPublicRes.body.data.items[0].slug).toBe(createdJobSlug);

    // 4. Public slug detail endpoint works
    const slugRes = await request(app).get(`/api/v1/recruitment/public/jobs/${createdJobSlug}`);
    expect(slugRes.status).toBe(200);
    expect(slugRes.body.data.title).toBe(updateRes.body.data.title);
  });

  // =========================================================================
  // 15.4: CANDIDATE APPLICATION & CV INGESTION
  // =========================================================================
  it('15.4: Candidate submits public application with CV (Applied stage, 30-day throttle)', async () => {
    const resumeContent = Buffer.from(
      '%PDF-1.4\nAyesha Siddiqua\nSenior Full Stack Developer\n5 years of experience in Node.js, React, Express, MongoDB, Redis, Docker.\nBachelor of Science in Computer Science.'
    );

    const res = await request(app)
      .post(`/api/v1/recruitment/public/jobs/${createdJobId}/apply`)
      .field('name', 'Ayesha Siddiqua')
      .field('email', 'ayesha.applicant@test.com')
      .field('phone', '+92 300 7654321')
      .field('linkedinUrl', 'https://linkedin.com/in/ayesha-test')
      .attach('cv', resumeContent, 'Ayesha_CV.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stage).toBe('Applied');
    expect(res.body.data.name).toBe('Ayesha Siddiqua');
    expect(res.body.data.cvUrl).toContain('/uploads/resumes/');

    createdCandidateId = res.body.data._id;

    // Verify 30-day anti-duplicate throttle
    const duplicateRes = await request(app)
      .post(`/api/v1/recruitment/public/jobs/${createdJobId}/apply`)
      .field('name', 'Ayesha Siddiqua')
      .field('email', 'ayesha.applicant@test.com')
      .field('phone', '+92 300 7654321')
      .attach('cv', resumeContent, 'Ayesha_CV.pdf');

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.message).toContain('already submitted an application');
  });

  // =========================================================================
  // 15.5 & 15.6: AI CV PARSING & MATCH SCORING
  // =========================================================================
  it('15.5 & 15.6: AI parsed profile and screening score (0-100) are generated', async () => {
    const res = await request(app)
      .get(`/api/v1/recruitment/candidates/${createdCandidateId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    const candidate = res.body.data.candidate;
    expect(candidate.aiScore).toBeGreaterThanOrEqual(0);
    expect(candidate.aiScore).toBeLessThanOrEqual(100);
    expect(candidate.parsedProfile.parsedSkills).toBeDefined();
    expect(candidate.parsedProfile.totalExperienceYears).toBeGreaterThanOrEqual(1);
    expect(candidate.aiScreeningReason).toBeDefined();
  });

  // =========================================================================
  // 15.7: KANBAN STAGE TRANSITIONS & HISTORY
  // =========================================================================
  it('15.7: HR transitions candidate stage to Shortlisted and verifies history', async () => {
    const res = await request(app)
      .patch(`/api/v1/recruitment/candidates/${createdCandidateId}/stage`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        stage: 'Shortlisted',
        notes: 'Shortlisted based on strong AI score and MERN experience.'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe('Shortlisted');
    expect(res.body.data.stageHistory.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.stageHistory.some((h) => h.stage === 'Shortlisted')).toBe(true);
  });

  // =========================================================================
  // 15.8: INTERVIEW SCHEDULING & SCORECARD SUBMISSION
  // =========================================================================
  it('15.8: Schedule interview round and submit interviewer scorecard', async () => {
    // 1. Schedule round
    const scheduleRes = await request(app)
      .post(`/api/v1/recruitment/candidates/${createdCandidateId}/interviews`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        roundNumber: 1,
        roundType: 'Technical',
        interviewers: [deptManagerEmp._id.toString()],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
        meetingLink: 'https://meet.google.com/test-room'
      });

    expect(scheduleRes.status).toBe(201);
    expect(scheduleRes.body.data.status).toBe('Scheduled');
    createdInterviewId = scheduleRes.body.data._id;

    // 2. Evaluator submits scorecard
    const scorecardRes = await request(app)
      .post(`/api/v1/recruitment/interviews/${createdInterviewId}/scorecard`)
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({
        technicalRating: 5,
        communicationRating: 4,
        culturalRating: 5,
        recommendation: 'Strong_Hire',
        notes: 'Exceptional deep dive on asynchronous event-driven design and MongoDB transaction isolation.'
      });

    expect(scorecardRes.status).toBe(200);
    expect(scorecardRes.body.data.scorecards.length).toBe(1);
    expect(scorecardRes.body.data.scorecards[0].recommendation).toBe('Strong_Hire');
    expect(scorecardRes.body.data.status).toBe('Completed');
  });

  // =========================================================================
  // 15.9: TECHNICAL ASSESSMENT DISPATCH
  // =========================================================================
  it('15.9: Dispatches technical test link to candidate', async () => {
    const res = await request(app)
      .post(`/api/v1/recruitment/candidates/${createdCandidateId}/technical-test`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        testUrl: 'https://github.com/hrm-enterprise/fullstack-eval-repo',
        instructions: 'Please clone and build the microservice within 48 hours.'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe('Technical_Test');
    expect(res.body.data.technicalTest.status).toBe('Pending_Submission');
    expect(res.body.data.technicalTest.testUrl).toBe('https://github.com/hrm-enterprise/fullstack-eval-repo');
  });

  // =========================================================================
  // 15.10: FORMAL OFFER LETTER & PDF STREAM
  // =========================================================================
  it('15.10: Issues formal offer and streams valid binary PDF', async () => {
    // 1. Issue offer
    const offerRes = await request(app)
      .post(`/api/v1/recruitment/candidates/${createdCandidateId}/offer`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        baseSalaryPaisa: 25000000, // PKR 250,000
        joiningDate: new Date('2026-12-01').toISOString(),
        probationMonths: 3,
        allowances: [
          { name: 'Medical', amountPaisa: 2000000 }
        ]
      });

    expect(offerRes.status).toBe(200);
    expect(offerRes.body.data.stage).toBe('Offer');
    expect(offerRes.body.data.offerDetails.status).toBe('Issued');

    // 2. Stream PDF
    const pdfRes = await request(app)
      .get(`/api/v1/recruitment/candidates/${createdCandidateId}/offer/pdf`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.body).toBeDefined();
  });

  // =========================================================================
  // 15.11: ONE-CLICK HIRE TO MODULE M3 & M18
  // =========================================================================
  it('15.11: One-Click Hire converts candidate to active Employee (M3) and initiates Onboarding (M18)', async () => {
    const res = await request(app)
      .post(`/api/v1/recruitment/candidates/${createdCandidateId}/hire`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        joiningDate: new Date('2026-12-01').toISOString(),
        initialSalaryPaisa: 25000000,
        managerId: deptManagerEmp._id.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.candidate.stage).toBe('Hired');
    expect(res.body.data.employee).toBeDefined();
    expect(res.body.data.employee.employeeCode).toMatch(/^EMP-/);
    expect(res.body.data.employee.status).toBe('Active');

    // Verify Employee exists in database
    const hiredEmp = await Employee.findById(res.body.data.employee._id);
    expect(hiredEmp).toBeDefined();
    expect(hiredEmp.email).toBe('ayesha.applicant@test.com');
  });

  // =========================================================================
  // 15.12: INTERNAL JOBS & EMPLOYEE REFERRAL
  // =========================================================================
  it('15.12: Active employee submits peer candidate referral', async () => {
    const resumeContent = Buffer.from('%PDF-1.4\nReferral CV for Farhan Ali, Senior React Developer.');

    const res = await request(app)
      .post('/api/v1/recruitment/referrals')
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('jobId', createdJobId.toString())
      .field('name', 'Farhan Ali')
      .field('email', 'farhan.referral@test.com')
      .field('phone', '+92 300 5551234')
      .field('referralNotes', 'Former colleague with 4 years React and state management expertise.')
      .attach('cv', resumeContent, 'Farhan_CV.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.referredBy).toBe(employeeEmp._id.toString());
    expect(res.body.data.referralNotes).toContain('Former colleague');
  });

  // =========================================================================
  // 15.13: HUMAN IN THE LOOP (ANTI AUTO-REJECTION GUARD)
  // =========================================================================
  it('15.13: Anti-auto-rejection guard retains candidate in Applied stage despite low score', async () => {
    const weakResume = Buffer.from('Applicant with minimal unrelated background in hospitality.');

    const res = await request(app)
      .post(`/api/v1/recruitment/public/jobs/${createdJobId}/apply`)
      .field('name', 'Low Match Candidate')
      .field('email', 'lowmatch@test.com')
      .field('phone', '+92 300 0000000')
      .attach('cv', weakResume, 'Resume.txt');

    expect(res.status).toBe(201);
    // Crucial check: Candidate MUST be in 'Applied', NOT automatically rejected by AI
    expect(res.body.data.stage).toBe('Applied');
  });
});
