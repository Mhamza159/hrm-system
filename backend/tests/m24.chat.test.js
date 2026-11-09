/**
 * @file m24.chat.test.js
 * @description Integration Test Suite for Module M24: Internal Chat (BUILD-GUIDE Rows 24.1 to 24.7).
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
import { Conversation } from '../src/models/conversation.model.js';
import { Message } from '../src/models/message.model.js';
import { seedRolesAndAdmin } from '../src/seed/roles.seed.js';

describe('Module M24 — Internal Chat Test Suite', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser;
  let engineeringDept;
  let directConversationId;
  let groupConversationId;
  let departmentConversationId;

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
      { name: 'Engineering-M24' },
      { name: 'Engineering-M24', description: 'Tech Team M24', code: 'ENG-M24' },
      { upsert: true, new: true }
    );

    const devDesig = await Designation.findOneAndUpdate(
      { title: 'Software Engineer-M24' },
      { title: 'Software Engineer-M24', code: 'SE-M24', departmentId: engineeringDept._id },
      { upsert: true, new: true }
    );

    // Create test accounts
    superAdminUser = await User.findOneAndUpdate(
      { email: 'mhamzaofficial159@gmail.com' },
      { roles: [superAdminRole._id] },
      { new: true }
    ).populate('roles');

    hrManagerUser = await User.findOneAndUpdate(
      { email: 'hr-m24@hrm.company.pk' },
      {
        email: 'hr-m24@hrm.company.pk',
        passwordHash: '$2b$12$e8Y...testHash',
        roles: [hrRole._id]
      },
      { upsert: true, new: true }
    ).populate('roles');

    deptManagerUser = await User.findOneAndUpdate(
      { email: 'manager-m24@hrm.company.pk' },
      {
        email: 'manager-m24@hrm.company.pk',
        passwordHash: '$2b$12$e8Y...testHash',
        roles: [deptRole._id]
      },
      { upsert: true, new: true }
    ).populate('roles');

    employeeUser = await User.findOneAndUpdate(
      { email: 'employee-m24@hrm.company.pk' },
      {
        email: 'employee-m24@hrm.company.pk',
        passwordHash: '$2b$12$e8Y...testHash',
        roles: [empRole._id]
      },
      { upsert: true, new: true }
    ).populate('roles');

    // Create employee profile linked to employeeUser for department channel test
    await Employee.findOneAndUpdate(
      { userId: employeeUser._id },
      {
        userId: employeeUser._id,
        name: 'Tariq Employee M24',
        departmentId: engineeringDept._id,
        designationId: devDesig._id,
        employeeCode: 'EMP-M24-TEST',
        joiningDate: new Date()
      },
      { upsert: true, new: true }
    );

    superAdminToken = generateToken(superAdminUser);
    hrManagerToken = generateToken(hrManagerUser);
    deptManagerToken = generateToken(deptManagerUser);
    employeeToken = generateToken(employeeUser);
  });

  afterAll(async () => {
    // Cleanup M24 test conversations and messages
    if (directConversationId) {
      await Message.deleteMany({ conversationId: directConversationId });
      await Conversation.findByIdAndDelete(directConversationId);
    }
    if (groupConversationId) {
      await Message.deleteMany({ conversationId: groupConversationId });
      await Conversation.findByIdAndDelete(groupConversationId);
    }
    if (departmentConversationId) {
      await Message.deleteMany({ conversationId: departmentConversationId });
      await Conversation.findByIdAndDelete(departmentConversationId);
    }
    await User.deleteMany({ email: { $in: ['hr-m24@hrm.company.pk', 'manager-m24@hrm.company.pk', 'employee-m24@hrm.company.pk'] } });
    await Employee.deleteMany({ employeeCode: 'EMP-M24-TEST' });
    await Department.deleteMany({ code: 'ENG-M24' });
  });

  // =========================================================================
  // ROW 24.1: ONE-TO-ONE DIRECT MESSAGING
  // =========================================================================
  describe('Row 24.1: One-to-One Direct Messaging', () => {
    it('1. Employee can initiate 1-to-1 conversation with HR Manager (201)', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'direct',
          participantId: hrManagerUser._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('direct');
      expect(res.body.data.participants).toHaveLength(2);
      directConversationId = res.body.data._id;
    });

    it('2. Initiating direct chat between same participants reuses conversation (idempotent)', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          type: 'direct',
          participantId: employeeUser._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.data._id.toString()).toBe(directConversationId.toString());
    });

    it('3. Employee sends a direct message successfully (201)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${directConversationId}/messages`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          content: 'Hello HR, I have a quick question about benefits.',
          messageType: 'text'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello HR, I have a quick question about benefits.');
      expect(res.body.data.senderId.toString()).toBe(employeeUser._id.toString());
    });

    it('4. HR Manager retrieves paginated message history (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${directConversationId}/messages`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].content).toContain('benefits');
    });
  });

  // =========================================================================
  // ROW 24.2: CUSTOM GROUP CHAT
  // =========================================================================
  describe('Row 24.2: Custom Group Chat', () => {
    it('1. Department Manager creates multi-user group chat (201)', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          type: 'group',
          name: 'Sprint Alpha Taskforce',
          description: 'Technical taskforce for Alpha release',
          participants: [employeeUser._id.toString()]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('group');
      expect(res.body.data.name).toBe('Sprint Alpha Taskforce');
      groupConversationId = res.body.data._id;
    });

    it('2. Group admin adds a new participant to the group (200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/conversations/${groupConversationId}/participants`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          action: 'add',
          userId: hrManagerUser._id.toString()
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const participantIds = res.body.data.participants.map((p) => p._id.toString());
      expect(participantIds).toContain(hrManagerUser._id.toString());
    });

    it('3. Non-admin regular participant is blocked from adding members (403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/conversations/${groupConversationId}/participants`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          action: 'add',
          userId: superAdminUser._id.toString()
        });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // ROW 24.3: AUTOMATED DEPARTMENT CHANNELS
  // =========================================================================
  describe('Row 24.3: Automated Department Channels', () => {
    it('1. Employee syncs department channel based on employee profile (200)', async () => {
      const res = await request(app)
        .get('/api/v1/conversations/sync-department')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('department');
      expect(res.body.data.name).toContain('Engineering-M24');
      departmentConversationId = res.body.data._id;
    });
  });

  // =========================================================================
  // ROW 24.4: FILE SHARING & ATTACHMENTS
  // =========================================================================
  describe('Row 24.4: File Sharing & Attachments', () => {
    it('1. User sends message with valid HTTPS file attachments (201)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${groupConversationId}/messages`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          content: 'Here is the release architecture diagram.',
          messageType: 'file',
          attachments: [
            {
              url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
              fileName: 'release-architecture.pdf',
              fileType: 'application/pdf',
              fileSize: 204850
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.attachments).toHaveLength(1);
      expect(res.body.data.attachments[0].url).toContain('https://');
    });

    it('2. Rejects dangerous attachment schemes such as javascript: or insecure HTTP (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${groupConversationId}/messages`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          content: 'Malicious file link',
          attachments: [
            {
              url: 'javascript:alert(1)',
              fileName: 'malicious.js'
            }
          ]
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // ROW 24.5: READ RECEIPTS
  // =========================================================================
  describe('Row 24.5: Read Receipts', () => {
    it('1. Recipient marks conversation messages as read (200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/conversations/${directConversationId}/read`)
        .set('Authorization', `Bearer ${hrManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =========================================================================
  // ROW 24.6: MESSAGE SEARCH
  // =========================================================================
  describe('Row 24.6: Message Search', () => {
    it('1. Employee can search past messages across their conversations (200)', async () => {
      const res = await request(app)
        .get('/api/v1/messages/search')
        .set('Authorization', `Bearer ${employeeToken}`)
        .query({ q: 'benefits' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].content).toContain('benefits');
    });

    it('2. Search strictly confines results to conversations user participates in', async () => {
      // Super Admin sends private message in a conversation Employee is not part of
      const privateConv = await Conversation.create({
        type: 'direct',
        directKey: [superAdminUser._id.toString(), hrManagerUser._id.toString()].sort().join('_'),
        participants: [superAdminUser._id, hrManagerUser._id]
      });

      await Message.create({
        conversationId: privateConv._id,
        senderId: superAdminUser._id,
        content: 'TopSecretSalaryExecutiveDiscussionM24',
        messageType: 'text'
      });

      // Employee searches for TopSecretSalaryExecutiveDiscussionM24
      const res = await request(app)
        .get('/api/v1/messages/search')
        .set('Authorization', `Bearer ${employeeToken}`)
        .query({ q: 'TopSecretSalaryExecutiveDiscussionM24' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0); // Zero leak

      await Message.deleteMany({ conversationId: privateConv._id });
      await Conversation.findByIdAndDelete(privateConv._id);
    });
  });

  // =========================================================================
  // ROW 24.7: CHANNEL ARCHIVAL & MODERATION
  // =========================================================================
  describe('Row 24.7: Channel Archival & Moderation', () => {
    it('1. Regular employee is blocked from archiving conversation (403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/conversations/${groupConversationId}/archive`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('2. Super Admin can archive the conversation (200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/conversations/${groupConversationId}/archive`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isArchived).toBe(true);
    });

    it('3. Subsequent messages to archived conversation are strictly rejected with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${groupConversationId}/messages`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          content: 'Can anyone still read this?',
          messageType: 'text'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('archived');
    });
  });
});
