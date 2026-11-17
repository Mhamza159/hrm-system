/**
 * @file PayrollTrendChart.jsx
 * @description Monthly Payroll Expenditure Trend (Gross, Net, Tax) Bar Chart for Financial Analytics.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React, { useState } from 'react';
import { DollarSign, Landmark } from 'lucide-react';

export const PayrollTrendChart = ({ chartData = {}, summary = {}, isLoading = false }) => {
  const [hoveredRun, setHoveredRun] = useState(null);

  const monthlyTrend = chartData.monthlyTrend || [];
  const maxGross = Math.max(1, ...monthlyTrend.map((m) => m.grossPkr || 0));

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 h-72 flex items-center justify-center text-xs text-slate-400">
        Loading payroll analytics...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Monthly Payroll Trajectory */}
      <div className="lg:col-span-8 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Monthly Payroll Expenditure</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Gross compensation vs net payout vs FBR tax</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00C471]" /> Gross</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Net</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Tax</span>
          </div>
        </div>

        {monthlyTrend.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            No approved payroll runs found for selected range
          </div>
        ) : (
          <div className="py-3 flex-1 flex flex-col justify-end">
            <div className="flex items-end gap-3 h-40 w-full pt-4">
              {monthlyTrend.map((m, idx) => {
                const grossHeight = Math.max(8, (m.grossPkr / maxGross) * 100);
                const isHovered = hoveredRun === idx;

                return (
                  <div
                    key={m.month || idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredRun(idx)}
                    onMouseLeave={() => setHoveredRun(null)}
                  >
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 z-20 px-3 py-2 rounded-xl bg-slate-900 dark:bg-[#061A14] text-white border border-slate-700 dark:border-[#1A3125] text-[10px] whitespace-nowrap shadow-lg">
                        <p className="font-bold font-mono text-emerald-400">{m.month}</p>
                        <p>Gross: PKR {m.grossPkr.toLocaleString()}</p>
                        <p className="text-blue-400">Net: PKR {m.netPkr.toLocaleString()}</p>
                        <p className="text-rose-400">Tax: PKR {m.taxPkr.toLocaleString()}</p>
                      </div>
                    )}

                    <div className="w-full max-w-[36px] flex items-end gap-1 h-full">
                      {/* Gross Bar */}
                      <div
                        className={`flex-1 rounded-t-md bg-[#00C471] transition-all duration-300 ${isHovered ? 'brightness-110' : ''}`}
                        style={{ height: `${grossHeight}%` }}
                      />
                      {/* Net Bar */}
                      <div
                        className={`flex-1 rounded-t-md bg-[#3B82F6] transition-all duration-300 ${isHovered ? 'brightness-110' : ''}`}
                        style={{ height: `${(m.netPkr / maxGross) * 100}%` }}
                      />
                      {/* Tax Bar */}
                      <div
                        className={`flex-1 rounded-t-md bg-[#EF4444] transition-all duration-300 ${isHovered ? 'brightness-110' : ''}`}
                        style={{ height: `${Math.max(4, (m.taxPkr / maxGross) * 100)}%` }}
                      />
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center mt-2 block">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Statutory Deductions Summary */}
      <div className="lg:col-span-4 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Tax & Deductions</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Statutory withholding</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{summary.totalRuns || 0} Runs</span>
        </div>

        <div className="space-y-4 py-4 flex-1 flex flex-col justify-around">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Gross Payroll</span>
            <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
              PKR {summary.totalGrossPkr || '0'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statutory Tax Withheld</span>
            <p className="font-mono text-lg font-bold text-rose-500">
              PKR {summary.totalTaxPkr || '0'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Net Disbursed</span>
            <p className="font-mono text-lg font-bold text-[#00C471]">
              PKR {summary.totalNetPkr || '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollTrendChart;
