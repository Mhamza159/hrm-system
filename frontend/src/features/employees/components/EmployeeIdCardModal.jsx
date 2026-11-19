/**
 * @file EmployeeIdCardModal.jsx
 * @description Enterprise Employee ID Card Modal (Phase 36 / Plan 36-05).
 * Connects the Employee Module directly to the central Company Profile ID Card design.
 * Features:
 *  - Front & Back physical card inspection.
 *  - Standard CR80 badge dimensions (85.6mm × 53.98mm).
 *  - Dedicated print styling (@media print) for direct badge printing.
 *  - Supports self-service profile and administrative employee viewing.
 * Strictly conforms to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useRef } from 'react';
import {
  X,
  CreditCard,
  Printer,
  Download,
  RotateCw,
  Building2,
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  useGetEmployeeIdCardQuery,
  useGetMyIdCardQuery
} from '../employeesApi.js';
import { IdCardPreviewBadge } from '../../settings/components/IdCardPreviewBadge.jsx';

export function EmployeeIdCardModal({
  employeeId,
  isSelf = false,
  isOpen,
  onClose
}) {
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'
  const cardContainerRef = useRef(null);

  // Queries
  const {
    data: empCardResponse,
    isLoading: isEmpLoading,
    error: empError,
    refetch: refetchEmp
  } = useGetEmployeeIdCardQuery(employeeId, { skip: !isOpen || isSelf || !employeeId });

  const {
    data: selfCardResponse,
    isLoading: isSelfLoading,
    error: selfError,
    refetch: refetchSelf
  } = useGetMyIdCardQuery(undefined, { skip: !isOpen || !isSelf });

  if (!isOpen) return null;

  const isLoading = isSelf ? isSelfLoading : isEmpLoading;
  const error = isSelf ? selfError : empError;
  const cardData = isSelf ? selfCardResponse?.data : empCardResponse?.data;

  const employee = cardData?.employee || {};
  const company = cardData?.company || {};
  const idCardConfig = cardData?.idCardConfig || {};
  const meta = cardData?.meta || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Dedicated Print Stylesheet: Isolates the card badge during window.print() */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-id-card-zone, #printable-id-card-zone * {
            visibility: visible;
          }
          #printable-id-card-zone {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0;
            padding: 0;
            width: auto;
            box-shadow: none !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="w-full max-w-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] flex items-center justify-center font-bold border border-emerald-200/80 dark:border-emerald-800/60">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Official Employee Credential Card
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {employee.name ? `${employee.name} (${employee.employeeCode})` : 'Digital Corporate Badge'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#00C471] animate-spin" />
              <p className="text-slate-500 font-medium">Generating official credential card...</p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Failed to Load ID Card</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {error?.data?.message || 'You may not have authorization to view this employee credential.'}
              </p>
              <button
                type="button"
                onClick={isSelf ? refetchSelf : refetchEmp}
                className="px-4 py-2 bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold rounded-xl text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && cardData && (
            <div className="space-y-5">
              {/* Controls Toolbar: Front/Back Switcher & Status */}
              <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-[#0A110D] p-2 rounded-2xl border border-slate-200 dark:border-[#1A3125]">
                {/* Front / Back Side Switcher */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveSide('front')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      activeSide === 'front'
                        ? 'bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Front View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSide('back')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      activeSide === 'back'
                        ? 'bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Back View
                  </button>
                </div>

                {/* Validity Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00C471] font-mono font-bold text-[10px] border border-emerald-200/60 dark:border-emerald-800/60">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Valid Until: {meta.validUntil ? new Date(meta.validUntil).getFullYear() : 'Active'}</span>
                </div>
              </div>

              {/* Centered Render Zone (Printable Element Target) */}
              <div
                id="printable-id-card-zone"
                ref={cardContainerRef}
                className="py-6 flex items-center justify-center bg-slate-100/60 dark:bg-black/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800"
              >
                <IdCardPreviewBadge
                  employee={employee}
                  company={company}
                  config={idCardConfig}
                  activeSide={activeSide}
                />
              </div>

              {/* Physical Print Guidelines Pill */}
              <div className="text-[11px] text-slate-400 text-center space-y-1">
                <p>Standard CR80 Geometry • 85.60 mm × 53.98 mm • 300 DPI Physical Output</p>
                <p className="text-[10px] opacity-75">
                  Clicking "Print Badge" prepares a printer-friendly layout hiding all portal menus and dialogs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>

          {!isLoading && !error && cardData && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Badge</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(company.logoUrl || window.location.href, '_blank');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C471] hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Digital Copy</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
