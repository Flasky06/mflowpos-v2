import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Plus, Search, Edit2, Trash2, X, FolderTree, Package, ArrowRight, Layers } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
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
      const res = await apiClient.get('/products/categories');
      setCategories(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to fetch categories',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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
        await apiClient.put(`/products/categories/${selectedCategory.id}`, { name: categoryName.trim() });
        addToast({
          type: 'success',
          title: 'Category Updated',
          message: `'${categoryName}' updated successfully`,
        });
      } else {
        await apiClient.post('/products/categories', { name: categoryName.trim() });
        addToast({
          type: 'success',
          title: 'Category Created',
          message: `'${categoryName}' added to product categories`,
        });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to save category',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    const productCount = cat._count?.products || 0;
    const confirmMsg = productCount > 0
      ? `Are you sure you want to delete '${cat.name}'? ${productCount} product(s) in this category will be unassigned.`
      : `Are you sure you want to delete '${cat.name}'?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiClient.delete(`/products/categories/${cat.id}`);
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
        message: err.response?.data?.message || 'Failed to delete category',
      });
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
            <FolderTree className="w-4 h-4" /> Catalog Management
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Categories</h1>
          <p className="text-sm text-slate-500">Organize products, assign department groupings, and filter catalog</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 border border-slate-200"
          >
            <Package className="w-4 h-4 text-slate-500" />
            Products Inventory
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Navigation Pill Tabs */}
      <div className="flex gap-2 p-1 bg-slate-200/70 rounded-2xl max-w-md">
        <Link
          to="/products"
          className="flex-1 py-2 px-4 text-center rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
        >
          Products Catalog
        </Link>
        <div className="flex-1 py-2 px-4 text-center rounded-xl text-xs font-black bg-white text-indigo-600 shadow-xs">
          Categories Manager
        </div>
        <Link
          to="/services"
          className="flex-1 py-2 px-4 text-center rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
        >
          Services
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs font-medium"
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
                <th className="py-4 px-6 text-center">Assigned Products</th>
                <th className="py-4 px-6">Catalog Filter</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCategories.map((cat) => {
                const count = cat._count?.products || 0;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{cat.name}</p>
                          <p className="text-xs text-slate-400 font-medium">ID: {cat.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 py-1 px-3 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-100">
                        <Package className="w-3.5 h-3.5" />
                        {count} {count === 1 ? 'Product' : 'Products'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <Link
                        to={`/products?category=${cat.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        View in Catalog <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
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
                      <p className="font-bold text-slate-800 text-sm">No categories found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchTerm
                          ? `No category matching "${searchTerm}"`
                          : 'Get started by creating your first product category.'}
                      </p>
                      <button
                        onClick={handleOpenCreateModal}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
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
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              {selectedCategory ? 'Edit Category' : 'Create Product Category'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedCategory
                ? 'Update the category name across all assigned catalog items'
                : 'Add a new category classification to organize your inventory'}
            </p>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Beverages, Electronics, Snacks, Medicines"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
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
