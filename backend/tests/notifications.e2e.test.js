/**
 * @file notifications.e2e.test.js
 * @description Integration tests for Phase 23: Notification Module Complete Audit, Cross-Module Dispatch, Module Counts & Archival Lifecycle.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Notification } from '../src/models/notification.model.js';
import { notify, getModuleUnreadCounts } from '../src/services/notify.service.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Phase 23 — Notification Module Integration Tests', () => {
  let userAToken;
  let userBToken;
  let userA;
  let userB;
  let createdNotifId;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m8_notifications_p23');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Notification.deleteMany({});

    const role = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'notification.view', subject: 'Notification', scope: 'own' }
      ]
    });

    userA = await User.create({
      name: 'Alice Employee',
      email: 'alice@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [role._id],
      isActive: true
    });

    userB = await User.create({
      name: 'Bob Employee',
      email: 'bob@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [role._id],
      isActive: true
    });

    userAToken = jwt.sign(
      { userId: userA._id.toString(), role: 'Employee' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    userBToken = jwt.sign(
      { userId: userB._id.toString(), role: 'Employee' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  }, 60000);

  afterAll(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await mongoose.disconnect();
  });

  it('1. notify() persists enriched notification with module, priority and link', async () => {
    const res = await notify(userA._id, {
      module: 'leaves',
      priority: 'high',
      title: 'Leave Approved',
      body: 'Your annual leave request has been approved by your manager.',
      link: '/leaves'
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
    expect(res.notifications).toHaveLength(1);

    const notif = res.notifications[0];
    createdNotifId = notif._id.toString();

    expect(notif.module).toBe('leaves');
    expect(notif.priority).toBe('high');
    expect(notif.isRead).toBe(false);
    expect(notif.isArchived).toBe(false);
    expect(notif.link).toBe('/leaves');
  });

  it('2. Centralized notify() normalizes aliased modules accurately', async () => {
    await notify(userA._id, {
      type: 'leave', // singular alias
      title: 'Leave Reminder',
      body: 'Reminder for upcoming leave',
      link: '/leaves/my'
    });

    await notify(userA._id, {
      type: 'announcement',
      priority: 'urgent',
      title: 'Townhall Today',
      body: 'All-hands meeting starts at 3 PM',
      link: '/announcements'
    });

    await notify(userA._id, {
      type: 'policy',
      priority: 'urgent',
      title: 'Mandatory Policy Acknowledgement',
      body: 'Please review and acknowledge the updated Code of Conduct',
      link: '/policies'
    });

    const leaveNotif = await Notification.findOne({ title: 'Leave Reminder' });
    expect(leaveNotif.module).toBe('leaves');

    const announcementNotif = await Notification.findOne({ title: 'Townhall Today' });
    expect(announcementNotif.module).toBe('announcements');
    expect(announcementNotif.priority).toBe('urgent');

    const policyNotif = await Notification.findOne({ title: 'Mandatory Policy Acknowledgement' });
    expect(policyNotif.module).toBe('policies');
    expect(policyNotif.priority).toBe('urgent');
  });

  it('3. GET /api/v1/notifications/module-counts returns grouped unread counts', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/module-counts')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUnread).toBe(4);
    expect(res.body.data.byModule.leaves).toBe(2);
    expect(res.body.data.byModule.announcements).toBe(1);
    expect(res.body.data.byModule.policies).toBe(1);
    expect(res.body.data.byRoute['/leaves']).toBe(1);
    expect(res.body.data.byRoute['/announcements']).toBe(1);
  });

  it('4. GET /api/v1/notifications supports module and priority filtering', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .query({ module: 'policies', priority: 'urgent' })
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].module).toBe('policies');
    expect(res.body.data.items[0].priority).toBe('urgent');
    expect(res.body.meta.urgentCount).toBe(2); // Townhall Today + Mandatory Policy

    // Test regex safety with special regex metacharacters
    const regexSafeRes = await request(app)
      .get('/api/v1/notifications')
      .query({ search: '[Code]*+(?!)' })
      .set('Authorization', `Bearer ${userAToken}`);

    expect(regexSafeRes.status).toBe(200);
    expect(regexSafeRes.body.success).toBe(true);
  });

  it('5. PATCH /api/v1/notifications/:id/read marks notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${createdNotifId}/read`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
    expect(res.body.data.readAt).not.toBeNull();

    // Verify unread count decremented
    const countsRes = await request(app)
      .get('/api/v1/notifications/module-counts')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(countsRes.body.data.totalUnread).toBe(3);
    expect(countsRes.body.data.byModule.leaves).toBe(1);
  });

  it('6. PATCH /api/v1/notifications/:id/unread restores notification to unread', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${createdNotifId}/unread`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(false);
    expect(res.body.data.readAt).toBeNull();

    const countsRes = await request(app)
      .get('/api/v1/notifications/module-counts')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(countsRes.body.data.totalUnread).toBe(4);
  });

  it('7. PATCH /api/v1/notifications/read-all marks all notifications read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.modifiedCount).toBe(4);

    const countsRes = await request(app)
      .get('/api/v1/notifications/module-counts')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(countsRes.body.data.totalUnread).toBe(0);
  });

  it('8. Archival lifecycle: archive, query archived, unarchive and archive-all', async () => {
    // 1. Archive single
    const archiveRes = await request(app)
      .patch(`/api/v1/notifications/${createdNotifId}/archive`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.isArchived).toBe(true);
    expect(archiveRes.body.data.archivedAt).not.toBeNull();

    // 2. Query active feed excludes archived
    const activeRes = await request(app)
      .get('/api/v1/notifications')
      .query({ isArchived: 'false' })
      .set('Authorization', `Bearer ${userAToken}`);

    expect(activeRes.body.data.items.find((i) => i._id === createdNotifId)).toBeUndefined();

    // 3. Query archived feed includes it
    const archivedRes = await request(app)
      .get('/api/v1/notifications')
      .query({ isArchived: 'true' })
      .set('Authorization', `Bearer ${userAToken}`);

    expect(archivedRes.body.data.items.find((i) => i._id === createdNotifId)).toBeDefined();

    // 4. Restore unarchive
    const unarchiveRes = await request(app)
      .patch(`/api/v1/notifications/${createdNotifId}/unarchive`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(unarchiveRes.status).toBe(200);
    expect(unarchiveRes.body.data.isArchived).toBe(false);

    // 5. Archive all read
    const archiveAllRes = await request(app)
      .patch('/api/v1/notifications/archive-all')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(archiveAllRes.status).toBe(200);
    expect(archiveAllRes.body.data.modifiedCount).toBeGreaterThan(0);
  });

  it('9. Permanent deletion removes notification from database', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/notifications/${createdNotifId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deleted).toBe(true);

    const doc = await Notification.findById(createdNotifId);
    expect(doc).toBeNull();
  });

  it('10. Multi-tenant and PBAC data isolation prevents cross-user access', async () => {
    // User B creates a private notification
    const bNotifRes = await notify(userB._id, {
      module: 'payroll',
      title: 'Salary Slips Generated',
      body: 'Your payslip is available',
      link: '/payroll/my-payslips'
    });

    const bNotifId = bNotifRes.notifications[0]._id.toString();

    // User A attempts to mark User B's notification as read -> 404
    const markRes = await request(app)
      .patch(`/api/v1/notifications/${bNotifId}/read`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(markRes.status).toBe(404);

    // User A attempts to archive User B's notification -> 404
    const archiveRes = await request(app)
      .patch(`/api/v1/notifications/${bNotifId}/archive`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(archiveRes.status).toBe(404);

    // User A cannot delete User B's notification -> 404
    const delRes = await request(app)
      .delete(`/api/v1/notifications/${bNotifId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(delRes.status).toBe(404);
  });
});
