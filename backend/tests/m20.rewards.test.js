/**
 * @file m20.rewards.test.js
 * @description Integration Test Suite for Module M20 (Rewards, Celebrations & Surveys).
 * 
 * SPECIFICATION & COVERAGE:
 * - BUILD-GUIDE Section 27 · Rows 20.1 to 20.5
 * - Tests: Award cycles, nominations, single-ballot voting, winner announcements,
 *          peer kudos wall, self-kudos rejection, celebrations lookahead,
 *          pulse surveys, single-response cryptographic guarantees, survey analytics.
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

describe('Module M20 — Rewards, Celebrations & Surveys Test Suite', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken, employee2Token;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser, employee2User;
  let engineeringDept, seDesignation;
  let employeeDoc1, employeeDoc2;
  let createdAwardId;
  let createdSurveyId;

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
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m20_rewards');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }

    // Clean test collections
    await Promise.all([
      Award.deleteMany({}),
      AwardVote.deleteMany({}),
      Appreciation.deleteMany({}),
      Survey.deleteMany({}),
      SurveyResponse.deleteMany({}),
      User.deleteMany({ email: /@testrewards\.pk$/ }),
      Department.deleteMany({ code: 'ENG-RWD' }),
      Designation.deleteMany({ code: 'SE-RWD' }),
      Employee.deleteMany({ email: /@testrewards\.pk$/ })
    ]);

    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrManagerRole = await Role.findOne({ name: 'HR Manager' });
    const deptManagerRole = await Role.findOne({ name: 'Department Manager' });
    const employeeRole = await Role.findOne({ name: 'Employee' });

    engineeringDept = await Department.create({
      name: 'Engineering Rewards',
      code: 'ENG-RWD'
    });

    seDesignation = await Designation.create({
      title: 'Software Engineer Rewards',
      code: 'SE-RWD',
      grade: 'Senior',
      departmentId: engineeringDept._id
    });

    // Users
    superAdminUser = await User.create({
      email: 'superadmin@testrewards.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [superAdminRole._id]
    });
    superAdminUser.roles = [superAdminRole];

    hrManagerUser = await User.create({
      email: 'hrmanager@testrewards.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [hrManagerRole._id]
    });
    hrManagerUser.roles = [hrManagerRole];

    deptManagerUser = await User.create({
      email: 'deptmanager@testrewards.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [deptManagerRole._id]
    });
    deptManagerUser.roles = [deptManagerRole];

    employeeUser = await User.create({
      email: 'emp1@testrewards.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [employeeRole._id]
    });
    employeeUser.roles = [employeeRole];

    employee2User = await User.create({
      email: 'emp2@testrewards.pk',
      passwordHash: '$2b$10$dummyhashedpasswordforsecuritytest',
      isActive: true,
      roles: [employeeRole._id]
    });
    employee2User.roles = [employeeRole];

    // Employees
    employeeDoc1 = await Employee.create({
      userId: employeeUser._id,
      name: 'Hamza Tariq',
      email: 'emp1@testrewards.pk',
      employeeCode: 'EMP-RWD-001',
      departmentId: engineeringDept._id,
      designationId: seDesignation._id,
      joiningDate: new Date('2022-05-15'),
      dob: new Date('1995-10-20'),
      status: 'Active'
    });

    employeeDoc2 = await Employee.create({
      userId: employee2User._id,
      name: 'Ayesha Khan',
      email: 'emp2@testrewards.pk',
      employeeCode: 'EMP-RWD-002',
      departmentId: engineeringDept._id,
      designationId: seDesignation._id,
      joiningDate: new Date('2023-08-01'),
      dob: new Date('1997-12-10'),
      status: 'Active'
    });

    employeeUser.employeeId = employeeDoc1._id;
    employee2User.employeeId = employeeDoc2._id;

    superAdminToken = generateToken(superAdminUser);
    hrManagerToken = generateToken(hrManagerUser);
    deptManagerToken = generateToken(deptManagerUser);
    employeeToken = generateToken(employeeUser);
    employee2Token = generateToken(employee2User);
  });

  afterAll(async () => {
    await Promise.all([
      Award.deleteMany({}),
      AwardVote.deleteMany({}),
      Appreciation.deleteMany({}),
      Survey.deleteMany({}),
      SurveyResponse.deleteMany({}),
      User.deleteMany({ email: /@testrewards\.pk$/ }),
      Department.deleteMany({ code: 'ENG-RWD' }),
      Designation.deleteMany({ code: 'SE-RWD' }),
      Employee.deleteMany({ email: /@testrewards\.pk$/ })
    ]);
  });

  // ==========================================
  // ROW 20.1: AWARDS & EMPLOYEE OF THE MONTH
  // ==========================================
  describe('Row 20.1: Employee of the Month Cycle & Voting', () => {
    it('1. Blocks unauthenticated users with 401', async () => {
      const res = await request(app).get('/api/v1/rewards/awards');
      expect(res.status).toBe(401);
    });

    it('2. Blocks regular Employee from creating an award cycle (403)', async () => {
      const res = await request(app)
        .post('/api/v1/rewards/awards')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Employee of the Month - Nov 2026',
          month: '2026-11',
          nominationDeadline: new Date(Date.now() + 86400000).toISOString(),
          votingDeadline: new Date(Date.now() + 172800000).toISOString()
        });

      expect(res.status).toBe(403);
    });

    it('3. HR Manager successfully creates a new award cycle (201)', async () => {
      const res = await request(app)
        .post('/api/v1/rewards/awards')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          title: 'Employee of the Month - Nov 2026',
          month: '2026-11',
          nominationDeadline: new Date(Date.now() + 86400000).toISOString(),
          votingDeadline: new Date(Date.now() + 172800000).toISOString(),
          prizeDetails: 'PKR 50,000 Bonus & Recognition Trophy'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.month).toBe('2026-11');
      expect(res.body.data.status).toBe('nomination');
      createdAwardId = res.body.data._id;
    });

    it('4. Department Manager nominates a candidate with citation (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/rewards/awards/${createdAwardId}/nominate`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          employeeId: employeeDoc1._id.toString(),
          reason: 'Exceptional performance refactoring our microservices and zero-downtime deployment.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nominations.length).toBe(1);
    });

    it('5. Prevents duplicate nomination of the same employee in the cycle (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/rewards/awards/${createdAwardId}/nominate`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          employeeId: employeeDoc1._id.toString(),
          reason: 'Duplicate nomination attempt citation here.'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already been nominated/i);
    });

    it('6. HR Manager shortlists the candidate and opens voting (200)', async () => {
      const award = await Award.findById(createdAwardId);
      const nominationId = award.nominations[0]._id.toString();

      // Shortlist
      const shortlistRes = await request(app)
        .patch(`/api/v1/rewards/awards/${createdAwardId}/nominations/${nominationId}/shortlist`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ shortlisted: true });
      expect(shortlistRes.status).toBe(200);

      // Open voting status
      const statusRes = await request(app)
        .patch(`/api/v1/rewards/awards/${createdAwardId}/status`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({ status: 'voting' });
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe('voting');
    });

    it('7. Employee casts a single ballot vote (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/rewards/awards/${createdAwardId}/vote`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ nomineeId: employeeDoc1._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/Ballot vote recorded/i);
    });

    it('8. Atomic single-vote: Prevents duplicate voting from the same user (409)', async () => {
      const res = await request(app)
        .post(`/api/v1/rewards/awards/${createdAwardId}/vote`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ nomineeId: employeeDoc1._id.toString() });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already voted/i);
    });

    it('9. HR Manager announces winner (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/rewards/awards/${createdAwardId}/announce`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          winnerId: employeeDoc1._id.toString(),
          winnerCitation: 'Winner of November 2026 for outstanding engineering leadership.',
          prizeDetails: 'PKR 50,000 Cash Reward + Trophy'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('announced');
      expect(res.body.data.winnerId._id.toString()).toBe(employeeDoc1._id.toString());
    });

    it('10. Retrieves vote statistics for announced cycle (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/rewards/awards/${createdAwardId}/stats`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalVotes).toBe(1);
      expect(res.body.data.breakdown.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================
  // ROW 20.2: PEER APPRECIATION WALL & BADGES
  // ==========================================
  describe('Row 20.2: Peer Appreciation Wall & Badges', () => {
    let createdKudosId;

    it('1. Blocks employee from sending appreciation kudos to themselves (400)', async () => {
      const res = await request(app)
        .post('/api/v1/rewards/kudos')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          receiverId: employeeDoc1._id.toString(),
          badge: 'Problem Solver',
          message: 'Trying to give myself kudos.'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot send recognition kudos to yourself/i);
    });

    it('2. Employee sends kudos to colleague (201)', async () => {
      const res = await request(app)
        .post('/api/v1/rewards/kudos')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          receiverId: employeeDoc2._id.toString(),
          badge: 'Team Player',
          message: 'Thank you for stepping up and helping on the release deadline!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.badge).toBe('Team Player');
      expect(res.body.data.receiverId._id.toString()).toBe(employeeDoc2._id.toString());
      createdKudosId = res.body.data._id;
    });

    it('3. Colleagues can view kudos feed and react/like (200)', async () => {
      // Toggle like by employee 2
      const likeRes = await request(app)
        .post(`/api/v1/rewards/kudos/${createdKudosId}/like`)
        .set('Authorization', `Bearer ${employee2Token}`);

      expect(likeRes.status).toBe(200);
      expect(likeRes.body.data.hasLiked).toBe(true);
      expect(likeRes.body.data.likesCount).toBe(1);

      // Fetch kudos feed
      const feedRes = await request(app)
        .get('/api/v1/rewards/kudos')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(feedRes.status).toBe(200);
      expect(feedRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(feedRes.body.data[0].badge).toBe('Team Player');
    });
  });

  // ==========================================
  // ROW 20.3: CELEBRATION WALL
  // ==========================================
  describe('Row 20.3: Celebration Wall & Milestones', () => {
    it('1. Retrieves today celebrations and upcoming lookahead (200)', async () => {
      const todayRes = await request(app)
        .get('/api/v1/rewards/celebrations/today')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(todayRes.status).toBe(200);
      expect(todayRes.body.data).toHaveProperty('birthdays');
      expect(todayRes.body.data).toHaveProperty('anniversaries');

      const upcomingRes = await request(app)
        .get('/api/v1/rewards/celebrations/upcoming?days=365')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(upcomingRes.status).toBe(200);
      expect(Array.isArray(upcomingRes.body.data)).toBe(true);
    });
  });

  // ==========================================
  // ROW 20.4 & 20.5: PULSE SURVEYS & ANALYTICS
  // ==========================================
  describe('Row 20.4 & 20.5: Pulse Surveys & Analytics', () => {
    it('1. HR Manager creates a pulse survey (201)', async () => {
      const res = await request(app)
        .post('/api/v1/rewards/surveys')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          title: 'Q4 2026 Team Wellness & Culture Check',
          description: 'Share your feedback on workload and workplace wellbeing anonymously.',
          type: 'pulse',
          isAnonymous: true,
          expiresAt: new Date(Date.now() + 864000000).toISOString(),
          questions: [
            {
              id: 'q1',
              questionText: 'How satisfied are you with work-life balance at our company?',
              questionType: 'rating_5',
              required: true
            },
            {
              id: 'q2',
              questionText: 'What is one thing the management could improve?',
              questionType: 'text',
              required: false
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAnonymous).toBe(true);
      createdSurveyId = res.body.data._id;
    });

    it('2. Employee submits an anonymous survey response (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/rewards/surveys/${createdSurveyId}/respond`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          answers: [
            { questionId: 'q1', answerValue: 5 },
            { questionId: 'q2', answerValue: 'Great flexibility and support from leadership.' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/submitted successfully/i);
    });

    it('3. Guarantees single-response per user via cryptographic hash: Blocks second submission (409)', async () => {
      const res = await request(app)
        .post(`/api/v1/rewards/surveys/${createdSurveyId}/respond`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          answers: [
            { questionId: 'q1', answerValue: 4 }
          ]
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already submitted a response/i);
    });

    it('4. Second employee submits response to pulse survey (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/rewards/surveys/${createdSurveyId}/respond`)
        .set('Authorization', `Bearer ${employee2Token}`)
        .send({
          answers: [
            { questionId: 'q1', answerValue: 4 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('5. HR Manager views survey analytics breakdown (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/rewards/surveys/${createdSurveyId}/analytics`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalResponses).toBe(2);
      expect(res.body.data.participationRate).toBeGreaterThan(0);
      expect(res.body.data.questionBreakdown[0].averageScore).toBe(4.5);
      expect(res.body.data.questionBreakdown[0].ratingCounts[5]).toBe(1);
      expect(res.body.data.questionBreakdown[0].ratingCounts[4]).toBe(1);
    });
  });
});

