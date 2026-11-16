/**
 * @file m15.multiProvider.test.js
 * @description Unit & Failover Tests for Multi-Provider AI Resume Service (Gemini & OpenAI).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAvailableProviders,
  callLlmWithFailover,
  parseResumeText,
  screenCandidateFit
} from '../src/services/ai.service.js';

describe('Module M15 — Multi-Provider AI Architecture & Failover Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAvailableProviders', () => {
    it('should return Gemini and OpenAI in auto mode when both keys are present', () => {
      process.env.AI_PROVIDER = 'auto';
      process.env.GEMINI_API_KEY = 'gemini-secret-test-key';
      process.env.OPENAI_API_KEY = 'sk-proj-openai-test-key';

      const providers = getAvailableProviders();
      expect(providers.length).toBe(2);
      expect(providers[0].name).toBe('Gemini');
      expect(providers[0].model).toBe('gemini-2.5-flash');
      expect(providers[1].name).toBe('OpenAI');
      expect(providers[1].model).toBe('gpt-4o-mini');
    });

    it('should respect AI_PROVIDER=openai and return OpenAI exclusively', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.GEMINI_API_KEY = 'gemini-secret-test-key';
      process.env.OPENAI_API_KEY = 'sk-proj-openai-test-key';

      const providers = getAvailableProviders();
      expect(providers.length).toBe(1);
      expect(providers[0].name).toBe('OpenAI');
    });

    it('should respect AI_PROVIDER=gemini and return Gemini exclusively', () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'gemini-secret-test-key';
      process.env.OPENAI_API_KEY = 'sk-proj-openai-test-key';

      const providers = getAvailableProviders();
      expect(providers.length).toBe(1);
      expect(providers[0].name).toBe('Gemini');
    });

    it('should return empty list when no valid keys are set', () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const providers = getAvailableProviders();
      expect(providers.length).toBe(0);
    });
  });

  describe('callLlmWithFailover', () => {
    it('should seamlessly failover to secondary provider when primary returns HTTP 429', async () => {
      process.env.AI_PROVIDER = 'auto';
      process.env.GEMINI_API_KEY = 'gemini-test-key';
      process.env.OPENAI_API_KEY = 'openai-test-key';

      const mockFetch = vi.fn();

      // First call (Gemini) returns 429 Quota Exhausted
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Quota exceeded for metric: generativelanguage.googleapis.com'
      });

      // Second call (OpenAI) succeeds with 200 OK
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  candidateName: 'Jane Failover',
                  parsedSkills: ['React', 'Node.js'],
                  totalExperienceYears: 4,
                  highestEducation: "Bachelor's Degree",
                  executiveSummary: 'Experienced developer.'
                })
              }
            }
          ]
        })
      });

      global.fetch = mockFetch;

      const result = await callLlmWithFailover({
        systemPrompt: 'Extract resume',
        userPrompt: 'Candidate text',
        schema: { type: 'object' },
        schemaName: 'test_schema'
      });

      // Verify both providers were called sequentially
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toContain('generativelanguage.googleapis.com');
      expect(mockFetch.mock.calls[1][0]).toContain('api.openai.com');

      // Verify result was obtained from OpenAI failover
      expect(result.providerUsed).toBe('OpenAI');
      expect(result.data.candidateName).toBe('Jane Failover');
    });

    it('should drop to heuristic engine when all cloud providers fail', async () => {
      process.env.AI_PROVIDER = 'auto';
      process.env.GEMINI_API_KEY = 'gemini-test-key';
      process.env.OPENAI_API_KEY = 'openai-test-key';

      const mockFetch = vi.fn();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable'
      });

      global.fetch = mockFetch;

      const result = await callLlmWithFailover({
        systemPrompt: 'Extract resume',
        userPrompt: 'Candidate text',
        schema: { type: 'object' },
        schemaName: 'test_schema'
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.providerUsed).toBe('Heuristic');
      expect(result.data).toBeNull();
    });
  });

  describe('End-to-End parseResumeText & screenCandidateFit with Failover', () => {
    it('should parse resume and tag providerUsed correctly', async () => {
      process.env.AI_PROVIDER = 'auto';
      process.env.GEMINI_API_KEY = 'gemini-key';
      delete process.env.OPENAI_API_KEY;

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  candidateName: 'David Banner',
                  parsedSkills: ['Python', 'Docker', 'AWS'],
                  totalExperienceYears: 6,
                  highestEducation: "Master's Degree",
                  executiveSummary: 'Senior Cloud Engineer.'
                })
              }
            }
          ]
        })
      });

      global.fetch = mockFetch;

      const profile = await parseResumeText('David Banner\nPython, Docker, AWS Engineer\n6 years exp');
      expect(profile.candidateName).toBe('David Banner');
      expect(profile.parsedSkills).toContain('Docker');
      expect(profile.aiProvider).toBe('Gemini');
    });
  });
});
