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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Confidential Document Vault</h3>
          <p className="text-xs text-slate-500">
            Encrypted file repository for identification, employment contracts, and academic degrees.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-medium">No documents uploaded to this employee's vault yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc._id}
              className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {doc.type}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                  {doc.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                  {doc.fileName || 'Attachment'}
                </p>

                <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span>Size:</span>
                    <span className="font-mono">{formatFileSize(doc.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uploaded:</span>
                    <span>{formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t">
                <button
                  type="button"
                  onClick={() => openSecureFile(doc.fileUrl)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 text-xs cursor-pointer"
                  title="Secure View / Download"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View
                </button>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => setDeleteDocId(doc._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
