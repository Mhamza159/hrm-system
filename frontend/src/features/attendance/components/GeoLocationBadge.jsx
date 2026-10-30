/**
 * @file GeoLocationBadge.jsx
 * @description Status badge visualizing GPS proximity, geofence status, and signal accuracy.
 *
 * SPECIFICATION:
 * - Module: M14 (BUILD-GUIDE Section 17 · Row 14.2)
 */

import React from 'react';
import { MapPin, AlertTriangle, ShieldCheck, Navigation, Signal } from 'lucide-react';

export const GeoLocationBadge = ({
  location,
  distanceFromOffice,
  isFlagged,
  flagReason,
  isFieldVisit,
  className = ''
}) => {
  if (!location && !distanceFromOffice && !isFlagged) {
    return null;
  }

  // 1. Client Site Field Visit
  if (isFieldVisit) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ${className}`}
      >
        <Navigation className="w-3.5 h-3.5 text-blue-500" />
        Client Site Visit
      </span>
    );
  }

  // 2. Mock GPS or Weak Accuracy
  if (flagReason === 'mock_gps') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
        Mock GPS Detected
      </span>
    );
  }

  if (flagReason === 'low_accuracy' || (location?.accuracy && location.accuracy > 100)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${className}`}
      >
        <Signal className="w-3.5 h-3.5 text-amber-500" />
        Low Accuracy (±{location?.accuracy || '>100'}m)
      </span>
    );
  }

  // 3. Geofence Boundary Status
  if (isFlagged || flagReason === 'geofence_violation') {
    const distText = distanceFromOffice ? ` (${Math.round(distanceFromOffice)}m away)` : '';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        Out of Bounds{distText}
      </span>
    );
  }

  // 4. Normal Inside Office Perimeter
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
      Inside Office Fence {distanceFromOffice ? `(~${Math.round(distanceFromOffice)}m)` : ''}
    </span>
  );
};

