import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Plus, Search, Edit2, Trash2, X, Tag, DollarSign } from 'lucide-react';

export const ExpenseCategoriesPage: React.FC = () => {
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
      const res = await apiClient.get('/expenses/categories');
      setCategories(res.data?.data || []);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to fetch expense categories',
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
        await apiClient.put(`/expenses/categories/${selectedCategory.id}`, { name: categoryName.trim() });
        addToast({
          type: 'success',
          title: 'Category Updated',
          message: `'${categoryName}' updated successfully`,
        });
      } else {
        await apiClient.post('/expenses/categories', { name: categoryName.trim() });
        addToast({
          type: 'success',
          title: 'Category Created',
          message: `'${categoryName}' added to expense categories`,
        });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to save expense category',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    const expenseCount = cat._count?.expenses || 0;
    const confirmMsg = expenseCount > 0
      ? `Are you sure you want to delete '${cat.name}'? ${expenseCount} expense record(s) in this category will be affected.`
      : `Are you sure you want to delete '${cat.name}'?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiClient.delete(`/expenses/categories/${cat.id}`);
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
        message: err.response?.data?.message || 'Failed to delete expense category',
      });
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Action Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/expenses"
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2 border border-slate-200"
          >
            <DollarSign className="w-4 h-4 text-rose-600" />
            Operating Expenses
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expense Category
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search expense categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
      </div>

      {/* Categories Cards Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-semibold">Loading expense categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Tag className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Expense Categories Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? `No categories matching "${searchTerm}". Try clearing your search.`
              : 'Create expense categories to organize company outflows.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const count = cat._count?.expenses || 0;
            return (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {cat.name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {count} {count === 1 ? 'expense' : 'expenses'} recorded
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Category Name"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {selectedCategory ? 'Edit Expense Category' : 'New Expense Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Utility Bills, Rent & Lease, Salaries"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  autoFocus
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
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
