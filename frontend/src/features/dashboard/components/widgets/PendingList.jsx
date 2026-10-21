/**
 * @file PendingList.jsx
 * @description Actionable tabbed pending approval list for HR and Managers.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, CheckCircle2, User } from 'lucide-react';
import { formatDate } from '../../../../lib/formatters.js';

export function PendingList({ leaves = [], corrections = [], title = 'Pending Approvals' }) {
  const [activeTab, setActiveTab] = useState('leaves');

  const items = activeTab === 'leaves' ? leaves : corrections;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'leaves'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Leaves ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'corrections'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Corrections ({corrections.length})
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">All caught up! No pending approvals.</p>
          </div>
        ) : (
          items.slice(0, 6).map((item) => (
            <div key={item._id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300 overflow-hidden">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.employeeName} className="w-full h-full object-cover" />
                  ) : (
                    item.employeeName?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {item.employeeName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeTab === 'leaves' ? (
                      <>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{item.leaveType}</span>
                        {' · '}
                        {item.totalDays} {item.totalDays === 1 ? 'day' : 'days'}
                      </>
                    ) : (
                      <>
                        Missed Punch on{' '}
                        <span className="font-medium">{formatDate(item.date)}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <Link
                to={activeTab === 'leaves' ? '/leaves' : '/attendance'}
                className="shrink-0 p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Review request"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))
        )}
      </div>

      {items.length > 6 && (
        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
          <Link
            to={activeTab === 'leaves' ? '/leaves' : '/attendance'}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            View all {items.length} pending requests
          </Link>
        </div>
      )}
    </div>
  );
}
