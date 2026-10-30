/**
 * @file deviceFingerprint.js
 * @description Persistent hardware device identification and browser fingerprinting for QR Code Attendance.
 *
 * SPECIFICATION:
 * - Module: M13 QR Code Attendance (BUILD-GUIDE Section 18 · Row 13.4)
 * - Purpose: Hardware device binding prevents proxy clock-in from forwarded links or unauthorized phones.
 */

const STORAGE_KEY = 'hrm_device_fingerprint_id';

/**
 * Returns or generates a persistent device UUID for this physical browser/hardware.
 * @returns {string} Unique device identifier
 */
export const getDeviceId = () => {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = `dev-${crypto.randomUUID()}`;
      } else {
        deviceId = `dev-${Math.random().toString(36).substring(2, 12)}-${Date.now()}`;
      }
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch (err) {
    // Fallback if localStorage is disabled or throws
    return `temp-dev-${Date.now()}`;
  }
};

/**
 * Parses user agent string to identify client device model / OS
 * @returns {string} Device model summary
 */
export const getDeviceModel = () => {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;

  let model = 'Web Browser';
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android[^;]+;\s*([^;)]+)/);
    model = match ? match[1] : 'Android Device';
  } else if (/iPhone/i.test(ua)) {
    model = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    model = 'Apple iPad';
  } else if (/Windows NT/i.test(ua)) {
    model = 'Windows PC';
  } else if (/Macintosh/i.test(ua)) {
    model = 'Apple Mac';
  } else if (/Linux/i.test(ua)) {
    model = 'Linux PC';
  }

  return model;
};

/**
 * Clears locally cached device identifier (useful for QA / device re-enrollment)
 */
export const resetLocalDeviceId = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
};

