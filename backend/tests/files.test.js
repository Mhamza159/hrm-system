/**
 * @file files.test.js
 * @description Integration tests for ephemeral signed file streaming (HMAC-SHA256, expiration, tampering, path traversal).
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.6 Ephemeral Signed File Streaming
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { generateSignedFileUrl, verifySignedFileUrl } from '../src/modules/files/file.service.js';

describe('Module X1.6 — Ephemeral Signed File Streaming', { timeout: 30000 }, () => {
  const testDir = path.resolve(process.cwd(), 'uploads', 'test-vault');
  const testFilePath = path.join(testDir, 'confidential_test.pdf');
  const relativeTestPath = 'uploads/test-vault/confidential_test.pdf';
  let authToken;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_x1_files');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});

    const role = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const user = await User.create({
      name: 'Super Admin',
      email: 'admin_files@test.com',
      passwordHash: 'dummyhash',
      roles: [role._id],
      status: 'Active',
      isActive: true,
      isDeleted: false
    });

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFilePath, '%PDF-1.4 Mock confidential employee document content');

    // Create a mock authenticated token for signed-url endpoint
    authToken = jwt.sign(
      {
        userId: user._id.toString(),
        sub: user._id.toString(),
        roles: ['Super Admin']
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    if (fs.existsSync(testDir)) {
      try {
        fs.rmdirSync(testDir);
      } catch (e) {
        // ignore
      }
    }
    await mongoose.connection.close();
  });

  describe('Service Signature Logic', () => {
    it('X1.6-TEST: Generates valid HMAC-SHA256 signed URL structure', () => {
      const url = generateSignedFileUrl(relativeTestPath, 300);
      expect(url).toContain('/api/v1/files/download?');
      expect(url).toContain('path=uploads%2Ftest-vault%2Fconfidential_test.pdf');
      expect(url).toContain('expires=');
      expect(url).toContain('sig=');
    });

    it('X1.6-TEST: Verification passes for unexpired and untampered link', () => {
      const url = generateSignedFileUrl(relativeTestPath, 300);
      const urlObj = new URL(url, 'http://localhost');
      const p = urlObj.searchParams.get('path');
      const exp = urlObj.searchParams.get('expires');
      const sig = urlObj.searchParams.get('sig');

      const result = verifySignedFileUrl(p, exp, sig);
      expect(result.valid).toBe(true);
      expect(result.resolvedPath).toBe(testFilePath);
    });

    it('X1.6-TEST: Verification rejects expired timestamp (> 5 minutes ago)', () => {
      const pastExpires = Math.floor(Date.now() / 1000) - 60; // 60s ago
      const result = verifySignedFileUrl(relativeTestPath, pastExpires, 'abcd1234');
      expect(result.valid).toBe(false);
      expect(result.status).toBe(403);
      expect(result.message).toContain('expired');
    });

    it('X1.6-TEST: Verification rejects forged or altered signature', () => {
      const url = generateSignedFileUrl(relativeTestPath, 300);
      const urlObj = new URL(url, 'http://localhost');
      const p = urlObj.searchParams.get('path');
      const exp = urlObj.searchParams.get('expires');

      const result = verifySignedFileUrl(p, exp, 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb');
      expect(result.valid).toBe(false);
      expect(result.status).toBe(403);
      expect(result.message).toContain('Invalid or forged');
    });

    it('X1.6-TEST: Verification strictly blocks directory traversal outside uploads', () => {
      const maliciousPath = '../../package.json';
      const fakeExpires = Math.floor(Date.now() / 1000) + 300;
      const fakeSig = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

      const result = verifySignedFileUrl(maliciousPath, fakeExpires, fakeSig);
      expect(result.valid).toBe(false);
      expect(result.status).toBe(403);
    });
  });

  describe('HTTP Endpoints Streaming Integration', () => {
    it('X1.6-TEST: GET /api/v1/files/signed-url returns ephemeral URL for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/files/signed-url')
        .query({ path: relativeTestPath })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toContain('/api/v1/files/download?path=');
      expect(res.body.data.expiresIn).toBe(300);
    });

    it('X1.6-TEST: GET /api/v1/files/download streams file contents with valid signature', async () => {
      const signedUrl = generateSignedFileUrl(relativeTestPath, 300);
      const res = await request(app).get(signedUrl);

      expect(res.status).toBe(200);
      const content = res.text || (res.body ? res.body.toString('utf-8') : '');
      expect(content).toContain('%PDF-1.4 Mock confidential employee document content');
    });

    it('X1.6-TEST: GET /api/v1/files/download blocks tampered path parameter with 403', async () => {
      const signedUrl = generateSignedFileUrl(relativeTestPath, 300);
      // Alter path in query
      const tamperedUrl = signedUrl.replace('confidential_test.pdf', 'other_file.pdf');
      const res = await request(app).get(tamperedUrl);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Invalid or forged');
    });
  });
});
