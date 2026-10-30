/**
 * @file KiosksPage.jsx
 * @description Office Attendance Kiosk Terminals Management Page (BUILD-GUIDE Section 18 · Row 13.1).
 *
 * SPECIFICATION:
 * - Module: M13 Dynamic QR Code Attendance
 * - Protected by: attendance.kiosk.manage (Super Admin, HR Manager)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  Activity,
  CheckCircle2,
  XCircle,
  QrCode,
  ShieldAlert,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import {
  useGetKiosksQuery,
  useDeleteKioskMutation,
  useUpdateKioskMutation
} from '../attendanceApi.js';
import { KioskModal } from '../components/KioskModal.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { toast } from 'sonner';

export const KiosksPage = () => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const { isSuperAdmin, isHR } = useAuth();
  const hasKioskManage = isSuperAdmin || isHR || can('attendance.kiosk.manage');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKiosk, setEditingKiosk] = useState(null);

  const { data, isLoading, refetch } = useGetKiosksQuery({
    search: search.trim() || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined
  });

  const [deleteKiosk, { isLoading: isDeleting }] = useDeleteKioskMutation();
  const [updateKiosk] = useUpdateKioskMutation();

  const kiosks = data?.data || [];

  const handleOpenCreate = () => {
    setEditingKiosk(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (kiosk) => {
    setEditingKiosk(kiosk);
    setModalOpen(true);
  };

  const handleDelete = async (kiosk) => {
    if (!window.confirm(`Are you sure you want to deactivate and remove kiosk '${kiosk.name}' (${kiosk.code})?`)) {
      return;
    }

    try {
      await deleteKiosk(kiosk._id).unwrap();
      toast.success(`Kiosk '${kiosk.name}' removed successfully.`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to remove kiosk.');
    }
  };

  const handleToggleStatus = async (kiosk) => {
    try {
      await updateKiosk({
        id: kiosk._id,
        isActive: !kiosk.isActive
      }).unwrap();
      toast.success(`Kiosk ${kiosk.name} is now ${!kiosk.isActive ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to toggle kiosk status.');
    }
  };

  const isKioskOnline = (lastHeartbeatAt) => {
    if (!lastHeartbeatAt) return false;
    const diffMs = Date.now() - new Date(lastHeartbeatAt).getTime();
    return diffMs <= 2 * 60 * 1000; // online if heartbeat within 2 minutes
  };

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'entry':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ArrowDownRight className="w-3 h-3" />
            <span>Entry Only</span>
          </span>
        );
      case 'exit':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <ArrowUpRight className="w-3 h-3" />
            <span>Exit Only</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <ArrowRightLeft className="w-3 h-3" />
            <span>Entry & Exit</span>
          </span>
        );
    }
  };

  if (!hasKioskManage) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Managing dynamic attendance kiosks requires the <code className="font-mono text-xs">attendance.kiosk.manage</code> permission. Please contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Attendance Kiosks & Hardware
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Register office turnstile terminals and launch dynamic rotating QR code displays.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Kiosk</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by terminal name, code, or floor description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="all">All Direction Types</option>
            <option value="both">Both (Entry & Exit)</option>
            <option value="entry">Entry Only</option>
            <option value="exit">Exit Only</option>
          </select>
        </div>
      </div>

      {/* Kiosks Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading registered kiosks...</div>
        ) : kiosks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Monitor className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Kiosks Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first office attendance tablet or screen to generate secure rotating QR codes.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Kiosk</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Terminal & Code</th>
                  <th className="py-3.5 px-4">Direction</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Heartbeat</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {kiosks.map((kiosk) => {
                  const online = isKioskOnline(kiosk.lastHeartbeatAt);
                  return (
                    <tr
                      key={kiosk._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono text-xs">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{kiosk.name}</p>
                            <p className="font-mono text-[11px] text-slate-500">{kiosk.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{renderTypeBadge(kiosk.type)}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {kiosk.locationDescription || <span className="text-slate-400 italic">Not specified</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                          <span className={`text-[11px] ${online ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            {online ? 'Online' : 'Idle / Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(kiosk)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                            kiosk.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          {kiosk.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{kiosk.isActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => window.open(`/attendance/kiosks/${kiosk._id}/display`, '_blank')}
                            title="Launch Dedicated Kiosk Display"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Display</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(kiosk)}
                            title="Edit Kiosk"
                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(kiosk)}
                            disabled={isDeleting}
                            title="Delete Kiosk"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <KioskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        kiosk={editingKiosk}
        onSuccess={refetch}
      />
    </div>
  );
};
