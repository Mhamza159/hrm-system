/**
 * @file crypto.js
 * @description AES-256-GCM Authenticated Encryption & Decryption Utility.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.1)
 * - Standard: Authenticated AES-256-GCM cipher with 16-byte random IV and 16-byte Auth Tag.
 * - Format: ivHex:authTagHex:encryptedHex
 * - Protects: CNIC and Bank Account/IBAN at rest in MongoDB.
 */

import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Encrypt sensitive string value with AES-256-GCM
 * @param {string} text - Raw plaintext value
 * @returns {string} ivHex:authTagHex:encryptedHex
 */
export const encrypt = (text) => {
  if (text === null || text === undefined || text === '') {
    return text;
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt AES-256-GCM ciphertext
 * @param {string} cipherText - Formatted as ivHex:authTagHex:encryptedHex
 * @returns {string} Plaintext string
 */
export const decrypt = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.includes(':')) {
    return cipherText;
  }
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    return cipherText;
  }
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
