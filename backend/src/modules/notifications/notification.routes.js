/**
 * @file notification.routes.js
 * @description Express Router for Notifications & User Channel Preferences (Module M8 / Slice 8.2 & 8.5).
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as notificationController from './notification.controller.js';
import {
  getNotificationsQuerySchema,
  updatePreferencesSchema
} from './notification.validation.js';

const router = Router();

// All notification operations require authentication
router.use(authenticate);

// 1. Fetch paginated notifications with module and archive filters
router.get(
  '/',
  checkPermission('notification.view'),
  validate(getNotificationsQuerySchema),
  notificationController.getNotifications
);

// 1.1 Retrieve dynamic module unread counts for sidebar indicators & drawer badges
router.get(
  '/module-counts',
  checkPermission('notification.view'),
  notificationController.getModuleCounts
);

// 1.2 Legacy summary endpoint alias
router.get(
  '/unread-summary',
  checkPermission('notification.view'),
  notificationController.getUnreadSummary
);

// 2. Mark single notification as read
router.patch(
  '/:id/read',
  checkPermission('notification.view'),
  notificationController.markRead
);

// 2.1 Mark single notification as unread
router.patch(
  '/:id/unread',
  checkPermission('notification.view'),
  notificationController.markUnread
);

// 3. Mark all notifications as read for current user
router.patch(
  '/read-all',
  checkPermission('notification.view'),
  notificationController.markAllRead
);

// 4. Archive single notification
router.patch(
  '/:id/archive',
  checkPermission('notification.view'),
  notificationController.archiveNotification
);

// 4.1 Restore archived notification
router.patch(
  '/:id/unarchive',
  checkPermission('notification.view'),
  notificationController.unarchiveNotification
);

// 4.2 Archive all read notifications
router.patch(
  '/archive-all',
  checkPermission('notification.view'),
  notificationController.archiveAll
);

// 5. Delete notification permanently
router.delete(
  '/:id',
  checkPermission('notification.view'),
  notificationController.deleteNotification
);

// 6. Retrieve user notification channel preferences
router.get(
  '/preferences',
  checkPermission('notification.view'),
  notificationController.getPreferences
);

// 7. Update user notification channel preferences
router.patch(
  '/preferences',
  checkPermission('notification.view'),
  validate(updatePreferencesSchema),
  notificationController.updatePreferences
);

export default router;
