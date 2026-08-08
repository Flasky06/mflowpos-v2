import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  FileText,
  Building2,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PURCHASE_ORDERS'>('DIRECTORY');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [poFilter, setPoFilter] = useState<'ALL' | 'PENDING' | 'RECEIVED'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // Purchase Order Create Modal State
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [supRes, poRes, prodRes] = await Promise.all([
        apiClient.get('/suppliers').catch(() => apiClient.get('/purchases/suppliers')),
        apiClient.get('/purchase-orders').catch(() => apiClient.get('/purchases/orders')),
        apiClient.get('/products'),
      ]);

      setSuppliers(supRes.data?.data || []);
      setPurchaseOrders(poRes.data?.data || []);
      setProducts(prodRes.data?.data?.products || prodRes.data?.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeShopId]);

  // Handle Supplier Save
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      addToast({ type: 'warning', title: 'Missing Name', message: 'Supplier name is required' });
      return;
    }

    try {
      if (editingSupplier) {
        await apiClient.put(`/suppliers/${editingSupplier.id}`, supplierForm).catch(() => apiClient.put(`/purchases/suppliers/${editingSupplier.id}`, supplierForm));
        addToast({ type: 'success', title: 'Supplier Updated', message: `Updated '${supplierForm.name}'` });
      } else {
        await apiClient.post('/suppliers', supplierForm).catch(() => apiClient.post('/purchases/suppliers', supplierForm));
        addToast({ type: 'success', title: 'Supplier Created', message: `Created supplier '${supplierForm.name}'` });
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      setSupplierForm({ name: '', phone: '', email: '', address: '', notes: '' });
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save supplier.';
      addToast({ type: 'error', title: 'Save Error', message: msg });
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete supplier '${name}'?`)) return;
    try {
      await apiClient.delete(`/suppliers/${id}`).catch(() => apiClient.delete(`/purchases/suppliers/${id}`));
      addToast({ type: 'success', title: 'Deleted', message: `Supplier '${name}' removed` });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete supplier' });
    }
  };

  // Handle Receive Stock Delivery
  const handleReceiveOrder = async (id: string, poNum: string) => {
    if (!window.confirm(`Confirm receipt of Purchase Order '${poNum}' into branch inventory?`)) return;

    try {
      await apiClient.put(`/purchase-orders/${id}/receive`).catch(() => apiClient.put(`/purchases/orders/${id}/receive`));
      addToast({ type: 'success', title: 'Stock Delivery Received', message: `Order '${poNum}' items added to inventory stock!` });
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to receive order';
      addToast({ type: 'error', title: 'Receive Error', message: msg });
    }
  };

  // Handle PO Creation
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) {
      addToast({ type: 'warning', title: 'Missing Supplier', message: 'Please select a supplier' });
      return;
    }
    if (poItems.length === 0) {
      addToast({ type: 'warning', title: 'Empty Items', message: 'Add at least one product item to purchase order' });
      return;
    }

    try {
      await apiClient.post('/purchase-orders', {
        supplierId: poSupplierId,
        items: poItems,
        notes: poNotes,
      }).catch(() => apiClient.post('/purchases/orders', {
        supplierId: poSupplierId,
        items: poItems,
        notes: poNotes,
      }));

      addToast({ type: 'success', title: 'Purchase Order Created', message: 'Order created in PENDING status' });
      setIsPOModalOpen(false);
      setPoSupplierId('');
      setPoNotes('');
      setPoItems([]);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'PO Error', message: err.response?.data?.message || 'Failed to create order' });
    }
  };

  const addPOItemRow = () => {
    if (products.length === 0) return;
    const p = products[0];
    setPoItems([...poItems, { productId: p.id, quantity: 1, unitCost: Number(p.buyingPrice || p.costPrice || 0) }]);
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingPOs = purchaseOrders.filter((po) => po.status === 'PENDING' || !po.status);
  const filteredPOs = purchaseOrders.filter((po) => {
    const status = po.status || 'PENDING';
    if (poFilter === 'PENDING') return status === 'PENDING';
    if (poFilter === 'RECEIVED') return status === 'RECEIVED' || status === 'COMPLETED';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            Suppliers & Stock Purchase Orders
          </h1>
          <p className="text-sm text-slate-500">Manage vendor contact details and track stock purchase orders</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'DIRECTORY' ? (
            <button
              onClick={() => {
                setEditingSupplier(null);
                setSupplierForm({ name: '', phone: '', email: '', address: '', notes: '' });
                setIsSupplierModalOpen(true);
              }}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Supplier
            </button>
          ) : (
            <button
              onClick={() => {
                if (suppliers.length > 0) setPoSupplierId(suppliers[0].id);
                setPoItems([]);
                setIsPOModalOpen(true);
              }}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Issue Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Pending Deliveries Reminder Alert Banner */}
      {pendingPOs.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                Pending Stock Deliveries Alert ({pendingPOs.length})
              </h3>
              <p className="text-xs text-amber-700 font-medium mt-0.5">
                You have <span className="font-bold text-amber-900">{pendingPOs.length} pending purchase order(s)</span> waiting to be received into inventory.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('PURCHASE_ORDERS');
              setPoFilter('PENDING');
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
          >
            Review & Receive Stock Deliveries
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`pb-3 px-4 font-bold text-xs transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'DIRECTORY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> Supplier Directory ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('PURCHASE_ORDERS')}
          className={`pb-3 px-4 font-bold text-xs transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'PURCHASE_ORDERS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Purchase Orders ({purchaseOrders.length})
          {pendingPOs.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
              {pendingPOs.length} Pending
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SUPPLIER DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers by name, phone, or email..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 pl-10 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Supplier Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No suppliers registered. Click 'Add New Supplier' above.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{s.phone || '-'}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{s.email || '-'}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{s.address || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingSupplier(s);
                              setSupplierForm({
                                name: s.name,
                                phone: s.phone || '',
                                email: s.email || '',
                                address: s.address || '',
                                notes: s.notes || '',
                              });
                              setIsSupplierModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id, s.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Filter Status:</label>
              <select
                value={poFilter}
                onChange={(e) => setPoFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl py-2 px-3 focus:outline-none"
              >
                <option value="ALL">All Purchase Orders ({purchaseOrders.length})</option>
                <option value="PENDING">Pending Delivery ({pendingPOs.length})</option>
                <option value="RECEIVED">Received into Inventory</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">PO Tracking Number</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Date Issued</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No purchase orders match this status filter.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => {
                    const isPending = !po.status || po.status === 'PENDING';
                    const poNum = po.orderNumber || po.poNumber || `PO-${po.id.substring(0, 8)}`;

                    return (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 text-xs">
                          {poNum}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{po.supplier?.name || 'Supplier'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] uppercase font-extrabold rounded-full border ${
                              isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isPending ? 'PENDING DELIVERY' : 'RECEIVED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          KSh {Number(po.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                          {new Date(po.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isPending ? (
                            <button
                              onClick={() => handleReceiveOrder(po.id, poNum)}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 mx-auto"
                            >
                              <PackageCheck className="w-3.5 h-3.5" /> Receive Stock
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Stock In
                            </span>
                          )}
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

      {/* CREATE / EDIT SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g. Apex Hardware Supplies"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="+254712345678"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder="orders@vendor.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Physical Address</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Nairobi Industrial Area"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Issue Purchase Order</h3>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Select Supplier *</label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Order Items & Wholesale Cost</label>
                  <button
                    type="button"
                    onClick={addPOItemRow}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Item
                  </button>
                </div>

                {poItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                    No items added yet. Click 'Add Product Item' above.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {poItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newItems = [...poItems];
                            newItems[idx].productId = e.target.value;
                            const selProd = products.find((p) => p.id === e.target.value);
                            if (selProd) {
                              newItems[idx].unitCost = Number(selProd.buyingPrice || selProd.costPrice || 0);
                            }
                            setPoItems(newItems);
                          }}
                          className="flex-1 bg-white border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-semibold"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...poItems];
                            newItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                            setPoItems(newItems);
                          }}
                          placeholder="Qty"
                          className="w-16 bg-white border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-semibold text-center"
                        />

                        <input
                          type="number"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => {
                            const newItems = [...poItems];
                            newItems[idx].unitCost = Math.max(0, parseFloat(e.target.value) || 0);
                            setPoItems(newItems);
                          }}
                          placeholder="Unit Cost"
                          className="w-24 bg-white border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-semibold text-right"
                        />

                        <button
                          type="button"
                          onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Expected delivery date or payment terms..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
