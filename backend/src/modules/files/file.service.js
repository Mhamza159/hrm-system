/**
 * @file file.service.js
 * @description Ephemeral HMAC-SHA256 Signed File Streaming & Validation Service.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.6 Ephemeral Signed File Streaming
 * - Standard: Node.js native crypto HMAC-SHA256, timingSafeEqual, strict directory jail
 */

import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env.js';

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

/**
 * Normalizes a relative or prefixed file path
 * @param {string} rawPath
 * @returns {string}
 */
function normalizeFilePath(rawPath) {
  if (!rawPath) return '';
  let clean = rawPath.replace(/\\/g, '/');
  if (clean.startsWith('/')) {
    clean = clean.slice(1);
  }
  return clean;
}

/**
 * Generates an ephemeral HMAC-SHA256 signed download URL valid for specified duration (default 5 min).
 * @param {string} filePath - Path relative to project root or uploads (e.g. 'uploads/documents/doc-1.pdf')
 * @param {number} expiresInSeconds - Lifetime of signature in seconds (default: 300)
 * @returns {string} Absolute or relative API download URL with query params
 */
export function generateSignedFileUrl(filePath, expiresInSeconds = 300) {
  const cleanPath = normalizeFilePath(filePath);
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${cleanPath}:${expires}`;
  const sig = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('hex');

  return `/api/v1/files/download?path=${encodeURIComponent(cleanPath)}&expires=${expires}&sig=${sig}`;
}

/**
 * Validates the HMAC-SHA256 signature, expiry timestamp, and directory containment.
 * @param {string} rawPath
 * @param {string|number} expires
 * @param {string} signature
 * @returns {{ valid: boolean, status: number, message?: string, resolvedPath?: string }}
 */
export function verifySignedFileUrl(rawPath, expires, signature) {
  if (!rawPath || !expires || !signature) {
    return { valid: false, status: 400, message: 'Missing required file path, expiry timestamp, or signature' };
  }

  const cleanPath = normalizeFilePath(rawPath);
  const now = Math.floor(Date.now() / 1000);
  const expNum = Number(expires);

  if (isNaN(expNum) || expNum < now) {
    return { valid: false, status: 403, message: 'Signed file download link has expired' };
  }

  // Compute expected HMAC-SHA256
  const payload = `${cleanPath}:${expNum}`;
  const expectedSig = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('hex');

  // Constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedSig, 'hex');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, status: 403, message: 'Invalid or forged file download signature' };
  }

  // Prevent path traversal outside UPLOADS_ROOT
  const resolvedPath = path.resolve(process.cwd(), cleanPath);
  if (!resolvedPath.startsWith(UPLOADS_ROOT)) {
    return { valid: false, status: 403, message: 'Access denied: Path traversal detected' };
  }

  if (!fs.existsSync(resolvedPath)) {
    return { valid: false, status: 404, message: 'Requested file does not exist' };
  }

  return { valid: true, status: 200, resolvedPath };
}
