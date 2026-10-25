/**
 * @file MyTeamPage.jsx
 * @description Manager "My Team" View Page (BUILD-GUIDE ID 4.6).
 * 
 * SPECIFICATION & CAPABILITIES (BUILD-GUIDE ID 4.6):
 * - Displays manager's direct subordinates and team headcount.
 * - Summary cards: Total Reports, Day Shift staff, Night Shift staff.
 * - Filter by shift type (All, Day, Night) and instant text search.
 * - Grid of TeamMemberCard cards with contact actions.
 * - Empty state for users with zero direct reports.
 * - Zero TypeScript, plain JSX, dark craft design system.
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Sun,
  Moon,
  Search,
  Building,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetMyTeamQuery } from '../departmentsApi.js';
import { TeamMemberCard } from '../components/TeamMemberCard.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';

export const MyTeamPage = () => {
  const { data, isLoading, isFetching, isError, refetch } = useGetMyTeamQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');

  // Manual data reload handler
  const handleRefresh = async () => {
    try {
      const res = await refetch();
      if (res?.error) {
        toast.error('Failed to reload team data');
      } else {
        toast.success('Team data reloaded successfully');
      }
    } catch {
      toast.error('Network error while reloading');
    }
  };

  const teamData = data?.data || { manager: null, directReports: [], totalCount: 0 };
  const { manager, directReports = [], totalCount = 0 } = teamData;

  // Compute shift statistics
  const shiftStats = useMemo(() => {
    let dayCount = 0;
    let nightCount = 0;

    directReports.forEach((emp) => {
      if (emp.shift?.isCrossMidnight) {
        nightCount++;
      } else if (emp.shift) {
        dayCount++;
      }
    });

    return { dayCount, nightCount };
  }, [directReports]);

  // Filtered direct reports
  const filteredReports = useMemo(() => {
    return directReports.filter((member) => {
      // Shift filter
      if (shiftFilter === 'NIGHT' && !member.shift?.isCrossMidnight) return false;
      if (shiftFilter === 'DAY' && (member.shift?.isCrossMidnight || !member.shift)) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = member.name?.toLowerCase().includes(term);
        const matchesCode = member.employeeCode?.toLowerCase().includes(term);
        const matchesTitle = member.designation?.toLowerCase().includes(term);
        const matchesEmail = member.email?.toLowerCase().includes(term);
        return matchesName || matchesCode || matchesTitle || matchesEmail;
      }

      return true;
    });
  }, [directReports, shiftFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Team"
        subtitle="Manage and view direct subordinates, shift rosters, and team contacts."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              title="Reload team data from database"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
              <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {manager && (
              <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-xs shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/60">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{manager.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {manager.designation} &bull; {manager.department}
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Direct Reports"
          value={totalCount}
          icon={Users}
          description="Subordinates reporting directly to you"
        />
        <StatCard
          title="Day Shift Members"
          value={shiftStats.dayCount}
          icon={Sun}
          description="Assigned standard operational daytime hours"
        />
        <StatCard
          title="Night Shift Members"
          value={shiftStats.nightCount}
          icon={Moon}
          description="Assigned cross-midnight overnight rosters"
        />
      </div>

      {/* Controls Bar: Search & Shift Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member by name, code, title, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Shift:
          </span>
          <button
            type="button"
            onClick={() => setShiftFilter('ALL')}
            className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
              shiftFilter === 'ALL'
                ? 'bg-[#00C471] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#1F382D] border border-transparent dark:border-[#1A3125]/60'
            }`}
          >
            All Shifts ({directReports.length})
          </button>
          <button
            type="button"
            onClick={() => setShiftFilter('DAY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
              shiftFilter === 'DAY'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#1F382D] border border-transparent dark:border-[#1A3125]/60'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> Day ({shiftStats.dayCount})
          </button>
          <button
            type="button"
            onClick={() => setShiftFilter('NIGHT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
              shiftFilter === 'NIGHT'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#1F382D] border border-transparent dark:border-[#1A3125]/60'
            }`}
          >
            <Moon className="w-3.5 h-3.5" /> Night ({shiftStats.nightCount})
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#1A3125] mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            title="Reload team data"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-semibold transition-all shrink-0 cursor-pointer bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#1F382D] border border-transparent dark:border-[#1A3125]/60 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      {isLoading && (
        <ScreenSkeleton variant="cards" title="Team Subordinates" message="Loading your direct reports, shifts & profiles..." cards={6} />
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-rose-500 dark:text-rose-400">
          <p className="text-sm font-semibold">Failed to load team data.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && directReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3 stroke-1" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Direct Reports Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm mt-1">
            You do not currently have any active employees reporting directly to you in the system.
          </p>
        </div>
      )}

      {!isLoading && !isError && directReports.length > 0 && filteredReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <Search className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 stroke-1" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No team members match the current filter.</p>
        </div>
      )}

      {!isLoading && !isError && filteredReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((member) => (
            <TeamMemberCard key={member._id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
};
