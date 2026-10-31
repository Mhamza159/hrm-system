/**
 * @file m23.asset.security.test.js
 * @description Security & Hardening Doubt-Driven Stress Test Suite for Module M23 (Asset Management).
 * 
 * VULNERABILITY VECTORS TESTED:
 * 1. Privilege Escalation & Separation of Duties (Employee/Dept Manager cannot create, assign, or delete assets).
 * 2. Cross-Tenant / IDOR Protection (Employee cannot report issue on unassigned asset; cannot access other employees' custody).
 * 3. Double-Assignment Concurrency Race Conditions (Parallel simultaneous assignment requests).
 * 4. NoSQL / ReDoS Injection Resistance (Regex payload in query filters).
 * 5. Soft-Delete & Data Integrity Invariants (Deleted assets blocked from mutations).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Asset } from '../src/models/asset.model.js';
import { AssetRequest } from '../src/models/assetRequest.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M23 Security & Hardening Suite (Doubt-Driven Stress Test)', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken, hackerToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser, hackerUser;
  let devDept;
  let employeeEmp, hackerEmp;
  let securedAssetId;

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        roles: user.roles.map((r) => r.name || r)
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m23_asset_sec');
    await mongoose.connect(testDbUri);

    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Asset.deleteMany({}),
      AssetRequest.deleteMany({})
    ]);

    await seedRolesAndAdmin();

    const passHash = await User.hashPassword('Password123!');
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    devDept = await Department.create({ name: 'Product Engineering', code: 'PE' });

    superAdminUser = await User.create({
      name: 'Super Admin',
      email: 'sec.admin.assets@example.com',
      passwordHash: passHash,
      roles: [superAdminRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await superAdminUser.populate('roles');

    hrManagerUser = await User.create({
      name: 'HR Admin',
      email: 'sec.hr.assets@example.com',
      passwordHash: passHash,
      roles: [hrRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await hrManagerUser.populate('roles');

    deptManagerUser = await User.create({
      name: 'Lead Dev',
      email: 'sec.mgr.assets@example.com',
      passwordHash: passHash,
      roles: [deptRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await deptManagerUser.populate('roles');

    employeeUser = await User.create({
      name: 'Dev Staff',
      email: 'sec.emp.assets@example.com',
      passwordHash: passHash,
      roles: [empRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await employeeUser.populate('roles');

    hackerUser = await User.create({
      name: 'Malicious Staff',
      email: 'sec.hacker.assets@example.com',
      passwordHash: passHash,
      roles: [empRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await hackerUser.populate('roles');

    employeeEmp = await Employee.create({
      userId: employeeUser._id,
      name: 'Dev Staff',
      firstName: 'Dev',
      lastName: 'Staff',
      employeeCode: 'EMP-SEC-01',
      workEmail: employeeUser.email,
      departmentId: devDept._id,
      joiningDate: new Date('2023-01-01'),
      status: 'Active'
    });
    employeeUser.employeeId = employeeEmp._id;
    await employeeUser.save();

    hackerEmp = await Employee.create({
      userId: hackerUser._id,
      name: 'Malicious Staff',
      firstName: 'Malicious',
      lastName: 'Staff',
      employeeCode: 'EMP-SEC-02',
      workEmail: hackerUser.email,
      departmentId: devDept._id,
      joiningDate: new Date('2023-02-01'),
      status: 'Active'
    });
    hackerUser.employeeId = hackerEmp._id;
    await hackerUser.save();

    superAdminToken = generateToken(superAdminUser);
    hrManagerToken = generateToken(hrManagerUser);
    deptManagerToken = generateToken(deptManagerUser);
    employeeToken = generateToken(employeeUser);
    hackerToken = generateToken(hackerUser);

    // Seed one asset in inventory
    const asset = await Asset.create({
      assetTag: 'AST-SEC-001',
      name: 'Secured MacBook Pro M3',
      type: 'laptop',
      serialNumber: 'MBP-SEC-9988',
      status: 'available',
      history: [{ action: 'created', performedBy: superAdminUser._id, date: new Date() }]
    });
    securedAssetId = asset._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. PBAC Privilege Boundary Enforcement
  // =========================================================================
  describe('PBAC Boundary Enforcement & Separation of Duties', () => {
    it('Blocks employee from modifying asset specifications (HTTP 403)', async () => {
      const res = await request(app)
        .put(`/api/v1/assets/${securedAssetId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Hacked Name'
        });

      expect(res.status).toBe(403);
    });

    it('Blocks employee from soft-deleting an asset (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/assets/${securedAssetId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('Blocks employee from assigning asset to themselves (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${securedAssetId}/assign`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: employeeEmp._id.toString()
        });

      expect(res.status).toBe(403);
    });

    it('Blocks Department Manager from soft-deleting company asset (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/assets/${securedAssetId}`)
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 2. IDOR & Cross-User Custody Protection
  // =========================================================================
  describe('IDOR & Cross-User Custody Protection', () => {
    beforeAll(async () => {
      // Assign asset to Dev Staff
      await request(app)
        .post(`/api/v1/assets/${securedAssetId}/assign`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          employeeId: employeeEmp._id.toString()
        });
    });

    it('Hacker employee cannot report malfunction on asset assigned to another staff member (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${securedAssetId}/issue`)
        .set('Authorization', `Bearer ${hackerToken}`)
        .send({
          issueType: 'battery_problem',
          description: 'Malicious issue injection attempt'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/assigned to you/i);
    });

    it('Hacker employee receives empty list from GET /assets/my', async () => {
      const res = await request(app)
        .get('/api/v1/assets/my')
        .set('Authorization', `Bearer ${hackerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // =========================================================================
  // 3. NoSQL / ReDoS Injection Resistance
  // =========================================================================
  describe('NoSQL / ReDoS Injection Resistance', () => {
    it('Handles malicious regex payloads in search queries safely without crashing', async () => {
      const maliciousPatterns = [
        '.*',
        '^(a+)+$',
        '($foo|bar)',
        '\\\\\\\\',
        '[[[invalid'
      ];

      for (const pattern of maliciousPatterns) {
        const res = await request(app)
          .get(`/api/v1/assets?search=${encodeURIComponent(pattern)}`)
          .set('Authorization', `Bearer ${hrManagerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  // =========================================================================
  // 4. Concurrency & Double-Assignment Race Condition Test
  // =========================================================================
  describe('Concurrency & Double-Assignment Race Condition Test', () => {
    let raceAssetId;

    beforeAll(async () => {
      const asset = await Asset.create({
        assetTag: 'AST-RACE-001',
        name: 'Race Condition Test Laptop',
        type: 'laptop',
        serialNumber: 'SN-RACE-001',
        status: 'available',
        history: [{ action: 'created', performedBy: superAdminUser._id, date: new Date() }]
      });
      raceAssetId = asset._id;
    });

    it('Handles simultaneous duplicate assignment attempts safely without double allocation', async () => {
      // Fire 5 simultaneous assign requests for the same available asset
      const requests = Array.from({ length: 5 }).map(() =>
        request(app)
          .post(`/api/v1/assets/${raceAssetId}/assign`)
          .set('Authorization', `Bearer ${hrManagerToken}`)
          .send({
            employeeId: employeeEmp._id.toString(),
            notes: 'Concurrent assignment burst'
          })
      );

      const responses = await Promise.all(requests);
      const successes = responses.filter((r) => r.status === 200);
      const rejected = responses.filter((r) => r.status === 400);

      // Exactly 1 must succeed, the rest rejected as already assigned
      expect(successes).toHaveLength(1);
      expect(rejected).toHaveLength(4);

      // Verify DB state
      const finalAsset = await Asset.findById(raceAssetId);
      expect(finalAsset.status).toBe('assigned');
      expect(finalAsset.assignedTo.toString()).toBe(employeeEmp._id.toString());
    });
  });

  // =========================================================================
  // 5. Soft-Delete & Data Integrity Invariants
  // =========================================================================
  describe('Soft-Delete & Data Integrity Invariants', () => {
    let disposableAssetId;

    beforeAll(async () => {
      const asset = await Asset.create({
        assetTag: 'AST-DISP-001',
        name: 'Disposable Asset',
        type: 'tablet',
        serialNumber: 'SN-DISP-001',
        status: 'available',
        history: [{ action: 'created', performedBy: superAdminUser._id, date: new Date() }]
      });
      disposableAssetId = asset._id;
    });

    it('Soft-deletes asset and prevents it from appearing in standard catalog queries', async () => {
      const delRes = await request(app)
        .delete(`/api/v1/assets/${disposableAssetId}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(delRes.status).toBe(200);

      // Query inventory
      const listRes = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      const found = listRes.body.data.find((a) => a._id.toString() === disposableAssetId.toString());
      expect(found).toBeUndefined();
    });

    it('Blocks assignment on soft-deleted asset (HTTP 404)', async () => {
      const assignRes = await request(app)
        .post(`/api/v1/assets/${disposableAssetId}/assign`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          employeeId: employeeEmp._id.toString()
        });

      expect(assignRes.status).toBe(404);
    });
  });
});

