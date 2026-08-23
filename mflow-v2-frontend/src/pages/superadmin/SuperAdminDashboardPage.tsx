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
  Tag,
  Send,
  Megaphone,
  Mail,
  MessageSquare,
  Trash2,
} from 'lucide-react';

export const SuperAdminDashboardPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'TENANTS' | 'USERS' | 'REVENUE' | 'ANNOUNCEMENTS'>('TENANTS');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const [isCashPaymentModalOpen, setIsCashPaymentModalOpen] = useState(false);
  const [isExtendTrialModalOpen, setIsExtendTrialModalOpen] = useState(false);
  const [isCustomPriceModalOpen, setIsCustomPriceModalOpen] = useState(false);

  const [cashPaymentForm, setCashPaymentForm] = useState({
    planCode: 'STANDARD',
    amount: '',
    paymentMethod: 'CASH',
    transactionRef: '',
    validityMonths: '1',
  });

  const [extraTrialDays, setExtraTrialDays] = useState('14');
  const [customPriceForm, setCustomPriceForm] = useState({
    customPrice: '',
    status: 'ACTIVE',
  });

  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    targetType: 'ALL_BUSINESSES',
    businessId: '',
    channels: ['IN_APP'],
  });

  const fetchData = async () => {
    try {
      const [statsRes, tenantsRes, usersRes, revRes, broadRes] = await Promise.all([
        apiClient.get('/superadmin/stats'),
        apiClient.get('/superadmin/tenants'),
        apiClient.get('/superadmin/users'),
        apiClient.get('/superadmin/revenue'),
        apiClient.get('/superadmin/broadcasts').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(statsRes.data.data);
      setTenants(tenantsRes.data.data || []);
      setUsersList(usersRes.data.data || []);
      setRevenueData(revRes.data.data);
      setBroadcasts(broadRes.data?.data || []);
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

  const handleSaveCustomPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put(`/superadmin/tenants/${selectedTenant.id}/custom-pricing`, {
        customPrice: customPriceForm.customPrice ? parseFloat(customPriceForm.customPrice) : null,
        status: customPriceForm.status,
      });

      addToast({ type: 'success', title: 'Pricing Updated', message: `Updated custom pricing for '${selectedTenant.name}'` });
      setIsCustomPriceModalOpen(false);
      setSelectedTenant(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Error', message: err.response?.data?.message || 'Failed' });
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.content) {
      addToast({ type: 'warning', title: 'Missing Fields', message: 'Title and Content are required' });
      return;
    }

    try {
      const res = await apiClient.post('/superadmin/broadcasts', broadcastForm);
      addToast({
        type: 'success',
        title: 'Broadcast Sent',
        message: res.data?.message || 'Message delivered to target businesses',
      });
      setBroadcastForm({
        title: '',
        content: '',
        targetType: 'ALL_BUSINESSES',
        businessId: '',
        channels: ['IN_APP'],
      });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Broadcast Failed', message: err.response?.data?.message || 'Failed to send' });
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm('Delete this broadcast log?')) return;
    try {
      await apiClient.delete(`/superadmin/broadcasts/${id}`);
      addToast({ type: 'info', title: 'Deleted', message: 'Broadcast log removed' });
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete broadcast' });
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
          <button
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'ANNOUNCEMENTS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            Announcements & Messaging ({broadcasts.length})
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
                <th className="py-3 px-4">Monthly Rate</th>
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
                const hasCustomPrice = sub?.customPrice !== null && sub?.customPrice !== undefined;
                const effectiveRate = hasCustomPrice ? Number(sub.customPrice) : Number(sub?.plan?.price || 1000);

                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {t.name}
                      <p className="text-xs text-slate-500 font-normal">{t.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 font-bold">
                      {sub?.plan?.code || 'TRIAL'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-900">
                      KSh {effectiveRate.toLocaleString()}
                      {hasCustomPrice && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md border border-purple-200">
                          Custom
                        </span>
                      )}
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
                          setCustomPriceForm({
                            customPrice: sub?.customPrice !== null && sub?.customPrice !== undefined ? String(sub.customPrice) : '',
                            status: sub?.status || 'ACTIVE',
                          });
                          setIsCustomPriceModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1 border border-amber-200"
                        title="Set Custom Subscription Pricing for this Tenant"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        Set Price
                      </button>

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

      {/* Tab 4: Announcements & Messaging */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Composer Form */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                Send Broadcast Message
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Send announcements to tenant business owners & shop admins</p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Message Title
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="e.g. Scheduled System Upgrade"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Audience
                </label>
                <select
                  value={broadcastForm.targetType}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetType: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="ALL_BUSINESSES">All Platform Businesses ({tenants.length})</option>
                  <option value="SPECIFIC_BUSINESS">Specific Business Tenant</option>
                  <option value="ACTIVE_ONLY">Active Subscribers Only</option>
                  <option value="TRIALING_ONLY">Free Trialing Businesses Only</option>
                </select>
              </div>

              {broadcastForm.targetType === 'SPECIFIC_BUSINESS' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Target Business
                  </label>
                  <select
                    value={broadcastForm.businessId}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, businessId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Choose Business --</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Channels
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastForm.channels.includes('IN_APP')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBroadcastForm((prev) => ({
                          ...prev,
                          channels: checked
                            ? [...prev.channels, 'IN_APP']
                            : prev.channels.filter((c) => c !== 'IN_APP'),
                        }));
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    🔔 In-App Notifications Screen (Admins / Owners)
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastForm.channels.includes('EMAIL')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBroadcastForm((prev) => ({
                          ...prev,
                          channels: checked
                            ? [...prev.channels, 'EMAIL']
                            : prev.channels.filter((c) => c !== 'EMAIL'),
                        }));
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    ✉️ Email Broadcast
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastForm.channels.includes('WHATSAPP')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBroadcastForm((prev) => ({
                          ...prev,
                          channels: checked
                            ? [...prev.channels, 'WHATSAPP']
                            : prev.channels.filter((c) => c !== 'WHATSAPP'),
                        }));
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    💬 WhatsApp Message
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  placeholder="Write message content here..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
              >
                <Send className="w-4 h-4" /> Deliver Broadcast Message
              </button>
            </form>
          </div>

          {/* Past Broadcast History */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <h3 className="text-base font-bold text-slate-900">Sent Broadcasts History</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Title & Content</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Channels</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {broadcasts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No broadcast messages sent yet.
                      </td>
                    </tr>
                  ) : (
                    broadcasts.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <p className="font-bold text-slate-900">{b.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{b.content}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                            {b.targetType} {b.business ? `(${b.business.name})` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1">
                            {b.channels?.map((c: string) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteBroadcast(b.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                  <option value="STANDARD">STANDARD (KSh 1,000/mo - Unlimited Shops)</option>
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

      {/* Custom Pricing Override Modal */}
      {isCustomPriceModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsCustomPriceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Custom Subscription Pricing</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set custom monthly rate for <span className="text-indigo-600 font-bold">{selectedTenant?.name}</span> (e.g. 1000 vs 1500 KES).
              </p>
            </div>

            <form onSubmit={handleSaveCustomPricing} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Custom Monthly Price (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={customPriceForm.customPrice}
                  onChange={(e) => setCustomPriceForm({ ...customPriceForm, customPrice: e.target.value })}
                  placeholder="e.g. 1500 (Leave empty for default plan rate)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Default plan price: KSh {selectedTenant?.subscription?.plan?.price || 1000}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subscription Status
                </label>
                <select
                  value={customPriceForm.status}
                  onChange={(e) => setCustomPriceForm({ ...customPriceForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl py-2.5 px-3 focus:outline-none focus:border-indigo-600"
                >
                  <option value="ACTIVE">ACTIVE (Paid Active Account)</option>
                  <option value="TRIALING">TRIALING (Free Trial Period)</option>
                  <option value="EXPIRED">EXPIRED (Subscription Lapsed)</option>
                  <option value="CANCELLED">CANCELLED (Suspended)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomPriceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20 transition-all"
                >
                  Save Custom Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
