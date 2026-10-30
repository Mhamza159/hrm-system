/**
 * @file PunchLocationsMapPage.jsx
 * @description Interactive Punch Map View with Date Filters and Spatial Overview.
 *
 * SPECIFICATION:
 * - Module M14 (BUILD-GUIDE Section 17 · Row 14.7)
 */

import React, { useState } from 'react';
import {
  Map,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  Navigation,
  RefreshCw,
  Layers
} from 'lucide-react';
import { useGetPunchLocationsQuery } from '../attendanceApi.js';
import { PunchMap } from '../components/PunchMap.jsx';

export const PunchLocationsMapPage = () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetPunchLocationsQuery({
    date: selectedDate,
    onlyFlagged: onlyFlagged ? 'true' : undefined
  });

  const punches = data?.data?.punches || [];
  const officeGeofences = data?.data?.officeGeofences || [];

  const totalPunches = punches.length;
  const inBoundsCount = punches.filter((p) => !p.isFlagged && !p.isClientVisit).length;
  const flaggedCount = punches.filter((p) => p.isFlagged).length;
  const fieldCount = punches.filter((p) => p.isClientVisit).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Live Punch Locations Map
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual spatial audit of employee check-ins across designated office perimeters and client sites.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={onlyFlagged}
              onChange={(e) => setOnlyFlagged(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>Only Flagged Violations</span>
          </label>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh Map Points"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400">Total Punches on Map</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalPunches}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Inside Office Geofence
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{inBoundsCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Flagged Out-of-Bounds
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{flaggedCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5" /> Client Visits
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{fieldCount}</div>
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
              Inside Perimeter
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-white"></span>
              Flagged Violation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-white"></span>
              Client Visit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-500"></span>
              Office Radius Circle
            </span>
          </div>
          <span>Active Geofences: {officeGeofences.length}</span>
        </div>

        {isLoading ? (
          <div className="h-[520px] flex items-center justify-center text-slate-400">
            Loading map coordinates...
          </div>
        ) : (
          <PunchMap
            punches={punches}
            officeGeofences={officeGeofences}
            height="520px"
          />
        )}
      </div>
    </div>
  );
};
export default PunchLocationsMapPage;

