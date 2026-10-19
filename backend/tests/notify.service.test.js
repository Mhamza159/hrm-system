/**
 * @file notify.service.test.js
 * @description Unit & Integration Test Suite for Centralized notify() Pipeline (Module M8 / Slice 8.1-TEST).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Notification } from '../src/models/notification.model.js';
import { notify } from '../src/services/notify.service.js';

describe('Module M8 — Centralized notify() Service Suite (Slice 8.1-TEST)', () => {
  let testUser1;
  let testUser2;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m8_notify');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Notification.deleteMany({});

    // Seed temporary role
    await Role.deleteMany({ name: 'Test Role Notify' });
    const testRole = await Role.create({
      name: 'Test Role Notify',
      description: 'Role for notification tests',
      permissions: [{ action: 'notification.view', subject: 'Notification', scope: 'own' }]
    });

    const passHash = await User.hashPassword('Password123!');
    testUser1 = await User.create({
      email: 'user1.notify@company.pk',
      passwordHash: passHash,
      roles: [testRole._id],
      isActive: true
    });

    testUser2 = await User.create({
      email: 'user2.notify@company.pk',
      passwordHash: passHash,
      roles: [testRole._id],
      isActive: true
    });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.disconnect();
  });

  it('8.1.1: should persist a notification document in MongoDB for a single recipient', async () => {
    const res = await notify(testUser1._id, {
      type: 'leave',
      title: 'Leave Approved',
      body: 'Your casual leave request for tomorrow has been approved.',
      link: '/leaves/history'
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(1);

    const saved = await Notification.findOne({ userId: testUser1._id, type: 'leave' });
    expect(saved).toBeDefined();
    expect(saved.title).toBe('Leave Approved');
    expect(saved.body).toContain('approved');
    expect(saved.isRead).toBe(false);
    expect(saved.link).toBe('/leaves/history');
  });

  it('8.1.2: should bulk persist notifications for multiple recipients in a single call', async () => {
    const recipientIds = [testUser1._id, testUser2._id];
    const res = await notify(recipientIds, {
      type: 'announcement',
      title: 'Office Townhall Tomorrow',
      body: 'All staff are requested to attend the quarterly townhall at 3 PM PKT.',
      link: '/announcements'
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(2);

    const countUser1 = await Notification.countDocuments({ userId: testUser1._id, type: 'announcement' });
    const countUser2 = await Notification.countDocuments({ userId: testUser2._id, type: 'announcement' });
    expect(countUser1).toBe(1);
    expect(countUser2).toBe(1);
  });

  it('8.1.3: should reject notification payload missing mandatory title or body', async () => {
    await expect(
      notify(testUser1._id, {
        type: 'system',
        body: 'Missing title'
      })
    ).rejects.toThrow();

    await expect(
      notify(testUser1._id, {
        type: 'system',
        title: 'Missing body'
      })
    ).rejects.toThrow();
  });

  it('8.1.4: should return count: 0 gracefully if userIds is empty or invalid', async () => {
    const resEmpty = await notify([], {
      type: 'system',
      title: 'Test',
      body: 'Body'
    });
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.count).toBe(0);

    const resInvalid = await notify(['not-a-valid-id'], {
      type: 'system',
      title: 'Test',
      body: 'Body'
    });
    expect(resInvalid.success).toBe(false);
    expect(resInvalid.count).toBe(0);
  });
});
