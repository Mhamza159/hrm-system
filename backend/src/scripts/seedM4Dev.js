/**
 * @file seedM4Dev.js
 * @description Seeds comprehensive M4 Departments, Designations, Shifts, and Employee hierarchy for real browser testing.
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Role } from '../models/role.model.js';
import { User } from '../models/user.model.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { Shift } from '../models/shift.model.js';
import { Employee } from '../models/employee.model.js';
import { encrypt } from '../utils/crypto.js';
import { seedDevUsers } from '../seed/dev.seed.js';

export const seedM4 = async () => {
  console.log('🌱 [M4 SEED] Initializing seed data for M4...');
  await connectDB();

  // 1. Ensure core users exist
  await seedDevUsers();

  const adminUser = await User.findOne({ email: 'admin@hrm.company.pk' });
  const hrUser = await User.findOne({ email: 'hr@hrm.company.pk' });
  const managerUser = await User.findOne({ email: 'manager@hrm.company.pk' });
  const employeeUser = await User.findOne({ email: 'employee@hrm.company.pk' });

  // 2. Seed Shifts (Fixed, Flexible, Night cross-midnight)
  const shiftsData = [
    {
      name: 'General Day Shift',
      code: 'GS-DAY',
      type: 'fixed',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      breakMinutes: 60,
      halfDayMinutes: 240,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isCrossMidnight: false,
      durationMinutes: 480,
      isActive: true,
      createdBy: adminUser._id
    },
    {
      name: 'Night Operations Shift',
      code: 'NS-NIGHT',
      type: 'night',
      startTime: '20:00',
      endTime: '05:00',
      graceMinutes: 15,
      breakMinutes: 60,
      halfDayMinutes: 240,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isCrossMidnight: true,
      durationMinutes: 480,
      isActive: true,
      createdBy: adminUser._id
    },
    {
      name: 'Flexible Morning Shift',
      code: 'FLEX-MORN',
      type: 'flexible',
      startTime: '10:00',
      endTime: '19:00',
      graceMinutes: 30,
      breakMinutes: 60,
      halfDayMinutes: 240,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isCrossMidnight: false,
      durationMinutes: 480,
      isActive: true,
      createdBy: adminUser._id
    }
  ];

  const shiftMap = {};
  for (const s of shiftsData) {
    const shift = await Shift.findOneAndUpdate(
      { code: s.code },
      { $set: s },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    shiftMap[s.code] = shift;
  }
  console.log('✅ Seeded Shifts:', Object.keys(shiftMap));

  // 3. Seed Departments
  const deptEng = await Department.findOneAndUpdate(
    { code: 'ENG' },
    {
      $set: {
        name: 'Engineering',
        code: 'ENG',
        description: 'Software development, cloud infrastructure and QA.',
        headId: managerUser._id,
        isActive: true,
        isDeleted: false,
        createdBy: adminUser._id
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const deptHR = await Department.findOneAndUpdate(
    { code: 'HR' },
    {
      $set: {
        name: 'Human Resources',
        code: 'HR',
        description: 'People operations, recruiting, and culture.',
        headId: hrUser._id,
        isActive: true,
        isDeleted: false,
        createdBy: adminUser._id
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Empty department for delete test
  const deptTemp = await Department.findOneAndUpdate(
    { code: 'TEMP' },
    {
      $set: {
        name: 'Temporary Project Cell',
        code: 'TEMP',
        description: 'Empty department without employees for safe deletion testing.',
        headId: null,
        isActive: true,
        isDeleted: false,
        createdBy: adminUser._id
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('✅ Seeded Departments: ENG, HR, TEMP');

  // 4. Seed Designations
  const desigData = [
    {
      title: 'Engineering Director',
      code: 'DIR-ENG',
      grade: 'Executive',
      departmentId: deptEng._id,
      description: 'Department executive head.',
      isActive: true,
      isDeleted: false
    },
    {
      title: 'Senior Software Engineer',
      code: 'SR-SWE',
      grade: 'Senior',
      departmentId: deptEng._id,
      description: 'Senior backend and distributed systems engineer.',
      isActive: true,
      isDeleted: false
    },
    {
      title: 'Software Engineer',
      code: 'SWE-MID',
      grade: 'Mid',
      departmentId: deptEng._id,
      description: 'Full stack development and feature implementation.',
      isActive: true,
      isDeleted: false
    },
    {
      title: 'HR Specialist',
      code: 'HR-SPEC',
      grade: 'Mid',
      departmentId: deptHR._id,
      description: 'Human resources and employee relations specialist.',
      isActive: true,
      isDeleted: false
    }
  ];

  const desigMap = {};
  for (const d of desigData) {
    const desig = await Designation.findOneAndUpdate(
      { code: d.code },
      { $set: d },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    desigMap[d.code] = desig;
  }
  console.log('✅ Seeded Designations:', Object.keys(desigMap));

  // 5. Seed Employees with Hierarchy (Manager -> Subordinate)
  // Tariq Manager (Engineering Director)
  const managerEmp = await Employee.findOneAndUpdate(
    { employeeCode: 'EMP-001' },
    {
      $set: {
        employeeCode: 'EMP-001',
        userId: managerUser._id,
        name: 'Tariq Manager',
        email: managerUser.email,
        phone: '+92 300 1234567',
        cnic: encrypt('35201-1234567-1'),
        departmentId: deptEng._id,
        designationId: desigMap['DIR-ENG']._id,
        managerId: null, // Root node in Engineering tree
        shiftId: shiftMap['GS-DAY']._id,
        employmentType: 'Permanent',
        status: 'Active',
        joiningDate: new Date('2023-01-01'),
        isDeleted: false
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Bilal Staff (Employee reporting to Tariq Manager)
  const staffEmp = await Employee.findOneAndUpdate(
    { employeeCode: 'EMP-002' },
    {
      $set: {
        employeeCode: 'EMP-002',
        userId: employeeUser._id,
        name: 'Bilal Staff',
        email: employeeUser.email,
        phone: '+92 300 7654321',
        cnic: encrypt('35201-7654321-3'),
        departmentId: deptEng._id,
        designationId: desigMap['SWE-MID']._id,
        managerId: managerEmp._id, // Reports to Tariq
        shiftId: shiftMap['NS-NIGHT']._id, // Night shift
        employmentType: 'Permanent',
        status: 'Active',
        joiningDate: new Date('2023-06-01'),
        isDeleted: false
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Ayesha HR
  const hrEmp = await Employee.findOneAndUpdate(
    { employeeCode: 'EMP-003' },
    {
      $set: {
        employeeCode: 'EMP-003',
        userId: hrUser._id,
        name: 'Ayesha HR',
        email: hrUser.email,
        phone: '+92 300 9988776',
        cnic: encrypt('35201-9988776-5'),
        departmentId: deptHR._id,
        designationId: desigMap['HR-SPEC']._id,
        managerId: null,
        shiftId: shiftMap['GS-DAY']._id,
        employmentType: 'Permanent',
        status: 'Active',
        joiningDate: new Date('2023-02-15'),
        isDeleted: false
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 6. Link employeeId in User collection
  await User.findByIdAndUpdate(managerUser._id, { employeeId: managerEmp._id });
  await User.findByIdAndUpdate(employeeUser._id, { employeeId: staffEmp._id });
  await User.findByIdAndUpdate(hrUser._id, { employeeId: hrEmp._id });

  console.log('🎉 [M4 SEED] Hierarchy and data successfully seeded!');
};

if (process.argv[1]?.endsWith('seedM4Dev.js')) {
  try {
    await seedM4();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ [M4 SEED ERROR]:', err);
    process.exit(1);
  }
}
