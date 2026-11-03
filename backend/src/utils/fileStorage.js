import fs from 'fs';
import path from 'path';

/**
 * Saves a base64 image data URI to server disk storage and returns the public static URL.
 * If data is already a URL or empty, returns it as-is.
 * 
 * @param {string} base64Data - e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 * @param {string} subDirectory - e.g. "faces" or "attendance"
 * @param {string} [prefix='img'] - Filename prefix (e.g. userId or employeeId)
 * @returns {string|null} - e.g. "/uploads/faces/enroll_6ae0_1730645.jpg"
 */
export const saveBase64Image = (base64Data, subDirectory = 'faces', prefix = 'img') => {
  if (!base64Data || typeof base64Data !== 'string') return null;

  // If it's already a relative URL or http URL, return as-is
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

  const uploadDir = path.resolve(process.cwd(), 'uploads', subDirectory);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, buffer);

  // Return web-accessible static path
  return `/uploads/${subDirectory}/${filename}`;
};

