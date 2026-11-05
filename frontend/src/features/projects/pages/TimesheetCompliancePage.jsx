/**
 * @file TimesheetCompliancePage.jsx
 * @description HR Timesheet Compliance Tracker & Automated Missing Reminder Alerts.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.7)
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Building2,
  Users,
  Search,
  CheckCircle2,
  Loader2,
  Send
} from 'lucide-react';
import {
  useGetMissingTimesheetsQuery,
  useRemindMissingTimesheetsMutation
} from '../projectsApi.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { toast } from 'sonner';

export const TimesheetCompliancePage = () => {
  const getInitialMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  };

  const [currentMonday, setCurrentMonday] = useState(getInitialMonday());
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [search, setSearch] = useState('');

  const weekStartDateIso = currentMonday.toISOString();

  const { data: deptRes } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptRes?.data || [];

  const { data: complianceRes, isLoading, isFetching, refetch } = useGetMissingTimesheetsQuery({
    weekStartDate: weekStartDateIso,
    departmentId: selectedDeptId || undefined
  });

  const [remindMissing, { isLoading: isReminding }] = useRemindMissingTimesheetsMutation();

  const missingList = complianceRes?.data?.missingList || [];

  if (isLoading && !complianceRes) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }
  const totalMissingCount = complianceRes?.data?.totalMissingCount || 0;

  const filteredList = missingList.filter((emp) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) ||
      emp.empCode?.toLowerCase().includes(term) ||
      emp.department?.toLowerCase().includes(term) ||
      emp.manager?.toLowerCase().includes(term)
    );
  });

  const handleRemindAll = async () => {
    if (filteredList.length === 0) return;
    const employeeIds = filteredList.map((e) => e.employeeId);
    try {
      const res = await remindMissing({
        weekStartDate: weekStartDateIso,
        employeeIds
      }).unwrap();
      toast.success(res.message || `Dispatched reminders to ${employeeIds.length} staff members`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to trigger compliance reminders');
    }
  };

  const handleRemindSingle = async (employeeId) => {
    try {
      const res = await remindMissing({
        weekStartDate: weekStartDateIso,
        employeeIds: [employeeId]
      }).unwrap();
      toast.success(res.message || 'Reminder sent successfully');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send reminder');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
            Timesheet Compliance Tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Identify staff with missing or unsubmitted weekly timesheets (&lt; 40h) and trigger alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <button
            onClick={handleRemindAll}
            disabled={isReminding || filteredList.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition disabled:opacity-50"
          >
            {isReminding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Send Reminders ({filteredList.length} Delinquent)
          </button>
        </div>
      </div>

      {/* Filter Header */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={currentMonday.toISOString().slice(0, 10)}
              onChange={(e) => {
                const newD = new Date(e.target.value);
                const day = newD.getDay();
                const diff = newD.getDate() - day + (day === 0 ? -6 : 1);
                setCurrentMonday(new Date(newD.setDate(diff)));
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee, manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Delinquent Timesheets for Week ({complianceRes?.data?.weekNumber || 'Current'})
          </h3>
          <span className="text-xs text-muted-foreground">
            {filteredList.length} staff member(s) flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Scanning timesheet compliance records...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-medium text-foreground">100% Timesheet Compliance!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                All staff members have completed and submitted their required hours for this week.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Department & Role</th>
                  <th className="px-6 py-3">Reporting Manager</th>
                  <th className="px-6 py-3">Hours Logged</th>
                  <th className="px-6 py-3">Deficit Hours</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredList.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{emp.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{emp.empCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{emp.department}</div>
                      <div className="text-xs text-muted-foreground">{emp.designation}</div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{emp.manager}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-foreground">
                      {emp.totalHoursLogged}h
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-destructive">
                      -{emp.deficitHours}h
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          emp.hasSubmitted
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {emp.hasSubmitted ? 'Submitted (Low Hours)' : 'Unsubmitted'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemindSingle(emp.employeeId)}
                        disabled={isReminding}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-input bg-background hover:bg-muted text-foreground transition inline-flex items-center gap-1.5"
                      >
                        <Send className="h-3 w-3 text-primary" />
                        Remind
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

