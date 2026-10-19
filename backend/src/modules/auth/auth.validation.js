/**
 * @file auth.validation.js
 * @description Zod Validation Schemas for Module M1 Authentication.
 * 
 * SPECIFICATION:
 * - Module: M1 Authentication (BUILD-GUIDE Section 4 · Row 1.2)
 * - Layer: Validation (Input sanitization and format constraints)
 * - Rationale:
 *   Validates client input before any controller logic executes, ensuring
 *   malformed requests fail early with descriptive field-level feedback.
 */

import { z } from 'zod';

/**
 * Validation schema for POST /api/v1/auth/login
 */
export const loginSchema = z.object({
  body: z.object({
    // Email: mandatory, auto-trimmed, validated against RFC email standard
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address'),

    // Password: mandatory, must not be an empty string
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),

    // Remember Me: optional boolean flag to bypass repeated 2FA on trusted logins
    rememberMe: z.boolean().optional()
  })
});

/**
 * Validation schema for POST /api/v1/auth/forgot-password (Slice 1.7)
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    // Registered email to dispatch OTP challenge to
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
  })
});

/**
 * Validation schema for POST /api/v1/auth/reset-password (Slice 1.8)
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    // Registered email identity
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address'),

    // 6-digit numeric OTP code received via email
    otp: z
      .string({ required_error: 'Verification OTP code is required' })
      .trim()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Verification code must contain digits only'),

    // Candidate new password meeting minimum 8 characters constraint
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long')
  })
});

/**
 * Validation schema for PATCH /api/v1/auth/change-password (Slice 1.9)
 */
export const changePasswordSchema = z.object({
  body: z.object({
    // Existing plaintext password to verify identity
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password cannot be empty'),

    // Candidate new password meeting minimum 8 characters constraint
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long')
  })
});

/**
 * Validation schema for PATCH /api/v1/users/:id/status (Slice 1.13)
 */
export const updateUserStatusSchema = z.object({
  body: z.object({
    // Status flag: true for active, false for deactivated
    isActive: z.boolean({ required_error: 'isActive status flag is required' }),

    // Optional audit note for deactivation reason
    reason: z.string().trim().optional()
  })
});

/**
 * Validation schema for POST /api/v1/auth/verify-otp (Slice 1.10 login 2FA)
 */
export const verifyOtpSchema = z.object({
  body: z.object({
    // Temporary challenge token issued during initial login
    tempToken: z
      .string({ required_error: 'Temporary challenge token is required' })
      .min(1, 'Token cannot be empty'),

    // 6-digit numeric OTP code delivered to email
    otp: z
      .string({ required_error: 'Verification OTP code is required' })
      .trim()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Verification code must contain digits only')
  })
});

/**
 * Validation schema for POST /api/v1/auth/2fa/verify-enable (Slice 1.10 2FA setup verification)
 */
export const verify2faSetupSchema = z.object({
  body: z.object({
    otp: z
      .string({ required_error: 'Verification OTP code is required' })
      .trim()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Verification code must contain digits only')
  })
});

/**
 * Validation schema for POST /api/v1/auth/2fa/disable (Slice 1.10 2FA disable)
 */
export const disable2faSchema = z.object({
  body: z.object({
    password: z
      .string({ required_error: 'Current password is required to disable 2FA' })
      .min(1, 'Password cannot be empty')
  })
});

