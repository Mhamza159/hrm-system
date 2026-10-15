/**
 * @file ProfileOverviewTab.jsx
 * @description Master Overview Tab for Employee Profile.
 * 
 * SPECIFICATION:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.5)
 * - Displays Personal, Contact, Job, Financial, and Skills metadata cards.
 */

import React from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Award,
  Clock,
  CreditCard,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { Card } from '../../../components/common/Card.jsx';
import { formatDate, maskCNIC, maskIBAN } from '../../../lib/formatters.js';

export function ProfileOverviewTab({ employee, isOwn = false, canViewFinancials = false }) {
  if (!employee) return null;

  // Check CNIC expiry within 30 days
  const isCnicExpiring = () => {
    if (!employee.cnicExpiry) return false;
    const expiry = new Date(employee.cnicExpiry);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  // Check probation ending within 14 days
  const isProbationEnding = () => {
    if (!employee.probationEndDate || employee.status !== 'Probation') return false;
    const end = new Date(employee.probationEndDate);
    const today = new Date();
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  };

  return (
    <div className="space-y-6">
      {/* Expiry Alerts */}
      {(() => {
        if (!employee.probationEndDate) return null;
        const end = new Date(employee.probationEndDate);
        const today = new Date();
        const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 14) {
          return (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold block">Probation Ending in {diffDays} {diffDays === 1 ? 'Day' : 'Days'}</span>
                Probation review milestone date is on {formatDate(employee.probationEndDate)}. Performance assessment required prior to permanent confirmation.
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <User className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Personal Information
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Full Name:</span>
              <span className="font-semibold text-slate-900">{employee.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Employee Code:</span>
              <span className="font-semibold text-slate-900 font-mono">{employee.employeeCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Official Email:</span>
              <span className="font-semibold text-slate-900 break-all">{employee.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Phone:</span>
              <span className="font-semibold text-slate-900">{employee.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Pakistani CNIC:</span>
              <span className="font-semibold text-slate-900 font-mono">
                {canViewFinancials ? employee.cnic : maskCNIC(employee.cnic)}
              </span>
              {isCnicExpiring() && (
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                  Expires on {formatDate(employee.cnicExpiry)}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block">Date of Birth:</span>
              <span className="font-semibold text-slate-900">{formatDate(employee.dob)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Gender:</span>
              <span className="font-semibold text-slate-900">{employee.gender || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Account Status:</span>
              <span className="font-semibold text-slate-900">{employee.status}</span>
            </div>
          </div>
        </Card>

        {/* Organization & Job Structure */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Job & Organizational Structure
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Department:</span>
              <span className="font-semibold text-slate-900">
                {employee.departmentId?.name || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Designation:</span>
              <span className="font-semibold text-slate-900">
                {employee.designationId?.title || '—'}
                {employee.designationId?.grade && ` (${employee.designationId.grade})`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Assigned Shift:</span>
              <span className="font-semibold text-slate-900 font-mono">
                {employee.shiftId
                  ? `${employee.shiftId.name} (${employee.shiftId.startTime} - ${employee.shiftId.endTime})`
                  : 'Standard Shift'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Direct Manager:</span>
              <span className="font-semibold text-slate-900">
                {employee.managerId?.name || 'Reporting to Executive'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Employment Type:</span>
              <span className="font-semibold text-slate-900">{employee.employmentType}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Joining Date:</span>
              <span className="font-semibold text-slate-900">{formatDate(employee.joiningDate)}</span>
            </div>
            {employee.probationEndDate && (
              <div className="col-span-2">
                <span className="text-slate-400 block">Probation End Date:</span>
                <span className="font-semibold text-slate-900">{formatDate(employee.probationEndDate)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Contact & Residential Details */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Residential Address
            </h4>
          </div>

          <div className="text-xs space-y-2">
            <div>
              <span className="text-slate-400 block">Street:</span>
              <span className="font-semibold text-slate-900">{employee.address?.street || '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block">City & State:</span>
                <span className="font-semibold text-slate-900">
                  {employee.address?.city || '—'}, {employee.address?.state || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Postal & Country:</span>
                <span className="font-semibold text-slate-900">
                  {employee.address?.postalCode || '—'}, {employee.address?.country || 'Pakistan'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <h5 className="text-[11px] font-bold text-slate-500 uppercase mb-2">Emergency Contact</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Name:</span>
                <span className="font-semibold text-slate-900">{employee.emergencyContact?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Relationship:</span>
                <span className="font-semibold text-slate-900">{employee.emergencyContact?.relationship || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone:</span>
                <span className="font-semibold text-slate-900">{employee.emergencyContact?.phone || '—'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Financial & Banking Information */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Disbursement & Banking
            </h4>
          </div>

          {employee.bankDetails ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Bank Name:</span>
                <span className="font-semibold text-slate-900">{employee.bankDetails.bankName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Account Title:</span>
                <span className="font-semibold text-slate-900">{employee.bankDetails.accountTitle || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Account Number:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {canViewFinancials || isOwn
                    ? employee.bankDetails.accountNumber || '—'
                    : '••••••••••'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">IBAN:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {canViewFinancials
                    ? employee.bankDetails.iban || '—'
                    : maskIBAN(employee.bankDetails.iban)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              No banking details recorded on file.
            </div>
          )}
        </Card>
      </div>

      {/* Skills & Competencies */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2 border-b pb-3">
          <Tag className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Skills Taxonomy & Technical Competencies
          </h4>
        </div>

        {employee.skills?.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {employee.skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No skills tagged yet.</p>
        )}
      </Card>
    </div>
  );
}
