import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { activeShopId, hasPermission } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    costPrice: '',
    sellingPrice: '',
    sku: '',
    barcode: '',
    unit: 'pcs',
    categoryId: '',
  });

  const [stockAdjustForm, setStockAdjustForm] = useState({
    changeQty: '',
    reason: 'Physical Count Audit',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/products/categories'),
      ]);
      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeShopId]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        costPrice: productForm.costPrice ? parseFloat(productForm.costPrice) : undefined,
        sellingPrice: parseFloat(productForm.sellingPrice),
        sku: productForm.sku || undefined,
        barcode: productForm.barcode || undefined,
        unit: productForm.unit,
        categoryId: productForm.categoryId || undefined,
      };

      if (selectedProduct) {
        await apiClient.put(`/products/${selectedProduct.id}`, payload);
        addToast({ type: 'success', title: 'Product Updated', message: `'${productForm.name}' updated successfully` });
      } else {
        await apiClient.post('/products', payload);
        addToast({ type: 'success', title: 'Product Created', message: `'${productForm.name}' added to business catalog` });
      }

      setIsProductModalOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Error', message: err.response?.data?.message || 'Failed to save product' });
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShopId) {
      addToast({ type: 'error', title: 'No Shop Selected', message: 'Select an active branch to adjust stock' });
      return;
    }

    try {
      await apiClient.post(`/products/${selectedProduct.id}/adjust-stock`, {
        shopId: activeShopId,
        changeQty: parseInt(stockAdjustForm.changeQty, 10),
        reason: stockAdjustForm.reason,
        notes: stockAdjustForm.notes,
      });

      addToast({ type: 'success', title: 'Stock Adjusted', message: 'Branch inventory stock updated' });
      setIsStockModalOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Stock Error', message: err.response?.data?.message || 'Failed to adjust stock' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product from catalog?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      addToast({ type: 'success', title: 'Product Deleted', message: 'Product removed from catalog' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Product Catalog</h1>
          <p className="text-sm text-slate-500">Manage business products, categories, and branch stock levels</p>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setProductForm({ name: '', costPrice: '', sellingPrice: '', sku: '', barcode: '', unit: 'pcs', categoryId: '' });
            setIsProductModalOpen(true);
          }}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product name, SKU, or scan barcode..."
            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 pl-10 text-slate-900 text-sm focus:outline-none focus:border-indigo-600 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-300 text-slate-800 text-sm rounded-xl py-2.5 px-4 focus:outline-none shadow-xs font-medium"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">SKU / Barcode</th>
              <th className="py-3 px-4 text-right">Cost Price</th>
              <th className="py-3 px-4 text-right">Selling Price</th>
              <th className="py-3 px-4 text-center">Branch Stock</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No products in catalog.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const stock = p.stocks?.find((s: any) => s.shopId === activeShopId);
                const stockQty = stock ? stock.quantity : 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.category?.name || 'Uncategorized'}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {p.sku || p.barcode || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {p.costPrice ? `KSh ${Number(p.costPrice).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      KSh {Number(p.sellingPrice).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold ${
                          stockQty <= 5
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {stockQty} {p.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center flex items-center justify-center gap-2">
                      {hasPermission('CAN_ADJUST_STOCK') && (
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setStockAdjustForm({ changeQty: '', reason: 'Physical Count Audit', notes: '' });
                            setIsStockModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200"
                        >
                          Adjust Stock
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setProductForm({
                            name: p.name,
                            costPrice: p.costPrice || '',
                            sellingPrice: p.sellingPrice || '',
                            sku: p.sku || '',
                            barcode: p.barcode || '',
                            unit: p.unit || 'pcs',
                            categoryId: p.categoryId || '',
                          });
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Product Form Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Coca-Cola 500ml"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Selling Price (KSh)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    placeholder="150"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Cost Price (KSh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                    placeholder="100"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="SKU-1001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Barcode</label>
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="6001234567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setIsStockModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Adjust Branch Stock</h3>
            <p className="text-xs text-slate-500 mb-4">
              Item: <span className="text-indigo-600 font-semibold">{selectedProduct?.name}</span>
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Change Quantity (e.g. +20 for restock or -2 for audit count)
                </label>
                <input
                  type="number"
                  required
                  value={stockAdjustForm.changeQty}
                  onChange={(e) => setStockAdjustForm({ ...stockAdjustForm, changeQty: e.target.value })}
                  placeholder="+10 or -5"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={stockAdjustForm.reason}
                  onChange={(e) => setStockAdjustForm({ ...stockAdjustForm, reason: e.target.value })}
                  placeholder="Physical Count Audit"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={stockAdjustForm.notes}
                  onChange={(e) => setStockAdjustForm({ ...stockAdjustForm, notes: e.target.value })}
                  placeholder="Damaged boxes written off"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Confirm Stock Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
