/**
 * @file AnnouncementsPage.jsx
 * @description Main Company & Department Announcements Page with Dedicated Archive Tab, Pinning Notice Board & Multi-Filter Toolbar (Module M8).
 */

import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Globe2,
  Building2,
  RefreshCw,
  Inbox,
  Pin,
  Archive,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import {
  useGetAnnouncementsQuery,
  useDeleteAnnouncementMutation,
  useArchiveAnnouncementMutation,
  useRestoreAnnouncementMutation
} from '../announcementsApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { AnnouncementCard } from '../components/AnnouncementCard.jsx';
import { AnnouncementFormModal } from '../components/AnnouncementFormModal.jsx';
import { AnnouncementDetailModal } from '../components/AnnouncementDetailModal.jsx';
import { ReadReceiptsModal } from '../components/ReadReceiptsModal.jsx';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal.jsx';
import { ArchiveConfirmationModal } from '../components/ArchiveConfirmationModal.jsx';

export function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState('');
  const [readFilter, setReadFilter] = useState(''); // '' | 'unread' | 'read'
  const [sortBy, setSortBy] = useState('newest');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const [activeAnnouncement, setActiveAnnouncement] = useState(null);

  const queryParams = {
    page,
    limit: 12,
    isArchived: activeTab === 'archived',
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(targetAudience ? { targetAudience } : {}),
    ...(departmentId && departmentId !== 'all' ? { departmentId } : {}),
    ...(priority ? { priority } : {}),
    ...(readFilter === 'unread' ? { hasRead: false } : readFilter === 'read' ? { hasRead: true } : {}),
    sort: sortBy
  };

  const { data, isLoading, isFetching, refetch } = useGetAnnouncementsQuery(queryParams);
  const { data: deptData } = useGetDepartmentsQuery();
  const [deleteAnnouncement, { isLoading: isDeleting }] = useDeleteAnnouncementMutation();
  const [archiveAnnouncement, { isLoading: isArchiving }] = useArchiveAnnouncementMutation();
  const [restoreAnnouncement, { isLoading: isRestoring }] = useRestoreAnnouncementMutation();

  const rawDepts = deptData?.data || (Array.isArray(deptData) ? deptData : []);
  const departments = Array.isArray(rawDepts) ? rawDepts : [];

  const rawAnnouncements = data?.data || (Array.isArray(data) ? data : []);
  const announcements = Array.isArray(rawAnnouncements) ? rawAnnouncements : [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  // Separate pinned announcements on the active tab
  const pinnedAnnouncements = activeTab === 'active' ? announcements.filter((a) => a.pinned) : [];
  const regularAnnouncements = activeTab === 'active' ? announcements.filter((a) => !a.pinned) : announcements;

  const handleResetFilters = () => {
    setSearch('');
    setTargetAudience('');
    setDepartmentId('');
    setPriority('');
    setReadFilter('');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search.trim() || targetAudience || departmentId || priority || readFilter || sortBy !== 'newest'
  );

  // Modal Handlers
  const handleOpenCreate = () => {
    setActiveAnnouncement(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (announcement) => {
    setActiveAnnouncement(announcement);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (announcement) => {
    setActiveAnnouncement(announcement);
    setIsDetailModalOpen(true);
  };

  const handleOpenReceipts = (announcement) => {
    setActiveAnnouncement(announcement);
    setIsReceiptsModalOpen(true);
  };

  const handleOpenDelete = (announcement) => {
    setActiveAnnouncement(announcement);
    setIsDeleteModalOpen(true);
  };

  const handleOpenArchive = (announcement) => {
    setActiveAnnouncement(announcement);
    setIsArchiveModalOpen(true);
  };

  const handleOpenRestore = (announcement) => {
    setActiveAnnouncement(announcement);
    setIsRestoreModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeAnnouncement?._id) return;
    try {
      await deleteAnnouncement(activeAnnouncement._id).unwrap();
      toast.success('Announcement removed from notice board');
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete announcement');
    }
  };

  const handleConfirmArchive = async () => {
    if (!activeAnnouncement?._id) return;
    try {
      await archiveAnnouncement(activeAnnouncement._id).unwrap();
      toast.success('Announcement moved to archive');
      setIsArchiveModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive announcement');
    }
  };

  const handleConfirmRestore = async () => {
    if (!activeAnnouncement?._id) return;
    try {
      await restoreAnnouncement(activeAnnouncement._id).unwrap();
      toast.success('Announcement restored to active feed');
      setIsRestoreModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to restore announcement');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Announcements & Operational Directives"
        description="Broadcast official enterprise bulletins, schedule alerts, department memos, and track verified workforce readership."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162820] transition-colors shadow-xs"
            title="Refresh Notice Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <Can I="announcement.create" a="Announcement">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-[#00C471] hover:bg-emerald-600 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast Announcement</span>
            </button>
          </Can>
        </div>
      </PageHeader>

      {/* 2. Top-Level Tab Navigation (Active Notices vs Dedicated Archive Tab) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A3125] pb-px">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('active');
              setPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'active'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Active Notices</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('archived');
              setPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'archived'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archived Notices</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          {activeTab === 'active' ? 'Live Notice Board' : 'Historical Archive Docket'}
        </div>
      </div>

      {/* 3. Comprehensive Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search notices by title, directive keyword, or message..."
              className="w-full pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:border-[#00C471] transition placeholder:text-slate-400"
            />
          </div>

          {/* Quick Audience Pills */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#0C1712] border border-slate-200/80 dark:border-[#1A3125] p-1 rounded-xl text-xs self-start lg:self-auto">
            <button
              type="button"
              onClick={() => {
                setTargetAudience('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                targetAudience === ''
                  ? 'bg-white dark:bg-[#162820] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Audiences
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetAudience('company');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition ${
                targetAudience === 'company'
                  ? 'bg-white dark:bg-[#162820] text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Company</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetAudience('department');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition ${
                targetAudience === 'department'
                  ? 'bg-white dark:bg-[#162820] text-[#00C471] shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Departments</span>
            </button>
          </div>
        </div>

        {/* Dropdowns Row: Department, Priority, Read Status & Sort */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-[#1A3125] text-xs">
          {/* Department Dropdown */}
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712] text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#00C471]"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712] text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#00C471]"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Read Status Filter */}
          <select
            value={readFilter}
            onChange={(e) => {
              setReadFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712] text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#00C471]"
          >
            <option value="">All Read Status</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>

          {/* Sort Strategy */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712] text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#00C471]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority First</option>
          </select>

          {/* Reset Filters Pill */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-semibold"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Presentation Grid */}
      {isLoading ? (
        <ScreenSkeleton
          variant="cards"
          title="Notice Board"
          message="Retrieving active announcements & executive notices..."
          cards={4}
        />
      ) : announcements.length === 0 ? (
        <div className="py-24 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl text-center flex flex-col items-center justify-center p-6 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-[#00C471]">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {activeTab === 'archived' ? 'No Archived Announcements' : 'No Active Announcements Found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#7E9E8F] max-w-sm leading-relaxed">
            {activeTab === 'archived'
              ? 'There are currently no announcements stored in the historical archive.'
              : 'There are no active notices matching your search criteria. Check back later or broadcast a new directive.'}
          </p>
          {activeTab === 'active' && (
            <Can I="announcement.create" a="Announcement">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-[#00C471] hover:bg-emerald-600 rounded-xl shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Broadcast First Announcement</span>
              </button>
            </Can>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Section (Active tab only) */}
          {activeTab === 'active' && pinnedAnnouncements.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <Pin className="w-4 h-4 fill-current" />
                <span>Pinned Bulletins & Urgent Directives</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedAnnouncements.map((item) => (
                  <AnnouncementCard
                    key={item._id}
                    announcement={item}
                    onView={handleOpenDetail}
                    onEdit={handleOpenEdit}
                    onArchive={handleOpenArchive}
                    onRestore={handleOpenRestore}
                    onDelete={handleOpenDelete}
                    onOpenReceipts={handleOpenReceipts}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Announcements Grid */}
          <div>
            {activeTab === 'active' && pinnedAnnouncements.length > 0 && (
              <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                General Notices
              </h5>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularAnnouncements.map((item) => (
                <AnnouncementCard
                  key={item._id}
                  announcement={item}
                  onView={handleOpenDetail}
                  onEdit={handleOpenEdit}
                  onArchive={handleOpenArchive}
                  onRestore={handleOpenRestore}
                  onDelete={handleOpenDelete}
                  onOpenReceipts={handleOpenReceipts}
                />
              ))}
            </div>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-[#1A3125] text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Page <strong className="text-slate-900 dark:text-white font-mono">{pagination.page}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white font-mono">{pagination.totalPages}</strong> (
                <span className="font-mono">{pagination.total}</span> notices)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 transition font-medium"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 transition font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Complete Modals Suite */}
      <AnnouncementFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialData={activeAnnouncement}
      />

      <AnnouncementDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        announcement={activeAnnouncement}
        onOpenReceipts={handleOpenReceipts}
        canViewReceipts={true}
      />

      <ReadReceiptsModal
        isOpen={isReceiptsModalOpen}
        onClose={() => setIsReceiptsModalOpen(false)}
        announcementId={activeAnnouncement?._id}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        announcementTitle={activeAnnouncement?.title}
        isLoading={isDeleting}
      />

      <ArchiveConfirmationModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleConfirmArchive}
        announcementTitle={activeAnnouncement?.title}
        isRestoring={false}
        isLoading={isArchiving}
      />

      <ArchiveConfirmationModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={handleConfirmRestore}
        announcementTitle={activeAnnouncement?.title}
        isRestoring={true}
        isLoading={isRestoring}
      />
    </div>
  );
}

export default AnnouncementsPage;
