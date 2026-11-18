/**
 * @file notification.model.js
 * @description Mongoose Data Model for Real-Time & Operational Notifications (Module M8 / Slice 8.1).
 * 
 * DESIGN RATIONALE & ARCHITECTURAL INVARIANTS:
 * 1. Single Source of Alert Persistence: Har user ke alerts is collection mein store hotay hain.
 * 2. High-Performance Compound Indexing: `{ userId: 1, isArchived: 1, isRead: 1, createdAt: -1 }` ensures that
 *    topbar unread count queries, slide-out drawer fetches, and module rollups execute in single-digit milliseconds.
 * 3. Automated 90-Day Lifecycle Purging (TTL): MongoDB automatically removes notifications older than
 *    90 days using the `{ expireAfterSeconds: 7776000 }` index, preventing boundless database bloat.
 * 4. Strict Typing & Allowed Categories: Comprehensive support across all 16 HRMS modules.
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // The recipient user who owns this notification (alert ka maalik user)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient userId is mandatory'],
      index: true
    },
    // Category domain to apply appropriate iconography and filtering (notification ki category)
    type: {
      type: String,
      enum: {
        values: [
          'system',
          'attendance',
          'leave',
          'payroll',
          'loan',
          'expense',
          'asset',
          'onboarding',
          'performance',
          'project',
          'announcement',
          'security',
          'profile',
          'recruitment',
          'employees',
          'leaves',
          'loans',
          'expenses',
          'assets',
          'projects',
          'lifecycle',
          'policies',
          'policy',
          'announcements',
          'rewards',
          'feedback',
          'grievance',
          'chat',
          'attrition',
          'reports',
          'settings',
          'timesheet',
          'appraisal',
          'kudos',
          'celebration'
        ],
        message: '{VALUE} is not a valid notification category'
      },
      default: 'system',
      index: true
    },
    // Explicit source module classification for high-performance module filtering & sidebar rollups
    module: {
      type: String,
      enum: {
        values: [
          'system',
          'recruitment',
          'employees',
          'attendance',
          'leaves',
          'payroll',
          'loans',
          'expenses',
          'assets',
          'projects',
          'performance',
          'lifecycle',
          'policies',
          'policy',
          'announcements',
          'rewards',
          'feedback',
          'grievance',
          'chat',
          'attrition',
          'reports',
          'settings',
          'timesheet',
          'appraisal',
          'kudos',
          'celebration'
        ],
        message: '{VALUE} is not a valid module'
      },
      default: 'system',
      index: true
    },
    // Priority severity tier (urgent, high, normal, low)
    priority: {
      type: String,
      enum: {
        values: ['low', 'normal', 'high', 'urgent'],
        message: '{VALUE} is not a valid notification priority'
      },
      default: 'normal',
      index: true
    },
    // Concise notification headline (mukhtasir unwan)
    title: {
      type: String,
      required: [true, 'Notification title is mandatory'],
      trim: true,
      maxlength: [150, 'Notification title cannot exceed 150 characters']
    },
    // Detailed alert message body (alert ka tafseeli paighaam)
    body: {
      type: String,
      required: [true, 'Notification body message is mandatory'],
      trim: true,
      maxlength: [500, 'Notification body cannot exceed 500 characters']
    },
    // Optional internal navigational route to take action on click (e.g. /leaves/approvals/123)
    link: {
      type: String,
      default: null,
      trim: true
    },
    // Read status flag for badge counters and drawer highlighting (parha gaya ya nahi)
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    // Exact timestamp when user acknowledged the notification (parhne ka waqt)
    readAt: {
      type: Date,
      default: null
    },
    // Soft archival flag for notification center lifecycle management
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    // Timestamp when notification was archived
    archivedAt: {
      type: Date,
      default: null
    },
    // Arbitrary metadata payload (e.g. { leaveId, actorId, previousStatus })
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  {
    timestamps: true // Automatically generates createdAt and updatedAt in UTC
  }
);

// High-speed compound indexes for unread count checks, drawer fetches & module-wise aggregation
notificationSchema.index({ userId: 1, isArchived: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isArchived: 1, module: 1, isRead: 1 });
notificationSchema.index({ userId: 1, isArchived: 1, type: 1, isRead: 1 });

// Automated MongoDB TTL (Time-To-Live) index: Purges alerts older than 90 days (90 * 24 * 60 * 60 seconds)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model('Notification', notificationSchema);
