/**
 * @file PayrollProgressBar.jsx
 * @description Real-Time WebSocket Progress Bar for Asynchronous Batch Payroll Processing.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.7)
 * - Layer: Component (React 18 / Tailwind)
 * - Real-Time: Listens to 'payroll:progress' and 'payroll:completed' events.
 */

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSocket } from '../../notifications/hooks/useSocket.js';

export function PayrollProgressBar({ isGenerating, onComplete }) {
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    percentage: 0,
    status: 'idle'
  });

  useEffect(() => {
    let socket = getSocket();

    const handleProgress = (data) => {
      setProgress({
        completed: data.completed || 0,
        total: data.total || 0,
        percentage: data.percentage || 0,
        status: 'processing'
      });
    };

    const handleCompleted = () => {
      setProgress((prev) => ({
        ...prev,
        percentage: 100,
        status: 'completed'
      }));
      if (onComplete) {
        setTimeout(onComplete, 1200);
      }
    };

    if (socket) {
      socket.on('payroll:progress', handleProgress);
      socket.on('payroll:completed', handleCompleted);
    }

    return () => {
      if (socket) {
        socket.off('payroll:progress', handleProgress);
        socket.off('payroll:completed', handleCompleted);
      }
    };
  }, [onComplete]);

  if (!isGenerating && progress.status === 'idle') {
    return null;
  }

  return (
    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2.5 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {progress.status === 'completed' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
          )}
          <span className="font-semibold text-emerald-900 dark:text-emerald-200">
            {progress.status === 'completed'
              ? 'Payroll Batch Complete!'
              : 'Calculating Batch Payroll...'}
          </span>
        </div>
        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
          {progress.percentage}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-emerald-200/60 dark:bg-emerald-900/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, progress.percentage)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-emerald-800/80 dark:text-emerald-400 font-medium">
        <span>
          {progress.completed} of {progress.total || '—'} employee payslips calculated
        </span>
        <span className="italic">Live Socket.io Engine</span>
      </div>
    </div>
  );
}
