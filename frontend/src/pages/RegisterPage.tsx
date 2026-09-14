import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus,
  Mail,
  Lock,
  Phone,
  MapPin,
  User,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Building2,
  Shield,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  Layers,
  Clock,
} from 'lucide-react';
import { authApi, serviceApi } from '../api/client.js';
import { Department } from '../types/index.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';

type RegisterRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

// Zod Schemas per role
const citizenSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name is required (minimum 2 characters)'),
    email: z.string().email('Please enter a valid email address'),
    mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
    address: z.string().min(5, 'Residential address is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms of service'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const officerSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name is required (minimum 2 characters)'),
    email: z.string().email('Please enter a valid official email address'),
    mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
    departmentId: z.string().min(1, 'Please select your department'),
    employeeCode: z.string().min(2, 'Employee / Officer ID is required'),
    designation: z.string().min(2, 'Designation is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the official authorization agreement'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const adminSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name is required (minimum 2 characters)'),
    email: z.string().email('Please enter a valid administrator email address'),
    mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
    organization: z.string().min(2, 'Organization / Agency name is required'),
    employeeId: z.string().min(2, 'Administrator ID is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the platform governance agreement'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const RegisterPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RegisterRole>('CITIZEN');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch departments for Officer dropdown
  useEffect(() => {
    serviceApi
      .listDepartments()
      .then((res) => {
        if (res.success && res.data) setDepartments(res.data);
      })
      .catch((err) => console.error('Error fetching departments', err));
  }, []);

  // Form hooks per role
  const citizenForm = useForm({
    resolver: zodResolver(citizenSchema),
    defaultValues: { fullName: '', email: '', mobile: '', address: '', password: '', confirmPassword: '', termsAccepted: false },
  });

  const officerForm = useForm({
    resolver: zodResolver(officerSchema),
    defaultValues: { fullName: '', email: '', mobile: '', departmentId: '', employeeCode: '', designation: '', password: '', confirmPassword: '', termsAccepted: false },
  });

  const adminForm = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: { fullName: '', email: '', mobile: '', organization: '', employeeId: '', password: '', confirmPassword: '', termsAccepted: false },
  });

  const onCitizenSubmit = async (data: any) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await authApi.registerCitizen(data);
      if (res.success) {
        setSuccessInfo({ ...res.data, role: 'CITIZEN' });
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Citizen registration failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOfficerSubmit = async (data: any) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await authApi.registerOfficer(data);
      if (res.success) {
        setSuccessInfo({ ...res.data, role: 'OFFICER' });
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Officer registration failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAdminSubmit = async (data: any) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await authApi.registerAdmin(data);
      if (res.success) {
        setSuccessInfo({ ...res.data, role: 'CENTRAL_ADMIN' });
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Administrator registration failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successInfo) {
    const isPending = successInfo.accountStatus === 'PENDING_APPROVAL';

    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 max-w-xl mx-auto">
        <Card className="text-center space-y-6 p-8 sm:p-10 shadow-gov-md border-[#DDE3EA]">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-gov-sm ${
              isPending
                ? 'bg-[#FEF9E7] text-[#D99000] border border-[#FAD7A0]'
                : 'bg-[#E8F5E9] text-[#198754] border border-[#A3E9B9]'
            }`}
          >
            {isPending ? <Clock className="w-9 h-9" /> : <CheckCircle2 className="w-9 h-9" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[#172033]">
              {isPending
                ? successInfo.role === 'OFFICER'
                  ? 'Officer Registration Submitted'
                  : 'Administrator Registration Submitted'
                : 'Citizen Registration Successful'}
            </h2>
            <p className="text-xs text-[#5B667A] leading-relaxed max-w-md mx-auto">
              {isPending ? (
                <>
                  Your registration has been submitted for verification. An authorized Central Administrator will review and approve your credentials before your account is activated.
                </>
              ) : (
                <>
                  Your GovConnect citizen profile has been initialized. A verification link has been dispatched to{' '}
                  <b className="text-[#172033]">{successInfo.email}</b>.
                </>
              )}
            </p>
          </div>

          {/* Verification Link Shortcut if in non-production */}
          {!isPending && successInfo.verificationTokenPreview && (
            <div className="p-4 bg-[#EBF3FA] border border-[#B9D4EE] rounded-xl text-left text-xs space-y-2.5">
              <span className="font-bold text-[#123B6D] block text-[11px] uppercase tracking-wider">
                Instant Account Activation:
              </span>
              <p className="text-[#172033] text-[11px]">
                Click below to complete email verification and sign in:
              </p>
              <Link
                to={`/verify-email?token=${successInfo.verificationTokenPreview}&email=${encodeURIComponent(successInfo.email)}`}
                className="inline-block"
              >
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Complete Verification & Sign In
                </Button>
              </Link>
            </div>
          )}

          {isPending && (
            <div className="p-4 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl text-left text-xs space-y-1 text-[#5B667A]">
              <span className="font-bold text-[#172033] block">What happens next?</span>
              <p>1. Your departmental identification & officer ID will be scrutinized.</p>
              <p>2. Once authorized, you will receive an approval confirmation email.</p>
              <p>3. You can then sign in directly to your role-specific dashboard.</p>
            </div>
          )}

          <div className="pt-2 border-t border-[#DDE3EA]">
            <Link to="/login">
              <Button variant="secondary" size="md" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-[#F5F7FA] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6 space-y-1.5">
          <div className="w-11 h-11 rounded-xl bg-[#123B6D] text-white flex items-center justify-center mx-auto shadow-md">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#172033]">Create your GOVCONNECT account</h2>
          <p className="text-xs text-[#5B667A]">
            Select your account type to proceed with registration
          </p>
        </div>

        <Card className="shadow-gov-md border-[#DDE3EA] p-6 sm:p-8">
          {/* Role Selection Cards */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-[#5B667A] uppercase tracking-wider mb-2.5">
              Select Account Type:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Citizen Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('CITIZEN');
                  setErrorMessage(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'CITIZEN'
                    ? 'border-[#123B6D] bg-[#EBF3FA] text-[#123B6D] shadow-sm ring-1 ring-[#123B6D]'
                    : 'border-[#DDE3EA] bg-white text-[#5B667A] hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className={`w-5 h-5 ${selectedRole === 'CITIZEN' ? 'text-[#123B6D]' : 'text-[#5B667A]'}`} />
                  <span className="text-xs font-bold block text-[#172033]">Citizen</span>
                </div>
                <p className="text-[11px] text-[#5B667A] leading-relaxed">
                  Access and manage your government services.
                </p>
              </button>

              {/* Officer Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('OFFICER');
                  setErrorMessage(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'OFFICER'
                    ? 'border-[#123B6D] bg-[#EBF3FA] text-[#123B6D] shadow-sm ring-1 ring-[#123B6D]'
                    : 'border-[#DDE3EA] bg-white text-[#5B667A] hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className={`w-5 h-5 ${selectedRole === 'OFFICER' ? 'text-[#123B6D]' : 'text-[#5B667A]'}`} />
                  <span className="text-xs font-bold block text-[#172033]">Department Officer</span>
                </div>
                <p className="text-[11px] text-[#5B667A] leading-relaxed">
                  Process and manage applications for your department.
                </p>
              </button>

              {/* Admin Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('ADMIN');
                  setErrorMessage(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'ADMIN'
                    ? 'border-[#123B6D] bg-[#EBF3FA] text-[#123B6D] shadow-sm ring-1 ring-[#123B6D]'
                    : 'border-[#DDE3EA] bg-white text-[#5B667A] hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-5 h-5 ${selectedRole === 'ADMIN' ? 'text-[#123B6D]' : 'text-[#5B667A]'}`} />
                  <span className="text-xs font-bold block text-[#172033]">Central Administrator</span>
                </div>
                <p className="text-[11px] text-[#5B667A] leading-relaxed">
                  Manage GOVCONNECT platforms, connectors and operations.
                </p>
              </button>
            </div>
          </div>

          {/* Security Notice Banner for Privileged Roles */}
          {selectedRole === 'OFFICER' && (
            <div className="mb-5 p-3.5 bg-[#FEF9E7] border border-[#FAD7A0] rounded-xl flex items-start gap-3 text-xs text-[#7D6608]">
              <ShieldCheck className="w-4 h-4 text-[#D99000] shrink-0 mt-0.5" />
              <span>
                <b>Department Officer Notice:</b> Officer accounts require verification and authorization by a Central Administrator before access is granted.
              </span>
            </div>
          )}

          {selectedRole === 'ADMIN' && (
            <div className="mb-5 p-3.5 bg-[#FEF9E7] border border-[#FAD7A0] rounded-xl flex items-start gap-3 text-xs text-[#7D6608]">
              <ShieldCheck className="w-4 h-4 text-[#D99000] shrink-0 mt-0.5" />
              <span>
                <b>Central Administrator Notice:</b> Administrator accounts require authorized approval before privileged access is granted.
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 bg-[#FDEDEC] border border-[#F5B7B1] text-[#C0392B] rounded-lg text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. CITIZEN REGISTRATION FORM */}
          {selectedRole === 'CITIZEN' && (
            <form onSubmit={citizenForm.handleSubmit(onCitizenSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Full Legal Name <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...citizenForm.register('fullName')}
                    placeholder="e.g. Kavitha Sundaram"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {citizenForm.formState.errors.fullName && (
                  <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                    {citizenForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Email Address <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      {...citizenForm.register('email')}
                      placeholder="citizen@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {citizenForm.formState.errors.email && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {citizenForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Mobile Number <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...citizenForm.register('mobile')}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {citizenForm.formState.errors.mobile && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {citizenForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Residential Address <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 pt-2.5 pointer-events-none text-[#5B667A]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    {...citizenForm.register('address')}
                    rows={2}
                    placeholder="Door No, Street Name, City, Pincode"
                    className="w-full pl-10 pr-3.5 py-2 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {citizenForm.formState.errors.address && (
                  <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                    {citizenForm.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Password <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...citizenForm.register('password')}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5B667A] hover:text-[#172033] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {citizenForm.formState.errors.password && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {citizenForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Confirm Password <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...citizenForm.register('confirmPassword')}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {citizenForm.formState.errors.confirmPassword && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {citizenForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 bg-[#F5F7FA] p-3 rounded-lg border border-[#DDE3EA]">
                <input
                  type="checkbox"
                  id="citizen-terms"
                  {...citizenForm.register('termsAccepted')}
                  className="mt-0.5 rounded border-[#DDE3EA] text-[#123B6D] focus:ring-[#123B6D]"
                />
                <label htmlFor="citizen-terms" className="text-xs text-[#172033] leading-snug cursor-pointer">
                  I agree to the GovConnect Terms of Service and consent to encrypted data interoperability for requested services.
                </label>
              </div>
              {citizenForm.formState.errors.termsAccepted && (
                <p className="text-[11px] font-medium text-[#C0392B]">{citizenForm.formState.errors.termsAccepted.message}</p>
              )}

              <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
                Create Citizen Account
              </Button>
            </form>
          )}

          {/* 2. OFFICER REGISTRATION FORM */}
          {selectedRole === 'OFFICER' && (
            <form onSubmit={officerForm.handleSubmit(onOfficerSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Full Legal Name <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...officerForm.register('fullName')}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {officerForm.formState.errors.fullName && (
                  <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                    {officerForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Official Email Address <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      {...officerForm.register('email')}
                      placeholder="officer@dept.gov.in"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {officerForm.formState.errors.email && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {officerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Mobile Number <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...officerForm.register('mobile')}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {officerForm.formState.errors.mobile && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {officerForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Department <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <select
                      {...officerForm.register('departmentId')}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  {officerForm.formState.errors.departmentId && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {officerForm.formState.errors.departmentId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Employee / Officer ID <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...officerForm.register('employeeCode')}
                      placeholder="e.g. WTR-OFF-2026-09"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {officerForm.formState.errors.employeeCode && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {officerForm.formState.errors.employeeCode.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Designation / Role Title <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...officerForm.register('designation')}
                    placeholder="e.g. Assistant Municipal Engineer / Scrutiny Officer"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {officerForm.formState.errors.designation && (
                  <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                    {officerForm.formState.errors.designation.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Password <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...officerForm.register('password')}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5B667A] hover:text-[#172033] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {officerForm.formState.errors.password && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {officerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Confirm Password <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...officerForm.register('confirmPassword')}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {officerForm.formState.errors.confirmPassword && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {officerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 bg-[#F5F7FA] p-3 rounded-lg border border-[#DDE3EA]">
                <input
                  type="checkbox"
                  id="officer-terms"
                  {...officerForm.register('termsAccepted')}
                  className="mt-0.5 rounded border-[#DDE3EA] text-[#123B6D] focus:ring-[#123B6D]"
                />
                <label htmlFor="officer-terms" className="text-xs text-[#172033] leading-snug cursor-pointer">
                  I confirm that I am an authorized government officer and agree to handle citizen data under statutory privacy laws.
                </label>
              </div>
              {officerForm.formState.errors.termsAccepted && (
                <p className="text-[11px] font-medium text-[#C0392B]">{officerForm.formState.errors.termsAccepted.message}</p>
              )}

              <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
                Submit Officer Registration Request
              </Button>
            </form>
          )}

          {/* 3. CENTRAL ADMINISTRATOR REGISTRATION FORM */}
          {selectedRole === 'ADMIN' && (
            <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Full Legal Name <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...adminForm.register('fullName')}
                    placeholder="e.g. Dr. Vikram Sarabhai"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {adminForm.formState.errors.fullName && (
                  <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                    {adminForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Administrator Official Email <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      {...adminForm.register('email')}
                      placeholder="admin@govconnect.gov.in"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {adminForm.formState.errors.email && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {adminForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Mobile Number <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...adminForm.register('mobile')}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {adminForm.formState.errors.mobile && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {adminForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Organization / Governing Agency <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...adminForm.register('organization')}
                      placeholder="e.g. State e-Governance Agency (SeGA)"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {adminForm.formState.errors.organization && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {adminForm.formState.errors.organization.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Administrator / Employee ID <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      {...adminForm.register('employeeId')}
                      placeholder="e.g. ADM-SEGA-2026-01"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {adminForm.formState.errors.employeeId && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {adminForm.formState.errors.employeeId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Password <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...adminForm.register('password')}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5B667A] hover:text-[#172033] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {adminForm.formState.errors.password && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {adminForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Confirm Password <span className="text-[#C0392B]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...adminForm.register('confirmPassword')}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                    />
                  </div>
                  {adminForm.formState.errors.confirmPassword && (
                    <p className="text-[11px] font-medium text-[#C0392B] mt-1">
                      {adminForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 bg-[#F5F7FA] p-3 rounded-lg border border-[#DDE3EA]">
                <input
                  type="checkbox"
                  id="admin-terms"
                  {...adminForm.register('termsAccepted')}
                  className="mt-0.5 rounded border-[#DDE3EA] text-[#123B6D] focus:ring-[#123B6D]"
                />
                <label htmlFor="admin-terms" className="text-xs text-[#172033] leading-snug cursor-pointer">
                  I confirm that I am authorized to administer GovConnect platform governance and accept administrative non-repudiation audit requirements.
                </label>
              </div>
              {adminForm.formState.errors.termsAccepted && (
                <p className="text-[11px] font-medium text-[#C0392B]">{adminForm.formState.errors.termsAccepted.message}</p>
              )}

              <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
                Submit Administrator Registration Request
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-[#DDE3EA] text-center">
            <p className="text-xs text-[#5B667A]">
              Already have a GOVCONNECT account?{' '}
              <Link to="/login" className="font-bold text-[#123B6D] hover:underline">
                Sign in to your account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
