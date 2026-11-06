/**
 * @file networkMonitor.js
 * @description Real-time network telemetry and slow-connection monitor.
 * Detects 2G/3G throttled environments, packet delays, and request latency spikes (> 2500ms).
 */

const LATENCY_SLOW_THRESHOLD_MS = 2500;

/**
 * Get current Network Information API snapshot if supported by browser
 * @returns {{ effectiveType: string, rtt: number, downlink: number, isSlow: boolean }}
 */
export function getNetworkInfo() {
  if (typeof navigator === 'undefined') {
    return { effectiveType: '4g', rtt: 50, downlink: 10, isSlow: false };
  }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) {
    return { effectiveType: 'unknown', rtt: 0, downlink: 0, isSlow: false };
  }

  const effectiveType = conn.effectiveType || '4g';
  const rtt = conn.rtt || 0;
  const downlink = conn.downlink || 10;
  const isSlow =
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    (effectiveType === '3g' && rtt > 1500) ||
    rtt >= LATENCY_SLOW_THRESHOLD_MS;

  return {
    effectiveType,
    rtt,
    downlink,
    saveData: Boolean(conn.saveData),
    isSlow
  };
}

/**
 * Subscribe to browser network connection change events
 * @param {Function} onChange - Callback receiving updated NetworkInfo
 * @returns {Function} Unsubscribe teardown
 */
export function subscribeNetworkQuality(onChange) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return () => {};
  }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return () => {};

  const handler = () => onChange(getNetworkInfo());
  conn.addEventListener('change', handler);

  return () => conn.removeEventListener('change', handler);
}

/**
 * Active request latency tracker
 */
class RequestLatencyTracker {
  constructor() {
    this.activeRequests = new Map();
    this.listeners = new Set();
    this.slowTriggerTimer = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify(state) {
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('[networkMonitor] Listener error:', err);
      }
    });
  }

  start(requestId = Math.random().toString(36).substring(2, 9)) {
    const start = performance.now();
    this.activeRequests.set(requestId, start);

    // If request takes longer than threshold, notify subscribers
    const timer = setTimeout(() => {
      if (this.activeRequests.has(requestId)) {
        this._notify({ isSlow: true, activeCount: this.activeRequests.size });
      }
    }, LATENCY_SLOW_THRESHOLD_MS);

    return {
      id: requestId,
      end: () => {
        clearTimeout(timer);
        this.activeRequests.delete(requestId);
        if (this.activeRequests.size === 0) {
          this._notify({ isSlow: false, activeCount: 0 });
        }
      }
    };
  }
}

export const latencyTracker = new RequestLatencyTracker();

