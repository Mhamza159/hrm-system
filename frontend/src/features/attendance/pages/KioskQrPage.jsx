/**
 * @file KioskQrPage.jsx
 * @description Dedicated dynamic rotating QR code display page for office attendance kiosk hardware screens.
 *
 * SPECIFICATION:
 * - Module: M13 Dynamic QR Code Attendance (BUILD-GUIDE Section 18 · Row 13.2)
 * - Security: HMAC SHA-256 rotating QR stream, 30-second TTL countdown bar, anti-tamper heartbeat.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useGetCurrentKioskQrQuery,
  useGetKioskByIdQuery
} from '../attendanceApi.js';
import {
  Monitor,
  Clock,
  RefreshCw,
  Maximize2,
  Minimize2,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

export const KioskQrPage = () => {
  const { id: kioskId } = useParams();
  const [countdown, setCountdown] = useState(30);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Poll every 25 seconds for fresh rotating token (with 30s TTL on backend)
  const { data: qrData, isLoading, isError, error, refetch } = useGetCurrentKioskQrQuery(kioskId, {
    pollingInterval: 25000,
    skip: !kioskId
  });

  const { data: kioskData } = useGetKioskByIdQuery(kioskId, { skip: !kioskId });
  const kiosk = qrData?.data?.kiosk || kioskData?.data || {};

  // Live digital wall clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 30s Countdown timer linked to QR generation
  useEffect(() => {
    if (qrData?.data?.expiresIn) {
      setCountdown(qrData.data.expiresIn);
    }
  }, [qrData?.data?.token]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const renderDirectionBadge = (type) => {
    switch (type) {
      case 'entry':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ArrowDownRight className="w-4 h-4" />
            <span>Entry Gate (Clock-In Only)</span>
          </span>
        );
      case 'exit':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ArrowUpRight className="w-4 h-4" />
            <span>Exit Turnstile (Clock-Out Only)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Dual Gate (Clock-In & Clock-Out)</span>
          </span>
        );
    }
  };

  const progressPercentage = Math.max(0, Math.min(100, (countdown / 30) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-10 select-none">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-4">
          <Link
            to="/attendance/kiosks"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
            title="Return to Kiosks Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>{kiosk.name || 'Office Attendance Terminal'}</span>
              <span className="font-mono text-xs text-slate-400 font-normal">[{kiosk.code || 'KIOSK'}]</span>
            </h1>
            <p className="text-xs text-slate-400">
              {kiosk.locationDescription || 'Office Check-In / Check-Out Station'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-right">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm md:text-base font-mono font-semibold tracking-wider text-slate-200">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Center Content: Vector QR Card */}
      <main className="flex-1 flex flex-col items-center justify-center my-6">
        <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
          {/* Direction Badge */}
          <div className="mb-5">{renderDirectionBadge(kiosk.type || 'both')}</div>

          {/* QR Code Container */}
          <div className="relative p-5 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
            {isLoading ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Generating rotating vector QR...</span>
              </div>
            ) : isError ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center p-4 text-center text-rose-500 space-y-2">
                <AlertTriangle className="w-10 h-10 text-rose-500 mb-1" />
                <span className="text-xs font-semibold">
                  {error?.data?.message || 'Failed to connect to kiosk QR stream.'}
                </span>
                <button
                  onClick={() => refetch()}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors mt-2"
                >
                  Retry Connection
                </button>
              </div>
            ) : qrData?.data?.svg ? (
              <div
                className="w-64 h-64 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrData.data.svg }}
              />
            ) : null}
          </div>

          {/* Countdown & Refresh Indicator */}
          <div className="w-full mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Next Code Rotation</span>
              </span>
              <span className="font-mono font-bold text-blue-400">{countdown}s</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* User Instructions */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-200">Point your smartphone camera to clock in or out</p>
            <p className="text-[11px] text-slate-500">
              Dynamic HMAC token with hardware device binding prevents proxy punches.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
        <span>Google Antigravity HRM • Enterprise Smart Operations</span>
        <span className="mt-1 sm:mt-0">Terminal ID: {kioskId}</span>
      </footer>
    </div>
  );
};
