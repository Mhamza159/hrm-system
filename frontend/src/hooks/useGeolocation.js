/**
 * @file useGeolocation.js
 * @description Hook for capturing browser GPS location strictly upon user interaction.
 *
 * SPECIFICATION & PRIVACY GUARANTEE:
 * - Module M14 (BUILD-GUIDE Section 17 · Rows 14.2, 14.3, 14.8)
 * - Zero continuous tracking: GPS is accessed ONLY when getLocation() is invoked on punch button click.
 */

import { useState, useCallback } from 'react';

export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  const getLocation = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!isSupported) {
          const err = new Error('Geolocation is not supported by your browser or environment.');
          setError(err.message);
          return reject(err);
        }

        setLoading(true);
        setError(null);

        const geoOptions = {
          enableHighAccuracy: true,
          timeout: options.timeout || 10000,
          maximumAge: 0,
          ...options
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: Math.round(position.coords.accuracy),
              altitude: position.coords.altitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp
            };

            setLocation(coords);
            setLoading(false);
            resolve(coords);
          },
          (geoErr) => {
            let message = 'Unable to retrieve location.';
            if (geoErr.code === geoErr.PERMISSION_DENIED) {
              message = 'Location access was denied. Please allow location permissions to punch attendance.';
            } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
              message = 'Location information is currently unavailable.';
            } else if (geoErr.code === geoErr.TIMEOUT) {
              message = 'Location request timed out. Please check GPS signal.';
            }

            setError(message);
            setLoading(false);
            reject(new Error(message));
          },
          geoOptions
        );
      }),
    [isSupported, options]
  );

  const isLowAccuracy = location ? location.accuracy > 100 : false;

  return {
    isSupported,
    location,
    loading,
    error,
    isLowAccuracy,
    getLocation,
    clearError: () => setError(null)
  };
};
