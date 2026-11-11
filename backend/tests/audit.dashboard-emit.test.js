import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
vi.mock('../src/services/socket.service.js', () => ({ emitToCompany: vi.fn() }));
import { emitToCompany } from '../src/services/socket.service.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { AuditService, recordAuditLog } from '../src/services/audit.service.js';

describe('Audit service dashboard emit', () => {
  beforeAll(async () => {
    await mongoose.connect(env.MONGO_URI.replace('hrm_development', 'hrm_test_audit_emit'));
    await AuditLog.deleteMany({});
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recordAuditLog keeps actor and meta passed as actorId/meta', async () => {
    const actorId = new mongoose.Types.ObjectId();
    const log = await recordAuditLog({ action: 'LEAVE_TYPE_CREATE', actorId, entity: 'LeaveType',
      entityId: new mongoose.Types.ObjectId(), meta: { code: 'CL' } });
    expect(String(log.actorId)).toBe(String(actorId));
    expect(log.details.code).toBe('CL');
  });

  it('recordAuditLog accepts resource/resourceId aliases, entity wins', async () => {
    const resourceId = new mongoose.Types.ObjectId();
    const log = await recordAuditLog({ action: 'ASSET_REQUEST_X', resource: 'AssetRequest', resourceId });
    expect(log.module).toBe('assetrequest');
    expect(String(log.targetId)).toBe(String(resourceId));
    const both = await recordAuditLog({ action: 'X', entity: 'Leave', resource: 'Asset' });
    expect(both.module).toBe('leave');
  });

  it('emits dashboard:changed with module only', async () => {
    await AuditService.log({ action: 'LEAVE_APPROVED', module: 'leave' });
    expect(emitToCompany).toHaveBeenCalledWith('dashboard:changed', { module: 'leave' });
  });

  it('does not emit for auth entries', async () => {
    await AuditService.log({ action: 'USER_LOGIN', module: 'AUTH' });
    expect(emitToCompany).not.toHaveBeenCalled();
  });

  it('does not emit when the write fails', async () => {
    vi.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('db down'));
    const res = await AuditService.log({ action: 'X', module: 'leave' });
    expect(res).toBeNull();
    expect(emitToCompany).not.toHaveBeenCalled();
  });
});
