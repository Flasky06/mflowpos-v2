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

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

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

    // Keyboard shortcut Alt+C to quick-add category
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setNewCategoryName('');
        setIsCategoryModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateCategoryModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmittingCategory(true);
    try {
      await apiClient.post('/services/categories', { name: newCategoryName.trim() });
      addToast({
        type: 'success',
        title: 'Category Created',
        message: `'${newCategoryName.trim()}' added to service categories`,
      });
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to create category',
      });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

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
        price: parseFloat(serviceForm.price),
        description: serviceForm.description || undefined,
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
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/service-categories"
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 border border-slate-200"
          >
            <FolderTree className="w-4 h-4 text-slate-500" />
            Manage Categories
          </Link>
          <button
            onClick={() => {
              setNewCategoryName('');
              setIsCategoryModalOpen(true);
            }}
            className="py-2.5 px-4 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 border border-violet-200 cursor-pointer"
            title="Shortcut: Alt+C"
          >
            <Plus className="w-4 h-4" />
            Add Category
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-white text-violet-800 border border-violet-300 rounded-md">
              Alt+C
            </kbd>
          </button>
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
            placeholder="Search service name..."
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
              <th className="py-3 px-4 text-right">Service Price</th>
              <th className="py-3 px-4 text-center">Inventory Requirement</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No services in catalog.
                </td>
              </tr>
            ) : (
              filteredServices.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{s.category?.name || 'General Service'}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    KES {Number(s.price).toLocaleString()}
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

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Service Price (KES) *</label>
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

      {/* Fast Create Category Modal (Header / Alt+C Shortcut) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Service Category</h3>
                <p className="text-xs text-slate-500">Quickly add a category to organize services</p>
              </div>
            </div>

            <form onSubmit={handleCreateCategoryModalSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Laundry & Dry Cleaning, Electronics Repair"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 text-sm focus:outline-none focus:border-violet-600 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory || !newCategoryName.trim()}
                  className="py-2.5 px-5 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-violet-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCategory ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
