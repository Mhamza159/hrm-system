/**
 * @file PunchCardWidget.jsx
 * @description Interactive Digital Clock & Live Punch Card Action Widget with GPS Geo-fencing & Privacy Guarantee.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Rows 5.3, 5.4, 5.5)
 * - Module: M14 GPS / Geo-fencing (BUILD-GUIDE Section 17 · Rows 14.2, 14.3, 14.5, 14.8)
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Home,
  Laptop,
  MapPin,
  ShieldCheck,
  Navigation,
  Info,
  QrCode
} from 'lucide-react';
import {
  useGetMyAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useStartBreakMutation,
  useEndBreakMutation
} from '../attendanceApi.js';
import { AttendanceStatusBadge } from './AttendanceStatusBadge.jsx';
import { QrScannerModal } from './QrScannerModal.jsx';
import { FaceCheckInModal } from './FaceCheckInModal.jsx';
import { GeoLocationBadge } from './GeoLocationBadge.jsx';
import { useGeolocation } from '../../../hooks/useGeolocation.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { useGetSettingByKeyQuery } from '../../settings/settingsApi.js';

export const PunchCardWidget = ({ onActionSuccess }) => {
  const { can } = usePermission();
  const { isSuperAdmin } = useAuth();
  const { getLocation, loading: isLocating, error: geoError, clearError: clearGeoError } = useGeolocation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState('meal');
  const [actionError, setActionError] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDefaultAction, setQrDefaultAction] = useState('in');
  const { data: qrSettingRes } = useGetSettingByKeyQuery('qrAttendance');
  const isQrEnabled = qrSettingRes?.data?.value?.isEnabled !== false;
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const { data: faceSettingRes } = useGetSettingByKeyQuery('faceAttendance');
  const isFaceEnabled = faceSettingRes?.data?.value?.isEnabled !== false;

  // Field check-in state (14.5)
  const canFieldCheckIn = can('attendance.fieldCheckIn') || isSuperAdmin;
  const [isFieldVisit, setIsFieldVisit] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientRemarks, setClientRemarks] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const { data: attendanceData, isLoading, refetch } = useGetMyAttendanceQuery({ date: todayStr });

  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();
  const [startBreak, { isLoading: isStartingBreak }] = useStartBreakMutation();
  const [endBreak, { isLoading: isEndingBreak }] = useEndBreakMutation();

  // Live seconds ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayRecord = attendanceData?.data?.records?.find(
    (r) => new Date(r.date).toISOString().split('T')[0] === todayStr
  );

  const isClockedIn = Boolean(todayRecord?.checkIn);
  const isClockedOut = Boolean(todayRecord?.checkOut);
  const activeBreak = todayRecord?.breaks?.find((b) => b.endTime === null);
  const isOnBreak = Boolean(activeBreak);

  // Live timer since check-in
  const [elapsedDuration, setElapsedDuration] = useState('00:00:00');
  useEffect(() => {
    if (isClockedIn && !isClockedOut && todayRecord?.checkIn) {
      const calcElapsed = () => {
        const start = new Date(todayRecord.checkIn).getTime();
        const now = new Date().getTime();
        const diffMs = Math.max(0, now - start);
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setElapsedDuration(
          `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      };
      calcElapsed();
      const interval = setInterval(calcElapsed, 1000);
      return () => clearInterval(interval);
    } else if (todayRecord?.workDurationMinutes) {
      const h = Math.floor(todayRecord.workDurationMinutes / 60);
      const m = todayRecord.workDurationMinutes % 60;
      setElapsedDuration(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    }
  }, [isClockedIn, isClockedOut, todayRecord]);

  const handleCheckIn = async () => {
    setActionError('');
    clearGeoError();

    let punchLocation = null;
    try {
      // 14.8 Zero continuous tracking: query location exclusively on punch click
      const coords = await getLocation();
      punchLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        isMock: false
      };
    } catch (locErr) {
      // If location is denied or unavailable, proceed with warning or abort depending on strictness
      console.warn('Geolocation capture skipped or denied:', locErr.message);
    }

    if (isFieldVisit) {
      if (!clientName.trim()) {
        setActionError('Please enter the client / site name for field punch.');
        return;
      }
      punchLocation = {
        ...(punchLocation || {}),
        isClientVisit: true,
        clientName: clientName.trim(),
        clientRemarks: clientRemarks.trim()
      };
    }

    try {
      await checkIn({
        source: isFieldVisit ? 'field' : 'web',
        location: punchLocation
      }).unwrap();
      refetch();
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Failed to clock in');
    }
  };

  const handleCheckOut = async () => {
    setActionError('');
    clearGeoError();

    let punchLocation = null;
    try {
      const coords = await getLocation();
      punchLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        isMock: false
      };
    } catch (locErr) {
      console.warn('Geolocation capture skipped or denied on checkout:', locErr.message);
    }

    try {
      await checkOut({ location: punchLocation }).unwrap();
      refetch();
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Failed to clock out');
    }
  };

  const handleStartBreak = async () => {
    setActionError('');
    try {
      await startBreak({ type: selectedBreakType }).unwrap();
      setBreakModalOpen(false);
      refetch();
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    setActionError('');
    try {
      await endBreak({}).unwrap();
      refetch();
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Failed to end break');
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isPunchLoading = isCheckingIn || isCheckingOut || isLocating;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Background soft ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left: Digital Clock Display */}
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="p-3 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Clock className="w-8 h-8 animate-pulse text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {formattedTime}
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Center: Live Status & Duration Ticker */}
        <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/60 rounded-xl px-5 py-3 border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {isClockedOut ? 'Total Worked Today' : isClockedIn ? 'Active Session' : 'Shift Status'}
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
            {isClockedIn ? elapsedDuration : isSuperAdmin ? 'Flexible (Executive)' : '--:--:--'}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            {!isClockedIn && isSuperAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                24/7 Any-Time Clock In
              </span>
            )}
            {todayRecord?.status && (
              <AttendanceStatusBadge status={todayRecord.status} />
            )}
            {isOnBreak && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse">
                On Break ({activeBreak?.type})
              </span>
            )}
            {todayRecord?.flags?.includes('wfh') && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                <Laptop className="w-3 h-3" /> WFH
              </span>
            )}
            {todayRecord && (
              <GeoLocationBadge
                location={todayRecord.location}
                distanceFromOffice={todayRecord.distanceFromOfficeMeters}
                isFlagged={todayRecord.isFlagged}
                flagReason={todayRecord.flagReason}
                isFieldVisit={todayRecord.source === 'field' || todayRecord.location?.isClientVisit}
              />
            )}
          </div>
        </div>

        {/* Right: Primary Action Buttons */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            {!can('attendance.mark') ? (
              <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 font-medium text-xs">
                Punch Actions Disabled
              </div>
            ) : !isClockedIn ? (
                            <div className="flex items-center gap-2">
                {isQrEnabled && (
<button
                  type="button"
                  onClick={() => {
                    setQrDefaultAction('in');
                    setQrModalOpen(true);
                  }}
                  className="px-4 py-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 rounded-xl flex items-center gap-2 font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Scan office kiosk QR code to clock in"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR</span>
                </button> 
                )}
                <button
                  onClick={handleCheckIn}
                disabled={isPunchLoading || isLoading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{isLocating ? 'Acquiring GPS...' : isCheckingIn ? 'Clocking In...' : 'Clock In'}</span>
              </button>
              </div>
            ) : !isClockedOut ? (
              <>
                {isOnBreak ? (
                  <button
                    onClick={handleEndBreak}
                    disabled={isEndingBreak}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEndingBreak ? 'Ending...' : 'End Break'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setBreakModalOpen(true)}
                    disabled={isStartingBreak}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Take Break</span>
                  </button>
                )}

                                {isQrEnabled && (
<button
                  type="button"
                  onClick={() => {
                    setQrDefaultAction('out');
                    setQrModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 rounded-xl flex items-center gap-1.5 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                  title="Scan office kiosk QR code to clock out"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR</span>
                </button> 
                  )}
                <button
                  onClick={handleCheckOut}
                  disabled={isPunchLoading || isOnBreak}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer"
                  title={isOnBreak ? 'Please end your break before clocking out' : 'Clock out'}
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{isLocating ? 'Acquiring GPS...' : isCheckingOut ? 'Clocking Out...' : 'Clock Out'}</span>
                </button>
              </>
            ) : (
              <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 font-medium text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Shift Completed Today
              </div>
            )}
          </div>

          {/* 14.5 Field Check-in Toggle for Field Staff */}
          {!isClockedIn && canFieldCheckIn && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFieldVisit}
                  onChange={(e) => setIsFieldVisit(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Client Visit / On-Field Punch</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Field Visit inputs when checked */}
      {!isClockedIn && isFieldVisit && (
        <div className="mt-4 p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-medium text-blue-900 dark:text-blue-200 mb-1">
              Client / Site Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Bank Alfalah Head Office"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-medium text-blue-900 dark:text-blue-200 mb-1">
              Meeting Purpose / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Quarterly SLA Review"
              value={clientRemarks}
              onChange={(e) => setClientRemarks(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      )}

      {/* Action / Geolocation Errors */}
      {(actionError || geoError) && (
        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError || geoError}</span>
        </div>
      )}

      {/* 14.8 Privacy Guarantee Notice */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Privacy Guaranteed: GPS is captured only at the exact instant of punch. Zero continuous tracking.</span>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span>Geofence Enforced</span>
        </div>
      </div>

      {/* Break Type Selector Modal */}
      {breakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-500" />
              Select Break Type
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Choose the category of break you are starting:
            </p>

            <div className="space-y-2 mb-6">
              {[
                { id: 'meal', label: 'Lunch / Dinner Meal Break' },
                { id: 'tea', label: 'Tea / Refreshment Break' },
                { id: 'prayer', label: 'Prayer Break' },
                { id: 'other', label: 'Short Personal Break' }
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedBreakType === opt.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="breakType"
                    value={opt.id}
                    checked={selectedBreakType === opt.id}
                    onChange={(e) => setSelectedBreakType(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBreakModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBreak}
                disabled={isStartingBreak}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl disabled:opacity-50"
              >
                {isStartingBreak ? 'Starting...' : 'Start Break'}
              </button>
            </div>
          </div>
        </div>
      )}
      <QrScannerModal
        isOpen={qrModalOpen}
        defaultAction={qrDefaultAction}
        onClose={() => setQrModalOpen(false)}
        onSuccess={() => {
          refetch();
          onActionSuccess?.();
        }}
      />
    </div>
  );
};
