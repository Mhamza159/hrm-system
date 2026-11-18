/**
 * @file userAgentParser.js
 * @description Lightweight, dependency-free parser for User-Agent strings and client IP normalization.
 * Follows Ponytail senior dev principles: stdlib regex, zero external dependencies, robust edge-case handling.
 */

/**
 * Clean and normalize client IP address
 * @param {string} ip - Raw IP from req.ip or socket
 * @returns {string} Normalized IPv4 or IPv6 string
 */
export function normalizeIp(ip) {
  if (!ip || typeof ip !== 'string') return '127.0.0.1';
  let cleaned = ip.trim();

  // Strip IPv4-mapped IPv6 prefix (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
  if (cleaned.startsWith('::ffff:')) {
    cleaned = cleaned.substring(7);
  }

  // Map loopback IPv6 to readable loopback
  if (cleaned === '::1') {
    return '127.0.0.1';
  }

  return cleaned || '127.0.0.1';
}

/**
 * Parse raw user agent into structured client environment details
 * @param {string} userAgent - Raw User-Agent header string
 * @returns {{ browser: string, os: string, deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN' }}
 */
export function parseUserAgent(userAgent = '') {
  const ua = String(userAgent || '').trim();
  if (!ua) {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      deviceType: 'DESKTOP'
    };
  }

  const lower = ua.toLowerCase();

  // 1. Device Type Resolution
  let deviceType = 'DESKTOP';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'TABLET';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|windows phone|opera mini|iemobile/i.test(ua)) {
    deviceType = 'MOBILE';
  } else if (!/mozilla|chrome|safari|firefox|edge|opera|msie|trident/i.test(ua)) {
    deviceType = 'UNKNOWN';
  }

  // 2. Operating System Resolution
  let os = 'Unknown OS';
  if (/windows nt 10\.0/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/windows nt 6\.2/i.test(ua)) {
    os = 'Windows 8';
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/android/i.test(ua)) {
    const androidMatch = ua.match(/android\s+([0-9.]+)/i);
    os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const iosMatch = ua.match(/os\s+([0-9_]+)/i);
    const version = iosMatch ? iosMatch[1].replace(/_/g, '.') : '';
    os = version ? `iOS ${version}` : 'iOS';
  } else if (/mac os x/i.test(ua) || /macintosh/i.test(ua)) {
    const macMatch = ua.match(/mac os x\s+([0-9_]+)/i);
    const version = macMatch ? macMatch[1].replace(/_/g, '.') : '';
    os = version ? `macOS ${version}` : 'macOS';
  } else if (/cros/i.test(ua)) {
    os = 'Chrome OS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // 3. Browser Resolution (Order matters: Edge before Chrome, Chrome before Safari)
  let browser = 'Unknown Browser';
  if (/edg\/|edge\//i.test(ua)) {
    const m = ua.match(/edg[e]?\/([0-9.]+)/i);
    browser = m ? `Edge ${m[1].split('.')[0]}` : 'Edge';
  } else if (/opr\/|opera/i.test(ua)) {
    const m = ua.match(/(?:opr|opera)\/([0-9.]+)/i);
    browser = m ? `Opera ${m[1].split('.')[0]}` : 'Opera';
  } else if (/samsungbrowser/i.test(ua)) {
    const m = ua.match(/samsungbrowser\/([0-9.]+)/i);
    browser = m ? `Samsung Browser ${m[1].split('.')[0]}` : 'Samsung Browser';
  } else if (/chrome|crios/i.test(ua)) {
    const m = ua.match(/(?:chrome|crios)\/([0-9.]+)/i);
    browser = m ? `Chrome ${m[1].split('.')[0]}` : 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    const m = ua.match(/(?:firefox|fxios)\/([0-9.]+)/i);
    browser = m ? `Firefox ${m[1].split('.')[0]}` : 'Firefox';
  } else if (/version\/[0-9.]+\s+safari/i.test(ua) || (lower.includes('safari') && !lower.includes('chrome'))) {
    const m = ua.match(/version\/([0-9.]+)/i);
    browser = m ? `Safari ${m[1].split('.')[0]}` : 'Safari';
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  return {
    browser,
    os,
    deviceType
  };
}
