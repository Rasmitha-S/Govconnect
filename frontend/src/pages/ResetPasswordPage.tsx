import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { authApi } from '../api/client.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';

const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: any) => {
    if (!token) {
      setErrorMessage('Reset token is missing from URL.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword: data.newPassword });
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Password reset failed. The token may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 max-w-md mx-auto w-full">
      <Card className="p-8 shadow-gov-md border-[#DDE3EA] w-full">
        {success ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-[#E8F5E9] text-[#198754] border border-[#A3E9B9] rounded-2xl flex items-center justify-center mx-auto shadow-gov-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#172033]">Password Reset Complete</h2>
              <p className="text-xs text-[#5B667A] leading-relaxed mt-1">
                Your credentials have been securely updated. You can now log into GovConnect with your new password.
              </p>
            </div>
            <div className="pt-3">
              <Link to="/login">
                <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Sign In to GovConnect
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-1.5 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#123B6D] text-white flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#172033]">Set New Password</h2>
              <p className="text-xs text-[#5B667A]">
                Create a strong password of at least 8 characters
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FDEDEC] border border-[#F5B7B1] text-[#C0392B] rounded-lg text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  New Password <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B667A]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    {...register('newPassword')}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {errors.newPassword && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{String(errors.newPassword.message)}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Confirm New Password <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B667A]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {errors.confirmPassword && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{String(errors.confirmPassword.message)}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Save New Password
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
};
