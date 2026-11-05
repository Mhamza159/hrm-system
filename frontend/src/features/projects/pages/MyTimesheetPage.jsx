/**
 * @file MyTimesheetPage.jsx
 * @description Weekly employee timesheet logging interface and approval submission workflow.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.3, 22.4)
 */

import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
  CheckCircle2,
  Lock,
  AlertCircle,
  Briefcase,
  Loader2
} from 'lucide-react';
import {
  useGetMyWeeklyTimesheetsQuery,
  useSubmitWeekTimesheetsMutation,
  useGetProjectsQuery
} from '../projectsApi.js';
import { TimesheetWeeklyGrid } from '../components/TimesheetWeeklyGrid.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const MyTimesheetPage = () => {
  // Current Monday calculation in UTC
  const getInitialMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return new Date(Date.UTC(mon.getFullYear(), mon.getMonth(), mon.getDate(), 0, 0, 0, 0));
  };

  const [currentMonday, setCurrentMonday] = useState(getInitialMonday());

  const handlePrevWeek = () => {
    const prev = new Date(Date.UTC(currentMonday.getUTCFullYear(), currentMonday.getUTCMonth(), currentMonday.getUTCDate() - 7));
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(Date.UTC(currentMonday.getUTCFullYear(), currentMonday.getUTCMonth(), currentMonday.getUTCDate() + 7));
    setCurrentMonday(next);
  };

  const handleCurrentWeek = () => {
    setCurrentMonday(getInitialMonday());
  };

  const weekStartDateIso = currentMonday.toISOString();

  // Queries & Mutations
  const {
    data: timesheetsRes,
    isLoading: isTimesheetsLoading,
    isFetching: isTimesheetsFetching,
    refetch
  } = useGetMyWeeklyTimesheetsQuery({
    weekStartDate: weekStartDateIso
  });

  const { data: projectsRes } = useGetProjectsQuery({ limit: 100 });
  const [submitWeek, { isLoading: isSubmitting }] = useSubmitWeekTimesheetsMutation();

  const entries = timesheetsRes?.data?.entries || [];

  if (isTimesheetsLoading && !timesheetsRes) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <ScreenSkeleton variant="matrix" />
      </div>
    );
  }
  const assignedProjects = projectsRes?.data || [];

  const draftEntries = entries.filter((e) => e.status === 'draft' || e.status === 'rejected');
  const submittedEntries = entries.filter((e) => e.status === 'submitted');
  const approvedEntries = entries.filter((e) => e.status === 'approved');

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  const handleSubmitWeek = async () => {
    if (draftEntries.length === 0) {
      toast.error('No draft entries available to submit for this week');
      return;
    }

    try {
      const res = await submitWeek({ weekStartDate: weekStartDateIso }).unwrap();
      toast.success(res.message || 'Weekly timesheet submitted for manager review');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit weekly timesheet');
    }
  };

  const sundayDate = new Date(currentMonday.getTime() + 6 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            My Weekly Timesheet
          </h1>
          <p className="text-sm text-muted-foreground">
            Log project hours, track weekly milestones, and submit hours for manager review.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={refetch} isFetching={isTimesheetsFetching} />
          <button
            onClick={handleSubmitWeek}
            disabled={isSubmitting || draftEntries.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit Week ({draftEntries.length} Draft)
          </button>
        </div>
      </div>

      {/* Week Navigation Header Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition"
            title="Previous Week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition"
            title="Next Week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleCurrentWeek}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-input bg-background hover:bg-muted text-foreground transition ml-1"
          >
            Current Week
          </button>

          <div className="ml-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {currentMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {sundayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-normal">
              {timesheetsRes?.data?.weekNumber || 'Week'}
            </span>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 text-xs">
          {approvedEntries.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {approvedEntries.length} Approved
            </span>
          )}
          {submittedEntries.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-medium">
              <Clock className="h-3.5 w-3.5" />
              {submittedEntries.length} Submitted
            </span>
          )}
          {draftEntries.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {draftEntries.length} Draft
            </span>
          )}
        </div>
      </div>

      {/* Grid Container */}
      {isTimesheetsLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground border border-border rounded-xl bg-card">
          Loading timesheets for week...
        </div>
      ) : (
        <TimesheetWeeklyGrid
          weekStartDate={weekStartDateIso}
          entries={entries}
          assignedProjects={assignedProjects}
          refetch={refetch}
        />
      )}
    </div>
  );
};

