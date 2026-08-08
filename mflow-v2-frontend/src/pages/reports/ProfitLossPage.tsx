import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  FileSpreadsheet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const ProfitLossPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchProfitLoss = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [dashRes, expRes] = await Promise.all([
        apiClient.get(`/reports/dashboard${shopQuery}`),
        apiClient.get(`/expenses${shopQuery}`),
      ]);

      setSummaryData(dashRes.data.data);
      const expArr = expRes.data.data?.expenses || expRes.data.data || [];
      setExpenses(Array.isArray(expArr) ? expArr : []);
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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Statement of Profit & Loss
          </h1>
          <p className="text-sm text-slate-500">Income statement summarizing revenues, expenses, and net profit margin</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Period:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
          />
          <span className="text-slate-300">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profit & Loss Performance Report</h2>
            <p className="text-xs text-slate-500 mt-0.5">Financial totals in Kenya Shillings (KSh)</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            KSh Currency
          </span>
        </div>

        <table className="w-full text-left text-sm text-slate-700">
          <tbody className="divide-y divide-slate-200">
            <tr className="bg-slate-50 font-bold text-slate-900">
              <td className="py-4 px-4">1. Gross Revenue (Total Sales)</td>
              <td className="py-4 px-4 text-right text-indigo-600 font-extrabold text-base">
                KSh {summaryData ? Number(summaryData.totalSalesRevenue).toLocaleString() : '0.00'}
              </td>
            </tr>

            <tr className="hover:bg-slate-50">
              <td className="py-3.5 px-4 pl-8 text-slate-600">Collected Cash Revenue</td>
              <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">
                KSh {summaryData ? Number(summaryData.totalPaidRevenue).toLocaleString() : '0.00'}
              </td>
            </tr>

            <tr className="bg-slate-50 font-bold text-slate-900">
              <td className="py-4 px-4">2. Operating Expenses & Outflows</td>
              <td className="py-4 px-4 text-right text-rose-600 font-extrabold text-base">
                - KSh {summaryData ? Number(summaryData.totalExpenses).toLocaleString() : '0.00'}
              </td>
            </tr>

            {expenses.map((exp, idx) => (
              <tr key={idx} className="hover:bg-slate-50 text-xs">
                <td className="py-2.5 px-4 pl-8 text-slate-600">
                  {exp.description || exp.category || 'General Expense'}
                </td>
                <td className="py-2.5 px-4 text-right text-rose-700 font-medium">
                  - KSh {Number(exp.amount).toLocaleString()}
                </td>
              </tr>
            ))}

            <tr className="bg-indigo-50/70 font-extrabold text-slate-900 border-t-2 border-indigo-200">
              <td className="py-4 px-4 text-base flex items-center gap-2">
                {summaryData?.netProfit >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-rose-600" />
                )}
                Net Business Profit
              </td>
              <td
                className={`py-4 px-4 text-right text-xl ${
                  summaryData?.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                KSh {summaryData ? Number(summaryData.netProfit).toLocaleString() : '0.00'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
