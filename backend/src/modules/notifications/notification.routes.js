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

// 1. Fetch paginated notifications with unread counter
router.get(
  '/',
  checkPermission('notification.view'),
  validate(getNotificationsQuerySchema),
  notificationController.getNotifications
);

// 2. Mark single notification as read
router.patch(
  '/:id/read',
  checkPermission('notification.view'),
  notificationController.markRead
);

// 3. Mark all notifications as read for current user
router.patch(
  '/read-all',
  checkPermission('notification.view'),
  notificationController.markAllRead
);

// 4. Retrieve user notification channel preferences
router.get(
  '/preferences',
  checkPermission('notification.view'),
  notificationController.getPreferences
);

// 5. Update user notification channel preferences
router.patch(
  '/preferences',
  checkPermission('notification.view'),
  validate(updatePreferencesSchema),
  notificationController.updatePreferences
);

export default router;
