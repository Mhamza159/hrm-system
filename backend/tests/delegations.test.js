import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Delegation } from '../src/models/delegation.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Approvals Delegation System API (Slice 26.14-TEST)', () => {
  let managerAToken;
  let managerBToken;
  let managerAUser;
  let managerBUser;
  let delegationId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_delegation');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});
    await Delegation.deleteMany({});

    // Create Manager Role (possessing leave.approve)
    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.approve', subject: 'Leave', scope: 'department' }
      ]
    });

    // Create Peer Role (only profile.view, standard employee)
    const peerRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'profile.view', subject: 'Employee', scope: 'own' }
      ]
    });

    managerAUser = await User.create({
      email: 'manager.a@company.pk',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      isActive: true
    });

    managerBUser = await User.create({
      email: 'manager.b@company.pk',
      passwordHash: 'dummy_hash',
      roles: [peerRole._id],
      isActive: true
    });

    managerAToken = jwt.sign(
      { userId: managerAUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    managerBToken = jwt.sign(
      { userId: managerBUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Delegation.deleteMany({});
    await mongoose.disconnect();
  });

  it('POST /api/v1/delegations should create an active approval delegation', async () => {
    const now = Date.now();
    const res = await request(app)
      .post('/api/v1/delegations')
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({
        toUserId: managerBUser._id.toString(),
        startDate: new Date(now - 10000).toISOString(),
        endDate: new Date(now + 7 * 86400000).toISOString(),
        permissions: [
          { action: 'leave.approve', subject: 'Leave', scope: 'department' }
        ],
        reason: 'Vacation handover'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.toUserId.toString()).toBe(managerBUser._id.toString());
    delegationId = res.body.data._id;
  });

  it('GET /api/v1/auth/me should dynamically inject delegated permission to delegate user during active window', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${managerBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const effective = res.body.data.effectivePermissions;
    const delegatedPerm = effective.find((p) => p.action === 'leave.approve');
    expect(delegatedPerm).toBeDefined();
    expect(delegatedPerm.isDelegated).toBe(true);
  });

  it('GET /api/v1/delegations should list active delegations', async () => {
    const res = await request(app)
      .get('/api/v1/delegations')
      .set('Authorization', `Bearer ${managerAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]._id.toString()).toBe(delegationId);
  });

  it('DELETE /api/v1/delegations/:id should cancel active delegation and revoke permissions from delegate', async () => {
    const cancelRes = await request(app)
      .delete(`/api/v1/delegations/${delegationId}`)
      .set('Authorization', `Bearer ${managerAToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // Verify Manager B no longer receives leave.approve in /auth/me
    const verifyMeRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${managerBToken}`);

    expect(verifyMeRes.status).toBe(200);
    const delegatedPerm = verifyMeRes.body.data.effectivePermissions.find(
      (p) => p.action === 'leave.approve'
    );
    expect(delegatedPerm).toBeUndefined();
  });
});
