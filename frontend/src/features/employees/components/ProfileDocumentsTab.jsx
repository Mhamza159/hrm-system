/**
 * @file ProfileDocumentsTab.jsx
 * @description Document Vault Tab for Employee Profile.
 * 
 * SPECIFICATION:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.5, 3.9)
 * - Vault cards with preview link, upload modal trigger, and delete confirmation.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Calendar,
  HardDrive
} from 'lucide-react';
import { Card } from '../../../components/common/Card.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { DocumentUploadModal } from './DocumentUploadModal.jsx';
import { openSecureFile } from '../../../utils/fileHelper.js';
import { useDeleteDocumentMutation } from '../employeesApi.js';
import { formatDate } from '../../../lib/formatters.js';

export function ProfileDocumentsTab({ employeeId, documents = [], canManage = false }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState(null);

  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();

  const handleDelete = async () => {
    if (!deleteDocId) return;
    try {
      await deleteDocument({ id: employeeId, docId: deleteDocId }).unwrap();
      toast.success('Document deleted successfully');
      setDeleteDocId(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Confidential Document Vault</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Encrypted file repository for identification, employment contracts, and academic degrees.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-10 text-center shadow-xs">
          <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3 stroke-1" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Documents Uploaded</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No verification files, employment contracts, or credentials have been uploaded to this employee's vault yet.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc._id}
              className="p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] rounded-2xl group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                    {doc.type}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1 group-hover:text-[#00C471] transition-colors">
                  {doc.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-3 font-mono">
                  {doc.fileName || 'Attachment'}
                </p>

                <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
                  <div className="flex items-center justify-between">
                    <span>Size:</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatFileSize(doc.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uploaded:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-[#1A3125]">
                <button
                  type="button"
                  onClick={() => openSecureFile(doc.fileUrl)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 hover:bg-slate-100 dark:bg-[#0A110D] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#00C471] dark:hover:text-[#00C471] transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-2xs"
                  title="Secure View / Download"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00C471]" /> View Document
                </button>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => setDeleteDocId(doc._id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        employeeId={employeeId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteDocId)}
        title="Delete Document"
        message="Are you sure you want to permanently delete this document from the employee vault?"
        confirmText="Delete Document"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteDocId(null)}
      />
    </div>
  );
}
