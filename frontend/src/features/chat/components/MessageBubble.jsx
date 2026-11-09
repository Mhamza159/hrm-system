/**
 * @file MessageBubble.jsx
 * @description Single chat message bubble with rich attachments and read receipts.
 */

import React from 'react';
import { Check, CheckCheck, FileText, Download, Image as ImageIcon } from 'lucide-react';

export const MessageBubble = ({ message, isMine }) => {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isRead = message.readBy && message.readBy.length > 1;

  return (
    <div className={`flex w-full mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {!isMine && (
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0 select-none">
            {message.senderAvatar ? (
              <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              message.senderName?.slice(0, 2).toUpperCase() || 'CO'
            )}
          </div>
        )}

        <div className="flex flex-col">
          {!isMine && (
            <span className="text-[11px] font-medium text-muted-foreground ml-1 mb-1">
              {message.senderName}
            </span>
          )}

          <div
            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              isMine
                ? 'bg-primary text-primary-foreground rounded-br-xs'
                : 'bg-card border border-border text-foreground rounded-bl-xs'
            }`}
          >
            {/* Attachments rendering */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-2 space-y-2">
                {message.attachments.map((att, idx) => {
                  const isImage = att.fileType?.startsWith('image/');
                  return isImage ? (
                    <div key={idx} className="rounded-lg overflow-hidden border border-border/30 max-w-xs">
                      <img
                        src={att.url}
                        alt={att.fileName || 'Attachment'}
                        className="max-h-60 w-auto object-cover hover:opacity-95 transition cursor-pointer"
                        onClick={() => window.open(att.url, '_blank')}
                      />
                    </div>
                  ) : (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs transition ${
                        isMine ? 'bg-primary-foreground/15 hover:bg-primary-foreground/25' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <div className="truncate flex-1">
                        <p className="font-medium truncate">{att.fileName || 'Document'}</p>
                        {att.fileSize > 0 && (
                          <span className="text-[10px] opacity-75">
                            {(att.fileSize / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                      <Download className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Message Text Content */}
            {message.content && (
              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
            )}

            {/* Time & Read Receipts */}
            <div
              className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                isMine ? 'text-primary-foreground/75' : 'text-muted-foreground'
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isMine && (
                <span>
                  {isRead ? (
                    <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline" />
                  ) : (
                    <Check className="w-3.5 h-3.5 opacity-80 inline" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
