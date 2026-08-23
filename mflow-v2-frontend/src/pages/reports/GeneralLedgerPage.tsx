import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Pagination } from '../../components/common/Pagination';
import { BookOpen, Calendar, Search, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';

export const GeneralLedgerPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLedgerData = async () => {
    setIsLoading(true);
    try {
      const dateQuery = `startDate=${startDate}&endDate=${endDate}`;
      const shopQuery = activeShopId ? `&shopId=${activeShopId}` : '';

      const [salesRes, expRes] = await Promise.all([
        apiClient.get(`/sales?${dateQuery}${shopQuery}`),
        apiClient.get(`/expenses?${dateQuery}${shopQuery}`),
      ]);

      const sales = salesRes.data.data?.sales || salesRes.data.data || [];
      const expenses = expRes.data.data?.expenses || expRes.data.data || [];

      const entries: any[] = [];
      let debitTotal = 0;
      let creditTotal = 0;

      // Map Sales to Revenue Ledger Entries (Credit: Sales Revenue, Debit: Cash/Bank)
      sales.forEach((s: any) => {
        const amt = Number(s.totalAmount || 0);
        creditTotal += amt;
        entries.push({
          id: `sale-${s.id}`,
          date: s.createdAt,
          accountCode: '4000',
          accountName: 'Sales Revenue',
          description: `Sale Receipt #${s.receiptNumber || s.id.substring(0, 8)}`,
          debit: 0,
          credit: amt,
        });
      });

      // Map Expenses to Operating Expense Ledger Entries (Debit: Expense, Credit: Cash/Bank)
      expenses.forEach((e: any) => {
        const amt = Number(e.amount || 0);
        debitTotal += amt;
        entries.push({
          id: `exp-${e.id}`,
          date: e.createdAt || e.expenseDate,
          accountCode: '5000',
          accountName: e.category?.name || 'Operating Expenses',
          description: e.title,
          debit: amt,
          credit: 0,
        });
      });

      // Sort by date descending
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setLedgerEntries(entries);
      setSummary({ totalDebit: debitTotal, totalCredit: creditTotal });
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Ledger Error', message: 'Failed to load general ledger audit entries' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [activeShopId, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const filteredEntries = ledgerEntries.filter(
    (e) =>
      e.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Main Ledger Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        {/* Unified Search & Date Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
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

            {/* Date Range Picker */}
            <div className="flex items-center bg-slate-50 border border-slate-300 p-1 rounded-xl shrink-0">
              <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              </span>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (val && endDate && val > endDate) setEndDate(val);
                }}
                className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
              />
              <span className="text-slate-300">-</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndDate(val);
                  if (val && startDate && val < startDate) setStartDate(val);
                }}
                className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
              />
              <button
                onClick={fetchLedgerData}
                className="ml-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                Filter
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer print:hidden"
              title="Print General Ledger Statement (Standard Printer)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print Statement
            </button>
            <span className="text-xs font-bold text-slate-600 shrink-0">
              {filteredEntries.length} Total Audit Entries
            </span>
          </div>
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
                paginatedEntries.map((entry) => (
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEntries.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
