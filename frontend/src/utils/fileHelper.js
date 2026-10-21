/**
 * @file fileHelper.js
 * @description Helper utility to request ephemeral HMAC-signed URLs for sensitive files before opening.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.6 Ephemeral Signed File Streaming
 */

/**
 * Resolves a sensitive local file attachment URL into an ephemeral signed streaming URL.
 * If the URL is already an external URL (e.g. Cloudinary CDN), opens directly.
 * 
 * @param {string} fileUrl - Raw attachment or document URL (e.g. '/uploads/documents/doc-1.pdf')
 */
export async function openSecureFile(fileUrl) {
  if (!fileUrl) return;

  // External CDN links can be opened directly
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    // If it's a local /uploads path, obtain ephemeral HMAC signed link
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/files/signed-url?path=${encodeURIComponent(fileUrl)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const body = await res.json();
    if (body.success && body.data?.url) {
      window.open(body.data.url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.error('Failed to obtain signed download URL:', err);
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
}
