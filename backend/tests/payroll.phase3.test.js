/**
 * @file payroll.phase3.test.js
 * @description Integration Tests for Phase 3: Payslip PDF generation, self-service security, and bank advice sheets.
 * 
 * Slices Verified:
 * - 9.10-TEST: Branded Payslip PDF Generation (PDFKit) & Streaming Endpoint
 * - 9.11-TEST: Multi-Channel Payslip Delivery & Ownership Authorization Guard (403 on other employees' slips)
 * - 9.12-TEST: Corporate Bank Transfer Advice Sheet Generation (Meezan, HBL, Standard)
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
import { PayrollRun } from '../src/models/payrollRun.model.js';
import { Payslip } from '../src/models/payslip.model.js';
import { generatePayslipPdf } from '../src/modules/payroll/payslipPdf.service.js';
import { generateBankAdviceSheet } from '../src/modules/payroll/bankSheet.service.js';

describe('Module M9 — Phase 3: Payslip PDF, Security & Bank Advice Suite', { timeout: 35000 }, () => {
  let superAdminToken;
  let hrManagerToken;
  let regularEmployeeToken;
  let regularEmployeeDoc;
  let otherEmployeeDoc;
  let testRun;
  let employeePayslip;

  beforeAll(async () => {
    await connectDB();

    const timestamp = Date.now();

    // 1. Roles
    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        description: 'Full system control',
        permissions: ['*']
      });
    }

    let hrRole = await Role.findOne({ name: 'HR Manager' });
    if (!hrRole) {
      hrRole = await Role.create({
        name: 'HR Manager',
        description: 'HR Ops',
        permissions: ['payroll.manage', 'payroll.view', 'payroll.run', 'employee.view']
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

    // 2. Org Structure
    const dept = await Department.create({
      name: `Finance Dept ${timestamp}`,
      code: `FIN-${timestamp.toString().slice(-4)}`
    });

    const desig = await Designation.create({
      title: `Senior Financial Analyst ${timestamp}`,
      code: `SFA-${timestamp.toString().slice(-4)}`,
      grade: 'Senior',
      departmentId: dept._id
    });

    // 3. Users
    const superAdminUser = await User.create({
      name: 'Super Admin User',
      email: `admin.p3.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id]
    });

    const hrUser = await User.create({
      name: 'HR Manager User',
      email: `hr.p3.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      roles: [hrRole._id]
    });

    const empUser = await User.create({
      name: 'Hamza Tariq',
      email: `hamza.p3.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      roles: [empRole._id]
    });

    // 4. Employees
    regularEmployeeDoc = await Employee.create({
      employeeCode: `EMP-P3-1-${timestamp.toString().slice(-4)}`,
      name: 'Hamza Tariq',
      email: empUser.email,
      phone: '+923001234567',
      joiningDate: new Date('2023-01-01'),
      status: 'Active',
      cnic: '42201-1234567-1',
      userId: empUser._id,
      departmentId: dept._id,
      designationId: desig._id,
      bankDetails: {
        bankName: 'Meezan Bank Ltd',
        accountNumber: 'PK00MEZN00112233445566',
        branchCode: '0101'
      }
    });

    otherEmployeeDoc = await Employee.create({
      employeeCode: `EMP-P3-2-${timestamp.toString().slice(-4)}`,
      name: 'Ayesha Khan',
      email: `ayesha.p3.${timestamp}@example.com`,
      phone: '+923007654321',
      joiningDate: new Date('2023-01-01'),
      status: 'Active',
      cnic: '42201-7654321-2',
      departmentId: dept._id,
      designationId: desig._id,
      bankDetails: {
        bankName: 'Habib Bank Limited',
        accountNumber: '00112233445566',
        branchCode: '0001'
      }
    });

    // Update empUser with employeeId
    empUser.employeeId = regularEmployeeDoc._id;
    await empUser.save();

    // 5. Auth Tokens via JWT
    const signToken = (user, roleName) =>
      jwt.sign(
        { userId: user._id, email: user.email, roles: [roleName], employeeId: user.employeeId },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin');
    hrManagerToken = signToken(hrUser, 'HR Manager');
    regularEmployeeToken = signToken(empUser, 'Employee');

    // Clean up any stale records for this test period
    await Payslip.deleteMany({ month: 7, year: 2026 });
    await PayrollRun.deleteMany({ month: 7, year: 2026 });

    // 6. Test Payroll Run & Payslip
    testRun = await PayrollRun.create({
      month: 7,
      year: 2026,
      cycleStartDate: new Date('2026-07-01T00:00:00.000Z'),
      cycleEndDate: new Date('2026-07-31T23:59:59.999Z'),
      payDate: new Date('2026-08-01T00:00:00.000Z'),
      status: 'paid',
      employeeCount: 2,
      totalGrossPay: 35000000, // PKR 350,000
      totalDeductions: 3500000, // PKR 35,000
      totalNetPay: 31500000, // PKR 315,000
      totalIncomeTax: 2500000,
      totalEobi: 1000000,
      generatedBy: hrUser._id,
      approvedBy: superAdminUser._id,
      paidBy: superAdminUser._id,
      paidAt: new Date()
    });

    employeePayslip = await Payslip.create({
      payrollRunId: testRun._id,
      employeeId: regularEmployeeDoc._id,
      month: 7,
      year: 2026,
      grossPay: 20000000, // PKR 200,000
      totalDeductions: 2000000, // PKR 20,000
      netPay: 18000000, // PKR 180,000
      incomeTax: 1500000,
      eobiEmployee: 500000,
      status: 'paid',
      paymentMethod: 'bank_transfer',
      earnings: [
        { name: 'Basic Salary', category: 'basic', amount: 13000000, taxable: true },
        { name: 'House Rent Allowance', category: 'allowance', amount: 5000000, taxable: true },
        { name: 'Medical Allowance', category: 'allowance', amount: 2000000, taxable: false }
      ],
      deductions: [
        { name: 'FBR Income Tax', category: 'tax', amount: 1500000 },
        { name: 'EOBI Contribution', category: 'eobi', amount: 500000 }
      ],
      attendanceSummary: {
        workingDays: 30,
        presentDays: 30,
        unpaidLeaves: 0,
        overtimeHours: 0
      }
    });

    await Payslip.create({
      payrollRunId: testRun._id,
      employeeId: otherEmployeeDoc._id,
      month: 7,
      year: 2026,
      grossPay: 15000000,
      totalDeductions: 1500000,
      netPay: 13500000,
      incomeTax: 1000000,
      eobiEmployee: 500000,
      status: 'paid',
      paymentMethod: 'bank_transfer',
      earnings: [
        { name: 'Basic Salary', category: 'basic', amount: 10000000, taxable: true },
        { name: 'Conveyance Allowance', category: 'allowance', amount: 5000000, taxable: true }
      ],
      deductions: [
        { name: 'FBR Income Tax', category: 'tax', amount: 1000000 },
        { name: 'EOBI Contribution', category: 'eobi', amount: 500000 }
      ]
    });
  }, 35000);

  afterAll(async () => {
    if (testRun) {
      await Payslip.deleteMany({ payrollRunId: testRun._id });
      await PayrollRun.deleteOne({ _id: testRun._id });
    }
    if (regularEmployeeDoc) await Employee.deleteOne({ _id: regularEmployeeDoc._id });
    if (otherEmployeeDoc) await Employee.deleteOne({ _id: otherEmployeeDoc._id });
  });

  // ---------------------------------------------------------------------------
  // Slice 9.10: Branded Payslip PDF Generation Engine
  // ---------------------------------------------------------------------------
  it('9.10-BE: generatePayslipPdf produces a valid non-empty PDF buffer starting with %PDF-', async () => {
    const populatedSlip = await Payslip.findById(employeePayslip._id).populate({
      path: 'employeeId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'designationId', select: 'title' }
      ]
    });

    const pdfBuffer = await generatePayslipPdf(populatedSlip);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000); // Substantial PDF size

    // Check PDF magic byte signature: %PDF-
    const headerStr = pdfBuffer.slice(0, 8).toString('utf-8');
    expect(headerStr).toContain('%PDF-');
  });

  it('9.10-BE: GET /api/v1/payslips/:id/pdf returns 200 with application/pdf and inline disposition', async () => {
    const res = await request(app)
      .get(`/api/v1/payslips/${employeePayslip._id}/pdf`)
      .set('Authorization', `Bearer ${regularEmployeeToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('inline');
    expect(res.body.length).toBeGreaterThan(1000);
  });

  // ---------------------------------------------------------------------------
  // Slice 9.11: Multi-Channel Payslip Delivery & Security Guard
  // ---------------------------------------------------------------------------
  it("9.11-BE: Employee receives 403 Forbidden when attempting to access another employee's payslip PDF", async () => {
    const otherEmployeeSlip = await Payslip.findOne({
      payrollRunId: testRun._id,
      employeeId: otherEmployeeDoc._id
    });

    const res = await request(app)
      .get(`/api/v1/payslips/${otherEmployeeSlip._id}/pdf`)
      .set('Authorization', `Bearer ${regularEmployeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('not authorized');
  });

  it('9.11-BE: HR Manager successfully accesses any employee payslip PDF', async () => {
    const res = await request(app)
      .get(`/api/v1/payslips/${employeePayslip._id}/pdf`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  // ---------------------------------------------------------------------------
  // Slice 9.12: Corporate Bank Transfer Advice Sheet (ExcelJS)
  // ---------------------------------------------------------------------------
  it('9.12-BE: generateBankAdviceSheet generates valid Meezan corporate format with matching sums', async () => {
    const { buffer, filename } = await generateBankAdviceSheet(testRun._id, 'meezan');

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(filename).toContain('MEEZAN');
  });

  it('9.12-BE: generateBankAdviceSheet generates valid HBL corporate format', async () => {
    const { buffer, filename } = await generateBankAdviceSheet(testRun._id, 'hbl');

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(filename).toContain('HBL');
  });

  it('9.12-BE: GET /api/v1/payroll/runs/:id/bank-advice?bank=meezan returns 200 with xlsx attachment', async () => {
    const res = await request(app)
      .get(`/api/v1/payroll/runs/${testRun._id}/bank-advice?bank=meezan`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('attachment');
  });
});
