/**
 * @file NetworkProgressBar.jsx
 * @description State 5: Real-time slow network telemetry progress bar.
 * Strictly satisfies Rule 5: Show real progress and offer a lighter path.
 */

import React, { useState, useEffect } from 'react';
import { Gauge, RefreshCw } from 'lucide-react';
import { latencyTracker, getNetworkInfo, subscribeNetworkQuality } from '../../lib/networkMonitor.js';

export function NetworkProgressBar() {
  const [isSlow, setIsSlow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Initial network quality check
    const info = getNetworkInfo();
    if (info.isSlow) setIsSlow(true);

    // 2. Subscribe to network hardware speed changes
    const unsubQuality = subscribeNetworkQuality((netInfo) => {
      setIsSlow(netInfo.isSlow);
    });

    // 3. Subscribe to active request latency spikes
    const unsubLatency = latencyTracker.subscribe((state) => {
      setIsSlow(state.isSlow);
      if (state.isSlow) {
        setProgress(30);
      } else {
        setProgress(100);
        setTimeout(() => setProgress(0), 400);
      }
    });

    return () => {
      unsubQuality();
      unsubLatency();
    };
  }, []);

  // Animate progress smoothly when slow
  useEffect(() => {
    if (!isSlow) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isSlow]);

  if (!isSlow && progress === 0) return null;

  return (
    <>
      {/* 2px Animated Emerald Progress Bar along top edge */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-slate-200/40 dark:bg-slate-800/40 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 transition-all duration-300 ease-out shadow-xs"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating Slow Connection Advisory Pill */}
      {isSlow && (
        <div className="fixed top-3 right-4 z-50 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#111D17] border border-amber-300/80 dark:border-amber-800/60 text-slate-700 dark:text-slate-200 shadow-md text-[11px]">
            <Gauge className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="font-medium text-amber-600 dark:text-amber-400">Slow network</span>
            <span className="text-slate-400 hidden sm:inline">&bull; Loading records...</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-1 inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Refresh
            </button>
          </div>
        </div>
      )}
    </>
  );
}

