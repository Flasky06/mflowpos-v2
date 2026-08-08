import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import {
  ShieldCheck,
  Building2,
  Users,
  DollarSign,
  Ban,
  CheckCircle,
  Calendar,
  CreditCard,
  X,
  Search,
} from 'lucide-react';

export const SuperAdminDashboardPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'TENANTS' | 'USERS' | 'REVENUE'>('TENANTS');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const [isCashPaymentModalOpen, setIsCashPaymentModalOpen] = useState(false);
  const [isExtendTrialModalOpen, setIsExtendTrialModalOpen] = useState(false);

  const [cashPaymentForm, setCashPaymentForm] = useState({
    planCode: 'STARTER',
    amount: '',
    paymentMethod: 'CASH',
    transactionRef: '',
    validityMonths: '1',
  });

  const [extraTrialDays, setExtraTrialDays] = useState('14');

  const fetchData = async () => {
    try {
      const [statsRes, tenantsRes, usersRes, revRes] = await Promise.all([
        apiClient.get('/superadmin/stats'),
        apiClient.get('/superadmin/tenants'),
        apiClient.get('/superadmin/users'),
        apiClient.get('/superadmin/revenue'),
      ]);
      setStats(statsRes.data.data);
      setTenants(tenantsRes.data.data || []);
      setUsersList(usersRes.data.data || []);
      setRevenueData(revRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTenantSuspension = async (tenant: any) => {
    const isSuspended = tenant.subscription?.status === 'CANCELLED' || !tenant.active;
    const action = isSuspended ? 'reactivate' : 'suspend';

    if (!window.confirm(`Are you sure you want to ${action} tenant '${tenant.name}'?`)) return;

    try {
      await apiClient.put(`/superadmin/tenants/${tenant.id}/${action}`);
      addToast({ type: 'success', title: 'Tenant Updated', message: `Tenant business ${action}d successfully` });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleToggleUserSuspension = async (user: any) => {
    const action = user.active === false ? 'reactivate' : 'suspend';

    if (!window.confirm(`Are you sure you want to ${action} user account '${user.fullName}'?`)) return;

    try {
      await apiClient.put(`/superadmin/users/${user.id}/${action}`);
      addToast({ type: 'success', title: 'User Updated', message: `User account ${action}d successfully` });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleActivateCashPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/superadmin/tenants/${selectedTenant.id}/activate-cash-payment`, {
        planCode: cashPaymentForm.planCode,
        amount: cashPaymentForm.amount ? parseFloat(cashPaymentForm.amount) : undefined,
        paymentMethod: cashPaymentForm.paymentMethod,
        transactionRef: cashPaymentForm.transactionRef || undefined,
        validityMonths: parseInt(cashPaymentForm.validityMonths, 10),
      });

      addToast({ type: 'success', title: 'Cash Subscription Activated', message: 'Tenant subscription renewed via cash' });
      setIsCashPaymentModalOpen(false);
      setSelectedTenant(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Activation Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleExtendTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/superadmin/tenants/${selectedTenant.id}/extend-trial`, {
        extraDays: parseInt(extraTrialDays, 10),
      });

      addToast({ type: 'success', title: 'Trial Extended', message: `Added ${extraTrialDays} trial days` });
      setIsExtendTrialModalOpen(false);
      setSelectedTenant(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Extend Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = usersList.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* SuperAdmin Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            SuperAdmin Platform Oversight
          </h1>
          <p className="text-sm text-slate-500">Manage platform tenants, cash payments, user roles, and account suspensions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center justify-between bg-white border border-slate-200 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Businesses</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalBusinesses || 0}</h3>
          </div>
          <Building2 className="w-8 h-8 text-indigo-600 opacity-80" />
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center justify-between bg-white border border-slate-200 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Platform Users</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalUsers || 0}</h3>
          </div>
          <Users className="w-8 h-8 text-sky-600 opacity-80" />
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center justify-between bg-white border border-slate-200 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Subscriptions</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{stats?.subscriptions?.active || 0}</h3>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-600 opacity-80" />
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center justify-between bg-white border border-slate-200 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Gross Platform Revenue</p>
            <h3 className="text-2xl font-bold text-violet-700 mt-1">
              KSh {stats ? Number(stats.totalRevenue).toLocaleString() : '0'}
            </h3>
          </div>
          <DollarSign className="w-8 h-8 text-violet-600 opacity-80" />
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('TENANTS')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === 'TENANTS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tenants ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Platform Users ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('REVENUE')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === 'REVENUE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subscription Payments
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tenant or user..."
            className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 pl-9 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Tab 1: Tenants List */}
      {activeTab === 'TENANTS' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Business Tenant</th>
                <th className="py-3 px-4">Plan Code</th>
                <th className="py-3 px-4">Shops</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTenants.map((t) => {
                const sub = t.subscription;
                const isSuspended = sub?.status === 'CANCELLED' || !t.active;

                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {t.name}
                      <p className="text-xs text-slate-500 font-normal">{t.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 font-bold">
                      {sub?.plan?.code || 'TRIAL'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {t._count?.shops || 0} / {sub?.plan?.maxShops || 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold ${
                          isSuspended
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isSuspended ? 'SUSPENDED' : sub?.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {sub?.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedTenant(t);
                          setIsCashPaymentModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-200"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Activate Cash
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTenant(t);
                          setIsExtendTrialModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-indigo-200"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Extend Trial
                      </button>

                      <button
                        onClick={() => handleToggleTenantSuspension(t)}
                        className={`p-1.5 rounded-lg text-xs font-semibold ${
                          isSuspended
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                        title={isSuspended ? 'Reactivate Tenant' : 'Suspend Tenant'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Users List */}
      {activeTab === 'USERS' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Business</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((u) => {
                const isSuspended = u.active === false;

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{u.fullName}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">{u.business?.name || 'Platform'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold ${
                          isSuspended
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleUserSuspension(u)}
                        className={`p-1.5 rounded-lg text-xs font-semibold ${
                          isSuspended
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                        title={isSuspended ? 'Reactivate User Account' : 'Suspend User Account'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Revenue Payments */}
      {activeTab === 'REVENUE' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Business Tenant</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {revenueData?.payments?.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {p.subscription?.business?.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 font-bold">
                    {p.subscription?.plan?.code}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 font-bold">{p.paymentMethod}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{p.transactionRef || '-'}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    KSh {Number(p.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cash Payment Modal */}
      {isCashPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setIsCashPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Activate Cash Subscription</h3>
            <p className="text-xs text-slate-500 mb-4">
              Tenant: <span className="text-indigo-600 font-semibold">{selectedTenant?.name}</span>
            </p>

            <form onSubmit={handleActivateCashPayment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Plan</label>
                <select
                  value={cashPaymentForm.planCode}
                  onChange={(e) => setCashPaymentForm({ ...cashPaymentForm, planCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="STARTER">STARTER (KSh 1,000/mo - 1 Shop)</option>
                  <option value="GROWTH">GROWTH (KSh 2,000/mo - 3 Shops)</option>
                  <option value="ENTERPRISE">ENTERPRISE (KSh 3,500/mo - 5 Shops)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cashPaymentForm.validityMonths}
                    onChange={(e) => setCashPaymentForm({ ...cashPaymentForm, validityMonths: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={cashPaymentForm.paymentMethod}
                    onChange={(e) => setCashPaymentForm({ ...cashPaymentForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-600 font-medium"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ref / Receipt # (Optional)</label>
                <input
                  type="text"
                  value={cashPaymentForm.transactionRef}
                  onChange={(e) => setCashPaymentForm({ ...cashPaymentForm, transactionRef: e.target.value })}
                  placeholder="OFFLINE-8821"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Confirm Cash Activation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Extend Trial Modal */}
      {isExtendTrialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setIsExtendTrialModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Extend Trial Period</h3>
            <p className="text-xs text-slate-500 mb-4">
              Tenant: <span className="text-indigo-600 font-semibold">{selectedTenant?.name}</span>
            </p>

            <form onSubmit={handleExtendTrial} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Extra Days to Grant</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={extraTrialDays}
                  onChange={(e) => setExtraTrialDays(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors mt-4 shadow-md"
              >
                Grant Additional Trial Days
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
