import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { ThermalReceiptModal } from '../../components/sales/ThermalReceiptModal';
import { generateThermalReceipt } from '../../utils/thermalReceipt';
import { VoidSaleModal } from '../../components/sales/VoidSaleModal';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Search, Printer, Ban, Receipt, CheckCircle2 } from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [sales, setSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Reusable Void Sale Modal State
  const [voidSaleTarget, setVoidSaleTarget] = useState<{ id: string; receiptNumber: string } | null>(null);

  const fetchSales = async () => {
    try {
      const res = await apiClient.get(`/sales${activeShopId ? `?shopId=${activeShopId}` : ''}`);
      setSales(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [activeShopId]);

  const handleUpdateServiceStatus = async (saleId: string, status: string) => {
    try {
      await apiClient.put(`/sales/${saleId}/service-status`, { status });
      addToast({ type: 'success', title: 'Service Status Updated', message: `Job status set to ${status}` });
      fetchSales();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Error', message: err.response?.data?.message || 'Failed to update status' });
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Thermal Receipt Print Modal */}
      {ThermalReceiptModal && (
        <ThermalReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receiptPayload={selectedReceipt || ''}
        />
      )}

      {/* Reusable Void Sale Modal */}
      <VoidSaleModal
        isOpen={!!voidSaleTarget}
        onClose={() => setVoidSaleTarget(null)}
        saleId={voidSaleTarget?.id || null}
        receiptNumber={voidSaleTarget?.receiptNumber || null}
        onSuccess={fetchSales}
      />

      {/* Reusable Page Header */}
      <PageHeader
        title="All Sales & Transactions History"
        description="Audit completed retail POS receipts, service order progress, and void transactions"
        icon={<Receipt className="w-6 h-6 text-indigo-600" />}
      />

      {/* Search & Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <SearchInput
          value={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search by receipt number or customer name..."
          className="max-w-md"
        />

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-center">Payment Method</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Date & Time</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions found matching filter.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isCancelled = sale.status === 'CANCELLED';
                  const paymentMethod = sale.payments?.[0]?.paymentMethod || 'CASH';

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{sale.receiptNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {sale.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isCancelled ? 'rose' : 'emerald'}>
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        KSh {Number(sale.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedReceipt(generateThermalReceipt(sale))}
                            title="Re-Print Thermal Receipt"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                          >
                            <Printer className="w-4 h-4 text-indigo-600" />
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => setVoidSaleTarget({ id: sale.id, receiptNumber: sale.receiptNumber })}
                              title="Void Transaction"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
