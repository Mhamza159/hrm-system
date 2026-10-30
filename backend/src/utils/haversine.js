/**
 * @file haversine.js
 * @description Haversine Great-Circle Spherical Distance Calculator (Module M14 / BUILD-GUIDE Row 14.1).
 * 
 * SPECIFICATION & INVARIANTS:
 * - Module: M14 GPS / Geo-fencing
 * - Spherical Earth radius: R = 6,371,000 meters (WGS84 mean spherical radius).
 * - Deterministic: Returns distance in meters as a floating point number rounded to 2 decimal places.
 * - Coordinates: Latitude [-90, +90], Longitude [-180, +180].
 */

/**
 * Converts decimal degrees to radians.
 * @param {number} deg - Value in degrees
 * @returns {number} Value in radians
 */
export const toRadians = (deg) => (deg * Math.PI) / 180;

/**
 * Calculates the great-circle distance between two geographical points on Earth using the Haversine formula.
 * 
 * @param {number} lat1 - Latitude of Point 1 in decimal degrees
 * @param {number} lon1 - Longitude of Point 1 in decimal degrees
 * @param {number} lat2 - Latitude of Point 2 in decimal degrees
 * @param {number} lon2 - Longitude of Point 2 in decimal degrees
 * @returns {number} Distance in meters rounded to 2 decimal places
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  // Edge Case: Identical coordinates
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const R = 6371000; // Earth mean radius in meters
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  // Math.min guard against IEEE-754 floating point precision overflow (> 1.0)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  const distanceMeters = R * c;
  return Math.round(distanceMeters * 100) / 100;
};

/**
 * Checks if a coordinate pair falls within a given geofence radius.
 * 
 * @param {number} userLat - User latitude
 * @param {number} userLon - User longitude
 * @param {number} targetLat - Target center latitude
 * @param {number} targetLon - Target center longitude
 * @param {number} radiusMeters - Geofence boundary radius in meters
 * @returns {{ isInside: boolean, distanceMeters: number }}
 */
export const isWithinGeofence = (userLat, userLon, targetLat, targetLon, radiusMeters) => {
  const distanceMeters = calculateHaversineDistance(userLat, userLon, targetLat, targetLon);
  return {
    isInside: distanceMeters <= radiusMeters,
    distanceMeters
  };
};

