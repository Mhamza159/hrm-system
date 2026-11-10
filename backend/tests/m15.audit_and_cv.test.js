/**
 * @file m15.audit_and_cv.test.js
 * @description Comprehensive Audit & Security Test Suite for Recruitment & ATS Module.
 * 
 * COVERS:
 * 1. Authenticated CV Retrieval & Dynamic Fallback Stream (GET /candidates/:id/cv).
 * 2. PBAC Department Scope & Role Authorization on CV Viewing.
 * 3. Employee Referral Self-Service (GET /referrals/my) without 403 error.
 * 4. Token Query Parameter Authentication for PDF previews.
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
import { Job } from '../src/models/job.model.js';
import { Candidate } from '../src/models/candidate.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Recruitment & ATS Module Audit & Security Suite', () => {
  let superAdminToken;
  let hrToken;
  let deptManagerToken;
  let employeeToken;

  let testDept;
  let otherDept;
  let testDesig;
  let testJob;
  let candidateWithMissingFile;
  let employeeUser;
  let employeeRecord;

  const generateToken = (user) => {
    return jwt.sign(
      { userId: user._id, roles: user.roles.map((r) => r.name || r) },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace(/\/hrm_[a-zA-Z0-9_]+(\?|$)/, '/hrm_test_audit_cv$1');
    await mongoose.connect(testDbUri);

    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Designation.deleteMany({}),
      Employee.deleteMany({}),
      Job.deleteMany({}),
      Candidate.deleteMany({})
    ]);

    await seedRolesAndAdmin();

    const superAdmin = await User.findOne({ email: 'mhamzaofficial159@gmail.com' }).populate('roles');
    superAdminToken = generateToken(superAdmin);

    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    testDept = await Department.create({ name: 'Audit Department A', code: 'AUD-A', isActive: true });
    otherDept = await Department.create({ name: 'Audit Department B', code: 'AUD-B', isActive: true });

    testDesig = await Designation.create({
      title: 'Audit Specialist',
      code: 'AUD-01',
      grade: 'Mid',
      departmentId: testDept._id,
      isActive: true
    });

    // HR User
    const hrUser = await User.create({
      name: 'Audit HR',
      email: 'hr.audit@test.com',
      passwordHash: 'dummy',
      roles: [hrRole._id],
      isActive: true
    });
    hrUser.roles = [hrRole];
    hrToken = generateToken(hrUser);

    // Dept Manager User (assigned to otherDept)
    const deptManager = await User.create({
      name: 'Manager Dept B',
      email: 'deptb.audit@test.com',
      passwordHash: 'dummy',
      roles: [deptRole._id],
      isActive: true
    });
    const deptEmp = await Employee.create({
      employeeCode: 'EMP-MGR-B',
      name: 'Manager Dept B',
      email: 'deptb.audit@test.com',
      userId: deptManager._id,
      departmentId: otherDept._id,
      designationId: testDesig._id,
      employmentStatus: 'Active'
    });
    deptManager.employeeId = deptEmp._id;
    await deptManager.save();
    deptManager.roles = [deptRole];
    deptManagerToken = generateToken(deptManager);

    // Employee User
    employeeUser = await User.create({
      name: 'Audit Employee',
      email: 'emp.audit@test.com',
      passwordHash: 'dummy',
      roles: [empRole._id],
      isActive: true
    });
    employeeRecord = await Employee.create({
      employeeCode: 'EMP-AUD',
      name: 'Audit Employee',
      email: 'emp.audit@test.com',
      userId: employeeUser._id,
      departmentId: testDept._id,
      designationId: testDesig._id,
      employmentStatus: 'Active'
    });
    employeeUser.employeeId = employeeRecord._id;
    await employeeUser.save();
    employeeUser.roles = [empRole];
    employeeToken = generateToken(employeeUser);

    // Job in Department A
    testJob = await Job.create({
      title: 'Full Stack Engineer',
      slug: 'full-stack-engineer-audit',
      description: 'Full stack development engineering role in enterprise systems',
      departmentId: testDept._id,
      designationId: testDesig._id,
      employmentType: 'Full-time',
      status: 'Published',
      openingsCount: 2
    });

    // Candidate with missing local file (mimics Render ephemeral wipe / seed)
    candidateWithMissingFile = await Candidate.create({
      jobId: testJob._id,
      name: 'Audit Candidate',
      email: 'candidate.audit@test.com',
      phone: '03001234567',
      cvUrl: '/uploads/resumes/non_existent_file_12345.pdf',
      cvText: 'Experienced Node.js & React engineer with 5 years experience in enterprise cloud systems.',
      stage: 'Applied',
      aiScore: 88,
      aiScreeningReason: 'Strong alignment with MERN architecture requirements',
      parsedProfile: {
        candidateName: 'Audit Candidate',
        parsedSkills: ['Node.js', 'React', 'MongoDB', 'Express', 'Tailwind'],
        totalExperienceYears: 5,
        highestEducation: 'BS Computer Science',
        executiveSummary: 'Full-stack software architect specializing in scalable microservices.',
        matchingStrengths: ['Node.js', 'MongoDB', 'React'],
        missingSkills: ['Kubernetes']
      },
      referredBy: employeeRecord._id
    });
  }, 120000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('CV Document Viewing & Streaming Flow', () => {
    it('should reject unauthenticated request to candidate CV with 401', async () => {
      const res = await request(app).get(`/api/v1/recruitment/candidates/${candidateWithMissingFile._id}/cv`);
      expect(res.status).toBe(401);
    });

    it('should reject unauthorized employee without candidate.view with 403', async () => {
      const res = await request(app)
        .get(`/api/v1/recruitment/candidates/${candidateWithMissingFile._id}/cv`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject department manager from Department B viewing candidate from Department A with 403 (department scope isolation)', async () => {
      const res = await request(app)
        .get(`/api/v1/recruitment/candidates/${candidateWithMissingFile._id}/cv`)
        .set('Authorization', `Bearer ${deptManagerToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow authorized HR Manager to view CV, dynamically streaming fallback PDF if file was lost on disk', async () => {
      const res = await request(app)
        .get(`/api/v1/recruitment/candidates/${candidateWithMissingFile._id}/cv`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('Audit_Candidate_Curriculum_Vitae.pdf');
      expect(res.body.length).toBeGreaterThan(500); // Binary PDF content
    });

    it('should authenticate and serve CV via query parameter token (?token=...) for browser new-tab preview', async () => {
      const res = await request(app).get(
        `/api/v1/recruitment/candidates/${candidateWithMissingFile._id}/cv?token=${hrToken}`
      );

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('Employee Referrals Self-Service (GET /referrals/my)', () => {
    it('should allow regular Employee to view their own submitted referrals without 403 error', async () => {
      const res = await request(app)
        .get('/api/v1/recruitment/referrals/my')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].name).toBe('Audit Candidate');
      expect(res.body.data.items[0].jobId.title).toBe('Full Stack Engineer');
    });
  });
});
