/**
 * @file CompanyProfileEditModal.jsx
 * @description Enterprise 5-Section Modal for Corporate Profile Coordinates & Statutory Data (Phase 36 / Plan 36-02).
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  Globe,
  FileText,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

export function CompanyProfileEditModal({
  isOpen,
  onClose,
  initialData = {},
  onSave,
  isLoading
}) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'contact' | 'statutory' | 'address' | 'localization'
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    registrationNumber: '',
    industry: '',
    businessType: '',
    description: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    ntn: '',
    strn: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    timezone: 'Asia/Karachi',
    currency: 'PKR'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        legalName: initialData.legalName || '',
        registrationNumber: initialData.registrationNumber || '',
        industry: initialData.industry || '',
        businessType: initialData.businessType || '',
        description: initialData.description || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        alternatePhone: initialData.alternatePhone || '',
        website: initialData.website || '',
        ntn: initialData.ntn || '',
        strn: initialData.strn || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postalCode: initialData.postalCode || '',
        country: initialData.country || 'Pakistan',
        timezone: initialData.timezone || 'Asia/Karachi',
        currency: initialData.currency || 'PKR'
      });
      setErrors({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Company Name must be at least 2 characters';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errs.email = 'Valid corporate email address is required';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      errs.phone = 'Valid phone number is required (min 8 chars)';
    }
    if (!formData.ntn.trim() || formData.ntn.trim().length < 5) {
      errs.ntn = 'Valid National Tax Number (NTN) is required';
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errs.address = 'Registered physical address must be at least 5 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve flagged fields before saving.');
      return;
    }
    onSave(formData);
  };

  const tabs = [
    { id: 'general', label: 'General Identity', icon: Building2 },
    { id: 'contact', label: 'Contact & Web', icon: Phone },
    { id: 'statutory', label: 'Tax & Registration', icon: Hash },
    { id: 'address', label: 'Headquarters Address', icon: MapPin },
    { id: 'localization', label: 'Regional Localization', icon: Clock }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] flex items-center justify-center font-bold border border-emerald-200/80 dark:border-emerald-800/60">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Corporate Profile Coordinates
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary corporate coordinates, statutory tax numbers & physical offices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Sub-Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-100 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs font-semibold overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'border-[#00C471] text-[#00C471]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body: Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* TAB 1: General Identity */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Operating Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Starlight Software Ltd"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] ${
                    errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-[#1A3125]'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Legal / Registered Corporate Name
                  </label>
                  <input
                    type="text"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    placeholder="e.g. Starlight Software (Private) Limited"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="e.g. Information Technology & Cloud Software"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Business Entity Type
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  >
                    <option value="">Select Entity Type</option>
                    <option value="Private Limited Company">Private Limited Company (Pvt Ltd)</option>
                    <option value="Public Listed Company">Public Listed Company</option>
                    <option value="Partnership / AOP">Partnership / Association of Persons</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Non-Profit / NGO">Non-Profit Organization / NGO</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    SECP / Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. SECP-0098412"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Corporate Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief summary of corporate mission, services, and workforce operations..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Contact & Web */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Official Corporate Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="hr@company.pk"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] ${
                      errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-[#1A3125]'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Primary Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+92 51 1234567"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] ${
                        errors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-[#1A3125]'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] text-rose-500">{errors.phone}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Alternate / Support Line
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                      placeholder="+92 51 7654321"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Corporate Website URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://company.pk"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Tax & Registration */}
          {activeTab === 'statutory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    National Tax Number (NTN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ntn"
                    value={formData.ntn}
                    onChange={handleChange}
                    placeholder="7284910-3"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] ${
                      errors.ntn ? 'border-rose-500' : 'border-slate-200 dark:border-[#1A3125]'
                    }`}
                  />
                  {errors.ntn && <p className="text-[11px] text-rose-500">{errors.ntn}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Sales Tax Registration (STRN)
                  </label>
                  <input
                    type="text"
                    name="strn"
                    value={formData.strn}
                    onChange={handleChange}
                    placeholder="1234567890123"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00C471]" />
                  FBR Salaried Tax Notice
                </p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  The NTN recorded here is automatically embedded into annual Form IT-3 withholding tax certificates and monthly salary advice sheets generated under Module M9.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Headquarters Address */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Street Address / Plot Coordinates <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Plot 14, Sector I-9/3, Industrial Area"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] ${
                    errors.address ? 'border-rose-500' : 'border-slate-200 dark:border-[#1A3125]'
                  }`}
                />
                {errors.address && <p className="text-[11px] text-rose-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Islamabad"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Federal Capital"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="44000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Pakistan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Regional Localization */}
          {activeTab === 'localization' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    System Timezone
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  >
                    <option value="Asia/Karachi">Asia/Karachi (PKT UTC+5)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST UTC+4)</option>
                    <option value="Europe/London">Europe/London (GMT UTC+0)</option>
                    <option value="America/New_York">America/New_York (EST UTC-5)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Operating Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00C471] hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Coordinates</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
