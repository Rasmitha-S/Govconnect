import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, KeyRound, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { authApi } from '../api/client.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 max-w-md mx-auto w-full">
      <Card className="p-8 shadow-gov-md border-[#DDE3EA] w-full">
        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-[#E8F5E9] text-[#198754] border border-[#A3E9B9] rounded-2xl flex items-center justify-center mx-auto shadow-gov-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#172033]">Reset Link Dispatched</h2>
              <p className="text-xs text-[#5B667A] leading-relaxed mt-1">
                If that email address is registered on GovConnect, password recovery instructions and a secure token have been sent.
              </p>
            </div>
            <div className="pt-3">
              <Link to="/login">
                <Button variant="secondary" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-1.5 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#123B6D] text-white flex items-center justify-center mx-auto shadow-md">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#172033]">Reset Password</h2>
              <p className="text-xs text-[#5B667A]">
                Enter your registered email to receive secure recovery instructions
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Email Address <span className="text-[#C0392B]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B667A]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none transition-all shadow-gov-sm"
                  />
                </div>
                {errors.email && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.email.message}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Password Reset Token
              </Button>
            </form>

            <div className="pt-4 text-center border-t border-[#DDE3EA]">
              <Link to="/login" className="text-xs font-semibold text-[#123B6D] hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
