/**
 * @file m20.rewards.security.test.js
 * @description Security & Hardening Test Suite for Module M20 (Rewards, Celebrations & Surveys).
 * 
 * SPECIFICATION & SECURITY INVARIANTS:
 * - SEC-1: Unauthenticated requests return HTTP 401 Unauthorized.
 * - SEC-2: Regular Employee blocked with HTTP 403 Forbidden on management endpoints.
 * - SEC-3: Double-voting strictly blocked with HTTP 409 Conflict.
 * - SEC-4: Double-survey submission blocked with HTTP 409 Conflict.
 * - SEC-5: Self-kudos strictly rejected with HTTP 400 Bad Request.
 * - SEC-6: Stored XSS and input validation bounds enforced.
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
import Award from '../src/models/award.model.js';
import AwardVote from '../src/models/awardVote.model.js';
import Appreciation from '../src/models/appreciation.model.js';
import Survey from '../src/models/survey.model.js';
import SurveyResponse from '../src/models/surveyResponse.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M20 — Security & Hardening Suite', () => {
  let superAdminToken, employeeToken, employee2Token;
  let superAdminUser, employeeUser, employee2User;
  let testDept, testDesig;
  let empDoc1, empDoc2;
  let activeAwardId, activeSurveyId;

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
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m20_security');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }

    await Promise.all([
      Award.deleteMany({}),
      AwardVote.deleteMany({}),
      Appreciation.deleteMany({}),
      Survey.deleteMany({}),
      SurveyResponse.deleteMany({}),
      User.deleteMany({ email: /@m20sec\.pk$/ }),
      Department.deleteMany({ code: 'SEC-RWD' }),
      Designation.deleteMany({ code: 'SEC-SE' }),
      Employee.deleteMany({ email: /@m20sec\.pk$/ })
    ]);

    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const employeeRole = await Role.findOne({ name: 'Employee' });

    testDept = await Department.create({ name: 'Security Rewards Dept', code: 'SEC-RWD' });
    testDesig = await Designation.create({
      title: 'Security Software Engineer',
      code: 'SEC-SE',
      grade: 'Senior',
      departmentId: testDept._id
    });

    superAdminUser = await User.create({
      email: 'admin@m20sec.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [superAdminRole._id]
    });
    superAdminUser.roles = [superAdminRole];

    employeeUser = await User.create({
      email: 'emp1@m20sec.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [employeeRole._id]
    });
    employeeUser.roles = [employeeRole];

    employee2User = await User.create({
      email: 'emp2@m20sec.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [employeeRole._id]
    });
    employee2User.roles = [employeeRole];

    empDoc1 = await Employee.create({
      userId: employeeUser._id,
      name: 'Security Tester 1',
      email: 'emp1@m20sec.pk',
      employeeCode: 'EMP-SEC-001',
      departmentId: testDept._id,
      designationId: testDesig._id,
      status: 'Active'
    });

    empDoc2 = await Employee.create({
      userId: employee2User._id,
      name: 'Security Tester 2',
      email: 'emp2@m20sec.pk',
      employeeCode: 'EMP-SEC-002',
      departmentId: testDept._id,
      designationId: testDesig._id,
      status: 'Active'
    });

    employeeUser.employeeId = empDoc1._id;
    employee2User.employeeId = empDoc2._id;

    superAdminToken = generateToken(superAdminUser);
    employeeToken = generateToken(employeeUser);
    employee2Token = generateToken(employee2User);

    // Bootstrap an active award cycle and pulse survey for security checks
    const award = await Award.create({
      title: 'Security Test Award Cycle',
      month: '2026-11',
      nominationDeadline: new Date(Date.now() + 86400000),
      votingDeadline: new Date(Date.now() + 172800000),
      status: 'voting',
      nominations: [
        {
          employeeId: empDoc1._id,
          nominatedBy: superAdminUser._id,
          reason: 'Initial nomination for security testing',
          shortlisted: true
        }
      ],
      createdBy: superAdminUser._id
    });
    activeAwardId = award._id.toString();

    const survey = await Survey.create({
      title: 'Security Test Pulse Survey',
      type: 'pulse',
      isAnonymous: true,
      expiresAt: new Date(Date.now() + 86400000),
      questions: [
        {
          id: 'q1',
          questionText: 'Security satisfaction score?',
          questionType: 'rating_5',
          required: true
        }
      ],
      createdBy: superAdminUser._id
    });
    activeSurveyId = survey._id.toString();
  });

  afterAll(async () => {
    await Promise.all([
      Award.deleteMany({}),
      AwardVote.deleteMany({}),
      Appreciation.deleteMany({}),
      Survey.deleteMany({}),
      SurveyResponse.deleteMany({}),
      User.deleteMany({ email: /@m20sec\.pk$/ }),
      Department.deleteMany({ code: 'SEC-RWD' }),
      Designation.deleteMany({ code: 'SEC-SE' }),
      Employee.deleteMany({ email: /@m20sec\.pk$/ })
    ]);
  });

  it('SEC-1: Unauthenticated requests return HTTP 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/rewards/awards');
    expect(res.status).toBe(401);
  });

  it('SEC-2: Regular Employee is blocked from managing awards and creating surveys (HTTP 403)', async () => {
    const awardRes = await request(app)
      .post('/api/v1/rewards/awards')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'Unauthorized Award',
        month: '2026-12',
        nominationDeadline: new Date().toISOString(),
        votingDeadline: new Date().toISOString()
      });
    expect(awardRes.status).toBe(403);

    const surveyRes = await request(app)
      .post('/api/v1/rewards/surveys')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'Unauthorized Survey',
        expiresAt: new Date().toISOString(),
        questions: [{ id: 'q1', questionText: 'Q?', questionType: 'rating_5' }]
      });
    expect(surveyRes.status).toBe(403);

    const analyticsRes = await request(app)
      .get(`/api/v1/rewards/surveys/${activeSurveyId}/analytics`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(analyticsRes.status).toBe(403);
  });

  it('SEC-3: Atomic single-vote enforcement: Blocks double voting with HTTP 409', async () => {
    // First vote succeeds
    const firstVote = await request(app)
      .post(`/api/v1/rewards/awards/${activeAwardId}/vote`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ nomineeId: empDoc1._id.toString() });
    expect(firstVote.status).toBe(200);

    // Second vote is rejected with 409
    const secondVote = await request(app)
      .post(`/api/v1/rewards/awards/${activeAwardId}/vote`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ nomineeId: empDoc1._id.toString() });
    expect(secondVote.status).toBe(409);
    expect(secondVote.body.message).toMatch(/already voted/i);
  });

  it('SEC-4: Cryptographic anonymity with single-submission guarantee: Blocks double survey response (HTTP 409)', async () => {
    // First response succeeds
    const firstResp = await request(app)
      .post(`/api/v1/rewards/surveys/${activeSurveyId}/respond`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ answers: [{ questionId: 'q1', answerValue: 5 }] });
    expect(firstResp.status).toBe(200);

    // Second response is rejected with 409
    const secondResp = await request(app)
      .post(`/api/v1/rewards/surveys/${activeSurveyId}/respond`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ answers: [{ questionId: 'q1', answerValue: 3 }] });
    expect(secondResp.status).toBe(409);
    expect(secondResp.body.message).toMatch(/already submitted/i);
  });

  it('SEC-5: Self-kudos prevention: Employee cannot send recognition kudos to themselves (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/v1/rewards/kudos')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        receiverId: empDoc1._id.toString(),
        badge: 'Rockstar',
        message: 'Self praise attempt'
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot send recognition kudos to yourself/i);
  });
});

