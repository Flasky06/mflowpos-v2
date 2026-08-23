import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Plus, Edit, Trash2, X, Building2 } from 'lucide-react';

export const BranchSettingsPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  const [shops, setShops] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);

  const [shopForm, setShopForm] = useState({
    name: '',
    location: '',
    phone: '',
    shopType: 'BOTH',
  });

  const fetchShops = async () => {
    try {
      const res = await apiClient.get('/business/shops');
      setShops(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedShop) {
        await apiClient.put(`/business/shops/${selectedShop.id}`, shopForm);
        addToast({ type: 'success', title: 'Branch Updated', message: `'${shopForm.name}' updated` });
      } else {
        await apiClient.post('/business/shops', shopForm);
        addToast({ type: 'success', title: 'Branch Created', message: `'${shopForm.name}' added` });
      }

      setIsModalOpen(false);
      setSelectedShop(null);
      fetchShops();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleDeleteShop = async (id: string) => {
    if (!window.confirm('Delete shop branch?')) return;
    try {
      await apiClient.delete(`/business/shops/${id}`);
      addToast({ type: 'success', title: 'Branch Deleted', message: 'Shop branch removed' });
      fetchShops();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-end pb-4 border-b border-slate-200">
        <button
          onClick={() => {
            setSelectedShop(null);
            setShopForm({ name: '', location: '', phone: '', shopType: 'BOTH' });
            setIsModalOpen(true);
          }}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Shop Branch
        </button>
      </div>

      {/* Tabular View (v1 Style) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Branch Name</th>
              <th className="py-3.5 px-4 font-semibold">Location / Address</th>
              <th className="py-3.5 px-4 font-semibold">Phone Number</th>
              <th className="py-3.5 px-4 font-semibold text-center">Operation Mode</th>
              <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {shops.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No shop branches registered yet. Click 'Add Shop Branch' to add your first branch.
                </td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{shop.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{shop.location || 'N/A'}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{shop.phone || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-3 py-1 text-xs rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {shop.shopType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedShop(shop);
                        setShopForm({
                          name: shop.name,
                          location: shop.location || '',
                          phone: shop.phone || '',
                          shopType: shop.shopType || 'BOTH',
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                      title="Edit Branch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteShop(shop.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {selectedShop ? 'Edit Shop Branch' : 'Add New Branch'}
            </h3>

            <form onSubmit={handleSaveShop} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  placeholder="Downtown Branch"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Location / Address</label>
                <input
                  type="text"
                  value={shopForm.location}
                  onChange={(e) => setShopForm({ ...shopForm, location: e.target.value })}
                  placeholder="Kenyatta Avenue, Nairobi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  placeholder="+254 712 345 678"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Shop Operation Mode Toggle</label>
                <select
                  value={shopForm.shopType}
                  onChange={(e) => setShopForm({ ...shopForm, shopType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="BOTH">BOTH (Products & Services)</option>
                  <option value="PRODUCTS_ONLY">PRODUCTS_ONLY (Physical items only)</option>
                  <option value="SERVICES_ONLY">SERVICES_ONLY (Laundry / Repairs only)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Save Branch Settings
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
