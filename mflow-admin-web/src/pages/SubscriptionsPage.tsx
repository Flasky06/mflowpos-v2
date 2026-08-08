import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { CreditCard, DollarSign, Zap } from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);

  const fetchSubscriptionData = async () => {
    try {
      const payRes = await apiClient.get('/superadmin/payments').catch(() => ({ data: { data: [] } }));
      setPayments(payRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-500" />
            Subscriptions & Platform Revenue
          </h1>
          <p className="text-xs text-slate-400">Monitor SaaS subscription tiers, billing transactions, and renewals</p>
        </div>
      </div>

      {/* Subscription Plans Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">Starter Plan</span>
            <Zap className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-white">KSh 3,500 <span className="text-xs font-normal text-slate-400">/ mo</span></h3>
          <p className="text-xs text-slate-400">For single location retail shops with up to 3 sales staff</p>
        </div>

        <div className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase">
            Popular
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-violet-400 uppercase tracking-wider">Professional Plan</span>
            <CreditCard className="w-5 h-5 text-violet-500" />
          </div>
          <h3 className="text-2xl font-black text-white">KSh 7,500 <span className="text-xs font-normal text-slate-400">/ mo</span></h3>
          <p className="text-xs text-slate-400">For multi-branch retail & service businesses with unlimited users</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Enterprise Plan</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-white">Custom <span className="text-xs font-normal text-slate-400">/ year</span></h3>
          <p className="text-xs text-slate-400">Dedicated cloud database instance with SLA 99.9% uptime guarantee</p>
        </div>
      </div>

      {/* Subscription Payment Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Subscription Payment Logs ({payments.length})</h3>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Business</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Payment Method</th>
                <th className="py-3.5 px-4 text-center">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850 text-xs">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{p.id.substring(0, 10)}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{p.business?.name || 'Tenant'}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">
                      KSh {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-300">{p.paymentMethod || 'M-PESA'}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
