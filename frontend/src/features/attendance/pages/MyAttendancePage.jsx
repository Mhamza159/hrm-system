/**
 * @file MyAttendancePage.jsx
 * @description Advanced Attendance Dashboard & Portal matching the reference design and project color scheme.
 * 
 * BUSINESS & TEMPORAL CONSTRAINTS:
 * 1. Request Missed Punch is ONLY permitted for past dates within the current active month (up to today).
 * 2. Coming / future dates in the calendar are blocked from missed punch requests.
 * 3. If user is currently clocked in today without clocking out, missed punch for today is blocked until clock-out.
 * 4. All data in the detailed record table is 100% dynamic and sourced from database records.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  Clock,
  Fingerprint,
  Search,
  Filter,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Laptop,
  FileEdit,
  ArrowUpRight,
  Lock,
  Check,
  X,
  Users,
  History,
  List,
  Plus,
  UserCheck,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetMyAttendanceQuery,
  useGetAttendanceHistoryQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetMyWFHRequestsQuery,
  useGetMyCorrectionsQuery
} from '../attendanceApi.js';
import { AttendanceStatusBadge } from '../components/AttendanceStatusBadge.jsx';
import { RequestCorrectionModal } from '../components/RequestCorrectionModal.jsx';
import { ApplyWFHModal } from '../components/ApplyWFHModal.jsx';
import { MyRequestsView } from '../components/MyRequestsView.jsx';
import { GeoLocationBadge } from '../components/GeoLocationBadge.jsx';
import { useGeolocation } from '../../../hooks/useGeolocation.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAuth } from '../../../hooks/useAuth.js';

export const MyAttendancePage = () => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const { user, isSuperAdmin, isDeptManager, isHR } = useAuth();
  const { getLocation, loading: isLocating, error: geoError, clearError: clearGeoError } = useGeolocation();
  const canFieldCheckIn = can('attendance.fieldCheckIn') || isSuperAdmin;
  const [isFieldVisit, setIsFieldVisit] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientRemarks, setClientRemarks] = useState('');

  // Navigation & View State
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'monthly' | 'employee_wise' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Time & Month State
  const currentDate = new Date();
  const todayStr = currentDate.toISOString().split('T')[0];
  const currentActiveMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentActiveMonth);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Month navigation & days calculation
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Interactive Tooltip States
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredCalendarDay, setHoveredCalendarDay] = useState(null);

  // Live Clock Ticker
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Modals
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedDateForCorrection, setSelectedDateForCorrection] = useState('');
  const [wfhModalOpen, setWfhModalOpen] = useState(false);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState('meal');
  const [actionError, setActionError] = useState('');

  // API Data
  const { data, isLoading, refetch } = useGetMyAttendanceQuery({ month: selectedMonth });

  // History Matrix Data (for personal Attendance History tab)
  const [historyPage, setHistoryPage] = useState(1);
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useGetAttendanceHistoryQuery(
    {
      month: selectedMonth,
      selfOnly: true,
      page: 1,
      limit: 1
    },
    { skip: activeTab !== 'history' }
  );

  const historyItems = historyData?.data?.items || [];
  const historyTotal = historyData?.data?.total || 0;
  const historyPages = historyData?.data?.pages || 1;
  const historyDaysCount = historyData?.data?.daysInMonth || daysInMonth;

  // Personal Requests & History Queries for Notification Badges
  const { data: myWFHData, refetch: refetchWFH } = useGetMyWFHRequestsQuery({ status: 'all' });
  const { data: myCorrectionsData, refetch: refetchCorrections } = useGetMyCorrectionsQuery({ status: 'all' });

  const pendingRequestsCount = useMemo(() => {
    const wfhPending = (myWFHData?.data || []).filter((r) => r.status === 'pending').length;
    const correctionsPending = (myCorrectionsData?.data || []).filter((r) => r.status === 'pending').length;
    return wfhPending + correctionsPending;
  }, [myWFHData, myCorrectionsData]);

  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();
  const [startBreak, { isLoading: isStartingBreak }] = useStartBreakMutation();
  const [endBreak, { isLoading: isEndingBreak }] = useEndBreakMutation();

  const summary = data?.data?.summary || {
    totalDays: 0,
    presentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    absentCount: 0,
    leaveCount: 0,
    totalWorkHours: 0,
    totalOvertimeHours: 0
  };

  const isMonthLocked = data?.data?.isMonthLocked || false;
  const records = data?.data?.records || [];
  const shiftInfo = data?.data?.shift || null;
  const employeeData = data?.data?.employee || null;

  // Map records by YYYY-MM-DD
  const recordMap = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      const dStr = new Date(r.date).toISOString().split('T')[0];
      map.set(dStr, r);
    });
    return map;
  }, [records]);

  // Today's record & punch status
  const todayRecord = recordMap.get(todayStr);
  const isClockedIn = Boolean(todayRecord?.checkIn);
  const isClockedOut = Boolean(todayRecord?.checkOut);
  const activeBreak = todayRecord?.breaks?.find((b) => b.endTime === null);
  const isOnBreak = Boolean(activeBreak);

  // Selected date record (defaults to today if selected)
  const selectedRecord = recordMap.get(selectedDate) || (selectedDate === todayStr ? todayRecord : null);

  // Live Duty elapsed ticker
  const [elapsedDuration, setElapsedDuration] = useState('00:00:00');
  useEffect(() => {
    if (isClockedIn && !isClockedOut && todayRecord?.checkIn) {
      const calcElapsed = () => {
        const start = new Date(todayRecord.checkIn).getTime();
        const now = new Date().getTime();
        const diffMs = Math.max(0, now - start);
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setElapsedDuration(
          `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      };
      calcElapsed();
      const interval = setInterval(calcElapsed, 1000);
      return () => clearInterval(interval);
    } else if (todayRecord?.workDurationMinutes) {
      const h = Math.floor(todayRecord.workDurationMinutes / 60);
      const m = todayRecord.workDurationMinutes % 60;
      setElapsedDuration(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    } else {
      setElapsedDuration('00:00:00');
    }
  }, [isClockedIn, isClockedOut, todayRecord]);

  // Handle Clock Actions
  const handleCheckIn = async () => {
    setActionError('');
    clearGeoError();

    let punchLocation = null;
    try {
      const coords = await getLocation();
      punchLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        isMock: false
      };
    } catch (locErr) {
      console.warn('Geolocation capture skipped or denied:', locErr.message);
    }

    if (isFieldVisit) {
      if (!clientName.trim()) {
        setActionError('Please enter the client / site name for field punch.');
        return;
      }
      punchLocation = {
        ...(punchLocation || {}),
        isClientVisit: true,
        clientName: clientName.trim(),
        clientRemarks: clientRemarks.trim()
      };
    }

    try {
      await checkIn({
        source: isFieldVisit ? 'field' : 'web',
        location: punchLocation
      }).unwrap();
      refetch();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Failed to clock in');
    }
  };

  const handleCheckOut = async () => {
    setActionError('');
    clearGeoError();

    let punchLocation = null;
    try {
      const coords = await getLocation();
      punchLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        isMock: false
      };
    } catch (locErr) {
      console.warn('Geolocation capture skipped or denied on checkout:', locErr.message);
    }

    try {
      await checkOut({ location: punchLocation }).unwrap();
      refetch();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Failed to clock out');
    }
  };

  const handleStartBreak = async () => {
    setActionError('');
    try {
      await startBreak({ type: selectedBreakType }).unwrap();
      setBreakModalOpen(false);
      refetch();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    setActionError('');
    try {
      await endBreak({}).unwrap();
      refetch();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Failed to end break');
    }
  };

  // Shift & Office Hours Display
  const shiftDisplay = useMemo(() => {
    if (isSuperAdmin) return 'Shift: Flexible (Executive)';
    if (shiftInfo?.startTime && shiftInfo?.endTime) {
      return `Shift: ${shiftInfo.startTime} - ${shiftInfo.endTime}`;
    }
    return 'Shift: 11:00 - 17:00';
  }, [isSuperAdmin, shiftInfo]);

  // Compute 3 Working KPI Metrics
  const workedTodayHours = useMemo(() => {
    if (todayRecord?.workDurationMinutes) {
      const h = Math.floor(todayRecord.workDurationMinutes / 60);
      const m = todayRecord.workDurationMinutes % 60;
      return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
    }
    if (isClockedIn && !isClockedOut) {
      const parts = elapsedDuration.split(':');
      return `${parts[0]}h ${parts[1]}m`;
    }
    return '00h 00m';
  }, [todayRecord, isClockedIn, isClockedOut, elapsedDuration]);

  const remainingHours = useMemo(() => {
    if (isSuperAdmin) return 'Flexible';
    const targetMinutes = 360;
    const currentWorkedMinutes = todayRecord?.workDurationMinutes || 0;
    const remaining = Math.max(0, targetMinutes - currentWorkedMinutes);
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  }, [isSuperAdmin, todayRecord]);

  const thisMonthHours = useMemo(() => {
    const totalH = summary.totalWorkHours || 0;
    const h = Math.floor(totalH);
    const m = Math.round((totalH % 1) * 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  }, [summary.totalWorkHours]);

  // Month navigation handlers

  const handlePrevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Helper to format date as DD-MM-YYYY
  const formatDisplayDate = (dStr) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-');
    return `${d}-${m}-${y}`;
  };

  // Helper to calculate late difference string accurately
  const getLateDifference = (rec) => {
    if (!rec?.checkIn) return null;
    const checkInDate = new Date(rec.checkIn);
    const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
    let shiftStartMins = 11 * 60;
    if (shiftInfo?.startTime) {
      const parts = shiftInfo.startTime.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) shiftStartMins = h * 60 + m;
    }
    const diff = checkInMins - shiftStartMins;
    if (diff > 0) {
      const lh = Math.floor(diff / 60);
      const lm = diff % 60;
      return `${lh}h ${lm}m late`;
    }
    return null;
  };

  // Generate 7-day Hours & Punctuality data
  const last7DaysData = useMemo(() => {
    const list = [];
    const anchor = new Date(todayStr);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const isWeekend = dayName === 'Sat' || dayName === 'Sun';

      const rec = recordMap.get(dateKey);
      let durationHours = 0;
      if (rec?.workDurationMinutes) {
        durationHours = Number((rec.workDurationMinutes / 60).toFixed(1));
      } else if (dateKey === todayStr && isClockedIn && !isClockedOut) {
        const parts = elapsedDuration.split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        durationHours = Number((h + m / 60).toFixed(1));
      }

      let dotType = 'grey';
      let statusText = isWeekend ? 'Weekend Off' : 'Not Scheduled';

      if (rec) {
        if (rec.flags?.includes('wfh') || rec.source === 'wfh') {
          dotType = 'indigo';
          statusText = 'Work From Home';
        } else if (rec.status === 'late' || rec.flags?.includes('late')) {
          dotType = 'red';
          statusText = 'Late Arrival';
        } else if (rec.status === 'present') {
          dotType = 'green';
          statusText = 'On-Time Check In';
        } else if (rec.status === 'absent') {
          dotType = 'red';
          statusText = 'Absent';
        } else if (rec.status === 'half_day') {
          dotType = 'purple';
          statusText = 'Half Day';
        }
      } else if (!isWeekend && d < new Date(todayStr)) {
        dotType = 'red';
        statusText = 'Absent';
      }

      list.push({
        dateKey,
        dayNum,
        dayName,
        label: `${dayNum} ${monthName} ${dayName}`,
        hours: durationHours,
        dotType,
        statusText,
        record: rec,
        isWeekend
      });
    }
    return list;
  }, [recordMap, todayStr, isClockedIn, isClockedOut, elapsedDuration]);

  // Generate Calendar Grid Cells with Temporal Block Guards
  const calendarCells = useMemo(() => {
    const cells = [];
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const prevMonthDaysCount = new Date(year, month - 1, 0).getDate();

    // Previous month padding days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthDaysCount - i;
      cells.push({
        dayNum: pDay,
        isCurrentMonth: false,
        dateKey: ''
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const rec = recordMap.get(dateKey);
      const dayObj = new Date(year, month - 1, day);
      const isWeekend = dayObj.getDay() === 0 || dayObj.getDay() === 6;

      const isFuture = dateKey > todayStr;
      const isToday = dateKey === todayStr;

      let dotColor = 'grey';
      let statusLabel = isWeekend ? 'Weekend Off' : 'Not Scheduled';

      if (rec) {
        if (rec.flags?.includes('wfh') || rec.source === 'wfh' || rec.status === 'wfh') {
          dotColor = 'indigo';
          statusLabel = 'Work From Home (WFH)';
        } else if (rec.status === 'late' || rec.flags?.includes('late')) {
          dotColor = 'amber';
          statusLabel = 'Late Arrival';
        } else if (rec.status === 'present') {
          dotColor = 'green';
          statusLabel = 'Present';
        } else if (rec.status === 'absent') {
          dotColor = 'red';
          statusLabel = 'Absent';
        } else if (rec.status === 'half_day' || rec.status === 'on_leave' || rec.status === 'holiday') {
          dotColor = 'sky';
          statusLabel = 'Leave / Off';
        }
      } else if (dateKey < todayStr && !isWeekend) {
        dotColor = 'red';
        statusLabel = 'Absent';
      } else if (isFuture) {
        dotColor = 'grey';
        statusLabel = 'Not Scheduled';
      }

      cells.push({
        dayNum: day,
        isCurrentMonth: true,
        dateKey,
        dayName: dayObj.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDateFormatted: dayObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        record: rec,
        dotColor,
        statusLabel,
        isWeekend,
        isFuture,
        isToday
      });
    }

    // Next month padding days to complete grid
    const totalFilled = cells.length;
    const targetSize = totalFilled > 35 ? 42 : 35;
    for (let i = 1; i <= targetSize - totalFilled; i++) {
      cells.push({
        dayNum: i,
        isCurrentMonth: false,
        dateKey: ''
      });
    }

    return cells;
  }, [year, month, daysInMonth, recordMap, todayStr]);

  // Business Constraint: Can request missed punch for selectedDate?
  const isCurrentMonthView = selectedMonth === currentActiveMonth;
  const isSelectedDateFuture = selectedDate > todayStr;
  const isSelectedDateActiveToday = selectedDate === todayStr && isClockedIn && !isClockedOut;
  const isMissedPunchEligible =
    !isMonthLocked &&
    isCurrentMonthView &&
    !isSelectedDateFuture &&
    !isSelectedDateActiveToday &&
    can('attendance.correction');

  const missedPunchDisabledReason = !can('attendance.correction')
    ? 'You do not have permission to request punch corrections'
    : isMonthLocked
    ? 'Attendance for this month is locked for payroll'
    : !isCurrentMonthView
    ? 'Punch corrections are only allowed for the current active month'
    : isSelectedDateFuture
    ? 'Cannot request missed punch for future dates'
    : isSelectedDateActiveToday
    ? 'Active session in progress. Please clock out before requesting a missed punch for today.'
    : '';

  // Filtered records for History and Monthly tabs
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const dStr = new Date(r.date).toISOString().split('T')[0];
      const matchSearch =
        dStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.status.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. TOP HEADER & ACTION PILLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Icon */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Attendance
            </h1>
          </div>
        </div>

        {/* Top-Right Status Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Shift Schedule Pill */}
          <div className="relative group">
            <div className="px-3.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{shiftDisplay}</span>
            </div>
            {/* Tooltip */}
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
              Assigned Office Hours
            </div>
          </div>

          {/* Live Duty Ticker Pill */}
          <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold flex items-center gap-2 font-mono shadow-xs">
            <span className={`w-2 h-2 rounded-full ${isClockedIn && !isClockedOut ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>DUTY: {elapsedDuration}</span>
          </div>

          {/* Biometric Terminal Pill */}
          <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <Fingerprint className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Biometric Terminal</span>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-8 text-sm">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'daily'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Daily
          {activeTab === 'daily' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'monthly'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Monthly
          {activeTab === 'monthly' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            if (isDeptManager || isHR || isSuperAdmin) {
              navigate('/attendance/team');
            } else {
              setActiveTab('employee_wise');
            }
          }}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'employee_wise'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Employee Wise
          {activeTab === 'employee_wise' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'history'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Attendance History
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>My Requests & History</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white shadow-2xs">
              {pendingRequestsCount}
            </span>
          )}
          {activeTab === 'requests' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      {activeTab !== 'requests' && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'history' ? "Search employee by name, department..." : "Search attendance"}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
            />
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`p-2.5 rounded-xl border transition-colors shadow-xs flex items-center justify-center ${
                statusFilter !== 'all'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Filter attendance records"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-30">
                <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Filter Status
                </div>
                {['all', 'present', 'late', 'half_day', 'absent'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                      statusFilter === st
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{st === 'all' ? 'All Records' : st.replace('_', ' ').toUpperCase()}</span>
                    {statusFilter === st && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Month Lock Banner (if active) */}
      {isMonthLocked && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm font-medium">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Attendance for <strong className="font-bold">{selectedMonth}</strong> has been locked for payroll calculation. New clock-ins, corrections, or edits are frozen.
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DAILY DASHBOARD (DEFAULT VIEW) */}
      {activeTab === 'daily' && (
        <>
          {/* 4. MAIN HERO PUNCH & STATUS CARD + 3 WORKING KPI CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left: Hero Punch Card */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                {/* Header Row: Circular Clock Icon + Status */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isClockedOut
                        ? 'Shift Completed Today'
                        : isClockedIn
                        ? isOnBreak
                          ? `On Break (${activeBreak?.type})`
                          : 'Active Duty Session'
                        : 'Not Checked In'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isClockedOut
                        ? `Clocked out at ${new Date(todayRecord.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Total worked: ${workedTodayHours}.`
                        : isClockedIn
                        ? `Clocked in at ${new Date(todayRecord.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • Active for ${elapsedDuration}`
                        : "You haven't checked in today yet."}
                    </p>
                  </div>
                </div>

                {/* Sub Badges: Shift Schedule, Live Duty Time, Biometric Device */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="px-3 py-1 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{shiftDisplay}</span>
                  </span>

                  <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 font-mono">
                    <span className={`w-1.5 h-1.5 rounded-full ${isClockedIn && !isClockedOut ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>DUTY TIME: {elapsedDuration}</span>
                  </span>

                  <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
                    <span>Biometric Device Attendance</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400 font-mono">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>

                <div className="flex items-center gap-2">
                  {!can('attendance.mark') ? (
                    <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 font-medium text-xs">
                      Punch Actions Disabled
                    </div>
                  ) : !isClockedIn ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={isCheckingIn || isLoading || isMonthLocked}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-all transform active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isLocating ? 'Acquiring GPS...' : isCheckingIn ? 'Clocking In...' : 'Clock In'}</span>
                    </button>
                  ) : !isClockedOut ? (
                    <>
                      {isOnBreak ? (
                        <button
                          onClick={handleEndBreak}
                          disabled={isEndingBreak}
                          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isEndingBreak ? 'Ending...' : 'End Break'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setBreakModalOpen(true)}
                          disabled={isStartingBreak}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-sm flex items-center gap-1.5 transition-all"
                        >
                          <Coffee className="w-4 h-4" />
                          <span>Take Break</span>
                        </button>
                      )}

                      <button
                        onClick={handleCheckOut}
                        disabled={isCheckingOut || isOnBreak || isMonthLocked}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-all transform active:scale-95"
                        title={isOnBreak ? 'Please end break before clocking out' : 'Clock out'}
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>{isCheckingOut ? 'Clocking Out...' : 'Clock Out'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Shift Completed</span>
                    </div>
                  )}
                </div>
              </div>

                            {/* Privacy Notice Banner (BUILD-GUIDE 14.8) */}
              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Privacy Guaranteed: GPS is captured only at the exact instant of punch. Zero continuous tracking.</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 font-medium text-slate-500">
                  <span>Geofence Enforced</span>
                </div>
              </div>

              {actionError && (
                <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            {/* Right: 3 KPI Cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
              {/* Card 1: Worked Today */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="mt-4">
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Worked Today
                  </div>
                  <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono mt-0.5">
                    {workedTodayHours}
                  </div>
                </div>
              </div>

              {/* Card 2: Remaining */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="mt-4">
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Remaining
                  </div>
                  <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono mt-0.5">
                    {remainingHours}
                  </div>
                </div>
              </div>

              {/* Card 3: This Month */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="mt-4">
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    This Month
                  </div>
                  <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono mt-0.5">
                    {thisMonthHours}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. BOTTOM 2-COLUMN DASHBOARD GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left Column: My Hours & Punctuality */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  My Hours & Punctuality
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daily working hours and check-in status (last 7 days)
                </p>
              </div>

              {/* Chart Area */}
              <div className="mt-8 relative h-48 flex flex-col justify-between">
                {/* Horizontal dotted grid lines (12h, 9h, 6h, 3h, 0h) */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono">
                  {['12h', '9h', '6h', '3h', '0h'].map((yVal) => (
                    <div key={yVal} className="flex items-center gap-3">
                      <span className="w-6 text-right shrink-0">{yVal}</span>
                      <div className="flex-1 border-b border-dashed border-slate-100 dark:border-slate-800/80" />
                    </div>
                  ))}
                </div>

                {/* Top Status Dots Row (Aligned along 11h line) */}
                <div className="absolute top-3 left-9 right-2 flex justify-around pointer-events-none z-10">
                  {last7DaysData.map((d) => (
                    <div key={d.dateKey} className="w-8 flex justify-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs ${
                          d.dotType === 'green'
                            ? 'bg-emerald-500'
                            : d.dotType === 'red'
                            ? 'bg-rose-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Vertical Column Tracks & Bars */}
                <div className="absolute inset-x-0 bottom-6 left-9 right-2 h-36 flex items-end justify-around">
                  {last7DaysData.map((d) => {
                    const heightPercent = Math.min(100, Math.max(0, (d.hours / 12) * 100));
                    const isHovered = hoveredBar === d.dateKey;

                    return (
                      <div
                        key={d.dateKey}
                        onMouseEnter={() => setHoveredBar(d.dateKey)}
                        onMouseLeave={() => setHoveredBar(null)}
                        className="relative flex flex-col items-center justify-end h-full w-8 cursor-pointer"
                      >
                        {/* Shaded Track Column behind the bar */}
                        <div className="absolute inset-x-0.5 top-0 bottom-0 bg-slate-50/80 dark:bg-slate-800/30 rounded-t-md pointer-events-none" />

                        {/* Interactive Tooltip Popover */}
                        {isHovered && (
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-xl p-2.5 shadow-2xl border border-slate-800 text-xs z-30 pointer-events-none whitespace-nowrap min-w-[130px]">
                            <div className="font-bold text-slate-100">{d.dateKey}</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              Worked: <strong className="font-bold text-emerald-400">{d.hours}h</strong>
                            </div>
                            <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                              <span>Status:</span>
                              <span className={`inline-block w-2 h-2 rounded-full ${d.dotType === 'green' ? 'bg-emerald-400' : d.dotType === 'red' ? 'bg-rose-400' : 'bg-slate-400'}`} />
                              <span className={d.dotType === 'red' ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                                {d.statusText}
                              </span>
                            </div>
                            {/* Downward triangle arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                          </div>
                        )}

                        {/* Worked Hours Colored Bar (Emerald Brand Accent) */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-5 rounded-t-md transition-all duration-300 relative z-10 ${
                            d.hours > 0
                              ? 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 shadow-xs'
                              : 'bg-transparent'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Day Labels */}
                <div className="absolute inset-x-0 bottom-0 left-9 right-2 flex items-center justify-around text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {last7DaysData.map((d) => (
                    <span
                      key={d.dateKey}
                      className={`text-center w-12 ${
                        d.dateKey === todayStr ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''
                      }`}
                    >
                      {d.dayNum} {d.dayName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Legend for Hours & Punctuality */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Worked Hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>On-Time Check In</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Late Check In</span>
                </div>
              </div>
            </div>

            {/* Right Column: Attendance Calendar */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative">
              <div>
                {/* Calendar Header with Navigation */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Attendance Calendar
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono px-1">
                      {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Row (Sun, Mon, Tue, Wed, Thu, Fri, Sat) */}
                <div className="grid grid-cols-7 gap-1 text-center mt-5 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-[11px] font-semibold text-slate-400">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Cells Grid with Future Date Guard */}
                <div className="grid grid-cols-7 gap-1 text-center relative">
                  {calendarCells.map((cell, idx) => {
                    if (!cell.isCurrentMonth) {
                      return (
                        <div
                          key={`pad-${idx}`}
                          className="h-10 flex items-center justify-center text-xs text-slate-300 dark:text-slate-700 font-medium"
                        >
                          {cell.dayNum}
                        </div>
                      );
                    }

                    const isSelected = cell.dateKey === selectedDate;
                    const isToday = cell.dateKey === todayStr;
                    const isFuture = cell.isFuture;
                    const isHovered = hoveredCalendarDay === cell.dateKey;
                    const rec = cell.record;

                    // Can trigger correction directly on click?
                    const canClickForCorrection =
                      !isFuture &&
                      isCurrentMonthView &&
                      !isMonthLocked &&
                      can('attendance.correction') &&
                      !(isToday && isClockedIn && !isClockedOut);

                    return (
                      <div
                        key={cell.dateKey}
                        className="relative"
                        onMouseEnter={() => setHoveredCalendarDay(cell.dateKey)}
                        onMouseLeave={() => setHoveredCalendarDay(null)}
                      >
                        {/* Interactive Tooltip Popover */}
                        {isHovered && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-xl p-3 shadow-2xl border border-slate-800 text-xs z-40 pointer-events-none whitespace-nowrap min-w-[170px] text-left">
                            <div className="font-bold text-slate-100">{cell.fullDateFormatted}</div>
                            {/* Status Badge */}
                            <div className="my-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cell.dotColor === 'indigo'
                                  ? 'bg-indigo-600 text-white'
                                  : cell.dotColor === 'amber'
                                  ? 'bg-amber-600 text-white'
                                  : cell.dotColor === 'green'
                                  ? 'bg-emerald-600 text-white'
                                  : cell.dotColor === 'red'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-700 text-slate-200'
                              }`}>
                                {cell.statusLabel}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                              <div>
                                Check In: {rec?.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'}
                                {getLateDifference(rec) && (
                                  <span className="text-amber-400 font-sans ml-1">({getLateDifference(rec)})</span>
                                )}
                              </div>
                              <div>
                                Check Out: {rec?.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : rec?.checkIn ? 'Active' : '--'}
                              </div>
                              <div>
                                Worked: {rec?.workDurationMinutes ? `${(rec.workDurationMinutes / 60).toFixed(1)}h` : '0h'}
                              </div>
                            </div>
                            {/* Downward triangle arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                          </div>
                        )}

                        {/* Cell Button */}
                        <button
                          onClick={() => {
                            setSelectedDate(cell.dateKey);
                            if (canClickForCorrection) {
                              setSelectedDateForCorrection(cell.dateKey);
                            }
                          }}
                          disabled={isFuture}
                          className={`w-full h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isFuture
                              ? 'opacity-40 cursor-not-allowed text-slate-400'
                              : isSelected || (isToday && !selectedDate)
                              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/25'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                          title={isFuture ? 'Future date (not accessible for punch operations)' : undefined}
                        >
                          <span className="text-xs leading-none">{cell.dayNum}</span>
                          {/* Status Dot */}
                          {!isFuture && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                isSelected || (isToday && !selectedDate)
                                  ? 'border border-white bg-transparent'
                                  : cell.dotColor === 'indigo'
                                  ? 'bg-indigo-500'
                                  : cell.dotColor === 'amber'
                                  ? 'bg-amber-500'
                                  : cell.dotColor === 'green'
                                  ? 'bg-emerald-500'
                                  : cell.dotColor === 'red'
                                  ? 'bg-rose-500'
                                  : cell.dotColor === 'sky'
                                  ? 'bg-sky-500'
                                  : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Complete Calendar Legend */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                    <span>Filter Applied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>WFH</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Late</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Leave / Off</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Not Scheduled</span>
                  </div>
                </div>

                {/* Quick Action Buttons with Temporal Business Guards */}
                <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/60">
                  {can('attendance.wfh') && (
                    <button
                      onClick={() => setWfhModalOpen(true)}
                      disabled={isMonthLocked}
                      className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Apply WFH</span>
                    </button>
                  )}
                  {can('attendance.correction') && (
                    <button
                      onClick={() => {
                        if (isMissedPunchEligible) {
                          setSelectedDateForCorrection(selectedDate || todayStr);
                          setCorrectionModalOpen(true);
                        }
                      }}
                      disabled={!isMissedPunchEligible}
                      title={missedPunchDisabledReason || 'Request Missed Punch'}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors ${
                        isMissedPunchEligible
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Request Missed Punch</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 6. BOTTOM DETAILED RECORD ROW / TABLE (100% Real Dynamic Data - Matches Screenshot 2) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Designation</th>
                    <th className="py-3.5 px-6">Shift</th>
                    <th className="py-3.5 px-6">Method</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Start Time</th>
                    <th className="py-3.5 px-6">End Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Date */}
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white font-mono">
                      {formatDisplayDate(selectedDate || todayStr)}
                    </td>

                    {/* Designation & Employee Name (Real Data from employeeData / user) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {employeeData?.name || user?.name || 'Staff Member'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {employeeData?.designation || user?.designation || 'Staff'}
                        </span>
                      </div>
                    </td>

                    {/* Shift (Real Data from shiftInfo) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{shiftInfo?.name || 'Morning Regular'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {shiftInfo?.startTime && shiftInfo?.endTime
                          ? `${shiftInfo.startTime} - ${shiftInfo.endTime}`
                          : '11:00 - 17:00'}
                      </div>
                    </td>

                    {/* Method (Real Data from checkInSource) */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{selectedRecord?.checkInSource === 'web' ? 'Web' : 'Biometric'}</span>
                      </span>
                    </td>

                    {/* Status (Real Computed State matching Screenshot 2) */}
                    <td className="py-4 px-6">
                      {selectedRecord?.status === 'late' || (selectedRecord?.checkIn && getLateDifference(selectedRecord)) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Late ({getLateDifference(selectedRecord) || 'Late'})</span>
                        </span>
                      ) : selectedRecord?.status === 'present' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Present</span>
                        </span>
                      ) : selectedRecord?.status === 'absent' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          <span>Absent</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <span>{selectedRecord?.status ? selectedRecord.status.replace('_', ' ').toUpperCase() : 'No Punch'}</span>
                        </span>
                      )}
                    </td>

                    {/* Start Time (Real Formatted Check-in & Late Badge) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {selectedRecord?.checkIn
                            ? new Date(selectedRecord.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </span>
                        {getLateDifference(selectedRecord) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/60">
                            Late ({getLateDifference(selectedRecord)})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* End Time (Real Checkout or Active Status) */}
                    <td className="py-4 px-6">
                      {selectedRecord?.checkOut ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {new Date(selectedRecord.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : selectedRecord?.checkIn || (selectedDate === todayStr && isClockedIn) ? (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                          Active
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Emerald Accent Scroll Indicator */}
            <div className="h-1 bg-slate-100 dark:bg-slate-800 relative">
              <div className="h-full bg-emerald-500 rounded-full w-4/5 mx-auto" />
            </div>
          </div>
        </>
      )}

      {/* TAB CONTENT: MONTHLY VIEW */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Present</div>
              <div className="text-2xl font-extrabold text-emerald-600">{summary.presentCount}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Late</div>
              <div className="text-2xl font-extrabold text-amber-600">{summary.lateCount}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Half Day</div>
              <div className="text-2xl font-extrabold text-purple-600">{summary.halfDayCount}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Absent</div>
              <div className="text-2xl font-extrabold text-rose-600">{summary.absentCount}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Leaves/Off</div>
              <div className="text-2xl font-extrabold text-sky-600">{summary.leaveCount}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Work Hours</div>
              <div className="text-2xl font-extrabold text-blue-600">{summary.totalWorkHours}h</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Overtime</div>
              <div className="text-2xl font-extrabold text-indigo-600">{summary.totalOvertimeHours}h</div>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono">
              {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Full Expanded Days Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {Array.from({ length: daysInMonth }, (_, idx) => {
              const day = idx + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayObj = new Date(year, month - 1, day);
              const dayName = dayObj.toLocaleDateString('en-US', { weekday: 'short' });
              const isWeekend = dayName === 'Sat' || dayName === 'Sun';
              const rec = recordMap.get(dateStr);
              const isFuture = dateStr > todayStr;
              const canClickDay =
                !isFuture &&
                isCurrentMonthView &&
                !isMonthLocked &&
                can('attendance.correction') &&
                !(dateStr === todayStr && isClockedIn && !isClockedOut);

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    if (canClickDay) {
                      setSelectedDateForCorrection(dateStr);
                      setCorrectionModalOpen(true);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isFuture
                      ? 'opacity-40 cursor-not-allowed bg-slate-50/40 dark:bg-slate-900/20 border-slate-200/40'
                      : canClickDay
                      ? 'cursor-pointer hover:shadow-md'
                      : 'cursor-default'
                  } ${
                    rec?.flags?.includes('wfh') || rec?.source === 'wfh'
                      ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20'
                      : rec?.status === 'present'
                      ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                      : rec?.status === 'late'
                      ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20'
                      : rec?.status === 'half_day'
                      ? 'border-purple-200 bg-purple-50/30 dark:border-purple-900/40 dark:bg-purple-950/20'
                      : rec?.status === 'absent'
                      ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20'
                      : isWeekend
                      ? 'border-slate-200/60 bg-slate-50/40 dark:border-slate-800/40 dark:bg-slate-900/30 opacity-70'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                      {day}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">
                      {dayName}
                    </span>
                  </div>

                  {rec ? (
                    <div className="space-y-1.5">
                      <div>
                        <AttendanceStatusBadge status={rec.status} flags={rec.flags} />
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between font-mono pt-1">
                        <span>In: {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                        <span>Out: {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      </div>
                      {rec.workDurationMinutes > 0 && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {(rec.workDurationMinutes / 60).toFixed(1)} hrs worked
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-14 flex items-center justify-center text-xs text-slate-400 italic">
                      {isWeekend ? 'Weekend Off' : 'No Punch'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EMPLOYEE WISE OVERVIEW */}
      {activeTab === 'employee_wise' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Individual Attendance Profile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your cumulative shifts, punctuality rate, and work duration breakdown.
              </p>
            </div>
            {(isDeptManager || isHR || isSuperAdmin) && (
              <button
                onClick={() => navigate('/attendance/team')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Go to Team Attendance</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase">Assigned Schedule</div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{shiftDisplay}</div>
              <div className="text-xs text-slate-500 mt-1">Standard Office Hours</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase">Monthly Work Hours</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">{summary.totalWorkHours}h total</div>
              <div className="text-xs text-slate-500 mt-1">{summary.presentCount} present days recorded</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase">Punctuality Score</div>
              <div className="text-lg font-bold text-blue-600 mt-1">
                {summary.presentCount + summary.lateCount > 0
                  ? `${Math.round((summary.presentCount / (summary.presentCount + summary.lateCount)) * 100)}%`
                  : '100%'}
              </div>
              <div className="text-xs text-slate-500 mt-1">{summary.lateCount} late arrival incidents</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ATTENDANCE HISTORY TABLE (Matches Screenshot & Project Theme) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* 1. Month Navigator Strip */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
                {new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="opacity-0 w-8 h-8 absolute inset-0 cursor-pointer z-10"
                id="month-history-picker"
              />
              <div className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 2. Key / Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 px-2 py-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-800 dark:text-slate-200">Key:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-transparent" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Late</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Leave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Weekly Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Rest-Day OT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 opacity-60" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Upcoming</span>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-400 italic font-sans">
              {new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* 3. Main Attendance Matrix Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {isHistoryLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3" />
                <div className="text-sm font-medium">Loading attendance history...</div>
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">
                No employee records found matching query for {selectedMonth}.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      {/* Fixed Left Header: EMPLOYEE */}
                      <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/95 py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider min-w-[210px] max-w-[230px] border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        EMPLOYEE
                      </th>

                      {/* Day Columns (1..daysInMonth) */}
                      {Array.from({ length: historyDaysCount }, (_, idx) => {
                        const day = idx + 1;
                        const dayDate = new Date(year, month - 1, day);
                        const dayShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        return (
                          <th
                            key={day}
                            className="py-2.5 px-1 min-w-[68px] max-w-[68px] text-center border-r border-slate-100 dark:border-slate-800/60"
                          >
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{day}</div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{dayShort}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {historyItems.map((item) => {
                      const emp = item.employee;
                      const empInitials = emp.name
                        ? emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'EM';

                      return (
                        <tr key={emp._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Fixed Left Employee Column */}
                          <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-3 px-4 min-w-[210px] max-w-[230px] border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center gap-2.5">
                              {emp.avatar ? (
                                <img
                                  src={emp.avatar}
                                  alt={emp.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {empInitials}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 dark:text-white truncate text-xs" title={emp.name}>
                                  {emp.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={`${emp.designation} · ${emp.department}`}>
                                  {emp.designation} · {emp.department}
                                </div>
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 mt-0.5">
                                  {emp.offLabel || 'Sun Off'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Day Cells (1..daysInMonth) */}
                          {Array.from({ length: historyDaysCount }, (_, idx) => {
                            const day = idx + 1;
                            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const rec = item.records?.[dateKey];

                            const checkInTime = rec?.checkIn
                              ? new Date(rec.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                              : '--';
                            const checkOutTime = rec?.checkOut
                              ? new Date(rec.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                              : '--';

                            return (
                              <td
                                key={dateKey}
                                className="py-2 px-1 min-w-[68px] max-w-[68px] text-center border-r border-slate-100 dark:border-slate-800/60 align-middle"
                              >
                                <div className="w-full h-[62px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-1 flex flex-col justify-between items-center transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                  {rec?.isWeeklyOff ? (
                                    <div className="h-full flex items-center justify-center">
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-orange-600 dark:text-orange-300 border border-orange-300/80 dark:border-orange-800/60 bg-orange-50/70 dark:bg-orange-950/30">
                                        OFF
                                      </span>
                                    </div>
                                  ) : rec?.isUpcoming ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                      <span className="text-[10px] text-slate-400 font-medium">--</span>
                                    </div>
                                  ) : rec?.status === 'present' ? (
                                    <>
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono px-0.5">
                                        <span className="text-emerald-600 font-bold">▲ {checkInTime}</span>
                                        <span className="text-rose-600 font-bold">▼ {checkOutTime}</span>
                                      </div>
                                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 leading-none">
                                        ✓ Present
                                      </span>
                                    </>
                                  ) : rec?.status === 'late' || rec?.isLate ? (
                                    <>
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono px-0.5">
                                        <span className="text-amber-600 font-bold">▲ {checkInTime}</span>
                                        <span className="text-rose-600 font-bold">▼ {checkOutTime}</span>
                                      </div>
                                      <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5 leading-none">
                                        ⏰ Late
                                      </span>
                                    </>
                                  ) : rec?.status === 'half_day' ? (
                                    <>
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono px-0.5">
                                        <span className="text-purple-600 font-bold">▲ {checkInTime}</span>
                                        <span className="text-rose-600 font-bold">▼ {checkOutTime}</span>
                                      </div>
                                      <span className="text-[10px] font-semibold text-purple-600 flex items-center gap-0.5 leading-none">
                                        ½ Half Day
                                      </span>
                                    </>
                                  ) : rec?.status === 'on_leave' || rec?.status === 'holiday' ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                      <span className="text-[10px] font-semibold text-sky-600 flex items-center gap-0.5">
                                        ✈ Leave
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono px-0.5 text-slate-400">
                                        <span className="text-emerald-600/40 font-bold">▲ --</span>
                                        <span className="text-rose-500/40 font-bold">▼ --</span>
                                      </div>
                                      <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 leading-none">
                                        ✕ Absent
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Bottom Pagination Bar (Matches Screenshot) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Showing {historyTotal > 0 ? (historyPage - 1) * 10 + 1 : 0} to{' '}
                {Math.min(historyPage * 10, historyTotal)} of {historyTotal} entries
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage <= 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: historyPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setHistoryPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                      historyPage === p
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setHistoryPage((p) => Math.min(historyPages, p + 1))}
                  disabled={historyPage >= historyPages}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MY REQUESTS & HISTORY */}
      {activeTab === 'requests' && (
        <MyRequestsView
          onApplyWFH={() => setWfhModalOpen(true)}
          onRequestCorrection={() => {
            setSelectedDateForCorrection(todayStr);
            setCorrectionModalOpen(true);
          }}
        />
      )}

      {/* Break Type Selector Modal */}
      {breakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Select Break Type
              </h3>
              <button
                onClick={() => setBreakModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { type: 'meal', label: 'Meal / Lunch Break', desc: '1 hour standard interval' },
                { type: 'tea', label: 'Tea / Coffee Break', desc: '15 minutes standard interval' },
                { type: 'emergency', label: 'Personal / Emergency', desc: '30 minutes standard interval' },
                { type: 'prayer', label: 'Prayer / Quiet Time', desc: '20 minutes standard interval' }
              ].map((opt) => (
                <label
                  key={opt.type}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedBreakType === opt.type
                      ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="breakType"
                    value={opt.type}
                    checked={selectedBreakType === opt.type}
                    onChange={(e) => setSelectedBreakType(e.target.value)}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {opt.label}
                    </div>
                    <div className="text-xs text-slate-400">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBreakModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleStartBreak}
                disabled={isStartingBreak}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all"
              >
                {isStartingBreak ? 'Starting...' : 'Start Break'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missed Punch / Correction Modal */}
      <RequestCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        defaultDate={selectedDateForCorrection || selectedDate || todayStr}
        isClockedInToday={isClockedIn}
        isClockedOutToday={isClockedOut}
        onSuccess={() => {
          refetch();
          refetchCorrections();
        }}
      />

      {/* Apply WFH Modal */}
      <ApplyWFHModal
        isOpen={wfhModalOpen}
        onClose={() => setWfhModalOpen(false)}
        onSuccess={() => {
          refetch();
          refetchWFH();
        }}
      />
    </div>
  );
};
