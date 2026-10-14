/**
 * @file PoliciesPage.jsx
 * @description Public Employee Handbook & Company Policies Reader (Slice 2.11).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  Timer,
  CalendarRange,
  MapPin,
  FileText,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { useGetPublicPoliciesQuery } from '../settingsApi.js';

export default function PoliciesPage() {
  const { data: policiesRes, isLoading, refetch } = useGetPublicPoliciesQuery();

  const policies = policiesRes?.data || {};
  const company = policies.company || {};
  const officeHours = policies.officeHours || {};
  const lateRules = policies.lateRules || {};
  const leavePolicy = policies.leavePolicy || {};
  const workingDays = policies.workingDays || [];
  const geoFences = policies.geoFences || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Handbook & Policies"
        description="Official working schedules, attendance punctuality guidelines, and leave entitlement rules."
        actions={
          <Can I="settings.manage" a="Setting">
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Manage Settings
            </Link>
          </Can>
        }
      />

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          Loading company policies...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Company Legal Profile Header Banner */}
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden shrink-0">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-emerald-500" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {company.name || 'Company Profile'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                  {company.address || 'Registered Office Address'}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
                  {company.email && <span>Email: {company.email}</span>}
                  {company.phone && <span>Phone: {company.phone}</span>}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 hover:underline"
                    >
                      {company.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Active Workplace Policy v1.0
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Working Hours & Active Days Card */}
            <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Work Schedules & Office Timings
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Standard Check-In</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {officeHours.startTime || '09:00'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Standard Check-Out</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {officeHours.endTime || '18:00'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Half-Day Requirement</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {officeHours.halfDayMinutes ? `${officeHours.halfDayMinutes} Minutes (${officeHours.halfDayMinutes / 60} hrs)` : '240 Minutes'}
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-2 uppercase tracking-wider">
                    Operating Days:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => {
                      const isActive = workingDays.includes(d);
                      return (
                        <span
                          key={d}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                          }`}
                        >
                          {d}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance & Late Arrival Rules Card */}
            <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Timer className="w-4 h-4 text-emerald-500" />
                Punctuality & Tardiness Tolerances
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Grace Arrival Window</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {lateRules.graceMinutes ?? 15} Minutes
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Late Mark Threshold</span>
                  <span className="font-mono font-bold text-amber-500">
                    After {lateRules.lateThresholdMinutes ?? 30} Minutes
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Half-Day Penalty Clause
                  </div>
                  <p className="leading-relaxed">
                    Accumulating <strong>{lateRules.halfDayThresholdLateCount ?? 3}</strong> late arrivals within a single calendar month triggers an automatic 1 half-day deduction against attendance / salary.
                  </p>
                </div>
              </div>
            </div>

            {/* Leave Policy Guidelines Card */}
            <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-emerald-500" />
                Leave Entitlement & Guidelines
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Fiscal Cycle Start</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {leavePolicy.fiscalYearStart || 'July'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Carry-Forward Limit</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Max {leavePolicy.carryForwardLimit ?? 5} Days / Year
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Year-End Leave Encashment</span>
                  <span className={`font-bold ${leavePolicy.encashmentAllowed ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {leavePolicy.encashmentAllowed ? 'Allowed' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-500">Sandwich Rule Enforced</span>
                  <span className={`font-bold ${leavePolicy.sandwichRule ? 'text-amber-500' : 'text-slate-400'}`}>
                    {leavePolicy.sandwichRule ? 'Yes (Weekends count)' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Registered Premises Card */}
            <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Office Premises & Geo-Fencing
              </h3>

              {geoFences.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {geoFences.map((gf, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>{gf.name}</span>
                        <span className="text-emerald-500 font-mono text-[11px]">Radius: {gf.radiusMeters}m</span>
                      </div>
                      <p className="text-slate-500 font-mono text-[11px]">
                        GPS: {gf.latitude}, {gf.longitude}
                      </p>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 pt-1">
                    Mobile check-ins are validated against device GPS within the specified perimeter.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No geo-fence locations configured.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
