import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  FileSpreadsheet,
  BookOpen,
  Scale,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<'PROFIT_LOSS' | 'GENERAL_LEDGER' | 'BALANCE_SHEET'>('PROFIT_LOSS');
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchFinancialReports = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [dashRes, salesRes, expRes] = await Promise.all([
        apiClient.get(`/reports/dashboard${shopQuery}`),
        apiClient.get(`/sales${shopQuery}`),
        apiClient.get(`/expenses${shopQuery}`),
      ]);

      setSummaryData(dashRes.data.data);
      const salesArr = salesRes.data.data?.sales || salesRes.data.data || [];
      setSalesList(Array.isArray(salesArr) ? salesArr : []);

      const expArr = expRes.data.data?.expenses || expRes.data.data || [];
      setExpenses(Array.isArray(expArr) ? expArr : []);
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load financial reports' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialReports();
  }, [activeShopId, startDate, endDate]);

  // General Ledger Line Items calculation
  const ledgerEntries = [
    ...salesList.map((s) => ({
      id: s.id,
      date: s.createdAt,
      type: 'INCOME',
      accountCode: '4001',
      accountName: 'Sales Revenue Account',
      description: `POS Sale Receipt ${s.receiptNumber || s.id.substring(0, 8)}`,
      debit: 0,
      credit: Number(s.totalAmount || 0),
    })),
    ...expenses.map((e) => ({
      id: e.id,
      date: e.createdAt || e.expenseDate,
      type: 'EXPENSE',
      accountCode: '5001',
      accountName: `Operating Expense (${e.category || 'General'})`,
      description: e.description || 'Business Outflow',
      debit: Number(e.amount || 0),
      credit: 0,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Balance Sheet Financial Math
  const totalAssetsVal = summaryData ? Number(summaryData.totalPaidRevenue || 0) : 0;
  const totalLiabilitiesVal = summaryData ? Number(summaryData.totalExpenses || 0) : 0;
  const totalEquityVal = Math.max(0, totalAssetsVal - totalLiabilitiesVal);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Financial Reports Hub
          </h1>
          <p className="text-sm text-slate-500">v1 Statements of Profit & Loss, General Ledger, and Balance Sheet</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Date Period:
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

      {/* Financial Reports Navigation Tabs (ONLY Profit & Loss, General Ledger, Balance Sheet) */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs gap-2">
        <button
          onClick={() => setActiveTab('PROFIT_LOSS')}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PROFIT_LOSS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> 1. Profit & Loss Statement
        </button>

        <button
          onClick={() => setActiveTab('GENERAL_LEDGER')}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'GENERAL_LEDGER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" /> 2. General Ledger ({ledgerEntries.length})
        </button>

        <button
          onClick={() => setActiveTab('BALANCE_SHEET')}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BALANCE_SHEET' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Scale className="w-4 h-4" /> 3. Balance Sheet
        </button>
      </div>

      {/* 1. PROFIT & LOSS STATEMENT */}
      {activeTab === 'PROFIT_LOSS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Statement of Profit & Loss</h2>
              <p className="text-xs text-slate-500 mt-1">Operating income statement summarizing revenues, expenses, and net margin</p>
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

              {expenses.slice(0, 5).map((exp, idx) => (
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
      )}

      {/* 2. GENERAL LEDGER */}
      {activeTab === 'GENERAL_LEDGER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">General Ledger Transaction Audit</h3>
            <span className="text-xs text-slate-500 font-semibold">{ledgerEntries.length} Total Audit Entries</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Account Code</th>
                  <th className="py-3.5 px-4">Account Title</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Debit (Dr)</th>
                  <th className="py-3.5 px-4 text-right">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No general ledger entries found for this period.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 text-xs">
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{entry.accountCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{entry.accountName}</td>
                      <td className="py-3 px-4 text-slate-600">{entry.description}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {entry.debit > 0 ? `KSh ${entry.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {entry.credit > 0 ? `KSh ${entry.credit.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BALANCE SHEET */}
      {activeTab === 'BALANCE_SHEET' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Statement of Balance Sheet</h2>
            <p className="text-xs text-slate-500 mt-1">Summary of business assets, liabilities, and owner equity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assets */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Total Assets</span>
              <span className="text-2xl font-extrabold text-indigo-600 block">
                KSh {totalAssetsVal.toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500">Cash, receivables & inventory</p>
            </div>

            {/* Liabilities */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">2. Total Liabilities</span>
              <span className="text-2xl font-extrabold text-rose-600 block">
                KSh {totalLiabilitiesVal.toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500">Operating payables & outflows</p>
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
              Balance Sheet Accounting Equation
            </span>
            <p className="text-sm font-extrabold text-emerald-900 mt-1">
              Assets (KSh {totalAssetsVal.toLocaleString()}) = Liabilities (KSh {totalLiabilitiesVal.toLocaleString()}) + Equity (KSh {totalEquityVal.toLocaleString()})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
