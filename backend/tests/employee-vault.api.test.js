/**
 * @file employee-vault.api.test.js
 * @description Integration Tests for Employee Document Vault (Module M3 · Slice 3.9).
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.9)
 * - Verifies upload to document vault, MIME filtering, unlinking on deletion, and role security.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { env } from '../src/config/env.js';

describe('Module M3 — Employee Document Vault Integration Tests (Slice 3.9)', () => {
  let hrToken;
  let employeeToken;
  let hrUser;
  let employeeUser;
  let testEmployee;
  let uploadedDocId;
  let uploadedFilePath;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m3_vault');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});

    // 1. Roles
    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'all' },
        { action: 'employee.edit', subject: 'Employee', scope: 'all' }
      ]
    });

    const empRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'employee.view', subject: 'Employee', scope: 'own' }
      ]
    });

    // 2. Users
    hrUser = await User.create({
      email: 'hr.vault@test.com',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isVerified: true,
      isActive: true
    });

    employeeUser = await User.create({
      email: 'employee.vault@test.com',
      passwordHash: 'dummy_hash',
      roles: [empRole._id],
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

    // 4. Test Employee
    testEmployee = await Employee.create({
      employeeCode: 'EMP-VLT-001',
      name: 'Vault Test User',
      email: 'vault.user@test.com',
      cnic: '35202-1234567-1',
      joiningDate: new Date(),
      status: 'Active',
      employmentType: 'Permanent'
    });
  }, 20000);

  afterAll(async () => {
    // Cleanup created files in uploads/documents
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch {
        // ignore
      }
    }
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await mongoose.connection.close();
  });

  it('3.9.1: should upload a valid PDF document to employee vault (HTTP 201)', async () => {
    const fakePdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    const res = await request(app)
      .post(`/api/v1/employees/${testEmployee._id}/documents`)
      .set('Authorization', `Bearer ${hrToken}`)
      .field('type', 'Employment Contract')
      .field('title', 'Signed Contract 2026')
      .attach('file', fakePdfBuffer, {
        filename: 'contract.pdf',
        contentType: 'application/pdf'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('Employment Contract');
    expect(res.body.data.title).toBe('Signed Contract 2026');
    expect(res.body.data.fileUrl).toContain('/uploads/documents/');
    expect(res.body.data._id).toBeDefined();

    uploadedDocId = res.body.data._id;
    uploadedFilePath = path.resolve(process.cwd(), res.body.data.fileUrl.replace(/^\//, ''));

    // Verify file actually created on disk
    expect(fs.existsSync(uploadedFilePath)).toBe(true);

    // Verify document was appended to Employee document in MongoDB
    const empInDb = await Employee.findById(testEmployee._id);
    expect(empInDb.documents.length).toBe(1);
    expect(empInDb.documents[0].title).toBe('Signed Contract 2026');
  }, 15000);

  it('3.9.2: should reject unsupported file format (e.g. .exe / .txt) with HTTP 400', async () => {
    const textBuffer = Buffer.from('Plain text executable content');

    const res = await request(app)
      .post(`/api/v1/employees/${testEmployee._id}/documents`)
      .set('Authorization', `Bearer ${hrToken}`)
      .field('type', 'Other')
      .field('title', 'Illegal Text File')
      .attach('file', textBuffer, {
        filename: 'malicious.txt',
        contentType: 'text/plain'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  }, 15000);

  it('3.9.3: should reject unauthorized employee role from uploading documents (HTTP 403)', async () => {
    const fakePdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    const res = await request(app)
      .post(`/api/v1/employees/${testEmployee._id}/documents`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('type', 'Degree Certificate')
      .field('title', 'Unauthorized Upload')
      .attach('file', fakePdfBuffer, {
        filename: 'degree.pdf',
        contentType: 'application/pdf'
      });

    expect(res.status).toBe(403);
  }, 15000);

  it('3.9.4: should reject unauthorized employee role from deleting documents (HTTP 403)', async () => {
    const res = await request(app)
      .delete(`/api/v1/employees/${testEmployee._id}/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  }, 15000);

  it('3.9.5: should allow HR Manager to delete document and verify unlinking of file (HTTP 200)', async () => {
    expect(fs.existsSync(uploadedFilePath)).toBe(true);

    const res = await request(app)
      .delete(`/api/v1/employees/${testEmployee._id}/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify record removed from DB
    const empInDb = await Employee.findById(testEmployee._id);
    expect(empInDb.documents.length).toBe(0);

    // Verify physical file was unlinked from disk
    expect(fs.existsSync(uploadedFilePath)).toBe(false);
  }, 15000);
});
