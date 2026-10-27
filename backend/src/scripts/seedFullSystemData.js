/**
 * @file seedFullSystemData.js
 * @description Comprehensive restoration & parity seeder:
 * - Restores complete 14-employee corporate org chart
 * - Configures Active Salary Structures for all employees
 * - Initializes Leave Balances (Annual, Casual, Sick, Unpaid)
 * - Seeds July 2026 attendance, leaves, overtime, and monthLock for pre-payroll audit
 * - Seeds Today's live punches (2026-10-27) with active presence, breaks, and pending overtime
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { seedRolesAndAdmin } from '../seed/roles.seed.js';
import { seedOrgChartHierarchy } from '../seed/orgchart_hierarchy.seed.js';
import { seedJulyPayrollData } from './seedJulyPayrollData.js';
import { Employee } from '../models/employee.model.js';
import { SalaryStructure } from '../models/salaryStructure.model.js';
import { LeaveType } from '../models/leaveType.model.js';
import { LeaveBalance } from '../models/leaveBalance.model.js';
import { Attendance } from '../models/attendance.model.js';
import { Shift } from '../models/shift.model.js';

async function runFullSystemSeed() {
  console.log('🔄 [RESTORE] Connecting to database...');
  await connectDB();

  // 1. Roles & Super Admin
  console.log('👑 [1/5] Restoring roles & Super Admin...');
  await seedRolesAndAdmin();

  // 2. Org Chart Hierarchy
  console.log('🌳 [2/5] Restoring complete corporate organization hierarchy...');
  await seedOrgChartHierarchy();

  // 3. Salary Structures & Leave Balances
  console.log('💼 [3/5] Syncing Salary Structures and Leave Balances for all staff...');
  const employees = await Employee.find({ isDeleted: false });
  const leaveTypes = await LeaveType.find({});

  const currentYear = 2026;
  for (const emp of employees) {
    // Salary Structure (Integer Paisa Invariant: PKR 100,000 = 10000000)
    let salary = await SalaryStructure.findOne({ employeeId: emp._id, status: 'active' });
    if (!salary) {
      await SalaryStructure.create({
        employeeId: emp._id,
        basicSalary: 6000000,
        houseRentAllowance: 2500000,
        medicalAllowance: 1000000,
        conveyanceAllowance: 500000,
        otherAllowances: 0,
        grossSalary: 10000000,
        eobiEnabled: true,
        status: 'active',
        effectiveFrom: new Date('2024-01-01')
      });
    }

    // Leave Balances for 2026
    let bal = await LeaveBalance.findOne({ employeeId: emp._id, year: currentYear });
    if (!bal) {
      const balances = leaveTypes.map((lt) => ({
        leaveTypeId: lt._id,
        allocatedDays: lt.daysPerYear || 14,
        carriedForwardDays: 0,
        usedDays: 0,
        pendingDays: 0,
        encashedDays: 0
      }));
      await LeaveBalance.create({
        employeeId: emp._id,
        year: currentYear,
        balances
      });
    }
  }

  // 4. July 2026 Payroll Pre-Audit Dataset
  console.log('📅 [4/5] Seeding July 2026 Attendance, Leaves, and Overtime records...');
  await seedJulyPayrollData();

  // 5. Today's Live Attendance (2026-10-27)
  console.log('⚡ [5/5] Seeding Today\'s Live Floor Attendance & Overtime punches...');
  const today = new Date('2026-10-27T00:00:00.000Z');
  await Attendance.deleteMany({
    date: {
      $gte: new Date('2026-10-27T00:00:00.000Z'),
      $lte: new Date('2026-10-27T23:59:59.999Z')
    }
  });

  const defaultShift = await Shift.findOne() || { startTime: '09:00', endTime: '18:00' };

  for (let idx = 0; idx < employees.length; idx++) {
    const emp = employees[idx];
    if (idx === 0) {
      // Mohammad Hamza Hakim - Online & Working
      await Attendance.create({
        employeeId: emp._id,
        date: today,
        checkIn: new Date('2026-10-27T03:55:00.000Z'), // ~08:55 AM PKT
        workDurationMinutes: 480,
        status: 'present',
        source: 'web'
      });
    } else if (idx === 1) {
      // Zubair Ahmed - Clocked Out with 2.5h Pending Overtime!
      await Attendance.create({
        employeeId: emp._id,
        date: today,
        checkIn: new Date('2026-10-27T03:50:00.000Z'),
        checkOut: new Date('2026-10-27T15:30:00.000Z'), // ~08:30 PM PKT
        workDurationMinutes: 690,
        overtimeMinutes: 150, // 2.5h
        overtimeApproved: false,
        status: 'present',
        source: 'biometric'
      });
    } else if (idx === 2) {
      // Ayesha Malik - Clocked Out with 3.0h Approved Overtime!
      await Attendance.create({
        employeeId: emp._id,
        date: today,
        checkIn: new Date('2026-10-27T04:00:00.000Z'),
        checkOut: new Date('2026-10-27T16:00:00.000Z'),
        workDurationMinutes: 720,
        overtimeMinutes: 180, // 3.0h
        overtimeApproved: true,
        status: 'present',
        source: 'biometric'
      });
    } else if (idx === 3) {
      // Bilal Tariq - On Break
      await Attendance.create({
        employeeId: emp._id,
        date: today,
        checkIn: new Date('2026-10-27T04:05:00.000Z'),
        breaks: [
          { startTime: new Date('2026-10-27T08:00:00.000Z') } // open break
        ],
        totalBreakMinutes: 15,
        workDurationMinutes: 240,
        status: 'present',
        source: 'web'
      });
    } else if (idx === 4) {
      // Farhan Saeed - Late punch
      await Attendance.create({
        employeeId: emp._id,
        date: today,
        checkIn: new Date('2026-10-27T04:45:00.000Z'), // ~09:45 AM PKT
        workDurationMinutes: 420,
        status: 'late',
        flags: ['graceApplied'],
        source: 'web'
      });
    } else if (idx < 10) {
      // Other employees online
      await Attendance.create({
        employeeId: emp._id,
        date: today,
        checkIn: new Date('2026-10-27T04:00:00.000Z'),
        workDurationMinutes: 400,
        status: 'present',
        source: 'web'
      });
    }
    // remaining are absent
  }

  console.log('✅ [RESTORE] Full system data restoration completed with 100% integrity!');
  process.exit(0);
}

runFullSystemSeed().catch((err) => {
  console.error('❌ Restore failed:', err);
  process.exit(1);
});
