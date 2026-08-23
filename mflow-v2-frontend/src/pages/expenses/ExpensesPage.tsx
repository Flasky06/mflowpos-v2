import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  DollarSign,
  Plus,
  Trash2,
  X,
  Search,
  Tag,
  Calendar,
  CreditCard,
  Building2,
  TrendingDown,
  PieChart,
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    paymentMethod: 'CASH',
    categoryId: '',
    notes: '',
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingQuickCategory, setIsAddingQuickCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [isQuickCategoryLoading, setIsQuickCategoryLoading] = useState(false);

  const handleQuickAddCategory = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) return;

    setIsQuickCategoryLoading(true);
    try {
      const res = await apiClient.post('/expenses/categories', { name: quickCategoryName.trim() });
      const newCat = res.data.data;
      setCategories((prev) => [...prev, newCat]);
      setExpenseForm((prev) => ({ ...prev, categoryId: newCat.id }));
      setQuickCategoryName('');
      setIsAddingQuickCategory(false);
      addToast({
        type: 'success',
        title: 'Category Created',
        message: `'${newCat.name}' created and selected`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Category Error',
        message: err.response?.data?.message || 'Failed to add category',
      });
    } finally {
      setIsQuickCategoryLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [expRes, catRes] = await Promise.all([
        apiClient.get(`/expenses${shopQuery}`),
        apiClient.get('/expenses/categories'),
      ]);

      const expData = expRes.data?.data;
      const expList = Array.isArray(expData) ? expData : expData?.expenses || [];
      const total = expData?.totalAmount ?? expList.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

      const catList = catRes.data?.data || [];
      setExpenses(expList);
      setTotalExpenseAmount(total);
      setCategories(catList);

      if (catList.length > 0 && !expenseForm.categoryId) {
        setExpenseForm((prev) => ({ ...prev, categoryId: catList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeShopId]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || !expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      addToast({ type: 'warning', title: 'Invalid Fields', message: 'Expense title and a positive amount are required' });
      return;
    }
    if (!expenseForm.categoryId) {
      addToast({ type: 'warning', title: 'Category Required', message: 'Select an expense category or create a new one' });
      return;
    }

    try {
      await apiClient.post('/expenses', {
        title: expenseForm.title,
        amount: parseFloat(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        categoryId: expenseForm.categoryId,
        notes: expenseForm.notes || undefined,
        shopId: activeShopId || undefined,
      });

      addToast({ type: 'success', title: 'Expense Recorded', message: `Saved '${expenseForm.title}' (KES ${Number(expenseForm.amount).toLocaleString()})` });
      setIsExpenseModalOpen(false);
      setExpenseForm({ title: '', amount: '', paymentMethod: 'CASH', categoryId: '', notes: '' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Error', message: err.response?.data?.message || 'Failed to record expense' });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      addToast({ type: 'warning', title: 'Category Name', message: 'Enter a valid category name' });
      return;
    }

    try {
      await apiClient.post('/expenses/categories', { name: newCategoryName });
      addToast({ type: 'success', title: 'Category Created', message: `Category '${newCategoryName}' created` });
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Category Error', message: err.response?.data?.message || 'Failed to create category' });
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!window.confirm(`Delete expense record '${title}'?`)) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      addToast({ type: 'success', title: 'Expense Deleted', message: 'Entry removed' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', message: err.response?.data?.message || 'Failed to delete expense' });
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.category?.name && e.category.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = categoryFilter === 'ALL' || e.categoryId === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const maxExpenseAmount = expenses.length > 0 ? Math.max(...expenses.map((e) => Number(e.amount || 0))) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">

        <div className="flex items-center gap-2">
          <Link
            to="/expense-categories"
            className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
          >
            <Tag className="w-4 h-4 text-slate-600" /> Manage Expense Categories ({categories.length})
          </Link>
          <button
            onClick={() => {
              setExpenseForm({
                title: '',
                amount: '',
                paymentMethod: 'CASH',
                categoryId: categories[0]?.id || '',
                notes: '',
              });
              setIsExpenseModalOpen(true);
            }}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Record New Expense
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Expenses Outflow</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-0.5">
              KES {Number(totalExpenseAmount).toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Categories</p>
            <h3 className="text-2xl font-extrabold text-indigo-600 mt-0.5">{categories.length} Categories</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Largest Single Outflow</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">
              KES {Number(maxExpenseAmount).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Expense Table & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses by title, notes, or category..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 pl-10 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600">Category Filter:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl py-2 px-3 focus:outline-none"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Expense Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Payment Method</th>
                <th className="py-3.5 px-4 text-right">Amount Outflow</th>
                <th className="py-3.5 px-4">Recorded By / Date</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No expense records found matching filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{exp.title}</div>
                      {exp.notes && <div className="text-[11px] text-slate-400 font-normal mt-0.5">{exp.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md border border-slate-200">
                        {exp.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                        {exp.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                      KES {Number(exp.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div className="font-semibold text-slate-800">{exp.user?.fullName || 'Staff'}</div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {new Date(exp.createdAt || exp.expenseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
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
      </div>

      {/* RECORD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Operating Expense</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Shop Electricity Bill - March"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Expense Category *</label>
                  {!isAddingQuickCategory ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingQuickCategory(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      + Add New Category
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingQuickCategory(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {isAddingQuickCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickCategoryName}
                      onChange={(e) => setQuickCategoryName(e.target.value)}
                      placeholder="e.g. Licensing & Taxes"
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddCategory}
                      disabled={isQuickCategoryLoading || !quickCategoryName.trim()}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    value={expenseForm.categoryId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">Select Expense Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="5000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Payment Method</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                >
                  <option value="CASH">Cash</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Additional expense description..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Record Expense Outflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Expense Categories</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Add New Category Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Staff Salaries, Transport"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-xs"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </form>

            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase block mb-2">Existing Categories</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className="px-3 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 text-xs"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
