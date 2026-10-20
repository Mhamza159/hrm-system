/**
 * @file HolidaysPage.jsx
 * @description Master Public & Gazetted Holidays Calendar Screen.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.11)
 * - Layer: Frontend Feature Page
 * - Role Access: Public/authenticated view for all employees; HR/Admin edit rights.
 */

import React, { useState } from 'react';
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
  CalendarDays
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatCard } from '../../../components/common/StatCard.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetHolidaysQuery,
  useDeleteHolidayMutation
} from '../leavesApi.js';
import { HolidayModal } from '../components/HolidayModal.jsx';

export function HolidaysPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: response, isLoading } = useGetHolidaysQuery({ year: selectedYear });
  const holidays = response?.data || [];

  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  // Metric aggregates
  const totalHolidays = holidays.length;
  const gazettedHolidays = holidays.filter((h) => h.type === 'gazetted').length;
  const lunarHolidays = holidays.filter((h) => h.isLunar).length;

  const now = new Date();
  const upcoming = holidays
    .filter((h) => new Date(h.date) >= now && h.isActive)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

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
          <div>
            <div className="font-semibold text-white tracking-wide">{dateStr}</div>
            <div className="text-xs text-slate-400">{dayStr}</div>
          </div>
        );
      }
    },
    {
      header: 'Holiday Name',
      accessor: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{row.name}</span>
            {row.isLunar && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-950/40 text-amber-300 border border-amber-800/40 rounded">
                <Moon className="w-2.5 h-2.5" />
                <span>Lunar</span>
              </span>
            )}
          </div>
          {row.description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{row.description}</p>
          )}
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (row) => (
        <span
          className={`px-2 py-0.5 text-xs rounded-full border ${
            row.type === 'gazetted'
              ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
              : 'bg-purple-950/40 border-purple-800/40 text-purple-400'
          }`}
        >
          {row.type.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'inactive'}
          label={row.isActive ? 'Active' : 'Disabled'}
        />
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Can I="leave.settings" a="Leave">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="Edit Holiday"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              disabled={!row.isActive}
              className={`p-1.5 rounded-lg transition-colors ${
                row.isActive
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-950/40'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Delete Holiday"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Gazetted & Public Holidays"
        subtitle="Pakistan official statutory holidays and lunar festival schedules. Excluded automatically from leave deductions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Leaves', href: '/leaves/my' },
          { label: 'Holidays' }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>

            <Can I="leave.settings" a="Leave">
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Holiday</span>
              </button>
            </Can>
          </div>
        }
      />

      {/* Feedback Alert */}
      {feedback.message && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
              : 'bg-red-950/30 border-red-800/40 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label={`Holidays in ${selectedYear}`}
          value={totalHolidays}
          trend={`${gazettedHolidays} official gazetted`}
        />
        <StatCard
          icon={Flag}
          label="Gazetted Days"
          value={gazettedHolidays}
          trend="Mandatory office closures"
        />
        <StatCard
          icon={Moon}
          label="Lunar Festivals"
          value={lunarHolidays}
          trend="Subject to moon sighting"
        />
        <StatCard
          icon={Sparkles}
          label="Next Public Holiday"
          value={upcoming ? upcoming.name : 'None upcoming'}
          trend={
            upcoming
              ? new Date(upcoming.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'UTC'
                })
              : 'All observed'
          }
        />
      </div>

      {/* Holidays DataTable */}
      <div className="bg-[#0F111A] border border-[#1E2235] rounded-xl overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={holidays}
          isLoading={isLoading}
          emptyMessage={`No holidays found for ${selectedYear}. Click 'Add Holiday' to populate calendar.`}
        />
      </div>

      {/* Create / Edit Modal */}
      <HolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        holiday={selectedHoliday}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Public Holiday?"
        message={`Are you sure you want to deactivate '${deleteTarget?.name}'? Working day calculations will no longer exclude this date.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
export default HolidaysPage;
