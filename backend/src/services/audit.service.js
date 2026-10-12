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
