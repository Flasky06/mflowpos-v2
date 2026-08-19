import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Plus, Search, Edit, Trash2, X, Scissors, FolderTree, Check } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);
  const [searchParams] = useSearchParams();
  const categoryFilterParam = searchParams.get('category');

  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(categoryFilterParam || 'ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const [isAddingQuickCategory, setIsAddingQuickCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [isSavingQuickCategory, setIsSavingQuickCategory] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    costPrice: '',
    code: '',
    unit: 'service',
    categoryId: '',
  });

  const fetchData = async () => {
    try {
      const [srvRes, catRes] = await Promise.all([
        apiClient.get('/services'),
        apiClient.get('/services/categories'),
      ]);
      setServices(srvRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (categoryFilterParam) {
      setSelectedCategoryFilter(categoryFilterParam);
    }
  }, [categoryFilterParam]);

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) return;

    setIsSavingQuickCategory(true);
    try {
      const res = await apiClient.post('/services/categories', { name: quickCategoryName.trim() });
      const newCategory = res.data?.data;

      addToast({
        type: 'success',
        title: 'Category Created',
        message: `'${quickCategoryName.trim()}' added and selected`,
      });

      // Refresh categories list
      const catRes = await apiClient.get('/services/categories');
      const updatedCategories = catRes.data.data || [];
      setCategories(updatedCategories);

      // Auto-select the newly created category
      if (newCategory?.id) {
        setServiceForm((prev) => ({ ...prev, categoryId: newCategory.id }));
      }

      setQuickCategoryName('');
      setIsAddingQuickCategory(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Category Error',
        message: err.response?.data?.message || 'Failed to create category',
      });
    } finally {
      setIsSavingQuickCategory(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: serviceForm.name,
        description: serviceForm.description || undefined,
        price: parseFloat(serviceForm.price),
        costPrice: serviceForm.costPrice ? parseFloat(serviceForm.costPrice) : undefined,
        code: serviceForm.code || undefined,
        unit: serviceForm.unit,
        categoryId: serviceForm.categoryId || undefined,
      };

      if (selectedService) {
        await apiClient.put(`/services/${selectedService.id}`, payload);
        addToast({ type: 'success', title: 'Service Updated', message: `'${serviceForm.name}' updated` });
      } else {
        await apiClient.post('/services', payload);
        addToast({ type: 'success', title: 'Service Created', message: `'${serviceForm.name}' added to services catalog` });
      }

      setIsModalOpen(false);
      setSelectedService(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Delete this service definition from catalog?')) return;
    try {
      await apiClient.delete(`/services/${id}`);
      addToast({ type: 'success', title: 'Service Removed', message: 'Service item deleted' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || s.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">
            <Scissors className="w-4 h-4" /> Catalog Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Services Catalog</h1>
          <p className="text-sm text-slate-500">Non-inventory services (Laundry, Tailoring, Repairs, Consultations)</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/service-categories"
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 border border-slate-200"
          >
            <FolderTree className="w-4 h-4 text-slate-500" />
            Manage Categories
          </Link>
          <button
            onClick={() => {
              setSelectedService(null);
              setServiceForm({
                name: '',
                description: '',
                price: '',
                costPrice: '',
                code: '',
                unit: 'service',
                categoryId: selectedCategoryFilter !== 'ALL' ? selectedCategoryFilter : '',
              });
              setIsAddingQuickCategory(false);
              setQuickCategoryName('');
              setIsModalOpen(true);
            }}
            className="py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search service name or service code..."
            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 pl-10 text-slate-900 text-sm focus:outline-none focus:border-violet-600 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-600 shadow-xs"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c._count?.services || 0})
            </option>
          ))}
        </select>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Service Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4 text-right">Service Price</th>
              <th className="py-3 px-4 text-center">Inventory Requirement</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No services in catalog.
                </td>
              </tr>
            ) : (
              filteredServices.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{s.category?.name || 'General Service'}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{s.code || '-'}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    KSh {Number(s.price).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                      No Stock Tracking Needed
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedService(s);
                        setServiceForm({
                          name: s.name,
                          description: s.description || '',
                          price: s.price || '',
                          costPrice: s.costPrice || '',
                          code: s.code || '',
                          unit: s.unit || 'service',
                          categoryId: s.categoryId || '',
                        });
                        setIsAddingQuickCategory(false);
                        setQuickCategoryName('');
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {selectedService ? 'Edit Service Item' : 'Add New Service Item'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Dry Cleaning Suit"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Service Price (KSh) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    placeholder="800"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Service Code</label>
                  <input
                    type="text"
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })}
                    placeholder="SRV-SUIT"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Service Category</label>
                  {!isAddingQuickCategory ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingQuickCategory(true)}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Category
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingQuickCategory(false);
                        setQuickCategoryName('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {isAddingQuickCategory ? (
                  <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-2xl space-y-2 mb-2">
                    <p className="text-[11px] font-bold text-violet-900">Quick-Add Service Category</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={quickCategoryName}
                        onChange={(e) => setQuickCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickCreateCategory(e);
                          }
                        }}
                        placeholder="e.g. Laundry, Repairs"
                        className="flex-1 bg-white border border-violet-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-violet-600"
                      />
                      <button
                        type="button"
                        disabled={isSavingQuickCategory || !quickCategoryName.trim()}
                        onClick={handleQuickCreateCategory}
                        className="py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isSavingQuickCategory ? 'Saving...' : 'Add & Select'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={serviceForm.categoryId}
                    onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-violet-600 font-medium"
                  >
                    <option value="">Select Category (Optional)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold rounded-xl text-sm transition-all mt-4 shadow-md cursor-pointer"
              >
                Save Service Item
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
