/**
 * @file ChangeRequestModal.jsx
 * @description Dialog allowing employees to propose modifications to sensitive profile data.
 * 
 * SPECIFICATION & WORKFLOW:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.16)
 * - Supported targets: Bank Details (IBAN), Residential Address, Emergency Contact.
 * - Triggers HR review queue; changes are only applied upon managerial approval.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, X, Loader2, Send } from 'lucide-react';
import { useSubmitChangeRequestMutation } from '../employeesApi.js';

export function ChangeRequestModal({ isOpen, onClose, currentEmployee }) {
  const [targetField, setTargetField] = useState('bankDetails');
  const [reason, setReason] = useState('');

  // Bank Form State
  const [bankName, setBankName] = useState(currentEmployee?.bankDetails?.bankName || '');
  const [accountTitle, setAccountTitle] = useState(currentEmployee?.bankDetails?.accountTitle || '');
  const [accountNumber, setAccountNumber] = useState(currentEmployee?.bankDetails?.accountNumber || '');
  const [iban, setIban] = useState(currentEmployee?.bankDetails?.iban || '');

  // Address Form State
  const [street, setStreet] = useState(currentEmployee?.address?.street || '');
  const [city, setCity] = useState(currentEmployee?.address?.city || '');
  const [state, setState] = useState(currentEmployee?.address?.state || '');
  const [postalCode, setPostalCode] = useState(currentEmployee?.address?.postalCode || '');

  // Emergency Form State
  const [emergencyName, setEmergencyName] = useState(currentEmployee?.emergencyContact?.name || '');
  const [emergencyRel, setEmergencyRel] = useState(currentEmployee?.emergencyContact?.relationship || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentEmployee?.emergencyContact?.phone || '');

  const [submitChangeRequest, { isLoading }] = useSubmitChangeRequestMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      toast.error('Please specify a detailed justification reason (minimum 3 characters)');
      return;
    }

    let requestedValue;
    if (targetField === 'bankDetails') {
      if (!iban.trim() && !accountNumber.trim()) {
        toast.error('Please provide an updated account number or IBAN');
        return;
      }
      requestedValue = {
        bankName: bankName.trim(),
        accountTitle: accountTitle.trim(),
        accountNumber: accountNumber.trim(),
        iban: iban.trim().toUpperCase()
      };
    } else if (targetField === 'address') {
      if (!city.trim() || !street.trim()) {
        toast.error('Street and City are required for address update');
        return;
      }
      requestedValue = {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: 'Pakistan'
      };
    } else if (targetField === 'emergencyContact') {
      if (!emergencyName.trim() || !emergencyPhone.trim()) {
        toast.error('Contact name and phone number are required');
        return;
      }
      requestedValue = {
        name: emergencyName.trim(),
        relationship: emergencyRel.trim(),
        phone: emergencyPhone.trim()
      };
    }

    try {
      await submitChangeRequest({
        field: targetField,
        requestedValue,
        reason: reason.trim()
      }).unwrap();

      toast.success('Profile change request submitted for HR review');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit change request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Request Profile Info Update</h3>
              <p className="text-[11px] text-slate-500">Subject to Human Resources verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data Category to Modify <span className="text-red-500">*</span>
            </label>
            <select
              value={targetField}
              onChange={(e) => setTargetField(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
            >
              <option value="bankDetails">Bank Account & IBAN</option>
              <option value="address">Residential Address</option>
              <option value="emergencyContact">Emergency Contact Details</option>
            </select>
          </div>

          {/* Conditional Input Fields */}
          {targetField === 'bankDetails' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase">Updated Banking Coordinates</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Meezan Bank"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Account Title</label>
                  <input
                    type="text"
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    placeholder="Account Title"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">IBAN (24 chars)</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="PK36MEZN00010101..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {targetField === 'address' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase">Updated Residential Address</h4>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Street Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street / House #"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Province"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Postal Code"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {targetField === 'emergencyContact' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase">Updated Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Contact Person Name</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Relationship</label>
                  <input
                    type="text"
                    value={emergencyRel}
                    onChange={(e) => setEmergencyRel(e.target.value)}
                    placeholder="e.g. Spouse / Brother"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Phone Number</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justification / Reason for Update <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this profile change is required for HR verification..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
