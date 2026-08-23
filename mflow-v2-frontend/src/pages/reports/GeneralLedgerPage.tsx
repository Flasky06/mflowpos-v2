import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { BookOpen, Calendar, Search } from 'lucide-react';

export const GeneralLedgerPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [salesList, setSalesList] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLedgerData = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [salesRes, expRes] = await Promise.all([
        apiClient.get(`/sales${shopQuery}`),
        apiClient.get(`/expenses${shopQuery}`),
      ]);

      const salesArr = salesRes.data.data?.sales || salesRes.data.data || [];
      setSalesList(Array.isArray(salesArr) ? salesArr : []);

      const expArr = expRes.data.data?.expenses || expRes.data.data || [];
      setExpenses(Array.isArray(expArr) ? expArr : []);
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load general ledger' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [activeShopId, startDate, endDate]);

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

  const filteredEntries = ledgerEntries.filter(
    (e) =>
      e.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.accountCode.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Date Filter Bar */}
      <div className="flex justify-end pb-4 border-b border-slate-200">
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
          <button
            onClick={fetchLedgerData}
            className="ml-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-200">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ledger by account name, code, or description..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 pl-9 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <span className="text-xs font-bold text-slate-600">
            {filteredEntries.length} Total Audit Entries
          </span>
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
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No general ledger entries found for this period.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 text-xs">
                    <td className="py-3 px-4 font-mono text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{entry.accountCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{entry.accountName}</td>
                    <td className="py-3 px-4 text-slate-600">{entry.description}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {entry.debit > 0 ? `KES ${entry.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {entry.credit > 0 ? `KES ${entry.credit.toLocaleString()}` : '-'}
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
