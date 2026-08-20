import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  FileSpreadsheet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  PieChart,
  Printer,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const ProfitLossPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [presetPeriod, setPresetPeriod] = useState<'30d' | '7d' | 'month' | 'year' | 'custom'>('30d');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const applyPresetDate = (preset: '30d' | '7d' | 'month' | 'year') => {
    setPresetPeriod(preset);
    const now = new Date();
    let start = new Date();

    if (preset === '7d') {
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === '30d') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const fetchProfitLoss = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [dashRes, expRes, catRes] = await Promise.all([
        apiClient.get(`/reports/dashboard${shopQuery}`),
        apiClient.get(`/expenses${shopQuery}`),
        apiClient.get(`/expenses/categories`),
      ]);

      setSummaryData(dashRes.data.data);
      const expArr = expRes.data.data?.expenses || expRes.data.data || [];
      setExpenses(Array.isArray(expArr) ? expArr : []);
      setCategories(catRes.data.data || []);
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load Profit & Loss statement' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, [activeShopId, startDate, endDate]);

  const totalSalesRevenue = Number(summaryData?.totalSalesRevenue || 0);
  const totalPaidRevenue = Number(summaryData?.totalPaidRevenue || 0);
  const totalExpenses = Number(summaryData?.totalExpenses || 0);
  const netProfit = Number(summaryData?.netProfit || totalPaidRevenue - totalExpenses);
  const creditOutstanding = Math.max(0, totalSalesRevenue - totalPaidRevenue);
  const netMarginPercent = totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(1) : '0.0';

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach((exp) => {
    const catName = exp.category?.name || exp.category || 'General Operating';
    expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Number(exp.amount || 0);
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Date Filter & Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        {/* Preset Period Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 flex-wrap">
          <button
            onClick={() => applyPresetDate('7d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              presetPeriod === '7d' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => applyPresetDate('30d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              presetPeriod === '30d' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => applyPresetDate('month')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              presetPeriod === 'month' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => applyPresetDate('year')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              presetPeriod === 'year' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Year
          </button>
        </div>

        {/* Custom Date Pickers & Print Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Period:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPresetPeriod('custom');
                setStartDate(e.target.value);
              }}
              className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
            />
            <span className="text-slate-300">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPresetPeriod('custom');
                setEndDate(e.target.value);
              }}
              className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-200"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Print Report
          </button>
        </div>
      </div>

      {/* Top Metric Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales Revenue</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 block">KSh {totalSalesRevenue.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">Total Invoiced Sales</span>
          </div>
        </div>

        {/* Card 2: Cash Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collected Cash Income</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-700 block">KSh {totalPaidRevenue.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">Realized Liquid Cash</span>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Expenses</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 block">KSh {totalExpenses.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">Operational Cash Outflows</span>
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div
          className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden ${
            netProfit >= 0 ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-rose-900 text-white border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Net Income & Margin</span>
            <div className="p-2 bg-white/10 rounded-xl text-white">
              {netProfit >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black block">KSh {netProfit.toLocaleString()}</span>
            <span className="text-xs font-bold opacity-90 block mt-0.5">
              Net Profit Margin: <span className="underline decoration-white/40">{netMarginPercent}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Income Statement Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Statement of Profit & Loss</h2>
            <p className="text-xs text-slate-500">Period: {startDate} to {endDate} • All amounts in KSh</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                netProfit > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : netProfit === 0
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {netProfit > 0 ? 'HEALTHY PROFIT' : netProfit === 0 ? 'BREAK EVEN' : 'OPERATING LOSS'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <tbody className="divide-y divide-slate-200">
              {/* SECTION A: REVENUE */}
              <tr className="bg-slate-100/70 font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                <td colSpan={2} className="py-3 px-4">
                  A. Gross Revenue & Inflow Operations
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3.5 px-4 pl-6 text-slate-800 font-bold">Total Invoiced Sales Revenue</td>
                <td className="py-3.5 px-4 text-right text-indigo-600 font-extrabold text-base">
                  KSh {totalSalesRevenue.toLocaleString()}
                </td>
              </tr>

              <tr className="hover:bg-slate-50 text-xs">
                <td className="py-2.5 px-4 pl-10 text-slate-600">Collected Cash & Digital Payments</td>
                <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                  KSh {totalPaidRevenue.toLocaleString()}
                </td>
              </tr>

              <tr className="hover:bg-slate-50 text-xs">
                <td className="py-2.5 px-4 pl-10 text-slate-600">Uncollected Customer Credit Sales (Accounts Receivable)</td>
                <td className="py-2.5 px-4 text-right text-amber-700 font-bold">
                  KSh {creditOutstanding.toLocaleString()}
                </td>
              </tr>

              {/* SECTION B: OPERATING EXPENSES */}
              <tr className="bg-slate-100/70 font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                <td colSpan={2} className="py-3 px-4 pt-6">
                  B. Operating Outflows & Category Expenses
                </td>
              </tr>

              {Object.keys(expensesByCategory).length === 0 ? (
                <tr className="hover:bg-slate-50 text-xs">
                  <td className="py-3 px-4 pl-10 text-slate-400 italic">No operating expenses recorded for this period.</td>
                  <td className="py-3 px-4 text-right text-slate-400 font-medium">KSh 0.00</td>
                </tr>
              ) : (
                Object.entries(expensesByCategory).map(([catName, amount], idx) => {
                  const percentOfExpenses = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="hover:bg-slate-50 text-xs">
                      <td className="py-3 px-4 pl-10 text-slate-700 font-semibold flex items-center justify-between">
                        <span>{catName}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                          {percentOfExpenses}% of total
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700 font-bold">
                        - KSh {amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}

              <tr className="bg-slate-50 font-extrabold text-slate-900 border-t border-slate-200">
                <td className="py-3.5 px-4 pl-6 text-slate-800">Total Operating Expenses Outflow</td>
                <td className="py-3.5 px-4 text-right text-rose-600 font-extrabold text-base">
                  - KSh {totalExpenses.toLocaleString()}
                </td>
              </tr>

              {/* SECTION C: NET OPERATING PROFIT */}
              <tr className="bg-indigo-50/80 font-extrabold text-slate-900 border-t-2 border-indigo-300">
                <td className="py-4 px-4 text-base flex items-center gap-2">
                  {netProfit >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>Net Operating Income / Profit</span>
                </td>
                <td
                  className={`py-4 px-4 text-right text-xl font-black ${
                    netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  KSh {netProfit.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
