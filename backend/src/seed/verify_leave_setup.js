import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Employee } from '../models/employee.model.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { LeaveType } from '../models/leaveType.model.js';
import { LeaveBalance } from '../models/leaveBalance.model.js';

async function setup() {
  console.log('--- Verifying M6 Test Environment ---');
  await connectDB();
  
  // 1. Ensure Standard Leave Types exist
  const standardTypes = [
    { name: 'Annual Leave', code: 'AL', daysPerYear: 14, color: '#3B82F6', isPaid: true, requiresAttachment: false, allowHalfDay: true, carryForwardLimit: 5, encashable: true },
    { name: 'Sick Leave', code: 'SL', daysPerYear: 10, color: '#EF4444', isPaid: true, requiresAttachment: true, allowHalfDay: true, carryForwardLimit: 0, encashable: false },
    { name: 'Casual Leave', code: 'CL', daysPerYear: 10, color: '#10B981', isPaid: true, requiresAttachment: false, allowHalfDay: true, carryForwardLimit: 0, encashable: false }
  ];

  for (const lt of standardTypes) {
    await LeaveType.findOneAndUpdate(
      { code: lt.code },
      { $set: lt },
      { upsert: true, new: true }
    );
  }
  const leaveTypes = await LeaveType.find({ isDeleted: { $ne: true } });
  console.log(`Verified ${leaveTypes.length} leave types.`);

  // 2. Department & Designation
  let dept = await Department.findOne({ code: 'ENG' });
  if (!dept) {
    dept = await Department.create({ name: 'Engineering', code: 'ENG' });
  }

  let mgrDesig = await Designation.findOne({ code: 'EM' });
  if (!mgrDesig) {
    mgrDesig = await Designation.create({ title: 'Engineering Manager', code: 'EM', departmentId: dept._id });
  }
  let empDesig = await Designation.findOne({ code: 'FSD' });
  if (!empDesig) {
    empDesig = await Designation.create({ title: 'Full Stack Developer', code: 'FSD', departmentId: dept._id });
  }

  // 3. Find Users
  const adminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' });
  const hrUser = await User.findOne({ email: 'hr@hrm.company.pk' });
  const mgrUser = await User.findOne({ email: 'manager@hrm.company.pk' });
  const empUser = await User.findOne({ email: 'employee@hrm.company.pk' });

  // 4. Upsert Employees
  // Admin / CEO
  let adminEmp = await Employee.findOne({ email: adminUser.email });
  if (!adminEmp) {
    adminEmp = await Employee.create({
      employeeCode: 'EMP-001',
      name: 'Mohammad Hamza Hakim',
      email: adminUser.email,
      departmentId: dept._id,
      designationId: mgrDesig._id,
      userId: adminUser._id,
      joiningDate: new Date('2023-01-01'),
      employmentType: 'Permanent',
      status: 'Active'
    });
  } else {
    adminEmp.userId = adminUser._id;
    await adminEmp.save();
  }
  adminUser.employeeId = adminEmp._id;
  await adminUser.save();

  // HR Manager
  let hrEmp = await Employee.findOne({ email: hrUser.email });
  if (!hrEmp) {
    hrEmp = await Employee.create({
      employeeCode: 'EMP-002',
      name: 'HR Manager',
      email: hrUser.email,
      departmentId: dept._id,
      designationId: mgrDesig._id,
      managerId: adminEmp._id,
      userId: hrUser._id,
      joiningDate: new Date('2023-01-01'),
      employmentType: 'Permanent',
      status: 'Active'
    });
  } else {
    hrEmp.userId = hrUser._id;
    hrEmp.managerId = adminEmp._id;
    await hrEmp.save();
  }
  hrUser.employeeId = hrEmp._id;
  await hrUser.save();

  // Dept Manager
  let mgrEmp = await Employee.findOne({ email: mgrUser.email });
  if (!mgrEmp) {
    mgrEmp = await Employee.create({
      employeeCode: 'EMP-003',
      name: 'Engineering Lead',
      email: mgrUser.email,
      departmentId: dept._id,
      designationId: mgrDesig._id,
      managerId: adminEmp._id,
      userId: mgrUser._id,
      joiningDate: new Date('2023-01-01'),
      employmentType: 'Permanent',
      status: 'Active'
    });
  } else {
    mgrEmp.userId = mgrUser._id;
    mgrEmp.managerId = adminEmp._id;
    await mgrEmp.save();
  }
  mgrUser.employeeId = mgrEmp._id;
  await mgrUser.save();

  // Employee
  let emp = await Employee.findOne({ email: empUser.email });
  if (!emp) {
    emp = await Employee.create({
      employeeCode: 'EMP-004',
      name: 'John Developer',
      email: empUser.email,
      departmentId: dept._id,
      designationId: empDesig._id,
      managerId: mgrEmp._id, // reports to Dept Manager!
      userId: empUser._id,
      joiningDate: new Date('2023-01-01'),
      employmentType: 'Permanent',
      status: 'Active'
    });
  } else {
    emp.userId = empUser._id;
    emp.managerId = mgrEmp._id; // ensure reports to Dept Manager
    await emp.save();
  }
  empUser.employeeId = emp._id;
  await empUser.save();

  // 5. Ensure Leave Balances for 2026 for employee
  const currentYear = new Date().getFullYear();
  const balancesArray = leaveTypes.map(lt => ({
    leaveTypeId: lt._id,
    allocatedDays: lt.daysPerYear || 14,
    carriedForwardDays: 0,
    usedDays: 0,
    pendingDays: 0,
    encashedDays: 0
  }));

  await LeaveBalance.findOneAndUpdate(
    { employeeId: emp._id, year: currentYear },
    {
      $set: {
        employeeId: emp._id,
        year: currentYear,
        balances: balancesArray
      }
    },
    { upsert: true, new: true }
  );

  console.log(`Verified leave balances for ${emp.name} (EMP-004) for year ${currentYear}`);
  console.log('✅ Setup verified: Reporting chain is Employee -> Dept Manager -> Super Admin / HR');
  process.exit(0);
}

setup().catch(err => {
  console.error(err);
  process.exit(1);
});
