import fs from 'fs';
import path from 'path';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../config/cloudinary.js';

/**
 * Saves a base64 image data URI to Cloudinary (if configured) or local server disk storage.
 * Returns the public web-accessible URL (e.g. https://res.cloudinary.com/... or /uploads/...).
 * If data is already a URL or empty, returns it as-is.
 * 
 * @param {string} base64Data - e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 * @param {string} subDirectory - e.g. "faces" or "attendance"
 * @param {string} [prefix='img'] - Filename prefix (e.g. userId or employeeId)
 * @returns {Promise<string|null>} - e.g. "https://res.cloudinary.com/..." or "/uploads/faces/enroll_6ae0_1730645.jpg"
 */
export const saveBase64Image = async (base64Data, subDirectory = 'faces', prefix = 'img') => {
  if (!base64Data || typeof base64Data !== 'string') return null;

  // If it's already an absolute http/https URL, return as-is
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  // If it's a relative URL (like /uploads/...), return as-is
  if (!base64Data.startsWith('data:image/')) {
    return base64Data;
  }

  // Parse mime type and base64 payload
  const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    return null;
  }

  const rawExt = matches[1].toLowerCase();
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const buffer = Buffer.from(matches[2], 'base64');

  // 1. Prefer Cloudinary for cloud persistence across all production hosts (Vercel, Render, etc.)
  if (isCloudinaryConfigured()) {
    try {
      const publicId = `${prefix}_${Date.now()}`;
      const cloudRes = await uploadBufferToCloudinary(buffer, {
        folder: `hrm/${subDirectory}`,
        resource_type: 'image',
        public_id: publicId
      });
      if (cloudRes?.secure_url) {
        return cloudRes.secure_url;
      }
    } catch (err) {
      console.error('[fileStorage] Cloudinary upload fallback to disk:', err.message);
    }
  }

  // 2. Local fallback for offline/development environments
  try {
    const uploadDir = path.resolve(process.cwd(), 'uploads', subDirectory);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    // Return web-accessible static path
    return `/uploads/${subDirectory}/${filename}`;
  } catch (err) {
    console.error('[fileStorage] Local disk write error:', err.message);
    return null;
  }
};
