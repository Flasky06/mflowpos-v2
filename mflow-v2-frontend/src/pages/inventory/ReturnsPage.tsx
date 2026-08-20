import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Plus, X } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [returns, setReturns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [returnForm, setReturnForm] = useState({
    productId: '',
    quantity: '1',
    returnType: 'CUSTOMER_RETURN',
    reason: 'Customer requested refund',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [retRes, prodRes] = await Promise.all([
        apiClient.get('/stock-returns'),
        apiClient.get('/products'),
      ]);
      setReturns(retRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeShopId]);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShopId) {
      addToast({ type: 'error', title: 'No Branch Selected', message: 'Select an active branch for stock return' });
      return;
    }

    try {
      await apiClient.post('/stock-returns', {
        shopId: activeShopId,
        productId: returnForm.productId,
        quantity: parseInt(returnForm.quantity, 10),
        returnType: returnForm.returnType,
        reason: returnForm.reason,
        notes: returnForm.notes || undefined,
      });

      addToast({ type: 'success', title: 'Return Processed', message: 'Stock return recorded and inventory updated' });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Return Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">

        <button
          onClick={() => {
            setReturnForm({
              productId: '',
              quantity: '1',
              returnType: 'CUSTOMER_RETURN',
              reason: 'Customer requested refund',
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Record Return
        </button>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Return #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Return Type</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4 text-center">Returned Qty</th>
              <th className="py-3 px-4">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No stock returns recorded yet.
                </td>
              </tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{r.returnNumber}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold ${
                        r.returnType === 'CUSTOMER_RETURN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {r.returnType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{r.product?.name}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">{r.quantity}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{r.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Stock Return</h3>

            <form onSubmit={handleCreateReturn} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Return Type</label>
                <select
                  value={returnForm.returnType}
                  onChange={(e) => setReturnForm({ ...returnForm, returnType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="CUSTOMER_RETURN">Customer Return (Restock item)</option>
                  <option value="SUPPLIER_RETURN">Supplier Return (Vendor send-back)</option>
                  <option value="DAMAGED_EXPIRED">Damaged / Expired Write-off</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product</label>
                <select
                  required
                  value={returnForm.productId}
                  onChange={(e) => setReturnForm({ ...returnForm, productId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm({ ...returnForm, quantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                  placeholder="Defective packaging"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Save Stock Return
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
