/**
 * @file notification.service.js
 * @description Domain Business Logic for Notifications & User Channel Preferences (Module M8 / Slice 8.2 & 8.5).
 */

import mongoose from 'mongoose';
import { Notification } from '../../models/notification.model.js';
import { User } from '../../models/user.model.js';
import { ApiError } from '../../utils/apiError.js';

/**
 * Retrieve paginated notifications and unread summary for authenticated user
 * @param {string|import('mongoose').Types.ObjectId} userId 
 * @param {Object} query 
 * @returns {Promise<Object>}
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = 'false', type } = {}) => {
  const filter = {
    userId: new mongoose.Types.ObjectId(userId)
  };

  if (unreadOnly === 'true' || unreadOnly === true) {
    filter.isRead = false;
  }

  if (type) {
    filter.type = type;
  }

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  // Execute parallel queries for items, filtered total, and total unread badge count
  const [items, totalFiltered, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), isRead: false })
  ]);

  return {
    items,
    total: totalFiltered,
    unreadCount,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(totalFiltered / parsedLimit) || 1
  };
};

/**
 * Mark a single notification as read
 * @param {string} notificationId 
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const markAsRead = async (notificationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, 'Invalid notification ID format');
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    userId: new mongoose.Types.ObjectId(userId)
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found or access denied');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

/**
 * Mark all unread notifications as read for current user
 * @param {string} userId 
 * @returns {Promise<{ modifiedCount: number }>}
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );

  return {
    modifiedCount: result.modifiedCount || 0
  };
};

/**
 * Retrieve user notification channel preferences
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const getPreferences = async (userId) => {
  const user = await User.findById(userId, 'notificationPrefs').lean();
  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  const defaultPrefs = {
    attendance: { inApp: true, email: true, whatsapp: false },
    leave: { inApp: true, email: true, whatsapp: false },
    payroll: { inApp: true, email: true, whatsapp: false },
    announcement: { inApp: true, email: true, whatsapp: false }
  };

  return user.notificationPrefs || defaultPrefs;
};

/**
 * Update user notification channel preferences
 * @param {string} userId 
 * @param {Object} prefs 
 * @returns {Promise<Object>}
 */
export const updatePreferences = async (userId, prefs) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  const currentPrefs = user.notificationPrefs || {};
  const mergedPrefs = {
    attendance: { ...(currentPrefs.attendance || { inApp: true, email: true, whatsapp: false }), ...(prefs.attendance || {}) },
    leave: { ...(currentPrefs.leave || { inApp: true, email: true, whatsapp: false }), ...(prefs.leave || {}) },
    payroll: { ...(currentPrefs.payroll || { inApp: true, email: true, whatsapp: false }), ...(prefs.payroll || {}) },
    announcement: { ...(currentPrefs.announcement || { inApp: true, email: true, whatsapp: false }), ...(prefs.announcement || {}) }
  };

  user.set('notificationPrefs', mergedPrefs);
  user.markModified('notificationPrefs');
  await user.save();

  return user.notificationPrefs;
};
