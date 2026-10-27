/**
 * @file seedAugustPayrollData.js
 * @description Seeds comprehensive August 2026 Attendance, Leaves, Late Penalties, Overtime, 
 * MonthLock, and calculates the official M9 Payroll Run with line-item factor verification.
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import '../models/role.model.js';
import '../models/setting.model.js';
import { User } from '../models/user.model.js';
import { Employee } from '../models/employee.model.js';
import { Department } from '../models/department.model.js';
import { Designation } from '../models/designation.model.js';
import { Shift } from '../models/shift.model.js';
import { SalaryStructure } from '../models/salaryStructure.model.js';
import { LeaveType } from '../models/leaveType.model.js';
import { Leave } from '../models/leave.model.js';
import { LeaveBalance } from '../models/leaveBalance.model.js';
import { Attendance } from '../models/attendance.model.js';
import { MonthLock } from '../models/monthLock.model.js';
import { PayrollRun } from '../models/payrollRun.model.js';
import { Payslip } from '../models/payslip.model.js';
import { PayrollService } from '../modules/payroll/payroll.service.js';

export async function seedAugustPayroll() {
  console.log('🚀 [August Payroll Seed] Starting end-to-end data generation...');
  await connectDB();

  // 1. Fetch or identify Admin Actor
  const adminUser = await User.findOne({ isActive: true }).populate('roles');
  if (!adminUser) {
    throw new Error('No active user found in database. Run dev.seed.js first.');
  }

  // 2. Fetch all active employees
  const employees = await Employee.find({ isDeleted: false, status: { $ne: 'Terminated' } })
    .populate('departmentId')
    .populate('designationId');

  if (employees.length === 0) {
    throw new Error('No employees found in database. Please ensure employees exist.');
  }

  console.log(`📋 Found ${employees.length} active employees to prepare for August 2026 payroll.`);

  // 3. Ensure Default Shift exists
  let shift = await Shift.findOne({ code: 'GEN-01' });
  if (!shift) {
    shift = await Shift.create({
      name: 'General Corporate Shift',
      code: 'GEN-01',
      type: 'fixed',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      breakMinutes: 60,
      halfDayMinutes: 240
    });
    console.log('✅ Created General Shift: 09:00 - 18:00');
  }

  // 4. Ensure Salary Structures exist for each employee
  console.log('💰 Verifying / assigning active Salary Structures...');
  const baseSalariesPKR = [80000, 65000, 95000, 120000, 70000, 85000];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    let struct = await SalaryStructure.findOne({ employeeId: emp._id, status: 'active', isDeleted: false });

    if (!struct) {
      const basePKR = baseSalariesPKR[i % baseSalariesPKR.length];
      const basic = Math.round(basePKR * 0.6 * 100); // 60% Basic (in paisa)
      const houseRent = Math.round(basePKR * 0.25 * 100); // 25% HRA
      const medical = Math.round(basePKR * 0.08 * 100); // 8% Medical
      const conveyance = Math.round(basePKR * 0.07 * 100); // 7% Conveyance
      const other = 0;
      const gross = basic + houseRent + medical + conveyance + other;

      struct = await SalaryStructure.create({
        employeeId: emp._id,
        effectiveFrom: new Date('2026-01-01'),
        currency: 'PKR',
        basicSalary: basic,
        houseRentAllowance: houseRent,
        medicalAllowance: medical,
        conveyanceAllowance: conveyance,
        otherAllowances: other,
        grossSalary: gross,
        eobiEnabled: true,
        pessiEnabled: false,
        providentFundEnabled: i % 2 === 0, // Enable for alternate employees
        providentFundRate: i % 2 === 0 ? 8.33 : 0,
        status: 'active',
        revisedBy: adminUser._id
      });
      console.log(`   + Created SalaryStructure for ${emp.name} (${emp.employeeCode}): Gross PKR ${basePKR.toLocaleString()}`);
    } else {
      console.log(`   ✓ Active SalaryStructure exists for ${emp.name}: Gross PKR ${(struct.grossSalary / 100).toLocaleString()}`);
    }
  }

  // 5. Ensure Leave Types exist
  let annualType = await LeaveType.findOne({ code: 'ANNUAL' });
  if (!annualType) {
    annualType = await LeaveType.create({
      name: 'Annual Leave',
      code: 'ANNUAL',
      daysPerYear: 14,
      isPaid: true
    });
  }

  let casualType = await LeaveType.findOne({ code: 'CASUAL' });
  if (!casualType) {
    casualType = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CASUAL',
      daysPerYear: 10,
      isPaid: true
    });
  }

  let unpaidType = await LeaveType.findOne({ code: 'UNPAID' });
  if (!unpaidType) {
    unpaidType = await LeaveType.create({
      name: 'Unpaid Leave (LWP)',
      code: 'UNPAID',
      daysPerYear: 30,
      isPaid: false
    });
  }

  // Clean old August 2026 leaves and attendance for fresh idempotency
  const augStart = new Date(Date.UTC(2026, 7, 1, 0, 0, 0));
  const augEnd = new Date(Date.UTC(2026, 7, 31, 23, 59, 59, 999));

  await Leave.deleteMany({
    startDate: { $gte: augStart, $lte: augEnd }
  });
  await Attendance.deleteMany({
    date: { $gte: augStart, $lte: augEnd }
  });

  console.log('🧹 Cleaned existing August 2026 attendance and leave records.');

  // 6. Seed Specific Leaves for August 2026
  // Assign 2 Unpaid Days to Employee index 1 (to demonstrate Unpaid Leave deduction)
  if (employees.length > 1) {
    const unpaidEmp = employees[1];
    await Leave.create({
      employeeId: unpaidEmp._id,
      leaveTypeId: unpaidType._id,
      startDate: new Date(Date.UTC(2026, 7, 10)),
      endDate: new Date(Date.UTC(2026, 7, 11)),
      days: 2,
      reason: 'Personal urgent matter outside leave quota',
      status: 'approved',
      currentApproverRole: 'none',
      auditHistory: [
        {
          action: 'approve',
          performedBy: adminUser._id,
          role: 'HR Manager',
          timestamp: new Date('2026-08-08')
        }
      ]
    });
    console.log(`🌴 Created 2-day Approved Unpaid Leave for ${unpaidEmp.name} (Aug 10 - Aug 11)`);
  }

  // Assign 1 Paid Casual Leave to Employee index 0
  if (employees.length > 0) {
    const paidEmp = employees[0];
    await Leave.create({
      employeeId: paidEmp._id,
      leaveTypeId: casualType._id,
      startDate: new Date(Date.UTC(2026, 7, 18)),
      endDate: new Date(Date.UTC(2026, 7, 18)),
      days: 1,
      reason: 'Family event',
      status: 'approved',
      currentApproverRole: 'none',
      auditHistory: [
        {
          action: 'approve',
          performedBy: adminUser._id,
          role: 'HR Manager',
          timestamp: new Date('2026-08-17')
        }
      ]
    });
    console.log(`🌴 Created 1-day Approved Paid Casual Leave for ${paidEmp.name} (Aug 18)`);
  }

  // 7. Seed Daily August Attendance (31 Calendar Days)
  console.log('⏱️ Generating August 2026 attendance roster...');

  const daysInAug = 31;
  const attendanceDocs = [];

  for (let day = 1; day <= daysInAug; day++) {
    const dateUtc = new Date(Date.UTC(2026, 7, day, 0, 0, 0));
    const dayOfWeek = dateUtc.getUTCDay(); // 0 = Sun, 6 = Sat

    // Weekend (Saturday or Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // Gazetted Public Holiday: August 14 (Independence Day)
    if (day === 14) {
      for (const emp of employees) {
        attendanceDocs.push({
          employeeId: emp._id,
          date: dateUtc,
          shiftId: shift._id,
          status: 'holiday',
          source: 'system_auto_absent',
          flags: []
        });
      }
      continue;
    }

    // Working Day Simulation for each employee
    for (let empIdx = 0; empIdx < employees.length; empIdx++) {
      const emp = employees[empIdx];

      // Check if on leave
      if (empIdx === 1 && (day === 10 || day === 11)) {
        // Unpaid leave
        attendanceDocs.push({
          employeeId: emp._id,
          date: dateUtc,
          shiftId: shift._id,
          status: 'on_leave',
          source: 'web'
        });
        continue;
      }

      if (empIdx === 0 && day === 18) {
        // Paid casual leave
        attendanceDocs.push({
          employeeId: emp._id,
          date: dateUtc,
          shiftId: shift._id,
          status: 'on_leave',
          source: 'web'
        });
        continue;
      }

      // Late arrival scenarios:
      // Employee 0: Exactly 3 lates (Day 3, Day 6, Day 12) -> Math.floor(3/3) = 1 Day Penalty!
      let isLate = false;
      if (empIdx === 0 && [3, 6, 12].includes(day)) {
        isLate = true;
      }

      // Employee 1: Exactly 6 lates (Day 4, Day 5, Day 7, Day 17, Day 21, Day 25) -> Math.floor(6/3) = 2 Days Penalty!
      // Plus Overtime on Day 13 (180 mins) and Day 20 (120 mins) = 5 hours OT!
      let overtimeMinutes = 0;
      let overtimeApproved = false;

      if (empIdx === 1) {
        if ([4, 5, 7, 17, 21, 25].includes(day)) {
          isLate = true;
        }
        if (day === 13) {
          overtimeMinutes = 180;
          overtimeApproved = true;
        } else if (day === 20) {
          overtimeMinutes = 120;
          overtimeApproved = true;
        }
      }

      // Employee 2 (if exists): 1 single late (Day 5) -> Math.floor(1/3) = 0 Penalty (Grace)!
      // Plus Overtime on Day 24 (240 mins = 4 hrs OT)
      if (empIdx === 2) {
        if (day === 5) isLate = true;
        if (day === 24) {
          overtimeMinutes = 240;
          overtimeApproved = true;
        }
      }

      // Set checkIn / checkOut timestamps
      const checkInHour = isLate ? 9 : 8;
      const checkInMin = isLate ? 35 : 55;
      const checkOutHour = overtimeMinutes > 0 ? 18 + Math.floor(overtimeMinutes / 60) : 18;
      const checkOutMin = overtimeMinutes > 0 ? overtimeMinutes % 60 : 5;

      const checkIn = new Date(Date.UTC(2026, 7, day, checkInHour, checkInMin, 0));
      const checkOut = new Date(Date.UTC(2026, 7, day, checkOutHour, checkOutMin, 0));
      const workDurationMinutes = Math.round((checkOut - checkIn) / 60000);

      attendanceDocs.push({
        employeeId: emp._id,
        date: dateUtc,
        shiftId: shift._id,
        checkIn,
        checkOut,
        workDurationMinutes,
        overtimeMinutes,
        overtimeApproved,
        status: isLate ? 'late' : 'present',
        flags: isLate ? [] : ['graceApplied'],
        source: 'web'
      });
    }
  }

  await Attendance.insertMany(attendanceDocs);
  console.log(`✅ Inserted ${attendanceDocs.length} attendance records across August 2026.`);

  // 8. Lock August 2026 Attendance MonthLock
  let monthLock = await MonthLock.findOne({ yearMonth: '2026-08' });
  if (!monthLock) {
    monthLock = await MonthLock.create({
      yearMonth: '2026-08',
      isLocked: true,
      lockedBy: adminUser._id,
      lockedAt: new Date('2026-08-31T23:59:59Z'),
      notes: 'August 2026 cycle finalized for official payroll batch calculation.'
    });
    console.log('🔒 Locked Attendance for 2026-08 (MonthLock initialized).');
  } else {
    monthLock.isLocked = true;
    monthLock.lockedAt = new Date('2026-08-31T23:59:59Z');
    await monthLock.save();
    console.log('🔒 Verified Attendance MonthLock for 2026-08 is active.');
  }

  // 9. Execute Batch Payroll Calculation for August 2026
  console.log('⚙️ Executing official Payroll Calculation for August 2026...');
  const payrollRun = await PayrollService.generatePayrollRun(8, 2026, adminUser);
  console.log(`🎉 PayrollRun generated successfully with ID: ${payrollRun._id} (Status: ${payrollRun.status})`);

  // 10. Fetch and summarize generated payslips
  const payslips = await Payslip.find({ payrollRunId: payrollRun._id }).populate({
    path: 'employeeId',
    select: 'name employeeCode email designationId departmentId',
    populate: [
      { path: 'departmentId', select: 'name' },
      { path: 'designationId', select: 'title' }
    ]
  });

  console.log('\n========================================================================================');
  console.log('📊 OFFICIAL AUGUST 2026 PAYROLL RUN SUMMARY (M9 ENGINE OUTPUT)');
  console.log('========================================================================================');

  const tableData = payslips.map((slip) => {
    const emp = slip.employeeId;
    return {
      'Code': emp?.employeeCode,
      'Employee': emp?.name,
      'Gross (PKR)': (slip.grossPay / 100).toLocaleString(),
      'OT Pay (PKR)': slip.overtimePay > 0 ? `+${(slip.overtimePay / 100).toLocaleString()} (${slip.overtimeHours}h)` : '0',
      'Late Fine': slip.lateDeductionDays > 0 ? `-${(slip.deductions.find(d => d.category === 'late_penalty')?.amount / 100 || 0).toLocaleString()} (${slip.lateDeductionDays}d)` : '0',
      'Unpaid LWP': slip.unpaidLeaveDays > 0 ? `-${(slip.deductions.find(d => d.category === 'unpaid_leave')?.amount / 100 || 0).toLocaleString()} (${slip.unpaidLeaveDays}d)` : '0',
      'EOBI (1%)': `-${(slip.eobiEmployee / 100).toLocaleString()}`,
      'Tax Withheld': slip.taxWithheld > 0 ? `-${(slip.taxWithheld / 100).toLocaleString()}` : '0',
      'Net Pay (PKR)': (slip.netPay / 100).toLocaleString()
    };
  });

  console.table(tableData);

  console.log('========================================================================================');
  console.log(`📌 Run Aggregates:`);
  console.log(`   - Total Employees: ${payslips.length}`);
  console.log(`   - Total Gross Pay: PKR ${(payrollRun.totalGrossPay / 100).toLocaleString()}`);
  console.log(`   - Total Overtime Pay: PKR ${(payrollRun.totalOvertimePay / 100).toLocaleString()}`);
  console.log(`   - Total Deductions: PKR ${(payrollRun.totalDeductions / 100).toLocaleString()}`);
  console.log(`   - Total Net Disbursable: PKR ${(payrollRun.totalNetPay / 100).toLocaleString()}`);
  console.log('========================================================================================\n');

  return { payrollRun, payslips };
}

// Auto-run when invoked directly
if (process.argv[1]?.includes('seedAugustPayrollData.js')) {
  seedAugustPayroll()
    .then(() => {
      console.log('✨ August 2026 Payroll Seed successfully completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed to seed August Payroll:', err);
      process.exit(1);
    });
}
