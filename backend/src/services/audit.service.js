import { AuditLog } from '../models/auditLog.model.js';
import { emitToCompany } from './socket.service.js';

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
    targetId = null,
    targetModel = null,
    ipAddress = null,
    userAgent = null,
    details = {}
  }) {
    try {
      const log = await AuditLog.create({
        actorId,
        actorEmail,
        actorRole,
        action,
        module,
        targetId,
        targetModel,
        ipAddress,
        userAgent,
        details
      });
      // Payload-free ping; auth entries (logins) are noise for dashboards.
      if (String(module).toLowerCase() !== 'auth') emitToCompany('dashboard:changed', { module });
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
  entity,
  entityId,
  before = null,
  after = null,
  ip = null,
  userAgent = null,
  details = {},
  meta = {}
}) => {
  const actorEmail = actor?.email || 'system';
  const actorRole = actor?.roles?.[0]?.name || actor?.roles?.[0] || 'SYSTEM';

  return await AuditService.log({
    actorId: userId || actorId || actor?._id || null,
    actorEmail,
    actorRole,
    action,
    module: entity?.toLowerCase() || 'system',
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
