/**
 * @file PayrollBankCard.jsx
 * @description Card presenting protected payroll bank coordinates and emergency contacts.
 * 
 * SPECIFICATION & PBAC POLICY:
 * - Module: M3 Employee Management & M9 Payroll Coordinates
 * - Direct mutation locked: Changes must be submitted via ChangeRequestModal for HR approval.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  CreditCard,
  Building,
  ShieldCheck,
  PhoneCall,
  FileEdit,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../../../components/common/Card.jsx';

export function PayrollBankCard({
  bankDetails,
  emergencyContact,
  onRequestChange
}) {
  return (
    <Card className="p-5 border-slate-200 dark:border-[#1A3125] dark:bg-[#111D17] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
          <CreditCard className="w-4 h-4 text-[#00C471]" />
          <span>Payroll Coordinates & Emergency Contacts</span>
        </div>
        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> PBAC Protected
        </span>
      </div>

      {/* Grid: Bank Info + Emergency Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Bank Information */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-[#1A3125] pb-1.5">
            <Building className="w-3.5 h-3.5 text-[#00C471]" />
            <span>Bank Coordinates</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">Bank Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {bankDetails?.bankName || 'Not Registered'}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">Account Title</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {bankDetails?.accountTitle || 'Not Set'}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">Account No.</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {bankDetails?.accountNumber || '—'}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">IBAN</span>
              <span className="font-mono font-bold text-[#00C471]">
                {bankDetails?.iban || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200/60 dark:border-[#1A3125] pb-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-[#00C471]" />
            <span>Emergency Contact</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">Contact Person</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {emergencyContact?.name || 'Not Provided'}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">Relationship</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {emergencyContact?.relationship || '—'}
              </span>
            </div>

            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">Emergency Phone</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {emergencyContact?.phone || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Request Action Callout */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#1A3125] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Financial coordinates require formal HR review before modification.</span>
        </div>

        {onRequestChange && (
          <button
            type="button"
            onClick={onRequestChange}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471] hover:bg-emerald-50 dark:hover:bg-[#162820] text-emerald-700 dark:text-[#00C471] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5" /> Request Bank Update
          </button>
        )}
      </div>
    </Card>
  );
}

PayrollBankCard.propTypes = {
  bankDetails: PropTypes.object,
  emergencyContact: PropTypes.object,
  onRequestChange: PropTypes.func
};
