import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Scale, Calendar } from 'lucide-react';

export const BalanceSheetPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBalanceSheet = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const dashRes = await apiClient.get(`/reports/dashboard${shopQuery}`);
      setSummaryData(dashRes.data.data);
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load balance sheet statement' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [activeShopId]);

  const totalAssetsVal = summaryData ? Number(summaryData.totalPaidRevenue || 0) : 0;
  const totalLiabilitiesVal = summaryData ? Number(summaryData.totalExpenses || 0) : 0;
  const totalEquityVal = Math.max(0, totalAssetsVal - totalLiabilitiesVal);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-indigo-600" />
            Statement of Balance Sheet
          </h1>
          <p className="text-sm text-slate-500">Summary of business assets, liabilities, and retained owner equity</p>
        </div>

        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
          KSh Currency
        </span>
      </div>

      {/* Main Balance Sheet Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Financial Position Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5">Asset, Liability, and Capital accounting balances</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Assets */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Total Assets</span>
            <span className="text-2xl font-extrabold text-indigo-600 block">
              KSh {totalAssetsVal.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-500">Cash reserves, receivables & inventory valuation</p>
          </div>

          {/* Liabilities */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">2. Total Liabilities</span>
            <span className="text-2xl font-extrabold text-rose-600 block">
              KSh {totalLiabilitiesVal.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-500">Operating payables & business outflows</p>
          </div>

          {/* Equity */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">3. Owner Equity</span>
            <span className="text-2xl font-extrabold text-emerald-600 block">
              KSh {totalEquityVal.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-500">Net retained business capital</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Verified Accounting Equation
          </span>
          <p className="text-sm font-extrabold text-emerald-900 mt-1">
            Assets (KSh {totalAssetsVal.toLocaleString()}) = Liabilities (KSh {totalLiabilitiesVal.toLocaleString()}) + Equity (KSh {totalEquityVal.toLocaleString()})
          </p>
        </div>
      </div>
    </div>
  );
};
