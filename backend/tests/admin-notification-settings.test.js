/**
 * @file admin-notification-settings.test.js
 * @description Unit & Integration Tests for Admin Notification & Announcement Channel Selection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { notify } from '../src/services/notify.service.js';
import { SettingService } from '../src/modules/settings/setting.service.js';
import { notificationsSettingSchema } from '../src/modules/settings/setting.validation.js';
import { Notification } from '../src/models/notification.model.js';
import { User } from '../src/models/user.model.js';
import { queueService } from '../src/services/queue.service.js';
import { whatsappService } from '../src/services/whatsapp.service.js';

describe('Admin Notification & Announcement Method Selection (Module M8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SettingService.clearCache();
  });

  describe('Validation Schema (notificationsSettingSchema)', () => {
    it('accepts valid preset payload with channels, announcements, and categories', () => {
      const validPayload = {
        channels: { inApp: true, email: false, whatsapp: true },
        announcements: { inApp: true, email: false, whatsapp: false },
        categories: {
          attendance: { inApp: true, email: false, whatsapp: false },
          leave: { inApp: true, email: false, whatsapp: true },
          payroll: { inApp: true, email: false, whatsapp: true },
          announcement: { inApp: true, email: false, whatsapp: false }
        }
      };

      const parsed = notificationsSettingSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
      expect(parsed.data.channels.inApp).toBe(true);
      expect(parsed.data.channels.email).toBe(false);
      expect(parsed.data.channels.whatsapp).toBe(true);
    });

    it('rejects invalid non-boolean channel values', () => {
      const invalidPayload = {
        channels: { inApp: 'yes', email: 123 }
      };

      const parsed = notificationsSettingSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Dynamic Channel Routing Enforcement in notify()', () => {
    const testUserId = new mongoose.Types.ObjectId();
    const mockUser = {
      _id: testUserId,
      name: 'Ahmed Khan',
      email: 'ahmed.khan@company.pk',
      phone: '03001234567',
      notificationPrefs: {
        attendance: { inApp: true, email: true, whatsapp: true }
      }
    };

    beforeEach(() => {
      vi.spyOn(User, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockUser])
      });
    });

    it('Scenario 1: Admin selects Email Only -> suppresses In-App & WhatsApp', async () => {
      vi.spyOn(SettingService, 'getSetting').mockResolvedValue({
        channels: { inApp: false, email: true, whatsapp: false },
        categories: { attendance: { inApp: false, email: true, whatsapp: false } }
      });

      const notifSpy = vi.spyOn(Notification, 'insertMany');
      const emailSpy = vi.spyOn(queueService, 'addNotificationEmailJob').mockResolvedValue(true);
      const waSpy = vi.spyOn(whatsappService, 'sendWhatsAppMessage');

      await notify(testUserId, {
        type: 'attendance',
        title: 'Check-in Notice',
        body: 'You clocked in at 09:05 AM',
        channels: ['inApp', 'email', 'whatsapp']
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(notifSpy).not.toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ahmed.khan@company.pk',
          actionTitle: 'Check-in Notice'
        })
      );
      expect(waSpy).not.toHaveBeenCalled();
    });

    it('Scenario 2: Admin selects In-App Only -> suppresses Email & WhatsApp', async () => {
      vi.spyOn(SettingService, 'getSetting').mockResolvedValue({
        channels: { inApp: true, email: false, whatsapp: false },
        categories: { attendance: { inApp: true, email: false, whatsapp: false } }
      });

      const notifSpy = vi.spyOn(Notification, 'insertMany').mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          userId: testUserId,
          type: 'attendance',
          title: 'Shift Scheduled',
          body: 'Morning shift assigned',
          link: null,
          isRead: false,
          createdAt: new Date()
        }
      ]);
      const emailSpy = vi.spyOn(queueService, 'addNotificationEmailJob');
      const waSpy = vi.spyOn(whatsappService, 'sendWhatsAppMessage');

      await notify(testUserId, {
        type: 'attendance',
        title: 'Shift Scheduled',
        body: 'Morning shift assigned',
        channels: ['inApp', 'email', 'whatsapp']
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(notifSpy).toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(waSpy).not.toHaveBeenCalled();
    });

    it('Scenario 3: Admin selects WhatsApp Only -> suppresses In-App & Email', async () => {
      vi.spyOn(SettingService, 'getSetting').mockResolvedValue({
        channels: { inApp: false, email: false, whatsapp: true },
        categories: { attendance: { inApp: false, email: false, whatsapp: true } }
      });

      const notifSpy = vi.spyOn(Notification, 'insertMany');
      const emailSpy = vi.spyOn(queueService, 'addNotificationEmailJob');
      const waSpy = vi.spyOn(whatsappService, 'sendWhatsAppMessage').mockResolvedValue({
        success: true,
        messageId: 'wa-123',
        formattedPhone: '+923001234567'
      });

      await notify(testUserId, {
        type: 'attendance',
        title: 'Emergency Attendance Alert',
        body: 'Office closed due to weather',
        channels: ['inApp', 'email', 'whatsapp']
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(notifSpy).not.toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(waSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '03001234567',
          message: expect.stringContaining('Emergency Attendance Alert')
        })
      );
    });

    it('Scenario 4: Admin selects Mixed (All Active) -> all channels dispatched', async () => {
      vi.spyOn(SettingService, 'getSetting').mockResolvedValue({
        channels: { inApp: true, email: true, whatsapp: true },
        categories: { attendance: { inApp: true, email: true, whatsapp: true } }
      });

      const notifSpy = vi.spyOn(Notification, 'insertMany').mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          userId: testUserId,
          type: 'attendance',
          title: 'All Active Notice',
          body: 'Test mixed dispatch',
          link: null,
          isRead: false,
          createdAt: new Date()
        }
      ]);
      const emailSpy = vi.spyOn(queueService, 'addNotificationEmailJob').mockResolvedValue(true);
      const waSpy = vi.spyOn(whatsappService, 'sendWhatsAppMessage').mockResolvedValue({
        success: true,
        messageId: 'wa-all',
        formattedPhone: '+923001234567'
      });

      await notify(testUserId, {
        type: 'attendance',
        title: 'All Active Notice',
        body: 'Test mixed dispatch',
        channels: ['inApp', 'email', 'whatsapp']
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(notifSpy).toHaveBeenCalled();
      expect(emailSpy).toHaveBeenCalled();
      expect(waSpy).toHaveBeenCalled();
    });

    it('Scenario 5: Admin Announcement Specific Override', async () => {
      // Global has email enabled, but Announcements has email disabled and inApp only
      vi.spyOn(SettingService, 'getSetting').mockResolvedValue({
        channels: { inApp: true, email: true, whatsapp: false },
        announcements: { inApp: true, email: false, whatsapp: false }
      });

      const notifSpy = vi.spyOn(Notification, 'insertMany').mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          userId: testUserId,
          type: 'announcement',
          title: 'Company Picnic',
          body: 'Annual picnic on Sunday',
          link: null,
          isRead: false,
          createdAt: new Date()
        }
      ]);
      const emailSpy = vi.spyOn(queueService, 'addNotificationEmailJob');
      const waSpy = vi.spyOn(whatsappService, 'sendWhatsAppMessage');

      await notify(testUserId, {
        type: 'announcement',
        title: 'Company Picnic',
        body: 'Annual picnic on Sunday',
        channels: ['inApp', 'email', 'whatsapp']
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(notifSpy).toHaveBeenCalled();
      expect(emailSpy).not.toHaveBeenCalled();
      expect(waSpy).not.toHaveBeenCalled();
    });
  });
});
