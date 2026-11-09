/**
 * @file UnansweredAnswerModal.jsx
 * @description Dialog for HR Managers to resolve escalated chatbot queries (Module M16 / Row 16.6).
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Row 16.6)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle } from 'lucide-react';
import { useAnswerUnansweredQuestionMutation } from '../chatbotApi.js';
import { toast } from 'sonner';

export const UnansweredAnswerModal = ({ isOpen, questionItem, onClose }) => {
  const [answer, setAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [answerUnansweredQuestion, { isLoading }] = useAnswerUnansweredQuestionMutation();

  if (!isOpen || !questionItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!answer.trim()) {
      setErrorMsg('Answer cannot be empty.');
      return;
    }

    try {
      await answerUnansweredQuestion({
        id: questionItem._id,
        answer: answer.trim()
      }).unwrap();

      toast.success('Answer recorded and notification sent to employee!');
      setAnswer('');
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to submit answer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111D17] border border-[#1A3125] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A3125] bg-[#0E1713]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00C471]/10 text-[#00C471]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Answer Employee Query</h3>
              <p className="text-xs text-gray-400">Provide verified HR response to unresolved question</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1A3125]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Question Callout */}
          <div className="p-3 bg-[#0E1713] border border-[#1A3125] rounded-lg">
            <div className="text-[11px] font-semibold uppercase text-gray-400 mb-1">
              Employee Question ({questionItem.userId?.name || 'Staff Member'}):
            </div>
            <p className="text-sm text-emerald-300 font-medium italic">
              "{questionItem.question}"
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              HR Official Answer <span className="text-[#00C471]">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write the official answer to be sent to the employee..."
              className="w-full px-3 py-2 text-sm bg-[#1A3125]/40 border border-[#1A3125] rounded-lg text-white focus:outline-none focus:border-[#00C471] transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-[#1A3125]/40 hover:bg-[#1A3125] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-medium text-black bg-[#00C471] hover:bg-[#00C471]/90 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Send Answer to Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

