import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { authApi } from '../api/client.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing or invalid email verification token.');
      return;
    }

    authApi
      .verifyEmail(token, email || undefined)
      .then((res) => {
        if (res.success) {
          setStatus('success');
          setMessage(res.data.message || 'Email verified successfully! Your account is now active.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Verification token is invalid or has expired.');
      });
  }, [token, email]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 max-w-md mx-auto w-full">
      <Card className="text-center p-8 space-y-4 shadow-gov-md border-[#DDE3EA] w-full">
        {status === 'loading' && (
          <div className="space-y-3 py-4">
            <RefreshCw className="w-10 h-10 text-[#123B6D] animate-spin mx-auto" />
            <h3 className="text-base font-bold text-[#172033]">Verifying Email</h3>
            <p className="text-xs text-[#5B667A]">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-[#E8F5E9] text-[#198754] border border-[#A3E9B9] rounded-2xl flex items-center justify-center mx-auto shadow-gov-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#172033]">Account Verified!</h3>
              <p className="text-xs text-[#5B667A] leading-relaxed mt-1">{message}</p>
            </div>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Sign In to GovConnect
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-[#FDEDEC] text-[#C0392B] border border-[#F5B7B1] rounded-2xl flex items-center justify-center mx-auto shadow-gov-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#172033]">Verification Failed</h3>
              <p className="text-xs text-[#C0392B] font-medium leading-relaxed mt-1">{message}</p>
            </div>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="secondary" size="md" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
