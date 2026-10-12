/**
 * @file authenticate.js
 * @description JSON Web Token (JWT) Bearer Authentication Middleware.
 * 
 * ARCHITECTURE & SECURITY SPECIFICATION:
 * - Module: M1 Authentication & Access Control (BUILD-GUIDE Section 4 · Rows 1.5 & 1.6)
 * - Layer: Middleware (Request Gatekeeper)
 * - Security Rules:
 *   1. Extracts Bearer token from HTTP `Authorization` header.
 *   2. Cryptographically verifies JWT signature against `JWT_ACCESS_SECRET`.
 *   3. Enforces user existence, soft-deletion check (`isDeleted: false`), and account status (`isActive: true`).
 *   4. Attaches sanitized `req.user` (excluding passwordHash) and `req.userId` to the request object.
 *   5. Denies request with HTTP 401 Unauthorized for missing, malformed, expired, or revoked credentials.
 */

import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import '../models/role.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  // 1. Extract Authorization header from incoming HTTP request
  const authHeader = req.headers.authorization;

  // 2. Validate header presence and Bearer schema format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token missing or malformed. Please sign in.');
  }

  // 3. Extract the raw JWT token string from "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new ApiError(401, 'Authentication token missing. Please sign in.');
  }

  // 4. Cryptographically verify token signature and expiration
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (jwtErr) {
    // If expired or signature invalid, reject with 401
    throw new ApiError(401, 'Invalid or expired access token. Please sign in again.');
  }

  // 5. Look up user record in MongoDB database
  // Exclude sensitive fields like passwordHash from memory attachment
  const user = await User.findOne({ _id: decoded.userId, isDeleted: false })
    .select('-passwordHash')
    .populate('roles')
    .lean();

  // 6. Verify user account exists and is not deactivated
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User account not found or deactivated. Access denied.');
  }

  // 7. Attach authenticated identity to Express request context
  req.user = user;
  req.userId = user._id;

  // 8. Forward execution down the Express middleware chain
  next();
});
