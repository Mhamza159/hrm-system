import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Payslip } from '../models/payslip.model.js';
import { Employee } from '../models/employee.model.js';
import { PayrollRun } from '../models/payrollRun.model.js';

async function main() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected');

  const emp = await Employee.findOne({ email: 'employee@hrm.company.pk' });
  const run = await PayrollRun.findOne({ month: 11, year: 2026 });

  await Payslip.deleteMany({ month: 11, year: 2026 });

  const slip = await Payslip.create({
    payrollRunId: run._id,
    employeeId: emp._id,
    month: 11,
    year: 2026,
    status: 'paid',
    paymentStatus: 'paid',
    earnings: [
      { name: 'Basic Salary', category: 'basic', amount: 6000000 },
      { name: 'House Rent Allowance', category: 'house_rent', amount: 2500000 },
      { name: 'Medical Allowance', category: 'medical', amount: 1000000 },
      { name: 'Conveyance Allowance', category: 'conveyance', amount: 500000 }
    ],
    deductions: [
      {
        name: 'Loan Installment (LN-2026-0001)',
        category: 'loan_installment',
        amount: 2500000,
        description: 'Installment 1 of 2 for LN-2026-0001'
      }
    ],
    grossPay: 10000000,
    totalDeductions: 2500000,
    netPay: 7500000
  });

  console.log('Created payslip:', slip._id);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
