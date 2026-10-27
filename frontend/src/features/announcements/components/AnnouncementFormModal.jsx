/**
 * @file AnnouncementFormModal.jsx
 * @description Modal form for authoring and updating company/department announcements.
 * 
 * SPECIFICATION:
 * - Module: M8 Internal Comms & Announcements
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Component (React 18 / Tailwind)
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Send, Pin, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation
} from '../announcementsApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';

export function AnnouncementFormModal({ isOpen, onClose, initialData = null }) {
  const isEditing = Boolean(initialData?._id);
  const user = useSelector((state) => state.auth?.user);

  const isSuperAdminOrHR = user?.roles?.some((r) => {
    const roleName = typeof r === 'string' ? r : r.name;
    return roleName === 'Super Admin' || roleName === 'HR Manager';
  });
  const userDeptId = user?.employeeId?.departmentId?._id || user?.employeeId?.departmentId || '';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState(isSuperAdminOrHR ? 'company' : 'department');
  const [departmentId, setDepartmentId] = useState(isSuperAdminOrHR ? '' : (userDeptId?.toString() || ''));
  const [priority, setPriority] = useState('normal');
  const [pinned, setPinned] = useState(false);

  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();
  const { data: deptData } = useGetDepartmentsQuery({}, { skip: !isOpen });

  const departments = deptData?.data || [];
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setTargetAudience(initialData.targetAudience || 'company');
      setDepartmentId(initialData.departmentId?._id || initialData.departmentId || '');
      setPriority(initialData.priority || 'normal');
      setPinned(Boolean(initialData.pinned));
    } else {
      setTitle('');
      setContent('');
      if (!isSuperAdminOrHR && userDeptId) {
        setTargetAudience('department');
        setDepartmentId(typeof userDeptId === 'object' ? userDeptId._id : userDeptId.toString());
      } else {
        setTargetAudience('company');
        setDepartmentId('');
      }
      setPriority('normal');
      setPinned(false);
    }
  }, [initialData, isOpen, isSuperAdminOrHR, userDeptId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and message content are required');
      return;
    }

    if (targetAudience === 'department' && !departmentId) {
      toast.error('Please select a target department');
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      targetAudience,
      departmentId: targetAudience === 'department' ? departmentId : null,
      priority,
      pinned
    };

    try {
      if (isEditing) {
        await updateAnnouncement({ id: initialData._id, ...payload }).unwrap();
        toast.success('Announcement updated successfully');
      } else {
        await createAnnouncement(payload).unwrap();
        toast.success('Announcement broadcast published successfully');
      }
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to save announcement';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#13221B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Announcement' : 'Publish New Announcement'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Broadcast official updates and department notices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Announcement Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Company Retreat & Holiday Schedule"
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all placeholder:text-slate-400"
              maxLength={150}
              required
            />
          </div>

          {/* Grid: Audience & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Audience */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Target Audience <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
              >
                {isSuperAdminOrHR && (
                  <option value="company">All Staff (Company-Wide)</option>
                )}
                <option value="department">Specific Department</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Broadcast Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
              >
                <option value="low">Low (FYI / Information)</option>
                <option value="normal">Normal (Standard Bulletin)</option>
                <option value="high">High (Action Required)</option>
                <option value="urgent">Urgent (Immediate Attention)</option>
              </select>
            </div>
          </div>

          {/* Department Selector (Conditional) */}
          {targetAudience === 'department' && (
            <div className="p-3.5 bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl space-y-2">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
                required={targetAudience === 'department'}
              >
                <option value="">-- Choose Department --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code || 'DEPT'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notice Content */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Notice Content & Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Provide complete details, timelines, guidelines, or instructions for the team..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all placeholder:text-slate-400 resize-y"
              required
            />
          </div>

          {/* Pin to Notice Board Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/70 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center">
                <Pin className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Pin to Notice Board</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Keeps notice anchored on top (maximum 3 active pinned notices)
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00C471]"></div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#049856] rounded-xl shadow-xs transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Publish Announcement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AnnouncementFormModal;
