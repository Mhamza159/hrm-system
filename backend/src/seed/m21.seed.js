/**
 * @file m21.seed.js
 * @description Seed script for Module M21 Anonymous Feedback & Grievance.
 */

import mongoose from 'mongoose';
import { Feedback } from '../models/feedback.model.js';
import { Department } from '../models/department.model.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { env } from '../config/env.js';

export async function seedFeedbackData() {
  console.log('🌱 [SEED M21] Bootstrapping Anonymous Feedback & Grievance demo data...');

  const [adminUser, hrUser, empUser] = await Promise.all([
    User.findOne({ email: 'mhamzaofficial159@gmail.com' }),
    User.findOne({ email: 'hr@hrm.company.pk' }),
    User.findOne({ email: 'employee@hrm.company.pk' })
  ]);

  let engDept = await Department.findOne({ code: 'ENG' });
  if (!engDept) {
    engDept = await Department.findOne();
  }

  // Ensure "Inquiry Committee" role exists with grievance.committee permission
  let committeeRole = await Role.findOne({ name: 'Inquiry Committee' });
  if (!committeeRole) {
    committeeRole = await Role.create({
      name: 'Inquiry Committee',
      description: 'Designated committee for quarantined harassment & integrity investigations',
      permissions: [
        { action: 'grievance.committee', subject: 'Feedback', scope: 'all' },
        { action: 'feedback.submit', subject: 'Feedback', scope: 'own' }
      ]
    });
    console.log('✅ [SEED M21] Inquiry Committee role created');
  }

  // Clean existing demo seed feedback
  await Feedback.deleteMany({ trackingCode: /^TRK-DEMO-/ });

  const demoItems = [
    {
      title: 'Install ergonomic keyboard trays in Engineering Bay 3',
      description: 'Several engineers have complained of wrist fatigue during sprint deliverables. Ergonomic adjustable keyboard trays would boost comfort and productivity.',
      category: 'Suggestion',
      priority: 'Low',
      isAnonymous: true,
      submittedBy: null,
      trackingCode: 'TRK-DEMO-SUGG1',
      departmentId: engDept?._id,
      status: 'Under Review',
      caseNotes: [
        {
          note: 'Reviewed by facilities management; evaluating desk bracket compatibility.',
          authorId: hrUser?._id || adminUser?._id,
          authorName: hrUser?.name || 'HR Manager',
          isPublicToComplainant: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'AC cooling unit non-functional in North Wing',
      description: 'The North Wing 2nd floor air conditioning unit has been failing intermittently, causing room temperatures to exceed 29C during peak hours.',
      category: 'Workplace Issue',
      priority: 'Medium',
      isAnonymous: false,
      submittedBy: empUser?._id,
      trackingCode: 'TRK-DEMO-AC002',
      departmentId: engDept?._id,
      status: 'In Investigation',
      caseNotes: [
        {
          note: 'HVAC repair contractor scheduled for diagnostic inspection.',
          authorId: hrUser?._id || adminUser?._id,
          authorName: hrUser?.name || 'HR Manager',
          isPublicToComplainant: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Delayed overtime compensation reimbursement',
      description: 'Weekend emergency production hotfix shift hours submitted for last month have not reflected in payroll compensation run.',
      category: 'Grievance',
      priority: 'High',
      isAnonymous: false,
      submittedBy: empUser?._id,
      trackingCode: 'TRK-DEMO-ESC03',
      departmentId: engDept?._id,
      status: 'Escalated',
      isEscalated: true,
      escalationReason: 'Cross-departmental finance and HR reconciliation required beyond standard operational cycle.',
      escalatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      escalatedBy: hrUser?._id || adminUser?._id,
      caseNotes: [
        {
          note: 'Initial review conducted with payroll officer; documentation confirmed valid.',
          authorId: hrUser?._id || adminUser?._id,
          authorName: hrUser?.name || 'HR Manager',
          isPublicToComplainant: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          note: 'Case escalated to Super Admin for expedited executive financial authorization.',
          authorId: hrUser?._id || adminUser?._id,
          authorName: hrUser?.name || 'HR Manager',
          isPublicToComplainant: true,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Confidential Workplace Misconduct Report',
      description: 'Formal confidential disclosure regarding inappropriate remarks and hostile demeanor during after-hours team sprint wrap-up.',
      category: 'Harassment',
      priority: 'Urgent',
      isAnonymous: true,
      submittedBy: null,
      trackingCode: 'TRK-DEMO-HRSS4',
      departmentId: engDept?._id,
      status: 'In Investigation',
      assignedTo: adminUser?._id,
      caseNotes: [
        {
          note: 'Quarantined file opened; routed exclusively to Harassment Inquiry Committee per protection policy.',
          authorId: adminUser?._id,
          authorName: 'System Administrator',
          isPublicToComplainant: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          note: 'Independent statement intake and committee review session scheduled.',
          authorId: adminUser?._id,
          authorName: 'Inquiry Committee Chair',
          isPublicToComplainant: true,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Emergency exit fire door latch jammed',
      description: 'The rear emergency fire exit on the ground floor cafeteria was stuck and required excessive force to disengage.',
      category: 'Safety',
      priority: 'Urgent',
      isAnonymous: false,
      submittedBy: empUser?._id,
      trackingCode: 'TRK-DEMO-SAFE5',
      departmentId: engDept?._id,
      status: 'Resolved',
      resolutionNote: 'Building facilities dispatched technician; emergency crash bar replaced and verified operational.',
      resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      resolvedBy: hrUser?._id || adminUser?._id,
      caseNotes: [
        {
          note: 'Facilities team dispatched on priority emergency ticket.',
          authorId: hrUser?._id || adminUser?._id,
          authorName: hrUser?.name || 'HR Manager',
          isPublicToComplainant: true,
          createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
        },
        {
          note: 'Hardware replaced, door tested and full safety clearance certified.',
          authorId: hrUser?._id || adminUser?._id,
          authorName: hrUser?.name || 'HR Manager',
          isPublicToComplainant: true,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const item of demoItems) {
    await Feedback.create(item);
  }

  console.log(`✅ [SEED M21] Created ${demoItems.length} demo Feedback & Grievance records successfully!`);
}

// If run directly
if (process.argv[1]?.endsWith('m21.seed.js')) {
  mongoose.connect(env.MONGO_URI).then(async () => {
    await seedFeedbackData();
    process.exit(0);
  });
}
