/**
 * @file MessageInput.jsx
 * @description Rich chat input with attachment upload, typing debouncer, and read-only archival guard.
 */

import React, { useState, useRef } from 'react';
import { Paperclip, Send, X, Loader2, Lock } from 'lucide-react';
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
      toast.error('File size cannot exceed 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAttachment(formData).unwrap();
      if (res?.data?.url) {
        setPendingAttachment(res.data);
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
      <div className="p-3 bg-muted/60 border-t border-border flex items-center justify-center gap-2 text-sm text-muted-foreground select-none">
        <Lock className="w-4 h-4 text-amber-500" />
        <span>This conversation has been archived and is read-only.</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-card border-t border-border">
      {/* Pending attachment preview */}
      {pendingAttachment && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg max-w-sm border border-border/40">
          <Paperclip className="w-4 h-4 text-primary shrink-0" />
          <div className="truncate flex-1 text-xs">
            <p className="font-medium truncate">{pendingAttachment.fileName}</p>
            <span className="text-[10px] text-muted-foreground">
              {(pendingAttachment.fileSize / 1024).toFixed(1)} KB
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="p-1 hover:bg-card rounded-md text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
          className="p-2.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition shrink-0 disabled:opacity-50"
          title="Attach file"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        <input
          type="text"
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Press Enter to send)"
          disabled={isSending}
          className="flex-1 px-4 py-2 text-sm bg-muted/50 border border-border rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !pendingAttachment) || isSending || isUploading}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition shrink-0 disabled:opacity-40 disabled:hover:bg-primary"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
