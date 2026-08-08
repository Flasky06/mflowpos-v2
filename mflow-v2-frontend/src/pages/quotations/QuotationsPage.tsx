import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { ArrowRight } from 'lucide-react';

export const QuotationsPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [quotations, setQuotations] = useState<any[]>([]);

  const fetchQuotations = async () => {
    try {
      const res = await apiClient.get(`/quotations${activeShopId ? `?shopId=${activeShopId}` : ''}`);
      setQuotations(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [activeShopId]);

  const handleConvert = async (id: string) => {
    try {
      await apiClient.post(`/quotations/${id}/convert`);
      addToast({ type: 'success', title: 'Quotation Converted', message: 'Estimate converted to active sale & stock deducted' });
      fetchQuotations();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Conversion Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pro-forma Quotations & Estimates</h1>
          <p className="text-sm text-slate-500">Generate estimates and convert accepted quotes into POS sales in 1-click</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Quotation #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {quotations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No quotations created yet.
                </td>
              </tr>
            ) : (
              quotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{q.quotationNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{q.customer?.name || 'Prospect'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    KSh {Number(q.totalAmount).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold ${
                        q.status === 'CONVERTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {q.status !== 'CONVERTED' && (
                      <button
                        onClick={() => handleConvert(q.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 mx-auto shadow-xs"
                      >
                        Convert to Sale
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
