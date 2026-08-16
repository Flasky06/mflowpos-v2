import React, { useEffect, useState } from 'react';
import { PAYWALL_EVENT, apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Lock, ShieldCheck, CheckCircle2, X, ArrowRight, Loader2 } from 'lucide-react';

export const PaywallModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const handlePaywall = (e: any) => {
      setMessage(e.detail?.message || 'Subscription or free trial period has ended.');
      setIsOpen(true);
    };

    window.addEventListener(PAYWALL_EVENT, handlePaywall);
    return () => window.removeEventListener(PAYWALL_EVENT, handlePaywall);
  }, []);

  const handlePaystackCheckout = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/subscriptions/paystack/initialize', {});
      const { authorizationUrl } = res.data?.data || {};

      if (authorizationUrl) {
        // Redirect customer to Paystack secure checkout page (M-PESA & Card)
        window.location.href = authorizationUrl;
      } else {
        throw new Error('No checkout URL received from Paystack');
      }
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Payment Error',
        message: err.response?.data?.message || 'Unable to initiate Paystack payment. Please try again.',
      });
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200 text-slate-900 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-5 text-indigo-600 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            Subscription Required
          </span>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight pt-1">Unlock mflow POS</h3>
        </div>

        <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
          {message || 'Your 14-day free trial has concluded. Renew your monthly business subscription to continue processing sales.'}
        </p>

        {/* Plan Feature Summary Card */}
        <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-900">mflow POS Standard</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-indigo-600">KSh 1,000</span>
              <span className="text-[10px] font-bold text-slate-400">/ 30 days</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-700 font-semibold pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Unlimited Branches & Cashier Accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Thermal POS Checkout & Barcode Scanner</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Instant M-PESA & Card Automated Renewal</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setIsOpen(false)}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors"
          >
            Later
          </button>
          <button
            disabled={isLoading}
            onClick={handlePaystackCheckout}
            className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting to Paystack...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Pay KSh 1,000 with M-PESA / Card
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 font-medium mt-4">
          Secured by Paystack. Instant activation on M-PESA confirmation.
        </p>
      </div>
    </div>
  );
};
