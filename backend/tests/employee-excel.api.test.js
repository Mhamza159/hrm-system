/**
 * @file employee-excel.api.test.js
 * @description Integration Tests for Excel Bulk Ingestion (Slice 3.13) and Excel Export (Slice 3.14).
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.13, 3.14)
 * - Verifies 50-row batch ingestion (45 valid, 5 invalid with row-level error reporting),
 *   Excel export binary buffer validation with ExcelJS, and role-based access control.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { env } from '../src/config/env.js';

describe('Module M3 — Excel Ingestion & Export Integration Tests (Slices 3.13 & 3.14)', () => {
  let hrToken;
  let employeeToken;
  let hrUser;
  let employeeUser;
  let testDept;
  let testDesig;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m3_excel');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});

    // 1. Roles
    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'employee.create', subject: 'Employee', scope: 'all' },
        { action: 'employee.view', subject: 'Employee', scope: 'all' },
        { action: 'report.export', subject: 'Report', scope: 'all' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'own' }
      ]
    });

    // 2. Users
    hrUser = await User.create({
      email: 'hr.excel@test.com',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isVerified: true,
      isActive: true
    });

    employeeUser = await User.create({
      email: 'employee.excel@test.com',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isVerified: true,
      isActive: true
    });

    // 3. Tokens
    hrToken = jwt.sign(
      { userId: hrUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: employeeUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Reference Department & Designation
    testDept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      isActive: true
    });

    testDesig = await Designation.create({
      title: 'Software Engineer',
      code: 'SWE',
      grade: 'Mid',
      departmentId: testDept._id,
      isActive: true
    });
  }, 20000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await mongoose.connection.close();
  });

  it('3.13.1: should reject employee role from uploading Excel sheets (HTTP 403)', async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Sheet1');
    ws.addRow(['Code', 'Name']);
    const buffer = await workbook.xlsx.writeBuffer();

    const res = await request(app)
      .post('/api/v1/employees/import')
      .set('Authorization', `Bearer ${employeeToken}`)
      .attach('file', buffer, {
        filename: 'test.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    expect(res.status).toBe(403);
  }, 15000);

  it('3.13.2: should batch ingest 50-row spreadsheet with 45 valid and 5 invalid rows (HTTP 200)', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Staff Ingestion');

    // Headers
    worksheet.addRow([
      'Employee Code',
      'Full Name',
      'Email',
      'Phone',
      'CNIC',
      'Department Code',
      'Designation Code',
      'Employment Type',
      'Joining Date',
      'Bank Name',
      'Account Title',
      'Account Number',
      'IBAN'
    ]);

    // 45 Valid Rows
    for (let i = 1; i <= 45; i++) {
      const codePadded = String(i).padStart(3, '0');
      const cnicMid = String(1000000 + i);
      worksheet.addRow([
        `EMP-BULK-${codePadded}`,
        `Candidate Number ${i}`,
        `candidate${i}@company.pk`,
        `+92 300 00000${codePadded}`,
        `35202-${cnicMid}-1`,
        'ENG',
        'SWE',
        'Permanent',
        '2026-01-15',
        'Meezan Bank',
        `Candidate Number ${i}`,
        `010101010${codePadded}`,
        `PK36MEZN00010101010${codePadded}`
      ]);
    }

    // 5 Invalid Rows
    // Row 46: Missing Employee Code
    worksheet.addRow([
      '',
      'Invalid Candidate 46',
      'candidate46@company.pk',
      '+92 300 1111111',
      '35202-1111111-1',
      'ENG',
      'SWE',
      'Permanent',
      '2026-01-15'
    ]);

    // Row 47: Invalid Email format
    worksheet.addRow([
      'EMP-BULK-047',
      'Invalid Candidate 47',
      'not-an-email-address',
      '+92 300 1111112',
      '35202-1111112-1',
      'ENG',
      'SWE',
      'Permanent',
      '2026-01-15'
    ]);

    // Row 48: Invalid CNIC (missing hyphens / wrong format)
    worksheet.addRow([
      'EMP-BULK-048',
      'Invalid Candidate 48',
      'candidate48@company.pk',
      '+92 300 1111113',
      '3520211111131',
      'ENG',
      'SWE',
      'Permanent',
      '2026-01-15'
    ]);

    // Row 49: Duplicate Email (same as Row 1 candidate1@company.pk)
    worksheet.addRow([
      'EMP-BULK-049',
      'Invalid Candidate 49',
      'candidate1@company.pk',
      '+92 300 1111114',
      '35202-1111114-1',
      'ENG',
      'SWE',
      'Permanent',
      '2026-01-15'
    ]);

    // Row 50: Invalid Employment Type
    worksheet.addRow([
      'EMP-BULK-050',
      'Invalid Candidate 50',
      'candidate50@company.pk',
      '+92 300 1111115',
      '35202-1111115-1',
      'ENG',
      'SWE',
      'FreelanceNonExistent',
      '2026-01-15'
    ]);

    const excelBuffer = await workbook.xlsx.writeBuffer();

    const res = await request(app)
      .post('/api/v1/employees/import')
      .set('Authorization', `Bearer ${hrToken}`)
      .attach('file', excelBuffer, {
        filename: 'bulk-employees.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(50);
    expect(res.body.data.succeeded).toBe(45);
    expect(res.body.data.failed).toBe(5);
    expect(res.body.data.errors).toHaveLength(5);

    // Verify exactly 45 employees are saved in MongoDB
    const count = await Employee.countDocuments({ employeeCode: { $regex: /^EMP-BULK-/ } });
    expect(count).toBe(45);
  }, 25000);

  it('3.14.1: should reject employee role from exporting directory (HTTP 403)', async () => {
    const res = await request(app)
      .get('/api/v1/employees/export')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  }, 15000);

  it('3.14.2: should allow HR Manager to export directory as valid Excel spreadsheet (HTTP 200)', async () => {
    const res = await request(app)
      .get('/api/v1/employees/export')
      .set('Authorization', `Bearer ${hrToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('attachment; filename="employees-directory.xlsx"');

    // Parse the received binary buffer using ExcelJS to verify integrity
    const downloadedWorkbook = new ExcelJS.Workbook();
    await downloadedWorkbook.xlsx.load(res.body);

    const sheet = downloadedWorkbook.getWorksheet('Employee Directory');
    expect(sheet).toBeDefined();

    // Verify Header row columns
    const headerRow = sheet.getRow(1);
    expect(headerRow.getCell(1).value).toBe('Employee Code');
    expect(headerRow.getCell(2).value).toBe('Full Name');
    expect(headerRow.getCell(3).value).toBe('Email');
    expect(headerRow.getCell(5).value).toBe('CNIC');

    // Verify row count reflects the 45 ingested employees
    expect(sheet.rowCount).toBeGreaterThanOrEqual(46); // 1 header + >= 45 rows
  }, 20000);
});
