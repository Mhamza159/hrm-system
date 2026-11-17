/**
 * @file AnnouncementFormModal.jsx
 * @description Modal form for authoring and updating company/department announcements with multi-department and attachment support.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  X,
  Send,
  Pin,
  Megaphone,
  Globe2,
  Building2,
  Paperclip,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation
} from '../announcementsApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';

const todayIsoDate = new Date().toISOString().split('T')[0];

function AnnouncementFormModalContent({ onClose, initialData = null }) {
  const isEditing = Boolean(initialData?._id);
  const user = useSelector((state) => state.auth?.user);

  const isSuperAdminOrHR = user?.roles?.some((r) => {
    const roleName = typeof r === 'string' ? r : r.name;
    return roleName === 'Super Admin' || roleName === 'HR Manager';
  });
  const userDeptId = user?.employeeId?.departmentId?._id || user?.employeeId?.departmentId || '';

  const initialDeptIds = () => {
    if (initialData?.departmentIds?.length > 0) {
      return initialData.departmentIds.map((d) => (d._id || d).toString());
    }
    if (initialData?.departmentId) {
      return [(initialData.departmentId._id || initialData.departmentId).toString()];
    }
    if (!isSuperAdminOrHR && userDeptId) {
      const dId = typeof userDeptId === 'object' ? userDeptId._id : userDeptId;
      return dId ? [dId.toString()] : [];
    }
    return [];
  };

  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [targetAudience, setTargetAudience] = useState(
    initialData?.targetAudience || (isSuperAdminOrHR ? 'company' : 'department')
  );
  const [selectedDeptIds, setSelectedDeptIds] = useState(initialDeptIds);
  const [priority, setPriority] = useState(initialData?.priority || 'normal');
  const [pinned, setPinned] = useState(Boolean(initialData?.pinned));
  const [expiryDate, setExpiryDate] = useState(
    initialData?.expiryDate ? initialData.expiryDate.split('T')[0] : ''
  );
  const [attachments, setAttachments] = useState(
    Array.isArray(initialData?.attachments) ? initialData.attachments : []
  );

  // Attachment draft state
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentType, setNewAttachmentType] = useState('pdf');
  const [showAddAttachment, setShowAddAttachment] = useState(false);

  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();
  const { data: deptData } = useGetDepartmentsQuery({});

  const rawDepts = deptData?.data || (Array.isArray(deptData) ? deptData : []);
  const departments = Array.isArray(rawDepts) ? rawDepts : [];
  const isSubmitting = isCreating || isUpdating;

  const handleToggleDept = (deptId) => {
    setSelectedDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim()) {
      toast.error('Attachment document URL is required');
      return;
    }
    const item = {
      name: newAttachmentName.trim() || 'Document Reference',
      url: newAttachmentUrl.trim(),
      fileType: newAttachmentType || 'pdf',
      size: 0
    };
    setAttachments((prev) => [...prev, item]);
    setNewAttachmentName('');
    setNewAttachmentUrl('');
    setShowAddAttachment(false);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and message content are required');
      return;
    }

    if (targetAudience === 'department' && selectedDeptIds.length === 0) {
      toast.error('Please select at least one target department');
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      targetAudience,
      departmentId: targetAudience === 'department' && selectedDeptIds.length > 0 ? selectedDeptIds[0] : null,
      departmentIds: targetAudience === 'department' ? selectedDeptIds : [],
      priority,
      pinned,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      attachments
    };

    try {
      if (isEditing) {
        await updateAnnouncement({ id: initialData._id, ...payload }).unwrap();
        toast.success('Announcement directive updated successfully');
      } else {
        await createAnnouncement(payload).unwrap();
        toast.success('Announcement broadcast published successfully');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit announcement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-[#00C471] border border-emerald-500/20 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isEditing ? 'Revise Announcement Directive' : 'Broadcast New Announcement'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Notify workforce personnel with targeted priority broadcasts & operational memos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Company Offsite & Strategy Summit 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0C1712] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
            />
          </div>

          {/* Target Audience & Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Audience Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Target Audience *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!isSuperAdminOrHR}
                  onClick={() => setTargetAudience('company')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition ${
                    targetAudience === 'company'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/40'
                      : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#162820]'
                  } ${!isSuperAdminOrHR ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Company-Wide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('department')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition ${
                    targetAudience === 'department'
                      ? 'bg-emerald-500/10 text-[#00C471] border-[#00C471]/40'
                      : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#162820]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Department(s)</span>
                </button>
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Notice Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0C1712] text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
              >
                <option value="urgent">Urgent Priority (Immediate Read)</option>
                <option value="high">High Priority</option>
                <option value="normal">Normal / Standard Broadcast</option>
                <option value="low">Low Priority / FYI Bulletin</option>
              </select>
            </div>
          </div>

          {/* Department Selection Checkboxes (if department audience) */}
          {targetAudience === 'department' && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Select Applicable Departments *
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedDeptIds.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pt-1">
                {departments.map((dept) => {
                  const isChecked = selectedDeptIds.includes(dept._id);
                  return (
                    <button
                      key={dept._id}
                      type="button"
                      onClick={() => handleToggleDept(dept._id)}
                      className={`px-3 py-1.5 rounded-lg border text-left text-xs flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#00C471] border-emerald-500/30 font-semibold'
                          : 'bg-white dark:bg-[#162820] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1A3125] hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate pr-1">{dept.name}</span>
                      <span className="text-[10px] uppercase font-mono opacity-60">
                        {dept.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Content */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Announcement Message Body *
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="State the detailed directive, timeline, instructions, or operational expectations for team members..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0C1712] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471] leading-relaxed resize-y"
            />
          </div>

          {/* Expiry Date & Pin Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Notice Expiration Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={todayIsoDate}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0C1712] text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                />
              </div>
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00C471] focus:ring-[#00C471] border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#0C1712]"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pin Announcement to Notice Board</span>
                </span>
              </label>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                <span>Reference Documents & Attachments ({attachments.length})</span>
              </label>
              {!showAddAttachment && (
                <button
                  type="button"
                  onClick={() => setShowAddAttachment(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00C471] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Attachment</span>
                </button>
              )}
            </div>

            {/* List Existing Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712] flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {att.name}
                      </span>
                      <span className="text-slate-400 ml-2 font-mono text-[10px]">
                        ({att.url})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add Attachment Input */}
            {showAddAttachment && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Document Title (e.g. Schedule PDF)"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#162820] text-xs"
                  />
                  <select
                    value={newAttachmentType}
                    onChange={(e) => setNewAttachmentType(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#162820] text-xs"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="docx">Word / DOCX</option>
                    <option value="image">Image / Graphic</option>
                    <option value="sheet">Spreadsheet / Excel</option>
                  </select>
                </div>
                <input
                  type="url"
                  placeholder="Direct Document Link or Storage URL (https://...)"
                  value={newAttachmentUrl}
                  onChange={(e) => setNewAttachmentUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#162820] text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAttachment(false)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-3 py-1 rounded-lg bg-[#00C471] text-slate-950 font-bold text-[11px]"
                  >
                    Confirm Attachment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00C471] hover:bg-emerald-600 text-slate-950 text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Publish Broadcast'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AnnouncementFormModal({ isOpen, onClose, initialData = null }) {
  if (!isOpen) return null;
  return (
    <AnnouncementFormModalContent
      key={initialData?._id || 'new'}
      onClose={onClose}
      initialData={initialData}
    />
  );
}

export default AnnouncementFormModal;
