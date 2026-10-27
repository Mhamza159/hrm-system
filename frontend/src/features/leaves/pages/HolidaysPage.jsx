/**
 * @file HolidaysPage.jsx
 * @description Master Public & Gazetted Holidays Calendar Screen with Table & Card View Modes.
 * 
 * SPECIFICATION & THEME:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.11)
 * - Features: Dual View (Table & Card Grid), Category Filter Pills, Live Search, Year Selector,
 *             Pakistan Official Holiday Seeder, Add/Edit/Delete Modals.
 * - Theme: ELVARA Emerald Design System (100% Light & Dark Mode Compatible)
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sparkles,
  Flag,
  CalendarDays,
  List,
  LayoutGrid,
  Search,
  X,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetHolidaysQuery,
  useDeleteHolidayMutation,
  useSeedHolidaysMutation
} from '../leavesApi.js';
import { HolidayModal } from '../components/HolidayModal.jsx';
import { cn } from '../../../lib/utils.js';

export function HolidaysPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'gazetted' | 'lunar' | 'optional'
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: response, isLoading, refetch } = useGetHolidaysQuery({ year: selectedYear });
  const rawHolidays = response?.data || [];

  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();
  const [seedHolidays, { isLoading: isSeeding }] = useSeedHolidaysMutation();

  // Metrics
  const totalHolidays = rawHolidays.length;
  const gazettedHolidays = rawHolidays.filter((h) => h.type === 'gazetted').length;
  const lunarHolidays = rawHolidays.filter((h) => h.isLunar).length;
  const optionalHolidays = rawHolidays.filter((h) => h.type === 'optional' || h.type === 'restricted').length;

  const now = new Date();
  const upcoming = useMemo(() => {
    return rawHolidays
      .filter((h) => new Date(h.date) >= now && h.isActive)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }, [rawHolidays]);

  // Filtered dataset
  const filteredHolidays = useMemo(() => {
    return rawHolidays.filter((h) => {
      // Category filter
      if (categoryFilter === 'gazetted' && h.type !== 'gazetted') return false;
      if (categoryFilter === 'lunar' && !h.isLunar) return false;
      if (categoryFilter === 'optional' && h.type !== 'optional' && h.type !== 'restricted') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const d = new Date(h.date);
        const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).toLowerCase();
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
        const matchesName = h.name?.toLowerCase().includes(q);
        const matchesDesc = h.description?.toLowerCase().includes(q);
        const matchesType = h.type?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesType && !dateStr.includes(q) && !dayStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rawHolidays, categoryFilter, searchQuery]);

  const handleCreate = () => {
    setSelectedHoliday(null);
    setIsModalOpen(true);
  };

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHoliday(deleteTarget._id).unwrap();
      setFeedback({ type: 'success', message: `Holiday '${deleteTarget.name}' deleted successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.data?.message || err?.message || 'Failed to delete holiday' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSeedConfirm = async () => {
    try {
      const res = await seedHolidays({ year: selectedYear }).unwrap();
      setFeedback({
        type: 'success',
        message: res.message || `Successfully seeded official holidays for ${selectedYear}.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.data?.message || err?.message || 'Failed to seed holidays'
      });
    } finally {
      setShowSeedConfirm(false);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Date & Day',
      accessor: (row) => {
        const d = new Date(row.date);
        const dateStr = d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        });
        const dayStr = d.toLocaleDateString('en-US', {
          weekday: 'long',
          timeZone: 'UTC'
        });
        return (
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900 dark:text-white tracking-wide text-xs">
              {dateStr}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {dayStr}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Holiday Name & Notes',
      accessor: (row) => (
        <div className="space-y-1 max-w-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              {row.name}
            </span>
            {row.isLunar && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-full">
                <Moon className="w-2.5 h-2.5 text-amber-500" />
                <span>Lunar</span>
              </span>
            )}
          </div>
          {row.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {row.description}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (row) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border',
            row.type === 'gazetted'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300'
          )}
        >
          {row.type === 'gazetted' && <Flag className="w-3 h-3 text-emerald-600" />}
          <span>{row.type.toUpperCase()}</span>
        </span>
      )
    },
    {
      header: 'Exemption Policy',
      accessor: () => (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Excluded from Leaves</span>
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
            row.isActive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', row.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
          <span>{row.isActive ? 'Active' : 'Disabled'}</span>
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Can I="leave.settings" a="Leave">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
              title="Edit Holiday"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              disabled={!row.isActive}
              className={cn(
                'p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer',
                row.isActive
                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  : 'text-slate-400 cursor-not-allowed opacity-50'
              )}
              title="Delete Holiday"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Gazetted & Public Holidays"
        subtitle="Pakistan official statutory holidays and lunar festival schedules. Excluded automatically from employee leave deductions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Leaves', href: '/leaves/my' },
          { label: 'Holidays' }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Filter by Year"
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold rounded-xl pl-3.5 pr-8 py-2 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs cursor-pointer transition-colors"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <Can I="leave.settings" a="Leave">
              {/* Seed Standard Holidays Button */}
              <button
                onClick={() => setShowSeedConfirm(true)}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                title="Seed standard Pakistan official gazetted and public holidays"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isSeeding ? 'Seeding...' : 'Seed Official Holidays'}</span>
              </button>

              {/* Add Holiday Button */}
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Holiday</span>
              </button>
            </Can>
          </div>
        }
      />

      {/* 2. Feedback Alert */}
      {feedback.message && (
        <div
          className={cn(
            'flex items-center justify-between p-4 rounded-2xl border text-xs shadow-xs',
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label={`Holidays in ${selectedYear}`}
          value={totalHolidays}
          caption={`${gazettedHolidays} official gazetted`}
          variant="emerald"
        />
        <StatCard
          icon={Flag}
          label="Gazetted Days"
          value={gazettedHolidays}
          caption="Mandatory office closures"
          variant="blue"
        />
        <StatCard
          icon={Moon}
          label="Lunar Festivals"
          value={lunarHolidays}
          caption="Subject to moon sighting"
          variant="purple"
        />
        <StatCard
          icon={Sparkles}
          label="Next Public Holiday"
          value={upcoming ? upcoming.name : 'None upcoming'}
          caption={
            upcoming
              ? new Date(upcoming.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'UTC'
                })
              : 'All observed for year'
          }
          variant="rose"
        />
      </div>

      {/* 4. Filter & View Switcher Bar */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'all', label: 'All Holidays', count: totalHolidays },
              { id: 'gazetted', label: 'Gazetted', count: gazettedHolidays },
              { id: 'lunar', label: 'Lunar Festivals', count: lunarHolidays },
              { id: 'optional', label: 'Optional / Cultural', count: optionalHolidays }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setCategoryFilter(st.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shadow-2xs cursor-pointer',
                  categoryFilter === st.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span>{st.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    categoryFilter === st.id
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  )}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Right Controls: Search, View Mode, Refresh */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search holiday name or date..."
                className="w-full pl-9 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-0.5 shadow-2xs shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                )}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                )}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="p-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Holidays"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. Main Content: Table or Card Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 animate-pulse text-xs">
            Loading public & gazetted holidays...
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {searchQuery ? `No holidays match "${searchQuery}"` : `No holidays for ${selectedYear}`}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try searching with a different holiday name or clear filters.'
                : 'Click "Seed Official Holidays" to populate statutory dates or add custom holidays.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredHolidays}
              isLoading={isLoading}
              emptyMessage={`No holidays found matching filters.`}
            />
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 pt-1">
            {filteredHolidays.map((holiday) => {
              const d = new Date(holiday.date);
              const monthStr = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
              const dayNum = d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'UTC' });
              const weekdayStr = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

              return (
                <div
                  key={holiday._id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  {/* Card Top: Date Stamp & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Calendar Stamp */}
                    <div className="w-14 h-15 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider leading-none">
                        {monthStr}
                      </span>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-tight">
                        {dayNum}
                      </span>
                      <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                        {weekdayStr.slice(0, 3)}
                      </span>
                    </div>

                    {/* Category & Lunar Badges */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border',
                          holiday.type === 'gazetted'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300'
                        )}
                      >
                        {holiday.type === 'gazetted' && <Flag className="w-2.5 h-2.5 text-emerald-600" />}
                        <span>{holiday.type.toUpperCase()}</span>
                      </span>

                      {holiday.isLunar && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-full">
                          <Moon className="w-2.5 h-2.5 text-amber-500" />
                          <span>Lunar Sighting</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Title & Description */}
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {holiday.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {holiday.description || 'Statutory public holiday observed across all branch offices and departments.'}
                    </p>
                  </div>

                  {/* Card Bottom: Exemption Policy & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Leaves Excluded</span>
                    </span>

                    <Can I="leave.settings" a="Leave">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(holiday)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer"
                          title="Edit Holiday"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(holiday)}
                          disabled={!holiday.isActive}
                          className={cn(
                            'p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 transition-colors cursor-pointer',
                            holiday.isActive
                              ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-slate-400 cursor-not-allowed opacity-50'
                          )}
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Can>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Create / Edit Modal */}
      <HolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        holiday={selectedHoliday}
      />

      {/* 7. Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Public Holiday?"
        message={`Are you sure you want to deactivate '${deleteTarget?.name}'? Working day calculations will no longer exclude this date.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Holiday'}
        isDestructive={true}
      />

      {/* 8. Confirm Seed Dialog */}
      <ConfirmDialog
        isOpen={showSeedConfirm}
        onCancel={() => setShowSeedConfirm(false)}
        onConfirm={handleSeedConfirm}
        title={`Seed Official Holidays for ${selectedYear}`}
        message={`This will populate official Pakistan gazetted and public statutory holidays for ${selectedYear} without duplicating existing dates. Continue?`}
        confirmText={isSeeding ? 'Seeding...' : 'Seed Holidays'}
        isDestructive={false}
      />
    </div>
  );
}

export default HolidaysPage;
