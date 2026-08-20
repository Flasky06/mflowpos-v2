import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Plus, X } from 'lucide-react';

export const TransfersPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [transfers, setTransfers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [transferForm, setTransferForm] = useState({
    sourceShopId: '',
    targetShopId: '',
    productId: '',
    quantity: '1',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [trfRes, shopRes, prodRes] = await Promise.all([
        apiClient.get('/transfers'),
        apiClient.get('/business/shops'),
        apiClient.get('/products'),
      ]);
      setTransfers(trfRes.data.data || []);
      setShops(shopRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeShopId]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.sourceShopId || !transferForm.targetShopId || !transferForm.productId) {
      addToast({ type: 'warning', title: 'Missing Details', message: 'Select source, target branch, and product' });
      return;
    }

    try {
      await apiClient.post('/transfers', {
        sourceShopId: transferForm.sourceShopId,
        targetShopId: transferForm.targetShopId,
        items: [
          {
            productId: transferForm.productId,
            quantity: parseInt(transferForm.quantity, 10),
          },
        ],
        notes: transferForm.notes || undefined,
      });

      addToast({ type: 'success', title: 'Transfer Completed', message: 'Inventory transferred between branches' });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Transfer Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">

        <button
          onClick={() => {
            setTransferForm({
              sourceShopId: activeShopId || '',
              targetShopId: '',
              productId: '',
              quantity: '1',
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Transfer Stock
        </button>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Transfer #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">From Branch</th>
              <th className="py-3 px-4">To Branch</th>
              <th className="py-3 px-4">Transferred Items</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No inter-shop stock transfers recorded yet.
                </td>
              </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{t.transferNumber}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{t.sourceShop?.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">{t.targetShop?.name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {t.items?.map((i: any) => `${i.product?.name} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t.status}
                    </span>
                  </td>
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">Transfer Inventory Stock</h3>

            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Source Branch (From)</label>
                <select
                  required
                  value={transferForm.sourceShopId}
                  onChange={(e) => setTransferForm({ ...transferForm, sourceShopId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="">Select Source Shop</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Branch (To)</label>
                <select
                  required
                  value={transferForm.targetShopId}
                  onChange={(e) => setTransferForm({ ...transferForm, targetShopId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="">Select Target Shop</option>
                  {shops
                    .filter((s) => s.id !== transferForm.sourceShopId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product</label>
                <select
                  required
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
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
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Execute Stock Transfer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
