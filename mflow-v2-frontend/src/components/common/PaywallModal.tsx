import React, { useEffect, useState } from 'react';
import { PAYWALL_EVENT } from '../../api/client';
import { Lock, CreditCard, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PaywallModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaywall = (e: any) => {
      setMessage(e.detail?.message || 'Subscription or trial period has expired.');
      setIsOpen(true);
    };

    window.addEventListener(PAYWALL_EVENT, handlePaywall);
    return () => window.removeEventListener(PAYWALL_EVENT, handlePaywall);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl border border-amber-200 text-slate-900 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mb-4 text-amber-700">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">Subscription Expired</h3>
        <p className="text-sm text-slate-600 mb-6">
          {message || 'Your business subscription trial period has ended. Upgrade your plan to continue processing transactions.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors border border-slate-200"
          >
            Close
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/superadmin');
            }}
            className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <CreditCard className="w-4 h-4" />
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
};
