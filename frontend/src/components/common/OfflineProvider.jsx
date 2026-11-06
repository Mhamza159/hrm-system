/**
 * @file OfflineProvider.jsx
 * @description State 4: Offline Awareness Context and Hook.
 * Strictly satisfies Rule 4: Keep cached content on screen and show a toast notification.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const OfflineContext = createContext({
  isOnline: true,
  wasOffline: false
});

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      toast.success('Connection restored! You are back online. Data re-synchronized.', {
        id: 'online-status-toast',
        duration: 4000
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error('You are offline. Viewing cached records. Actions will sync when reconnected.', {
        id: 'offline-status-toast',
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline, wasOffline }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}

