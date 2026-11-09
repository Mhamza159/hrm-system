/**
 * @file NewChatModal.jsx
 * @description Modal dialog to pick a coworker and initiate a 1-to-1 direct chat.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <UserPlus className="w-5 h-5 text-primary" />
            <span>New Direct Message</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coworkers by name or email..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-border/30">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No coworkers found matching "{searchTerm}"
            </div>
          ) : (
            filteredUsers.map((u) => {
              const name = u.employeeId?.name || u.email?.split('@')[0] || 'User';
              const avatar = u.employeeId?.avatar || '';
              return (
                <button
                  key={u._id}
                  onClick={() => handleSelectUser(u)}
                  disabled={isCreating}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/60 transition text-left disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-medium text-sm truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
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
