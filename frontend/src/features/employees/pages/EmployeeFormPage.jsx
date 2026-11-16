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
 * - Theme: Forest & Emerald Enterprise Craft.
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
  Loader2,
  Copy,
  Check
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
import { useGetRolesQuery } from '../../roles/rolesApi.js';
import { RoleSelect } from '../components/RoleSelect.jsx';
import { ManagerSelect } from '../components/ManagerSelect.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Card } from '../../../components/common/Card.jsx';
import { cn } from '../../../lib/utils.js';

const STEPS = [
  { id: 1, title: 'Personal Details', icon: User },
  { id: 2, title: 'Contact & Emergency', icon: Phone },
  { id: 3, title: 'Job Assignment', icon: Briefcase },
  { id: 4, title: 'Bank & Financials', icon: CreditCard },
  { id: 5, title: 'Account & Review', icon: ShieldCheck }
];

export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [createdAccountModal, setCreatedAccountModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [currentTimestamp] = useState(() => Date.now());

  // API hooks
  const {
    data: employeeData,
    isLoading: isLoadingEmployee,
    error: employeeError
  } = useGetEmployeeByIdQuery(id, {
    skip: !isEditMode
  });

  const isSuperAdminProfile =
    isEditMode &&
    (employeeData?.data?.employeeCode === 'EMP-000' ||
      employeeData?.data?.email === 'mhamzaofficial159@gmail.com' ||
      employeeData?.data?.email === 'admin@hrm.company.pk');

  const steps = isSuperAdminProfile
    ? [
        { id: 1, title: 'Personal Details', icon: User },
        { id: 2, title: 'Contact & Emergency', icon: Phone },
        { id: 3, title: 'Corporate Banking', icon: CreditCard }
      ]
    : STEPS;

  const totalSteps = steps.length;

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
  const { data: rolesData } = useGetRolesQuery({ limit: 100 });
  const { data: nextCodeData } = useGetNextEmployeeCodeQuery(undefined, {
    skip: isEditMode
  });

  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();

  const departments = deptData?.data || [];
  const rawDesignations = desigData?.data || [];
  const shifts = shiftData?.data || [];
  const roles = useMemo(() => {
    const list = Array.isArray(rolesData?.data?.roles)
      ? rolesData.data.roles
      : Array.isArray(rolesData?.data)
      ? rolesData.data
      : [];
    return list.filter((r) => r?.name && r.name !== 'Super Admin');
  }, [rolesData?.data]);

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
      createAccount: true,
      roleId: ''
    }
  });

  // Watch fields for reactive dependent filtering
  const watchedRoleId = watch('roleId');
  const selectedDepartmentId = watch('departmentId');
  const selectedDesignationId = watch('designationId');
  const watchedCnic = watch('cnic');
  const watchedCnicExpiry = watch('cnicExpiry');
  const watchedCreateAccount = watch('createAccount');
  const watchedName = watch('name');
  const watchedEmail = watch('email');
  const watchedEmployeeCode = watch('employeeCode');
  const watchedManagerId = watch('managerId');

  // Default roleId to 'Employee' role if not set
  useEffect(() => {
    if (!watchedRoleId && roles.length > 0) {
      const defaultRole = roles.find((r) => r.name === 'Employee') || roles[0];
      if (defaultRole) {
        setValue('roleId', defaultRole._id);
      }
    }
  }, [roles, watchedRoleId, setValue]);

  // Filter designations strictly matching the selected department
  const filteredDesignations = useMemo(() => {
    const list = desigData?.data || [];
    if (!selectedDepartmentId) return [];
    return list.filter((desig) => {
      const deptId = desig.departmentId?._id || desig.departmentId;
      return deptId === selectedDepartmentId;
    });
  }, [desigData?.data, selectedDepartmentId]);

  // Reset designation if selected department changes and current designation does not belong to it
  useEffect(() => {
    if (!selectedDepartmentId) {
      if (selectedDesignationId) setValue('designationId', '');
    } else if (selectedDesignationId && rawDesignations.length > 0) {
      const exists = filteredDesignations.some((d) => d._id === selectedDesignationId);
      if (!exists) {
        setValue('designationId', '');
      }
    }
  }, [selectedDepartmentId, filteredDesignations, selectedDesignationId, rawDesignations.length, setValue]);

  // Filter Direct Reporting Managers:
  // 1. Exclude the employee currently being edited (prevents self-reporting circular loop)
  // 2. Restrict strictly to Higher Authority personnel: Super Admin, HR Manager, Department Manager, or Executive Directors
  const currentEditingId = isEditMode ? (employeeData?.data?._id || id) : null;

  const eligibleManagers = useMemo(() => {
    const rawStaff = staffData?.data?.items || [];
    return rawStaff.filter((mgr) => {
      // Rule 1: Exclude currently edited employee
      if (currentEditingId && String(mgr._id) === String(currentEditingId)) {
        return false;
      }
      if (isEditMode && employeeData?.data?.employeeCode && mgr.employeeCode === employeeData.data.employeeCode) {
        return false;
      }

      // Rule 2: Super Admin by employeeCode or root email
      if (
        mgr.employeeCode === 'EMP-000' ||
        mgr.email === 'mhamzaofficial159@gmail.com' ||
        mgr.email === 'admin@hrm.company.pk'
      ) {
        return true;
      }

      // Rule 3: Check system user role authorization (Super Admin, HR Manager, Department Manager)
      const userRoles = mgr.userId?.roles || [];
      const hasMgmtRole = userRoles.some((r) => {
        const roleName = typeof r === 'string' ? r : r?.name;
        return ['Super Admin', 'HR Manager', 'Department Manager'].includes(roleName);
      });
      if (hasMgmtRole) {
        return true;
      }

      // Rule 4: Executive / Managerial title check, strictly excluding standard software engineering/development staff
      const title = (mgr.designationId?.title || '').toLowerCase();
      const isStaffOrEngineer = /engineer|developer|intern|junior|officer|assistant|clerk|tester|qa|analyst/i.test(title);
      if (!isStaffOrEngineer && /\b(director|manager|head of|chief|ceo|cto|cfo|executive director)\b/i.test(title)) {
        return true;
      }

      return false;
    });
  }, [staffData?.data?.items, currentEditingId, isEditMode, employeeData]);

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
      if (emp.userId?.roles?.[0]) {
        const uRole = emp.userId.roles[0];
        const roleIdVal = typeof uRole === 'object' ? uRole._id : uRole;
        setValue('roleId', roleIdVal);
      }
    }
  }, [isEditMode, employeeData, setValue]);

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
  const isCnicExpiringSoon = useMemo(() => {
    if (!watchedCnicExpiry) return false;
    const expiry = new Date(watchedCnicExpiry).getTime();
    const diffDays = Math.ceil((expiry - currentTimestamp) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }, [watchedCnicExpiry, currentTimestamp]);

  const onSubmit = async (formData) => {
    try {
      const skillsArray = typeof formData.skills === 'string'
        ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        skills: skillsArray,
        departmentId: formData.departmentId || null,
        designationId: formData.designationId || null,
        shiftId: formData.shiftId || null,
        managerId: formData.managerId || null,
        roleId: formData.roleId || null
      };

      if (isEditMode) {
        delete payload.createAccount;
        delete payload.employeeCode;

        if (isSuperAdminProfile) {
          delete payload.managerId;
          delete payload.shiftId;
          delete payload.departmentId;
          delete payload.designationId;
          delete payload.probationEndDate;
          await updateEmployee({ id, ...payload }).unwrap();
          toast.success('Executive profile updated successfully');
          navigate('/me');
          return;
        }

        await updateEmployee({ id, ...payload }).unwrap();
        toast.success('Employee profile updated successfully');
        navigate(`/employees/${id}`);
      } else {
        const res = await createEmployee(payload).unwrap();
        if (formData.createAccount && res?.data?.tempPassword) {
          setCreatedAccountModal({
            name: formData.name,
            email: formData.email,
            tempPassword: res.data.tempPassword,
            employeeId: res?.data?._id || ''
          });
        } else {
          toast.success(
            formData.createAccount
              ? 'Employee onboarded and login credentials sent via email!'
              : 'Employee registered successfully!'
          );
          navigate(`/employees/${res?.data?._id || ''}`);
        }
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to save employee profile');
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (isEditMode && isLoadingEmployee) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#00C471]" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Loading employee profile records...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title={
          isSuperAdminProfile
            ? 'Edit Executive Profile'
            : isEditMode
            ? `Edit Profile: ${employeeData?.data?.name || 'Employee'}`
            : 'Onboard New Employee'
        }
        description={
          isSuperAdminProfile
            ? 'Update root executive personal credentials and official contact points.'
            : isEditMode
            ? 'Update personal, organizational and financial details.'
            : 'Register complete personnel credentials and provision self-service portal account.'
        }
      />

      {/* Step Indicator Navigation */}
      <div
        className={cn(
          'grid gap-2 bg-white dark:bg-[#111D17] p-3 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs',
          isSuperAdminProfile ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-5'
        )}
      >
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentStep(step.id);
              }}
              className={cn(
                'flex flex-col md:flex-row items-center gap-2 p-2.5 rounded-xl text-left transition-all cursor-pointer',
                isActive && 'bg-[#00C471]/10 text-[#00C471] dark:bg-[#00C471]/15 font-semibold border border-[#00C471]/30 shadow-2xs',
                isDone && 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#15241C]',
                !isActive && !isDone && 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors',
                  isActive && 'bg-[#00C471] text-white',
                  isDone && 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
                  !isActive && !isDone && 'bg-slate-100 dark:bg-[#0A110D] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-[#1A3125]'
                )}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4 text-[#00C471]" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <div className="hidden md:block">
                <span className="text-xs block leading-tight font-medium">{step.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
          }
        }}
      >
        {/* STEP 1: Personal Details */}
        {currentStep === 1 && (
          <Card className="p-6 space-y-5 border-slate-200 dark:border-[#1A3125]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#1A3125] pb-3">
              {isSuperAdminProfile
                ? 'Step 1: Executive Personal Credentials'
                : 'Step 1: Personal Information & NADRA Verification'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Employee Code <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#00C471]" />
                    Auto-Generated System ID
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Auto-generating..."
                  readOnly
                  disabled
                  {...register('employeeCode')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-100 dark:bg-[#0A110D] cursor-not-allowed font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase select-none"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Unique sequential identifier generated automatically by HRM system.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Muhammad Ali"
                  {...register('name', { required: 'Full name is required' })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="ali@company.pk"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  {...register('phone')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pakistani CNIC (13 digits)
                </label>
                <input
                  type="text"
                  placeholder="35202-1234567-1"
                  value={watchedCnic || ''}
                  onChange={handleCnicChange}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">Auto-formatted with NADRA hyphens. Encrypted at rest.</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    CNIC Expiry Date
                  </label>
                  {isCnicExpiringSoon && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/40">
                      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Expires Soon (&lt; 30 Days)
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  {...register('cnicExpiry')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  {...register('dob')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  {...register('gender')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
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
          <Card className="p-6 space-y-6 border-slate-200 dark:border-[#1A3125]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#1A3125] pb-3">
              Step 2: Address & Emergency Contacts
            </h3>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Residential Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="House #12, Street 4, Sector F-8/1"
                    {...register('address.street')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Islamabad"
                    {...register('address.city')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="Federal / Punjab"
                    {...register('address.state')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    placeholder="44000"
                    {...register('address.postalCode')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    defaultValue="Pakistan"
                    {...register('address.country')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Emergency Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="Tariq Hashmi"
                    {...register('emergencyContact.name')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="Father / Spouse / Sibling"
                    {...register('emergencyContact.relationship')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    placeholder="+92 321 9876543"
                    {...register('emergencyContact.phone')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Job Assignment (Standard Employees Only) */}
        {!isSuperAdminProfile && currentStep === 3 && (
          <Card className="p-6 space-y-5 border-slate-200 dark:border-[#1A3125]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#1A3125] pb-3">
              Step 3: Organization & Job Structure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  {...register('departmentId')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation
                </label>
                <select
                  {...register('designationId')}
                  disabled={!selectedDepartmentId}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                    ⚠️ Select a Department first to load matching designations.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Shift Roster
                </label>
                <select
                  {...register('shiftId')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Direct Reporting Manager
                </label>
                <ManagerSelect
                  managers={eligibleManagers}
                  value={watchedManagerId}
                  onChange={(mgrId) => setValue('managerId', mgrId, { shouldValidate: true })}
                />
                <input type="hidden" {...register('managerId')} />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Designated leadership authority (Super Admin, HR Manager, or Department Manager).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employment Contract Type
                </label>
                <select
                  {...register('employmentType')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lifecycle Status
                </label>
                <select
                  {...register('status')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  {...register('joiningDate')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Probation End Date
                </label>
                <input
                  type="date"
                  {...register('probationEndDate')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Skills & Technical Competencies (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="React, Node.js, MongoDB, TypeScript, Docker"
                  {...register('skills')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Bank & Financials (Step 3 for Super Admin, Step 4 for Standard Employee) */}
        {((isSuperAdminProfile && currentStep === 3) || (!isSuperAdminProfile && currentStep === 4)) && (
          <Card className="p-6 space-y-5 border-slate-200 dark:border-[#1A3125]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#1A3125] pb-3">
              {isSuperAdminProfile
                ? 'Step 3: Corporate Banking & Disbursement Details'
                : 'Step 4: Bank Account & Payroll Disbursement Details'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Banking IBAN is encrypted at rest using AES-256-GCM. Unmasked access is restricted strictly to HR and Payroll administrators.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="Meezan Bank / HBL / Standard Chartered"
                  {...register('bankDetails.bankName')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  placeholder="Muhammad Ali"
                  {...register('bankDetails.accountTitle')}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="01010102030405"
                  {...register('bankDetails.accountNumber')}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  International Bank Account Number (IBAN)
                </label>
                <input
                  type="text"
                  placeholder="PK36MEZN0000000101010203"
                  {...register('bankDetails.iban')}
                  className="w-full text-xs font-mono uppercase px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471]"
                />
              </div>
            </div>
          </Card>
        )}

        {/* STEP 5: Account Provisioning & Review (Standard Employees Only) */}
        {!isSuperAdminProfile && currentStep === 5 && (
          <Card className="p-6 space-y-6 border-slate-200 dark:border-[#1A3125]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#1A3125] pb-3">
              Step 5: Account Provisioning & Review
            </h3>

            {!isEditMode && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="createAccountCheckbox"
                    {...register('createAccount')}
                    className="mt-1 w-4 h-4 text-[#00C471] rounded-lg border-slate-300 dark:border-[#1A3125] focus:ring-[#00C471]"
                  />
                  <label htmlFor="createAccountCheckbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="font-semibold block text-slate-900 dark:text-white mb-0.5">
                      Provision System Login User Account
                    </span>
                    Automatically create a login user account in the system and dispatch initial credentials to their official email.
                  </label>
                </div>

                {watchedCreateAccount && (
                  <div className="pt-3 border-t border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#00C471]" />
                      <span>System Access Role</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <RoleSelect
                      roles={roles}
                      value={watchedRoleId}
                      onChange={(roleId) => setValue('roleId', roleId, { shouldValidate: true })}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Select the system software permissions role for this employee (e.g. <strong>HR Manager</strong> for company-wide HR management, <strong>Department Manager</strong> for team approvals, or <strong>Employee</strong> for self-service). Super Admin is restricted for executive security.
                    </p>
                  </div>
                )}
              </div>
            )}

            {isEditMode && employeeData?.data?.userId && (
              <div className="bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00C471]" />
                  <span>Assigned System Access Role</span>
                </label>
                <RoleSelect
                  roles={roles}
                  value={watchedRoleId}
                  onChange={(roleId) => setValue('roleId', roleId, { shouldValidate: true })}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Modifying this role updates the software access and permissions of this employee's linked portal account.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Summary Review</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 dark:bg-[#0A110D] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{watchedName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Employee Code:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 font-mono">{watchedEmployeeCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Email:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate block">{watchedEmail || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">CNIC:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 font-mono">{watchedCnic || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">System Role:</span>
                  <span className="font-semibold text-[#00C471]">
                    {roles.find((r) => r._id === watchedRoleId)?.name || 'Employee'}
                  </span>
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
              'px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#15241C] flex items-center gap-2 cursor-pointer shadow-xs transition-colors',
              currentStep === 1 && 'invisible'
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              key="btn-next-step"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextStep();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C471] text-white hover:bg-[#00ad64] flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              key="btn-submit-employee"
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#00C471] text-white hover:bg-[#00ad64] flex items-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {(isCreating || isUpdating) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />{' '}
                  {isSuperAdminProfile
                    ? 'Save Executive Profile'
                    : isEditMode
                    ? 'Update Profile'
                    : 'Complete Onboarding'}
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Onboarding Credentials Modal */}
      {createdAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0B261D] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Employee Onboarded!</h3>
            </div>
            <p className="text-xs text-white/70">
              Account credentials for <strong className="text-white">{createdAccountModal.name}</strong> have been created:
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-3 text-xs">
              <div>
                <span className="text-white/50 block text-[11px] mb-0.5">Login Email:</span>
                <span className="font-semibold text-emerald-300 font-mono select-all text-sm block">
                  {createdAccountModal.email}
                </span>
              </div>
              <div>
                <span className="text-white/50 block text-[11px] mb-0.5">Temporary Password:</span>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <span className="font-semibold text-white font-mono bg-black/40 px-3 py-1.5 rounded-lg select-all text-sm truncate">
                    {createdAccountModal.tempPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdAccountModal.tempPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-[#00C471]/20 hover:bg-[#00C471]/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Login credentials have also been dispatched to the employee's email.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/employees/${createdAccountModal.employeeId}`)}
              className="w-full py-2.5 bg-[#00C471] hover:bg-emerald-400 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_2px_10px_rgba(0,196,113,0.3)] cursor-pointer"
            >
              Done & View Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
