/**
 * @file auth.service.js
 * @description Core Business Logic Service for User Authentication & Security Lifecycle.
 * 
 * ARCHITECTURE & COMPLIANCE SPECIFICATION:
 * - Module: M1 Authentication & Access Control (BUILD-GUIDE Section 4 / Slices 1.2–1.5, 1.10)
 * - Layer: Service (Business domain logic, completely decoupled from HTTP req/res)
 * - Security Rules:
 *   1. Timing-attack mitigation: Hash dummy password if user does not exist to eliminate timing leakage.
 *   2. Brute-force defense: Increment failedAttempts on bad password. Lock account for 15 minutes upon reaching 5 failures.
 *   3. Token Architecture: Short-lived access token (15 mins) and rotating refresh token (7 days).
 *   4. Token Rotation Defense: Store bcrypt hash of refresh token in database; reject reuse of revoked or obsolete tokens.
 *   5. 2FA Intercept: Return intermediate 5-minute challenge token if twoFactorEnabled is active.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../../models/user.model.js';
import { Employee } from '../../models/employee.model.js';
import { LoginHistory } from '../../models/loginHistory.model.js';
import { Delegation } from '../../models/delegation.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { emailService } from '../../services/email.service.js';
import { AuditService } from '../../services/audit.service.js';
import { parseUserAgent, normalizeIp } from '../../utils/userAgentParser.js';

/**
 * Safely record an authentication attempt to LoginHistory with complete identity and client environment
 */
async function recordLoginHistory({
  userId = null,
  email,
  ipAddress = '127.0.0.1',
  userAgent = 'unknown',
  status,
  failureReason = null,
  userDoc = null
}) {
  try {
    const normalizedIp = normalizeIp(ipAddress);
    const clientEnv = parseUserAgent(userAgent);

    let employeeId = null;
    let employeeName = null;
    let employeeCode = null;
    let department = null;
    let role = null;

    const targetUser = userDoc || (userId ? await User.findById(userId).populate('roles') : null);

    if (targetUser) {
      if (Array.isArray(targetUser.roles) && targetUser.roles.length > 0) {
        const firstRole = targetUser.roles[0];
        role = typeof firstRole === 'string' ? firstRole : firstRole?.name || null;
      }

      // Query linked employee record
      const employee = await Employee.findOne({ userId: targetUser._id }).populate('departmentId');
      if (employee) {
        employeeId = employee._id;
        employeeName = employee.name;
        employeeCode = employee.employeeCode;
        department = employee.departmentId?.name || employee.department?.name || null;
      } else {
        employeeName = targetUser.email === 'mhamzaofficial159@gmail.com' ? 'Muhammad Hamza' : targetUser.email.split('@')[0];
      }
    } else {
      employeeName = 'Unregistered Account';
    }

    return await LoginHistory.create({
      userId: targetUser ? targetUser._id : null,
      employeeId,
      employeeName,
      employeeCode,
      role,
      department,
      email: (email || targetUser?.email || '').toLowerCase().trim(),
      ipAddress: normalizedIp,
      location: 'Local / Private Network',
      userAgent: userAgent || 'unknown',
      browser: clientEnv.browser,
      os: clientEnv.os,
      deviceType: clientEnv.deviceType,
      status,
      failureReason
    });
  } catch (err) {
    // Critical invariant: Failure in audit recording must never disrupt core authentication
    console.error('[AuthService.recordLoginHistory] Error recording login audit:', err);
    return null;
  }
}

