/**
 * @file m20.seed.js
 * @description Seed script for Module M20 Rewards, Celebrations & Surveys.
 */

import mongoose from 'mongoose';
import Award from '../models/award.model.js';
import AwardVote from '../models/awardVote.model.js';
import Appreciation from '../models/appreciation.model.js';
import Survey from '../models/survey.model.js';
import SurveyResponse from '../models/surveyResponse.model.js';
import { Employee } from '../models/employee.model.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import crypto from 'crypto';
import { env } from '../config/env.js';

export async function seedRewardsData() {
  console.log('🌱 [SEED M20] Bootstrapping Rewards, Celebrations & Surveys demo data...');

  const [adminUser, hrUser, mgrUser, empUser] = await Promise.all([
    User.findOne({ email: 'mhamzaofficial159@gmail.com' }),
    User.findOne({ email: 'hr@hrm.company.pk' }),
    User.findOne({ email: 'manager@hrm.company.pk' }),
    User.findOne({ email: 'employee@hrm.company.pk' })
  ]);

  let engDept = await Department.findOne({ code: 'ENG' });
  if (!engDept) {
    engDept = await Department.create({ name: 'Software Engineering', code: 'ENG' });
  }

  let devDesig = await Designation.findOne({ title: 'Senior Software Engineer' });
  if (!devDesig) {
    devDesig = await Designation.create({
      title: 'Senior Software Engineer',
      code: 'SSE-01',
      grade: 'Senior',
      departmentId: engDept._id
    });
  }

  // Ensure employees exist and link to users
  let emp1 = await Employee.findOne({ email: 'employee@hrm.company.pk' });
  if (!emp1) {
    emp1 = await Employee.create({
      employeeCode: 'EMP-M20-001',
      name: 'Bilal Ahmed',
      email: 'employee@hrm.company.pk',
      userId: empUser?._id,
      departmentId: engDept._id,
      designationId: devDesig._id,
      joiningDate: new Date('2022-11-09'), // Exactly today for 4-year anniversary!
      dob: new Date('1994-11-09'), // Birthday today!
      status: 'Active'
    });
  } else {
    emp1.joiningDate = new Date('2022-11-09');
    emp1.dob = new Date('1994-11-09');
    await emp1.save();
  }

  let emp2 = await Employee.findOne({ email: 'usman.tariq@hrm.enterprise.pk' });
  if (!emp2) {
    emp2 = await Employee.create({
      employeeCode: 'EMP-M20-002',
      name: 'Usman Tariq',
      email: 'usman.tariq@hrm.enterprise.pk',
      departmentId: engDept._id,
      designationId: devDesig._id,
      joiningDate: new Date('2023-01-15'),
      dob: new Date('1996-11-15'), // Upcoming birthday in 6 days
      status: 'Active'
    });
  } else {
    emp2.dob = new Date('1996-11-15');
    await emp2.save();
  }

  // 1. Seed Past Announced Award Cycle (October 2026)
  await Award.findOneAndUpdate(
    { month: '2026-10', title: 'Employee of the Month - October 2026' },
    {
      $set: {
        month: '2026-10',
        title: 'Employee of the Month - October 2026',
        status: 'announced',
        nominationDeadline: new Date('2026-10-15'),
        votingDeadline: new Date('2026-10-25'),
        winnerId: emp2._id,
        winnerCitation: 'Demonstrated stellar architectural leadership and delivered cloud migration with zero downtime.',
        prizeDetails: 'PKR 75,000 Cash Bonus & Crystal Star Plaque',
        announcedAt: new Date('2026-10-26'),
        createdBy: adminUser?._id || hrUser?._id,
        isDeleted: false
      }
    },
    { upsert: true }
  );

  // 2. Seed Active Voting Award Cycle (November 2026)
  const activeCycle = await Award.findOneAndUpdate(
    { month: '2026-11', title: 'Employee of the Month - November 2026' },
    {
      $set: {
        month: '2026-11',
        title: 'Employee of the Month - November 2026',
        status: 'voting',
        nominationDeadline: new Date(Date.now() + 86400000),
        votingDeadline: new Date(Date.now() + 86400000 * 7),
        prizeDetails: 'PKR 50,000 Bonus & Recognition Trophy',
        nominations: [
          {
            employeeId: emp1._id,
            nominatedBy: mgrUser?._id || adminUser?._id,
            reason: 'Exceptional resilience refactoring microservices and coaching junior developers.',
            shortlisted: true,
            nominatedAt: new Date()
          },
          {
            employeeId: emp2._id,
            nominatedBy: hrUser?._id || adminUser?._id,
            reason: 'Outstanding contribution to enterprise client integrations and prompt delivery.',
            shortlisted: true,
            nominatedAt: new Date()
          }
        ],
        createdBy: adminUser?._id || hrUser?._id,
        isDeleted: false
      }
    },
    { upsert: true, new: true }
  );

  // 3. Seed Peer Appreciation Kudos Feed
  await Appreciation.deleteMany({ message: /M20 DEMO/ });
  await Appreciation.create([
    {
      senderId: mgrUser?._id || adminUser?._id,
      receiverId: emp1._id,
      badge: 'Team Player',
      message: 'M20 DEMO: Huge shoutout to Bilal for staying late to assist with staging release verification!',
      likes: [hrUser?._id, adminUser?._id].filter(Boolean),
      isPublic: true
    },
    {
      senderId: hrUser?._id || adminUser?._id,
      receiverId: emp2._id,
      badge: 'Problem Solver',
      message: 'M20 DEMO: Usman rapidly fixed the critical payment webhook bug under 20 minutes. Incredible speed!',
      likes: [empUser?._id, adminUser?._id].filter(Boolean),
      isPublic: true
    },
    {
      senderId: adminUser?._id,
      receiverId: emp1._id,
      badge: 'Innovation Champ',
      message: 'M20 DEMO: Great initiative proposing automated smoke tests in our CI pipeline!',
      likes: [mgrUser?._id].filter(Boolean),
      isPublic: true
    }
  ]);

  // 4. Seed Pulse Survey with Responses & Analytics
  const sampleSurvey = await Survey.findOneAndUpdate(
    { title: 'Q4 2026 Workplace Wellbeing & Happiness' },
    {
      $set: {
        title: 'Q4 2026 Workplace Wellbeing & Happiness',
        description: 'Help leadership understand your work-life balance and team support anonymously.',
        type: 'pulse',
        isAnonymous: true,
        targetAudience: 'company',
        status: 'active',
        expiresAt: new Date(Date.now() + 86400000 * 14),
        questions: [
          {
            id: 'q1',
            questionText: 'How manageable has your workload been over the past month?',
            questionType: 'rating_5',
            required: true
          },
          {
            id: 'q2',
            questionText: 'How supported do you feel by your direct manager and team?',
            questionType: 'rating_5',
            required: true
          },
          {
            id: 'q3',
            questionText: 'What is one thing we can do to make your daily work easier?',
            questionType: 'text',
            required: false
          }
        ],
        createdBy: hrUser?._id || adminUser?._id,
        isDeleted: false
      }
    },
    { upsert: true, new: true }
  );

  // Seed sample responses for the survey to give rich analytics
  await SurveyResponse.deleteMany({ surveyId: sampleSurvey._id });
  const salt = env.JWT_ACCESS_SECRET || 'survey_anonymity_salt_key_2026';
  
  const dummyUsers = [
    { id: new mongoose.Types.ObjectId(), score1: 5, score2: 5, note: 'Awesome engineering culture and autonomy.' },
    { id: new mongoose.Types.ObjectId(), score1: 4, score2: 5, note: 'More flexible WFH options on Fridays would be great.' },
    { id: new mongoose.Types.ObjectId(), score1: 4, score2: 4, note: 'Great support from team leads.' }
  ];

  for (const du of dummyUsers) {
    const hash = crypto.createHash('sha256').update(`${du.id}:${sampleSurvey._id}:${salt}`).digest('hex');
    await SurveyResponse.create({
      surveyId: sampleSurvey._id,
      userHash: hash,
      userId: null,
      departmentId: engDept._id,
      answers: [
        { questionId: 'q1', answerValue: du.score1 },
        { questionId: 'q2', answerValue: du.score2 },
        { questionId: 'q3', answerValue: du.note }
      ]
    });
  }

  console.log('✅ [SEED M20] Rewards, Celebrations & Surveys demo data seeded successfully!');
}

// If run directly
if (process.argv[1]?.endsWith('m20.seed.js')) {
  mongoose.connect(env.MONGO_URI).then(async () => {
    await seedRewardsData();
    process.exit(0);
  });
}
