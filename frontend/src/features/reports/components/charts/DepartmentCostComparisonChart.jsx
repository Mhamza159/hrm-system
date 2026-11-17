/**
 * @file DepartmentCostComparisonChart.jsx
 * @description Full-Width Department Workforce Cost Comparison Stacked Bar Chart.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React, { useState } from 'react';
import { PieChart } from 'lucide-react';

export const DepartmentCostComparisonChart = ({ chartData = {}, summary = {}, isLoading = false }) => {
  const [hoveredDept, setHoveredDept] = useState(null);

  const departmentCostComparison = chartData.departmentCostComparison || [];
  const maxGross = Math.max(1, ...departmentCostComparison.map((d) => d.grossPkr || 0));

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 h-72 flex items-center justify-center text-xs text-slate-400">
        Loading department cost analytics...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Departmental Cost Breakdown
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">
              Total payroll expenditure and per-employee attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C471]" /> Net Pay
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Statutory Tax
          </span>
          <span className="text-[11px] font-mono text-[#00C471] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
            Avg: PKR {summary.avgCostPerEmployeePkr || '0'}/head
          </span>
        </div>
      </div>

      {departmentCostComparison.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F]">
          No departmental cost records available
        </div>
      ) : (
        <div className="py-2 space-y-3">
          {departmentCostComparison.map((dept, idx) => {
            const widthPct = Math.max(12, (dept.grossPkr / maxGross) * 100);
            const netPct = dept.grossPkr > 0 ? (dept.netPkr / dept.grossPkr) * 100 : 0;
            const taxPct = dept.grossPkr > 0 ? (dept.taxPkr / dept.grossPkr) * 100 : 0;
            const isHovered = hoveredDept === idx;

            return (
              <div
                key={dept.departmentName || idx}
                className="space-y-1.5 group cursor-pointer"
                onMouseEnter={() => setHoveredDept(idx)}
                onMouseLeave={() => setHoveredDept(null)}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {dept.departmentName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({dept.headcount} {dept.headcount === 1 ? 'employee' : 'employees'})
                    </span>
                  </div>
                  <div className="font-mono text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      PKR {dept.grossPkr.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      (PKR {dept.avgCostPerEmpPkr.toLocaleString()}/head)
                    </span>
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div
                  className={`h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-[#162820] transition-all duration-300 ${
                    isHovered ? 'ring-2 ring-[#00C471]/50' : ''
                  }`}
                  style={{ width: `${widthPct}%` }}
                >
                  <div
                    style={{ width: `${netPct}%` }}
                    className="h-full bg-[#00C471] transition-all duration-500"
                    title={`Net Pay: PKR ${dept.netPkr.toLocaleString()}`}
                  />
                  <div
                    style={{ width: `${taxPct}%` }}
                    className="h-full bg-[#EF4444] transition-all duration-500"
                    title={`Tax: PKR ${dept.taxPkr.toLocaleString()}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DepartmentCostComparisonChart;
