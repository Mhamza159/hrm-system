import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Employee } from '../models/employee.model.js';
import { Loan } from '../models/loan.model.js';

async function main() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to DB');

  const empUser = await User.findOne({ email: 'employee@hrm.company.pk' }).populate('employeeId');
  if (!empUser || !empUser.employeeId) {
    console.error('Employee not found');
    process.exit(1);
  }

  const employee = empUser.employeeId;
  console.log('Found employee:', employee.firstName, employee.lastName, employee._id);

  // Check if active loan already exists
  const existing = await Loan.findOne({ employeeId: employee._id, status: 'active' });
  if (existing) {
    console.log('Existing active loan:', existing.loanId);
  } else {
    const loan = await Loan.create({
      loanId: 'LN-2026-0002',
      employeeId: employee._id,
      type: 'loan',
      amount: 4000000, // PKR 40,000
      remainingBalance: 4000000,
      totalRepaid: 0,
      repaymentTenureMonths: 2,
      effectiveMonth: '2026-10',
      reason: 'Home renovation loan for test verification',
      status: 'active',
      schedule: [
        {
          installmentNumber: 1,
          dueMonth: '2026-10',
          amount: 2000000, // PKR 20,000
          status: 'pending'
        },
        {
          installmentNumber: 2,
          dueMonth: '2026-11',
          amount: 2000000, // PKR 20,000
          status: 'pending'
        }
      ],
      adminApproval: {
        decidedBy: empUser._id,
        decidedAt: new Date(),
        remarks: 'Direct test approval for payroll verification'
      }
    });
    console.log('Created active loan:', loan.loanId);
  }

  await mongoose.disconnect();
}

main().catch(console.error);

