/**
 * @file MessageBubble.jsx
 * @description Single chat message bubble with rich attachments and read receipts.
 */

import React from 'react';
import { Check, CheckCheck, FileText, Download } from 'lucide-react';

export const MessageBubble = ({ message, isMine }) => {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isRead = message.readBy && message.readBy.length > 1;

  return (
    <div className={`flex w-full mb-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {/* Recipient Avatar for group or coworker identification */}
        {!isMine && (
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-[#00C471] flex items-center justify-center font-bold text-[10px] shrink-0 select-none">
            {message.senderAvatar ? (
              <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              message.senderName?.slice(0, 2).toUpperCase() || 'CO'
            )}
          </div>
        )}

        <div className="flex flex-col">
          {!isMine && message.senderName && (
            <span className="text-[10px] font-semibold text-slate-500 dark:text-[#7E9E8F] ml-1 mb-1">
              {message.senderName}
            </span>
          )}

          <div
            className={`rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-xs ${
              isMine
                ? 'bg-[#00C471] text-white rounded-br-xs'
                : 'bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-[#F8FAFC] rounded-bl-xs'
            }`}
          >
            {/* Attachments rendering */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-2 space-y-2">
                {message.attachments.map((att, idx) => {
                  const isImage = att.fileType?.startsWith('image/');
                  return isImage ? (
                    <div key={idx} className="rounded-xl overflow-hidden border border-white/20 dark:border-[#1A3125] max-w-xs">
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
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs transition ${
                        isMine
                          ? 'bg-white/15 hover:bg-white/25 text-white'
                          : 'bg-slate-50 dark:bg-[#0A110D] hover:bg-slate-100 dark:hover:bg-[#1A3125] text-slate-800 dark:text-[#CBD5E1]'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0 text-[#00C471]" />
                      <div className="truncate flex-1">
                        <p className="font-semibold truncate">{att.fileName || 'Document'}</p>
                        {att.fileSize > 0 && (
                          <span className="text-[10px] opacity-75 font-mono">
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
              className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono ${
                isMine ? 'text-white/80' : 'text-slate-400 dark:text-[#7E9E8F]'
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isMine && (
                <span>
                  {isRead ? (
                    <CheckCheck className="w-3.5 h-3.5 text-white inline" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-white/70 inline" />
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
