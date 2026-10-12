import { AuditLog } from '../models/auditLog.model.js';

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
      return await AuditLog.create({
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
  actor = null,
  action,
  entity,
  entityId,
  before = null,
  after = null,
  ip = null,
  userAgent = null,
  details = {}
}) => {
  const actorEmail = actor?.email || 'system';
  const actorRole = actor?.roles?.[0]?.name || actor?.roles?.[0] || 'SYSTEM';

  return await AuditService.log({
    actorId: userId || actor?._id || null,
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
      ...details
    }
  });
};
