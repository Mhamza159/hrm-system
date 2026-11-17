/**
 * @file AttritionFactorsChart.jsx
 * @description Horizontal Feature-Importance & Model Weights Chart explaining the 5 predictive flight-risk drivers.
 * Styled in Forest & Emerald Enterprise theme with detailed signal criteria.
 */

import React from 'react';
import { Activity, Clock, DollarSign, Award, Briefcase, HelpCircle } from 'lucide-react';

export const AttritionFactorsChart = () => {
  const factors = [
    {
      id: 'attendance',
      name: 'Attendance & Tardiness Signals',
      weight: 30,
      icon: Clock,
      color: 'bg-emerald-500',
      description: 'Triggered when an employee has >3 unplanned absences (+15) or >5 late arrivals (+15) in the last 90 days.'
    },
    {
      id: 'salary',
      name: 'Compensation & Increment Stagnation',
      weight: 25,
      icon: DollarSign,
      color: 'bg-amber-500',
      description: 'Triggered when an employee has had no salary revision in >=18 months (+25) or 12-18 months (+12).'
    },
    {
      id: 'appraisal',
      name: 'Performance & Appraisal Trajectory',
      weight: 20,
      icon: Award,
      color: 'bg-red-500',
      description: 'Triggered by overdue appraisals (>12 months: +10) or low final performance ratings <= 2.5/5.0 (+10).'
    },
    {
      id: 'tenure',
      name: 'Tenure & Role Progression',
      weight: 15,
      icon: Briefcase,
      color: 'bg-blue-500',
      description: 'Evaluates duration in current designation (over 2 years without title change: +15, 18-24 months: +8).'
    },
    {
      id: 'engagement',
      name: 'Workplace Engagement Signals',
      weight: 10,
      icon: Activity,
      color: 'bg-teal-500',
      description: 'Baseline organizational engagement signal factoring retention feedback and workplace participation.'
    }
  ];

  return (
    <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Predictive Factor Weights</h3>
            <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Model weighting for flight-risk scoring</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#1A3125] text-slate-500 dark:text-[#7E9E8F]">
          5 Core Signals
        </span>
      </div>

      {/* Factor Bars */}
      <div className="space-y-3.5 py-4 flex-1 flex flex-col justify-around">
        {factors.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.id} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00C471] transition" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {f.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {f.weight}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F]">max</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#162820] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${f.color}`}
                  style={{ width: `${f.weight * 2.5}%` }}
                />
              </div>

              {/* Threshold Description */}
              <p className="text-[10px] text-slate-400 dark:text-[#7E9E8F] flex items-center gap-1 pt-0.5">
                <HelpCircle className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                <span>{f.description}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttritionFactorsChart;
