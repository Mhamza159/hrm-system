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

  // Open a blank tab synchronously to prevent browser popup blockers from blocking async navigation
  let targetWindow = null;
  try {
    targetWindow = window.open('about:blank', '_blank');
  } catch {
    // Popup might be blocked, continue with fallback
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/files/signed-url?path=${encodeURIComponent(fileUrl)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const body = await res.json();
    if (body.success && body.data?.url) {
      if (targetWindow) {
        targetWindow.location.href = body.data.url;
      } else {
        window.open(body.data.url, '_blank', 'noopener,noreferrer');
      }
      return;
    }
  } catch (err) {
    console.error('Failed to obtain signed download URL:', err);
  }

  // Fallback
  if (targetWindow) {
    targetWindow.location.href = fileUrl;
  } else {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
}
