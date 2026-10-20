/**
 * @file payroll.phase4.test.js
 * @description Integration Tests for Phase 4: Final exit settlements, Form IT-3 tax certificates,
 * compliance audit reports, team overtime privacy guards, and departmental payroll cost analytics.
 * 
 * Slices Verified:
 * - 9.13-TEST: Employee Final Exit Settlement & Gratuity Calculation (BUILD-GUIDE 9.13)
 * - 9.14-TEST: Form IT-3 Annual Tax Withholding Certificate Generation (BUILD-GUIDE 9.14)
 * - 9.15-TEST: Statutory FBR Withholding & EOBI Compliance Audit Reports (BUILD-GUIDE 9.15)
 * - 9.16-TEST: Department Manager Team Overtime Guard (BUILD-GUIDE 9.16)
 * - 9.17-TEST: Departmental Payroll Cost Analytics Aggregation (BUILD-GUIDE 9.17)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { PayrollRun } from '../src/models/payrollRun.model.js';
import { Payslip } from '../src/models/payslip.model.js';
import { generateAnnualTaxCertificate } from '../src/modules/payroll/payslipPdf.service.js';

describe('Module M9 — Phase 4: Exit Settlements, Certificates, Reports & Overtime Suite', { timeout: 35000 }, () => {
  let superAdminToken;
  let hrManagerToken;
  let deptManagerToken;
  let regularEmployeeToken;

  let testDept;
  let testDesig;
  let settlingEmployeeDoc;
  let regularEmployeeDoc;
  let teamMemberDoc;

  let testRun;
  let paidSlip;

  beforeAll(async () => {
    await connectDB();
    const timestamp = Date.now();

    // 1. Roles
    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        description: 'Full control',
        permissions: ['*']
      });
    }

    let hrRole = await Role.findOne({ name: 'HR Manager' });
    if (!hrRole) {
      hrRole = await Role.create({
        name: 'HR Manager',
        description: 'HR Ops',
        permissions: ['payroll.manage', 'payroll.view', 'payroll.run', 'payroll.export', 'employee.view']
      });
    }

    let dmRole = await Role.findOne({ name: 'Department Manager' });
    if (!dmRole) {
      dmRole = await Role.create({
        name: 'Department Manager',
        description: 'Team lead',
        permissions: ['attendance.view', 'org.view']
      });
    }

    let empRole = await Role.findOne({ name: 'Employee' });
    if (!empRole) {
      empRole = await Role.create({
        name: 'Employee',
        description: 'Self-service',
        permissions: ['payroll.view']
      });
    }

    // 2. Org Entities
    testDept = await Department.create({
      name: `Engineering Phase4 ${timestamp}`,
      code: `ENG4-${timestamp.toString().slice(-4)}`
    });

    testDesig = await Designation.create({
      title: `Software Architect ${timestamp}`,
      code: `SA4-${timestamp.toString().slice(-4)}`,
      grade: 'Lead',
      departmentId: testDept._id
    });

    // 3. Employees
    // Settling employee with 3 years tenure
    settlingEmployeeDoc = await Employee.create({
      employeeCode: `EMP-SETTLE-${timestamp.toString().slice(-4)}`,
      name: 'Hamza Khan Settling',
      email: `settle_${timestamp}@hrmcorp.test`,
      cnic: '42201-1234567-9',
      departmentId: testDept._id,
      designationId: testDesig._id,
      joiningDate: new Date(Date.now() - 3.2 * 365.25 * 24 * 60 * 60 * 1000), // ~3.2 years ago
      employmentStatus: 'Active'
    });

    // Active salary for settling employee: PKR 150,000 basic
    await SalaryStructure.create({
      employeeId: settlingEmployeeDoc._id,
      effectiveFrom: new Date('2024-01-01'),
      basicSalary: 15000000, // 150,000 PKR in paisa
      grossSalary: 22000000,
      netSalary: 19500000,
      currency: 'PKR',
      status: 'active'
    });

    // Regular employee
    regularEmployeeDoc = await Employee.create({
      employeeCode: `EMP-REG-${timestamp.toString().slice(-4)}`,
      name: 'Bilal Regular',
      email: `bilal_${timestamp}@hrmcorp.test`,
      cnic: '42201-9876543-1',
      departmentId: testDept._id,
      designationId: testDesig._id,
      joiningDate: new Date('2024-01-15'),
      employmentStatus: 'Active'
    });

    // Team member reporting to Dept Manager
    teamMemberDoc = await Employee.create({
      employeeCode: `EMP-TEAM-${timestamp.toString().slice(-4)}`,
      name: 'Usman TeamDev',
      email: `usman_${timestamp}@hrmcorp.test`,
      cnic: '42201-5555555-5',
      departmentId: testDept._id,
      designationId: testDesig._id,
      joiningDate: new Date('2024-03-01'),
      employmentStatus: 'Active'
    });

    // Dept Manager employee
    const dmEmployeeDoc = await Employee.create({
      employeeCode: `EMP-DM-${timestamp.toString().slice(-4)}`,
      name: 'Kashif Manager',
      email: `dm_${timestamp}@hrmcorp.test`,
      cnic: '42201-7777777-7',
      departmentId: testDept._id,
      designationId: testDesig._id,
      joiningDate: new Date('2023-01-01'),
      employmentStatus: 'Active'
    });

    // 4. Users & Auth Tokens
    const superAdminUser = await User.create({
      name: 'Super Admin User',
      email: `super_${timestamp}@hrmcorp.test`,
      passwordHash: 'dummyhash',
      roles: [superAdminRole._id],
      isActive: true
    });

    const hrUser = await User.create({
      name: 'HR Manager User',
      email: `hr_${timestamp}@hrmcorp.test`,
      passwordHash: 'dummyhash',
      roles: [hrRole._id],
      isActive: true
    });

    const dmUser = await User.create({
      name: 'Dept Manager User',
      email: `dm_${timestamp}@hrmcorp.test`,
      passwordHash: 'dummyhash',
      roles: [dmRole._id],
      employeeId: dmEmployeeDoc._id,
      departmentId: testDept._id,
      isActive: true
    });

    const regEmpUser = await User.create({
      name: 'Regular Employee User',
      email: `emp_${timestamp}@hrmcorp.test`,
      passwordHash: 'dummyhash',
      roles: [empRole._id],
      employeeId: regularEmployeeDoc._id,
      departmentId: testDept._id,
      isActive: true
    });

    superAdminToken = jwt.sign(
      { userId: superAdminUser._id, roles: ['Super Admin'], permissions: ['*'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    hrManagerToken = jwt.sign(
      {
        userId: hrUser._id,
        roles: ['HR Manager'],
        permissions: ['payroll.manage', 'payroll.view', 'payroll.run', 'payroll.export', 'employee.view']
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    deptManagerToken = jwt.sign(
      {
        userId: dmUser._id,
        employeeId: dmEmployeeDoc._id,
        departmentId: testDept._id,
        roles: ['Department Manager'],
        permissions: ['attendance.view', 'org.view']
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    regularEmployeeToken = jwt.sign(
      {
        userId: regEmpUser._id,
        employeeId: regularEmployeeDoc._id,
        roles: ['Employee'],
        permissions: ['payroll.view']
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Seed Paid Payroll Run & Payslips for Reporting Slices (9.14, 9.15, 9.17)
    testRun = await PayrollRun.create({
      month: 7,
      year: 2025,
      cycleStartDate: new Date('2025-07-01'),
      cycleEndDate: new Date('2025-07-31'),
      payDate: new Date('2025-08-01'),
      status: 'paid',
      generatedBy: superAdminUser._id,
      totalEmployees: 2,
      totalGrossPay: 40000000, // 400,000 PKR
      totalNetPay: 34000000,   // 340,000 PKR
      totalTax: 3000000,       // 30,000 PKR
      totalEOBI: 1200000,      // 12,000 PKR
      totalDeductions: 6000000
    });

    paidSlip = await Payslip.create({
      payrollRunId: testRun._id,
      employeeId: regularEmployeeDoc._id,
      departmentId: testDept._id,
      designationId: testDesig._id,
      month: 7,
      year: 2025,
      grossPay: 20000000,
      totalDeductions: 3000000,
      netPay: 17000000,
      taxWithheld: 1500000,
      incomeTax: 1500000,
      eobiEmployee: 300000,
      eobiEmployer: 1500000,
      status: 'paid',
      paymentMethod: 'bank_transfer',
      disbursementDate: new Date('2025-08-01'),
      earnings: [{ name: 'Basic Salary', category: 'basic', amount: 20000000 }],
      deductions: [
        { name: 'Income Tax', category: 'tax', amount: 1500000 },
        { name: 'EOBI Employee Share', category: 'eobi', amount: 300000 }
      ],
      attendanceSummary: {
        workingDays: 30,
        presentDays: 30,
        unpaidLeaves: 0,
        overtimeHours: 0
      }
    });

    // Also a payslip for teamMember with overtime hours
    await Payslip.create({
      payrollRunId: testRun._id,
      employeeId: teamMemberDoc._id,
      departmentId: testDept._id,
      designationId: testDesig._id,
      month: 7,
      year: 2025,
      grossPay: 15000000,
      totalDeductions: 2000000,
      netPay: 13000000,
      taxWithheld: 1000000,
      incomeTax: 1000000,
      eobiEmployee: 300000,
      eobiEmployer: 1500000,
      overtimeHours: 18.5,
      overtimePay: 1850000,
      status: 'paid',
      paymentMethod: 'bank_transfer',
      earnings: [
        { name: 'Basic Salary', category: 'basic', amount: 13150000 },
        { name: 'Overtime Pay', category: 'overtime', amount: 1850000 }
      ],
      deductions: [
        { name: 'Income Tax', category: 'tax', amount: 1000000 },
        { name: 'EOBI Employee Share', category: 'eobi', amount: 300000 }
      ],
      attendanceSummary: {
        workingDays: 30,
        presentDays: 30,
        unpaidLeaves: 0,
        overtimeHours: 18.5
      }
    });
  }, 35000);

  afterAll(async () => {
    await PayrollRun.deleteMany({ _id: testRun?._id });
    await Payslip.deleteMany({ departmentId: testDept?._id });
    await SalaryStructure.deleteMany({ employeeId: settlingEmployeeDoc?._id });
    await Employee.deleteMany({ departmentId: testDept?._id });
    await Designation.deleteMany({ _id: testDesig?._id });
    await Department.deleteMany({ _id: testDept?._id });
  }, 35000);

  // ---------------------------------------------------------------------------
  // Slice 9.13: Employee Final Exit Settlement & Gratuity Calculation
  // ---------------------------------------------------------------------------
  it('9.13-TEST: POST /api/v1/payroll/final-settlement/:id processes gratuity and exit clearance', async () => {
    const res = await request(app)
      .post(`/api/v1/payroll/final-settlement/${settlingEmployeeDoc._id}`)
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        exitDate: new Date().toISOString().split('T')[0],
        payableDays: 15,
        encashableLeaveDays: 8,
        loanDeduction: 20000,
        advanceDeduction: 0,
        separationType: 'Resigned',
        reason: 'Relocating to another city'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const settlement = res.body.data;
    // Base salary was PKR 150,000 (15000000 paisa)
    // 3 completed years -> gratuity = 150,000 * 3 = PKR 450,000 (45000000 paisa)
    expect(settlement.gratuityYears).toBe(3);
    expect(settlement.gratuityPaisa).toBe(45000000);

    // Pro-rated salary for 15 days = (150,000 / 30) * 15 = PKR 75,000 (7500000 paisa)
    expect(settlement.proRatedSalaryPaisa).toBe(7500000);

    // Leave encashment for 8 days = (150,000 / 30) * 8 = PKR 40,000 (4000000 paisa)
    expect(settlement.leaveEncashmentPaisa).toBe(4000000);

    // Gross settlement = 75,000 + 40,000 + 450,000 = PKR 565,000 (56500000 paisa)
    expect(settlement.grossSettlementPaisa).toBe(56500000);

    // Net settlement = 565,000 - 20,000 loan = PKR 545,000 (54500000 paisa)
    expect(settlement.netSettlementPaisa).toBe(54500000);

    // Check employee status updated to Resigned
    const updatedEmp = await Employee.findById(settlingEmployeeDoc._id);
    expect(updatedEmp.status).toBe('Resigned');
  });

  // ---------------------------------------------------------------------------
  // Slice 9.14: Form IT-3 Annual Tax Withholding Certificate
  // ---------------------------------------------------------------------------
  it('9.14-TEST: generateAnnualTaxCertificate creates valid FBR Form IT-3 PDF buffer', async () => {
    const buffer = await generateAnnualTaxCertificate(
      regularEmployeeDoc,
      2026, // Covers July 2025
      [paidSlip]
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('9.14-TEST: GET /api/v1/payslips/annual-tax-certificate streams PDF to authenticated employee', async () => {
    const res = await request(app)
      .get(`/api/v1/payslips/annual-tax-certificate?taxYear=2026`)
      .set('Authorization', `Bearer ${regularEmployeeToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('inline');
  });

  // ---------------------------------------------------------------------------
  // Slice 9.15: Statutory Withholding & EOBI Compliance Audit Reports
  // ---------------------------------------------------------------------------
  it('9.15-TEST: GET /api/v1/reports/tax-compliance aggregates FBR Section 149 withholding correctly', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/tax-compliance?taxYear=2026`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.taxYear).toBe(2026);
    expect(res.body.data.totalTaxWithheldPaisa).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.monthlyBreakdown)).toBe(true);
  });

  it('9.15-TEST: GET /api/v1/reports/eobi-compliance aggregates employee 1% and employer 5% shares', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/eobi-compliance?year=2025`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.year).toBe(2025);
    expect(res.body.data.totalEmployeeEobiPaisa).toBeGreaterThan(0);
    expect(res.body.data.totalEmployerEobiPaisa).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.monthlyBreakdown)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Slice 9.16: Department Manager Team Overtime Guard (Privacy Enforcement)
  // ---------------------------------------------------------------------------
  it('9.16-TEST: GET /api/v1/payroll/team-overtime returns team overtime hours without salary figures', async () => {
    const res = await request(app)
      .get(`/api/v1/payroll/team-overtime?month=7&year=2025`)
      .set('Authorization', `Bearer ${deptManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.team)).toBe(true);

    const overtimeRecord = res.body.data.team.find((item) => item.employeeId?.toString() === teamMemberDoc._id.toString());
    expect(overtimeRecord).toBeDefined();
    expect(overtimeRecord.overtimeHours).toBe(18.5);

    // Strict privacy assertions: basicSalary, grossSalary, and netPay MUST NOT be present
    expect(overtimeRecord.baseSalary).toBeUndefined();
    expect(overtimeRecord.grossSalary).toBeUndefined();
    expect(overtimeRecord.netPay).toBeUndefined();
    expect(overtimeRecord.basicSalary).toBeUndefined();
  });

  it('9.16-TEST: Department Manager is strictly forbidden from administrative payroll runs (403)', async () => {
    const res = await request(app)
      .get(`/api/v1/payroll/runs/${testRun._id}`)
      .set('Authorization', `Bearer ${deptManagerToken}`);

    expect(res.status).toBe(403);
  });

  // ---------------------------------------------------------------------------
  // Slice 9.17: Departmental Payroll Cost Analytics Aggregation
  // ---------------------------------------------------------------------------
  it('9.17-TEST: GET /api/v1/reports/payroll-cost aggregates departmental gross and net payroll totals', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/payroll-cost?year=2025`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const deptCost = res.body.data.find((d) => d._id?.toString() === testDept._id.toString());
    expect(deptCost).toBeDefined();
    expect(deptCost.totalGrossPaisa).toBe(35000000); // 200,000 + 150,000 PKR in paisa
    expect(deptCost.totalNetPaisa).toBe(30000000);   // 170,000 + 130,000 PKR in paisa
    expect(deptCost.employeeCount).toBe(2);
  });
});
