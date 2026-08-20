import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Plus, Search, X } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '' });
  const [repayAmount, setRepayAmount] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await apiClient.get('/customers');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        await apiClient.put(`/customers/${selectedCustomer.id}`, customerForm);
        addToast({ type: 'success', title: 'Customer Updated', message: `'${customerForm.name}' updated` });
      } else {
        await apiClient.post('/customers', customerForm);
        addToast({ type: 'success', title: 'Customer Created', message: `'${customerForm.name}' added to directory` });
      }

      setIsCustomerModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/customers/${selectedCustomer.id}/pay-debt`, {
        amount: parseFloat(repayAmount),
      });

      addToast({ type: 'success', title: 'Debt Repaid', message: 'Customer debt balance updated' });
      setIsPayDebtModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payment Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">

        <button
          onClick={() => {
            setSelectedCustomer(null);
            setCustomerForm({ name: '', email: '', phone: '' });
            setIsCustomerModalOpen(true);
          }}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search customer name, phone number, or email..."
          className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 pl-10 text-slate-900 text-sm focus:outline-none focus:border-indigo-600 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4 text-right">Outstanding Debt</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No customers registered yet.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => {
                const debt = Number(c.outstandingBalance || 0);

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{c.phone || '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{c.email || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      <span className={debt > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        KSh {debt.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center flex items-center justify-center gap-2">
                      {debt > 0 && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setRepayAmount(debt.toString());
                            setIsPayDebtModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200"
                        >
                          Repay Debt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Customer Record</h3>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="Alice Smith"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="+254 722 000 111"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  placeholder="alice@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {isPayDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setIsPayDebtModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Process Debt Repayment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Customer: <span className="text-indigo-600 font-semibold">{selectedCustomer?.name}</span>
            </p>

            <form onSubmit={handlePayDebt} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Repayment Amount (KSh)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Confirm Debt Repayment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
