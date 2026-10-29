import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Employee } from '../models/employee.model.js';
import { SalaryStructure } from '../models/salaryStructure.model.js';
import { Loan } from '../models/loan.model.js';

async function check() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to DB');
  const users = await User.find({}, 'email roles employeeId');
  console.log('Users:', users.map(u => ({ email: u.email, employeeId: u.employeeId })));
  const emps = await Employee.find({}, 'workEmail employeeId');
  console.log('Employees:', emps.map(e => ({ workEmail: e.workEmail, id: e._id, employeeId: e.employeeId })));
  const sal = await SalaryStructure.find({}, 'employeeId baseSalary grossSalary');
  console.log('Salaries count:', sal.length);
  const loans = await Loan.find({});
  console.log('Loans count:', loans.length);
  process.exit(0);
}
check();

