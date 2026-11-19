/**
 * @file CompanyForm.jsx
 * @description Company Profile Information, Logo Management & Brand Artifacts Preview (Slice 2.2 / Phase 36).
 * Strictly conforms to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useEffect } from "react";
import {
  Building2,
  Upload,
  Globe,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Trash2,
  Eye,
  CreditCard,
  Receipt,
  Sparkles,
  Edit,
  RotateCw,
  Layers,
  Sliders,
  MapPin,
  Clock,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import {
  useUploadLogoMutation,
  useDeleteLogoMutation,
  useUpdateSettingMutation,
} from "../settingsApi.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { CompanyLogoRemoveModal } from "./CompanyLogoRemoveModal.jsx";
import { CompanyProfileEditModal } from "./CompanyProfileEditModal.jsx";
import { IdCardPreviewBadge } from "./IdCardPreviewBadge.jsx";
import { IdCardConfigEditor } from "./IdCardConfigEditor.jsx";

export function CompanyForm({ initialData = {}, onSaved }) {
  const { can, isSuperAdmin } = usePermission();
  const canManage = isSuperAdmin || can("settings.manage");

  const [formData, setFormData] = useState({
    name: initialData.name || "",
    legalName: initialData.legalName || "",
    registrationNumber: initialData.registrationNumber || "",
    industry: initialData.industry || "",
    businessType: initialData.businessType || "",
    description: initialData.description || "",
    address: initialData.address || "",
    city: initialData.city || "",
    state: initialData.state || "",
    postalCode: initialData.postalCode || "",
    country: initialData.country || "Pakistan",
    phone: initialData.phone || "",
    alternatePhone: initialData.alternatePhone || "",
    email: initialData.email || "",
    website: initialData.website || "",
    ntn: initialData.ntn || "",
    strn: initialData.strn || "",
    timezone: initialData.timezone || "Asia/Karachi",
    currency: initialData.currency || "PKR",
    logoUrl: initialData.logoUrl || "",
    idCardConfig: initialData.idCardConfig || {
      layout: "vertical",
      primaryColor: "#00C471",
      theme: "forest",
      showBloodGroup: true,
      showEmergencyContact: true,
      showDepartment: true,
      showDesignation: true,
      showJoiningDate: true,
      showBarcode: true,
      qrCodeType: "verification",
      cardValidityYears: 2,
      backDisclaimer:
        "This credential card remains the property of the organization. If found, please return to Human Resources.",
    },
  });

  const [previewUrl, setPreviewUrl] = useState(initialData.logoUrl || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState("badge"); // 'badge' | 'payslip' | 'email'
  const [activeIdCardSide, setActiveIdCardSide] = useState("front"); // 'front' | 'back'
  const [showIdCardConfig, setShowIdCardConfig] = useState(false);

  // Modals state
  const [isRemoveLogoModalOpen, setIsRemoveLogoModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSettingMutation();
  const [uploadLogo, { isLoading: isUploading }] = useUploadLogoMutation();
  const [deleteLogo, { isLoading: isDeletingLogo }] = useDeleteLogoMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        legalName: initialData.legalName || "",
        registrationNumber: initialData.registrationNumber || "",
        industry: initialData.industry || "",
        businessType: initialData.businessType || "",
        description: initialData.description || "",
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        postalCode: initialData.postalCode || "",
        country: initialData.country || "Pakistan",
        phone: initialData.phone || "",
        alternatePhone: initialData.alternatePhone || "",
        email: initialData.email || "",
        website: initialData.website || "",
        ntn: initialData.ntn || "",
        strn: initialData.strn || "",
        timezone: initialData.timezone || "Asia/Karachi",
        currency: initialData.currency || "PKR",
        logoUrl: initialData.logoUrl || "",
        idCardConfig: initialData.idCardConfig || {
          layout: "vertical",
          primaryColor: "#00C471",
          theme: "forest",
          showBloodGroup: true,
          showEmergencyContact: true,
          showDepartment: true,
          showDesignation: true,
          showJoiningDate: true,
          showBarcode: true,
          qrCodeType: "verification",
          cardValidityYears: 2,
          backDisclaimer:
            "This credential card remains the property of the organization. If found, please return to Human Resources.",
        },
      });
      setPreviewUrl(initialData.logoUrl || "");
    }
  }, [initialData]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2 MB limit");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadLogoOnly = async () => {
    if (!selectedFile) return;
    try {
      const data = new FormData();
      data.append("logo", selectedFile);
      const res = await uploadLogo(data).unwrap();
      const newUrl = res.data?.logoUrl || res.data?.company?.logoUrl;
      setFormData((prev) => ({ ...prev, logoUrl: newUrl }));
      setSelectedFile(null);
      toast.success("Company logo uploaded and synced across portal");
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || "Failed to upload logo");
    }
  };

  const handleConfirmRemoveLogo = async () => {
    try {
      await deleteLogo().unwrap();
      setFormData((prev) => ({ ...prev, logoUrl: "" }));
      setPreviewUrl("");
      setSelectedFile(null);
      setIsRemoveLogoModalOpen(false);
      toast.success("Company logo removed and reset to default brandmark");
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || "Failed to remove logo");
    }
  };

  const handleSaveModalCoordinates = async (updatedFields) => {
    try {
      const payload = {
        ...formData,
        ...updatedFields,
      };
      await updateSetting({
        key: "company",
        value: payload,
        description: "Updated company legal entity profile",
      }).unwrap();

      setFormData(payload);
      setIsEditProfileModalOpen(false);
      toast.success("Corporate coordinates updated and persisted successfully");
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || "Failed to update company coordinates");
    }
  };

  const handleIdCardConfigChange = (newConfig) => {
    setFormData((prev) => ({ ...prev, idCardConfig: newConfig }));
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    try {
      let currentLogoUrl = formData.logoUrl;

      // Upload logo first if new file is staged
      if (selectedFile) {
        const fileData = new FormData();
        fileData.append("logo", selectedFile);
        const res = await uploadLogo(fileData).unwrap();
        currentLogoUrl = res.data?.logoUrl || res.data?.company?.logoUrl;
      }

      const payload = {
        ...formData,
        logoUrl: currentLogoUrl,
      };

      await updateSetting({
        key: "company",
        value: payload,
        description: "Updated company legal entity and ID card configuration",
      }).unwrap();

      setFormData(payload);
      setSelectedFile(null);
      toast.success(
        "Company profile & ID card configuration saved successfully",
      );
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || "Failed to save settings");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Logo & Primary Corporate Action Header */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          {/* Logo Showcase Box */}
          <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 dark:border-[#1A3125] p-1 bg-slate-50 dark:bg-[#0A110D] flex items-center justify-center shrink-0 relative overflow-hidden shadow-xs">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={formData.name || "Company Logo"}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <Building2 className="w-8 h-8 text-[#00C471]" />
            )}
            {selectedFile && (
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </div>

          {/* Corporate Title & Quick Identity */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                {formData.name || "Company Profile"}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-[#00C471] font-bold border border-emerald-200/80 dark:border-emerald-800/60 shrink-0">
                NTN: {formData.ntn || "7284910-3"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {formData.legalName ||
                formData.industry ||
                "Enterprise HRM Platform & Corporate Identity"}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {formData.city
                  ? `${formData.city}, ${formData.country}`
                  : formData.address || "Islamabad, Pakistan"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {formData.website || "https://company.pk"}
              </span>
            </div>
          </div>
        </div>

        {/* Logo Operations & Edit Action Controls */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <input
              type="file"
              id="logo-upload"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading || isSaving}
            />

            <label
              htmlFor="logo-upload"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{selectedFile ? "Change Staged Logo" : "Upload Logo"}</span>
            </label>

            {selectedFile && (
              <button
                type="button"
                onClick={handleUploadLogoOnly}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00C471] hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Logo</span>
              </button>
            )}

            {formData.logoUrl && (
              <button
                type="button"
                onClick={() => setIsRemoveLogoModalOpen(true)}
                disabled={isDeletingLogo}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 cursor-pointer transition-colors"
                title="Remove company logo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remove</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 text-xs font-bold cursor-pointer hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Coordinates</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Corporate Overview Deck + Live Brand Artifacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Structured Corporate Coordinates Deck */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00C471]" />
                Corporate Master Details
              </h3>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="text-xs font-semibold text-[#00C471] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Legal Name
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formData.legalName || formData.name || "—"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    NTN
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {formData.ntn || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    STRN
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {formData.strn || "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Official Phone
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {formData.phone || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Corporate Email
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">
                    {formData.email || "—"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Address
                </span>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed block">
                  {formData.address || "—"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Timezone
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.timezone} (PKT)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Currency
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formData.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00C471]" />
              Single Source of Truth
            </span>
            <p className="text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed text-[11px]">
              Corporate name, registered address, and brand logo saved here
              automatically propagate across portal navigation, PDF payslips,
              candidate offer letters, and employee credential cards.
            </p>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Brand Artifacts Studio */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl p-6 shadow-xs space-y-5">
            {/* Artifact Selector Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1A3125] pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00C471]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Live Brand Artifacts Studio
                </h3>
              </div>

              {/* Artifact Selector Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0A110D] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("badge")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === "badge"
                      ? "bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Employee ID Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("payslip")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === "payslip"
                      ? "bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Payslip Header</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("email")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === "email"
                      ? "bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Header</span>
                </button>
              </div>
            </div>

            {/* TAB 1: EMPLOYEE ID CARD STUDIO */}
            {activePreviewTab === "badge" && (
              <div className="space-y-4">
                {/* ID Card Front/Back & Design Controls Switcher */}
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0A110D]">
                    <button
                      type="button"
                      onClick={() => setActiveIdCardSide("front")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeIdCardSide === "front"
                          ? "bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      }`}
                    >
                      Front Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveIdCardSide("back")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeIdCardSide === "back"
                          ? "bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      }`}
                    >
                      Back Side
                    </button>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setShowIdCardConfig(!showIdCardConfig)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                        showIdCardConfig
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-[#00C471]"
                          : "bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>
                        {showIdCardConfig
                          ? "Hide Customizer"
                          : "Customize ID Card"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Optional Design Customizer Drawer */}
                {showIdCardConfig && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1A3125]">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#00C471]" />
                        ID Card Specification Studio
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ISO/IEC 7810 ID-1 Standard
                      </span>
                    </div>

                    <IdCardConfigEditor
                      config={formData.idCardConfig}
                      onChange={handleIdCardConfigChange}
                      disabled={!canManage}
                    />
                  </div>
                )}

                {/* Centered CR80 Badge Sandbox */}
                <div className="p-8 rounded-2xl bg-slate-100/70 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] flex items-center justify-center min-h-[340px]">
                  <IdCardPreviewBadge
                    employee={{
                      name: "Muhammad Hamza",
                      employeeCode: "EMP-1049",
                      department: "Information Technology",
                      designation: "Lead Systems Architect",
                      bloodGroup: "O+",
                      avatar: "",
                      phone: formData.phone,
                    }}
                    company={{
                      name: formData.name,
                      address: formData.address,
                      phone: formData.phone,
                      website: formData.website,
                      logoUrl: previewUrl,
                    }}
                    config={formData.idCardConfig}
                    activeSide={activeIdCardSide}
                  />
                </div>

                <p className="text-[11px] text-slate-400 italic text-center">
                  * Physical card generated in the Employee Module adheres to
                  standard CR80 physical dimensions (85.6mm × 53.98mm).
                </p>
              </div>
            )}

            {/* TAB 2: PAYSLIP HEADER */}
            {activePreviewTab === "payslip" && (
              <div className="border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 bg-slate-50/50 dark:bg-[#0A110D] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A3125] pb-3">
                  <div className="flex items-center gap-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Logo"
                        className="w-10 h-10 object-contain rounded-lg bg-white p-0.5 border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#00C471] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {formData.name.slice(0, 2).toUpperCase() || "HR"}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {formData.name || "Company Name"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formData.address || "Corporate Headquarters"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-[#00C471] bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      Salary Advice Slip
                    </span>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">
                      NTN: {formData.ntn || "—"}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  * This preview reflects the formal header printed on employee
                  PDF payslips generated under Module M9 Payroll.
                </p>
              </div>
            )}

            {/* TAB 3: EMAIL NOTIFICATION */}
            {activePreviewTab === "email" && (
              <div className="border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 bg-slate-50/50 dark:bg-[#0A110D] space-y-3">
                <div className="bg-[#061A14] text-white p-4 rounded-xl flex items-center justify-between border border-[#0B261D]">
                  <div className="flex items-center gap-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Logo"
                        className="w-8 h-8 object-contain rounded bg-white p-0.5"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-[#00C471]" />
                    )}
                    <span className="text-sm font-bold tracking-tight">
                      {formData.name || "Company Name"}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Notification Dispatch
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl space-y-2">
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Dear Team Member, your monthly payslip for October 2026 is
                    now available for review.
                  </p>
                  <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-[#1A3125] pt-2 flex items-center justify-between">
                    <span>{formData.email}</span>
                    <span>{formData.website}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Master Bottom Save Button Bar */}
          {canManage && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving || isUploading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSaving
                  ? "Saving Changes..."
                  : "Save Company Profile & ID Card"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Logo Removal */}
      <CompanyLogoRemoveModal
        isOpen={isRemoveLogoModalOpen}
        onClose={() => setIsRemoveLogoModalOpen(false)}
        onConfirm={handleConfirmRemoveLogo}
        isLoading={isDeletingLogo}
        currentLogoUrl={formData.logoUrl}
        companyName={formData.name}
      />

      {/* Categorized 5-Section Modal for Text Coordinates Editing */}
      <CompanyProfileEditModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        initialData={formData}
        onSave={handleSaveModalCoordinates}
        isLoading={isSaving}
      />
    </div>
  );
}
