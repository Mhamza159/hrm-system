/**
 * @file seed_m22_dev_data.js
 * @description Dedicated seed script for Module M22 (Projects & Timesheets) in Development DB.
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { Employee } from '../models/employee.model.js';
import { SalaryStructure } from '../models/salaryStructure.model.js';
import { Client } from '../models/client.model.js';
import { Project } from '../models/project.model.js';
import { Timesheet } from '../models/timesheet.model.js';
import { getMondayOfWeek, getIsoWeekString } from '../modules/projects/project.service.js';

export const seedM22Data = async () => {
  console.log('🌱 [SEED M22] Connecting to MongoDB...');
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGO_URI);
  }

  console.log('🌱 [SEED M22] Setting up clients...');
  let client = await Client.findOne({ companyName: 'Cyberdyne Systems', isDeleted: false });
  if (!client) {
    client = await Client.create({
      name: 'Sarah Connor',
      companyName: 'Cyberdyne Systems',
      email: 'sarah@cyberdyne.com',
      phone: '+92 300 9876543',
      address: 'Tech Park, Lahore',
      currency: 'PKR'
    });
    console.log('✅ Created Client: Cyberdyne Systems');
  }

  let acmeClient = await Client.findOne({ companyName: 'Acme Corporation', isDeleted: false });
  if (!acmeClient) {
    acmeClient = await Client.create({
      name: 'John Acme',
      companyName: 'Acme Corporation',
      email: 'john@acme.com',
      phone: '+92 321 1122334',
      address: 'Industrial Area, Karachi',
      currency: 'USD'
    });
    console.log('✅ Created Client: Acme Corporation');
  }

  console.log('🌱 [SEED M22] Resolving department & users...');
  let dept = await Department.findOne({ isActive: true });
  if (!dept) {
    dept = await Department.create({ name: 'Engineering', code: 'ENG', isActive: true });
  }

  const managerUser = await User.findOne({ email: 'manager@hrm.company.pk' }) ||
    await User.findOne({ email: 'admin@hrm.company.pk' }) ||
    await User.findOne({ email: 'mhamzaofficial159@gmail.com' });

  const employeeUser = await User.findOne({ email: 'employee@hrm.company.pk' });

  let employee = await Employee.findOne({ userId: employeeUser?._id, isDeleted: false });
  if (!employee && employeeUser) {
    employee = await Employee.create({
      userId: employeeUser._id,
      employeeCode: 'EMP-M22-DEV',
      name: employeeUser.name || 'Standard Employee',
      email: employeeUser.email,
      departmentId: dept._id,
      status: 'Active',
      joiningDate: new Date('2024-01-01')
    });
    console.log('✅ Created Employee record for employee@hrm.company.pk');
  }

  // Create Project PRJ-SKYNET
  let project = await Project.findOne({ code: 'PRJ-SKYNET', isDeleted: false });
  if (!project) {
    project = await Project.create({
      name: 'Skynet Cloud Core',
      code: 'PRJ-SKYNET',
      description: 'Enterprise AI & Defense Cloud Architecture',
      clientId: client._id,
      departmentId: dept._id,
      managerId: managerUser._id,
      billingType: 'hourly',
      hourlyBillingRatePaisa: 350000, // 3,500 PKR/hr
      budgetPaisa: 50000000, // 500,000 PKR
      status: 'active',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      members: employee ? [
        {
          employeeId: employee._id,
          projectRole: 'Lead',
          customHourlyRatePaisa: 400000, // 4,000 PKR/hr
          joinedAt: new Date('2026-01-01')
        }
      ] : []
    });
    console.log('✅ Created Project: PRJ-SKYNET');
  } else if (employee && (!project.members || project.members.length === 0)) {
    project.members = [
      {
        employeeId: employee._id,
        projectRole: 'Lead',
        customHourlyRatePaisa: 400000,
        joinedAt: new Date('2026-01-01')
      }
    ];
    await project.save();
    console.log('✅ Assigned employee to PRJ-SKYNET');
  }

  // Ensure active SalaryStructure exists for employee
  if (employee) {
    let salary = await SalaryStructure.findOne({ employeeId: employee._id, status: 'active', isDeleted: false });
    if (!salary) {
      await SalaryStructure.create({
        employeeId: employee._id,
        effectiveFrom: new Date('2024-01-01'),
        currency: 'PKR',
        basicSalary: 10000000, // 100,000 PKR
        houseRentAllowance: 4000000,
        medicalAllowance: 1000000,
        conveyanceAllowance: 1000000,
        grossSalary: 16000000,
        status: 'active'
      });
      console.log('✅ Created SalaryStructure for Employee (Basic: 100,000 PKR)');
    }

    // Seed Timesheet entries for the current week
    const now = new Date();
    const monday = getMondayOfWeek(now);
    const weekNumber = getIsoWeekString(monday);

    const mondayDate = new Date(monday.getTime());
    const tuesdayDate = new Date(monday.getTime() + 1 * 24 * 60 * 60 * 1000);

    const existingTimesheets = await Timesheet.find({
      employeeId: employee._id,
      projectId: project._id,
      weekNumber,
      isDeleted: false
    });

    if (existingTimesheets.length === 0) {
      await Timesheet.create([
        {
          employeeId: employee._id,
          projectId: project._id,
          date: mondayDate,
          weekNumber,
          weekStartDate: monday,
          hours: 8.0,
          taskDescription: 'Refactored telemetry microservices & API endpoints',
          isBillable: true,
          status: 'submitted',
          submittedAt: new Date()
        },
        {
          employeeId: employee._id,
          projectId: project._id,
          date: tuesdayDate,
          weekNumber,
          weekStartDate: monday,
          hours: 7.5,
          taskDescription: 'Containerized deployment pipelines & caching layers',
          isBillable: true,
          status: 'draft'
        }
      ]);
      console.log('✅ Seeded weekly timesheet entries for', employee.name);
    }
  }

  console.log('🎉 [SEED M22] Development seed finished successfully!');
};

if (process.argv[1]?.endsWith('seed_m22_dev_data.js')) {
  seedM22Data().then(() => process.exit(0)).catch((err) => {
    console.error('Error seeding M22 data:', err);
    process.exit(1);
  });
}

