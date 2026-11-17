/**
 * @file ProfileOverviewTab.jsx
 * @description Master Overview Tab for Employee Profile.
 * 
 * SPECIFICATION:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.5)
 * - Displays Personal, Contact, Job, Financial, and Skills metadata cards.
 * - Adheres strictly to Forest & Emerald enterprise tokens.
 */

import React, { useState, useMemo } from 'react';
import {
  User,
  MapPin,
  Building2,
  CreditCard,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { Card } from '../../../components/common/Card.jsx';
import { formatDate, maskCNIC, maskIBAN } from '../../../lib/formatters.js';

export function ProfileOverviewTab({ employee, isOwn = false, canViewFinancials = false }) {
  const [currentTimestamp] = useState(() => Date.now());

  const probationAlert = useMemo(() => {
    if (!employee || !employee.probationEndDate || employee.status !== 'Probation') return null;
    const end = new Date(employee.probationEndDate).getTime();
    const diffDays = Math.ceil((end - currentTimestamp) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 14) {
      return { diffDays, date: employee.probationEndDate };
    }
    return null;
  }, [employee, currentTimestamp]);

  const cnicExpiringAlert = useMemo(() => {
    if (!employee || !employee.cnicExpiry) return false;
    const expiry = new Date(employee.cnicExpiry).getTime();
    const diffDays = Math.ceil((expiry - currentTimestamp) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }, [employee, currentTimestamp]);

  if (!employee) return null;

  return (
    <div className="space-y-6">
      {/* Expiry Alerts */}
      {probationAlert && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold block text-slate-900 dark:text-white">
              Probation Ending in {probationAlert.diffDays} {probationAlert.diffDays === 1 ? 'Day' : 'Days'}
            </span>
            Probation review milestone date is on {formatDate(probationAlert.date)}. Performance assessment required prior to permanent confirmation.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card className="p-5 space-y-4 border-slate-200 dark:border-[#1A3125]">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1A3125] pb-3">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Personal Information
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Full Name:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.name}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Employee Code:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{employee.employeeCode}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Official Email:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 break-all">{employee.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Phone:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Pakistani CNIC:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {canViewFinancials ? employee.cnic : maskCNIC(employee.cnic)}
              </span>
              {cnicExpiringAlert && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                  Expires on {formatDate(employee.cnicExpiry)}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Date of Birth:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(employee.dob)}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Gender:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.gender || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Account Status:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.status}</span>
            </div>
          </div>
        </Card>

        {/* Organization & Job Structure */}
        <Card className="p-5 space-y-4 border-slate-200 dark:border-[#1A3125]">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1A3125] pb-3">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Job & Organizational Structure
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Department:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {employee.departmentId?.name || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Designation:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {employee.designationId?.title || '—'}
                {employee.designationId?.grade && ` (${employee.designationId.grade})`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Assigned Shift:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {employee.shiftId
                  ? `${employee.shiftId.name} (${employee.shiftId.startTime} - ${employee.shiftId.endTime})`
                  : 'Standard Shift'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Direct Manager:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {employee.managerId?.name || 'Reporting to Executive'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Employment Type:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.employmentType}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Joining Date:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(employee.joiningDate)}</span>
            </div>
            {employee.probationEndDate && (
              <div className="col-span-2">
                <span className="text-slate-400 dark:text-slate-500 block">Probation End Date:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(employee.probationEndDate)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Contact & Residential Details */}
        <Card className="p-5 space-y-4 border-slate-200 dark:border-[#1A3125]">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1A3125] pb-3">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Residential Address
            </h4>
          </div>

          <div className="text-xs space-y-2">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Street:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.address?.street || '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">City & State:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {employee.address?.city || '—'}, {employee.address?.state || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Postal & Country:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {employee.address?.postalCode || '—'}, {employee.address?.country || 'Pakistan'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <h5 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Emergency Contact</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Name:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.emergencyContact?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Relationship:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.emergencyContact?.relationship || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Phone:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.emergencyContact?.phone || '—'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Financial & Banking Information */}
        <Card className="p-5 space-y-4 border-slate-200 dark:border-[#1A3125]">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1A3125] pb-3">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Disbursement & Banking
            </h4>
          </div>

          {employee.bankDetails ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Bank Name:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.bankDetails.bankName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Account Title:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.bankDetails.accountTitle || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Account Number:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  {canViewFinancials || isOwn
                    ? employee.bankDetails.accountNumber || '—'
                    : '••••••••••'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">IBAN:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  {canViewFinancials
                    ? employee.bankDetails.iban || '—'
                    : maskIBAN(employee.bankDetails.iban)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
              No banking details recorded on file.
            </div>
          )}
        </Card>
      </div>

      {/* Skills & Competencies */}
      <Card className="p-5 space-y-3 border-slate-200 dark:border-[#1A3125]">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1A3125] pb-3">
          <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Skills Taxonomy & Technical Competencies
          </h4>
        </div>

        {employee.skills?.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {employee.skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No skills tagged yet.</p>
        )}
      </Card>
    </div>
  );
}
