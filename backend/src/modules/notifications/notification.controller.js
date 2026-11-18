/**
 * @file notification.controller.js
 * @description Express Controller for Notification & Preference Operations (Module M8 / Slice 8.2 & 8.5).
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import * as notificationService from './notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user._id, req.query);
  return res.status(200).json(
    apiResponse(200, result, 'Notifications retrieved successfully', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      unreadCount: result.unreadCount,
      archivedCount: result.archivedCount,
      urgentCount: result.urgentCount,
      totalPages: result.totalPages
    })
  );
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.id, req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'Notification marked as read')
  );
});

export const markUnread = asyncHandler(async (req, res) => {
  const result = await notificationService.markAsUnread(req.params.id, req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'Notification marked as unread')
  );
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'All notifications marked as read')
  );
});

export const archiveNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.archiveNotification(req.params.id, req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'Notification archived successfully')
  );
});

export const unarchiveNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.unarchiveNotification(req.params.id, req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'Notification restored successfully')
  );
});

export const archiveAll = asyncHandler(async (req, res) => {
  const result = await notificationService.archiveAllNotifications(req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'All read notifications archived successfully')
  );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.id, req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'Notification deleted permanently')
  );
});

export const getPreferences = asyncHandler(async (req, res) => {
  const result = await notificationService.getPreferences(req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'Notification preferences retrieved successfully')
  );
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const result = await notificationService.updatePreferences(req.user._id, req.body);
  return res.status(200).json(
    apiResponse(200, result, 'Notification preferences updated successfully')
  );
});

export const getModuleCounts = asyncHandler(async (req, res) => {
  const result = await notificationService.getModuleNotificationCounts(req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'Module unread notification counts retrieved successfully')
  );
});

export const getUnreadSummary = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadSummaryByModule(req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'Unread notification summary retrieved successfully')
  );
});
