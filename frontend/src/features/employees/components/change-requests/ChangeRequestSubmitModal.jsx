/**
 * @file ChangeRequestSubmitModal.jsx
 * @description Dynamic multi-category change request submission dialog with pre-filled baseline data,
 * supporting document uploader, priority tagging, and validation.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ShieldAlert,
  X,
  Loader2,
  Send,
  UploadCloud,
  FileText,
  User,
  Phone,
  MapPin,
  HeartHandshake,
  CreditCard,
  Building2,
  Briefcase,
  Users2
} from 'lucide-react';
import {
  useSubmitChangeRequestMutation,
  useUploadChangeRequestAttachmentMutation,
  useGetEmployeesQuery
} from '../../employeesApi.js';
import {
  useGetDepartmentsQuery,
  useGetDesignationsQuery
} from '../../../departments/departmentsApi.js';
import { CATEGORY_CONFIG } from './changeRequestTheme.js';

export function ChangeRequestSubmitModal({ isOpen, onClose, currentEmployee }) {
  const [category, setCategory] = useState('bank_details');
  const [priority, setPriority] = useState('normal');
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Bank Coordinates State
  const [bankName, setBankName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');

  // Address State
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Emergency Contact State
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Personal Info State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('single');
  const [bloodGroup, setBloodGroup] = useState('');

  // Contact Info State
  const [phone, setPhone] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');

  // Org State
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [targetDesignationId, setTargetDesignationId] = useState('');
  const [targetManagerId, setTargetManagerId] = useState('');

  // Queries for lookups
  const { data: deptData } = useGetDepartmentsQuery(undefined, { skip: !isOpen });
  const { data: desigData } = useGetDesignationsQuery(undefined, { skip: !isOpen });
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 }, { skip: !isOpen });

  const departments = deptData?.data || [];
  const designations = desigData?.data || [];
  const employeesList = employeesData?.data?.items || employeesData?.data || [];

  const [submitChangeRequest, { isLoading: isSubmitting }] = useSubmitChangeRequestMutation();
  const [uploadAttachment] = useUploadChangeRequestAttachmentMutation();

  // Populate initial values from currentEmployee whenever modal opens
  useEffect(() => {
    if (currentEmployee) {
      setBankName(currentEmployee.bankDetails?.bankName || '');
      setAccountTitle(currentEmployee.bankDetails?.accountTitle || '');
      setAccountNumber(currentEmployee.bankDetails?.accountNumber || '');
      setIban(currentEmployee.bankDetails?.iban || '');

      setStreet(currentEmployee.address?.street || '');
      setCity(currentEmployee.address?.city || '');
      setState(currentEmployee.address?.state || '');
      setPostalCode(currentEmployee.address?.postalCode || '');

      setEmergencyName(currentEmployee.emergencyContact?.name || '');
      setEmergencyRel(currentEmployee.emergencyContact?.relationship || '');
      setEmergencyPhone(currentEmployee.emergencyContact?.phone || '');

      setFullName(currentEmployee.name || `${currentEmployee.firstName || ''} ${currentEmployee.lastName || ''}`.trim());
      setGender(currentEmployee.gender || 'male');
      setDob(currentEmployee.dob ? currentEmployee.dob.split('T')[0] : '');
      setMaritalStatus(currentEmployee.maritalStatus || 'single');
      setBloodGroup(currentEmployee.bloodGroup || '');

      setPhone(currentEmployee.phone || '');
      setPersonalEmail(currentEmployee.personalEmail || '');

      setTargetDepartmentId(currentEmployee.departmentId?._id || currentEmployee.departmentId || '');
      setTargetDesignationId(currentEmployee.designationId?._id || currentEmployee.designationId || '');
      setTargetManagerId(currentEmployee.reportingManagerId?._id || currentEmployee.reportingManagerId || '');
    }
  }, [currentEmployee, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploadingFile(true);
      const res = await uploadAttachment(formData).unwrap();
      const uploadedDoc = res.data;
      setAttachments((prev) => [...prev, uploadedDoc]);
      toast.success(`Attached ${uploadedDoc.name}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload attachment');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      toast.error('Please specify a detailed justification reason (minimum 3 characters)');
      return;
    }

    let field = category;
    let requestedValue = {};

    if (category === 'bank_details') {
      field = 'bankDetails';
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
    } else if (category === 'address') {
      field = 'address';
      if (!street.trim() || !city.trim()) {
        toast.error('Street and City are required for address updates');
        return;
      }
      requestedValue = {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: 'Pakistan'
      };
    } else if (category === 'emergency_contact') {
      field = 'emergencyContact';
      if (!emergencyName.trim() || !emergencyPhone.trim()) {
        toast.error('Contact name and phone number are required');
        return;
      }
      requestedValue = {
        name: emergencyName.trim(),
        relationship: emergencyRel.trim(),
        phone: emergencyPhone.trim()
      };
    } else if (category === 'contact') {
      field = 'contact';
      if (!phone.trim() && !personalEmail.trim()) {
        toast.error('Please provide a contact phone number or email');
        return;
      }
      requestedValue = {
        phone: phone.trim(),
        personalEmail: personalEmail.trim()
      };
    } else if (category === 'personal') {
      field = 'personal';
      requestedValue = {
        name: fullName.trim(),
        fullName: fullName.trim(),
        gender,
        dob: dob || null,
        maritalStatus,
        bloodGroup: bloodGroup.trim()
      };
    } else if (category === 'department') {
      field = 'departmentId';
      if (!targetDepartmentId) {
        toast.error('Please select the proposed target department');
        return;
      }
      requestedValue = { departmentId: targetDepartmentId };
    } else if (category === 'designation') {
      field = 'designationId';
      if (!targetDesignationId) {
        toast.error('Please select the proposed designation');
        return;
      }
      requestedValue = { designationId: targetDesignationId };
    } else if (category === 'reporting_manager') {
      field = 'reportingManagerId';
      if (!targetManagerId) {
        toast.error('Please select the proposed reporting manager');
        return;
      }
      requestedValue = { reportingManagerId: targetManagerId };
    }

    try {
      await submitChangeRequest({
        category,
        field,
        requestedValue,
        reason: reason.trim(),
        priority,
        attachments
      }).unwrap();

      toast.success('Change request submitted for managerial review');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit change request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-[#1A3125] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Submit Profile & Organizational Change Request
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Governed HR approval workflow with automated baseline comparisons
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Top Row: Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Change Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 font-medium"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority Tier
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 font-medium"
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Dynamic Form Sections based on Category */}
          {category === 'bank_details' && (
            <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#00C471]" /> Updated Banking Coordinates
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Meezan Bank"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Account Title</label>
                  <input
                    type="text"
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    placeholder="Must match official name"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 010203040506"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">IBAN (24 Characters)</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="e.g. PK36MEZN0001020304050607"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'address' && (
            <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00C471]" /> Updated Residential Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. House # 12, Street 4, Sector F-8"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Islamabad"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">State / Province</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Federal"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'emergency_contact' && (
            <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-[#00C471]" /> Updated Emergency Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Contact Name</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Full name"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Relationship</label>
                  <input
                    type="text"
                    value={emergencyRel}
                    onChange={(e) => setEmergencyRel(e.target.value)}
                    placeholder="e.g. Spouse / Brother"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'contact' && (
            <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00C471]" /> Updated Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Primary Mobile Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Personal Email</label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="personal@gmail.com"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'personal' && (
            <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00C471]" /> Personal Information Updates
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Legal Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {category === 'department' && (
            <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#00C471]" /> Target Department Transfer
              </h4>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Proposed Department</label>
                <select
                  value={targetDepartmentId}
                  onChange={(e) => setTargetDepartmentId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                >
                  <option value="">Select target department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {category === 'designation' && (
            <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#00C471]" /> Proposed Designation / Role
              </h4>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Target Designation</label>
                <select
                  value={targetDesignationId}
                  onChange={(e) => setTargetDesignationId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                >
                  <option value="">Select target designation...</option>
                  {designations.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {category === 'reporting_manager' && (
            <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5 text-[#00C471]" /> Proposed Reporting Manager
              </h4>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Target Manager</label>
                <select
                  value={targetManagerId}
                  onChange={(e) => setTargetManagerId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white"
                >
                  <option value="">Select reporting manager...</option>
                  {employeesList
                    .filter((e) => String(e._id) !== String(currentEmployee?._id))
                    .map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Justification Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Justification & Business Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the background and necessity of this modification..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 resize-none"
            />
          </div>

          {/* Supporting Documents Uploader */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Supporting Proof & Attachments (Optional, max 5MB)
            </label>

            <div className="flex items-center gap-3">
              <label className="px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors">
                <UploadCloud className="w-4 h-4 text-[#00C471]" />
                {isUploadingFile ? 'Uploading...' : 'Choose File to Attach'}
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileUpload}
                  disabled={isUploadingFile}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">PDF, JPG, PNG, WEBP</span>
            </div>

            {/* Uploaded attachments chip list */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((att, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-emerald-800/40 text-xs font-medium"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="hover:text-rose-600 transition-colors p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submission Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingFile || !reason.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
