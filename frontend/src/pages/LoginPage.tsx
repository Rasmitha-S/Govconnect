import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Layers,
  ArrowRight,
  CheckCircle2,
  Server,
  UserCheck,
  Building2,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';

type LoginRoleContext = 'CITIZEN' | 'OFFICER' | 'ADMIN';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email address is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState<LoginRoleContext>('CITIZEN');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const user = await login(data);
      if (user) {
        // Direct securely to appropriate role workspace
        const fromPath = (location.state as any)?.from?.pathname;
        if (user.role === 'CENTRAL_ADMIN' || (user.role as any) === 'ADMIN') {
          navigate(fromPath && fromPath.startsWith('/admin') ? fromPath : '/admin', { replace: true });
        } else if (user.role === 'OFFICER') {
          navigate(fromPath && fromPath.startsWith('/officer') ? fromPath : '/officer', { replace: true });
        } else {
          // Citizen
          const isCitizenRoute = fromPath && !fromPath.startsWith('/admin') && !fromPath.startsWith('/officer') && fromPath !== '/login';
          navigate(isCitizenRoute ? fromPath : '/citizen', { replace: true });
        }
      }
    } catch (err: any) {
      const backendError = err.response?.data?.error?.message;
      if (backendError && !backendError.toLowerCase().includes('database') && !backendError.toLowerCase().includes('jwt') && !backendError.toLowerCase().includes('prisma')) {
        setErrorMessage(backendError);
      } else {
        setErrorMessage('Invalid email or password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F5F7FA] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side: GovConnect Platform Identity & Architecture */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block pr-2">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF3FA] border border-[#B9D4EE] text-[#123B6D] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#123B6D]" />
              <span>Official Government Interoperability Gateway</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#172033] tracking-tight leading-tight">
              One secure platform for connected government services.
            </h1>
            <p className="text-xs text-[#5B667A] leading-relaxed">
              GovConnect securely connects municipal corporations, transport authorities, revenue departments, and national digital infrastructure through citizen-centric interoperability.
            </p>
          </div>

          {/* Subtle Interoperability Visual */}
          <div className="bg-white p-5 rounded-2xl border border-[#DDE3EA] shadow-gov space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE3EA] pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B667A]">
                Connected Government Framework
              </span>
              <span className="text-[10px] font-bold bg-[#E6F4F5] text-[#087F8C] px-2 py-0.5 rounded border border-[#A2D9DC]">
                Zero-Trust Consent
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#F5F7FA] p-3 rounded-xl border border-[#DDE3EA] flex flex-col items-center justify-center space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3FA] text-[#123B6D] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#172033] text-[11px]">Citizen</span>
                <span className="text-[10px] text-[#5B667A]">Single Identity</span>
              </div>

              <div className="bg-[#EBF3FA] p-3 rounded-xl border border-[#B9D4EE] flex flex-col items-center justify-center space-y-1.5 relative">
                <div className="w-8 h-8 rounded-lg bg-[#123B6D] text-white flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#123B6D] text-[11px]">GOVCONNECT</span>
                <span className="text-[10px] text-[#087F8C] font-semibold">Interoperability Mesh</span>
              </div>

              <div className="bg-[#F5F7FA] p-3 rounded-xl border border-[#DDE3EA] flex flex-col items-center justify-center space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-[#E6F4F5] text-[#087F8C] flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <span className="font-bold text-[#172033] text-[11px]">Departments</span>
                <span className="text-[10px] text-[#5B667A]">Connected Portals</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-[11px] text-[#5B667A]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#198754] shrink-0" />
                <span>DigiLocker-assisted fast-track consent & auto-fill</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#198754] shrink-0" />
                <span>Automated cross-departmental verification pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#198754] shrink-0" />
                <span>Tamper-evident, non-repudiation security audit trail</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Sign In Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <Card className="shadow-gov-md border-[#DDE3EA] p-6 sm:p-8">
            <div className="text-left mb-6 space-y-1">
              <h2 className="text-2xl font-bold text-[#172033]">Sign in to GOVCONNECT</h2>
              <p className="text-xs text-[#5B667A]">Access your government services securely.</p>
            </div>

            {/* Role Context Selector */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#5B667A] uppercase tracking-wider mb-2">
                Sign in as:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('CITIZEN')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'CITIZEN'
                      ? 'border-[#123B6D] bg-[#EBF3FA] text-[#123B6D] shadow-sm ring-1 ring-[#123B6D]'
                      : 'border-[#DDE3EA] bg-white text-[#5B667A] hover:bg-[#F5F7FA]'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 mb-1 ${selectedRole === 'CITIZEN' ? 'text-[#123B6D]' : 'text-[#5B667A]'}`} />
                  <span className="text-xs font-bold block">Citizen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('OFFICER')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'OFFICER'
                      ? 'border-[#123B6D] bg-[#EBF3FA] text-[#123B6D] shadow-sm ring-1 ring-[#123B6D]'
                      : 'border-[#DDE3EA] bg-white text-[#5B667A] hover:bg-[#F5F7FA]'
                  }`}
                >
                  <Building2 className={`w-4 h-4 mb-1 ${selectedRole === 'OFFICER' ? 'text-[#123B6D]' : 'text-[#5B667A]'}`} />
                  <span className="text-xs font-bold block">Officer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'ADMIN'
                      ? 'border-[#123B6D] bg-[#EBF3FA] text-[#123B6D] shadow-sm ring-1 ring-[#123B6D]'
                      : 'border-[#DDE3EA] bg-white text-[#5B667A] hover:bg-[#F5F7FA]'
                  }`}
                >
                  <Shield className={`w-4 h-4 mb-1 ${selectedRole === 'ADMIN' ? 'text-[#123B6D]' : 'text-[#5B667A]'}`} />
                  <span className="text-xs font-bold block">Admin</span>
                </button>
              </div>

              {/* Role Context Helper Text */}
              <p className="text-[11px] text-[#5B667A] mt-2">
                {selectedRole === 'CITIZEN' && 'Access and manage personal government services.'}
                {selectedRole === 'OFFICER' && 'Review and process assigned departmental applications.'}
                {selectedRole === 'ADMIN' && 'Manage platforms, connectors and central system operations.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-[#FDEDEC] border border-[#F5B7B1] text-[#C0392B] rounded-lg text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Dynamic Title Header */}
              <div className="pb-1 border-b border-[#DDE3EA]">
                <h3 className="text-sm font-bold text-[#172033]">
                  {selectedRole === 'CITIZEN' && 'Citizen Sign In'}
                  {selectedRole === 'OFFICER' && 'Department Officer Sign In'}
                  {selectedRole === 'ADMIN' && 'Central Administrator Sign In'}
                </h3>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  {selectedRole === 'CITIZEN' && 'Email Address'}
                  {selectedRole === 'OFFICER' && 'Official Email Address'}
                  {selectedRole === 'ADMIN' && 'Administrator Email'}{' '}
                  <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder={
                      selectedRole === 'CITIZEN'
                        ? 'name@example.com'
                        : selectedRole === 'OFFICER'
                        ? 'officer@dept.gov'
                        : 'admin@govconnect.gov'
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {errors.email && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.email.message}</p>}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#172033]">
                    Password <span className="text-[#C0392B]">*</span>
                  </label>
                  <Link to="/forgot-password" className="text-[11px] font-semibold text-[#123B6D] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B667A]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5B667A] hover:text-[#172033] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.password.message}</p>}
              </div>

              {/* Primary Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Citizen Self-Registration Link */}
            {selectedRole === 'CITIZEN' && (
              <div className="mt-5 pt-4 border-t border-[#DDE3EA] text-center">
                <p className="text-xs text-[#5B667A]">
                  Don't have a GOVCONNECT account?{' '}
                  <Link to="/register" className="font-bold text-[#123B6D] hover:underline">
                    Create Citizen Account
                  </Link>
                </p>
              </div>
            )}

            {/* Subtle Security Notice */}
            <div className="mt-5 pt-4 border-t border-[#DDE3EA] text-center">
              <p className="text-[11px] text-[#5B667A] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#123B6D]" />
                <span>Authorized access only. Please use your registered GOVCONNECT credentials.</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
