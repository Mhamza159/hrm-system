/**
 * @file NewGroupModal.jsx
 * @description Modal dialog to create custom multi-user group chat channels.
 * Styled in Forest & Emerald Enterprise design with colleague multi-selection.
 */

import React, { useState } from 'react';
import { Users, X, Loader2, Check, UserPlus } from 'lucide-react';
import { useGetDirectoryUsersQuery, useCreateConversationMutation } from '../chatApi.js';
import { toast } from 'sonner';

export const NewGroupModal = ({ isOpen, onClose, onConversationSelected, currentUserId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: usersData, isLoading: isLoadingUsers } = useGetDirectoryUsersQuery(undefined, { skip: !isOpen });
  const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();

  if (!isOpen) return null;

  const users = usersData?.data || [];
  const filteredUsers = users.filter((u) => {
    if (u._id === currentUserId) return false;
    const userName = u.employeeId?.name || u.email || '';
    const term = searchTerm.toLowerCase();
    return userName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (selectedUserIds.length < 1) {
      toast.error('Please select at least 1 other colleague to create a group');
      return;
    }

    try {
      const res = await createConversation({
        type: 'group',
        name: name.trim(),
        description: description.trim(),
        participants: selectedUserIds
      }).unwrap();

      if (res?.data?._id) {
        toast.success(`Group "${name}" created successfully`);
        onConversationSelected(res.data._id);
        onClose();
        setName('');
        setDescription('');
        setSelectedUserIds([]);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create group conversation');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/15 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#061A14]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create Group Channel</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Collaborate with multiple team members</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex flex-col">
          <div className="p-4 space-y-3.5">
            {/* Group Name Input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-[#7E9E8F] uppercase tracking-wider block mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sprint Alpha, UI/UX Chapter, Operations"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition"
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-[#7E9E8F] uppercase tracking-wider block mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief group objective or purpose..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition"
              />
            </div>

            {/* Member Selection Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-[#7E9E8F] uppercase tracking-wider">
                  Select Members
                </label>
                <span className="text-[11px] font-bold text-[#00C471] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {selectedUserIds.length} selected
                </span>
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter coworkers by name or email..."
                className="w-full mb-2 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition"
              />

              <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-[#1A3125] rounded-xl divide-y divide-slate-100 dark:divide-[#1A3125]/40 custom-scrollbar">
                {isLoadingUsers ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-[#7E9E8F] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00C471]" />
                    <span>Loading directory...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
                    No coworkers found
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u._id);
                    const userName = u.employeeId?.name || u.email?.split('@')[0] || 'User';
                    const avatar = u.employeeId?.avatar || '';

                    return (
                      <div
                        key={u._id}
                        onClick={() => toggleUser(u._id)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
                            : 'hover:bg-slate-50 dark:hover:bg-[#162820]/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {avatar ? (
                              <img src={avatar} alt={userName} className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              userName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-xs text-slate-900 dark:text-[#F8FAFC] truncate">
                              {userName}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-[#7E9E8F] truncate">{u.email}</p>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ml-2 ${
                            isSelected
                              ? 'bg-[#00C471] border-[#00C471] text-white shadow-xs'
                              : 'border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#061A14]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50/50 dark:bg-[#061A14]/30 border-t border-slate-100 dark:border-[#1A3125] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim() || selectedUserIds.length < 1}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Create Channel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;
