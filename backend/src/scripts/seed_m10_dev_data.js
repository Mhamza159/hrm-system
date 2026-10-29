/**
 * @file seed_m10_dev_data.js
 * @description Seeds employee records, salary structures, and loans permissions for dev accounts.
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { Department } from '../models/department.model.js';
import { Employee } from '../models/employee.model.js';
import { SalaryStructure } from '../models/salaryStructure.model.js';

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  console.log('🌱 Connected to DB for M10 Seed...');

  // 1. Roles & Permissions setup
  const superAdminRole = await Role.findOne({ name: 'Super Admin' });
  const hrRole = await Role.findOne({ name: 'HR Manager' });
  const deptManagerRole = await Role.findOne({ name: 'Department Manager' });
  const employeeRole = await Role.findOne({ name: 'Employee' });

  const rolePermMap = [
    { role: superAdminRole, perms: ['loan.view', 'loan.create', 'loan.recommend', 'loan.approve', 'loan.prepay', 'loan.settings'], scope: 'all' },
    { role: hrRole, perms: ['loan.view', 'loan.create', 'loan.recommend', 'loan.approve', 'loan.prepay'], scope: 'all' },
    { role: deptManagerRole, perms: ['loan.view', 'loan.create', 'loan.recommend'], scope: 'department' },
    { role: employeeRole, perms: ['loan.view', 'loan.create'], scope: 'own' }
  ];

  for (const { role, perms, scope } of rolePermMap) {
    if (!role) continue;
    for (const action of perms) {
      if (!role.permissions.some(p => p.action === action)) {
        role.permissions.push({
          action,
          subject: 'Loan',
          scope,
          conditions: {}
        });
      }
    }
    await role.save();
    console.log(`✅ Synced Loan permissions for role: ${role.name}`);
  }

  // 2. Department
  let dept = await Department.findOne({ code: 'ENG' });
  if (!dept) {
    dept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });
  }

  // 3. Dept Manager Employee
  let managerUser = await User.findOne({ email: 'manager@hrm.company.pk' });
  let managerEmp = await Employee.findOne({ employeeCode: 'EMP-M10-MGR' });
  if (!managerEmp) {
    managerEmp = await Employee.create({
      employeeCode: 'EMP-M10-MGR',
      name: 'Tariq Manager',
      email: 'manager@hrm.company.pk',
      phone: '+923001112233',
      departmentId: dept._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01'),
      userId: managerUser?._id
    });
  }
  if (managerUser) {
    managerUser.employeeId = managerEmp._id;
    await managerUser.save();
  }

  // 4. Staff Employee
  let empUser = await User.findOne({ email: 'employee@hrm.company.pk' });
  let staffEmp = await Employee.findOne({ employeeCode: 'EMP-M10-DEV' });
  if (!staffEmp) {
    staffEmp = await Employee.create({
      employeeCode: 'EMP-M10-DEV',
      name: 'Hamza Staff',
      email: 'employee@hrm.company.pk',
      phone: '+923004445566',
      departmentId: dept._id,
      managerId: managerEmp._id,
      status: 'Active',
      joiningDate: new Date('2024-01-01'),
      userId: empUser?._id
    });
  } else {
    staffEmp.managerId = managerEmp._id;
    staffEmp.userId = empUser?._id;
    await staffEmp.save();
  }
  if (empUser) {
    empUser.employeeId = staffEmp._id;
    await empUser.save();
  }

  // 5. HR Manager Employee
  let hrUser = await User.findOne({ email: 'hr@hrm.company.pk' });
  let hrEmp = await Employee.findOne({ employeeCode: 'EMP-M10-HR' });
  if (!hrEmp) {
    hrEmp = await Employee.create({
      employeeCode: 'EMP-M10-HR',
      name: 'Sara HR',
      email: 'hr@hrm.company.pk',
      phone: '+923007778899',
      departmentId: dept._id,
      status: 'Active',
      joiningDate: new Date('2023-06-01'),
      userId: hrUser?._id
    });
  }
  if (hrUser) {
    hrUser.employeeId = hrEmp._id;
    await hrUser.save();
  }

  // 6. Salary Structure for staff
  let sal = await SalaryStructure.findOne({ employeeId: staffEmp._id, isActive: true });
  if (!sal) {
    sal = await SalaryStructure.create({
      employeeId: staffEmp._id,
      effectiveFrom: new Date('2024-01-01'),
      currency: 'PKR',
      basicSalary: 6000000, // 60,000 PKR
      houseRentAllowance: 2500000, // 25,000 PKR
      medicalAllowance: 1000000, // 10,000 PKR
      conveyanceAllowance: 500000, // 5,000 PKR
      otherAllowances: 0,
      isActive: true
    });
    console.log('✅ Created SalaryStructure for Hamza Staff (Gross: 100,000 PKR, Basic: 60,000 PKR)');
  }

  console.log('🎉 M10 Dev Data successfully seeded!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