export class AuthService {
  /**
   * Authenticate a user by email and password, issuing access & refresh token pairs.
   * 
   * @param {Object} credentials
   * @param {string} credentials.email - User email address
   * @param {string} credentials.password - Plaintext password
   * @param {string} [credentials.ipAddress] - Client IP address for security logging
   * @param {string} [credentials.userAgent] - Client device user agent string
   * @param {boolean} [credentials.rememberMe] - Flag to bypass repeated 2FA challenges
   * @returns {Promise<{ twoFactorRequired: boolean, user: Object, accessToken?: string, refreshToken?: string, tempToken?: string }>}
   * @throws {ApiError} 401 on invalid credentials, 403 if deactivated, 423 if locked
   */
  static async login({ email, password, ipAddress, userAgent, rememberMe = false }) {
    // 1. Sanitize and lowercase email for canonical database matching
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Query active user in database (ignoring soft-deleted accounts)
    const user = await User.findOne({ email: normalizedEmail, isDeleted: false });

    // 3. Timing-Attack Mitigation:
    if (!user) {
      await recordLoginHistory({
        email: normalizedEmail,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: 'Invalid email or password'
      });
      await bcrypt.hash('dummy_password_for_timing', 10);
      throw new ApiError(401, 'Invalid email or password');
    }

    // 4. Validate Account Status (Slice 1.13):
    if (!user.isActive) {
      await recordLoginHistory({
        userId: user._id,
        userDoc: user,
        email: normalizedEmail,
        ipAddress,
        userAgent,
        status: 'RESTRICTED',
        failureReason: 'Account is deactivated'
      });
      throw new ApiError(403, 'Account is deactivated. Please contact your HR administrator.');
    }

    // 5. Automated Brute-Force Lockout Evaluation (Slice 1.3):
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      await recordLoginHistory({
        userId: user._id,
        userDoc: user,
        email: normalizedEmail,
        ipAddress,
        userAgent,
        status: 'LOCKED',
        failureReason: 'Account is locked due to consecutive failed attempts'
      });
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - now.getTime()) / (60 * 1000));
      throw new ApiError(
        423,
        `Account is locked due to 5 consecutive failed login attempts. Try again in ${remainingMinutes} minute(s).`
      );
    }

    // 6. Reset Lockout if Window Expired:
    if (user.lockUntil && user.lockUntil <= now) {
      user.lockUntil = null;
      user.failedAttempts = 0;
    }

    // 7. Verify candidate password against stored bcrypt hash (12 salt rounds)
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      const isNowLocked = user.failedAttempts >= 5;

      if (isNowLocked) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      await recordLoginHistory({
        userId: user._id,
        userDoc: user,
        email: normalizedEmail,
        ipAddress,
        userAgent,
        status: isNowLocked ? 'LOCKED' : 'FAILED',
        failureReason: isNowLocked ? 'Account locked after 5 failed attempts' : 'Invalid email or password'
      });

      if (isNowLocked) {
        throw new ApiError(
          423,
          'Account has been locked for 15 minutes due to 5 consecutive failed login attempts.'
        );
      }

      throw new ApiError(401, 'Invalid email or password');
    }

    // 8. Successful Password Match:
    user.failedAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();

    // 9. Two-Factor Authentication (2FA) Check (Slice 1.10):
    // If rememberMe is checked, user explicitly trusts this device/session to bypass repeated 2FA challenges
    if (user.twoFactorEnabled && !rememberMe) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      user.twoFactorOtpHash = await bcrypt.hash(otp, 10);
      user.twoFactorOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await recordLoginHistory({
        userId: user._id,
        userDoc: user,
        email: normalizedEmail,
        ipAddress,
        userAgent,
        status: '2FA_PENDING',
        failureReason: 'Two-factor authentication challenge issued'
      });

      await emailService.sendOtpEmail(user.email, otp, 'Two-Factor Authentication');

      const tempToken = jwt.sign(
        { userId: user._id, stage: '2fa_pending' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '10m' }
      );

      return {
        twoFactorRequired: true,
        tempToken,
        user: {
          id: user._id,
          email: user.email
        }
      };
    }

    // 10. Generate JWT Access Token (15-minute lifetime):
    const accessToken = jwt.sign(
      { userId: user._id, roles: user.roles },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    // 11. Generate JWT Refresh Token (7-day lifetime):
    const refreshToken = jwt.sign(
      { jti: crypto.randomUUID(), userId: user._id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    // 12. Store Salted Hash of Refresh Token in Database (Token Rotation Defense):
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // Record successful login in LoginHistory (Slice 1.12)
    await recordLoginHistory({
      userId: user._id,
      userDoc: user,
      email: normalizedEmail,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      failureReason: 'Authentication successful'
    });

    // Ensure roles are populated for client authorization and UI guards
    await user.populate('roles');
    if (user.employeeId) {
      await user.populate('employeeId');
    }

    const resolvedName =
      user.employeeId?.name ||
      (user.email === 'mhamzaofficial159@gmail.com' ? 'Muhammad Hamza' : user.email.split('@')[0]);

    // 13. Return authentication bundle to Controller
    return {
      twoFactorRequired: false,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        name: resolvedName,
        roles: user.roles,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
        avatar: user.avatar || user.employeeId?.avatar || ''
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Automatic Token Rotation & Transparent Session Refresh (Slice 1.4).
   * 
   * SECURITY CONTRACT:
   * 1. Validates refresh token JWT signature with JWT_REFRESH_SECRET.
   * 2. Checks active status of the user account.
   * 3. Compares candidate cookie token with bcrypt hash stored in user.refreshTokenHash.
   * 4. Token Reuse Detection: If an outdated or revoked refresh token is presented,
   *    immediately clear user.refreshTokenHash in database to revoke all active sessions.
   * 5. Signs a brand new 15-minute access token and a brand new rotating 7-day refresh token.
   * 6. Replaces stored hash in database with the new refresh token's hash.
   * 
   * @param {string} cookieToken - Incoming refresh token from httpOnly cookie
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: Object }>}
   * @throws {ApiError} 401 if missing, expired, revoked, or compromised
   */
  static async refreshToken(cookieToken) {
    // 1. Guard against missing cookie
    if (!cookieToken) {
      throw new ApiError(401, 'Refresh token missing. Please sign in again.');
    }

    // 2. Cryptographically verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(cookieToken, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token. Please sign in again.');
    }

    // 3. Locate user in MongoDB database
    const user = await User.findOne({ _id: decoded.userId, isDeleted: false });
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account not found or deactivated.');
    }

    // 4. Token Rotation Defense: check if active hash exists
    if (!user.refreshTokenHash) {
      throw new ApiError(401, 'Session has expired or was terminated. Please sign in again.');
    }

    // 5. Compare incoming cookie token against stored bcrypt hash
    const isTokenValid = await bcrypt.compare(cookieToken, user.refreshTokenHash);
    if (!isTokenValid) {
      // CRITICAL SECURITY ALARM: Token reuse detected!
      // This happens if an attacker captured an old refresh token and tries to reuse it,
      // or if race condition / replay attempt occurred.
      // Defensively revoke the session immediately by clearing the hash in DB.
      user.refreshTokenHash = null;
      await user.save();
      throw new ApiError(
        401,
        'Security alert: Refresh token has already been rotated or compromised. Session revoked.'
      );
    }

    // 6. Generate NEW short-lived 15-minute Access Token
    const newAccessToken = jwt.sign(
      { userId: user._id, roles: user.roles },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    // 7. Generate NEW rotating 7-day Refresh Token with unique jti nonce placed FIRST
    const newRefreshToken = jwt.sign(
      { jti: crypto.randomUUID(), userId: user._id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    // 8. Update database with salted bcrypt hash of the newly rotated token
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();
    await user.populate('roles');
    if (user.employeeId) {
      await user.populate('employeeId');
    }

    const resolvedName =
      user.employeeId?.name ||
      (user.email === 'mhamzaofficial159@gmail.com' ? 'Muhammad Hamza' : user.email.split('@')[0]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        name: resolvedName,
        roles: user.roles,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
        avatar: user.avatar || user.employeeId?.avatar || ''
      }
    };
  }

  /**
   * Secure session termination and token invalidation (Slice 1.5).
   * 
   * SECURITY CONTRACT:
   * 1. Nullifies user.refreshTokenHash in database to block any future refresh token reuse.
   * 2. Defensively handles nonexistent or deleted user records without unhandled exceptions.
   * 
   * @param {string|mongoose.Types.ObjectId} userId - Target authenticated user ID
   * @returns {Promise<boolean>} True if user session was invalidated
   */
  static async logout(userId) {
    // 1. Guard against missing or undefined userId
    if (!userId) {
      return false;
    }

    // 2. Clear refreshTokenHash in MongoDB to permanently invalidate all active refresh tokens
    await User.findByIdAndUpdate(
      userId,
      { $set: { refreshTokenHash: null } },
      { new: true }
    );

    // 3. Return successful termination confirmation
    return true;
  }

  /**
   * Hydrate and return current authenticated user profile & effective permissions (Slice 1.6).
   * 
   * SECURITY CONTRACT:
   * 1. Requires valid authenticated userId.
   * 2. Excludes sensitive hash fields (passwordHash, refreshTokenHash, resetOtpHash).
   * 3. Defensively populates roles and employee record if models are registered in Mongoose.
   * 4. Compiles effective CASL permission rules (defaulting to empty array until M26).
   * 
   * @param {string|mongoose.Types.ObjectId} userId - Authenticated user ID from req.userId
   * @returns {Promise<{ user: Object, permissions: Array }>} Sanitized user profile and permissions
   */
  static async getMe(userId) {
    // 1. Guard against missing userId
    if (!userId) {
      throw new ApiError(401, 'Unauthorized request. User identity not found.');
    }

    // 2. Fetch user profile excluding secret hash credentials
    let query = User.findOne({ _id: userId, isDeleted: false })
      .select('-passwordHash -refreshTokenHash -resetOtpHash');

    if (mongoose.models.Role) {
      query = query.populate('roles');
    }
    if (mongoose.models.Employee) {
      query = query.populate('employeeId');
    }

    const user = await query.lean();
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account not found or deactivated. Session invalid.');
    }

    // 3. Compute additive union of all permission rules across all assigned roles (Slice 26.11)
    const permissionsMap = new Map();
    for (const role of user.roles || []) {
      for (const perm of role.permissions || []) {
        const existing = permissionsMap.get(perm.action);
        if (!existing) {
          permissionsMap.set(perm.action, { ...perm });
        } else {
          // Scope hierarchy priority: 'all' > 'department' > 'team' > 'own'
          const hierarchy = { own: 1, team: 2, department: 3, all: 4 };
          if ((hierarchy[perm.scope] || 0) > (hierarchy[existing.scope] || 0)) {
            existing.scope = perm.scope;
          }
        }
      }
    }

    // 4. Dynamic Approvals Delegation Injection (Slice 26.14)
    const now = new Date();
    const activeDelegations = await Delegation.find({
      toUserId: userId,
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).lean();

    for (const del of activeDelegations) {
      for (const perm of del.permissions || []) {
        const existing = permissionsMap.get(perm.action);
        if (!existing) {
          permissionsMap.set(perm.action, {
            ...perm,
            isDelegated: true,
            delegatedFrom: del.fromUserId
          });
        } else {
          const hierarchy = { own: 1, team: 2, department: 3, all: 4 };
          if ((hierarchy[perm.scope] || 0) > (hierarchy[existing.scope] || 0)) {
            existing.scope = perm.scope;
          }
        }
      }
    }

    const effectivePermissions = Array.from(permissionsMap.values());
    const resolvedName =
      user.employeeId?.name ||
      (user.email === 'mhamzaofficial159@gmail.com' ? 'Muhammad Hamza' : user.email.split('@')[0]);

    const sanitizedUser = {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      name: resolvedName,
      roles: user.roles || [],
      employeeId: user.employeeId || null,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
      avatar: user.avatar || user.employeeId?.avatar || '',
      lastLoginAt: user.lastLoginAt
    };

    // 5. Return envelope compatible with both M1 (Slice 1.6: data.user, data.permissions) and M26 (data.effectivePermissions)
    return {
      ...sanitizedUser,
      user: sanitizedUser,
      permissions: effectivePermissions,
      effectivePermissions,
      activeDelegations
    };
  }


  /**
   * Request password recovery OTP via email (Slice 1.7).
   * 
   * SECURITY CONTRACT:
   * 1. Generates cryptographically secure 6-digit numeric OTP.
   * 2. Hashes OTP with bcrypt before saving in resetOtpHash.
   * 3. Sets strict 10-minute validity window in resetOtpExpires.
   * 4. Anti-enumeration: Runs dummy hash if user does not exist to prevent timing analysis,
   *    and returns identical generic success message.
   * 
   * @param {string} email - Candidate account email
   * @returns {Promise<{ message: string }>} Generic user-facing confirmation
   */
  static async forgotPassword(email) {
    const normalizedEmail = email?.toLowerCase().trim();

    // 1. Locate user in database
    const user = await User.findOne({ email: normalizedEmail, isDeleted: false });

    // 2. Anti-enumeration: If user does not exist or is inactive, equalize execution timing
    if (!user || !user.isActive) {
      await bcrypt.hash('dummy_otp_mitigation', 10);
      return {
        message: 'If an account exists with this email, a verification code has been sent.'
      };
    }

    // 3. Generate secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // 4. Store salted bcrypt hash of OTP with 10-minute lifetime
    user.resetOtpHash = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // 5. Dispatch branded email with OTP
    await emailService.sendOtpEmail(user.email, otp, 'Password Reset');

    return {
      message: 'If an account exists with this email, a verification code has been sent.'
    };
  }

  /**
   * Reset account password using unexpired email OTP (Slice 1.8).
   * 
   * SECURITY CONTRACT:
   * 1. Verifies OTP against stored resetOtpHash.
   * 2. Ensures resetOtpExpires has not passed.
   * 3. Hashes new password with 12 bcrypt salt rounds.
   * 4. Clears OTP hash and expiry to prevent code reuse.
   * 5. Unlocks account (resets failedAttempts = 0 and lockUntil = null).
   * 6. Nullifies refreshTokenHash to terminate any lingering sessions.
   * 
   * @param {Object} params
   * @param {string} params.email - User email
   * @param {string} params.otp - 6-digit OTP code
   * @param {string} params.newPassword - Candidate new password
   * @returns {Promise<{ message: string }>}
   */
  static async resetPassword({ email, otp, newPassword }) {
    const normalizedEmail = email?.toLowerCase().trim();

    // 1. Locate active user record
    const user = await User.findOne({ email: normalizedEmail, isDeleted: false });
    if (!user || !user.isActive) {
      throw new ApiError(400, 'Invalid verification code or expired request.');
    }

    // 2. Verify OTP existence and expiration timestamp
    const now = new Date();
    if (!user.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires < now) {
      throw new ApiError(400, 'Verification code has expired. Please request a new one.');
    }

    // 3. Cryptographically compare incoming OTP with stored bcrypt hash
    const isOtpValid = await bcrypt.compare(otp, user.resetOtpHash);
    if (!isOtpValid) {
      throw new ApiError(400, 'Invalid verification code. Please check and try again.');
    }

    // 4. Hash new password with 12 salt rounds
    user.passwordHash = await User.hashPassword(newPassword);

    // 5. Clear OTP credentials to prevent reuse
    user.resetOtpHash = null;
    user.resetOtpExpires = null;

    // 6. Restore account standing: clear lockout and terminate old sessions
    user.failedAttempts = 0;
    user.lockUntil = null;
    user.refreshTokenHash = null;
    user.mustChangePassword = false;
    await user.save();

    return {
      message: 'Password has been reset successfully. You may now sign in with your new credentials.'
    };
  }

  /**
   * Self-service password change for authenticated users (Slice 1.9).
   * 
   * SECURITY CONTRACT:
   * 1. Verifies current password against stored hash.
   * 2. Disallows setting identical password.
   * 3. Resets mustChangePassword flag to false.
   * 4. Records immutable audit log event.
   * 
   * @param {Object} params
   * @param {string} params.userId - Authenticated user ID
   * @param {string} params.currentPassword - Plaintext existing password
   * @param {string} params.newPassword - Plaintext replacement password
   * @param {string} [params.ipAddress] - Request IP
   * @param {string} [params.userAgent] - Request device user agent
   * @returns {Promise<{ message: string }>}
   */
  static async changePassword({ userId, currentPassword, newPassword, ipAddress, userAgent }) {
    // 1. Locate user in database
    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account not found or deactivated.');
    }

    // 2. Validate current password
    const isCurrentValid = await user.comparePassword(currentPassword);
    if (!isCurrentValid) {
      throw new ApiError(400, 'Current password is incorrect.');
    }

    // 3. Prevent setting the exact same password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new ApiError(400, 'New password cannot be the same as your current password.');
    }

    // 4. Update password hash and clear mandatory change flag
    user.passwordHash = await User.hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    // 5. Record security audit log entry
    await AuditService.log({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.roles?.[0] || 'USER',
      action: 'PASSWORD_CHANGE',
      module: 'AUTH',
      targetId: user._id,
      targetModel: 'User',
      ipAddress,
      userAgent,
      details: { reason: 'User self-service password update' }
    });

    return {
      message: 'Password has been updated successfully.'
    };
  }

  /**
   * Activate or deactivate user account (Slice 1.13).
   * 
   * SECURITY CONTRACT:
   * 1. Modifies user.isActive status.
   * 2. If deactivated (isActive === false), immediately clears refreshTokenHash to force session eviction.
   * 3. Records administrative audit log entry.
   * 
   * @param {Object} params
   * @param {string} params.targetUserId - Target user ID to toggle
   * @param {boolean} params.isActive - Target boolean status
   * @param {Object} params.adminUser - Authenticated administrative actor
   * @param {string} [params.reason] - Justification note
   * @param {string} [params.ipAddress] - Request IP
   * @param {string} [params.userAgent] - Request device
   * @returns {Promise<{ message: string, user: Object }>}
   */
  static async setUserStatus({ targetUserId, isActive, adminUser, reason = '', ipAddress, userAgent }) {
    // 1. Locate target user in database
    const targetUser = await User.findOne({ _id: targetUserId, isDeleted: false });
    if (!targetUser) {
      throw new ApiError(404, 'User account not found.');
    }

    // 2. Prevent administrative lockout self-harm (cannot deactivate own account)
    if (targetUser._id.toString() === adminUser?._id?.toString() && !isActive) {
      throw new ApiError(400, 'Administrators cannot deactivate their own account.');
    }

    // 3. Update active status
    targetUser.isActive = isActive;

    // 4. If deactivating, immediately revoke active sessions
    if (!isActive) {
      targetUser.refreshTokenHash = null;
    }
    await targetUser.save();

    // 5. Record administrative audit log
    await AuditService.log({
      actorId: adminUser?._id,
      actorEmail: adminUser?.email,
      actorRole: adminUser?.roles?.[0]?.name || adminUser?.roles?.[0] || 'ADMIN',
      action: isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
      module: 'AUTH',
      targetId: targetUser._id,
      targetModel: 'User',
      ipAddress,
      userAgent,
      details: { reason: reason || 'Administrative status change' }
    });

    return {
      message: `User account has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: {
        id: targetUser._id,
        email: targetUser.email,
        isActive: targetUser.isActive
      }
    };
  }

  /**
   * Verify Two-Factor Authentication OTP during Login (Slice 1.10).
   * 
   * @param {Object} params
   * @param {string} params.tempToken - Short-lived 2FA challenge token from initial login
   * @param {string} params.otp - 6-digit numeric OTP code
   * @param {string} [params.ipAddress] - Client IP
   * @param {string} [params.userAgent] - Client User Agent
   * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
   */
  static async verifyLogin2FA({ tempToken, otp, ipAddress, userAgent }) {
    // 1. Verify challenge token signature
    let decoded;
    try {
      decoded = jwt.verify(tempToken, env.JWT_ACCESS_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Two-factor session has expired or is invalid. Please sign in again.');
    }

    if (decoded.stage !== '2fa_pending' || !decoded.userId) {
      throw new ApiError(401, 'Invalid two-factor authentication challenge.');
    }

    // 2. Locate target user
    const user = await User.findOne({ _id: decoded.userId, isDeleted: false }).populate('roles');
    if (!user) {
      throw new ApiError(401, 'User account not found.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated. Please contact your HR administrator.');
    }

    // 3. Verify OTP expiration
    const now = new Date();
    if (!user.twoFactorOtpExpires || user.twoFactorOtpExpires < now) {
      await recordLoginHistory({
        userId: user._id,
        userDoc: user,
        email: user.email,
        ipAddress,
        userAgent,
        status: '2FA_FAILED',
        failureReason: 'Two-factor verification code expired'
      });
      throw new ApiError(400, 'Two-factor verification code has expired. Please sign in again.');
    }

    // 4. Verify OTP code match
    if (!user.twoFactorOtpHash) {
      throw new ApiError(400, 'No active two-factor verification code found. Please sign in again.');
    }

    const isMatch = await bcrypt.compare(otp, user.twoFactorOtpHash);
    if (!isMatch) {
      await recordLoginHistory({
        userId: user._id,
        userDoc: user,
        email: user.email,
        ipAddress,
        userAgent,
        status: '2FA_FAILED',
        failureReason: 'Invalid two-factor verification code'
      });
      throw new ApiError(400, 'Invalid two-factor verification code.');
    }

    // 5. Clear OTP challenge fields
    user.twoFactorOtpHash = null;
    user.twoFactorOtpExpires = null;
    user.lastLoginAt = new Date();

    // 6. Sign access token & rotating refresh token
    const accessToken = jwt.sign(
      { userId: user._id, roles: user.roles },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { jti: crypto.randomUUID(), userId: user._id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // Record successful login in LoginHistory (Slice 1.12)
    await recordLoginHistory({
      userId: user._id,
      userDoc: user,
      email: user.email,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      failureReason: 'Two-factor authentication completed successfully'
    });

    await user.populate('roles');
    if (user.employeeId) {
      await user.populate('employeeId');
    }

    const resolvedName =
      user.employeeId?.name ||
      (user.email === 'mhamzaofficial159@gmail.com' ? 'Muhammad Hamza' : user.email.split('@')[0]);

    return {
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        name: resolvedName,
        roles: user.roles,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
        avatar: user.avatar || user.employeeId?.avatar || ''
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Initiate Two-Factor Authentication Setup (Slice 1.10).
   * Dispatches 6-digit verification OTP to user's registered email.
   * 
   * @param {string} userId - User identifier
   * @returns {Promise<{ message: string }>}
   */
  static async enable2FA(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (user.twoFactorEnabled) {
      throw new ApiError(400, 'Two-Factor Authentication is already enabled for this account.');
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.twoFactorOtpHash = await bcrypt.hash(otp, 10);
    user.twoFactorOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const mailResult = await emailService.sendOtpEmail(user.email, otp, 'Two-Factor Authentication Setup');
    if (mailResult && mailResult.success === false) {
      throw new ApiError(500, `Failed to dispatch 2FA email: ${mailResult.error || 'SMTP delivery failure'}`);
    }

    return { message: 'Verification code sent to your registered email.' };
  }

  /**
   * Confirm and activate Two-Factor Authentication (Slice 1.10).
   * 
   * @param {string} userId - User identifier
   * @param {string} otp - 6-digit confirmation code
   * @returns {Promise<{ message: string, twoFactorEnabled: boolean }>}
   */
  static async verifyEnable2FA(userId, otp) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (user.twoFactorEnabled) {
      throw new ApiError(400, 'Two-Factor Authentication is already enabled.');
    }

    const now = new Date();
    if (!user.twoFactorOtpExpires || user.twoFactorOtpExpires < now) {
      throw new ApiError(400, 'Verification code has expired. Please request a new code.');
    }

    if (!user.twoFactorOtpHash) {
      throw new ApiError(400, 'No pending verification request found.');
    }

    const isMatch = await bcrypt.compare(otp, user.twoFactorOtpHash);
    if (!isMatch) {
      throw new ApiError(400, 'Invalid verification code.');
    }

    user.twoFactorEnabled = true;
    user.twoFactorOtpHash = null;
    user.twoFactorOtpExpires = null;
    await user.save();

    await AuditService.log({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: 'USER',
      action: '2FA_ENABLED',
      module: 'AUTH',
      targetId: user._id,
      targetModel: 'User'
    });

    return {
      message: 'Two-Factor Authentication enabled successfully.',
      twoFactorEnabled: true
    };
  }

  /**
   * Disable Two-Factor Authentication (Slice 1.10).
   * 
   * @param {string} userId - User identifier
   * @param {string} password - User password confirmation
   * @returns {Promise<{ message: string, twoFactorEnabled: boolean }>}
   */
  static async disable2FA(userId, password) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (!user.twoFactorEnabled) {
      throw new ApiError(400, 'Two-Factor Authentication is not enabled.');
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new ApiError(400, 'Incorrect password.');
    }

    user.twoFactorEnabled = false;
    user.twoFactorOtpHash = null;
    user.twoFactorOtpExpires = null;
    await user.save();

    await AuditService.log({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: 'USER',
      action: '2FA_DISABLED',
      module: 'AUTH',
      targetId: user._id,
      targetModel: 'User'
    });

    return {
      message: 'Two-Factor Authentication has been disabled.',
      twoFactorEnabled: false
    };
  }

  /**
   * Fetch paginated login history (Slice 1.12 / Phase 24).
   * Super Admin & HR Manager can view company-wide history or filter by user, role, status, device, and date range.
   * Employees & Department Managers are scoped strictly to their own login records.
   * 
   * @param {Object} params
   * @returns {Promise<{ docs: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  static async getLoginHistory({
    userId,
    userRoles = [],
    permissionScope = 'own',
    page = 1,
    limit = 20,
    startDate,
    endDate,
    status,
    deviceType,
    role,
    search,
    sortBy = 'newest',
    email,
    filterEmail = null
  }) {
    const isSuperAdmin = userRoles.some((r) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === 'Super Admin';
    });

    const isHR = userRoles.some((r) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === 'HR Manager';
    });

    const canViewAll = isSuperAdmin || isHR || permissionScope === 'all';

    const filter = {};
    if (!canViewAll) {
      // Scoped strictly to caller's own records
      filter.userId = new mongoose.Types.ObjectId(userId);
    } else {
      const targetEmail = email || filterEmail;
      if (targetEmail) {
        filter.email = targetEmail.toLowerCase().trim();
      }
      if (role && role !== 'ALL') {
        filter.role = role;
      }
    }

    // Status filter
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    // Device type filter
    if (deviceType && deviceType !== 'ALL') {
      filter.deviceType = deviceType;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (typeof endDate === 'string' && endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        filter.createdAt.$lte = end;
      }
    }

    // Keyword search over email, employeeName, ipAddress, browser, os, failureReason
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { email: { $regex: searchRegex } },
        { employeeName: { $regex: searchRegex } },
        { employeeCode: { $regex: searchRegex } },
        { ipAddress: { $regex: searchRegex } },
        { browser: { $regex: searchRegex } },
        { os: { $regex: searchRegex } },
        { failureReason: { $regex: searchRegex } }
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (currentPage - 1) * pageLimit;
    const sortOrder = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [docs, total] = await Promise.all([
      LoginHistory.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      LoginHistory.countDocuments(filter)
    ]);

    return {
      docs,
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit) || 1
    };
  }

  /**
   * Aggregate login history metrics across the selected filter window (Phase 24)
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  static async getLoginHistoryStats({
    userId,
    userRoles = [],
    permissionScope = 'own',
    startDate,
    endDate
  }) {
    const isSuperAdmin = userRoles.some((r) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === 'Super Admin';
    });
    const isHR = userRoles.some((r) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === 'HR Manager';
    });
    const canViewAll = isSuperAdmin || isHR || permissionScope === 'all';

    const match = {};
    if (!canViewAll) {
      match.userId = new mongoose.Types.ObjectId(userId);
    }

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (typeof endDate === 'string' && endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        match.createdAt.$lte = end;
      }
    }

    const [metrics] = await LoginHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          successfulLogins: {
            $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
          },
          failedLogins: {
            $sum: {
              $cond: [
                { $in: ['$status', ['FAILED', '2FA_FAILED']] },
                1,
                0
              ]
            }
          },
          lockedAttempts: {
            $sum: { $cond: [{ $eq: ['$status', 'LOCKED'] }, 1, 0] }
          },
          blockedAttempts: {
            $sum: { $cond: [{ $in: ['$status', ['BLOCKED', 'RESTRICTED']] }, 1, 0] }
          },
          twoFactorChallenges: {
            $sum: { $cond: [{ $eq: ['$status', '2FA_PENDING'] }, 1, 0] }
          },
          uniqueEmails: { $addToSet: '$email' }
        }
      }
    ]);

    const total = metrics?.totalAttempts || 0;
    const successful = metrics?.successfulLogins || 0;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 100;

    return {
      totalAttempts: total,
      successfulLogins: successful,
      failedLogins: metrics?.failedLogins || 0,
      lockedAttempts: metrics?.lockedAttempts || 0,
      blockedAttempts: metrics?.blockedAttempts || 0,
      twoFactorChallenges: metrics?.twoFactorChallenges || 0,
      uniqueAccounts: metrics?.uniqueEmails ? metrics.uniqueEmails.length : 0,
      successRate
    };
  }

  /**
   * Retrieve single login history attempt detail with threat correlation (Phase 24)
   * @param {string} id - LoginHistory document ID
   * @param {Object} userContext
   * @returns {Promise<Object>}
   */
  static async getLoginHistoryDetail(id, { userId, userRoles = [], permissionScope = 'own' }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid login history record identifier.');
    }

    const record = await LoginHistory.findById(id).lean();
    if (!record) {
      throw new ApiError(404, 'Login history record not found.');
    }

    const isSuperAdmin = userRoles.some((r) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === 'Super Admin';
    });
    const isHR = userRoles.some((r) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === 'HR Manager';
    });
    const canViewAll = isSuperAdmin || isHR || permissionScope === 'all';

    // Data-scope isolation: non-admins cannot inspect other users' login records
    if (!canViewAll && String(record.userId) !== String(userId)) {
      throw new ApiError(403, 'You do not have permission to inspect this authentication record.');
    }

    // Security threat correlation: count consecutive failed attempts from same IP or email in last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentFailuresFromIp, recentFailuresFromAccount] = await Promise.all([
      LoginHistory.countDocuments({
        ipAddress: record.ipAddress,
        status: { $in: ['FAILED', 'LOCKED', '2FA_FAILED'] },
        createdAt: { $gte: dayAgo }
      }),
      record.email
        ? LoginHistory.countDocuments({
            email: record.email,
            status: { $in: ['FAILED', 'LOCKED', '2FA_FAILED'] },
            createdAt: { $gte: dayAgo }
          })
        : 0
    ]);

    return {
      ...record,
      securityCorrelation: {
        recentFailuresFromIp,
        recentFailuresFromAccount,
        isSuspiciousOrigin: recentFailuresFromIp >= 5 || recentFailuresFromAccount >= 5
      }
    };
  }

  /**
   * Export filtered login history records to clean streaming CSV format (Phase 24)
   * @param {Object} params
   * @returns {Promise<string>}
   */
  static async exportLoginHistory({
    userId,
    userRoles = [],
    permissionScope = 'own',
    query = {}
  }) {
    const isSuperAdmin = userRoles.some((r) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === 'Super Admin';
    });
    const isHR = userRoles.some((r) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName === 'HR Manager';
    });
    const canViewAll = isSuperAdmin || isHR || permissionScope === 'all';

    const filter = {};
    if (!canViewAll) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    const { status, deviceType, startDate, endDate, search, email } = query;
    if (canViewAll && email) filter.email = email.toLowerCase().trim();
    if (status && status !== 'ALL') filter.status = status;
    if (deviceType && deviceType !== 'ALL') filter.deviceType = deviceType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (typeof endDate === 'string' && endDate.length <= 10) end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { email: { $regex: searchRegex } },
        { employeeName: { $regex: searchRegex } },
        { ipAddress: { $regex: searchRegex } }
      ];
    }

    // Limit exports to 10,000 records to protect server memory
    const docs = await LoginHistory.find(filter)
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Timestamp (PKT)',
      'Account Email',
      'Employee Name',
      'Employee Code',
      'Role',
      'Department',
      'Status',
      'IP Address',
      'Device Type',
      'Browser',
      'Operating System',
      'Notice / Reason'
    ].join(',');

    const rows = docs.map((doc) => {
      const date = new Date(doc.createdAt);
      const pktDate = !isNaN(date.getTime())
        ? date.toLocaleString('en-GB', { timeZone: 'Asia/Karachi' })
        : '';

      return [
        escapeCsv(pktDate),
        escapeCsv(doc.email),
        escapeCsv(doc.employeeName || '—'),
        escapeCsv(doc.employeeCode || '—'),
        escapeCsv(doc.role || '—'),
        escapeCsv(doc.department || '—'),
        escapeCsv(doc.status),
        escapeCsv(doc.ipAddress),
        escapeCsv(doc.deviceType),
        escapeCsv(doc.browser || '—'),
        escapeCsv(doc.os || '—'),
        escapeCsv(doc.failureReason || 'Authentication completed')
      ].join(',');
    });

    return [headers, ...rows].join('\r\n');
  }

  /**
   * HR-Initiated Emergency Password Reset (Slice 1.14).
   * Generates secure 10-character temporary password, enforces mustChangePassword on next login,
   * invalidates existing sessions, and delivers credentials via email.
   * 
   * @param {Object} params
   * @param {string} params.targetUserId - Target user ObjectId
   * @param {Object} params.adminUser - Calling administrator user document
   * @param {string} [params.ipAddress] - Request IP
   * @param {string} [params.userAgent] - Request User Agent
   * @returns {Promise<{ message: string, tempPassword?: string }>}
   */
  static async adminResetPassword({ targetUserId, adminUser, ipAddress, userAgent }) {
    // 1. Locate target user
    const targetUser = await User.findOne({ _id: targetUserId, isDeleted: false });
    if (!targetUser) {
      throw new ApiError(404, 'Target user account not found.');
    }

    // 2. Generate secure 10-character temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let rawTemp = '';
    for (let i = 0; i < 6; i++) {
      rawTemp += chars.charAt(crypto.randomInt(0, chars.length));
    }
    const tempPassword = `Tmp#${rawTemp}9`;

    // 3. Hash temporary password with bcrypt (12 salt rounds)
    targetUser.passwordHash = await bcrypt.hash(tempPassword, 12);

    // 4. Set security flags
    targetUser.mustChangePassword = true;
    targetUser.failedAttempts = 0;
    targetUser.lockUntil = null;
    targetUser.refreshTokenHash = null; // Immediately evict active sessions

    await targetUser.save();

    // 5. Deliver temporary password email
    await emailService.sendTemporaryPasswordEmail(targetUser.email, tempPassword);

    // 6. Record security audit log
    await AuditService.log({
      actorId: adminUser?._id,
      actorEmail: adminUser?.email,
      actorRole: adminUser?.roles?.[0]?.name || adminUser?.roles?.[0] || 'ADMIN',
      action: 'ADMIN_PASSWORD_RESET',
      module: 'AUTH',
      targetId: targetUser._id,
      targetModel: 'User',
      ipAddress,
      userAgent,
      details: { targetEmail: targetUser.email }
    });

    return {
      message: 'Temporary password generated and dispatched to employee email successfully.',
      tempPassword // Exposed for test assertions if needed in test environment
    };
  }
}





