/**
 * @file m16.seed.js
 * @description Database Seed Script for Module M16 HR Chatbot & Virtual Assistant.
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.1 to 16.10)
 * - Seeds: 4 Policy Documents, 2 Sample Escalated Questions, and Company Chatbot Settings.
 */

import mongoose from 'mongoose';
import { PolicyDoc } from '../models/policyDoc.model.js';
import { UnansweredQuestion } from '../models/unanswered.model.js';
import { Setting } from '../models/setting.model.js';
import { User } from '../models/user.model.js';
import { Employee } from '../models/employee.model.js';
import { env } from '../config/env.js';
import '../config/db.js';

export const seedM16Chatbot = async () => {
  console.log('🌱 [SEED M16] Seeding Policy Documents, Chatbot Settings & Sample Queries...');

  // 1. Locate Super Admin or HR user to assign as uploader
  const adminUser = (await User.findOne({ email: 'admin@hrm.local' })) || (await User.findOne({}));
  if (!adminUser) {
    console.warn('⚠️ [SEED M16] No admin user found. Skipping M16 seed.');
    return;
  }

  // Locate an employee for sample questions
  const sampleEmployee = (await Employee.findOne({})) || null;
  const sampleUser = sampleEmployee ? await User.findById(sampleEmployee.userId) : adminUser;

  // 2. Configure Chatbot Settings in Setting model (Row 16.9)
  await Setting.findOneAndUpdate(
    { key: 'chatbot' },
    {
      key: 'chatbot',
      value: {
        enabled: true,
        dailyLimitPerUser: 50,
        allowedRoles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee']
      },
      updatedBy: adminUser._id
    },
    { upsert: true, new: true }
  );
  console.log('✅ [SEED M16] Chatbot Settings initialized (Enabled: true, Limit: 50/day).');

  // 3. Seed Policy Documents (Rows 16.1 & 16.3)
  const policies = [
    {
      title: 'Employee Leave Policy 2026',
      category: 'Leave',
      description: 'Comprehensive guidelines on annual, casual, sick, maternity and bereavement leave entitlements.',
      fileUrl: '/uploads/policies/sample-leave-policy-2026.pdf',
      fileType: 'pdf',
      fileSize: 1024 * 450,
      extractedText: `EMPLOYEE LEAVE & TIME-OFF POLICY 2026
1. Annual Leave: Every permanent employee is entitled to 14 days of paid annual leave per calendar year. Up to 7 unused annual leaves may be carried forward to the following year.
2. Casual Leave: Employees are entitled to 10 days of paid casual leave for unexpected personal errands or emergencies. Maximum 3 consecutive casual leaves can be availed at a time.
3. Sick Leave: 8 paid sick leaves are allocated per annum. Medical certificates are mandatory for illnesses exceeding 2 consecutive days.
4. Maternity Leave: Female employees who have completed at least 180 days of continuous service are eligible for 90 calendar days of fully paid maternity leave.
5. Paternity Leave: Male employees are entitled to 10 working days of paid paternity leave upon childbirth.`,
      isActive: true,
      uploadedBy: adminUser._id
    },
    {
      title: 'Working Hours & Attendance Guidelines',
      category: 'Attendance',
      description: 'Standard office hours, core collaboration window, punch-in grace period, and WFH regulations.',
      fileUrl: '/uploads/policies/sample-attendance-guidelines.pdf',
      fileType: 'pdf',
      fileSize: 1024 * 320,
      extractedText: `OFFICE WORKING HOURS & ATTENDANCE REGULATIONS
1. Standard Working Hours: Monday through Friday from 9:00 AM to 6:00 PM (including 1-hour lunch and prayer break).
2. Core Hours: 10:00 AM to 4:00 PM is the mandatory collaboration window where all team members must be present.
3. Grace Period: A 15-minute grace period is provided every morning up to 9:15 AM.
4. Late Punches: 3 late arrivals past 9:15 AM within a single payroll month will trigger a half-day salary deduction.
5. Work From Home (WFH): Employees are eligible for up to 2 approved WFH days per month subject to line manager approval.`,
      isActive: true,
      uploadedBy: adminUser._id
    },
    {
      title: 'Probation & Confirmation Guidelines',
      category: 'Probation',
      description: 'Statutory 90-day probationary review process, confirmation criteria, and notice periods.',
      fileUrl: '/uploads/policies/sample-probation-rules.pdf',
      fileType: 'pdf',
      fileSize: 1024 * 280,
      extractedText: `PROBATION & EMPLOYMENT CONFIRMATION RULES
1. Probation Duration: The standard probationary period for all newly hired full-time employees is exactly 90 days (3 months) from the date of joining.
2. Review Timeline: At day 75 of probation, HR initiates the 90-day confirmation appraisal review with the Department Head.
3. Confirmation: Upon successful performance scoring (>= 75%), HR issues the formal Employment Confirmation Letter.
4. Extension: If performance is borderline, probation may be extended once for a maximum additional duration of 30 days.
5. Notice Period: During probation, either party may terminate the employment contract by providing 14 days written notice or gross salary in lieu.`,
      isActive: true,
      uploadedBy: adminUser._id
    },
    {
      title: 'Code of Professional Conduct & Workplace Ethics',
      category: 'Conduct',
      description: 'Corporate ethics, dress code, anti-harassment standards, and confidentiality of company IP.',
      fileUrl: '/uploads/policies/sample-code-of-conduct.pdf',
      fileType: 'pdf',
      fileSize: 1024 * 510,
      extractedText: `CODE OF PROFESSIONAL CONDUCT & WORKPLACE ETHICS
1. Professional Decorum: Employees are expected to treat colleagues, clients, and partners with dignity, mutual respect, and zero tolerance for discrimination or harassment.
2. Dress Code: Smart business casual is standard Monday through Thursday. Casual attire (jeans, polo shirts, sneakers) is permitted on Fridays.
3. Confidentiality & Non-Disclosure: All proprietary source code, customer data, and financial records are strictly confidential and protected by NDA.
4. Moonlighting: Secondary employment or conflicting freelance contracts are strictly prohibited without written consent from Executive Management.`,
      isActive: true,
      uploadedBy: adminUser._id
    }
  ];

  for (const pol of policies) {
    await PolicyDoc.findOneAndUpdate(
      { title: pol.title },
      pol,
      { upsert: true, new: true }
    );
  }
  console.log(`✅ [SEED M16] ${policies.length} Policy Documents successfully upserted.`);

  // 4. Seed Sample Escalated Questions (Row 16.6)
  const sampleQuestions = [
    {
      userId: sampleUser?._id || adminUser._id,
      employeeId: sampleEmployee?._id || null,
      question: 'Kya company gym membership ya fitness allowance provide karti hai?',
      userLanguage: 'ur-roman',
      status: 'Pending'
    },
    {
      userId: sampleUser?._id || adminUser._id,
      employeeId: sampleEmployee?._id || null,
      question: 'Is health insurance coverage extended to dependent parents under the standard company tier?',
      userLanguage: 'en',
      status: 'Pending'
    }
  ];

  for (const q of sampleQuestions) {
    const existing = await UnansweredQuestion.findOne({ question: q.question });
    if (!existing) {
      await UnansweredQuestion.create(q);
    }
  }
  console.log('✅ [SEED M16] Sample Unanswered Escalations created.');
  console.log('✨ [SEED M16] Seeding complete.');
};

// Direct script execution support
if (process.argv[1]?.endsWith('m16.seed.js')) {
  try {
    await mongoose.connect(env.MONGO_URI);
    await seedM16Chatbot();
    await mongoose.disconnect();
    console.log('Exiting seed process.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}
