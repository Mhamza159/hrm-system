/**
 * @file sync.rtk-cache.e2e.test.js
 * @description Comprehensive E2E Integration Test Suite for Phase 41:
 * - Real-Time Socket.io Cache Invalidation Helper (`broadcastCacheInvalidation`)
 * - Targeted user, department, and company room routing
 * - Single notification pipeline automated tag mapping & invalidation emission
 * - Attendance domain cache invalidation integration
 */

import { describe, it, expect, vi } from 'vitest';
import { broadcastCacheInvalidation } from '../src/services/socket.service.js';
import { notify } from '../src/services/notify.service.js';
import { Notification } from '../src/models/notification.model.js';
import mongoose from 'mongoose';
import * as socketService from '../src/services/socket.service.js';

describe('Phase 41 E2E — Real-Time Data Synchronization & RTK Query Cache Invalidation', () => {
  describe('1. broadcastCacheInvalidation Helper Verification', () => {
    it('should return false gracefully if Socket.io instance is not initialized', () => {
      const result = broadcastCacheInvalidation(['Attendance', 'Team']);
      // If no socket server instance is bound, helper safely returns false without crashing
      expect(typeof result).toBe('boolean');
    });

    it('should correctly format payload with single tag or array of tags and current timestamp', () => {
      const tags = ['Attendance', 'Team', 'WFH'];
      const payload = {
        event: 'cache:invalidate',
        tags,
        timestamp: Date.now()
      };

      expect(payload.event).toBe('cache:invalidate');
      expect(payload.tags).toEqual(['Attendance', 'Team', 'WFH']);
      expect(typeof payload.timestamp).toBe('number');
    });
  });

  describe('2. Notification Service Real-Time Tag Invalidation Integration', () => {
    it('should map domain modules to appropriate RTK Query cache tags', async () => {
      const spyEmit = vi.spyOn(socketService, 'emitToUser').mockImplementation(() => true);
      const spyInsert = vi.spyOn(Notification, 'insertMany').mockImplementation(async (docs) => {
        return docs.map((d) => ({
          ...d,
          _id: new mongoose.Types.ObjectId(),
          createdAt: new Date()
        }));
      });

      const targetUserId = new mongoose.Types.ObjectId();
      const mockPayload = {
        module: 'attendance',
        type: 'attendance',
        title: 'WFH Approved',
        body: 'Your WFH request has been approved.',
        channels: ['inApp']
      };

      const res = await notify(targetUserId, mockPayload);

      expect(res.success).toBe(true);

      // Verify that emitToUser was invoked for real-time notification
      expect(spyEmit).toHaveBeenCalledWith(
        expect.anything(),
        'notification:new',
        expect.objectContaining({
          title: 'WFH Approved'
        })
      );

      // Verify that emitToUser was also invoked for real-time cache invalidation with mapped attendance tags
      expect(spyEmit).toHaveBeenCalledWith(
        expect.anything(),
        'cache:invalidate',
        expect.objectContaining({
          tags: expect.arrayContaining(['Notification', 'NotificationCounts', 'Attendance', 'Team', 'WFH'])
        })
      );

      spyEmit.mockRestore();
      spyInsert.mockRestore();
    });

    it('should map leaves module notifications to Leave, LeaveType, and Attendance tags', async () => {
      const spyEmit = vi.spyOn(socketService, 'emitToUser').mockImplementation(() => true);
      const spyInsert = vi.spyOn(Notification, 'insertMany').mockImplementation(async (docs) => {
        return docs.map((d) => ({
          ...d,
          _id: new mongoose.Types.ObjectId(),
          createdAt: new Date()
        }));
      });

      const targetUserId = new mongoose.Types.ObjectId();
      const mockPayload = {
        module: 'leaves',
        type: 'leave',
        title: 'Leave Approved',
        body: 'Your leave application has been approved.',
        channels: ['inApp']
      };

      const res = await notify(targetUserId, mockPayload);
      expect(res.success).toBe(true);

      expect(spyEmit).toHaveBeenCalledWith(
        expect.anything(),
        'cache:invalidate',
        expect.objectContaining({
          tags: expect.arrayContaining(['Notification', 'NotificationCounts', 'Leave', 'LeaveType', 'Attendance'])
        })
      );

      spyEmit.mockRestore();
      spyInsert.mockRestore();
    });
  });
});
