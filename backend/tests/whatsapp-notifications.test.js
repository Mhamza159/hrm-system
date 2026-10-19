/**
 * @file whatsapp-notifications.test.js
 * @description Unit & Integration Tests for WhatsApp Service & Notification Channel (Slice 8.4).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { whatsappService } from '../src/services/whatsapp.service.js';
import { notify } from '../src/services/notify.service.js';
import { User } from '../src/models/user.model.js';
import { Notification } from '../src/models/notification.model.js';

describe('Slice 8.4: WhatsApp Notification Gateway & Sandbox Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phone Number Normalization (Pakistani E.164 Specs)', () => {
    it('normalizes local 11-digit format 03XXXXXXXXX to +923XXXXXXXXX', () => {
      const formatted = whatsappService.formatPhoneNumber('03001234567');
      expect(formatted).toBe('+923001234567');
    });

    it('strips dashes and spaces from local phone input', () => {
      const formatted = whatsappService.formatPhoneNumber('0345-9876 543');
      expect(formatted).toBe('+923459876543');
    });

    it('normalizes 923XXXXXXXXX without plus sign to +923XXXXXXXXX', () => {
      const formatted = whatsappService.formatPhoneNumber('923121112233');
      expect(formatted).toBe('+923121112233');
    });

    it('preserves already compliant +923XXXXXXXXX numbers', () => {
      const formatted = whatsappService.formatPhoneNumber('+923335557788');
      expect(formatted).toBe('+923335557788');
    });

    it('returns empty string for null, undefined, or empty phone input', () => {
      expect(whatsappService.formatPhoneNumber('')).toBe('');
      expect(whatsappService.formatPhoneNumber(null)).toBe('');
      expect(whatsappService.formatPhoneNumber(undefined)).toBe('');
    });
  });

  describe('Sandbox Dispatch & Mock Logging', () => {
    it('dispatches to sandbox logger cleanly when API credentials are absent', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await whatsappService.sendWhatsAppMessage({
        to: '03001234567',
        message: 'Your shift has been rescheduled to 10:00 PKT.'
      });

      expect(result.success).toBe(true);
      expect(result.formattedPhone).toBe('+923001234567');
      expect(result.messageId).toContain('wa-mock-');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('+923001234567')
      );
    });

    it('returns failure when recipient phone number is invalid or missing', async () => {
      const result = await whatsappService.sendWhatsAppMessage({
        to: '',
        message: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or missing');
    });
  });

  describe('Integration with Centralized notify() Pipeline', () => {
    it('notify() triggers whatsappService when user has whatsapp preference enabled', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: testUserId,
        name: 'Tariq Mehmood',
        phone: '03219876543',
        notificationPrefs: {
          payroll: { inApp: true, email: false, whatsapp: true }
        }
      };

      vi.spyOn(Notification, 'insertMany').mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          userId: testUserId,
          type: 'payroll',
          title: 'Payslip Ready',
          body: 'Your October payslip is available.',
          link: '/payroll',
          isRead: false,
          createdAt: new Date()
        }
      ]);

      vi.spyOn(User, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockUser])
      });

      const waSpy = vi.spyOn(whatsappService, 'sendWhatsAppMessage').mockResolvedValue({
        success: true,
        messageId: 'wa-mock-123',
        formattedPhone: '+923219876543'
      });

      await notify(testUserId, {
        type: 'payroll',
        title: 'Payslip Ready',
        body: 'Your October payslip is available.',
        channels: ['inApp', 'whatsapp']
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(waSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '03219876543',
          message: expect.stringContaining('Payslip Ready')
        })
      );
    });

    it('notify() suppresses whatsapp delivery when user preference is disabled', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: testUserId,
        name: 'Bilal Khan',
        phone: '03001112233',
        notificationPrefs: {
          attendance: { inApp: true, email: true, whatsapp: false }
        }
      };

      vi.spyOn(Notification, 'insertMany').mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          userId: testUserId,
          type: 'attendance',
          title: 'Late Arrival Warning',
          body: 'You were marked late today.',
          link: '/attendance',
          isRead: false,
          createdAt: new Date()
        }
      ]);

      vi.spyOn(User, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockUser])
      });

      const waSpy = vi.spyOn(whatsappService, 'sendWhatsAppMessage');

      await notify(testUserId, {
        type: 'attendance',
        title: 'Late Arrival Warning',
        body: 'You were marked late today.',
        channels: ['inApp', 'whatsapp']
      });

      await new Promise((r) => setTimeout(r, 50));

      expect(waSpy).not.toHaveBeenCalled();
    });
  });
});
