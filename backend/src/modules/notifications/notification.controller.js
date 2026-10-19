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

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  return res.status(200).json(
    apiResponse(200, result, 'All notifications marked as read')
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
