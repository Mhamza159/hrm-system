/**
 * @file AnnouncementsPage.jsx
 * @description Main Company & Department Announcements Page (Module M8 / Slice 8.6).
 */

import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Globe2,
  Building2,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { Can } from '../../../components/common/Can.jsx';
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
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#1E2235]">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-[#5E6AD2]" />
            <span>Announcements & Notice Board</span>
          </h1>
          <p className="text-xs text-[#8F94A8] mt-1">
            Stay aligned with executive announcements, department directives, and operational bulletins.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-[#0F111A] border border-[#1E2235] text-[#8F94A8] hover:text-white hover:border-[#2A2E45] transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <Can I="announcement.create" a="Announcement">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-[#5E6AD2] hover:bg-[#4D58BF] rounded-lg shadow-lg shadow-[#5E6AD2]/20 transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Announcement</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#0F111A] border border-[#1E2235] rounded-xl p-3.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#62677B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search announcements by title or content..."
            className="w-full pl-9 pr-3.5 py-2 text-xs text-white bg-[#0A0B10] border border-[#1E2235] rounded-lg focus:outline-none focus:border-[#5E6AD2] transition-colors placeholder-[#62677B]"
          />
        </div>

        {/* Audience Filter Pills & Priority Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audience Filter Pills */}
          <div className="inline-flex bg-[#0A0B10] border border-[#1E2235] p-0.5 rounded-lg text-xs">
            <button
              onClick={() => {
                setTargetAudience('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                targetAudience === ''
                  ? 'bg-[#5E6AD2] text-white'
                  : 'text-[#8F94A8] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setTargetAudience('company');
                setPage(1);
              }}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                targetAudience === 'company'
                  ? 'bg-[#5E6AD2] text-white'
                  : 'text-[#8F94A8] hover:text-white'
              }`}
            >
              <Globe2 className="w-3 h-3" />
              <span>Company</span>
            </button>
            <button
              onClick={() => {
                setTargetAudience('department');
                setPage(1);
              }}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                targetAudience === 'department'
                  ? 'bg-[#5E6AD2] text-white'
                  : 'text-[#8F94A8] hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3" />
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
            className="px-3 py-1.5 text-xs text-white bg-[#0A0B10] border border-[#1E2235] rounded-lg focus:outline-none focus:border-[#5E6AD2] transition-colors"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Feed List */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-7 h-7 border-2 border-[#5E6AD2] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#8F94A8]">Loading announcements...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-20 bg-[#0F111A] border border-[#1E2235] rounded-xl text-center flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-full bg-[#141724] border border-[#1E2235] flex items-center justify-center text-[#62677B] mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No announcements found</h3>
          <p className="text-xs text-[#8F94A8] max-w-sm mb-4">
            There are no announcements matching your filters at this time.
          </p>
          <Can I="announcement.create" a="Announcement">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-[#5E6AD2] hover:bg-[#4D58BF] rounded-lg shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Publish First Announcement
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
            <div className="pt-4 flex items-center justify-between border-t border-[#1E2235] text-xs">
              <span className="text-[#8F94A8]">
                Page <strong className="text-white">{pagination.page}</strong> of{' '}
                <strong className="text-white">{pagination.totalPages}</strong> (
                {pagination.total} total announcements)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-[#0F111A] border border-[#1E2235] text-[#8F94A8] hover:text-white disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg bg-[#0F111A] border border-[#1E2235] text-[#8F94A8] hover:text-white disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Creation / Editing Modal */}
      <AnnouncementFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedAnnouncement}
      />
    </div>
  );
}

export default AnnouncementsPage;
