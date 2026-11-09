/**
 * @file m17.seed.js
 * @description Seed script for Module M17 Attrition Prediction.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Rows 17.1 to 17.5)
 * - Seeds: High, Medium, and Low risk employees across multiple departments with sample notes.
 */

import mongoose from 'mongoose';
import { AttritionScore } from '../models/attritionScore.model.js';
import { Employee } from '../models/employee.model.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { env } from '../config/env.js';

export async function seedAttritionData() {
  console.log('🌱 [SEED M17] Bootstrapping Attrition Prediction demo & test data...');

  // Ensure Departments exist
  let engDept = await Department.findOne({ code: 'ENG' });
  if (!engDept) {
    engDept = await Department.create({ name: 'Software Engineering', code: 'ENG' });
  }

  let salesDept = await Department.findOne({ code: 'SLS' });
  if (!salesDept) {
    salesDept = await Department.create({ name: 'Sales & Growth', code: 'SLS' });
  }

  let hrDept = await Department.findOne({ code: 'HRD' });
  if (!hrDept) {
    hrDept = await Department.create({ name: 'Human Resources', code: 'HRD' });
  }

  // Ensure Designation exists
  let devDesig = await Designation.findOne({ title: 'Senior Software Engineer' });
  if (!devDesig) {
    devDesig = await Designation.create({ title: 'Senior Software Engineer', code: 'SSE-01', grade: 'Senior', departmentId: engDept._id });
  }

  // Ensure HR User exists for authoring notes
  const hrUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' });

  // 1. Employee 1: High Flight Risk (Score: 80)
  let empHigh = await Employee.findOne({ employeeCode: 'EMP-ATT-001' });
  if (!empHigh) {
    empHigh = await Employee.create({
      employeeCode: 'EMP-ATT-001',
      name: 'Usman Tariq',
      email: 'usman.tariq@hrm.enterprise.pk',
      departmentId: engDept._id,
      designationId: devDesig._id,
      joiningDate: new Date(Date.now() - 30 * 30 * 24 * 60 * 60 * 1000), // 30 months ago
      status: 'Active'
    });
  }

  await AttritionScore.findOneAndUpdate(
    { employeeId: empHigh._id },
    {
      employeeId: empHigh._id,
      departmentId: engDept._id,
      riskScore: 80,
      riskLevel: 'High',
      breakdown: {
        attendance: 30,
        salaryStagnation: 25,
        appraisal: 10,
        tenure: 15,
        engagement: 0
      },
      topFactors: [
        'Unplanned Absences: 5 days in last 90 days (+15)',
        'Frequent Late Arrivals: 8 times in last 90 days (+15)',
        'Salary Stagnation: No increment for 22 months (+25)',
        'Role Stagnation: Over 2 years in same designation (+15)'
      ],
      calculatedAt: new Date(),
      notes: [
        {
          note: 'Scheduled informal coffee catch-up. Employee indicated compensation mismatch with current market inflation.',
          actionTaken: 'Compensation Review',
          authorId: hrUser?._id || new mongoose.Types.ObjectId(),
          authorName: hrUser?.name || 'HR Manager',
          followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      ]
    },
    { upsert: true, new: true }
  );

  // 2. Employee 2: Medium Flight Risk (Score: 52)
  let empMed = await Employee.findOne({ employeeCode: 'EMP-ATT-002' });
  if (!empMed) {
    empMed = await Employee.create({
      employeeCode: 'EMP-ATT-002',
      name: 'Ayesha Siddiqua',
      email: 'ayesha.s@hrm.enterprise.pk',
      departmentId: salesDept._id,
      designationId: devDesig._id,
      joiningDate: new Date(Date.now() - 19 * 30 * 24 * 60 * 60 * 1000), // 19 months
      status: 'Active'
    });
  }

  await AttritionScore.findOneAndUpdate(
    { employeeId: empMed._id },
    {
      employeeId: empMed._id,
      departmentId: salesDept._id,
      riskScore: 52,
      riskLevel: 'Medium',
      breakdown: {
        attendance: 15,
        salaryStagnation: 12,
        appraisal: 15,
        tenure: 10,
        engagement: 0
      },
      topFactors: [
        'Frequent Late Arrivals: 6 times in last 90 days (+15)',
        'Salary Stagnation: No increment for 15 months (+12)',
        'Appraisal Delay: Over 12 months since last review (+10)'
      ],
      calculatedAt: new Date(),
      notes: []
    },
    { upsert: true, new: true }
  );

  // 3. Employee 3: Low Flight Risk (Score: 18)
  let empLow = await Employee.findOne({ employeeCode: 'EMP-ATT-003' });
  if (!empLow) {
    empLow = await Employee.create({
      employeeCode: 'EMP-ATT-003',
      name: 'Bilal Farooq',
      email: 'bilal.farooq@hrm.enterprise.pk',
      departmentId: hrDept._id,
      designationId: devDesig._id,
      joiningDate: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000), // 8 months
      status: 'Active'
    });
  }

  await AttritionScore.findOneAndUpdate(
    { employeeId: empLow._id },
    {
      employeeId: empLow._id,
      departmentId: hrDept._id,
      riskScore: 18,
      riskLevel: 'Low',
      breakdown: {
        attendance: 0,
        salaryStagnation: 0,
        appraisal: 10,
        tenure: 8,
        engagement: 0
      },
      topFactors: [
        'Tenure in role > 8 months (+8)',
        'Appraisal overdue (+10)'
      ],
      calculatedAt: new Date(),
      notes: []
    },
    { upsert: true, new: true }
  );

  console.log('✅ [SEED M17] Seeded 3 evaluated employees (1 High, 1 Medium, 1 Low).');
}

// Direct script execution support
if (process.argv[1]?.endsWith('m17.seed.js')) {
  try {
    await mongoose.connect(env.MONGO_URI);
    await seedAttritionData();
    await mongoose.disconnect();
    console.log('Exiting M17 seed process.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}
