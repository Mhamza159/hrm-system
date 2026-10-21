/**
 * @file perimeter.test.js
 * @description Integration tests for advanced perimeter defenses: NoSQL sanitization, Helmet headers, and Rate Limiting.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.5 Advanced Perimeter Defenses
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sanitize, sanitizeData } from '../src/middlewares/sanitize.js';
import app from '../src/app.js';

describe('Module X1.5 — Advanced Perimeter Defenses', () => {
  describe('NoSQL Injection & Parameter Pollution Sanitizer', () => {
    it('X1.5-TEST: sanitizeData recursively strips keys beginning with $ and containing .', () => {
      const maliciousPayload = {
        username: 'admin',
        password: { $ne: 'wrong_password' },
        nested: {
          $regex: '.*',
          'polluted.key': 'injection',
          safeKey: 'valid_value'
        },
        tags: [
          { $gt: 10 },
          { name: 'tag1' }
        ]
      };

      const cleaned = sanitizeData(maliciousPayload);

      expect(cleaned.username).toBe('admin');
      expect(cleaned.password).toEqual({});
      expect(cleaned.password.$ne).toBeUndefined();
      expect(cleaned.nested.safeKey).toBe('valid_value');
      expect(cleaned.nested.$regex).toBeUndefined();
      expect(cleaned.nested['polluted.key']).toBeUndefined();
      expect(cleaned.tags[0]).toEqual({});
      expect(cleaned.tags[0].$gt).toBeUndefined();
      expect(cleaned.tags[1]).toEqual({ name: 'tag1' });
    });

    it('X1.5-TEST: Express middleware cleanses req.body, req.query, and req.params', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(sanitize);

      let capturedBody;
      let capturedQuery;

      testApp.post('/api/test-sanitize', (req, res) => {
        capturedBody = req.body;
        capturedQuery = req.query;
        res.status(200).json({ success: true, body: req.body, query: req.query });
      });

      const res = await request(testApp)
        .post('/api/test-sanitize?filter[$gt]=10&normal=val')
        .send({
          email: 'test@example.com',
          role: { $ne: 'Employee' },
          'exploit.prop': 'bypass'
        });

      expect(res.status).toBe(200);
      expect(capturedBody.email).toBe('test@example.com');
      expect(capturedBody.role).toEqual({});
      expect(capturedBody['exploit.prop']).toBeUndefined();
      expect(capturedQuery.normal).toBe('val');
      expect(capturedQuery.filter).toEqual({});
    });
  });

  describe('Helmet HTTP Security Headers', () => {
    it('X1.5-TEST: App responses include nosniff and sameorigin headers', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('Standardized Draft-8 Rate Limiter', () => {
    it('X1.5-TEST: Triggers 429 Too Many Requests and attaches draft-8 headers when threshold is breached', async () => {
      const testApp = express();
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 3,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Rate limit exceeded'
        }
      });

      testApp.use('/test-limit', testLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      // 1st request -> 200
      const res1 = await request(testApp).get('/test-limit');
      expect(res1.status).toBe(200);
      expect(res1.headers['ratelimit-policy']).toBeDefined();
      expect(res1.headers['ratelimit']).toContain('r=2');

      // 2nd request -> 200
      const res2 = await request(testApp).get('/test-limit');
      expect(res2.status).toBe(200);
      expect(res2.headers['ratelimit']).toContain('r=1');

      // 3rd request -> 200
      const res3 = await request(testApp).get('/test-limit');
      expect(res3.status).toBe(200);
      expect(res3.headers['ratelimit']).toContain('r=0');

      // 4th request -> 429
      const res4 = await request(testApp).get('/test-limit');
      expect(res4.status).toBe(429);
      expect(res4.body.success).toBe(false);
      expect(res4.body.message).toBe('Rate limit exceeded');
    });
  });
});
