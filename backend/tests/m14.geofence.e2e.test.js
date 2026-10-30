/**
 * @file m14.geofence.e2e.test.js
 * @description Multi-Role Integration & End-to-End Test Suite for Module M14 GPS / Geo-fencing Attendance.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Setting } from '../src/models/setting.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { WfhLocation } from '../src/models/wfhLocation.model.js';

describe('Module M14 — GPS / Geo-fencing Attendance End-to-End Test Suite', () => {
  let superAdminToken, managerToken, employeeToken, fieldStaffToken;
  let superAdminUser, managerUser, employeeUser, fieldStaffUser;
  let managerEmployee, regularEmployee, fieldEmployee;
  let testDept, testDesig;
  let flaggedAttendanceId, wfhLocationId;

  // Karachi Head Office Coordinates
  const OFFICE_LAT = 24.8607;
  const OFFICE_LON = 67.0011;
  const OFFICE_RADIUS = 100; // 100 meters

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_test_geofence');
    }

    // Clean test state
    await Attendance.deleteMany({});
    await WfhLocation.deleteMany({});

    // 1. Configure active office geofence in Settings
    await Setting.findOneAndUpdate(
      { key: 'geoFences' },
      {
        key: 'geoFences',
        value: [
          {
            name: 'Karachi Head Office',
            latitude: OFFICE_LAT,
            longitude: OFFICE_LON,
            radiusMeters: OFFICE_RADIUS,
            isActive: true
          }
        ]
      },
      { upsert: true, new: true }
    );

    // 2. Roles Setup
    const adminRole = await Role.findOneAndUpdate(
      { name: 'Super Admin' },
      {
        name: 'Super Admin',
        description: 'Administrator',
        isSystem: true,
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.approve', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.wfh', subject: 'Attendance', scope: 'all' },
          { action: 'attendance.fieldCheckIn', subject: 'Attendance', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    const mgrRole = await Role.findOneAndUpdate(
      { name: 'Department Manager' },
      {
        name: 'Department Manager',
        description: 'Department Head',
        isSystem: true,
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'team' },
          { action: 'attendance.approve', subject: 'Attendance', scope: 'team' },
          { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    const empRole = await Role.findOneAndUpdate(
      { name: 'Employee' },
      {
        name: 'Employee',
        description: 'Regular Employee',
        isSystem: true,
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.wfh', subject: 'Attendance', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    const fieldRole = await Role.findOneAndUpdate(
      { name: 'Field Sales Representative' },
      {
        name: 'Field Sales Representative',
        description: 'Sales Agent with Outdoor Punch Rights',
        isSystem: false,
        permissions: [
          { action: 'attendance.mark', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.view', subject: 'Attendance', scope: 'own' },
          { action: 'attendance.fieldCheckIn', subject: 'Attendance', scope: 'own' }
        ]
      },
      { upsert: true, new: true }
    );

    // 3. Department & Designation
    const uniqueSuffix = Date.now().toString().slice(-6);
    testDept = await Department.create({ name: `Geo Operations ${uniqueSuffix}`, code: `GEO_${uniqueSuffix}`, isActive: true });
    testDesig = await Designation.create({
      title: 'Field Engineer',
      code: `FLD_${uniqueSuffix}`,
      grade: 'Mid',
      departmentId: testDept._id
    });

    // 4. Profiles & Users
    const adminEmployee = await Employee.create({
      employeeCode: `EMP-ADM-${uniqueSuffix}`,
      name: 'Super Admin',
      email: `admin_geo_${uniqueSuffix}@hrm.test`,
      departmentId: testDept._id,
      designationId: testDesig._id,
      dateOfJoining: new Date(),
      status: 'Active'
    });
    superAdminUser = await User.create({
      name: 'Super Admin',
      email: adminEmployee.email,
      role: 'Super Admin',
      roles: [adminRole._id],
      employeeId: adminEmployee._id,
      passwordHash: 'dummy_hash',
      isActive: true
    });
    adminEmployee.userId = superAdminUser._id;
    await adminEmployee.save();

    managerEmployee = await Employee.create({
      employeeCode: `EMP-MGR-${Date.now().toString().slice(-4)}`,
      name: 'Operations Manager',
      email: `mgr_geo_${Date.now()}@hrm.test`,
      departmentId: testDept._id,
      designationId: testDesig._id,
      dateOfJoining: new Date(),
      status: 'Active'
    });
    managerUser = await User.create({
      name: 'Operations Manager',
      email: managerEmployee.email,
      role: 'Department Manager',
      roles: [mgrRole._id],
      employeeId: managerEmployee._id,
      passwordHash: 'dummy_hash',
      isActive: true
    });
    managerEmployee.userId = managerUser._id;
    await managerEmployee.save();

    regularEmployee = await Employee.create({
      employeeCode: `EMP-STAFF-${Date.now().toString().slice(-4)}`,
      name: 'Staff Bilal',
      email: `bilal_geo_${Date.now()}@hrm.test`,
      departmentId: testDept._id,
      designationId: testDesig._id,
      managerId: managerEmployee._id,
      dateOfJoining: new Date(),
      status: 'Active'
    });
    employeeUser = await User.create({
      name: 'Staff Bilal',
      email: regularEmployee.email,
      role: 'Employee',
      roles: [empRole._id],
      employeeId: regularEmployee._id,
      passwordHash: 'dummy_hash',
      isActive: true
    });
    regularEmployee.userId = employeeUser._id;
    await regularEmployee.save();

    fieldEmployee = await Employee.create({
      employeeCode: `EMP-FIELD-${Date.now().toString().slice(-4)}`,
      name: 'Field Agent Tariq',
      email: `tariq_geo_${Date.now()}@hrm.test`,
      departmentId: testDept._id,
      designationId: testDesig._id,
      managerId: managerEmployee._id,
      dateOfJoining: new Date(),
      status: 'Active'
    });
    fieldStaffUser = await User.create({
      name: 'Field Agent Tariq',
      email: fieldEmployee.email,
      role: 'Field Sales Representative',
      roles: [fieldRole._id],
      employeeId: fieldEmployee._id,
      passwordHash: 'dummy_hash',
      isActive: true
    });
    fieldEmployee.userId = fieldStaffUser._id;
    await fieldEmployee.save();

    // 5. Sign JWTs
    const signToken = (u, roleName, roleId) =>
      jwt.sign(
        { userId: u._id, email: u.email, role: roleName, roles: [roleName], roleId },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, 'Super Admin', adminRole._id);
    managerToken = signToken(managerUser, 'Department Manager', mgrRole._id);
    employeeToken = signToken(employeeUser, 'Employee', empRole._id);
    fieldStaffToken = signToken(fieldStaffUser, 'Field Sales Representative', fieldRole._id);
  });

  afterAll(async () => {
    await Attendance.deleteMany({});
    await WfhLocation.deleteMany({});
  });

  // ============================================================================
  // Slice 14.2: Geofenced Check-In & Boundary Validation
  // ============================================================================
  describe('Slice 14.2: Geofenced Check-In & Boundary Evaluation', () => {
    it('successfully checks in inside office geofence without flags (<= 100m)', async () => {
      // 25 meters from office center
      const insideLat = 24.8609;
      const insideLon = 67.0012;

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          source: 'web',
          location: {
            latitude: insideLat,
            longitude: insideLon,
            accuracy: 15
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFlagged).toBe(false);
      expect(res.body.data.distanceFromOfficeMeters).toBeLessThan(100);
    });

    it('flags check-in when employee clocks in outside office boundaries (> 100m)', async () => {
      // ~2.5 kilometers away from office
      const outsideLat = 24.8800;
      const outsideLon = 67.0200;

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          source: 'web',
          location: {
            latitude: outsideLat,
            longitude: outsideLon,
            accuracy: 20
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFlagged).toBe(true);
      expect(res.body.data.flagReason).toBe('geofence_violation');
      expect(res.body.data.distanceFromOfficeMeters).toBeGreaterThan(100);
      flaggedAttendanceId = res.body.data._id;
    });
  });

  // ============================================================================
  // Slice 14.3: Accuracy & Mock GPS Detection
  // ============================================================================
  describe('Slice 14.3: Accuracy & Mock GPS Detection', () => {
    it('flags punch when GPS signal accuracy is excessively weak (> 100m)', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          source: 'web',
          location: {
            latitude: OFFICE_LAT,
            longitude: OFFICE_LON,
            accuracy: 180, // Weak accuracy
            isMock: false
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isFlagged).toBe(true);
      expect(res.body.data.flagReason).toBe('low_accuracy');
    });
  });

  // ============================================================================
  // Slice 14.6: Flagged Punches Review Queue
  // ============================================================================
  describe('Slice 14.6: Flagged Punches Review & Regularization', () => {
    it('allows Department Manager to list flagged punches for their team', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/flagged?status=pending')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p) => p._id === flaggedAttendanceId)).toBe(true);
    });

    it('allows Department Manager to review and approve direct report flagged punch', async () => {
      const res = await request(app)
        .patch(`/api/v1/attendance/flagged/${flaggedAttendanceId}/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'approved',
          comments: 'Outdoor client meeting confirmed by supervisor'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.flagResolved).toBe(true);
      expect(res.body.data.flagResolution.decision).toBe('approved');
    });
  });

  // ============================================================================
  // Slice 14.4: Approved WFH Locations Management
  // ============================================================================
  describe('Slice 14.4: Approved WFH Locations Registration & Approval', () => {
    it('allows employee to register their primary home residence for WFH approval', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/wfh-locations')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Home Residence (Gulshan)',
          address: 'Block 13-D, Gulshan-e-Iqbal, Karachi',
          latitude: 24.9200,
          longitude: 67.0900,
          radiusMeters: 100
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      wfhLocationId = res.body.data._id;
    });

    it('allows Super Admin / HR to approve registered WFH location', async () => {
      const res = await request(app)
        .patch(`/api/v1/attendance/wfh-locations/${wfhLocationId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'approved',
          remarks: 'Verified proof of residence'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('allows employee to list their active WFH locations', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/wfh-locations')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].status).toBe('approved');
    });
  });

  // ============================================================================
  // Slice 14.5: Client-Site Field Visit Check-In
  // ============================================================================
  describe('Slice 14.5: Client-Site Field Visit Check-In', () => {
    it('allows field staff with attendance.fieldCheckIn to clock in at client site without being flagged', async () => {
      // 15km away from office
      const clientSiteLat = 24.9500;
      const clientSiteLon = 67.1200;

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${fieldStaffToken}`)
        .send({
          source: 'field',
          location: {
            latitude: clientSiteLat,
            longitude: clientSiteLon,
            accuracy: 15,
            isClientVisit: true,
            clientName: 'Bank Alfalah Corporate HQ',
            clientRemarks: 'Quarterly on-site software audit'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isFlagged).toBe(false);
      expect(res.body.data.flags).toContain('field');
      expect(res.body.data.source).toBe('field');
    });
  });

  // ============================================================================
  // Slice 14.7: Spatial Punch Locations for Map
  // ============================================================================
  describe('Slice 14.7: Punch Map Spatial Locations Query', () => {
    it('returns daily punch coordinates and active office geofences', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const res = await request(app)
        .get(`/api/v1/attendance/locations?date=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.punches)).toBe(true);
      expect(Array.isArray(res.body.data.officeGeofences)).toBe(true);
      expect(res.body.data.officeGeofences[0].name).toBe('Karachi Head Office');
    });
  });
});
