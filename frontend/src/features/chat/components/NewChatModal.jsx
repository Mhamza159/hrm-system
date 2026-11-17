/**
 * @file NewChatModal.jsx
 * @description Modal dialog to select a coworker and launch an instant 1-to-1 direct chat.
 * Styled in Forest & Emerald Enterprise theme with real-time directory search.
 */

import React, { useState } from 'react';
import { Search, UserPlus, X, Loader2 } from 'lucide-react';
import { useGetDirectoryUsersQuery, useCreateConversationMutation } from '../chatApi.js';
import { toast } from 'sonner';

export const NewChatModal = ({ isOpen, onClose, onConversationSelected, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: usersData, isLoading } = useGetDirectoryUsersQuery(undefined, { skip: !isOpen });
  const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();

  if (!isOpen) return null;

  const users = usersData?.data || [];
  const filteredUsers = users.filter((u) => {
    if (u._id === currentUserId) return false;
    const name = u.employeeId?.name || u.email || '';
    const email = u.email || '';
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  const handleSelectUser = async (targetUser) => {
    try {
      const res = await createConversation({
        type: 'direct',
        participantId: targetUser._id
      }).unwrap();
      if (res?.data?._id) {
        onConversationSelected(res.data._id);
        onClose();
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to start direct conversation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#061A14]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">New Direct Message</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">Start an encrypted 1-to-1 conversation</p>
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

        {/* Directory Search */}
        <div className="p-3 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/30 dark:bg-[#061A14]/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-[#7E9E8F]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coworkers by name or email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition"
              autoFocus
            />
          </div>
        </div>

        {/* Coworker Directory List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1A3125]/40 custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 dark:text-[#7E9E8F] flex flex-col items-center gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
              <span className="text-xs">Loading coworker directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
              No coworkers found matching "{searchTerm}"
            </div>
          ) : (
            filteredUsers.map((u) => {
              const name = u.employeeId?.name || u.email?.split('@')[0] || 'User';
              const avatar = u.employeeId?.avatar || '';
              const department = u.employeeId?.department?.name || u.department?.name || '';
              const designation = u.employeeId?.designation?.title || u.designation?.title || '';

              return (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  disabled={isCreating}
                  className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-[#162820]/60 transition text-left disabled:opacity-50 group"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-xs shrink-0 group-hover:border-[#00C471]/40 transition">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-semibold text-xs text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#00C471] transition truncate">
                      {name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F] truncate">{u.email}</p>
                    {(department || designation) && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {[designation, department].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
