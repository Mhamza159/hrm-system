/**
 * @file file.controller.js
 * @description Controller for signed file downloads and ephemeral URL minting.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.6 Ephemeral Signed File Streaming
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { generateSignedFileUrl, verifySignedFileUrl } from './file.service.js';

/**
 * Mint an ephemeral signed URL for an authorized asset
 * GET /api/v1/files/signed-url?path=uploads/documents/example.pdf
 */
export const getSignedUrl = asyncHandler(async (req, res) => {
  const { path: rawPath, expiresIn } = req.query;

  if (!rawPath) {
    throw new ApiError(400, 'File path is required');
  }

  const duration = expiresIn ? parseInt(expiresIn, 10) : 300;
  const signedUrl = generateSignedFileUrl(rawPath, duration);

  res.status(200).json({
    success: true,
    data: {
      url: signedUrl,
      expiresIn: duration
    }
  });
});

/**
 * Stream file if HMAC signature and expiration timestamp are valid
 * GET /api/v1/files/download?path=...&expires=...&sig=...
 */
export const downloadFile = asyncHandler(async (req, res) => {
  const { path: rawPath, expires, sig } = req.query;

  const verification = verifySignedFileUrl(rawPath, expires, sig);

  if (!verification.valid) {
    throw new ApiError(verification.status, verification.message);
  }

  // Securely stream the file attachment with proper content-disposition
  res.sendFile(verification.resolvedPath);
});
