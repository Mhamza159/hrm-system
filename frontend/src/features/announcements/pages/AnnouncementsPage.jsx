/**
 * @file AnnouncementsPage.jsx
 * @description Main Company & Department Announcements Page (Module M8 / Slice 8.6).
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Announcements
 * - Design: Forest & Emerald Enterprise Craft (DESIGN.md)
 * - Layer: Feature Page (React 18 / Tailwind)
 */

import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Globe2,
  Building2,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { useGetAnnouncementsQuery } from '../announcementsApi.js';
import { AnnouncementCard } from '../components/AnnouncementCard.jsx';
import { AnnouncementFormModal } from '../components/AnnouncementFormModal.jsx';

export function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [priority, setPriority] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const queryParams = {
    page,
    limit: 10,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(targetAudience ? { targetAudience } : {}),
    ...(priority ? { priority } : {})
  };

  const { data, isLoading, isFetching, refetch } = useGetAnnouncementsQuery(queryParams);

  const announcements = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  const handleOpenCreate = () => {
    setSelectedAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Announcements & Notice Board"
        description="Stay aligned with executive announcements, department directives, and operational bulletins."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#13221B] transition-colors shadow-xs"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <Can I="announcement.create" a="Announcement">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#049856] rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Announcement</span>
            </button>
          </Can>
        </div>
      </PageHeader>

      {/* 2. Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-3.5 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search announcements by title or content..."
            className="w-full pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Audience Filter Pills & Priority Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audience Filter Pills */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#13221B] border border-slate-200/80 dark:border-[#1A3125] p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setTargetAudience('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                targetAudience === ''
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetAudience('company');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                targetAudience === 'company'
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-[#00C471]" />
              <span>Company</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetAudience('department');
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                targetAudience === 'department'
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#00C471]" />
              <span>Department</span>
            </button>
          </div>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* 3. Feed List / Feed Content */}
      {isLoading ? (
        <ScreenSkeleton
          variant="cards"
          title="Company Broadcasts"
          message="Retrieving active announcements & policy notices..."
          cards={3}
        />
      ) : announcements.length === 0 ? (
        <div className="py-20 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl text-center flex flex-col items-center justify-center p-6 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-[#00C471]">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No announcements found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            There are no announcements matching your filters at this time. Broadcast official announcements or department bulletins for your team.
          </p>
          <Can I="announcement.create" a="Announcement">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#049856] rounded-xl shadow-xs transition-all active:scale-95 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish First Announcement</span>
            </button>
          </Can>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <AnnouncementCard
              key={item._id}
              announcement={item}
              onEdit={handleOpenEdit}
            />
          ))}

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-[#1A3125] text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Page <strong className="text-slate-900 dark:text-white font-mono">{pagination.page}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white font-mono">{pagination.totalPages}</strong> (
                <span className="font-mono">{pagination.total}</span> total announcements)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#13221B] disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#13221B] disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Creation / Editing Modal */}
      <AnnouncementFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedAnnouncement}
      />
    </div>
  );
}

export default AnnouncementsPage;
