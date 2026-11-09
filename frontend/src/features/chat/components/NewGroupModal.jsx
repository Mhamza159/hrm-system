/**
 * @file NewGroupModal.jsx
 * @description Modal dialog to create a custom multi-user group chat.
 */

import React, { useState } from 'react';
import { Users, X, Loader2, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Users className="w-5 h-5 text-primary" />
            <span>Create New Group</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup}>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Group Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sprint Planning, Project Alpha"
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief group objective..."
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Select Members ({selectedUserIds.length} selected)
                </label>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter members..."
                className="w-full mb-2 px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />

              <div className="max-h-48 overflow-y-auto border border-border/50 rounded-lg divide-y divide-border/20">
                {isLoadingUsers ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Loading members...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No matching coworkers</div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u._id);
                    const userName = u.employeeId?.name || u.email?.split('@')[0] || 'User';
                    return (
                      <div
                        key={u._id}
                        onClick={() => toggleUser(u._id)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition text-xs ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-medium truncate">{userName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim() || selectedUserIds.length < 1}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;
