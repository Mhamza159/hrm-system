/**
 * @file m21.feedback.test.js
 * @description Integration Test Suite for Module M21: Anonymous Feedback & Grievance (BUILD-GUIDE Rows 21.1 to 21.5).
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
import { Designation } from '../src/models/designation.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Feedback } from '../src/models/feedback.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M21 — Anonymous Feedback & Grievance Test Suite', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser;
  let engineeringDept;
  let anonymousTrackingCode;
  let createdCaseId;

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
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }
    await seedRolesAndAdmin();

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    engineeringDept = await Department.findOneAndUpdate(
      { name: 'Engineering-M21' },
      { name: 'Engineering-M21', description: 'Tech Team' },
      { upsert: true, new: true }
    );

    const devDesig = await Designation.findOneAndUpdate(
      { title: 'Software Engineer-M21' },
      { title: 'Software Engineer-M21', code: 'SE-M21', departmentId: engineeringDept._id },
      { upsert: true, new: true }
    );

    superAdminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' }).populate('roles');
    superAdminToken = generateToken(superAdminUser);

    hrManagerUser = await User.findOneAndUpdate(
      { email: 'hr.manager.m21@hrm.local' },
      {
        email: 'hr.manager.m21@hrm.local',
        passwordHash: '$2a$10$hashedpassm21',
        roles: [hrRole._id],
        role: 'HR Manager',
        isActive: true,
        permissions: hrRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    hrManagerToken = generateToken(hrManagerUser);

    deptManagerUser = await User.findOneAndUpdate(
      { email: 'dept.manager.m21@hrm.local' },
      {
        email: 'dept.manager.m21@hrm.local',
        passwordHash: '$2a$10$hashedpassm21',
        roles: [deptRole._id],
        role: 'Department Manager',
        isActive: true,
        permissions: deptRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    deptManagerToken = generateToken(deptManagerUser);

    employeeUser = await User.findOneAndUpdate(
      { email: 'employee.m21@hrm.local' },
      {
        email: 'employee.m21@hrm.local',
        passwordHash: '$2a$10$hashedpassm21',
        roles: [empRole._id],
        role: 'Employee',
        isActive: true,
        permissions: empRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    employeeToken = generateToken(employeeUser);

    await Employee.findOneAndUpdate(
      { userId: employeeUser._id },
      {
        userId: employeeUser._id,
        name: 'Employee Twenty-One',
        employeeCode: 'EMP-M21-01',
        department: engineeringDept._id,
        designation: devDesig._id,
        status: 'Active',
        dob: new Date('1995-05-15'),
        joiningDate: new Date('2022-01-10')
      },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    await Feedback.deleteMany({ title: /M21 Test/ });
  });

  // ==========================================
  // ROW 21.1: Gumnaam Mashwara & Suggestions
  // ==========================================
  describe('Row 21.1: Anonymous Feedback & Suggestions', () => {
    it('1. Employee submits anonymous suggestion with zero author trace in DB (201)', async () => {
      const res = await request(app)
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'M21 Test: Improve cafeteria coffee quality',
          description: 'The coffee machines on 3rd floor need servicing and fresh beans.',
          category: 'Suggestion',
          priority: 'Low',
          isAnonymous: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trackingCode).toBeDefined();
      expect(res.body.data.isAnonymous).toBe(true);

      anonymousTrackingCode = res.body.data.trackingCode;

      // Direct MongoDB check: Verify submittedBy is strictly NULL
      const savedDoc = await Feedback.findOne({ trackingCode: anonymousTrackingCode });
      expect(savedDoc).toBeDefined();
      expect(savedDoc.submittedBy).toBeNull();
      expect(savedDoc.isAnonymous).toBe(true);
    });

    it('2. Employee submits named formal grievance (201)', async () => {
      const res = await request(app)
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'M21 Test: Shift scheduling inconsistency',
          description: 'My weekend rotation has been changed without advance 48-hour notice.',
          category: 'Grievance',
          priority: 'Medium',
          isAnonymous: false,
          departmentId: engineeringDept._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trackingCode).toBeDefined();

      createdCaseId = res.body.data._id;

      // Direct MongoDB check: Verify submittedBy is saved
      const savedDoc = await Feedback.findById(createdCaseId);
      expect(savedDoc.submittedBy.toString()).toBe(employeeUser._id.toString());
      expect(savedDoc.isAnonymous).toBe(false);
    });
  });

  // ==========================================
  // ROW 21.2: Baqaida Shikayat + Case Tracking
  // ==========================================
  describe('Row 21.2: Case Lifecycle & Case Notes', () => {
    it('1. HR Manager retrieves feedback list with pagination (200)', async () => {
      const res = await request(app)
        .get('/api/v1/feedback')
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('2. HR Manager updates grievance status to "In Investigation" (200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/feedback/${createdCaseId}/status`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          status: 'In Investigation',
          resolutionNote: 'Contacting roster coordinator for schedule audit.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('In Investigation');

      // Check case notes array has audit entry
      expect(res.body.data.caseNotes.length).toBeGreaterThanOrEqual(2);
    });

    it('3. HR Manager adds investigation case note (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/feedback/${createdCaseId}/notes`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          note: 'Preliminary hearing conducted with shift coordinator.',
          isPublicToComplainant: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const notes = res.body.data.caseNotes;
      const latestNote = notes[notes.length - 1];
      expect(latestNote.note).toBe('Preliminary hearing conducted with shift coordinator.');
      expect(latestNote.isPublicToComplainant).toBe(true);
    });

    it('4. HR Manager resolves case with resolution findings (200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/feedback/${createdCaseId}/status`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          status: 'Resolved',
          resolutionNote: 'Roster policy updated and compensation credit granted for short-notice change.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Resolved');
      expect(res.body.data.resolvedAt).toBeDefined();
    });
  });

  // ==========================================
  // ROW 21.4: Gumnaam Status Update Lookup
  // ==========================================
  describe('Row 21.4: Confidential Status Tracking', () => {
    it('1. Public lookup returns sanitized timeline by tracking code (200)', async () => {
      const res = await request(app).get(`/api/v1/feedback/track/${anonymousTrackingCode}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trackingCode).toBe(anonymousTrackingCode);
      expect(res.body.data.isAnonymous).toBe(true);
      expect(res.body.data.submittedBy).toBeUndefined(); // Stripped
      expect(Array.isArray(res.body.data.caseNotes)).toBe(true);
    });

    it('2. Invalid tracking code returns 404 Not Found (404)', async () => {
      const res = await request(app).get('/api/v1/feedback/track/TRK-NONEXISTENT');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // ROW 21.5: Escalation to Super Admin
  // ==========================================
  describe('Row 21.5: Grievance Escalation', () => {
    it('1. HR Manager escalates a complex case to Super Admin (200)', async () => {
      // Create new case to escalate
      const newCase = await Feedback.create({
        title: 'M21 Test: Unresolved policy deadlock',
        description: 'Dispute between cross-functional teams regarding project overtime hours.',
        category: 'Workplace Issue',
        priority: 'High',
        trackingCode: 'TRK-ESCALATE1',
        status: 'Under Review'
      });

      const res = await request(app)
        .patch(`/api/v1/feedback/${newCase._id}/escalate`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          reason: 'Impasse reached between team directors; executive mediation required.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Escalated');
      expect(res.body.data.isEscalated).toBe(true);
      expect(res.body.data.escalationDetails.reason).toBe(
        'Impasse reached between team directors; executive mediation required.'
      );
    });
  });
});
