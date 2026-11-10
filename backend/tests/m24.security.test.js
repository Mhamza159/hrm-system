/**
 * @file m24.security.test.js
 * @description Hardening & Edge-Case Stress Test Suite for Module M24 (Internal Chat).
 * Tests race conditions, IDOR, NoSQL injection, file upload security, and XSS resistance.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Conversation } from '../src/models/conversation.model.js';
import { Message } from '../src/models/message.model.js';
import { getOrCreateDirectConversation } from '../src/modules/chat/chat.service.js';

describe('Module M24 — Security Hardening & Edge-Case Stress Tests', () => {
  let userAToken, userBToken, userCToken;
  let userA, userB, userC;
  let privateConvId;

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        roles: ['Employee']
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI);
    }

    const empRole = await Role.findOne({ name: 'Employee' });

    userA = await User.findOneAndUpdate(
      { email: 'chat_sec_user_a@test.com' },
      { email: 'chat_sec_user_a@test.com', passwordHash: 'hash', roles: [empRole._id], isActive: true },
      { upsert: true, new: true }
    );
    userB = await User.findOneAndUpdate(
      { email: 'chat_sec_user_b@test.com' },
      { email: 'chat_sec_user_b@test.com', passwordHash: 'hash', roles: [empRole._id], isActive: true },
      { upsert: true, new: true }
    );
    userC = await User.findOneAndUpdate(
      { email: 'chat_sec_user_c@test.com' },
      { email: 'chat_sec_user_c@test.com', passwordHash: 'hash', roles: [empRole._id], isActive: true },
      { upsert: true, new: true }
    );

    userAToken = generateToken(userA);
    userBToken = generateToken(userB);
    userCToken = generateToken(userC);

    // Clean up test conversations
    await Conversation.deleteMany({
      participants: { $in: [userA._id, userB._id, userC._id] }
    });

    // Ensure unique index is built in MongoDB
    await Conversation.syncIndexes();

    // Create baseline private conversation between A and B
    const conv = await getOrCreateDirectConversation(userA._id, userB._id);
    privateConvId = conv._id.toString();
  });

  afterAll(async () => {
    await Conversation.deleteMany({
      participants: { $in: [userA._id, userB._id, userC._id] }
    });
    await Message.deleteMany({
      senderId: { $in: [userA._id, userB._id, userC._id] }
    });
    await User.deleteMany({
      email: { $in: ['chat_sec_user_a@test.com', 'chat_sec_user_b@test.com', 'chat_sec_user_c@test.com'] }
    });
  });

  describe('1. Concurrency & Double-Click Race Condition Handling', () => {
    it('concurrent getOrCreateDirectConversation calls absorb duplicate key error gracefully', async () => {
      // Fire 5 simultaneous calls to simulate double-click or fast multi-tab clicks between B and C
      const promises = [
        getOrCreateDirectConversation(userB._id, userC._id),
        getOrCreateDirectConversation(userB._id, userC._id),
        getOrCreateDirectConversation(userB._id, userC._id),
        getOrCreateDirectConversation(userB._id, userC._id),
        getOrCreateDirectConversation(userB._id, userC._id)
      ];

      const results = await Promise.all(promises);

      // All 5 must succeed and return the exact same conversation _id
      expect(results.length).toBe(5);
      const firstId = results[0]._id.toString();
      results.forEach((res) => {
        expect(res._id.toString()).toBe(firstId);
      });

      // Verify only 1 document exists in MongoDB for this pair
      const count = await Conversation.countDocuments({
        directKey: [userB._id.toString(), userC._id.toString()].sort().join('_')
      });
      expect(count).toBe(1);
    });
  });

  describe('2. PBAC & Cross-Conversation IDOR Protection', () => {
    it('User C (non-participant) cannot access private conversation between User A and User B (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${privateConvId}`)
        .set('Authorization', `Bearer ${userCToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not a participant');
    });

    it('User C (non-participant) cannot read messages from private conversation (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${privateConvId}/messages`)
        .set('Authorization', `Bearer ${userCToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not a participant');
    });

    it('User C (non-participant) cannot post messages to private conversation (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${privateConvId}/messages`)
        .set('Authorization', `Bearer ${userCToken}`)
        .send({ content: 'Eavesdropping payload' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not a participant');
    });
  });

  describe('3. Insecure Attachment URL & Injection Hardening', () => {
    it('rejects attachment URLs using javascript: protocol (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${privateConvId}/messages`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          content: 'Malicious payload',
          attachments: [
            {
              url: 'javascript:alert(1)',
              fileName: 'script.js',
              fileType: 'application/javascript'
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-HTTPS attachment URLs (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${privateConvId}/messages`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          content: 'Unencrypted link',
          attachments: [
            {
              url: 'http://insecure.site/test.png',
              fileName: 'test.png',
              fileType: 'image/png'
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. File Upload Perimeter Defenses', () => {
    it('rejects malicious or executable file types (400)', async () => {
      const fakeExecutable = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
      const res = await request(app)
        .post('/api/v1/chat/upload')
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', fakeExecutable, {
          filename: 'payload.exe',
          contentType: 'application/x-msdownload'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unsupported file type');
    });

    it('rejects empty upload request with no file attached (400)', async () => {
      const res = await request(app)
        .post('/api/v1/chat/upload')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No file uploaded');
    });
  });

  describe('5. Input Edge Cases & XSS Resistance', () => {
    it('rejects whitespace-only message content when no attachments exist (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${privateConvId}/messages`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ content: '     ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('must have content or at least one attachment');
    });

    it('safely stores and returns message containing XSS characters without corruption', async () => {
      const xssString = '<script>alert("XSS")</script><img src="x" onerror="steal()"/>';
      const res = await request(app)
        .post(`/api/v1/conversations/${privateConvId}/messages`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ content: xssString });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe(xssString);
    });

    it('cannot initiate direct conversation with oneself (400)', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'direct',
          participantId: userA._id.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot initiate direct conversation with yourself');
    });
  });
});
