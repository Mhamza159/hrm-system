/**
 * @file file.routes.js
 * @description Router for signed file URL generation and verified streaming.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.6 Ephemeral Signed File Streaming
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as fileController from './file.controller.js';

const router = Router();

// Ephemeral signed URL minting (requires authenticated session)
router.get('/signed-url', authenticate, fileController.getSignedUrl);

// Publicly accessible via verified HMAC signature and expiry timestamp
router.get('/download', fileController.downloadFile);

export default router;
