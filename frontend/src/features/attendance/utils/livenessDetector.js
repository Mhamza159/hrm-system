/**
 * @file livenessDetector.js
 * @description Real-time facial liveness verification using Eye Aspect Ratio (EAR) blink detection.
 * 
 * SPECIFICATION:
 * - Module M12 (BUILD-GUIDE Section 19 · Row 12.4)
 * - 68-point facial landmarks:
 *   Left eye: indices 36 to 41
 *   Right eye: indices 42 to 47
 */

export const calculatePointDistance = (p1, p2) => {
  if (!p1 || !p2) return 0;
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};

export const computeEyeAspectRatio = (eyePoints) => {
  if (!eyePoints || eyePoints.length < 6) return 0;
  // p0: outer/inner corner, p1: upper outer, p2: upper inner, p3: opposite corner, p4: lower inner, p5: lower outer
  const vertical1 = calculatePointDistance(eyePoints[1], eyePoints[5]);
  const vertical2 = calculatePointDistance(eyePoints[2], eyePoints[4]);
  const horizontal = calculatePointDistance(eyePoints[0], eyePoints[3]);

  if (horizontal === 0) return 0;
  return (vertical1 + vertical2) / (2.0 * horizontal);
};

/**
 * Extracts 6-point arrays for left and right eyes from 68 face landmarks
 */
export const getEyeLandmarksFrom68 = (landmarks) => {
  if (!landmarks) return { leftEye: null, rightEye: null };
  const positions = landmarks.positions || landmarks;
  if (!Array.isArray(positions) || positions.length < 68) {
    return { leftEye: null, rightEye: null };
  }

  const leftEye = positions.slice(36, 42);
  const rightEye = positions.slice(42, 48);

  return { leftEye, rightEye };
};

export const calculateMeanEAR = (landmarks) => {
  const { leftEye, rightEye } = getEyeLandmarksFrom68(landmarks);
  if (!leftEye || !rightEye) return 0;

  const earLeft = computeEyeAspectRatio(leftEye);
  const earRight = computeEyeAspectRatio(rightEye);
  return (earLeft + earRight) / 2.0;
};

/**
 * BlinkTracker Class
 * Stateful detector tracking transition from open -> closed -> open within realistic duration.
 */
export class BlinkTracker {
  constructor(options = {}) {
    this.closedThreshold = options.closedThreshold ?? 0.22;
    this.openThreshold = options.openThreshold ?? 0.28;
    this.minDurationMs = options.minDurationMs ?? 60;
    this.maxDurationMs = options.maxDurationMs ?? 1500;

    this.eyeClosedTime = null;
    this.isBlinkCompleted = false;
    this.lastEAR = 0.3;
  }

  reset() {
    this.eyeClosedTime = null;
    this.isBlinkCompleted = false;
    this.lastEAR = 0.3;
  }

  update(landmarks) {
    if (this.isBlinkCompleted) return true;

    const currentEAR = calculateMeanEAR(landmarks);
    this.lastEAR = currentEAR;
    const now = Date.now();

    if (currentEAR < this.closedThreshold) {
      if (!this.eyeClosedTime) {
        this.eyeClosedTime = now;
      }
    } else if (currentEAR >= this.openThreshold) {
      if (this.eyeClosedTime) {
        const closedDuration = now - this.eyeClosedTime;
        if (closedDuration >= this.minDurationMs && closedDuration <= this.maxDurationMs) {
          this.isBlinkCompleted = true;
          this.eyeClosedTime = null;
          return true;
        }
        // If duration was out of bounds, reset
        this.eyeClosedTime = null;
      }
    }

    return false;
  }

  isLive() {
    return this.isBlinkCompleted;
  }
}

