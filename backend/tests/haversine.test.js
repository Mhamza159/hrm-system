/**
 * @file haversine.test.js
 * @description Unit tests for Haversine Great-Circle Distance Calculator (Module M14 / Slice 14.1).
 */

import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, isWithinGeofence, toRadians } from '../src/utils/haversine.js';

describe('Module M14 — Haversine Distance Engine (BUILD-GUIDE Row 14.1)', () => {
  it('converts degrees to radians accurately', () => {
    expect(toRadians(0)).toBe(0);
    expect(toRadians(180)).toBeCloseTo(Math.PI, 6);
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 6);
  });

  it('returns exactly 0.00 meters for identical coordinates', () => {
    const karachiOfficeLat = 24.8607;
    const karachiOfficeLon = 67.0011;
    const distance = calculateHaversineDistance(karachiOfficeLat, karachiOfficeLon, karachiOfficeLat, karachiOfficeLon);
    expect(distance).toBe(0);
  });

  it('calculates distance between known Karachi landmark points with high precision', () => {
    // Karachi I.I. Chundrigar Road (24.8532, 67.0099) to Clifton Teen Talwar (24.8256, 67.0345)
    // Geodesic distance ~ 3,960 meters
    const dist = calculateHaversineDistance(24.8532, 67.0099, 24.8256, 67.0345);
    expect(dist).toBeGreaterThan(3900);
    expect(dist).toBeLessThan(4050);
  });

  it('verifies boundary geofence detection (inside vs outside)', () => {
    const officeLat = 24.8607;
    const officeLon = 67.0011;
    const radiusMeters = 100; // 100m office geofence

    // Point 1: ~30 meters away (Inside)
    const insideRes = isWithinGeofence(24.8609, 67.0012, officeLat, officeLon, radiusMeters);
    expect(insideRes.isInside).toBe(true);
    expect(insideRes.distanceMeters).toBeLessThan(100);

    // Point 2: ~1,500 meters away (Outside)
    const outsideRes = isWithinGeofence(24.8720, 67.0100, officeLat, officeLon, radiusMeters);
    expect(outsideRes.isInside).toBe(false);
    expect(outsideRes.distanceMeters).toBeGreaterThan(100);
  });

  it('handles antipodal coordinates and boundary precision limits safely', () => {
    const dist = calculateHaversineDistance(0, 0, 0, 180);
    // Half of Earth circumference ~ 20,015,087 meters
    expect(dist).toBeGreaterThan(20000000);
    expect(dist).toBeLessThan(20025000);
  });
});

