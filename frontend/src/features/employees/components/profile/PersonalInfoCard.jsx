/**
 * @file PersonalInfoCard.jsx
 * @description Card displaying comprehensive personal contact and identity coordinates.
 * 
 * SPECIFICATION & GOVERNANCE:
 * - Module: M3 Employee Management / Personal Profile
 * - PBAC: Read-only display of personal data. Sensitive mutations (address, CNIC) require Change Request.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  MapPin,
  FileEdit,
  HeartHandshake
} from 'lucide-react';
import { Card } from '../../../../components/common/Card.jsx';
import { formatCNIC, formatDate } from '../../../../lib/formatters.js';

export function PersonalInfoCard({ employee, user, isSuperAdminRole, onRequestChange }) {
  const addressString = employee?.address?.street
    ? [
        employee.address.street,
        employee.address.city,
        employee.address.state,
        employee.address.postalCode,
        employee.address.country || 'Pakistan'
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <Card className="p-5 border-slate-200 dark:border-[#1A3125] dark:bg-[#111D17] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
          <User className="w-4 h-4 text-[#00C471]" />
          <span>Personal & Identity Details</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-[#00C471] bg-emerald-50 dark:bg-[#162820] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
          Verified Records
        </span>
      </div>

      {/* Details List */}
      <div className="space-y-2.5 text-xs divide-y divide-slate-100 dark:divide-[#1A3125]/60">
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {employee?.name || user?.email?.split('@')[0] || '—'}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" /> Account Email
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
            {employee?.email || user?.email || '—'}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
            {employee?.phone || 'Not Provided'}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" /> National ID (CNIC)
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
            {formatCNIC(employee?.cnic) || '—'}
          </span>
        </div>

        {!isSuperAdminRole && (
          <>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Birth
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {employee?.dob ? formatDate(employee.dob) : 'Not Recorded'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-slate-400" /> Gender
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {employee?.gender || 'Not Specified'}
              </span>
            </div>

            <div className="flex justify-between items-start pt-2">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Residential Address
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-right max-w-[240px] leading-relaxed">
                {addressString || 'No address registered'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Change Request Notice for regular staff */}
      {!isSuperAdminRole && onRequestChange && (
        <div className="pt-2 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between text-[11px]">
          <span className="text-slate-400 dark:text-slate-500">Need to update your address?</span>
          <button
            type="button"
            onClick={onRequestChange}
            className="text-emerald-700 dark:text-[#00C471] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <FileEdit className="w-3 h-3" /> Submit Change Request
          </button>
        </div>
      )}
    </Card>
  );
}

PersonalInfoCard.propTypes = {
  employee: PropTypes.object,
  user: PropTypes.object,
  isSuperAdminRole: PropTypes.bool,
  onRequestChange: PropTypes.func
};
