/**
 * @file OfflineBanner.jsx
 * @description State 4: Persistent non-intrusive offline status banner.
 * Keeps cached content fully interactive on screen.
 */

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from './OfflineProvider.jsx';

export function OfflineBanner() {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline status"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto"
    >
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-[#111D17]/95 border border-amber-500/40 text-white shadow-xl backdrop-blur-md text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold text-amber-300">Offline Mode:</span>
        <span className="text-slate-300 hidden sm:inline">Viewing cached records. Offline changes will sync when reconnected.</span>
        <span className="text-slate-300 sm:hidden">Viewing cached records.</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-1 p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Try reconnecting"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
}

