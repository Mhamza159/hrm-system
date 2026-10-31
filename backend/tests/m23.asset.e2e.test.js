/**
 * @file m23.asset.e2e.test.js
 * @description Comprehensive Multi-Role End-to-End Test Suite for Module M23 (Asset Management).
 * 
 * SPECIFICATION & COVERAGE:
 * - BUILD-GUIDE Section 20 · Rows 23.1 to 23.6
 * - Roles: Super Admin, HR Manager, Department Manager, Employee
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

describe('Module M23 — Asset Management E2E Test Suite (All 4 Roles)', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken, otherDeptEmployeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser, otherDeptEmployeeUser;
  let engineeringDept, marketingDept;
  let deptManagerEmp, employeeEmp, otherDeptEmp;
  let createdAssetId;
  let createdRequestId;

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
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m23_asset_e2e');
    await mongoose.connect(testDbUri);

    // Clean test collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Asset.deleteMany({}),
      AssetRequest.deleteMany({})
    ]);

    // Bootstrap roles and Super Admin
    await seedRolesAndAdmin();

    const passHash = await User.hashPassword('Password123!');
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    // 1. Departments
    engineeringDept = await Department.create({ name: 'Engineering', code: 'ENG' });
    marketingDept = await Department.create({ name: 'Marketing', code: 'MKT' });

    // 2. Users
    superAdminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' }).populate('roles');
    if (!superAdminUser) {
      superAdminUser = await User.create({
        name: 'Super Admin',
        email: 'admin.assets@example.com',
        passwordHash: passHash,
        roles: [superAdminRole._id],
        isEmailVerified: true,
        isActive: true
      });
      await superAdminUser.populate('roles');
    }

    hrManagerUser = await User.create({
      name: 'Sarah HR',
      email: 'hr.assets@example.com',
      passwordHash: passHash,
      roles: [hrRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await hrManagerUser.populate('roles');

    deptManagerUser = await User.create({
      name: 'David Manager',
      email: 'manager.assets@example.com',
      passwordHash: passHash,
      roles: [deptRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await deptManagerUser.populate('roles');

    employeeUser = await User.create({
      name: 'Alice Dev',
      email: 'alice.assets@example.com',
      passwordHash: passHash,
      roles: [empRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await employeeUser.populate('roles');

    otherDeptEmployeeUser = await User.create({
      name: 'Bob Marketing',
      email: 'bob.assets@example.com',
      passwordHash: passHash,
      roles: [empRole._id],
      isEmailVerified: true,
      isActive: true
    });
    await otherDeptEmployeeUser.populate('roles');

    // 3. Employees
    deptManagerEmp = await Employee.create({
      userId: deptManagerUser._id,
      name: 'David Manager',
      firstName: 'David',
      lastName: 'Manager',
      employeeCode: 'EMP-MGR-01',
      workEmail: deptManagerUser.email,
      departmentId: engineeringDept._id,
      joiningDate: new Date('2023-01-01'),
      status: 'Active'
    });
    deptManagerUser.employeeId = deptManagerEmp._id;
    await deptManagerUser.save();

    employeeEmp = await Employee.create({
      userId: employeeUser._id,
      name: 'Alice Dev',
      firstName: 'Alice',
      lastName: 'Dev',
      employeeCode: 'EMP-DEV-01',
      workEmail: employeeUser.email,
      departmentId: engineeringDept._id,
      managerId: deptManagerEmp._id,
      joiningDate: new Date('2023-06-01'),
      status: 'Active'
    });
    employeeUser.employeeId = employeeEmp._id;
    await employeeUser.save();

    otherDeptEmp = await Employee.create({
      userId: otherDeptEmployeeUser._id,
      name: 'Bob Marketing',
      firstName: 'Bob',
      lastName: 'Marketing',
      employeeCode: 'EMP-MKT-01',
      workEmail: otherDeptEmployeeUser.email,
      departmentId: marketingDept._id,
      joiningDate: new Date('2023-08-01'),
      status: 'Active'
    });
    otherDeptEmployeeUser.employeeId = otherDeptEmp._id;
    await otherDeptEmployeeUser.save();

    // 4. JWT Tokens
    superAdminToken = generateToken(superAdminUser);
    hrManagerToken = generateToken(hrManagerUser);
    deptManagerToken = generateToken(deptManagerUser);
    employeeToken = generateToken(employeeUser);
    otherDeptEmployeeToken = generateToken(otherDeptEmployeeUser);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // Slice 1: BUILD-GUIDE 23.1 Asset Inventory Register CRUD
  // =========================================================================
  describe('BUILD-GUIDE 23.1: Asset Register & Inventory CRUD', () => {
    it('HR Manager can successfully register a new hardware laptop asset', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          assetTag: 'AST-LPT-001',
          name: 'ThinkPad T14 Gen 4',
          type: 'laptop',
          modelNumber: '21HD0006US',
          serialNumber: 'PF-29XA01',
          specifications: {
            processor: 'Intel Core i7-1365U',
            ramGb: 32,
            storageGb: 512,
            os: 'Ubuntu 24.04 LTS'
          },
          purchaseDate: '2024-01-15',
          purchaseCostPaisa: 28500000, // PKR 285,000
          vendorName: 'Lenovo Direct',
          warrantyExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assetTag).toBe('AST-LPT-001');
      expect(res.body.data.status).toBe('available');
      expect(res.body.data.assignedTo).toBeNull();
      expect(res.body.data.history).toHaveLength(1);
      expect(res.body.data.history[0].action).toBe('created');

      createdAssetId = res.body.data._id;
    });

    it('Rejects duplicate assetTag with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          assetTag: 'AST-LPT-001',
          name: 'Duplicate ThinkPad',
          type: 'laptop',
          serialNumber: 'PF-DIFFERENT'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('Rejects duplicate serialNumber with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          assetTag: 'AST-LPT-002',
          name: 'Duplicate Serial',
          type: 'laptop',
          serialNumber: 'PF-29XA01'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('Blocks regular employee from creating asset (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          assetTag: 'AST-LPT-999',
          name: 'Hacker Laptop',
          type: 'laptop',
          serialNumber: 'SN-999'
        });

      expect(res.status).toBe(403);
    });

    it('Can retrieve paginated assets with search and status filtering', async () => {
      const res = await request(app)
        .get('/api/v1/assets?status=available&search=ThinkPad')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].assetTag).toBe('AST-LPT-001');
    });

    it('Can retrieve single asset details by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${createdAssetId}`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(createdAssetId);
      expect(res.body.data.name).toBe('ThinkPad T14 Gen 4');
    });

    it('HR can update asset specifications', async () => {
      const res = await request(app)
        .put(`/api/v1/assets/${createdAssetId}`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          specifications: {
            ramGb: 64,
            storageGb: 1024
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.specifications.ramGb).toBe(64);
      expect(res.body.data.specifications.storageGb).toBe(1024);
    });
  });

  // =========================================================================
  // Slice 2: BUILD-GUIDE 23.2 Custodian Assignment, Return & History
  // =========================================================================
  describe('BUILD-GUIDE 23.2: Custodian Assignment, Return & History Timeline', () => {
    it('HR can assign available asset to employee custodian', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${createdAssetId}/assign`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          employeeId: employeeEmp._id.toString(),
          assignedDate: '2024-02-01',
          condition: 'new',
          notes: 'Issued brand new laptop with charger and protective case'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('assigned');
      expect(res.body.data.assignedTo.toString()).toBe(employeeEmp._id.toString());

      // History must now have 2 records (created, assigned)
      expect(res.body.data.history).toHaveLength(2);
      expect(res.body.data.history[1].action).toBe('assigned');
      expect(res.body.data.history[1].employeeId.toString()).toBe(employeeEmp._id.toString());
    });

    it('Prevents double assignment of already assigned asset (HTTP 400)', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${createdAssetId}/assign`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          employeeId: otherDeptEmp._id.toString(),
          assignedDate: '2024-02-02'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already assigned/i);
    });

    it('Blocks non-HR roles from assigning assets (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${createdAssetId}/assign`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: employeeEmp._id.toString()
        });

      expect(res.status).toBe(403);
    });

    it('HR can return asset to inventory, setting status back to available', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${createdAssetId}/return`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          returnDate: '2024-05-15',
          condition: 'good',
          notes: 'Returned in good condition with charger'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('available');
      expect(res.body.data.assignedTo).toBeNull();

      // History must now have 3 records (created, assigned, returned)
      expect(res.body.data.history).toHaveLength(3);
      expect(res.body.data.history[2].action).toBe('returned');
    });

    it('Rejects return on an asset that is not currently assigned (HTTP 400)', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${createdAssetId}/return`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          condition: 'good'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not currently assigned/i);
    });
  });

  // =========================================================================
  // Slice 3: BUILD-GUIDE 23.5 Department Manager Requisitions & Allocation
  // =========================================================================
  describe('BUILD-GUIDE 23.5: Manager Asset Requisition Workflow', () => {
    it('Department Manager can submit asset requisition for subordinate in their department', async () => {
      const res = await request(app)
        .post('/api/v1/asset-requests')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          employeeId: employeeEmp._id.toString(),
          assetType: 'laptop',
          priority: 'high',
          specificationsRequired: 'At least 32GB RAM for local Docker development',
          justification: 'New project requires heavy microservices execution locally'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.requestedBy.toString()).toBe(deptManagerUser._id.toString());
      expect(res.body.data.departmentId.toString()).toBe(engineeringDept._id.toString());

      createdRequestId = res.body.data._id;
    });

    it('Rejects Department Manager requesting asset for employee in another department (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/v1/asset-requests')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          employeeId: otherDeptEmp._id.toString(), // Belongs to Marketing department
          assetType: 'laptop',
          justification: 'Cross-department request unauthorized'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/own department/i);
    });

    it('Department Manager sees only requisitions for their department', async () => {
      const res = await request(app)
        .get('/api/v1/asset-requests')
        .set('Authorization', `Bearer ${deptManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((r) => r.departmentId._id.toString() === engineeringDept._id.toString())).toBe(true);
    });

    it('HR Manager can approve requisition and automatically allocate an available asset', async () => {
      const res = await request(app)
        .post(`/api/v1/asset-requests/${createdRequestId}/approve`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          allocatedAssetId: createdAssetId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.allocatedAssetId.toString()).toBe(createdAssetId.toString());

      // Verify asset is now assigned to the requested employee
      const allocatedAsset = await Asset.findById(createdAssetId);
      expect(allocatedAsset.status).toBe('assigned');
      expect(allocatedAsset.assignedTo.toString()).toBe(employeeEmp._id.toString());
    });

    it('HR can decline a requisition with mandatory rejection reason', async () => {
      // Create a second request to decline
      const reqRes = await request(app)
        .post('/api/v1/asset-requests')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          employeeId: employeeEmp._id.toString(),
          assetType: 'monitor',
          justification: 'Second external display for coding'
        });

      const secondReqId = reqRes.body.data._id;

      const rejectRes = await request(app)
        .post(`/api/v1/asset-requests/${secondReqId}/reject`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          rejectionReason: 'External 4K displays are currently out of stock.'
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('rejected');
      expect(rejectRes.body.data.rejectionReason).toBe('External 4K displays are currently out of stock.');
    });
  });

  // =========================================================================
  // Slice 4: BUILD-GUIDE 23.6 Employee My Assets & Issue Reporting
  // =========================================================================
  describe('BUILD-GUIDE 23.6: Employee "My Assets" & Issue Flagging', () => {
    it('Employee retrieves only the assets currently assigned to them via GET /assets/my', async () => {
      const res = await request(app)
        .get('/api/v1/assets/my')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(createdAssetId.toString());
      expect(res.body.data[0].assetTag).toBe('AST-LPT-001');
    });

    it('Other employee in another department sees 0 assets in their My Assets view', async () => {
      const res = await request(app)
        .get('/api/v1/assets/my')
        .set('Authorization', `Bearer ${otherDeptEmployeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('Employee can report defect/malfunction on their assigned equipment', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${createdAssetId}/issue`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          issueType: 'screen_damage',
          description: 'Horizontal flickering lines on left quadrant of display',
          severity: 'high'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasOpenIssue).toBe(true);
      expect(res.body.data.issues).toHaveLength(1);
      expect(res.body.data.issues[0].issueType).toBe('screen_damage');
      expect(res.body.data.issues[0].severity).toBe('high');
    });

    it('Employee is blocked from reporting defect on an asset assigned to someone else (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${createdAssetId}/issue`)
        .set('Authorization', `Bearer ${otherDeptEmployeeToken}`)
        .send({
          issueType: 'battery_problem',
          description: 'Attempting to report issue on someone elses laptop'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/assigned to you/i);
    });
  });

  // =========================================================================
  // Slice 6: BUILD-GUIDE 23.4 Damage & Repair Maintenance Tracking
  // =========================================================================
  describe('BUILD-GUIDE 23.4: Damage & Repair Maintenance Tracking', () => {
    let repairRecordId;

    it('HR can dispatch malfunctioning asset for service repair', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${createdAssetId}/repairs`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          issueDescription: 'Replace flickering LCD screen panel',
          vendorName: 'Lenovo Official Care Karachi',
          repairCostPaisa: 3500000, // PKR 35,000
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('under_repair');
      expect(res.body.data.repairs).toHaveLength(1);
      expect(res.body.data.repairs[0].vendorName).toBe('Lenovo Official Care Karachi');
      expect(res.body.data.repairs[0].status).toBe('in_progress');

      repairRecordId = res.body.data.repairs[0]._id;
    });

    it('HR can complete service repair and restore asset operational status', async () => {
      const res = await request(app)
        .patch(`/api/v1/assets/${createdAssetId}/repairs/${repairRecordId}`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          status: 'completed',
          finalCostPaisa: 3200000,
          resolutionNotes: 'Display panel replaced under warranty, fully verified'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasOpenIssue).toBe(false);
      // Because it was assigned to Alice before repair, it remains assigned
      expect(res.body.data.status).toBe('assigned');
    });
  });

  // =========================================================================
  // Slice 5: BUILD-GUIDE 23.3 Automated 30-Day Expiry Alerts
  // =========================================================================
  describe('BUILD-GUIDE 23.3: Warranty & License Expiration Alerts', () => {
    it('Creates an asset with warranty expiring in 15 days and triggers expiry scanner', async () => {
      // Register asset expiring in 15 days
      const fifteenDaysAhead = new Date();
      fifteenDaysAhead.setDate(fifteenDaysAhead.getDate() + 15);

      await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          assetTag: 'AST-EXP-001',
          name: 'Expiring Monitor',
          type: 'monitor',
          serialNumber: 'SN-EXP-001',
          warrantyExpiresAt: fifteenDaysAhead.toISOString()
        });

      // Call manual trigger endpoint
      const triggerRes = await request(app)
        .post('/api/v1/assets/check-expiry')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(triggerRes.status).toBe(200);
      expect(triggerRes.body.success).toBe(true);
      expect(triggerRes.body.data.count).toBeGreaterThanOrEqual(1);
    });
  });
});

