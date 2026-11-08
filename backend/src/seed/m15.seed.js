/**
 * @file m15.seed.js
 * @description Seed script for Module M15 (Recruitment & AI Resume Screening).
 * Populates requisitions, active jobs, candidates with AI fit scores, interviews, and internal referrals.
 */

import mongoose from 'mongoose';
import '../config/db.js';
import { env } from '../config/env.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { Employee } from '../models/employee.model.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { Requisition } from '../models/requisition.model.js';
import { Job } from '../models/job.model.js';
import { Candidate } from '../models/candidate.model.js';
import { Interview } from '../models/interview.model.js';

export const seedM15Recruitment = async () => {
  console.log('🌱 [M15 SEED] Initializing Recruitment & AI Screening seed data...');

  const dept = await Department.findOne({ isDeleted: false }) || await Department.create({
    name: 'Engineering & Technology',
    code: 'ENG',
    status: 'Active'
  });

  const desig = await Designation.findOne({ isDeleted: false }) || await Designation.create({
    title: 'Senior Software Engineer',
    code: 'SSE',
    departmentId: dept._id,
    grade: 'Senior',
    status: 'Active'
  });

  const managerEmp = await Employee.findOne({ employeeCode: 'EMP-0014' }) || await Employee.findOne({ isDeleted: false });
  const hrEmp = await Employee.findOne({ employeeCode: 'EMP-0016' }) || managerEmp;
  const devEmp = await Employee.findOne({ employeeCode: 'EMP-0015' }) || managerEmp;

  // 1. Requisitions (1 Pending, 1 Approved)
  await Requisition.deleteMany({ justification: /M15 SEED/i });

  const reqPending = await Requisition.create({
    departmentId: dept._id,
    designationId: desig._id,
    openingsCount: 2,
    minSalaryPaisa: 15000000,
    maxSalaryPaisa: 22000000,
    employmentType: 'Full-time',
    justification: 'M15 SEED: Urgent expansion for fintech payments architecture team.',
    requestedBy: managerEmp._id,
    status: 'Pending_Approval'
  });

  const reqApproved = await Requisition.create({
    departmentId: dept._id,
    designationId: desig._id,
    openingsCount: 1,
    minSalaryPaisa: 20000000,
    maxSalaryPaisa: 30000000,
    employmentType: 'Full-time',
    justification: 'M15 SEED: High concurrency backend lead required.',
    requestedBy: managerEmp._id,
    status: 'Approved',
    approvedBy: managerEmp.userId,
    decisionNotes: 'Approved during Q4 budget planning.'
  });

  // 2. Jobs (1 Published, 1 Draft)
  await Job.deleteMany({ title: /M15 SEED/i });

  const publishedJob = await Job.create({
    requisitionId: reqApproved._id,
    title: 'M15 SEED: Senior Full-Stack Engineer (Node & React)',
    slug: 'm15-seed-senior-full-stack-engineer-node-react',
    departmentId: dept._id,
    designationId: desig._id,
    description: 'We are seeking a seasoned Full-Stack Engineer with deep mastery of Node.js, Express, MongoDB, and React. You will architect high-scale microservices and real-time distributed dashboards.',
    requirements: [
      '5+ years experience in Node.js & React',
      'Solid grasp of MongoDB indexing and query optimization',
      'Experience with Redis caching and pub/sub',
      'Strong architecture and clean code discipline'
    ],
    skills: ['Node.js', 'React', 'MongoDB', 'Redis', 'Docker'],
    employmentType: 'Full-time',
    location: 'Lahore, Pakistan (Hybrid)',
    minSalaryPaisa: 20000000,
    maxSalaryPaisa: 30000000,
    openingsCount: 1,
    status: 'Published',
    isInternalOnly: false,
    postedBy: hrEmp._id
  });

  const internalJob = await Job.create({
    title: 'M15 SEED: Lead Cloud DevOps Specialist',
    slug: 'm15-seed-lead-cloud-devops-specialist',
    departmentId: dept._id,
    designationId: desig._id,
    description: 'Internal mobility role for infrastructure automation, Kubernetes orchestration, and CI/CD security pipelines.',
    requirements: ['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions'],
    skills: ['Kubernetes', 'AWS', 'Docker', 'Linux'],
    employmentType: 'Full-time',
    location: 'Islamabad, Pakistan',
    minSalaryPaisa: 25000000,
    maxSalaryPaisa: 35000000,
    openingsCount: 1,
    status: 'Published',
    isInternalOnly: true,
    postedBy: hrEmp._id
  });

  // 3. Candidates across Pipeline stages
  await Candidate.deleteMany({ email: /@m15seed\.com/i });

  const c1 = await Candidate.create({
    jobId: publishedJob._id,
    name: 'Zainab Qureshi',
    email: 'zainab.qureshi@m15seed.com',
    phone: '+92 300 1234567',
    cvUrl: '/uploads/resumes/zainab-qureshi-cv.pdf',
    currentStage: 'Applied',
    aiFitScore: 88,
    aiScreeningRationale: 'Candidate possesses 6 years of deep Node.js and React full-stack experience with production distributed microservices.',
    aiParsedProfile: {
      name: 'Zainab Qureshi',
      email: 'zainab.qureshi@m15seed.com',
      phone: '+92 300 1234567',
      yearsOfExperience: 6,
      skills: ['Node.js', 'React', 'MongoDB', 'Docker', 'TypeScript'],
      highestDegree: 'BS Computer Science (FAST-NUCES)'
    },
    source: 'Careers Portal',
    stageHistory: [{ stage: 'Applied', changedAt: new Date() }]
  });

  const c2 = await Candidate.create({
    jobId: publishedJob._id,
    name: 'Kamran Siddiqui',
    email: 'kamran.siddiqui@m15seed.com',
    phone: '+92 321 7654321',
    cvUrl: '/uploads/resumes/kamran-siddiqui-cv.pdf',
    currentStage: 'Screening',
    aiFitScore: 68,
    aiScreeningRationale: 'Candidate meets core React and JS requirements; partial backend background in Python with moderate Node exposure.',
    aiParsedProfile: {
      name: 'Kamran Siddiqui',
      email: 'kamran.siddiqui@m15seed.com',
      phone: '+92 321 7654321',
      yearsOfExperience: 4,
      skills: ['React', 'JavaScript', 'HTML5', 'Python', 'Git'],
      highestDegree: 'BS Information Technology (PUCIT)'
    },
    source: 'LinkedIn',
    stageHistory: [
      { stage: 'Applied', changedAt: new Date(Date.now() - 86400000 * 2) },
      { stage: 'Screening', changedAt: new Date(Date.now() - 86400000) }
    ]
  });

  const c3 = await Candidate.create({
    jobId: publishedJob._id,
    name: 'Tariq Mehmood',
    email: 'tariq.mehmood@m15seed.com',
    phone: '+92 333 9988776',
    cvUrl: '/uploads/resumes/tariq-mehmood-cv.pdf',
    currentStage: 'Interview',
    aiFitScore: 92,
    aiScreeningRationale: 'Exceptional alignment with Node/React stack and high scale microservices architecture.',
    aiParsedProfile: {
      name: 'Tariq Mehmood',
      email: 'tariq.mehmood@m15seed.com',
      phone: '+92 333 9988776',
      yearsOfExperience: 7,
      skills: ['Node.js', 'React', 'MongoDB', 'Redis', 'AWS', 'Kubernetes'],
      highestDegree: 'MS Software Engineering (LUMS)'
    },
    source: 'Referral',
    referredBy: devEmp._id,
    stageHistory: [
      { stage: 'Applied', changedAt: new Date(Date.now() - 86400000 * 5) },
      { stage: 'Screening', changedAt: new Date(Date.now() - 86400000 * 3) },
      { stage: 'Interview', changedAt: new Date(Date.now() - 86400000 * 1) }
    ]
  });

  const c4 = await Candidate.create({
    jobId: publishedJob._id,
    name: 'Asim Raza',
    email: 'asim.raza@m15seed.com',
    phone: '+92 345 5544332',
    cvUrl: '/uploads/resumes/asim-raza-cv.pdf',
    currentStage: 'Assessment',
    aiFitScore: 82,
    testAssignmentUrl: 'https://app.codesignal.com/assessment/hrm-fullstack-dev-01',
    aiScreeningRationale: 'Solid technical background in full-stack JavaScript with strong algorithm problem-solving abilities.',
    aiParsedProfile: {
      name: 'Asim Raza',
      email: 'asim.raza@m15seed.com',
      phone: '+92 345 5544332',
      yearsOfExperience: 5,
      skills: ['Node.js', 'React', 'PostgreSQL', 'Docker'],
      highestDegree: 'BS Computer Science (COMSATS)'
    },
    source: 'Careers Portal',
    stageHistory: [
      { stage: 'Applied', changedAt: new Date(Date.now() - 86400000 * 6) },
      { stage: 'Interview', changedAt: new Date(Date.now() - 86400000 * 3) },
      { stage: 'Assessment', changedAt: new Date(Date.now() - 86400000 * 1) }
    ]
  });

  const c5 = await Candidate.create({
    jobId: publishedJob._id,
    name: 'Danyal Ali',
    email: 'danyal.ali@m15seed.com',
    phone: '+92 312 1122334',
    cvUrl: '/uploads/resumes/danyal-ali-cv.pdf',
    currentStage: 'Offer',
    aiFitScore: 95,
    offerDetails: {
      baseSalaryPaisa: 25000000,
      joiningDate: new Date(Date.now() + 86400000 * 14),
      probationMonths: 3,
      allowances: [
        { title: 'Medical Allowance', amountPaisa: 2000000 },
        { title: 'Fuel & Commute', amountPaisa: 1500000 }
      ],
      issuedBy: hrEmp._id,
      issuedAt: new Date(),
      status: 'Issued'
    },
    aiScreeningRationale: 'Top rank candidate across all technical interviews and architectural domain assessments.',
    aiParsedProfile: {
      name: 'Danyal Ali',
      email: 'danyal.ali@m15seed.com',
      phone: '+92 312 1122334',
      yearsOfExperience: 8,
      skills: ['Node.js', 'React', 'MongoDB', 'System Architecture', 'Kafka'],
      highestDegree: 'BS Computer Science (NUST)'
    },
    source: 'Careers Portal',
    stageHistory: [
      { stage: 'Applied', changedAt: new Date(Date.now() - 86400000 * 10) },
      { stage: 'Interview', changedAt: new Date(Date.now() - 86400000 * 5) },
      { stage: 'Offer', changedAt: new Date() }
    ]
  });

  // 4. Interview for Tariq
  await Interview.deleteMany({ candidateId: c3._id });
  await Interview.create({
    candidateId: c3._id,
    jobId: publishedJob._id,
    roundName: 'Technical Architecture & Coding Round',
    interviewers: [managerEmp._id, devEmp._id],
    scheduledDate: new Date(Date.now() + 86400000 * 2),
    meetingLink: 'https://meet.google.com/hrm-tech-interview',
    status: 'Scheduled',
    scorecards: [
      {
        interviewerId: managerEmp._id,
        technicalRating: 5,
        communicationRating: 4,
        culturalRating: 5,
        recommendation: 'Strong_Hire',
        notes: 'Exemplary grasp of microservices resiliency patterns. Highly recommended.',
        submittedAt: new Date()
      }
    ]
  });

  console.log('✅ [M15 SEED] Recruitment Seed Completed Successfully:');
  console.log(`  - Requisitions: 2 (1 Pending, 1 Approved)`);
  console.log(`  - Published Jobs: 1 public (${publishedJob.slug}), 1 internal (${internalJob.slug})`);
  console.log(`  - Candidates: 5 across Applied, Screening, Interview, Assessment, Offer`);
  console.log(`  - Scheduled Interview: 1`);
};

if (process.argv[1]?.endsWith('m15.seed.js')) {
  try {
    await mongoose.connect(env.MONGO_URI);
    await seedM15Recruitment();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ [M15 SEED ERROR]:', err);
    process.exit(1);
  }
}
