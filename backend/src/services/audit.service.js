/**
 * @file audit.service.js
 * @description Centralized immutable audit service with device parsing, payload sanitization, and category inference.
 */

import { AuditLog } from '../models/auditLog.model.js';
import { emitToCompany } from './socket.service.js';

/**
 * Intelligent client User-Agent string parser
 * @param {string|null} uaString
 * @returns {{ browser: string, os: string, deviceType: string }}
 */
export const parseUserAgent = (uaString) => {
  if (!uaString || typeof uaString !== 'string') {
    return { browser: 'Unknown', os: 'Unknown', deviceType: 'Unknown' };
  }

  const ua = uaString.toLowerCase();

  // 1. Detect Device Type
  let deviceType = 'Desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // 2. Detect OS
  let os = 'Unknown';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  // 3. Detect Browser
  let browser = 'Unknown';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';

  return { browser, os, deviceType };
};

/**
 * Sensitive field patterns to redact from audit logs
 */
const SENSITIVE_KEY_REGEX = /password|passwordhash|token|refreshtoken|authorization|cnic|accountnumber|pin|cvv|apikey|secret/i;

/**
 * Deep recursive sanitization of objects to strip/mask credentials
 * @param {*} data
 * @returns {*}
 */
export const sanitizeAuditPayload = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditPayload(item));
  }

  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      clean[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      clean[key] = sanitizeAuditPayload(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

/**
 * Inferred category, severity, and status based on action strings
 */
const inferEventAttributes = (action = '', explicitAttrs = {}) => {
  const upper = String(action).toUpperCase();

  let status = explicitAttrs.status || 'SUCCESS';
  if (upper.includes('FAIL') || upper.includes('DENIED') || upper.includes('LOCKED') || upper.includes('ERROR')) {
    status = 'FAILURE';
  }

  let severity = explicitAttrs.severity || 'LOW';
  if (upper.includes('LOCKED') || upper.includes('SECURITY_BREACH') || upper.includes('UNAUTHORIZED')) {
    severity = 'CRITICAL';
  } else if (upper.includes('FAIL') || upper.includes('DELETE') || upper.includes('PURGE') || upper.includes('ROLE_UPDATED') || upper.includes('ROLE_DELETED')) {
    severity = 'HIGH';
  } else if (upper.includes('UPDATE') || upper.includes('APPROVE') || upper.includes('OVERRIDE') || upper.includes('REJECT') || upper.includes('CONFIG')) {
    severity = 'MEDIUM';
  }

  let category = explicitAttrs.category || 'DATA_CHANGE';
  if (upper.includes('LOGIN') || upper.includes('LOGOUT') || upper.includes('AUTH') || upper.includes('PASSWORD') || upper.includes('2FA')) {
    category = 'AUTHENTICATION';
  } else if (upper.includes('LOCKED') || upper.includes('SECURITY') || upper.includes('ACCESS_DENIED')) {
    category = 'SECURITY';
  } else if (upper.includes('ROLE') || upper.includes('PERMISSION') || upper.includes('SETTING') || upper.includes('CONFIG') || upper.includes('DELEGAT')) {
    category = 'ADMINISTRATIVE';
  } else if (upper.includes('CRON') || upper.includes('JOB') || upper.includes('BACKUP') || upper.includes('SYSTEM')) {
    category = 'SYSTEM';
  }

  return { status, severity, category };
};

export class AuditService {
  /**
   * Record an immutable audit log entry
   * @param {Object} logData
   */
  static async log({
    actorId = null,
    actorEmail = 'system',
    actorRole = 'SYSTEM',
    action,
    module,
    status = null,
    severity = null,
    category = null,
    description = null,
    targetId = null,
    targetModel = null,
    ipAddress = null,
    userAgent = null,
    details = {}
  }) {
    try {
      const sanitizedDetails = sanitizeAuditPayload(details);
      const device = parseUserAgent(userAgent);
      const inferred = inferEventAttributes(action, { status, severity, category });

      const finalDescription =
        description ||
        `${action} performed on ${targetModel || module || 'Resource'} by ${actorEmail || 'System'}`;

      const log = await AuditLog.create({
        actorId,
        actorEmail,
        actorRole,
        action,
        module: String(module || 'system').toLowerCase(),
        status: status || inferred.status,
        severity: severity || inferred.severity,
        category: category || inferred.category,
        description: finalDescription,
        targetId,
        targetModel,
        ipAddress,
        userAgent,
        device,
        details: sanitizedDetails
      });

      // Payload-free ping; auth entries (logins) are noise for dashboard counters
      if (String(module).toLowerCase() !== 'auth') {
        emitToCompany('dashboard:changed', { module });
      }

      return log;
    } catch (error) {
      // Never let audit log failure crash business operations, log to stderr
      console.error('AuditLog writing failed:', error.message);
      return null;
    }
  }
}

/**
 * Functional audit logger helper for module operations
 */
export const recordAuditLog = async ({
  userId,
  actorId,
  actor = null,
  action,
  entity: entityArg,
  entityId: entityIdArg,
  resource,
  resourceId,
  status = null,
  severity = null,
  category = null,
  description = null,
  before = null,
  after = null,
  ip = null,
  userAgent = null,
  details = {},
  meta = {}
}) => {
  const entity = entityArg ?? resource;
  const entityId = entityIdArg ?? resourceId;
  const actorEmail = actor?.email || 'system';
  const actorRole = actor?.roles?.[0]?.name || actor?.roles?.[0] || 'SYSTEM';

  return await AuditService.log({
    actorId: userId || actorId || actor?._id || null,
    actorEmail,
    actorRole,
    action,
    module: entity?.toLowerCase() || 'system',
    status,
    severity,
    category,
    description,
    targetId: entityId || null,
    targetModel: entity || null,
    ipAddress: ip,
    userAgent,
    details: {
      before,
      after,
      ...meta,
      ...details
    }
  });
};
