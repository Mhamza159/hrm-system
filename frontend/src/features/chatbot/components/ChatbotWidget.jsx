/**
 * @file ChatbotWidget.jsx
 * @description Floating Conversational HR Assistant Widget (Module M16 / Rows 16.2, 16.7, 16.8, 16.9).
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.2 to 16.9)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 * - Bilingual Quick Suggestion Chips (English & Roman Urdu).
 * - Automatic Message Stream Persistence & Scroll-to-Bottom.
 * - Global Feature Toggle Integration (Settings M4 / Row 16.9).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Trash2,
  Minimize2,
  Sparkles,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import {
  useGetChatHistoryQuery,
  useAskChatbotMutation,
  useClearChatHistoryMutation,
  useGetChatbotSettingsQuery
} from '../chatbotApi.js';
import { ChatMessageBubble } from './ChatMessageBubble.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { toast } from 'sonner';

export const ChatbotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Settings & Throttling
  const { data: settingsRes } = useGetChatbotSettingsQuery();
  const chatbotSettings = settingsRes?.data || { enabled: true };

  // RTK Query Hooks
  const { data: historyRes, isLoading: isLoadingHistory, refetch: refetchHistory } = useGetChatHistoryQuery(
    undefined,
    { skip: !isOpen }
  );
  const [askChatbot, { isLoading: isAsking }] = useAskChatbotMutation();
  const [clearChatHistory, { isLoading: isClearing }] = useClearChatHistoryMutation();

  const [localMessages, setLocalMessages] = useState([]);

  // Sync loaded history into local display stream
  useEffect(() => {
    if (historyRes?.data?.items) {
      setLocalMessages(historyRes.data.items);
    }
  }, [historyRes]);

  // Auto-scroll to bottom on message update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages, isOpen, isAsking]);

  // If chatbot is globally disabled in company settings, hide widget
  if (chatbotSettings.enabled === false && !user?.roles?.includes('Super Admin')) {
    return null;
  }

  // Bilingual quick suggestion chips (Row 16.7)
  const SUGGESTION_CHIPS = [
    { label: 'Meri kitni leaves bachi hain?', query: 'Meri kitni leaves bachi hain?' },
    { label: 'Agli salary kab aayegi?', query: 'Agli salary kab aayegi?' },
    { label: 'What is the probation period?', query: 'What is the probation period in company policy?' },
    { label: 'Download my last payslip', query: 'Can you show me my latest payslip details?' }
  ];

  const handleSendMessage = async (textToSend) => {
    const message = textToSend || inputText;
    if (!message || !message.trim() || isAsking) return;

    const trimmed = message.trim();
    setInputText('');

    // Append optimistic user message
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    };
    setLocalMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await askChatbot({ message: trimmed }).unwrap();
      const assistantMsg = {
        _id: res.data?.messageId || `bot-${Date.now()}`,
        role: 'assistant',
        content: res.data?.reply || '',
        actions: res.data?.actions || [],
        sources: res.data?.sources || [],
        language: res.data?.language || 'en',
        createdAt: new Date().toISOString()
      };
      setLocalMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        _id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          err?.data?.message ||
          err?.message ||
          'Sorry, an error occurred while processing your request. Please try again.',
        createdAt: new Date().toISOString()
      };
      setLocalMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your chat conversation?')) {
      try {
        await clearChatHistory().unwrap();
        setLocalMessages([]);
        toast.success('Conversation history cleared.');
      } catch (err) {
        toast.error('Failed to clear history.');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Trigger Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            data-testid="chatbot-launcher-btn"
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#00C471] hover:bg-[#00C471]/90 text-black font-semibold rounded-full shadow-2xl shadow-[#00C471]/25 hover:scale-105 active:scale-95 transition-all duration-200"
            title="Open HR Assistant Chat"
          >
            <div className="relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
            </div>
            <span className="text-xs font-bold tracking-wide">HR Assistant</span>
          </button>
        </div>
      )}

      {/* Chat Drawer Dialog */}
      {isOpen && (
        <div
          data-testid="chatbot-window"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-[#111D17] border border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0E1713] border-b border-[#1A3125]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00C471]/15 border border-[#00C471]/30 flex items-center justify-center text-[#00C471]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">HR Assistant</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C471]" /> Online
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Policy Q&A & Personal Records</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                disabled={isClearing || localMessages.length === 0}
                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-[#1A3125] rounded-lg transition-colors disabled:opacity-40"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A3125] rounded-lg transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0A120E]/50">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                Loading chat history...
              </div>
            ) : localMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00C471]/10 border border-[#00C471]/20 flex items-center justify-center text-[#00C471]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">How can I assist you?</h4>
                  <p className="text-xs text-gray-400 max-w-[260px] mx-auto">
                    Ask in English or Roman Urdu about company policies, leave balance, or payslips.
                  </p>
                </div>

                {/* Quick suggestions */}
                <div className="w-full pt-2 space-y-1.5 text-left">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-1">
                    Suggested Questions:
                  </div>
                  {SUGGESTION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.query)}
                      className="w-full text-left px-3 py-2 text-xs bg-[#111D17] hover:bg-[#1A3125] border border-[#1A3125] hover:border-[#00C471]/40 rounded-xl text-gray-300 hover:text-white transition-all duration-150"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {localMessages.map((msg) => (
                  <ChatMessageBubble
                    key={msg._id}
                    message={msg}
                    onEscalateSuccess={refetchHistory}
                  />
                ))}

                {isAsking && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 italic py-2 pl-9 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#00C471]" />
                    HR Assistant is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Suggestion Strip on existing chats */}
          {localMessages.length > 0 && (
            <div className="px-3 py-1.5 bg-[#0E1713] border-t border-[#1A3125] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {SUGGESTION_CHIPS.slice(0, 3).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.query)}
                  className="px-2.5 py-1 text-[11px] whitespace-nowrap bg-[#1A3125]/60 hover:bg-[#1A3125] text-gray-300 hover:text-white rounded-lg border border-[#1A3125] transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-[#0E1713] border-t border-[#1A3125]">
            <div className="flex items-center gap-2 bg-[#1A3125]/40 border border-[#1A3125] focus-within:border-[#00C471] rounded-xl px-3 py-2 transition-colors">
              <input
                type="text"
                data-testid="chatbot-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about leaves, salary, policies..."
                disabled={isAsking}
                className="flex-1 text-xs bg-transparent text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                type="button"
                data-testid="chatbot-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isAsking}
                className="p-1.5 bg-[#00C471] hover:bg-[#00C471]/90 text-black rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-gray-500">
              <span>Supports English & Roman Urdu</span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

