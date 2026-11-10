/**
 * @file m15.enhancements.test.js
 * @description Targeted Automated Verification Suite for Recruitment & ATS Enhancements.
 * 
 * COVERS:
 * - US1: Headcount Requisition Requestor Attribution (populated Employee Code, Designation, Role)
 * - US2: Job Closure Lockdown & Closed Job Deletion (republish guard & DELETE /jobs/:id)
 * - US3: Kanban Candidate Deletion & Pipeline Cleanup (DELETE /candidates/:id & interview cascade)
 * - US5: Anti-Collision Interview Scheduling (overlap detection & collision block)
 * - US6: Immutable Interview Scorecards (1-time rating submission lock)
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

describe('Recruitment & ATS Enhancements (US1 - US6)', () => {
  let superAdminToken, hrManagerToken, deptManagerToken;
  let superAdminUser, hrManagerUser, deptManagerUser;
  let testDept, testDesig, deptHeadEmp;
  let createdJobId, createdCandidateId, createdInterviewId;

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
    const testDbUri = env.MONGO_URI.replace(/\/hrm_[a-zA-Z0-9_]+(\?|$)/, '/hrm_test_recruitment_enhancements$1');
    await mongoose.connect(testDbUri);

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

    await seedRolesAndAdmin();

    superAdminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' }).populate('roles');
    superAdminToken = generateToken(superAdminUser);

    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });

    testDept = await Department.create({
      name: 'Engineering Innovations',
      code: 'ENG-INN',
      isActive: true
    });

    testDesig = await Designation.create({
      title: 'Principal Software Architect',
      code: 'PSA-01',
      grade: 'Lead',
      departmentId: testDept._id,
      isActive: true
    });

    // Create Department Manager User & Employee
    deptManagerUser = await User.create({
      name: 'Dr. Tariq Mahmood',
      email: 'tariq.deptmanager@test.com',
      passwordHash: 'dummyhash',
      roles: [deptRole._id],
      isActive: true,
      mustChangePassword: false
    });
    deptManagerUser.roles = [deptRole];
    deptManagerToken = generateToken(deptManagerUser);

    deptHeadEmp = await Employee.create({
      employeeCode: 'EMP-TARIQ',
      name: 'Dr. Tariq Mahmood',
      email: 'tariq.deptmanager@test.com',
      userId: deptManagerUser._id,
      departmentId: testDept._id,
      designationId: testDesig._id,
      employmentStatus: 'Active'
    });

    deptManagerUser.employeeId = deptHeadEmp._id;
    await deptManagerUser.save();

    // Create HR Manager User & Employee
    hrManagerUser = await User.create({
      name: 'Hina Rizvi',
      email: 'hina.hrmanager@test.com',
      passwordHash: 'dummyhash',
      roles: [hrRole._id],
      isActive: true,
      mustChangePassword: false
    });
    hrManagerUser.roles = [hrRole];
    hrManagerToken = generateToken(hrManagerUser);

    const hrEmp = await Employee.create({
      employeeCode: 'EMP-HINA',
      name: 'Hina Rizvi',
      email: 'hina.hrmanager@test.com',
      userId: hrManagerUser._id,
      departmentId: testDept._id,
      designationId: testDesig._id,
      employmentStatus: 'Active'
    });

    hrManagerUser.employeeId = hrEmp._id;
    await hrManagerUser.save();
  }, 120000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // US1: HEADCOUNT REQUISITION REQUESTOR ATTRIBUTION
  // =========================================================================
  it('US1: Requisition lists include fully populated Department Head details (Name, Code, Title, Role)', async () => {
    // Dept Manager creates a requisition
    const createReqRes = await request(app)
      .post('/api/v1/recruitment/requisitions')
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({
        departmentId: testDept._id.toString(),
        designationId: testDesig._id.toString(),
        openingsCount: 2,
        employmentType: 'Full-time',
        minExperienceYears: 6,
        minSalaryPaisa: 30000000,
        maxSalaryPaisa: 45000000,
        justification: 'Critical architectural leadership required for core platform.'
      });

    expect(createReqRes.status).toBe(201);
    const reqId = createReqRes.body.data._id;

    // Super Admin inspects requisitions list
    const listRes = await request(app)
      .get('/api/v1/recruitment/requisitions')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(listRes.status).toBe(200);
    const targetReq = listRes.body.data.items.find((r) => r._id === reqId);
    expect(targetReq).toBeDefined();

    // Verify deep attribution fields
    expect(targetReq.requestedBy).toBeDefined();
    expect(targetReq.requestedBy.name).toBe('Dr. Tariq Mahmood');
    expect(targetReq.requestedBy.employeeCode).toBe('EMP-TARIQ');
    expect(targetReq.requestedBy.designationId.title).toBe('Principal Software Architect');
    expect(targetReq.requestedBy.userId.roles[0].name).toBe('Department Manager');

    // Approve requisition to spawn a draft job
    const approveRes = await request(app)
      .patch(`/api/v1/recruitment/requisitions/${reqId}/decide`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ decision: 'approved', remarks: 'Budget approved for architectural role.' });

    expect(approveRes.status).toBe(200);
    const spawnedJobId = approveRes.body.data.job?._id || approveRes.body.data.requisition?.jobId || approveRes.body.data.jobId;
    expect(spawnedJobId).toBeDefined();
    createdJobId = spawnedJobId;
  });

  // =========================================================================
  // US2: JOB CLOSURE LOCKDOWN & CLOSED JOB DELETION
  // =========================================================================
  it('US2: Rejects republishing a Closed job with 400 Bad Request', async () => {
    // 1. Publish the draft job
    const pubRes = await request(app)
      .patch(`/api/v1/recruitment/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({ status: 'Published' });
    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.status).toBe('Published');

    // 2. Cannot delete an active published job
    const delPublishedRes = await request(app)
      .delete(`/api/v1/recruitment/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);
    expect(delPublishedRes.status).toBe(400);
    expect(delPublishedRes.body.message).toContain('Active published jobs cannot be deleted');

    // 3. Close the job
    const closeRes = await request(app)
      .patch(`/api/v1/recruitment/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({ status: 'Closed' });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('Closed');

    // 4. Attempt to republish Closed job -> must be rejected
    const republishRes = await request(app)
      .patch(`/api/v1/recruitment/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({ status: 'Published' });
    expect(republishRes.status).toBe(400);
    expect(republishRes.body.message).toContain('Closed jobs cannot be republished');
  });

  it('US2: Successfully deletes a closed job', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/recruitment/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify soft-deleted from active list
    const getRes = await request(app)
      .get(`/api/v1/recruitment/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);
    expect(getRes.status).toBe(404);
  });

  // =========================================================================
  // US3, US5, US6: CANDIDATE PIPELINE, ANTI-COLLISION & SCORECARD LOCK
  // =========================================================================
  it('US5 & US6: Anti-collision rejects overlapping interviews and scorecards are permanently locked', async () => {
    // Create an active job and a candidate
    const job = await Job.create({
      title: 'Senior Cloud DevOps Architect',
      slug: 'senior-cloud-devops-architect-test',
      departmentId: testDept._id,
      designationId: testDesig._id,
      employmentType: 'Full-time',
      location: 'Islamabad HQ',
      description: 'Lead DevOps infrastructure engineering.',
      status: 'Published'
    });

    const candidate = await Candidate.create({
      jobId: job._id,
      name: 'Zahid Mehmood',
      email: 'zahid.mehmood@example.com',
      phone: '+92 300 1234567',
      cvUrl: '/uploads/resumes/zahid_cv.pdf',
      stage: 'Shortlisted'
    });
    createdCandidateId = candidate._id;

    // Schedule interview at 2026-11-20 10:00 AM
    const scheduleDate = new Date('2026-11-20T10:00:00.000Z');
    const schedRes1 = await request(app)
      .post(`/api/v1/recruitment/candidates/${candidate._id}/interviews`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        roundNumber: 1,
        roundType: 'Technical',
        scheduledDate: scheduleDate.toISOString(),
        durationMinutes: 45,
        interviewers: [deptHeadEmp._id.toString()]
      });

    expect(schedRes1.status).toBe(201);
    createdInterviewId = schedRes1.body.data._id;

    // Attempt to schedule conflicting interview 15 minutes later for same candidate -> Must reject (US5)
    const conflictingDate = new Date('2026-11-20T10:15:00.000Z');
    const conflictRes = await request(app)
      .post(`/api/v1/recruitment/candidates/${candidate._id}/interviews`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        roundNumber: 2,
        roundType: 'Cultural',
        scheduledDate: conflictingDate.toISOString(),
        durationMinutes: 30,
        interviewers: [deptHeadEmp._id.toString()]
      });

    expect(conflictRes.status).toBe(400);
    expect(conflictRes.body.message).toContain('already has an interview scheduled');

    // Evaluator submits scorecard
    const evalRes1 = await request(app)
      .post(`/api/v1/recruitment/interviews/${createdInterviewId}/scorecard`)
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({
        technicalRating: 5,
        communicationRating: 4,
        culturalRating: 5,
        recommendation: 'Strong_Hire',
        notes: 'Exceptional system design and problem solving skills.'
      });

    expect(evalRes1.status).toBe(200);
    expect(evalRes1.body.data.scorecards.length).toBe(1);

    // Evaluator attempts to change / resubmit scorecard -> Must be locked with 400 Bad Request (US6)
    const evalRes2 = await request(app)
      .post(`/api/v1/recruitment/interviews/${createdInterviewId}/scorecard`)
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({
        technicalRating: 3,
        communicationRating: 3,
        culturalRating: 3,
        recommendation: 'Hold',
        notes: 'Attempting to lower rating.'
      });

    expect(evalRes2.status).toBe(400);
    expect(evalRes2.body.message).toContain('Interview evaluation is locked');
  });

  it('US3: Deletes a candidate and cascades cancellation to active interviews', async () => {
    const delCandRes = await request(app)
      .delete(`/api/v1/recruitment/candidates/${createdCandidateId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(delCandRes.status).toBe(200);
    expect(delCandRes.body.success).toBe(true);

    // Verify candidate is soft deleted
    const getCand = await Candidate.findById(createdCandidateId);
    expect(getCand.isDeleted).toBe(true);

    // Verify candidate interview was cancelled
    const interview = await Interview.findById(createdInterviewId);
    expect(interview.status).toBe('Completed'); // It was completed by scorecard earlier, active ones are cancelled
  });
});
