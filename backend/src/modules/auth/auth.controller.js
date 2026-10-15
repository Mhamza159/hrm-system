/**
 * @file auth.controller.js
 * @description HTTP Controller layer managing authentication endpoints, cookies, and responses.
 * 
 * ARCHITECTURE & RESPONSE CONTRACT:
 * - Module: M1 Authentication & Access Control (Slice 1.2)
 * - Layer: Controller (Extracts HTTP inputs, delegates to AuthService, formats HTTP response)
 * - Cookie Specification:
 *   - Name: refreshToken
 *   - Lifetime: 7 days (7 * 24 * 60 * 60 * 1000 ms)
 *   - Security: httpOnly: true (inaccessible to browser JS, stops XSS), sameSite: 'strict', secure: true in production
 * - Response Shape: { success: boolean, statusCode: number, data: Object, message: string, meta: null }
 */

import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';

export class AuthController {
  /**
   * Handle user login authentication
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req, res) => {
    // 1. Extract validated credentials from request body
    const { email, password } = req.body;

    // 2. Extract client IP address (supporting reverse proxy forwarding)
    const ipAddress = req.ip || req.socket?.remoteAddress;

    // 3. Extract client device user agent string for audit tracking
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 4. Delegate business verification, password matching, and lockout to AuthService
    const result = await AuthService.login({
      email,
      password,
      ipAddress,
      userAgent
    });

    // 5. Check if Two-Factor Authentication (2FA) is required (Slice 1.10)
    // If enabled, halt login flow here and issue temporary 5m challenge token
    if (result.twoFactorRequired) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            twoFactorRequired: true,
            tempToken: result.tempToken,
            user: result.user
          },
          '2FA verification required'
        )
      );
    }

    // 6. Set secure, rotating Refresh Token in an HTTP-only cookie
    // - httpOnly: Prevents malicious client-side scripts from reading the cookie
    // - secure: Enforces HTTPS transmission in production
    // - sameSite: 'strict' blocks Cross-Site Request Forgery (CSRF)
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // 7. Send standard 200 OK response with user profile and short-lived in-memory accessToken
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: result.user,
          accessToken: result.accessToken
        },
        'Logged in successfully'
      )
    );
  });

  /**
   * Transparent session refresh endpoint (Slice 1.4)
   * POST /api/v1/auth/refresh
   */
  static refreshToken = asyncHandler(async (req, res) => {
    // 1. Extract refreshToken from httpOnly cookie
    const cookieToken = req.cookies?.refreshToken;

    // 2. Delegate token verification and rotation to AuthService
    const result = await AuthService.refreshToken(cookieToken);

    // 3. Set newly rotated HTTP-only cookie
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // 4. Send new accessToken in standard JSON envelope
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: result.user,
          accessToken: result.accessToken
        },
        'Session token refreshed successfully'
      )
    );
  });

  /**
   * Secure user logout and session invalidation endpoint (Slice 1.5)
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (req, res) => {
    // 1. Invalidate active refresh token in database for the authenticated user
    if (req.userId) {
      await AuthService.logout(req.userId);
    }

    // 2. Clear refreshToken httpOnly cookie using expired header instructions
    const isProduction = env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/'
    });

    // 3. Return standard 200 OK response with null data envelope
    return res.status(200).json(
      new ApiResponse(200, null, 'Logged out successfully')
    );
  });

  /**
   * Current user profile & permission hydration endpoint (Slice 1.6)
   * GET /api/v1/auth/me
   */
  static getMe = asyncHandler(async (req, res) => {
    // 1. Fetch sanitized user profile and effective permissions from service
    const result = await AuthService.getMe(req.userId);

    // 2. Return standard 200 OK envelope with user profile data
    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        'User profile retrieved successfully'
      )
    );
  });

  /**
   * Request email OTP verification code for password recovery (Slice 1.7)
   * POST /api/v1/auth/forgot-password
   */
  static forgotPassword = asyncHandler(async (req, res) => {
    // 1. Dispatch password reset OTP request through service
    const result = await AuthService.forgotPassword(req.body.email);

    // 2. Return standardized 200 OK response with generic message
    return res.status(200).json(
      new ApiResponse(200, null, result.message)
    );
  });

  /**
   * Reset account password with unexpired email OTP (Slice 1.8)
   * POST /api/v1/auth/reset-password
   */
  static resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    // 1. Verify OTP code and commit password change
    const result = await AuthService.resetPassword({ email, otp, newPassword });

    // 2. Return standard 200 OK envelope
    return res.status(200).json(
      new ApiResponse(200, null, result.message)
    );
  });

  /**
   * Self-service password change for logged-in users (Slice 1.9)
   * PATCH /api/v1/auth/change-password
   */
  static changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Execute password change verification and audit logging
    const result = await AuthService.changePassword({
      userId: req.userId,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    });

    // 2. Return standard 200 OK envelope
    return res.status(200).json(
      new ApiResponse(200, null, result.message)
    );
  });

  /**
   * Administrative user account activation / deactivation (Slice 1.13)
   * PATCH /api/v1/users/:id/status
   */
  static setUserStatus = asyncHandler(async (req, res) => {
    const { id: targetUserId } = req.params;
    const { isActive, reason } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Execute status toggle and session eviction
    const result = await AuthService.setUserStatus({
      targetUserId,
      isActive,
      adminUser: req.user,
      reason,
      ipAddress,
      userAgent
    });

    // 2. Return standard 200 OK envelope with updated user summary
    return res.status(200).json(
      new ApiResponse(200, result.user, result.message)
    );
  });

  /**
   * Complete 2FA login verification challenge (Slice 1.10)
   * POST /api/v1/auth/verify-otp
   */
  static verifyLogin2FA = asyncHandler(async (req, res) => {
    const { tempToken, otp } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Verify 2FA challenge and issue tokens
    const result = await AuthService.verifyLogin2FA({
      tempToken,
      otp,
      ipAddress,
      userAgent
    });

    // 2. Set secure HTTP-only refresh token cookie
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 3. Return access token and user profile
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: result.user,
          accessToken: result.accessToken
        },
        'Two-factor authentication verified successfully'
      )
    );
  });

  /**
   * Initiate Two-Factor Authentication Setup (Slice 1.10)
   * POST /api/v1/auth/2fa/enable
   */
  static enable2FA = asyncHandler(async (req, res) => {
    const result = await AuthService.enable2FA(req.userId);
    return res.status(200).json(
      new ApiResponse(200, null, result.message)
    );
  });

  /**
   * Verify and confirm Two-Factor Authentication Setup (Slice 1.10)
   * POST /api/v1/auth/2fa/verify-enable
   */
  static verifyEnable2FA = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const result = await AuthService.verifyEnable2FA(req.userId, otp);
    return res.status(200).json(
      new ApiResponse(200, { twoFactorEnabled: result.twoFactorEnabled }, result.message)
    );
  });

  /**
   * Disable Two-Factor Authentication (Slice 1.10)
   * POST /api/v1/auth/2fa/disable
   */
  static disable2FA = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const result = await AuthService.disable2FA(req.userId, password);
    return res.status(200).json(
      new ApiResponse(200, { twoFactorEnabled: result.twoFactorEnabled }, result.message)
    );
  });

  /**
   * Fetch paginated login history audit trail (Slice 1.12)
   * GET /api/v1/auth/login-history
   */
  static getLoginHistory = asyncHandler(async (req, res) => {
    const { page, limit, email } = req.query;
    const result = await AuthService.getLoginHistory({
      userId: req.userId,
      userRoles: req.user.roles,
      page,
      limit,
      filterEmail: email
    });

    return res.status(200).json(
      new ApiResponse(200, result, 'Login history retrieved successfully')
    );
  });

  /**
   * HR-initiated emergency password reset (Slice 1.14)
   * POST /api/v1/users/:id/reset-password
   */
  static adminResetPassword = asyncHandler(async (req, res) => {
    const { id: targetUserId } = req.params;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await AuthService.adminResetPassword({
      targetUserId,
      adminUser: req.user,
      ipAddress,
      userAgent
    });

    return res.status(200).json(
      new ApiResponse(200, { tempPassword: result.tempPassword }, result.message)
    );
  });
}




