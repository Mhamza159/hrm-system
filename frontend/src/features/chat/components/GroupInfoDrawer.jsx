/**
 * @file GroupInfoDrawer.jsx
 * @description Slide-over drawer displaying channel metadata, participant roster, member management, and Super Admin archival controls.
 * Styled in Forest & Emerald Enterprise theme.
 */

import React, { useState } from 'react';
import { X, Users, Shield, UserMinus, UserPlus, Lock, Loader2, Calendar } from 'lucide-react';
import {
  useModifyParticipantsMutation,
  useArchiveConversationMutation,
  useGetDirectoryUsersQuery
} from '../chatApi.js';
import { toast } from 'sonner';

export const GroupInfoDrawer = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  userRoles = [],
  isUserOnline
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');

  const [modifyParticipants, { isLoading: isModifying }] = useModifyParticipantsMutation();
  const [archiveConversation, { isLoading: isArchiving }] = useArchiveConversationMutation();
  const { data: usersData } = useGetDirectoryUsersQuery(undefined, { skip: !isAddingMember });

  if (!isOpen || !conversation) return null;

  const isSuperAdmin = userRoles.some(
    (r) => r === 'Super Admin' || r?.name === 'Super Admin'
  );
  const isGroupAdmin = conversation.admin === currentUserId || isSuperAdmin;
  const isGroup = conversation.type === 'group';

  const existingParticipantIds = (conversation.participants || []).map((p) => p._id);
  const availableUsersToAdd = (usersData?.data || []).filter(
    (u) => !existingParticipantIds.includes(u._id)
  );

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to remove ${targetName} from this group?`)) return;

    try {
      await modifyParticipants({
        id: conversation._id,
        action: 'remove',
        userId: targetUserId
      }).unwrap();
      toast.success(`${targetName} removed from group`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove member');
    }
  };

  const handleAddMember = async () => {
    if (!selectedAddUserId) return;
    try {
      await modifyParticipants({
        id: conversation._id,
        action: 'add',
        userId: selectedAddUserId
      }).unwrap();
      toast.success('Member added to group');
      setSelectedAddUserId('');
      setIsAddingMember(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add member');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this conversation? It will become permanent read-only.')) return;

    try {
      await archiveConversation(conversation._id).unwrap();
      toast.success('Conversation archived successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive conversation');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#061A14]/30">
          <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-white">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <Users className="w-4 h-4" />
            </div>
            <span>Channel Details</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Channel Info Card */}
          <div className="text-center pb-5 border-b border-slate-100 dark:border-[#1A3125]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-inner">
              {conversation.name?.slice(0, 2).toUpperCase() || 'CH'}
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{conversation.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-[#00C471] border border-emerald-500/20">
                {conversation.type} channel
              </span>
              {conversation.createdAt && (
                <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(conversation.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {conversation.description && (
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-3 px-2 leading-relaxed bg-slate-50 dark:bg-[#061A14]/40 p-2.5 rounded-xl border border-slate-100 dark:border-[#1A3125]">
                {conversation.description}
              </p>
            )}
          </div>

          {/* Archival Status Banner */}
          {conversation.isArchived && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-600 dark:text-amber-400">
              <Lock className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-medium">This channel is archived and locked in permanent read-only mode.</span>
            </div>
          )}

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-bold text-slate-600 dark:text-[#7E9E8F] uppercase tracking-wider">
                Participants ({conversation.participants?.length || 0})
              </h4>
              {isGroup && isGroupAdmin && !conversation.isArchived && (
                <button
                  type="button"
                  onClick={() => setIsAddingMember(!isAddingMember)}
                  className="text-xs text-[#00C471] hover:text-[#00B064] font-semibold flex items-center gap-1 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingMember ? 'Cancel' : 'Add Member'}</span>
                </button>
              )}
            </div>

            {/* Inline Add Member Picker */}
            {isAddingMember && (
              <div className="mb-3.5 p-3 bg-slate-50 dark:bg-[#061A14] rounded-xl border border-slate-200 dark:border-[#1A3125] space-y-2.5 animate-in fade-in duration-150">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-[#7E9E8F] block">
                  Select Colleague to Add
                </label>
                <select
                  value={selectedAddUserId}
                  onChange={(e) => setSelectedAddUserId(e.target.value)}
                  className="w-full text-xs p-2 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                >
                  <option value="">-- Choose coworker --</option>
                  {availableUsersToAdd.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.employeeId?.name || u.email}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!selectedAddUserId || isModifying}
                  className="w-full py-1.5 text-xs font-bold rounded-lg bg-[#00C471] hover:bg-[#00B064] text-white transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isModifying && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Confirm Add</span>
                </button>
              </div>
            )}

            {/* Participant Roster Cards */}
            <div className="divide-y divide-slate-100 dark:divide-[#1A3125]/40 border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden bg-slate-50/30 dark:bg-[#061A14]/20">
              {(conversation.participants || []).map((p) => {
                const online = isUserOnline ? isUserOnline(p._id) : p.isOnline;
                const isMemberAdmin = conversation.admin === p._id;
                const canRemove =
                  isGroup &&
                  isGroupAdmin &&
                  !conversation.isArchived &&
                  p._id !== currentUserId;

                return (
                  <div
                    key={p._id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-[#162820]/60 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-[11px]">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            p.name?.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#111D17] ${
                            online ? 'bg-[#00C471]' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs text-slate-900 dark:text-[#F8FAFC] truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isMemberAdmin && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              <Shield className="w-2.5 h-2.5" />
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-[#7E9E8F] truncate">{p.email}</p>
                      </div>
                    </div>

                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(p._id, p.name)}
                        disabled={isModifying}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Super Admin Archival Action */}
          {isSuperAdmin && !conversation.isArchived && (
            <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125]">
              <button
                type="button"
                onClick={handleArchive}
                disabled={isArchiving}
                className="w-full py-2.5 px-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isArchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Archive Channel</span>
              </button>
              <p className="text-[10px] text-slate-400 dark:text-[#7E9E8F] text-center mt-1.5">
                Archiving makes this conversation permanent read-only for all members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoDrawer;
