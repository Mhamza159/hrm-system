/**
 * @file ChatMessageBubble.jsx
 * @description Message Bubble with Citations & Action Triggers (Module M16 / Rows 16.2, 16.3, 16.5, 16.6).
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.2, 16.3, 16.5, 16.6)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React from 'react';
import { Bot, User, BookOpen, HelpCircle } from 'lucide-react';
import { QuickActionCard } from './QuickActionCard.jsx';
import { useEscalateQuestionMutation } from '../chatbotApi.js';
import { toast } from 'sonner';

export const ChatMessageBubble = ({ message, onEscalateSuccess }) => {
  const isAssistant = message.role === 'assistant';
  const [escalateQuestion, { isLoading: isEscalating }] = useEscalateQuestionMutation();

  const handleEscalate = async (questionText) => {
    try {
      await escalateQuestion({
        question: questionText || message.content,
        userLanguage: message.language || 'en'
      }).unwrap();
      toast.success('Question escalated to HR team. You will be notified when HR responds!');
      if (onEscalateSuccess) onEscalateSuccess();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to escalate to HR.');
    }
  };

  // Simple Markdown renderer for bold **text**, bullet points •, and quotes >
  const renderFormattedContent = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Handle blockquote
      if (line.startsWith('>')) {
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-[#00C471] pl-3 my-1.5 text-xs italic text-gray-300 bg-[#0E1713]/60 py-1 rounded-r"
          >
            {line.replace(/^>\s*/, '')}
          </blockquote>
        );
      }

      // Handle bold formatting **bold**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-0.5'}>
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <div className={`flex items-start gap-2.5 my-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {/* Bot Avatar */}
      {isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
          isAssistant
            ? 'bg-[#111D17] border border-[#1A3125] text-gray-200 rounded-tl-sm'
            : 'bg-[#00C471] text-black font-medium rounded-tr-sm'
        }`}
      >
        <div className="space-y-1">{renderFormattedContent(message.content)}</div>

        {/* Citations / Sources */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-[#1A3125] space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#00C471]" />
              Handbook Citations:
            </div>
            {message.sources.map((src, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0E1713] border border-[#1A3125] text-[11px] text-emerald-400 font-mono mr-1 mb-1"
              >
                <span>{src.title}</span>
                {src.category && (
                  <span className="text-[10px] text-gray-400">({src.category})</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Action Cards */}
        {isAssistant && message.actions && message.actions.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.actions.map((act, idx) => (
              <div key={idx}>
                {act.type === 'escalate_hr' || act.type === 'ask_hr' ? (
                  <button
                    onClick={() => handleEscalate(act.payload?.question)}
                    disabled={isEscalating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1A3125] text-amber-300 hover:bg-[#1A3125]/80 border border-amber-500/30 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {act.label || 'Ask HR'}
                  </button>
                ) : (
                  <QuickActionCard action={act} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Timestamp */}
        {message.createdAt && (
          <div
            className={`text-[9px] mt-1 text-right ${
              isAssistant ? 'text-gray-500' : 'text-emerald-950 font-semibold'
            }`}
          >
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-[#1A3125] text-emerald-400 border border-[#00C471]/30 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

