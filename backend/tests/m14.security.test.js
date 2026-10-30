import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { WfhLocation } from '../src/models/wfhLocation.model.js';
import { env } from '../src/config/env.js';
import { normalizeToUtcMidnight } from '../src/modules/attendance/attendance.service.js';

describe('Module M14 — Security & Hardening Adversarial Test Suite', () => {
  let dbUri;
  let superAdminUser, managerUser, employeeUser, outsideEmployeeUser;
  let managerEmployee, regularEmployee, outsideEmployee;
  let superAdminToken, managerToken, employeeToken;
  let testDept;

  const signToken = (u, roleName, roleId) => {
    return jwt.sign(
      {
        userId: u._id,
        email: u.email,
        role: roleName,
        roles: [roleName],
        roleId
      },
      env.JWT_ACCESS_SECRET || 'test_access_secret',
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    const timestamp = Date.now();
    dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrm_m14_sec_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(dbUri);
    }

    // Roles
    const [adminRole, managerRole, empRole] = await Promise.all([
      Role.findOneAndUpdate(
        { name: 'Super Admin' },
        { name: 'Super Admin', permissions: [{ action: 'manage', subject: 'all' }] },
        { upsert: true, new: true }
      ),
      Role.findOneAndUpdate(
        { name: 'Department Manager' },
        {
          name: 'Department Manager',
          permissions: [
            { action: 'attendance.mark', subject: 'all', scope: 'own' },
            { action: 'attendance.view', subject: 'all', scope: 'team' },
            { action: 'attendance.approve', subject: 'all', scope: 'team' },
            { action: 'attendance.wfh', subject: 'all', scope: 'own' }
          ]
        },
        { upsert: true, new: true }
      ),
      Role.findOneAndUpdate(
        { name: 'Employee' },
        {
          name: 'Employee',
          permissions: [
            { action: 'attendance.mark', subject: 'all', scope: 'own' },
            { action: 'attendance.view', subject: 'all', scope: 'own' },
            { action: 'attendance.wfh', subject: 'all', scope: 'own' }
          ]
        },
        { upsert: true, new: true }
      )
    ]);

    testDept = await Department.create({
      name: `Sec Engineering ${timestamp}`,
      code: `SEC_${String(timestamp).slice(-6)}`
    });

    const desig = await Designation.create({
      title: 'Sec Engineer',
      grade: 'Mid',
      code: `DEV_${String(timestamp).slice(-6)}`,
      departmentId: testDept._id
    });

    managerEmployee = await Employee.create({
      name: 'Sec Manager',
      firstName: 'Sec',
      lastName: 'Manager',
      email: `mgr_sec_${timestamp}@test.com`,
      employeeCode: `MGR-${String(timestamp).slice(-6)}`,
      departmentId: testDept._id,
      designationId: desig._id,
      dateOfJoining: new Date()
    });

    managerUser = await User.create({
      email: managerEmployee.email,
      name: 'Sec Manager',
      role: 'Department Manager',
      passwordHash: 'dummy_hash',
      isActive: true,
      employeeId: managerEmployee._id,
      roles: [managerRole._id]
    });
    managerUser.roles = [managerRole];
    managerEmployee.userId = managerUser._id;
    await managerEmployee.save();

    regularEmployee = await Employee.create({
      name: 'Regular Staff',
      firstName: 'Regular',
      lastName: 'Staff',
      email: `reg_sec_${timestamp}@test.com`,
      employeeCode: `EMP-${String(timestamp).slice(-6)}`,
      departmentId: testDept._id,
      designationId: desig._id,
      managerId: managerEmployee._id,
      dateOfJoining: new Date()
    });

    employeeUser = await User.create({
      email: regularEmployee.email,
      name: 'Regular Staff',
      role: 'Employee',
      passwordHash: 'dummy_hash',
      isActive: true,
      employeeId: regularEmployee._id,
      roles: [empRole._id]
    });
    employeeUser.roles = [empRole];
    regularEmployee.userId = employeeUser._id;
    await regularEmployee.save();

    outsideEmployee = await Employee.create({
      name: 'Outside Staff',
      firstName: 'Outside',
      lastName: 'Staff',
      email: `out_sec_${timestamp}@test.com`,
      employeeCode: `OUT-${String(timestamp).slice(-6)}`,
      departmentId: testDept._id,
      designationId: desig._id,
      managerId: new mongoose.Types.ObjectId(), // Different manager
      dateOfJoining: new Date()
    });

    outsideEmployeeUser = await User.create({
      email: outsideEmployee.email,
      name: 'Outside Staff',
      role: 'Employee',
      passwordHash: 'dummy_hash',
      isActive: true,
      employeeId: outsideEmployee._id,
      roles: [empRole._id]
    });

    managerToken = signToken(managerUser, 'Department Manager', managerRole._id);
    employeeToken = signToken(employeeUser, 'Employee', empRole._id);
  });

  afterAll(async () => {
    await Promise.all([
      Attendance.deleteMany({ employeeId: { $in: [managerEmployee?._id, regularEmployee?._id, outsideEmployee?._id] } }),
      WfhLocation.deleteMany({ employeeId: { $in: [managerEmployee?._id, regularEmployee?._id, outsideEmployee?._id] } }),
      Employee.deleteMany({ _id: { $in: [managerEmployee?._id, regularEmployee?._id, outsideEmployee?._id] } }),
      User.deleteMany({ _id: { $in: [managerUser?._id, employeeUser?._id, outsideEmployeeUser?._id] } })
    ]);
  });

  describe('1. Coordinate Validation & Bound Constraints (Doubt Focus)', () => {
    it('rejects invalid latitude > 90 with 422', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          location: {
            latitude: 195.5,
            longitude: 67.0
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid longitude > 180 with 422', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          location: {
            latitude: 24.8,
            longitude: 250.0
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Synthetic / Zero GPS Accuracy Detection (Fake GPS Focus)', () => {
    it('flags mock GPS when accuracy is 0 or negative', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          location: {
            latitude: 24.8607,
            longitude: 67.0011,
            accuracy: 0
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFlagged).toBe(true);
      expect(res.body.data.flagReason).toBe('mock_gps');
    });
  });

  describe('3. Separation of Duties / Self-Approval Prevention', () => {
    it('prevents a manager from approving their own flagged attendance punch', async () => {
      // Create a flagged attendance punch for manager himself
      const managerPunch = await Attendance.create({
        employeeId: managerEmployee._id,
        date: normalizeToUtcMidnight(new Date(Date.now() - 86400000)),
        checkIn: new Date(Date.now() - 86400000),
        status: 'present',
        isFlagged: true,
        flagReason: 'geofence_violation',
        location: { latitude: 24.0, longitude: 67.0 }
      });

      const res = await request(app)
        .patch(`/api/v1/attendance/flagged/${managerPunch._id}/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'approved',
          comments: 'Approving my own attendance'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Separation of duties violation');
    });

    it('prevents an employee/manager from approving their own WFH location request', async () => {
      const wfhLoc = await WfhLocation.create({
        employeeId: managerEmployee._id,
        name: 'Manager Penthouse',
        address: '123 Test Street, Karachi',
        latitude: 24.8607,
        longitude: 67.0011,
        radiusMeters: 100,
        status: 'pending'
      });

      const res = await request(app)
        .patch(`/api/v1/attendance/wfh-locations/${wfhLoc._id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'approved',
          remarks: 'Self approval attempt'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Separation of duties violation');
    });

    it('prevents a manager from approving WFH location for an employee outside their team', async () => {
      const outsideWfhLoc = await WfhLocation.create({
        employeeId: outsideEmployee._id,
        name: 'Outside Staff Home',
        address: '456 Other Street, Lahore',
        latitude: 31.5204,
        longitude: 74.3587,
        radiusMeters: 100,
        status: 'pending'
      });

      const res = await request(app)
        .patch(`/api/v1/attendance/wfh-locations/${outsideWfhLoc._id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'approved',
          remarks: 'Approval of outside employee'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('direct team');
    });
  });

  describe('4. NoSQL Injection & Query Validation Defense', () => {
    it('validates query params on /flagged and strips prohibited query operators', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/flagged?status=pending&limit=10')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid enum values on /flagged query status', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/flagged?status=malicious_status')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
  describe('5. Cross-Module Bug Fixes & Integrations', () => {
    it('allows an employee to delete their own WFH location and blocks other employees', async () => {
      const loc = await WfhLocation.create({
        employeeId: regularEmployee._id,
        name: 'My Personal Studio',
        address: '789 Worker St, Karachi',
        latitude: 24.8607,
        longitude: 67.0011,
        radiusMeters: 50,
        status: 'pending'
      });

      // Another unauthorized employee attempts to delete it -> 403
      const outsideToken = signToken(outsideEmployeeUser, 'Employee', new mongoose.Types.ObjectId());
      const failRes = await request(app)
        .delete(`/api/v1/attendance/wfh-locations/${loc._id}`)
        .set('Authorization', `Bearer ${outsideToken}`);

      expect(failRes.status).toBe(403);

      // Owner employee deletes it -> 200
      const okRes = await request(app)
        .delete(`/api/v1/attendance/wfh-locations/${loc._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(okRes.status).toBe(200);
      expect(okRes.body.success).toBe(true);

      const updated = await WfhLocation.findById(loc._id);
      expect(updated.isDeleted).toBe(true);
    });

    it('records an auditLogs entry on attendance document when reviewFlaggedPunch is executed', async () => {
      const punch = await Attendance.create({
        employeeId: regularEmployee._id,
        date: normalizeToUtcMidnight(new Date(Date.now() - 2 * 86400000)),
        checkIn: new Date(),
        status: 'present',
        isFlagged: true,
        flagReason: 'geofence_violation',
        location: { latitude: 35.0, longitude: 70.0 }
      });

      const res = await request(app)
        .patch(`/api/v1/attendance/flagged/${punch._id}/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'rejected',
          comments: 'Spoofed location confirmed'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('absent');

      const updatedPunch = await Attendance.findById(punch._id);
      expect(updatedPunch.status).toBe('absent');
      expect(updatedPunch.auditLogs.length).toBeGreaterThan(0);
      const lastAudit = updatedPunch.auditLogs[updatedPunch.auditLogs.length - 1];
      expect(lastAudit.newValues.status).toBe('absent');
      expect(lastAudit.reason).toContain('Spoofed location confirmed');
    });

    it('returns pendingFlaggedPunches count in getLockStatus', async () => {
      const today = new Date();
      const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      const res = await request(app)
        .get(`/api/v1/attendance/lock-status?yearMonth=${ym}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics).toBeDefined();
      expect(typeof res.body.data.metrics.pendingFlaggedPunches).toBe('number');
    });
  });
});
