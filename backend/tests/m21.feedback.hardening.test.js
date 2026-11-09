/**
 * @file m21.feedback.hardening.test.js
 * @description Security, Hardening & Doubt-Driven Stress Tests for Module M21.
 * Covers:
 * 1. Zero author footprint in database (submittedBy null AND caseNotes[0].authorId sanitized)
 * 2. NoSQL / Regex ReDoS injection resilience
 * 3. Input validation boundaries on :id and :code
 * 4. Attachment scheme security (blocking javascript: and http://)
 * 5. Department Manager multi-role isolation (HTTP 403 on all admin routes)
 * 6. Public tracking data sanitization (zero internal notes or identity leaks)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Feedback } from '../src/models/feedback.model.js';
import jwt from 'jsonwebtoken';

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles?.map((r) => r.name || r) || [user.role]
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Module M21 — Security Hardening & Edge Cases', () => {
  let superAdminUser, superAdminToken;
  let hrUser, hrToken;
  let deptManagerUser, deptManagerToken;
  let employeeUser, employeeToken;
  let engineeringDept;
  let createdCaseId;
  let createdTrackingCode;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }

    // Ensure departments
    engineeringDept = await Department.findOneAndUpdate(
      { code: 'ENG-HARDEN' },
      { name: 'Engineering Hardened', code: 'ENG-HARDEN' },
      { upsert: true, new: true }
    );

    // Fetch or ensure roles
    const hrRole = await Role.findOne({ name: 'HR Manager' });
    const deptRole = await Role.findOne({ name: 'Department Manager' });
    const empRole = await Role.findOne({ name: 'Employee' });

    // Super Admin
    superAdminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' }).populate('roles');
    if (!superAdminUser) {
      const saRole = await Role.findOne({ name: 'Super Admin' });
      superAdminUser = await User.create({
        email: 'mhamzaofficial159@gmail.com',
        passwordHash: '$2a$10$hashedpassm21',
        roles: [saRole._id],
        role: 'Super Admin',
        isActive: true
      });
    }
    superAdminToken = generateToken(superAdminUser);

    // HR Manager
    hrUser = await User.findOneAndUpdate(
      { email: 'hr.harden@hrm.local' },
      {
        email: 'hr.harden@hrm.local',
        passwordHash: '$2a$10$hashedpassm21',
        roles: [hrRole._id],
        role: 'HR Manager',
        isActive: true,
        permissions: hrRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    hrToken = generateToken(hrUser);

    // Dept Manager (with populated roles array)
    deptManagerUser = await User.findOneAndUpdate(
      { email: 'dept.harden@hrm.local' },
      {
        email: 'dept.harden@hrm.local',
        passwordHash: '$2a$10$hashedpassm21',
        roles: [deptRole._id],
        role: 'Department Manager',
        isActive: true,
        permissions: deptRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    deptManagerToken = generateToken(deptManagerUser);

    // Employee
    employeeUser = await User.findOneAndUpdate(
      { email: 'emp.harden@hrm.local' },
      {
        email: 'emp.harden@hrm.local',
        passwordHash: '$2a$10$hashedpassm21',
        roles: [empRole._id],
        role: 'Employee',
        isActive: true,
        permissions: empRole.permissions
      },
      { upsert: true, new: true }
    ).populate('roles');
    employeeToken = generateToken(employeeUser);
  });

  afterAll(async () => {
    await Feedback.deleteMany({ title: /HARDENING-TEST/ });
    await User.deleteMany({ email: { $in: ['hr.harden@hrm.local', 'dept.harden@hrm.local', 'emp.harden@hrm.local'] } });
  });

  // 1. Zero Author Footprint Invariant
  it('1. Anonymous submission guarantees zero author footprint in DB (submittedBy null AND caseNotes[0].authorId sanitized)', async () => {
    const res = await request(app)
      .post('/api/v1/feedback')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'HARDENING-TEST: Zero author footprint test',
        description: 'Verifying zero identity leakage in database and subdocuments.',
        category: 'Suggestion',
        priority: 'Low',
        isAnonymous: true
      });

    expect(res.status).toBe(201);
    createdTrackingCode = res.body.data.trackingCode;
    createdCaseId = res.body.data._id;

    // Direct database audit
    const doc = await Feedback.findById(createdCaseId);
    expect(doc).toBeDefined();
    expect(doc.submittedBy).toBeNull();
    expect(doc.isAnonymous).toBe(true);

    // Critical check: caseNotes[0].authorId MUST NOT match employeeUser._id
    expect(String(doc.caseNotes[0].authorId)).not.toBe(String(employeeUser._id));
    expect(doc.caseNotes[0].authorRole).toBe('Anonymous Complainant');
  });

  // 2. Attachment Scheme Hardening
  it('2. Rejects dangerous or insecure attachment schemes (javascript: or http://)', async () => {
    const resJs = await request(app)
      .post('/api/v1/feedback')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'HARDENING-TEST: Insecure attachment attempt',
        description: 'Attempting to inject a dangerous URI scheme.',
        category: 'Suggestion',
        priority: 'Low',
        attachments: ['javascript:alert(1)']
      });
    expect(resJs.status).toBe(400);

    const resHttp = await request(app)
      .post('/api/v1/feedback')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'HARDENING-TEST: Insecure HTTP attachment',
        description: 'Attempting unencrypted HTTP URL.',
        category: 'Suggestion',
        priority: 'Low',
        attachments: ['http://insecure-cdn.com/exploit.pdf']
      });
    expect(resHttp.status).toBe(400);
  });

  // 3. NoSQL / ReDoS Regex Injection Resilience
  it('3. ReDoS and NoSQL search injection is safely escaped and does not crash or stall server', async () => {
    const dangerousPatterns = [
      '((((a+)+)+)+)+',
      '.*.*.*.*.*.*',
      '\\\\\\\\\\',
      '[a-z]{1,1000000}',
      '{ $ne: null }'
    ];

    for (const pattern of dangerousPatterns) {
      const res = await request(app)
        .get(`/api/v1/feedback?search=${encodeURIComponent(pattern)}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });

  // 4. Input Validation Boundaries on :id and :code
  it('4. Rejects malformed ObjectIDs with HTTP 400 instead of 500 CastError', async () => {
    const res = await request(app)
      .get('/api/v1/feedback/not-a-valid-mongo-id')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(400);
  });

  it('5. Rejects malformed tracking codes with HTTP 400', async () => {
    const res = await request(app)
      .get('/api/v1/feedback/track/INVALID@@@CODE###');

    expect(res.status).toBe(400);
  });

  // 5. Public Tracking Sanitization
  it('6. Public tracking endpoint sanitizes all sensitive investigator notes and identity', async () => {
    // Add an internal note (isPublicToComplainant = false)
    await request(app)
      .post(`/api/v1/feedback/${createdCaseId}/notes`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        note: 'INTERNAL NOTE: Disciplinary action pending HR legal review.',
        isPublicToComplainant: false
      });

    // Add a public note (isPublicToComplainant = true)
    await request(app)
      .post(`/api/v1/feedback/${createdCaseId}/notes`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        note: 'PUBLIC NOTE: Facilities team has logged your suggestion.',
        isPublicToComplainant: true
      });

    // Public lookup via trackingCode
    const res = await request(app).get(`/api/v1/feedback/track/${createdTrackingCode}`);
    expect(res.status).toBe(200);

    const publicNotes = res.body.data.caseNotes;
    expect(publicNotes.some((n) => n.note.includes('INTERNAL NOTE'))).toBe(false);
    expect(publicNotes.some((n) => n.note.includes('PUBLIC NOTE'))).toBe(true);
    expect(res.body.data.submittedBy).toBeUndefined();
  });

  // 6. Department Manager Multi-Role Isolation
  it('7. Department Manager is strictly blocked (HTTP 403) from all administrative operations', async () => {
    // List
    const resList = await request(app)
      .get('/api/v1/feedback')
      .set('Authorization', `Bearer ${deptManagerToken}`);
    expect(resList.status).toBe(403);

    // Get by ID
    const resGet = await request(app)
      .get(`/api/v1/feedback/${createdCaseId}`)
      .set('Authorization', `Bearer ${deptManagerToken}`);
    expect(resGet.status).toBe(403);

    // Update status
    const resStatus = await request(app)
      .patch(`/api/v1/feedback/${createdCaseId}/status`)
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({ status: 'Under Review' });
    expect(resStatus.status).toBe(403);

    // Add note
    const resNote = await request(app)
      .post(`/api/v1/feedback/${createdCaseId}/notes`)
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({ note: 'Unauthorized note from manager' });
    expect(resNote.status).toBe(403);

    // Escalate
    const resEsc = await request(app)
      .patch(`/api/v1/feedback/${createdCaseId}/escalate`)
      .set('Authorization', `Bearer ${deptManagerToken}`)
      .send({ reason: 'Unauthorized escalation' });
    expect(resEsc.status).toBe(403);
  });
});
