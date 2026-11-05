/**
 * @file TimesheetApprovalsPage.jsx
 * @description Manager review queue for reviewing, approving, or rejecting submitted timesheets.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.4)
 */

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  Search,
  Filter,
  CheckSquare
} from 'lucide-react';
import { useGetPendingTimesheetsQuery } from '../projectsApi.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { TimesheetDecisionModal } from '../components/TimesheetDecisionModal.jsx';

export const TimesheetApprovalsPage = () => {
  const [search, setSearch] = useState('');
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const { data: pendingRes, isLoading, isFetching, refetch } = useGetPendingTimesheetsQuery({
    limit: 100
  });

  const timesheets = pendingRes?.data || [];

  if (isLoading && !pendingRes) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const filteredTimesheets = timesheets.filter((t) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      t.employeeId?.name?.toLowerCase().includes(term) ||
      t.projectId?.name?.toLowerCase().includes(term) ||
      t.projectId?.code?.toLowerCase().includes(term) ||
      t.taskDescription?.toLowerCase().includes(term)
    );
  });

  const totalPendingHours = filteredTimesheets.reduce((acc, t) => acc + t.hours, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="h-7 w-7 text-primary" />
            Timesheet Approvals Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and authorize submitted team timesheet logs. Approved entries are locked permanently.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <div className="px-4 py-2 rounded-xl border border-border bg-card shadow-sm text-right">
            <span className="text-xs text-muted-foreground block font-medium">Pending Review</span>
            <span className="text-lg font-bold text-primary font-mono">
              {filteredTimesheets.length} Logs ({totalPendingHours.toFixed(2)}h)
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center justify-between border-b border-border p-4 gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by employee, project, task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
        </div>

        {/* Pending Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading pending submissions...</div>
          ) : filteredTimesheets.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-medium text-foreground">All caught up!</h3>
              <p className="text-xs text-muted-foreground mt-1">There are no pending timesheets requiring your review.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Work Date</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Task Summary</th>
                  <th className="px-6 py-3">Billable</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTimesheets.map((entry) => (
                  <tr key={entry._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{entry.employeeId?.name || 'Staff Member'}</div>
                      <div className="text-xs text-muted-foreground">{entry.employeeId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-primary font-mono">{entry.projectId?.code}</div>
                      <div className="text-xs text-muted-foreground">{entry.projectId?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-foreground font-mono text-xs">
                      {new Date(entry.date).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                        {entry.hours}h
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-muted-foreground line-clamp-2">{entry.taskDescription}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          entry.isBillable ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {entry.isBillable ? 'Billable' : 'Internal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTimesheet(entry);
                          setIsDecisionModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      <TimesheetDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => {
          setIsDecisionModalOpen(false);
          refetch();
        }}
        timesheet={selectedTimesheet}
      />
    </div>
  );
};

