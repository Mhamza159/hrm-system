/**
 * @file seedPerformanceData.js
 * @description Seeds realistic real-time Performance & Appraisal data (M19):
 * KPI Templates, Review Cycles (Q3 Closed, Q4 Active), Goals, Self Reviews, Manager Appraisals, Peer Feedback.
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { Employee } from '../models/employee.model.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import KpiTemplate from '../models/kpiTemplate.model.js';
import ReviewCycle from '../models/reviewCycle.model.js';
import Review from '../models/review.model.js';

export async function seedPerformance() {
  console.log('🚀 [SEED M19] Connecting to MongoDB...');
  await connectDB();

  // 1. Identify Admin Actor
  const adminUser = await User.findOne({ isActive: true }).populate('roles');
  if (!adminUser) {
    throw new Error('No active admin user found in database.');
  }

  // 2. Fetch all active employees
  const employees = await Employee.find({ isDeleted: false })
    .populate('departmentId designationId managerId');

  if (employees.length === 0) {
    throw new Error('No employees found to seed performance reviews for.');
  }

  console.log(`📋 Found ${employees.length} employees. Proceeding with KPI templates...`);

  // 3. Clear legacy test performance data if needed
  await Review.deleteMany({});
  await ReviewCycle.deleteMany({});
  await KpiTemplate.deleteMany({});
  console.log('🧹 Cleared legacy reviews, cycles, and KPI templates for clean seeding.');

  // 4. Create Designation-Wise KPI Templates
  const designations = await Designation.find({ isDeleted: false });
  const templateMap = new Map();

  for (const desig of designations) {
    let kpis = [];
    const titleLower = (desig.title || '').toLowerCase();

    if (titleLower.includes('software') || titleLower.includes('engineer') || titleLower.includes('developer')) {
      kpis = [
        {
          title: 'Sprint Velocity & Feature Delivery',
          description: 'Delivering assigned user stories within agreed sprint estimation and timeline.',
          weightage: 35,
          targetCriteria: '>= 90% planned sprint story points delivered on schedule with 0 blockers.'
        },
        {
          title: 'Code Quality, Test Coverage & Architecture',
          description: 'Adhering to clean code principles, DRY architecture, and unit test coverage.',
          weightage: 25,
          targetCriteria: '>= 80% test coverage, 0 critical Sonar/ESLint security defects.'
        },
        {
          title: 'API Resilience & Database Efficiency',
          description: 'Designing performant REST endpoints, index-optimized Mongo queries, and defensive validations.',
          weightage: 20,
          targetCriteria: 'API response times < 200ms at 95th percentile, zero unindexed collection scans.'
        },
        {
          title: 'Peer Collaboration & Technical Mentorship',
          description: 'Constructive code reviews, unblocking peers, and contributing to technical architecture discussions.',
          weightage: 20,
          targetCriteria: 'Pull request reviews completed within 24h; active team knowledge sharing.'
        }
      ];
    } else if (titleLower.includes('hr') || titleLower.includes('human') || titleLower.includes('people')) {
      kpis = [
        {
          title: 'Talent Acquisition & Time-to-Hire',
          description: 'Sourcing, screening, and onboarding top candidates within approved requisitions.',
          weightage: 35,
          targetCriteria: 'Fill approved engineering & operations positions within 25 calendar days.'
        },
        {
          title: 'Employee Retention & Engagement',
          description: 'Driving workplace culture, grievance resolution, and retention initiatives.',
          weightage: 30,
          targetCriteria: 'Maintain quarterly voluntary turnover < 7%; eNPS score >= 45.'
        },
        {
          title: 'HR Policy Compliance & Audit Trails',
          description: 'Maintaining 100% compliant personnel records, labour law documentation, and payroll inputs.',
          weightage: 20,
          targetCriteria: 'Zero compliance findings in monthly payroll and attendance audits.'
        },
        {
          title: 'People Development & Training Programs',
          description: 'Coordinating internal upskilling sessions, leadership workshops, and quarterly appraisals.',
          weightage: 15,
          targetCriteria: 'Deliver at least 2 structured employee development workshops per quarter.'
        }
      ];
    } else if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('executive')) {
      kpis = [
        {
          title: 'Strategic Delivery & Roadmap Execution',
          description: 'Executing company quarters milestones on schedule and aligned with executive OKRs.',
          weightage: 35,
          targetCriteria: '100% on-time milestone delivery across cross-functional departmental projects.'
        },
        {
          title: 'Operational Excellence & Uptime SLAs',
          description: 'Maintaining system reliability, incident resolution SLAs, and customer satisfaction.',
          weightage: 25,
          targetCriteria: 'Maintain 99.9% service uptime; P1 incidents resolved within 1 hour.'
        },
        {
          title: 'Team Empowerment, Retention & Velocity',
          description: 'Mentoring direct reports, conducting 1-on-1s, and fostering high-performance autonomy.',
          weightage: 25,
          targetCriteria: 'Zero unplanned departmental attrition; conduct bi-weekly 1-on-1s with all reports.'
        },
        {
          title: 'Cost Optimization & Tech Debt Management',
          description: 'Optimizing infrastructure spend and retiring legacy technical debt quarterly.',
          weightage: 15,
          targetCriteria: 'Reduce cloud infrastructure costs by 10%; eliminate 3 high-priority debt items.'
        }
      ];
    } else {
      kpis = [
        {
          title: 'Core Deliverables & Job Execution',
          description: 'High-quality completion of designated daily tasks and corporate projects.',
          weightage: 40,
          targetCriteria: 'Complete >= 95% of monthly assigned tasks with verified accuracy.'
        },
        {
          title: 'Punctuality, Process Discipline & Compliance',
          description: 'Adhering to standard operating procedures, documentation, and operational protocols.',
          weightage: 30,
          targetCriteria: 'Consistent on-time attendance and prompt response to client/team requests.'
        },
        {
          title: 'Initiative, Collaboration & Professional Growth',
          description: 'Demonstrating proactive problem solving, cross-team teamwork, and continuous learning.',
          weightage: 30,
          targetCriteria: 'Participate actively in company learning sessions and support team members.'
        }
      ];
    }

    const tpl = await KpiTemplate.create({
      name: `${desig.title} Performance Framework`,
      designationId: desig._id,
      description: `Official enterprise KPI evaluation criteria for ${desig.title} role.`,
      kpis,
      isActive: true,
      createdBy: adminUser._id
    });

    templateMap.set(desig._id.toString(), tpl);
    console.log(`✅ Created KPI Template for Designation: ${desig.title}`);
  }

  // 5. Create Review Cycle 1: Q3 2026 Mid-Year Appraisal (Closed & Historical)
  const q3Cycle = await ReviewCycle.create({
    title: 'Q3 2026 Mid-Year Performance Appraisal',
    periodType: 'quarterly',
    periodQuarter: 'Q3',
    periodYear: 2026,
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-09-30'),
    selfReviewDeadline: new Date('2026-10-10'),
    managerReviewDeadline: new Date('2026-10-20'),
    status: 'Closed',
    totalReviewsCount: employees.length,
    completedReviewsCount: employees.length,
    createdBy: adminUser._id
  });
  console.log(`✅ Created Review Cycle: ${q3Cycle.title} (Status: Closed)`);

  // Seed Historical Finalized Reviews for Q3
  for (const emp of employees) {
    const tpl = emp.designationId ? templateMap.get(emp.designationId._id.toString()) : null;
    const reviewKpis = (tpl?.kpis || []).map((k) => ({
      title: k.title,
      description: k.description,
      weightage: k.weightage,
      targetCriteria: k.targetCriteria,
      selfRating: 4,
      selfComments: 'Successfully achieved all quarter milestones and supported team members.',
      managerRating: 5,
      managerComments: 'Outstanding performance, delivered beyond initial expectations.'
    }));

    await Review.create({
      cycleId: q3Cycle._id,
      employeeId: emp._id,
      departmentId: emp.departmentId?._id || emp.departmentId,
      designationId: emp.designationId?._id || emp.designationId,
      managerId: emp.managerId?._id || emp.managerId || adminUser.employeeId || employees[0]._id,
      status: 'Finalized',
      kpis: reviewKpis,
      goals: [
        {
          title: 'Complete Core Module Overhaul',
          description: 'Deliver scalable refactored endpoints and verified responsive UI.',
          targetValue: '100%',
          metricUnit: 'Percentage',
          weightage: 50,
          selfRating: 5,
          selfComments: 'Completed ahead of schedule.',
          managerRating: 5,
          managerComments: 'Flawless execution.'
        }
      ],
      selfReview: {
        submitted: true,
        submittedAt: new Date('2026-10-05T10:30:00Z'),
        overallSummary: 'High-performing quarter with consistent velocity and strong collaboration.',
        calculatedScore: 4.4
      },
      managerReview: {
        submitted: true,
        submittedAt: new Date('2026-10-15T15:00:00Z'),
        strengths: 'Deep domain expertise, strong accountability, and high-quality deliverables.',
        improvements: 'Continue documenting complex architectural patterns for new joiners.',
        recommendedIncrementPercent: 10,
        recommendationNotes: 'Recommended for merit increment based on stellar Q3 contribution.',
        calculatedScore: 4.7
      },
      finalAppraisal: {
        finalRating: 5,
        finalScore: 4.7,
        finalComments: 'Exceptional contribution recognized by executive management. Approved 10% merit increment.',
        approvedIncrementPercent: 10,
        finalizedBy: adminUser._id,
        finalizedAt: new Date('2026-10-18T12:00:00Z')
      }
    });
  }
  console.log(`✅ Seeded ${employees.length} historical finalized reviews for Q3 2026.`);

  // 6. Create Review Cycle 2: Q4 2026 Annual Performance Appraisal (Active)
  const q4Cycle = await ReviewCycle.create({
    title: 'Q4 2026 Annual Performance & Appraisal Cycle',
    periodType: 'annual',
    periodQuarter: 'Q4',
    periodYear: 2026,
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-12-31'),
    selfReviewDeadline: new Date('2026-11-20'),
    managerReviewDeadline: new Date('2026-11-30'),
    status: 'Active',
    totalReviewsCount: employees.length,
    completedReviewsCount: 1, // Huzaifa finalized
    createdBy: adminUser._id
  });
  console.log(`✅ Created Active Review Cycle: ${q4Cycle.title}`);

  // Seed Diverse Active Reviews for Q4 to showcase all workflow stages:
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const tpl = emp.designationId ? templateMap.get(emp.designationId._id.toString()) : null;
    const baseKpis = (tpl?.kpis || []).map((k) => ({
      title: k.title,
      description: k.description,
      weightage: k.weightage,
      targetCriteria: k.targetCriteria
    }));

    // Distribute employees across realistic states
    if (i === 0) {
      // 1. Huzaifa Hakim (or 1st emp): FINALIZED
      const kpisScored = baseKpis.map((k) => ({
        ...k,
        selfRating: 5,
        selfComments: 'Delivered mission-critical architecture ahead of time with 0 downtime.',
        managerRating: 5,
        managerComments: 'Exemplary leadership and technical execution.'
      }));

      await Review.create({
        cycleId: q4Cycle._id,
        employeeId: emp._id,
        departmentId: emp.departmentId?._id || emp.departmentId,
        designationId: emp.designationId?._id || emp.designationId,
        managerId: emp.managerId?._id || emp.managerId || adminUser.employeeId || emp._id,
        status: 'Finalized',
        kpis: kpisScored,
        goals: [
          {
            title: 'Lead Enterprise Microservices Optimization',
            description: 'Refactor database models and ensure < 150ms response times.',
            targetValue: '100%',
            metricUnit: '%',
            weightage: 50,
            selfRating: 5,
            selfComments: 'Achieved 120ms average response time.',
            managerRating: 5,
            managerComments: 'Superb outcome.'
          }
        ],
        selfReview: {
          submitted: true,
          submittedAt: new Date('2026-11-02T11:00:00Z'),
          overallSummary: 'Very productive year with major technical and operational breakthroughs.',
          calculatedScore: 4.8
        },
        managerReview: {
          submitted: true,
          submittedAt: new Date('2026-11-05T14:30:00Z'),
          strengths: 'Outstanding system design, proactive team mentorship, reliable execution.',
          improvements: 'Continue training junior colleagues on advanced debugging tools.',
          recommendedIncrementPercent: 12,
          recommendationNotes: 'Recommended for top-tier annual merit increment.',
          calculatedScore: 4.9
        },
        finalAppraisal: {
          finalRating: 5,
          finalScore: 4.85,
          finalComments: 'Approved by Executive Board. Excellent contribution throughout 2026.',
          approvedIncrementPercent: 12,
          finalizedBy: adminUser._id,
          finalizedAt: new Date('2026-11-07T16:00:00Z')
        }
      });
      console.log(`🌟 ${emp.name} (${emp.employeeCode}) seeded as: Finalized (Rating: 5.0, Increment: 12%)`);
    } else if (i === 1) {
      // 2. Basit Aulakh (or 2nd emp): READY FOR FINALIZATION (Manager review + 360 peer feedback complete)
      const peerReviewer = employees.find((e) => e._id.toString() !== emp._id.toString()) || employees[0];
      const kpisScored = baseKpis.map((k) => ({
        ...k,
        selfRating: 4,
        selfComments: 'Achieved all sprint deliverables and resolved critical bugs promptly.',
        managerRating: 4,
        managerComments: 'Consistently reliable developer with high work ethic.'
      }));

      await Review.create({
        cycleId: q4Cycle._id,
        employeeId: emp._id,
        departmentId: emp.departmentId?._id || emp.departmentId,
        designationId: emp.designationId?._id || emp.designationId,
        managerId: emp.managerId?._id || emp.managerId || adminUser.employeeId || emp._id,
        status: 'Ready_For_Finalization',
        kpis: kpisScored,
        goals: [
          {
            title: 'Deliver Responsive Web Components',
            description: 'Ensure 100% adherence to Forest & Emerald design specification.',
            targetValue: '100%',
            metricUnit: '%',
            weightage: 50,
            selfRating: 5,
            selfComments: 'Successfully modernized the frontend application.',
            managerRating: 4,
            managerComments: 'Great UI craft and attention to detail.'
          }
        ],
        selfReview: {
          submitted: true,
          submittedAt: new Date('2026-11-03T09:15:00Z'),
          overallSummary: 'Excited about our team progress and looking forward to scaling systems.',
          calculatedScore: 4.3
        },
        managerReview: {
          submitted: true,
          submittedAt: new Date('2026-11-06T17:00:00Z'),
          strengths: 'Fast learner, meticulous code styling, team player.',
          improvements: 'Take more initiative in early stage architecture discussions.',
          recommendedIncrementPercent: 10,
          recommendationNotes: 'Recommended for 10% salary revision.',
          calculatedScore: 4.5
        },
        peerFeedbacks: [
          {
            peerEmployeeId: peerReviewer._id,
            requestedBy: adminUser._id,
            requestedAt: new Date('2026-11-02T10:00:00Z'),
            submitted: true,
            submittedAt: new Date('2026-11-04T12:00:00Z'),
            rating: 5,
            comments: 'Pleasure to work with. Always responsive and supportive during crunches.',
            isAnonymous: true
          }
        ]
      });
      console.log(`⭐ ${emp.name} (${emp.employeeCode}) seeded as: Ready_For_Finalization (360 Peer Review included)`);
    } else if (i === 2) {
      // 3. Bilawal Haq (or 3rd emp): MANAGER REVIEW PENDING
      const kpisScored = baseKpis.map((k) => ({
        ...k,
        selfRating: 4,
        selfComments: 'Successfully managed organizational HR workflows and zero compliance breaches.'
      }));

      await Review.create({
        cycleId: q4Cycle._id,
        employeeId: emp._id,
        departmentId: emp.departmentId?._id || emp.departmentId,
        designationId: emp.designationId?._id || emp.designationId,
        managerId: emp.managerId?._id || emp.managerId || adminUser.employeeId || emp._id,
        status: 'Manager_Review',
        kpis: kpisScored,
        goals: [
          {
            title: 'Complete Annual Workforce Health Audit',
            description: 'Audit employee documents and ensure complete data integrity.',
            targetValue: '100%',
            metricUnit: '%',
            weightage: 50,
            selfRating: 4,
            selfComments: 'Audit completed for 100% of staff.'
          }
        ],
        selfReview: {
          submitted: true,
          submittedAt: new Date('2026-11-04T14:20:00Z'),
          overallSummary: 'Maintained strong HR alignment and delivered seamless onboarding support.',
          calculatedScore: 4.2
        }
      });
      console.log(`📝 ${emp.name} (${emp.employeeCode}) seeded as: Manager_Review (Self-Review submitted)`);
    } else {
      // 4. Fahad Shah / Others: SELF REVIEW PENDING
      await Review.create({
        cycleId: q4Cycle._id,
        employeeId: emp._id,
        departmentId: emp.departmentId?._id || emp.departmentId,
        designationId: emp.designationId?._id || emp.designationId,
        managerId: emp.managerId?._id || emp.managerId || adminUser.employeeId || emp._id,
        status: 'Self_Review',
        kpis: baseKpis,
        goals: [
          {
            title: 'Execute Quality Testing & Production Hardening',
            description: 'Implement thorough automated test suites and assist with bug triage.',
            targetValue: '90%',
            metricUnit: '%',
            weightage: 50
          }
        ]
      });
      console.log(`⏳ ${emp.name} (${emp.employeeCode}) seeded as: Self_Review (Waiting for employee self-appraisal)`);
    }
  }

  console.log('🎉 [SEED M19 COMPLETE] All real-time performance data successfully seeded!');
}

seedPerformance()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ [SEED M19 ERROR]', err);
    process.exit(1);
  });
