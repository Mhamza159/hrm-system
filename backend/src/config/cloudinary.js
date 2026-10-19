/**
 * @file cloudinary.js
 * @description Cloudinary Media Storage Configuration & Stream Helpers.
 * 
 * Provides unified cloud upload and management for:
 * - Company logos
 * - Employee profile pictures
 * - Employee document vault (PDFs, images)
 * 
 * Includes automated fallback to local disk storage if Cloudinary
 * credentials are not configured in .env.
 */

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

// Determine if valid Cloudinary credentials are provided
export const isCloudinaryConfigured = () => {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('[Cloudinary] SDK configured successfully for cloud media storage.');
}


/**
 * Upload a memory buffer stream to Cloudinary
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {Object} options - Upload options (folder, resource_type, public_id, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary is not configured with valid environment credentials.'));
    }

    const uploadOptions = {
      resource_type: options.resource_type || 'auto',
      folder: options.folder || 'hrm_uploads',
      use_filename: true,
      unique_filename: true,
      ...options
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(buffer);
  });
};

/**
 * Remove an asset from Cloudinary
 * @param {string} publicId - Cloudinary asset public ID
 * @param {string} resourceType - 'image' | 'raw' | 'video'
 * @returns {Promise<Object>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured() || !publicId) {
    return null;
  }
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`[Cloudinary] Failed to delete asset ${publicId}: ${error.message}`);
    return null;
  }
};

export default cloudinary;
