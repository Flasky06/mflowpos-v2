import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Button } from '../../components/common/Button';
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const addToast = useToastStore((state) => state.addToast);

  const emailParam = location.state?.email || sessionStorage.getItem('mflow_pending_verify_email') || '';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (code.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/verify-email', { code: code.trim() });
      const { user, tokens } = res.data.data;
      const accessToken = tokens?.accessToken || res.data.data?.accessToken;

      if (user && accessToken) {
        setAuth(user, accessToken);
      }

      sessionStorage.removeItem('mflow_pending_verify_email');
      addToast({
        type: 'success',
        title: 'Account Verified',
        message: 'Welcome to mFlow POS! Your 14-day free trial is active.',
      });

      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailParam) {
      setErrorMsg('Email address not found. Please register or sign in again.');
      return;
    }

    setIsResending(true);
    setErrorMsg('');

    try {
      await apiClient.post('/auth/resend-code', { email: emailParam });
      addToast({
        type: 'info',
        title: 'Code Sent',
        message: `A new 6-digit verification code has been sent to ${emailParam}`,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend code.';
      setErrorMsg(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl relative border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-indigo-600 tracking-tight mb-2">mflowpos.com</h1>
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Confirm Email Address</h2>
          <p className="text-xs text-slate-500 mt-1">
            We sent a 6-digit verification code to{' '}
            <span className="font-bold text-slate-800">{emailParam || 'your email'}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl py-3 px-4 text-center text-slate-900 font-extrabold text-2xl tracking-[0.4em] placeholder-slate-300 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm & Continue to POS
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            Resend Code
          </button>

          <Link to="/login" className="text-slate-500 hover:text-slate-800 font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
