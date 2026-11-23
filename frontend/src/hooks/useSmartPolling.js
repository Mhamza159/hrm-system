/**
 * @file useSmartPolling.js
 * @description Visibility-Aware Smart Polling Hook for RTK Query Endpoints (Phase 41).
 * 
 * ARCHITECTURAL DESIGN & EFFICIENCY INVARIANTS:
 * 1. Bandwidth & Battery Preservation: Gracefully returns 0 (paused) whenever the document is hidden
 *    or the browser tab is blurred/inactive.
 * 2. Instant Rehydration: When the user switches back to the tab, immediately re-enables the specified
 *    polling interval, triggering a background sync without manual user intervention.
 * 3. SSR Safe: Safely falls back to static interval if `window` or `document` is undefined.
 */

import { useState, useEffect } from 'react';

/**
 * Returns an active polling interval in milliseconds when the page is visible, or 0 when hidden.
 * @param {number} [intervalMs=15000] - Polling interval in milliseconds while tab is active (default: 15s)
 * @returns {number} Active polling interval or 0
 */
export const useSmartPolling = (intervalMs = 15000) => {
  const [isActive, setIsActive] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsActive(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, []);

  return isActive ? intervalMs : 0;
};
