/**
 * @file rateLimiter.js
 * @description Standardized rate limiters using express-rate-limit draft-8 headers.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.5 Advanced Perimeter Defenses
 * - Headers: draft-8 compliant standardHeaders: 'draft-8', legacyHeaders: false
 */

import rateLimit from 'express-rate-limit';

/**
 * Standard global API rate limiter: 500 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-ratelimit'],
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Authentication route limiter: 100 requests per 15 minutes per IP.
 * Exempts non-brute-force endpoints like session refresh (/refresh) and /me.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-ratelimit']) return true;
    // Skip rate limiting for silent session maintenance so regular app usage never causes lockouts
    const cleanPath = req.path || '';
    if (cleanPath.endsWith('/refresh') || cleanPath.endsWith('/me') || cleanPath.endsWith('/logout')) {
      return true;
    }
    return false;
  },
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});

/**
 * Export/Report rate limiter: 30 requests per minute
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-ratelimit'],
  message: {
    success: false,
    message: 'Too many export requests, please try again in a minute.'
  }
});
