/**
 * @file GroupInfoDrawer.jsx
 * @description Slide-over drawer presenting channel metadata, participant management, and Super Admin archival.
 */

import React, { useState } from 'react';
import { X, Users, Shield, UserMinus, UserPlus, Lock, Loader2 } from 'lucide-react';
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
    if (!confirm(`Are you sure you want to remove ${targetName} from this group?`)) return;

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
    if (!confirm('Are you sure you want to archive this conversation? It will become permanent read-only.')) return;

    try {
      await archiveConversation(conversation._id).unwrap();
      toast.success('Conversation archived successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive conversation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="bg-card border-l border-border w-full max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Users className="w-5 h-5 text-primary" />
            <span>Conversation Details</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-5">
          {/* Channel Info Card */}
          <div className="text-center pb-4 border-b border-border/40">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mx-auto mb-2">
              {conversation.name?.slice(0, 2).toUpperCase() || 'CH'}
            </div>
            <h3 className="font-semibold text-base">{conversation.name}</h3>
            <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-muted text-muted-foreground">
              {conversation.type} channel
            </span>
            {conversation.description && (
              <p className="text-xs text-muted-foreground mt-2 px-2 leading-relaxed">
                {conversation.description}
              </p>
            )}
          </div>

          {/* Archival Status Banner */}
          {conversation.isArchived && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <Lock className="w-4 h-4 shrink-0" />
              <span>This channel is archived and locked in read-only mode.</span>
            </div>
          )}

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Participants ({conversation.participants?.length || 0})
              </h4>
              {isGroup && isGroupAdmin && !conversation.isArchived && (
                <button
                  type="button"
                  onClick={() => setIsAddingMember(!isAddingMember)}
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingMember ? 'Cancel' : 'Add Member'}</span>
                </button>
              )}
            </div>

            {/* Inline Add Member Picker */}
            {isAddingMember && (
              <div className="mb-3 p-2.5 bg-muted/50 rounded-lg border border-border/50 space-y-2">
                <label className="text-[11px] font-medium text-muted-foreground">Select Colleague</label>
                <select
                  value={selectedAddUserId}
                  onChange={(e) => setSelectedAddUserId(e.target.value)}
                  className="w-full text-xs p-1.5 bg-card border border-border rounded-md"
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
                  className="w-full py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isModifying ? 'Adding...' : 'Confirm Add'}
                </button>
              </div>
            )}

            <div className="divide-y divide-border/20 border border-border/40 rounded-lg overflow-hidden">
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
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-muted/30 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-[10px]">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            p.name?.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-card ${
                            online ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <p className="font-medium truncate flex items-center gap-1">
                          <span>{p.name}</span>
                          {isMemberAdmin && (
                            <Shield className="w-3 h-3 text-amber-500" title="Group Admin" />
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                      </div>
                    </div>

                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(p._id, p.name)}
                        disabled={isModifying}
                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                        title="Remove member"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Super Admin Archival Action */}
          {isSuperAdmin && !conversation.isArchived && (
            <div className="pt-4 border-t border-border/40">
              <button
                type="button"
                onClick={handleArchive}
                disabled={isArchiving}
                className="w-full py-2 px-3 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {isArchiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Archive Conversation</span>
              </button>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
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
