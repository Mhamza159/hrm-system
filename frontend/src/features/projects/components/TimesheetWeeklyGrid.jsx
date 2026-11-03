/**
 * @file TimesheetWeeklyGrid.jsx
 * @description High-density Monday to Sunday timesheet grid with live day totals and 24h cap guards.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.3)
 */

import React, { useState } from 'react';
import { Clock, Plus, Trash2, CheckCircle2, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useLogTimeEntryMutation, useDeleteTimesheetMutation } from '../projectsApi.js';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { key: 0, label: 'Mon', full: 'Monday' },
  { key: 1, label: 'Tue', full: 'Tuesday' },
  { key: 2, label: 'Wed', full: 'Wednesday' },
  { key: 3, label: 'Thu', full: 'Thursday' },
  { key: 4, label: 'Fri', full: 'Friday' },
  { key: 5, label: 'Sat', full: 'Saturday' },
  { key: 6, label: 'Sun', full: 'Sunday' }
];

export const TimesheetWeeklyGrid = ({ weekStartDate, entries = [], assignedProjects = [], refetch }) => {
  const [logTime, { isLoading: isLogging }] = useLogTimeEntryMutation();
  const [deleteTimesheet] = useDeleteTimesheetMutation();

  // Form state for adding an entry
  const [selectedProjectId, setSelectedProjectId] = useState(assignedProjects[0]?._id || '');
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // 0 (Mon) to 6 (Sun)
  const [hoursInput, setHoursInput] = useState('8.0');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isBillableInput, setIsBillableInput] = useState(true);

  const startMonday = new Date(weekStartDate);

  // Compute daily totals across entries
  const dayTotals = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const targetDate = new Date(startMonday.getTime() + offset * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const dayEntries = entries.filter((e) => new Date(e.date).toISOString().slice(0, 10) === dateStr);
    const total = dayEntries.reduce((sum, e) => sum + e.hours, 0);
    return {
      offset,
      dateStr,
      total: Math.round(total * 100) / 100,
      entries: dayEntries
    };
  });

  const weeklyGrandTotal = dayTotals.reduce((sum, d) => sum + d.total, 0);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error('Please select an assigned project');
      return;
    }
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours < 0.25 || hours > 24.0) {
      toast.error('Logged hours must be between 0.25h and 24.0h');
      return;
    }
    if (!descriptionInput.trim() || descriptionInput.trim().length < 3) {
      toast.error('Please enter a task description (min 3 characters)');
      return;
    }

    const targetDate = new Date(startMonday.getTime() + selectedDayOffset * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10);

    try {
      await logTime({
        projectId: selectedProjectId,
        date: dateStr,
        hours,
        taskDescription: descriptionInput.trim(),
        isBillable: isBillableInput
      }).unwrap();

      toast.success('Time entry logged successfully');
      setDescriptionInput('');
      if (refetch) refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to log timesheet entry');
    }
  };

  const handleDelete = async (entryId, status) => {
    if (status === 'approved') {
      toast.error('Approved timesheets are locked and cannot be deleted');
      return;
    }
    if (!window.confirm('Delete this timesheet entry?')) return;
    try {
      await deleteTimesheet(entryId).unwrap();
      toast.success('Entry removed');
      if (refetch) refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Entry Bar */}
      <form onSubmit={handleAddEntry} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            Log Work Duration
          </h3>
          <span className="text-xs text-muted-foreground">Max 24.0 hours per calendar day</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            >
              <option value="">Select Assigned Project...</option>
              {assignedProjects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={selectedDayOffset}
              onChange={(e) => setSelectedDayOffset(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label} (
                  {new Date(startMonday.getTime() + d.key * 24 * 60 * 60 * 1000).toISOString().slice(5, 10)})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="number"
              step="0.25"
              min="0.25"
              max="24.0"
              placeholder="Hours"
              value={hoursInput}
              onChange={(e) => setHoursInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={isBillableInput}
                onChange={(e) => setIsBillableInput(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              Billable
            </label>
            <input
              type="text"
              placeholder="Task summary..."
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            <button
              type="submit"
              disabled={isLogging}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm whitespace-nowrap"
            >
              {isLogging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Log
            </button>
          </div>
        </div>
      </form>

      {/* Monday - Sunday 7-Day Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {dayTotals.map((day) => {
          const isOverCap = day.total > 24.0;
          const isFull = day.total >= 8.0;

          return (
            <div
              key={day.offset}
              className={`flex flex-col rounded-xl border p-3.5 transition ${
                isOverCap
                  ? 'border-destructive bg-destructive/5'
                  : isFull
                  ? 'border-border bg-card shadow-sm'
                  : 'border-border bg-card/60'
              }`}
            >
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                <div>
                  <span className="text-xs font-semibold text-foreground uppercase">
                    {DAYS_OF_WEEK[day.offset].full}
                  </span>
                  <div className="text-[11px] text-muted-foreground font-mono">{day.dateStr.slice(5)}</div>
                </div>
                <div
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    day.total === 0
                      ? 'bg-muted text-muted-foreground'
                      : day.total <= 8
                      ? 'bg-primary/10 text-primary'
                      : day.total <= 16
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {day.total}h
                </div>
              </div>

              {/* Entries for this calendar day */}
              <div className="space-y-2 flex-1 min-h-[120px]">
                {day.entries.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground/60 italic">
                    No time logged
                  </div>
                ) : (
                  day.entries.map((entry) => (
                    <div
                      key={entry._id}
                      className="p-2 rounded-lg border border-border/80 bg-background/80 text-xs space-y-1 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary truncate max-w-[90px]">
                          {entry.projectId?.code || 'PRJ'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-foreground">{entry.hours}h</span>
                          {entry.status === 'approved' ? (
                            <span title="Approved and Locked">
                              <Lock className="h-3 w-3 text-emerald-600" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDelete(entry._id, entry.status)}
                              className="text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {entry.taskDescription}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span className={entry.isBillable ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                          {entry.isBillable ? 'Billable' : 'Non-billable'}
                        </span>
                        <span
                          className={`capitalize px-1.5 py-0.2 rounded ${
                            entry.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600 font-medium'
                              : entry.status === 'submitted'
                              ? 'bg-blue-500/10 text-blue-600'
                              : entry.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive font-medium'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Summary Banner */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              Total Logged: <span className="text-primary font-mono">{weeklyGrandTotal.toFixed(2)} Hours</span>
            </div>
            <p className="text-xs text-muted-foreground">Standard workweek target: 40.0 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

