import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Plus, Edit2, Trash2, CreditCard, Check, X, ShieldCheck } from 'lucide-react';

export const PaymentAccountsPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'MPESA',
    accountNumber: '',
    description: '',
    isDefault: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/payment-accounts');
      setAccounts(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to fetch payment accounts',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedAccount(null);
    setAccountForm({
      name: '',
      type: 'MPESA',
      accountNumber: '',
      description: '',
      isDefault: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc: any) => {
    setSelectedAccount(acc);
    setAccountForm({
      name: acc.name,
      type: acc.type || 'MPESA',
      accountNumber: acc.accountNumber || '',
      description: acc.description || '',
      isDefault: !!acc.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) {
      addToast({ type: 'warning', title: 'Required Field', message: 'Account name cannot be empty' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedAccount) {
        await apiClient.put(`/payment-accounts/${selectedAccount.id}`, {
          name: accountForm.name.trim(),
          type: accountForm.type,
          accountNumber: accountForm.accountNumber.trim() || undefined,
          description: accountForm.description.trim() || undefined,
          isDefault: accountForm.isDefault,
        });
        addToast({
          type: 'success',
          title: 'Account Updated',
          message: `'${accountForm.name}' updated successfully`,
        });
      } else {
        await apiClient.post('/payment-accounts', {
          name: accountForm.name.trim(),
          type: accountForm.type,
          accountNumber: accountForm.accountNumber.trim() || undefined,
          description: accountForm.description.trim() || undefined,
          isDefault: accountForm.isDefault,
        });
        addToast({
          type: 'success',
          title: 'Account Created',
          message: `'${accountForm.name}' created successfully`,
        });
      }

      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to save payment account',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate payment account '${name}'?`)) return;

    try {
      await apiClient.delete(`/payment-accounts/${id}`);
      addToast({ type: 'success', title: 'Account Deactivated', message: `'${name}' removed` });
      fetchAccounts();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || 'Failed to deactivate account',
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Payment Accounts & Paybills
          </h1>
          <p className="text-sm text-slate-500">Configure business M-Pesa Paybills, Tills, Bank Accounts, and Cash Drawers</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Payment Account / Paybill
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Active Payment Accounts ({accounts.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100/70 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3.5 px-4">Account Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Paybill / Till / Acc #</th>
                <th className="py-3.5 px-4 text-center">Default</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading payment accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                    No custom payment accounts configured yet.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {acc.name}
                      {acc.description && (
                        <span className="block text-xs font-normal text-slate-500 mt-0.5">{acc.description}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                          acc.type === 'MPESA'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : acc.type === 'CASH'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : acc.type === 'BANK'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : acc.type === 'CARD'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                      {acc.accountNumber ? (
                        <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                          {acc.accountNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {acc.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <Check className="w-3.5 h-3.5" /> Default
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(acc)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Account"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(acc.id, acc.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Deactivate Account"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedAccount ? 'Edit Payment Account' : 'Add New Payment Account / Paybill'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 my-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M-Pesa Paybill (KCB), Till #12345, Equity Bank..."
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="MPESA">M-Pesa / Mobile</option>
                    <option value="CASH">Cash Drawer</option>
                    <option value="BANK">Bank Account</option>
                    <option value="CARD">Card POS Terminal</option>
                    <option value="CREDIT">Customer Credit</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Paybill / Till / Acc #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 522522 / 98765"
                    value={accountForm.accountNumber}
                    onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main cashier Till account..."
                  value={accountForm.description}
                  onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultAcc"
                  checked={accountForm.isDefault}
                  onChange={(e) => setAccountForm({ ...accountForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isDefaultAcc" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as default payment account for checkout
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : selectedAccount ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
