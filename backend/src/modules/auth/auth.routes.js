/**
 * @file auth.routes.js
 * @description Express Router configuration for Module M1 Authentication endpoints.
 * 
 * PIPELINE ORDER (Tech-Spec Section 3):
 * route -> validate (Zod) -> checkPermission (CASL) -> controller -> service -> model
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyOtpSchema,
  verify2faSetupSchema,
  disable2faSchema
} from './auth.validation.js';

const router = Router();

// Rate limiter: Max 50 login attempts per 15 minutes per IP (Brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 50,
  message: {
    success: false,
    statusCode: 429,
    data: null,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    meta: null
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter: Max 10 password recovery requests per 15 minutes per IP (Slice 1.7)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    statusCode: 429,
    data: null,
    message: 'Too many password reset requests from this IP. Please try again after 15 minutes.',
    meta: null
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticates user, sets httpOnly refreshToken cookie, and returns accessToken
 * @access  Public
 */
router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rotates refresh token cookie and returns a new 15m access token
 * @access  Public (Requires valid httpOnly refreshToken cookie)
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Invalidates refreshToken in database and clears httpOnly cookie
 * @access  Protected (Requires valid Bearer access token)
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Fetches authenticated user profile, roles, and effective permissions
 * @access  Protected (Requires valid Bearer access token)
 */
router.get('/me', authenticate, AuthController.getMe);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Requests 6-digit OTP code to email for password recovery (Slice 1.7)
 * @access  Public (Rate-limited to 10 requests / 15m)
 */
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Resets password using unexpired 6-digit email OTP (Slice 1.8)
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    Self-service password change for authenticated users (Slice 1.9)
 * @access  Protected (Requires valid Bearer access token)
 */
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verifies 6-digit email OTP during 2FA login challenge (Slice 1.10)
 * @access  Public
 */
router.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  AuthController.verifyLogin2FA
);

/**
 * @route   POST /api/v1/auth/2fa/enable
 * @desc    Initiate 2FA setup by sending OTP to user's registered email (Slice 1.10)
 * @access  Protected
 */
router.post(
  '/2fa/enable',
  authenticate,
  AuthController.enable2FA
);

/**
 * @route   POST /api/v1/auth/2fa/verify-enable
 * @desc    Confirm and activate 2FA with 6-digit OTP (Slice 1.10)
 * @access  Protected
 */
router.post(
  '/2fa/verify-enable',
  authenticate,
  validate(verify2faSetupSchema),
  AuthController.verifyEnable2FA
);

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable 2FA with password confirmation (Slice 1.10)
 * @access  Protected
 */
router.post(
  '/2fa/disable',
  authenticate,
  validate(disable2faSchema),
  AuthController.disable2FA
);

/**
 * @route   GET /api/v1/auth/login-history
 * @desc    Fetch authenticated user or company-wide login history audit trail (Slice 1.12)
 * @access  Protected
 */
router.get(
  '/login-history',
  authenticate,
  checkPermission('login.history'),
  AuthController.getLoginHistory
);

export default router;

