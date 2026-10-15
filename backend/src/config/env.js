/**
 * @file env.js
 * @description Centralized Environment Configuration Loader.
 * 
 * SPECIFICATION:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.3)
 * - Dotenv: Reads variables from backend/.env
 * - Fallbacks: Provides safe defaults for development.
 */

import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI:
    process.env.MONGO_URI ||
    'mongodb+srv://mhamzaofficial159_db_user:Cpc5Q5IS3RWA4o23@clusterhrm.pkwysxb.mongodb.net/hrm_development?retryWrites=true&w=majority',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ||
    'dev_access_secret_hrm_system_2026_super_secure_key_12345',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    'dev_refresh_secret_hrm_system_2026_super_secure_key_67890',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'no-reply@hrm-company.pk'
};
