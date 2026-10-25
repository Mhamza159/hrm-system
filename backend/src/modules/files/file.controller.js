/**
 * @file file.controller.js
 * @description Controller for signed file downloads and ephemeral URL minting.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.6 Ephemeral Signed File Streaming
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSignedFileUrl, verifySignedFileUrl } from './file.service.js';
import cloudinary, { isCloudinaryConfigured } from '../../config/cloudinary.js';

/**
 * Mint an ephemeral signed URL for an authorized asset
 * GET /api/v1/files/signed-url?path=uploads/documents/example.pdf
 */
export const getSignedUrl = asyncHandler(async (req, res) => {
  const { path: rawPath, expiresIn } = req.query;

  if (!rawPath) {
    throw new ApiError(400, 'File path is required');
  }

  const duration = expiresIn ? parseInt(expiresIn, 10) : 3600;

  // Handle Cloudinary URLs or public IDs directly
  if (rawPath.includes('cloudinary.com') || rawPath.startsWith('hrm/')) {
    let publicId = rawPath;
    let format = 'pdf';

    const uploadMatch = rawPath.match(/\/upload\/(?:v\d+\/)?([^?#]+)/);
    if (uploadMatch) {
      const fullPath = uploadMatch[1];
      const lastDot = fullPath.lastIndexOf('.');
      if (lastDot !== -1) {
        format = fullPath.substring(lastDot + 1);
        publicId = fullPath.substring(0, lastDot);
      } else {
        publicId = fullPath;
      }
    } else {
      const lastDot = rawPath.lastIndexOf('.');
      if (lastDot !== -1) {
        format = rawPath.substring(lastDot + 1);
        publicId = rawPath.substring(0, lastDot);
      }
    }

    if (isCloudinaryConfigured()) {
      const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + duration
      });

      return res.status(200).json({
        success: true,
        data: {
          url: downloadUrl,
          expiresIn: duration
        }
      });
    }
  }

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
