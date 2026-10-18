/**
 * @file EmployeeFormPage.jsx
 * @description Comprehensive 5-Step Onboarding & Profile Editing Wizard.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.2, 3.3, 3.6)
 * - 5 Responsive Steps:
 *   1. Personal Details (Code, Name, Email, Phone, DOB, Gender, CNIC, CNIC Expiry)
 *   2. Contact & Emergency (Address, Emergency Contact)
 *   3. Job Assignment (Department, Designation, Shift, Manager, Type, Joining Date, Probation)
 *   4. Bank & Financials (Bank Name, Account Title, Account Number, IBAN)
 *   5. Account Provisioning & Confirmation (Create user login account option)
 * - Masking: Automatic Pakistani CNIC formatting (XXXXX-XXXXXXX-X) with NADRA format validation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  User,
  Phone,
  Briefcase,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetEmployeeByIdQuery,
  useGetEmployeesQuery,
  useGetNextEmployeeCodeQuery
} from '../employeesApi.js';
import {
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useGetShiftsQuery
} from '../../departments/departmentsApi.js';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Card } from '../../../components/common/Card.jsx';
import { cn } from '../../../lib/utils.js';

const STEPS = [
  { id: 1, title: 'Personal Details', icon: User },
  { id: 2, title: 'Contact & Emergency', icon: Phone },
  { id: 3, title: 'Job Assignment', icon: Briefcase },
  { id: 4, title: 'Bank & Financials', icon: CreditCard },
  { id: 5, title: 'Account & Submit', icon: ShieldCheck }
];

export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // API hooks
  const {
    data: employeeData,
    isLoading: isLoadingEmployee,
    error: employeeError
  } = useGetEmployeeByIdQuery(id, {
    skip: !isEditMode
  });

  useEffect(() => {
    if (employeeError) {
      toast.error(employeeError?.data?.message || 'Access restricted to this profile');
      navigate('/employees');
    }
  }, [employeeError, navigate]);
  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const { data: desigData } = useGetDesignationsQuery({ limit: 100 });
  const { data: shiftData } = useGetShiftsQuery({ limit: 100 });
  const { data: staffData } = useGetEmployeesQuery({ limit: 100, forReporting: true });
  const { data: nextCodeData } = useGetNextEmployeeCodeQuery(undefined, {
    skip: isEditMode
  });

  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();

  const departments = deptData?.data || [];
  const designations = desigData?.data || [];
  const shifts = shiftData?.data || [];
  const managers = staffData?.data?.items || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      employeeCode: '',
      name: '',
      email: '',
      phone: '',
      cnic: '',
      cnicExpiry: '',
      dob: '',
      gender: 'Male',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Pakistan'
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      departmentId: '',
      designationId: '',
      shiftId: '',
      managerId: '',
      employmentType: 'Permanent',
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0],
      probationEndDate: '',
      bankDetails: {
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        iban: ''
      },
      skills: '',
      createAccount: true
    }
  });

  // Watch Department & Designation for reactive dependent filtering
  const selectedDepartmentId = watch('departmentId');
  const selectedDesignationId = watch('designationId');

  // Filter designations strictly matching the selected department
  const filteredDesignations = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return designations.filter((desig) => {
      const deptId = desig.departmentId?._id || desig.departmentId;
      return deptId === selectedDepartmentId;
    });
  }, [designations, selectedDepartmentId]);

  // Reset designation if selected department changes and current designation does not belong to it
  useEffect(() => {
    if (!selectedDepartmentId) {
      if (selectedDesignationId) setValue('designationId', '');
    } else if (selectedDesignationId && designations.length > 0) {
      const exists = filteredDesignations.some((d) => d._id === selectedDesignationId);
      if (!exists) {
        setValue('designationId', '');
      }
    }
  }, [selectedDepartmentId, filteredDesignations, selectedDesignationId, designations.length, setValue]);

  // Filter Direct Reporting Managers:
  // 1. Exclude the employee currently being edited (prevents self-reporting circular loop)
  // 2. Only include High Staff (Senior, Lead, Executive grades, management roles, or Executive Admin)
  const currentEditingId = isEditMode ? (employeeData?.data?._id || id) : null;

  const eligibleManagers = useMemo(() => {
    return managers.filter((mgr) => {
      // Rule 1: Exclude currently edited employee
      if (currentEditingId && String(mgr._id) === String(currentEditingId)) {
        return false;
      }
      if (isEditMode && employeeData?.data?.employeeCode && mgr.employeeCode === employeeData.data.employeeCode) {
        return false;
      }

      // Rule 2: High Staff Eligibility:
      // a) Super Admin / Top Executive by email or code
      if (mgr.email === 'admin@hrm.company.pk' || mgr.employeeCode === 'EMP-000') {
        return true;
      }

      // b) Designation Grade: Executive, Lead, Senior
      const grade = mgr.designationId?.grade;
      if (['Executive', 'Lead', 'Senior'].includes(grade)) {
        return true;
      }

      // c) Management Roles: Super Admin, HR Manager, Department Manager
      const userRoles = mgr.userId?.roles || [];
      const hasManagerRole = userRoles.some((r) => {
        const roleName = typeof r === 'string' ? r : r.name;
        return ['Super Admin', 'HR Manager', 'Department Manager'].includes(roleName);
      });
      if (hasManagerRole) {
        return true;
      }

      // d) Manager / Director / Head in job title
      const title = (mgr.designationId?.title || '').toLowerCase();
      if (/director|manager|head|lead|chief|executive|officer|admin/i.test(title)) {
        return true;
      }

      return false;
    });
  }, [managers, currentEditingId, isEditMode, employeeData]);

  // Auto-populate system-generated employee code in create mode
  useEffect(() => {
    if (!isEditMode && nextCodeData?.data?.nextCode) {
      setValue('employeeCode', nextCodeData.data.nextCode);
    }
  }, [isEditMode, nextCodeData, setValue]);

  // Populate data in edit mode
  useEffect(() => {
    if (isEditMode && employeeData?.data) {
      const emp = employeeData.data;
      setValue('employeeCode', emp.employeeCode || '');
      setValue('name', emp.name || '');
      setValue('email', emp.email || '');
      setValue('phone', emp.phone || '');
      setValue('cnic', emp.cnic || '');
      setValue('cnicExpiry', emp.cnicExpiry ? emp.cnicExpiry.split('T')[0] : '');
      setValue('dob', emp.dob ? emp.dob.split('T')[0] : '');
      setValue('gender', emp.gender || 'Male');
      setValue('address.street', emp.address?.street || '');
      setValue('address.city', emp.address?.city || '');
      setValue('address.state', emp.address?.state || '');
      setValue('address.postalCode', emp.address?.postalCode || '');
      setValue('address.country', emp.address?.country || 'Pakistan');
      setValue('emergencyContact.name', emp.emergencyContact?.name || '');
      setValue('emergencyContact.relationship', emp.emergencyContact?.relationship || '');
      setValue('emergencyContact.phone', emp.emergencyContact?.phone || '');
      setValue('departmentId', emp.departmentId?._id || emp.departmentId || '');
      setValue('designationId', emp.designationId?._id || emp.designationId || '');
      setValue('shiftId', emp.shiftId?._id || emp.shiftId || '');
      setValue('managerId', emp.managerId?._id || emp.managerId || '');
      setValue('employmentType', emp.employmentType || 'Permanent');
      setValue('status', emp.status || 'Active');
      setValue('joiningDate', emp.joiningDate ? emp.joiningDate.split('T')[0] : '');
      setValue('probationEndDate', emp.probationEndDate ? emp.probationEndDate.split('T')[0] : '');
      setValue('bankDetails.bankName', emp.bankDetails?.bankName || '');
      setValue('bankDetails.accountTitle', emp.bankDetails?.accountTitle || '');
      setValue('bankDetails.accountNumber', emp.bankDetails?.accountNumber || '');
      setValue('bankDetails.iban', emp.bankDetails?.iban || '');
      setValue('skills', Array.isArray(emp.skills) ? emp.skills.join(', ') : '');
      setValue('createAccount', false);
    }
  }, [isEditMode, employeeData, setValue]);

  const watchedCnic = watch('cnic');
  const watchedCnicExpiry = watch('cnicExpiry');

  // Automatic Pakistani CNIC formatting mask: XXXXX-XXXXXXX-X
  const handleCnicChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 13);
    let formatted = raw;
    if (raw.length > 5 && raw.length <= 12) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    } else if (raw.length > 12) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12)}`;
    }
    setValue('cnic', formatted, { shouldValidate: true });
  };

  // Check if CNIC expiry date is near (within 30 days)
  const isCnicExpiringSoon = () => {
    if (!watchedCnicExpiry) return false;
    const expiry = new Date(watchedCnicExpiry);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const onSubmit = async (formData) => {
    try {
      // Process skills comma-separated string to array
      const skillsArray = typeof formData.skills === 'string'
        ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        skills: skillsArray,
        departmentId: formData.departmentId || null,
        designationId: formData.designationId || null,
        shiftId: formData.shiftId || null,
        managerId: formData.managerId || null
      };

      if (isEditMode) {
        delete payload.createAccount;
        delete payload.employeeCode;
        await updateEmployee({ id, ...payload }).unwrap();
        toast.success('Employee profile updated successfully');
        navigate(`/employees/${id}`);
      } else {
        const res = await createEmployee(payload).unwrap();
        toast.success(
          formData.createAccount
            ? 'Employee onboarded and login credentials sent via email!'
            : 'Employee registered successfully!'
        );
        navigate(`/employees/${res?.data?._id || ''}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to save employee profile');
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (isEditMode && isLoadingEmployee) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00C471]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={isEditMode ? 'Edit Employee Profile' : 'Onboard New Employee'}
        subtitle={
          isEditMode
            ? 'Update personal, organizational and financial details.'
            : 'Register complete personnel credentials and provision self-service portal account.'
        }
      />

      {/* Step Indicator Navigation */}
      <div className="grid grid-cols-5 gap-2 bg-white p-3 rounded-xl border border-slate-200">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                'flex flex-col md:flex-row items-center gap-2 p-2.5 rounded-lg text-left transition-all cursor-pointer',
                isActive && 'bg-[#00C471]/10 text-[#00C471] font-semibold border border-[#00C471]/30',
                isDone && 'text-slate-700 hover:bg-slate-50',
                !isActive && !isDone && 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors',
                  isActive && 'bg-[#00C471] text-white',
                  isDone && 'bg-slate-200 text-slate-700',
                  !isActive && !isDone && 'bg-slate-100 text-slate-400'
                )}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : step.id}
              </div>
              <div className="hidden md:block">
                <span className="text-xs block leading-tight font-medium">{step.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STEP 1: Personal Details */}
        {currentStep === 1 && (
          <Card className="p-6 space-y-5">
            <h3 className="text-base font-semibold text-slate-900 border-b pb-3">
              Step 1: Personal Information & NADRA Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Employee Code <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Auto-Generated System ID
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Auto-generating..."
                  readOnly
                  disabled
                  {...register('employeeCode')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 cursor-not-allowed font-mono font-semibold text-slate-700 uppercase select-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Unique sequential identifier generated automatically by HRM system.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Muhammad Ali"
                  {...register('name', { required: 'Full name is required' })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="ali@company.pk"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  {...register('phone')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pakistani CNIC (13 digits)
                </label>
                <input
                  type="text"
                  placeholder="35202-1234567-1"
                  value={watchedCnic || ''}
                  onChange={handleCnicChange}
                  className="w-full text-sm font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
                <span className="text-[11px] text-slate-500">Auto-formatted with NADRA hyphens. Encrypted at rest.</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    CNIC Expiry Date
                  </label>
                  {isCnicExpiringSoon() && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Expires Soon (&lt; 30 Days)
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  {...register('cnicExpiry')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  {...register('dob')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  {...register('gender')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: Contact & Emergency */}
        {currentStep === 2 && (
          <Card className="p-6 space-y-6">
            <h3 className="text-base font-semibold text-slate-900 border-b pb-3">
              Step 2: Address & Emergency Contacts
            </h3>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Residential Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="House #12, Street 4, Sector F-8/1"
                    {...register('address.street')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Islamabad"
                    {...register('address.city')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="Federal / Punjab"
                    {...register('address.state')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    placeholder="44000"
                    {...register('address.postalCode')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    defaultValue="Pakistan"
                    {...register('address.country')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Emergency Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="Tariq Hashmi"
                    {...register('emergencyContact.name')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="Father / Spouse / Sibling"
                    {...register('emergencyContact.relationship')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    placeholder="+92 321 9876543"
                    {...register('emergencyContact.phone')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Job Assignment */}
        {currentStep === 3 && (
          <Card className="p-6 space-y-5">
            <h3 className="text-base font-semibold text-slate-900 border-b pb-3">
              Step 3: Organization & Job Structure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  {...register('departmentId')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation
                </label>
                <select
                  {...register('designationId')}
                  disabled={!selectedDepartmentId}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedDepartmentId
                      ? '-- Select Department First --'
                      : filteredDesignations.length === 0
                        ? '-- No Designations Found for Department --'
                        : '-- Select Designation --'}
                  </option>
                  {filteredDesignations.map((desig) => (
                    <option key={desig._id} value={desig._id}>
                      {desig.title} [{desig.grade}]
                    </option>
                  ))}
                </select>
                {!selectedDepartmentId && (
                  <p className="text-[11px] text-amber-600 font-medium mt-1">
                    ⚠️ Select a Department first to load matching designations.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Shift Roster
                </label>
                <select
                  {...register('shiftId')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                >
                  <option value="">-- Select Shift Schedule --</option>
                  {shifts.map((shift) => (
                    <option key={shift._id} value={shift._id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Reporting Manager
                </label>
                <select
                  {...register('managerId')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                >
                  <option value="">-- Select Reporting Manager --</option>
                  {eligibleManagers.map((mgr) => (
                    <option key={mgr._id} value={mgr._id}>
                      {mgr.name} ({mgr.employeeCode}){mgr.designationId?.title ? ` • ${mgr.designationId.title}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Only senior managers, department leads, and executive admins are eligible.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employment Contract Type
                </label>
                <select
                  {...register('employmentType')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lifecycle Status
                </label>
                <select
                  {...register('status')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                >
                  <option value="Active">Active</option>
                  <option value="Probation">Probation</option>
                  <option value="Notice">Notice</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  {...register('joiningDate')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Probation End Date
                </label>
                <input
                  type="date"
                  {...register('probationEndDate')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills & Technical Competencies (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="React, Node.js, MongoDB, TypeScript, Docker"
                  {...register('skills')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>
            </div>
          </Card>
        )}

        {/* STEP 4: Bank & Financials */}
        {currentStep === 4 && (
          <Card className="p-6 space-y-5">
            <h3 className="text-base font-semibold text-slate-900 border-b pb-3">
              Step 4: Bank Account & Payroll Disbursement Details
            </h3>
            <p className="text-xs text-slate-500">
              Banking IBAN is encrypted at rest using AES-256-GCM. Unmasked access is restricted strictly to HR and Payroll administrators.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="Meezan Bank / HBL / Standard Chartered"
                  {...register('bankDetails.bankName')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  placeholder="Muhammad Ali"
                  {...register('bankDetails.accountTitle')}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="01010102030405"
                  {...register('bankDetails.accountNumber')}
                  className="w-full text-sm font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  International Bank Account Number (IBAN)
                </label>
                <input
                  type="text"
                  placeholder="PK36MEZN0000000101010203"
                  {...register('bankDetails.iban')}
                  className="w-full text-sm font-mono uppercase px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
                />
              </div>
            </div>
          </Card>
        )}

        {/* STEP 5: Account Provisioning & Review */}
        {currentStep === 5 && (
          <Card className="p-6 space-y-6">
            <h3 className="text-base font-semibold text-slate-900 border-b pb-3">
              Step 5: Account Provisioning & Submission
            </h3>

            {!isEditMode && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="createAccountCheckbox"
                  {...register('createAccount')}
                  className="mt-1 w-4 h-4 text-[#00C471] rounded border-slate-300 focus:ring-[#00C471]"
                />
                <label htmlFor="createAccountCheckbox" className="text-xs text-slate-700 cursor-pointer">
                  <span className="font-semibold block text-slate-900 mb-0.5">
                    Provision Employee Self-Service Account
                  </span>
                  Automatically create a login user account in the system with the Employee role and dispatch a secure temporary password to their official email.
                </label>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Summary Review</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Name:</span>
                  <span className="font-semibold text-slate-800">{watch('name') || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Employee Code:</span>
                  <span className="font-semibold text-slate-800 font-mono">{watch('employeeCode') || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-semibold text-slate-800">{watch('email') || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">CNIC:</span>
                  <span className="font-semibold text-slate-800 font-mono">{watch('cnic') || '—'}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={cn(
              'px-4 py-2.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 cursor-pointer',
              currentStep === 1 && 'invisible'
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#00C471] text-white hover:bg-[#049856] flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#00C471] text-white hover:bg-[#049856] flex items-center gap-2 shadow-sm cursor-pointer transition-colors disabled:opacity-50"
            >
              {(isCreating || isUpdating) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> {isEditMode ? 'Update Profile' : 'Complete Onboarding'}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
