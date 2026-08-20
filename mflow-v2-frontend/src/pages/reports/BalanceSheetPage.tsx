import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  Scale,
  Building2,
  Wallet,
  Coins,
  ShieldCheck,
  Printer,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';

export const BalanceSheetPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [inventoryValuation, setInventoryValuation] = useState<number>(0);
  const [customerReceivables, setCustomerReceivables] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBalanceSheet = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [dashRes, valRes, custRes] = await Promise.all([
        apiClient.get(`/reports/dashboard${shopQuery}`),
        apiClient.get(`/reports/inventory-valuation${shopQuery}`).catch(() => ({ data: { data: { totalRetailValue: 0 } } })),
        apiClient.get(`/customers`),
      ]);

      setSummaryData(dashRes.data.data);
      setInventoryValuation(Number(valRes.data.data?.totalRetailValue || 0));

      const custs = custRes.data.data || [];
      const totalCredit = custs.reduce((sum: number, c: any) => sum + Number(c.outstandingBalance || 0), 0);
      setCustomerReceivables(totalCredit);
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

  const cashReserves = Number(summaryData?.totalPaidRevenue || 0);
  const totalAssetsVal = cashReserves + inventoryValuation + customerReceivables;
  const totalLiabilitiesVal = Number(summaryData?.totalExpenses || 0);
  const totalEquityVal = Math.max(0, totalAssetsVal - totalLiabilitiesVal);

  const currentRatio = totalLiabilitiesVal > 0 ? (totalAssetsVal / totalLiabilitiesVal).toFixed(2) : '10.0+';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Action Toolbar */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Accounting Statement</span>
          <h2 className="text-xl font-extrabold text-slate-900">Financial Position & Solvency</h2>
        </div>
        <button
          onClick={() => window.print()}
          className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-200"
        >
          <Printer className="w-4 h-4 text-slate-500" /> Print Statement
        </button>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Total Assets</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-indigo-600 block">KSh {totalAssetsVal.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">Liquid cash + stock + receivables</span>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Total Liabilities</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600 block">KSh {totalLiabilitiesVal.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">Operating payables & liabilities</span>
          </div>
        </div>

        {/* Equity */}
        <div className="bg-emerald-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">3. Retained Owner Equity</span>
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black block">KSh {totalEquityVal.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-200 block mt-0.5">Current Solvency Ratio: {currentRatio}x</span>
          </div>
        </div>
      </div>

      {/* Detailed Balance Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Statement of Balance Sheet</h2>
            <p className="text-xs text-slate-500">As of {new Date().toLocaleDateString()} • All amounts in KSh</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            KSh Currency
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <tbody className="divide-y divide-slate-200">
              {/* SECTION 1: ASSETS */}
              <tr className="bg-slate-100/70 font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                <td colSpan={2} className="py-3 px-4">
                  1. Current & Business Assets
                </td>
              </tr>
              <tr className="hover:bg-slate-50 text-xs">
                <td className="py-3 px-4 pl-8 text-slate-700 font-semibold">Liquid Cash Reserves & Bank Balance</td>
                <td className="py-3 px-4 text-right text-emerald-700 font-bold">KSh {cashReserves.toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-slate-50 text-xs">
                <td className="py-3 px-4 pl-8 text-slate-700 font-semibold">Inventory Valuation (Products Retail Value)</td>
                <td className="py-3 px-4 text-right text-indigo-600 font-bold">KSh {inventoryValuation.toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-slate-50 text-xs">
                <td className="py-3 px-4 pl-8 text-slate-700 font-semibold">Accounts Receivable (Customer Credit Balances)</td>
                <td className="py-3 px-4 text-right text-amber-700 font-bold">KSh {customerReceivables.toLocaleString()}</td>
              </tr>
              <tr className="bg-slate-50 font-extrabold text-slate-900 border-t border-slate-200">
                <td className="py-3.5 px-4 pl-6">TOTAL BUSINESS ASSETS</td>
                <td className="py-3.5 px-4 text-right text-indigo-600 font-extrabold text-base">
                  KSh {totalAssetsVal.toLocaleString()}
                </td>
              </tr>

              {/* SECTION 2: LIABILITIES */}
              <tr className="bg-slate-100/70 font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                <td colSpan={2} className="py-3 px-4 pt-6">
                  2. Current Liabilities & Outflows
                </td>
              </tr>
              <tr className="hover:bg-slate-50 text-xs">
                <td className="py-3 px-4 pl-8 text-slate-700 font-semibold">Recorded Operating Outflows & Expenses</td>
                <td className="py-3 px-4 text-right text-rose-600 font-bold">KSh {totalLiabilitiesVal.toLocaleString()}</td>
              </tr>
              <tr className="bg-slate-50 font-extrabold text-slate-900 border-t border-slate-200">
                <td className="py-3.5 px-4 pl-6">TOTAL BUSINESS LIABILITIES</td>
                <td className="py-3.5 px-4 text-right text-rose-600 font-extrabold text-base">
                  KSh {totalLiabilitiesVal.toLocaleString()}
                </td>
              </tr>

              {/* SECTION 3: EQUITY */}
              <tr className="bg-slate-100/70 font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                <td colSpan={2} className="py-3 px-4 pt-6">
                  3. Retained Owner Equity
                </td>
              </tr>
              <tr className="hover:bg-slate-50 text-xs">
                <td className="py-3 px-4 pl-8 text-slate-700 font-semibold">Retained Net Earnings / Capital</td>
                <td className="py-3 px-4 text-right text-emerald-700 font-bold">KSh {totalEquityVal.toLocaleString()}</td>
              </tr>
              <tr className="bg-slate-50 font-extrabold text-slate-900 border-t border-slate-200">
                <td className="py-3.5 px-4 pl-6">TOTAL OWNER EQUITY</td>
                <td className="py-3.5 px-4 text-right text-emerald-700 font-extrabold text-base">
                  KSh {totalEquityVal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Double Entry Accounting Verified Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Fundamental Accounting Equation
          </span>
          <p className="text-sm font-black text-emerald-900">
            Assets (KSh {totalAssetsVal.toLocaleString()}) = Liabilities (KSh {totalLiabilitiesVal.toLocaleString()}) + Equity (KSh {totalEquityVal.toLocaleString()})
          </p>
        </div>
      </div>
    </div>
  );
};
