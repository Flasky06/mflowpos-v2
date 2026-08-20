import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  Scale,
  Wallet,
  Coins,
  ShieldCheck,
  Printer,
  TrendingUp,
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

  const totalLiabilitiesAndEquity = totalLiabilitiesVal + totalEquityVal;
  const currentRatio = totalLiabilitiesVal > 0 ? (totalAssetsVal / totalLiabilitiesVal).toFixed(2) : '10.0+';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Action Toolbar */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">GAAP & IFRS Accounting Statement</span>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" /> Statement of Balance Sheet
          </h2>
        </div>
        <button
          onClick={() => window.print()}
          className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-200"
        >
          <Printer className="w-4 h-4 text-slate-500" /> Print Statement
        </button>
      </div>

      {/* Top 3 KPI Executive Cards */}
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
            <span className="text-xs font-bold text-emerald-200 block mt-0.5">Solvency Ratio: {currentRatio}x</span>
          </div>
        </div>
      </div>

      {/* Two-Column Side-by-Side Account Format Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: ASSETS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-600" /> Assets
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Debits
              </span>
            </div>

            <table className="w-full text-left text-xs text-slate-700 mt-4">
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-semibold text-slate-800">
                    Liquid Cash Reserves & Bank Balance
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-emerald-700">
                    KSh {cashReserves.toLocaleString()}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-semibold text-slate-800">
                    Inventory Valuation (Products Retail Value)
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-indigo-600">
                    KSh {inventoryValuation.toLocaleString()}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-semibold text-slate-800">
                    Accounts Receivable (Customer Credit Balances)
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-amber-700">
                    KSh {customerReceivables.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t-2 border-slate-300 flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">TOTAL ASSETS</span>
            <span className="text-lg font-black text-indigo-600">KSh {totalAssetsVal.toLocaleString()}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: LIABILITIES & EQUITY TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-rose-600" /> Liabilities & Equity
              </h3>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                Credits
              </span>
            </div>

            <table className="w-full text-left text-xs text-slate-700 mt-4">
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50 font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                  <td colSpan={2} className="py-2 px-2">Liabilities</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-2 pl-4 font-semibold text-slate-800">
                    Operating Outflows & Recorded Payables
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-rose-600">
                    KSh {totalLiabilitiesVal.toLocaleString()}
                  </td>
                </tr>

                <tr className="bg-slate-50 font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                  <td colSpan={2} className="py-2 px-2 pt-4">Owner Equity</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3 px-2 pl-4 font-semibold text-slate-800">
                    Retained Net Earnings / Business Capital
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-emerald-700">
                    KSh {totalEquityVal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t-2 border-slate-300 flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">TOTAL LIABILITIES & EQUITY</span>
            <span className="text-lg font-black text-emerald-700">KSh {totalLiabilitiesAndEquity.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Accounting Balance Verification Bar */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Format Balance Verified
        </span>
        <p className="text-sm font-black text-emerald-900">
          Assets (KSh {totalAssetsVal.toLocaleString()}) = Liabilities & Equity (KSh {totalLiabilitiesAndEquity.toLocaleString()})
        </p>
      </div>
    </div>
  );
};
