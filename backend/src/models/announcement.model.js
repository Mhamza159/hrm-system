/**
 * @file announcement.model.js
 * @description Mongoose Schema for Broadcast & Department Announcements (Module M8 / Slice 8.6 & 8.7).
 * 
 * SPECIFICATION & DATA INTEGRITY:
 * - Module: M8 Notifications & Announcements (BUILD-GUIDE Section 9 · Rows 8.6–8.8)
 * - Authorship: Linked to `authorId` (User).
 * - Target Audience: 'company' (all active employees) or 'department' (members of specific Department).
 * - Priority: 'low' | 'normal' | 'high' | 'urgent'.
 * - Pinned: boolean with max 3 active pinned notices across the system.
 * - Read Receipts: array of `{ userId, readAt }` for audience engagement analytics.
 * - Soft Deletion: `isDeleted` flag preserving historical audit integrity.
 */

import mongoose from 'mongoose';

const readReceiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      minlength: [5, 'Content must be at least 5 characters']
    },
    targetAudience: {
      type: String,
      enum: {
        values: ['company', 'department'],
        message: 'Target audience must be either company or department'
      },
      default: 'company',
      required: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'normal', 'high', 'urgent'],
        message: 'Priority must be low, normal, high, or urgent'
      },
      default: 'normal'
    },
    pinned: {
      type: Boolean,
      default: false
    },
    pinnedAt: {
      type: Date,
      default: null
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required']
    },
    readBy: [readReceiptSchema],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for performant notice board & target audience filtering
announcementSchema.index({ targetAudience: 1, departmentId: 1, isDeleted: 1, createdAt: -1 });
announcementSchema.index({ pinned: -1, createdAt: -1 });
announcementSchema.index({ 'readBy.userId': 1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
