/**
 * @file email-notifications.test.js
 * @description Unit & Integration Tests for Email Queue & Notification Dispatcher (Slice 8.3).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { queueService } from '../src/services/queue.service.js';
import { emailService } from '../src/services/email.service.js';
import { notify } from '../src/services/notify.service.js';
import { User } from '../src/models/user.model.js';
import { Notification } from '../src/models/notification.model.js';

describe('Slice 8.3: Transactional Email Queue & Template Compilation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('compiles template placeholders accurately', () => {
    const rawTemplate = 'Hello {{employeeName}}, your {{actionTitle}} is ready. Details: {{details}}. Link: {{portalUrl}}';
    const compiled = queueService.compileTemplate(rawTemplate, {
      employeeName: 'Zain Ahmed',
      actionTitle: 'Leave Approval',
      details: 'Your annual leave request has been approved by HR.',
      portalUrl: 'https://hrm.example.com/leave'
    });

    expect(compiled).toContain('Hello Zain Ahmed');
    expect(compiled).toContain('your Leave Approval is ready');
    expect(compiled).toContain('Your annual leave request has been approved by HR.');
    expect(compiled).toContain('https://hrm.example.com/leave');
  });

  it('builds linear dark craft HTML email with expected branding elements', () => {
    const html = queueService.buildNotificationEmailHtml({
      employeeName: 'Sara Khan',
      actionTitle: 'Payroll Slip Generated',
      details: 'Your payslip for October 2026 is now available.',
      portalUrl: 'https://hrm.example.com/payroll'
    });

    expect(html).toContain('Sara Khan');
    expect(html).toContain('Payroll Slip Generated');
    expect(html).toContain('Your payslip for October 2026 is now available.');
    expect(html).toContain('#090A0F'); // Dark canvas
    expect(html).toContain('#5E6AD2'); // Linear indigo accent
    expect(html).toContain('https://hrm.example.com/payroll');
  });

  it('enqueues job and executes email dispatch via emailService.sendMail', async () => {
    const sendMailSpy = vi.spyOn(emailService, 'sendMail').mockResolvedValue({
      success: true,
      messageId: 'mock-msg-123'
    });

    const result = await queueService.addNotificationEmailJob({
      to: 'employee@example.com',
      employeeName: 'Ali Raza',
      actionTitle: 'Shift Schedule Assigned',
      details: 'You have been assigned to the Morning Shift (09:00 - 18:00 PKT).',
      link: '/attendance/shifts'
    });

    expect(result.status).toBe('queued');
    expect(result.jobId).toBeDefined();

    // Give microtask event loop tick to process queue
    await new Promise((r) => setTimeout(r, 50));

    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'employee@example.com',
        subject: expect.stringContaining('Shift Schedule Assigned'),
        html: expect.stringContaining('Ali Raza')
      })
    );
  });

  it('notify() triggers email queue job when recipient has email preference enabled', async () => {
    const testUserId = new mongoose.Types.ObjectId();
    const mockUser = {
      _id: testUserId,
      name: 'Usman Ghani',
      email: 'usman@example.com',
      notificationPrefs: {
        attendance: { inApp: true, email: true, whatsapp: false }
      }
    };

    vi.spyOn(Notification, 'insertMany').mockResolvedValue([
      {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        type: 'attendance',
        title: 'Clock In Verified',
        body: 'Your biometric clock in was logged at 08:58 PKT.',
        link: '/attendance',
        isRead: false,
        createdAt: new Date()
      }
    ]);

    vi.spyOn(User, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([mockUser])
    });

    const queueSpy = vi.spyOn(queueService, 'addNotificationEmailJob').mockResolvedValue({
      jobId: 'job-test-1',
      status: 'queued'
    });

    const res = await notify(testUserId, {
      type: 'attendance',
      title: 'Clock In Verified',
      body: 'Your biometric clock in was logged at 08:58 PKT.',
      channels: ['inApp', 'email']
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(1);

    // Allow user lookup promise to resolve
    await new Promise((r) => setTimeout(r, 50));

    expect(queueSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'usman@example.com',
        employeeName: 'Usman Ghani',
        actionTitle: 'Clock In Verified'
      })
    );
  });

  it('notify() suppresses email queue job when recipient has email preference disabled', async () => {
    const testUserId = new mongoose.Types.ObjectId();
    const mockUser = {
      _id: testUserId,
      name: 'Hamza Sheikh',
      email: 'hamza@example.com',
      notificationPrefs: {
        leave: { inApp: true, email: false, whatsapp: false }
      }
    };

    vi.spyOn(Notification, 'insertMany').mockResolvedValue([
      {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        type: 'leave',
        title: 'Leave Rejected',
        body: 'Your leave request was declined.',
        link: '/leave',
        isRead: false,
        createdAt: new Date()
      }
    ]);

    vi.spyOn(User, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([mockUser])
    });

    const queueSpy = vi.spyOn(queueService, 'addNotificationEmailJob');

    await notify(testUserId, {
      type: 'leave',
      title: 'Leave Rejected',
      body: 'Your leave request was declined.',
      channels: ['inApp', 'email']
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(queueSpy).not.toHaveBeenCalled();
  });
});
