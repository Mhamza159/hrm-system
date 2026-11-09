/**
 * @file chat.routes.js
 * @description Express Router for Module M24: Internal Chat (BUILD-GUIDE Section 29).
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as chatController from './chat.controller.js';
import * as v from './chat.validation.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const router = Router();

// All chat endpoints require JWT authentication
router.use(authenticate);

// 0. Attachment upload endpoint
router.post(
  '/chat/upload',
  checkPermission('chat.access', 'Chat'),
  upload.single('file'),
  chatController.uploadAttachment
);

// 1. Search messages across accessible conversations
router.get(
  '/messages/search',
  checkPermission('chat.access', 'Chat'),
  validate(v.searchMessagesSchema),
  chatController.searchMessages
);

// 2. Department channel auto-sync
router.get(
  '/conversations/sync-department',
  checkPermission('chat.access', 'Chat'),
  chatController.syncDepartmentChannel
);

// 3. Conversation listing & creation
router
  .route('/conversations')
  .get(
    checkPermission('chat.access', 'Chat'),
    chatController.getConversations
  )
  .post(
    checkPermission('chat.access', 'Chat'),
    validate(v.createConversationSchema),
    chatController.createConversation
  );

// 4. Single conversation details
router.get(
  '/conversations/:id',
  checkPermission('chat.access', 'Chat'),
  validate(v.idParamSchema),
  chatController.getConversation
);

// 5. Group participant management
router.patch(
  '/conversations/:id/participants',
  checkPermission('chat.create_group', 'Chat'),
  validate(v.modifyParticipantsSchema),
  chatController.modifyParticipants
);

// 6. Super Admin channel archival
router.patch(
  '/conversations/:id/archive',
  checkPermission('chat.archive', 'Chat'),
  validate(v.idParamSchema),
  chatController.archiveConversation
);

// 7. Message stream & message dispatch
router
  .route('/conversations/:id/messages')
  .get(
    checkPermission('chat.access', 'Chat'),
    validate(v.listMessagesSchema),
    chatController.getMessages
  )
  .post(
    checkPermission('chat.access', 'Chat'),
    validate(v.sendMessageSchema),
    chatController.sendMessage
  );

// 8. Read receipt acknowledgment
router.patch(
  '/conversations/:id/read',
  checkPermission('chat.access', 'Chat'),
  validate(v.idParamSchema),
  chatController.markConversationAsRead
);

export default router;
