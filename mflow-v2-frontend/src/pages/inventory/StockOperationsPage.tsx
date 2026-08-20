import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  Package,
  Plus,
  Search,
  ArrowLeftRight,
  RotateCcw,
  Sliders,
  CheckCircle2,
  X,
  AlertTriangle,
  Building2,
} from 'lucide-react';

export const StockOperationsPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<'SNAPSHOT' | 'TRANSFERS' | 'RETURNS'>('SNAPSHOT');
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Stock Adjustment / Count Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    newQuantity: 0,
    reason: 'Manual Stock Count / Adjustment',
  });

  // Stock Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    toShopId: '',
    productId: '',
    quantity: 1,
    notes: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, shopRes, transRes, retRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/business/shops'),
        apiClient.get('/stocks/transfers').catch(() => ({ data: { data: [] } })),
        apiClient.get('/stocks/returns').catch(() => ({ data: { data: [] } })),
      ]);

      setProducts(prodRes.data.data || []);
      setShops(shopRes.data.data || []);
      setTransfers(transRes.data.data || []);
      setReturns(retRes.data.data || []);
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load stock data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeShopId]);

  // Handle Stock Count Adjustment
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !activeShopId) return;

    try {
      await apiClient.post('/stocks/adjust', {
        shopId: activeShopId,
        productId: selectedProduct.id,
        quantity: Number(adjustForm.newQuantity),
        reason: adjustForm.reason,
      });

      addToast({
        type: 'success',
        title: 'Stock Updated',
        message: `Set '${selectedProduct.name}' stock level to ${adjustForm.newQuantity}`,
      });

      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Stock adjustment failed.';
      addToast({ type: 'error', title: 'Adjustment Error', message: msg });
    }
  };

  // Handle Stock Transfer Submit
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.toShopId || !transferForm.productId) {
      addToast({ type: 'warning', title: 'Missing Info', message: 'Please select target branch and product' });
      return;
    }

    try {
      await apiClient.post('/stocks/transfer', {
        fromShopId: activeShopId,
        toShopId: transferForm.toShopId,
        productId: transferForm.productId,
        quantity: Number(transferForm.quantity),
        notes: transferForm.notes,
      });

      addToast({ type: 'success', title: 'Transfer Issued', message: 'Stock transfer recorded' });
      setIsTransferModalOpen(false);
      setTransferForm({ toShopId: '', productId: '', quantity: 1, notes: '' });
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Stock transfer failed.';
      addToast({ type: 'error', title: 'Transfer Error', message: msg });
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" /> New Stock Transfer
          </button>
        </div>
      </div>

      {/* Tabs Bar (v1 Navigation) */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('SNAPSHOT')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SNAPSHOT' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" /> Stock Snapshot & Stock Taking ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('TRANSFERS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TRANSFERS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" /> Stock Transfers ({transfers.length})
        </button>

        <button
          onClick={() => setActiveTab('RETURNS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RETURNS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-4 h-4" /> Stock Returns ({returns.length})
        </button>
      </div>

      {/* TAB 1: STOCK SNAPSHOT & STOCK TAKING */}
      {activeTab === 'SNAPSHOT' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product inventory by name, SKU, or barcode..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 pl-10 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 text-center">Unit Price</th>
                  <th className="py-3.5 px-4 text-center">Current Quantity</th>
                  <th className="py-3.5 px-4 text-center">Min Threshold</th>
                  <th className="py-3.5 px-4 text-center">Stock Count Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No stock records found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const stock = p.stocks?.find((s: any) => s.shopId === activeShopId);
                    const qty = stock ? stock.quantity : 0;
                    const minLevel = p.minStockLevel || 5;
                    const isLow = qty <= minLevel;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                          KSh {Number(p.sellingPrice).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-extrabold rounded-lg ${
                              isLow
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {qty} {p.unit || 'units'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">{minLevel}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setAdjustForm({
                                newQuantity: qty,
                                reason: 'Manual Stock Count / Adjustment',
                              });
                              setIsAdjustModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Adjust / Count Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK TRANSFERS */}
      {activeTab === 'TRANSFERS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Transfer Date</th>
                  <th className="py-3.5 px-4">Source Branch</th>
                  <th className="py-3.5 px-4">Destination Branch</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No stock transfers recorded.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{t.fromShop?.name || 'Main Branch'}</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600">{t.toShop?.name || 'Branch'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                          {t.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK RETURNS */}
      {activeTab === 'RETURNS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      No stock returns recorded.
                    </td>
                  </tr>
                ) : (
                  returns.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{r.reason || 'Damaged Item Return'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                          LOGGED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT / STOCK COUNT MODAL */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Stock Count Adjustment</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
              <span className="text-xs font-bold text-indigo-900">{selectedProduct.name}</span>
              <p className="text-[11px] text-indigo-700">Updating inventory count level for active branch</p>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">New Actual Quantity Count *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustForm.newQuantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, newQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Physical Count Audit"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Update Stock Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STOCK TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">New Inter-Branch Stock Transfer</h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Select Product *</label>
                <select
                  required
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Choose Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Destination Branch *</label>
                <select
                  required
                  value={transferForm.toShopId}
                  onChange={(e) => setTransferForm({ ...transferForm, toShopId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Choose Target Branch</option>
                  {shops
                    .filter((s) => s.id !== activeShopId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Quantity to Transfer *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Issue Stock Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
