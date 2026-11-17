/**
 * @file MessageInput.jsx
 * @description Rich chat input with attachment upload, typing debouncer, and read-only archival guard.
 */

import React, { useState, useRef } from 'react';
import { Paperclip, Send, X, Loader2, Lock, FileText, Image as ImageIcon } from 'lucide-react';
import { useUploadAttachmentMutation } from '../chatApi.js';
import { toast } from 'sonner';

export const MessageInput = ({ onSendMessage, onTyping, isArchived = false, isSending = false }) => {
  const [content, setContent] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const [uploadAttachment] = useUploadAttachmentMutation();

  const handleTextChange = (e) => {
    const val = e.target.value;
    setContent(val);

    // Typing debounce
    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAttachment(formData).unwrap();
      if (res?.data?.url) {
        setPendingAttachment(res.data);
        toast.success(`Attachment "${res.data.fileName || 'file'}" staged`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && !pendingAttachment) return;

    const attachments = pendingAttachment ? [pendingAttachment] : [];
    const messageType = pendingAttachment
      ? pendingAttachment.fileType?.startsWith('image/')
        ? 'image'
        : 'file'
      : 'text';

    onSendMessage({
      content: trimmed,
      messageType,
      attachments
    });

    setContent('');
    setPendingAttachment(null);
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isArchived) {
    return (
      <div className="p-3.5 bg-amber-500/10 border-t border-amber-500/30 flex items-center justify-center gap-2 text-xs text-amber-400 select-none">
        <Lock className="w-4 h-4" />
        <span>This conversation has been archived and is strictly read-only.</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white dark:bg-[#111D17] border-t border-slate-200 dark:border-[#1A3125]">
      {/* Pending attachment preview */}
      {pendingAttachment && (
        <div className="mb-2.5 flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-[#0A110D] rounded-xl max-w-sm border border-slate-200 dark:border-[#1A3125]">
          <div className="flex items-center gap-2 truncate">
            {pendingAttachment.fileType?.startsWith('image/') ? (
              <ImageIcon className="w-4 h-4 text-[#00C471] shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-[#00C471] shrink-0" />
            )}
            <div className="truncate text-xs">
              <p className="font-semibold text-slate-800 dark:text-[#F8FAFC] truncate">
                {pendingAttachment.fileName || 'Attachment'}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                {pendingAttachment.fileSize > 0
                  ? `${(pendingAttachment.fileSize / 1024).toFixed(1)} KB`
                  : 'Staged'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input controls */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
          className="p-2.5 rounded-xl text-slate-400 dark:text-[#7E9E8F] hover:text-[#00C471] hover:bg-slate-100 dark:hover:bg-[#0A110D] transition-all disabled:opacity-50 shrink-0"
          title="Upload file or image (max 10MB)"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#00C471]" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        <textarea
          rows={1}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
          className="flex-1 max-h-32 min-h-[38px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs sm:text-sm focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !pendingAttachment) || isSending || isUploading}
          className="p-2.5 rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white disabled:opacity-40 transition-all shrink-0 shadow-xs flex items-center justify-center"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
