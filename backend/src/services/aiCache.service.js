/**
 * @file aiCache.service.js
 * @description SHA-256 Resume Buffer & Screening Evaluation Cache Service (Phase 09 Enhancement).
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M15 Recruitment & AI Screening
 * - Standard Library First (Ponytail Rung 3): In-memory Map LRU cache with TTL and max size limits.
 * - Performance: 0ms latency and $0 cloud token expenditure on repeated re-screening of the same resume.
 * - Key derivation: Cryptographic SHA-256 hash of normalized document text or buffer.
 */

import crypto from 'crypto';

const MAX_CACHE_ENTRIES = 500;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class AiCacheService {
  constructor() {
    this.parseCache = new Map();
    this.screeningCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0
    };
  }

  /**
   * Generates a deterministic SHA-256 hash from text or binary buffer
   * @param {string|Buffer} content
   * @returns {string} Hexadecimal hash
   */
  computeHash(content) {
    if (!content) return '';
    return crypto
      .createHash('sha256')
      .update(Buffer.isBuffer(content) ? content : String(content).trim())
      .digest('hex');
  }

  /**
   * Retrieve cached resume parsed profile
   * @param {string} hash - SHA-256 hash
   * @returns {Object|null} Cached parsed profile or null
   */
  getParsedResume(hash) {
    if (!hash || !this.parseCache.has(hash)) {
      this.stats.misses++;
      return null;
    }

    const entry = this.parseCache.get(hash);
    if (Date.now() > entry.expiresAt) {
      this.parseCache.delete(hash);
      this.stats.misses++;
      return null;
    }

    // Refresh LRU order
    this.parseCache.delete(hash);
    this.parseCache.set(hash, entry);
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Cache a parsed resume profile
   * @param {string} hash - SHA-256 hash
   * @param {Object} data - Profile JSON
   * @param {number} [ttlMs=DEFAULT_TTL_MS]
   */
  setParsedResume(hash, data, ttlMs = DEFAULT_TTL_MS) {
    if (!hash || !data) return;

    if (this.parseCache.size >= MAX_CACHE_ENTRIES) {
      // Evict oldest (first key in insertion order)
      const oldestKey = this.parseCache.keys().next().value;
      this.parseCache.delete(oldestKey);
    }

    this.parseCache.set(hash, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * Retrieve cached candidate screening evaluation against a specific job
   * @param {string} cvHash - SHA-256 hash of CV
   * @param {string} jobIdentifier - Job ID or slug
   * @returns {Object|null} Cached screening result or null
   */
  getScreeningResult(cvHash, jobIdentifier) {
    const key = `${cvHash}:${jobIdentifier}`;
    if (!this.screeningCache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const entry = this.screeningCache.get(key);
    if (Date.now() > entry.expiresAt) {
      this.screeningCache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Refresh LRU order
    this.screeningCache.delete(key);
    this.screeningCache.set(key, entry);
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Cache screening result against a specific job
   * @param {string} cvHash
   * @param {string} jobIdentifier
   * @param {Object} data
   * @param {number} [ttlMs=DEFAULT_TTL_MS]
   */
  setScreeningResult(cvHash, jobIdentifier, data, ttlMs = DEFAULT_TTL_MS) {
    if (!cvHash || !jobIdentifier || !data) return;
    const key = `${cvHash}:${jobIdentifier}`;

    if (this.screeningCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.screeningCache.keys().next().value;
      this.screeningCache.delete(oldestKey);
    }

    this.screeningCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * Clear cache for testing or maintenance
   */
  clear() {
    this.parseCache.clear();
    this.screeningCache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getMetrics() {
    return {
      ...this.stats,
      parsedEntries: this.parseCache.size,
      screenedEntries: this.screeningCache.size
    };
  }
}

export const aiCache = new AiCacheService();
export default aiCache;
