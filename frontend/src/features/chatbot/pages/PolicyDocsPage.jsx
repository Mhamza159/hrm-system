/**
 * @file PolicyDocsPage.jsx
 * @description Company Policy Documents Management Page for HR Managers (Module M16 / Row 16.1).
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Row 16.1)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { useGetPolicyDocsQuery, useDeletePolicyDocMutation } from '../chatbotApi.js';
import { PolicyUploadModal } from '../components/PolicyUploadModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

export const PolicyDocsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: res, isLoading, isFetching } = useGetPolicyDocsQuery({
    page,
    limit: 15,
    search: search.trim() || undefined,
    category: category !== 'All' ? category : undefined
  });

  const [deletePolicyDoc, { isLoading: isDeleting }] = useDeletePolicyDocMutation();

  const policyDocs = res?.data?.items || [];
  const total = res?.data?.total || 0;
  const totalPages = res?.data?.totalPages || 1;

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to remove policy document "${title}"?`)) {
      try {
        await deletePolicyDoc(id).unwrap();
        toast.success('Policy document removed successfully.');
      } catch (err) {
        toast.error(err?.data?.message || err?.message || 'Failed to delete policy document.');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#00C471]" />
            Company Policy Documents & Handbooks
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Official guidelines, leave rules, and employee handbooks ingested for Chatbot AI grounding.
          </p>
        </div>

        <Can I="chatbot.policy.manage">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black bg-[#00C471] hover:bg-[#00C471]/90 rounded-lg transition-colors shadow-lg shadow-[#00C471]/10 shrink-0"
          >
            <Upload className="w-4 h-4" />
            Upload Policy Doc
          </button>
        </Can>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#111D17] border border-[#1A3125] p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#1A3125]/40 border border-[#1A3125] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00C471] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm bg-[#1A3125]/40 border border-[#1A3125] rounded-lg text-white focus:outline-none focus:border-[#00C471] transition-colors"
          >
            <option value="All" className="bg-[#111D17]">All Categories</option>
            <option value="General" className="bg-[#111D17]">General</option>
            <option value="Leave" className="bg-[#111D17]">Leave & Time-Off</option>
            <option value="Attendance" className="bg-[#111D17]">Attendance & Timings</option>
            <option value="Conduct" className="bg-[#111D17]">Code of Conduct</option>
            <option value="Benefits" className="bg-[#111D17]">Employee Benefits</option>
            <option value="Travel" className="bg-[#111D17]">Travel & Expenses</option>
            <option value="Security" className="bg-[#111D17]">Security & Confidentiality</option>
            <option value="Probation" className="bg-[#111D17]">Probation & Confirmation</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#111D17] border border-[#1A3125] rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 space-y-2">
            <div className="w-8 h-8 border-2 border-[#00C471] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading policy documents...</p>
          </div>
        ) : policyDocs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <FileText className="w-12 h-12 text-[#1A3125] mx-auto" />
            <h3 className="font-semibold text-white">No policy documents found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Upload your employee handbook, leave policy, or attendance guidelines to enable AI Q&A.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0E1713] text-xs uppercase text-gray-400 border-b border-[#1A3125]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Title & Description</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Format</th>
                  <th className="px-6 py-3 font-semibold">Indexed On</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A3125]">
                {policyDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-[#1A3125]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#00C471]/10 text-[#00C471] mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{doc.title}</div>
                          {doc.description && (
                            <p className="text-xs text-gray-400 mt-0.5 max-w-md line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1A3125] text-emerald-400 border border-[#00C471]/30">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono uppercase text-gray-400 bg-black/40 px-2 py-1 rounded">
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-[#00C471] hover:bg-[#1A3125] rounded-lg transition-colors"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <Can I="chatbot.policy.manage">
                          <button
                            onClick={() => handleDelete(doc._id, doc.title)}
                            disabled={isDeleting}
                            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete policy document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Can>
                      </div>
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
              Showing {policyDocs.length} of {total} documents
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

      {/* Upload Modal */}
      <PolicyUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};

export default PolicyDocsPage;

