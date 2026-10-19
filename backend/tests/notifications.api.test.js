/**
 * @file notifications.api.test.js
 * @description Integration Test Suite for In-App Notifications & Channel Preferences APIs (Module M8 / Slice 8.2 & 8.5-TEST).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Notification } from '../src/models/notification.model.js';

describe('Module M8 — In-App Notifications & Preferences API Suite (Slice 8.2 & 8.5)', () => {
  let user1Token;
  let user2Token;
  let user1;
  let user2;
  let notifUser1;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m8_api');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});
    await Notification.deleteMany({});

    // Seed test role with notification.view permission
    const testRole = await Role.create({
      name: 'Notification Test Role',
      description: 'Role for notification tests',
      permissions: [
        { action: 'notification.view', subject: 'Notification', scope: 'own' }
      ]
    });

    const passHash = await User.hashPassword('Password123!');

    user1 = await User.create({
      email: 'employee1.notif@company.pk',
      passwordHash: passHash,
      roles: [testRole._id],
      isActive: true,
      notificationPrefs: {
        attendance: { inApp: true, email: true, whatsapp: false },
        leave: { inApp: true, email: true, whatsapp: false }
      }
    });

    user2 = await User.create({
      email: 'employee2.notif@company.pk',
      passwordHash: passHash,
      roles: [testRole._id],
      isActive: true
    });

    // Login user 1
    const login1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee1.notif@company.pk', password: 'Password123!' });
    user1Token = login1.body.data.accessToken;

    // Login user 2
    const login2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee2.notif@company.pk', password: 'Password123!' });
    user2Token = login2.body.data.accessToken;

    // Create notifications for user 1
    notifUser1 = await Notification.create({
      userId: user1._id,
      type: 'leave',
      title: 'Leave Approved',
      body: 'Your leave application #101 was approved.',
      link: '/leaves/101',
      isRead: false
    });

    await Notification.create({
      userId: user1._id,
      type: 'attendance',
      title: 'Shift Changed',
      body: 'You have been assigned to Morning Shift.',
      isRead: false
    });

    // Create notification for user 2
    await Notification.create({
      userId: user2._id,
      type: 'payroll',
      title: 'Payslip Released',
      body: 'October 2026 payslip is ready for download.',
      isRead: false
    });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.disconnect();
  });

  it('8.2.1: GET /api/v1/notifications should return paginated notifications and unread counter for current user', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.unreadCount).toBe(2);

    // Verify all returned items belong strictly to user1
    res.body.data.items.forEach((item) => {
      expect(item.userId.toString()).toBe(user1._id.toString());
    });
  });

  it('8.2.2: PATCH /api/v1/notifications/:id/read should mark single notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${notifUser1._id}/read`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
    expect(res.body.data.readAt).toBeDefined();

    // Verify unread count decremented
    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(listRes.body.data.unreadCount).toBe(1);
  });

  it('8.2.3: PATCH /api/v1/notifications/read-all should mark all remaining notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.modifiedCount).toBeGreaterThanOrEqual(1);

    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(listRes.body.data.unreadCount).toBe(0);
  });

  it('8.2.4: User 2 attempting to mark User 1 notification as read should receive 404 Not Found', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${notifUser1._id}/read`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('8.5.1: GET & PATCH /api/v1/notifications/preferences should fetch and update user channel toggles', async () => {
    // 1. Fetch current preferences
    const getRes = await request(app)
      .get('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.attendance).toBeDefined();

    // 2. Update preferences: disable email for attendance, enable whatsapp
    const patchRes = await request(app)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        attendance: {
          inApp: true,
          email: false,
          whatsapp: true
        }
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data.attendance.email).toBe(false);
    expect(patchRes.body.data.attendance.whatsapp).toBe(true);

    // Verify in database
    const updatedUser = await User.findById(user1._id);
    expect(updatedUser.notificationPrefs.attendance.email).toBe(false);
    expect(updatedUser.notificationPrefs.attendance.whatsapp).toBe(true);
  });
});
