import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Plus, Search, Edit2, Trash2, X, FolderTree, Scissors, ArrowRight, Layers } from 'lucide-react';

export const ServiceCategoriesPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/services/categories');
      setCategories(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to fetch service categories',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleOpenCreateModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedCategory(null);
    setCategoryName('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: any) => {
    setSelectedCategory(cat);
    setCategoryName(cat.name);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      addToast({ type: 'warning', title: 'Required Field', message: 'Category name cannot be empty' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedCategory) {
        await apiClient.put(`/services/categories/${selectedCategory.id}`, { name: categoryName.trim() });
        addToast({
          type: 'success',
          title: 'Category Updated',
          message: `'${categoryName}' updated successfully`,
        });
      } else {
        await apiClient.post('/services/categories', { name: categoryName.trim() });
        addToast({
          type: 'success',
          title: 'Category Created',
          message: `'${categoryName}' added to service categories`,
        });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to save service category',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    const serviceCount = cat._count?.services || 0;
    const confirmMsg = serviceCount > 0
      ? `Are you sure you want to delete '${cat.name}'? ${serviceCount} service(s) in this category will be unassigned.`
      : `Are you sure you want to delete '${cat.name}'?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiClient.delete(`/services/categories/${cat.id}`);
      addToast({
        type: 'success',
        title: 'Category Deleted',
        message: `'${cat.name}' was removed`,
      });
      fetchCategories();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || 'Failed to delete service category',
      });
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/services"
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 border border-slate-200"
          >
            <Scissors className="w-4 h-4 text-slate-500" />
            Services Catalog
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-violet-600/20 flex items-center gap-2 cursor-pointer"
            title="Shortcut: Alt+C"
          >
            <Plus className="w-4 h-4" />
            Add Category
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-violet-800 text-white border border-violet-500 rounded-md">
              Alt+C
            </kbd>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search service categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 shadow-2xs font-medium"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
      </div>

      {/* Categories Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Category Name</th>
                <th className="py-4 px-6 text-center">Assigned Services</th>
                <th className="py-4 px-6">Catalog Filter</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCategories.map((cat) => {
                const count = cat._count?.services || 0;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{cat.name}</p>
                          <p className="text-xs text-slate-400 font-medium">ID: {cat.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 py-1 px-3 bg-violet-50 text-violet-700 font-bold text-xs rounded-full border border-violet-100">
                        <Scissors className="w-3.5 h-3.5" />
                        {count} {count === 1 ? 'Service' : 'Services'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <Link
                        to={`/services?category=${cat.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
                      >
                        View in Catalog <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-violet-50 hover:text-violet-600 text-slate-700 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Edit Category Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <FolderTree className="w-10 h-10 text-slate-300" />
                      <p className="font-bold text-slate-800 text-sm">No service categories found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchTerm
                          ? `No category matching "${searchTerm}"`
                          : 'Get started by creating your first service category (e.g. Laundry, Repairs, Salon, Consulting).'}
                      </p>
                      <button
                        onClick={handleOpenCreateModal}
                        className="py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Category
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCategory ? 'Edit Service Category' : 'New Service Category'}
                </h3>
                <p className="text-xs text-slate-500">Group and organize your services</p>
              </div>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Laundry & Dry Cleaning, Electronics Repair"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 text-sm focus:outline-none focus:border-violet-600 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-violet-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : selectedCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
