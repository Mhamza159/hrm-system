/**
 * @file announcement.routes.js
 * @description Express REST API Routes for Broadcast & Department Announcements (Module M8).
 */

import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
  recordReadReceipt,
  getReadReceipts
} from './announcement.controller.js';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  queryAnnouncementSchema,
  pinAnnouncementSchema
} from './announcement.validation.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';

const router = Router();

// All announcement routes require active user authentication
router.use(authenticate);

router
  .route('/')
  .get(
    checkPermission('announcement.view'),
    validate(queryAnnouncementSchema),
    getAnnouncements
  )
  .post(
    checkPermission('announcement.create'),
    validate(createAnnouncementSchema),
    createAnnouncement
  );

router
  .route('/:id')
  .put(
    checkPermission('announcement.edit'),
    validate(updateAnnouncementSchema),
    updateAnnouncement
  )
  .delete(
    checkPermission('announcement.delete'),
    deleteAnnouncement
  );

router
  .route('/:id/pin')
  .patch(
    checkPermission('announcement.pin'),
    validate(pinAnnouncementSchema),
    togglePinAnnouncement
  );

router
  .route('/:id/read')
  .patch(
    checkPermission('announcement.view'),
    recordReadReceipt
  );

router
  .route('/:id/receipts')
  .get(
    checkPermission('announcement.view'),
    getReadReceipts
  );

export default router;
