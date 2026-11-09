/**
 * @file UnansweredQuestionsPage.jsx
 * @description Escalated Chatbot Questions Queue for HR Managers (Module M16 / Row 16.6).
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Row 16.6)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  User,
  ChevronRight
} from 'lucide-react';
import { useGetUnansweredQuestionsQuery } from '../chatbotApi.js';
import { UnansweredAnswerModal } from '../components/UnansweredAnswerModal.jsx';
import { Can } from '../../../components/common/Can.jsx';

export const UnansweredQuestionsPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('Pending');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const { data: res, isLoading } = useGetUnansweredQuestionsQuery({
    page,
    limit: 15,
    status: status !== 'All' ? status : undefined
  });

  const questions = res?.data?.items || [];
  const total = res?.data?.total || 0;
  const totalPages = res?.data?.totalPages || 1;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#00C471]" />
          Unanswered Chatbot Questions
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Review employee inquiries escalated from the HR Chatbot Assistant and provide verified answers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1A3125] pb-3">
        {['Pending', 'Answered', 'All'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              status === s
                ? 'bg-[#00C471] text-black'
                : 'text-gray-400 hover:text-white bg-[#1A3125]/40 hover:bg-[#1A3125]'
            }`}
          >
            {s} Queries
          </button>
        ))}
      </div>

      {/* Questions Table */}
      <div className="bg-[#111D17] border border-[#1A3125] rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 space-y-2">
            <div className="w-8 h-8 border-2 border-[#00C471] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading escalated questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto" />
            <h3 className="font-semibold text-white">No {status.toLowerCase()} questions</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              All chatbot escalation requests have been reviewed and resolved.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0E1713] text-xs uppercase text-gray-400 border-b border-[#1A3125]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Employee</th>
                  <th className="px-6 py-3 font-semibold">Question</th>
                  <th className="px-6 py-3 font-semibold">Language</th>
                  <th className="px-6 py-3 font-semibold">Date Submitted</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A3125]">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-[#1A3125]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {q.userId?.name || 'Employee'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {q.userId?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-emerald-200 font-medium italic line-clamp-2">
                        "{q.question}"
                      </p>
                      {q.answer && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-1 border-t border-[#1A3125] pt-1">
                          <span className="text-[#00C471] font-semibold">HR Answer:</span> {q.answer}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-black/40 text-gray-300 uppercase font-mono">
                        {q.userLanguage || 'en'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          q.status === 'Answered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Can I="chatbot.unanswered.manage">
                        <button
                          onClick={() => setSelectedQuestion(q)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            q.status === 'Answered'
                              ? 'bg-[#1A3125] text-gray-300 hover:text-white hover:bg-[#1A3125]/80'
                              : 'bg-[#00C471] text-black hover:bg-[#00C471]/90'
                          }`}
                        >
                          {q.status === 'Answered' ? 'Edit Answer' : 'Answer'}
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#1A3125] bg-[#0E1713] text-xs text-gray-400">
            <div>
              Showing {questions.length} of {total} queries
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-[#1A3125] hover:bg-[#1A3125]/80 rounded disabled:opacity-50 text-white"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-[#1A3125] hover:bg-[#1A3125]/80 rounded disabled:opacity-50 text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Answer Modal */}
      <UnansweredAnswerModal
        isOpen={Boolean(selectedQuestion)}
        questionItem={selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
      />
    </div>
  );
};

export default UnansweredQuestionsPage;

