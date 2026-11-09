/**
 * @file QuickActionCard.jsx
 * @description Interactive Action Cards for Leaves & Payslip Downloads in Chatbot (Module M16 / Row 16.5).
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Row 16.5)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { Calendar, Download, Check, X, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { useAskChatbotMutation } from '../chatbotApi.js';
import { toast } from 'sonner';

export const QuickActionCard = ({ action, onActionDone }) => {
  const [askChatbot, { isLoading }] = useAskChatbotMutation();
  const [confirmed, setConfirmed] = useState(false);

  if (!action) return null;

  // 1. Download Payslip Card
  if (action.type === 'download_payslip') {
    const { url, period } = action.payload || {};
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0E1713] border border-[#1A3125] flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#00C471]/10 text-[#00C471]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Payslip Document ({period})</div>
            <div className="text-[11px] text-gray-400">PDF salary statement with tax breakdown</div>
          </div>
        </div>
        <a
          href={url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-[#00C471] hover:bg-[#00C471]/90 rounded-lg transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
      </div>
    );
  }

  // 2. Apply Leave Action Prompt / Confirmation
  if (action.type === 'apply_leave_prompt' || action.type === 'apply_leave_confirm') {
    const handleConfirm = async () => {
      try {
        await askChatbot({
          message: 'Please proceed with submitting my leave request.'
        }).unwrap();
        setConfirmed(true);
        if (onActionDone) onActionDone();
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to submit leave.');
      }
    };

    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0E1713] border border-[#00C471]/30 space-y-2.5 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Calendar className="w-4 h-4 text-[#00C471]" />
          <span>Leave Application Quick Action</span>
        </div>
        <p className="text-xs text-gray-300">
          Would you like to open the full leave request form or ask me to submit standard casual leave?
        </p>
        <div className="flex items-center gap-2 pt-1">
          <a
            href="/leaves/my"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-[#00C471] hover:bg-[#00C471]/90 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Leave Portal
          </a>
        </div>
      </div>
    );
  }

  return null;
};

