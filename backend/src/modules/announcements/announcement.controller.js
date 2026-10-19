/**
 * @file announcement.controller.js
 * @description HTTP Request Handlers for Announcements (Module M8 / Slices 8.6, 8.7, 8.8).
 */

import { announcementService } from './announcement.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAnnouncements = asyncHandler(async (req, res) => {
  const result = await announcementService.getAnnouncements(
    req.query,
    req.user,
    req.permissionScope || 'own'
  );

  res.status(200).json({
    success: true,
    data: result.announcements,
    pagination: result.pagination
  });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(
    req.body,
    req.user,
    req.permissionScope || 'own'
  );

  res.status(201).json({
    success: true,
    message: 'Announcement published successfully',
    data: announcement
  });
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.updateAnnouncement(
    req.params.id,
    req.body,
    req.user,
    req.permissionScope || 'own'
  );

  res.status(200).json({
    success: true,
    message: 'Announcement updated successfully',
    data: announcement
  });
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const result = await announcementService.deleteAnnouncement(
    req.params.id,
    req.user,
    req.permissionScope || 'own'
  );

  res.status(200).json({
    success: true,
    message: result.message
  });
});

export const togglePinAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.togglePinAnnouncement(
    req.params.id,
    req.body.pinned,
    req.user,
    req.permissionScope || 'own'
  );

  res.status(200).json({
    success: true,
    message: req.body.pinned ? 'Announcement pinned to notice board' : 'Announcement unpinned',
    data: announcement
  });
});

export const recordReadReceipt = asyncHandler(async (req, res) => {
  const result = await announcementService.recordReadReceipt(
    req.params.id,
    req.user._id
  );

  res.status(200).json({
    success: true,
    data: result
  });
});

export const getReadReceipts = asyncHandler(async (req, res) => {
  const result = await announcementService.getReadReceipts(
    req.params.id,
    req.user,
    req.permissionScope || 'own'
  );

  res.status(200).json({
    success: true,
    data: result
  });
});
