import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Building2, Search, CheckCircle, Ban, Clock } from 'lucide-react';

export const BusinessesPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    try {
      const res = await apiClient.get('/superadmin/businesses').catch(() => ({ data: { data: [] } }));
      setBusinesses(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleExtendTrial = async (businessId: string, daysToAdd = 14) => {
    setExtendingId(businessId);
    try {
      await apiClient.post(`/superadmin/businesses/${businessId}/extend-trial`, { days: daysToAdd });
      alert(`Successfully extended trial by ${daysToAdd} days.`);
      fetchBusinesses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to extend trial');
    } finally {
      setExtendingId(null);
    }
  };

  const handleToggleStatus = async (businessId: string, currentStatus: string) => {
    const isSuspending = currentStatus === 'ACTIVE';
    const actionText = isSuspending ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionText} this tenant business?`)) return;

    try {
      await apiClient.put(`/superadmin/businesses/${businessId}/status`, {
        status: isSuspending ? 'SUSPENDED' : 'ACTIVE',
      });
      alert(`Business ${actionText}d successfully.`);
      fetchBusinesses();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${actionText} business`);
    }
  };

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.users?.[0]?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-500" />
            Tenant Businesses Directory
          </h1>
          <p className="text-xs text-slate-400">Manage tenant accounts, extend trial periods, and toggle account access</p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search business name or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 pl-10 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      {/* Main Businesses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Registered Tenants ({filteredBusinesses.length})</h3>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Business Name</th>
                <th className="py-3.5 px-4">Owner Email</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Trial Expiry</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No tenant businesses found matching search.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850 text-xs">
                    <td className="py-3.5 px-4 font-bold text-white">{b.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{b.users?.[0]?.email || b.ownerEmail || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-full border ${
                          b.subscriptionStatus === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : b.subscriptionStatus === 'SUSPENDED'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {b.subscriptionStatus || 'FREE_TRIAL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {b.trialEndDate ? new Date(b.trialEndDate).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Extend Trial */}
                        <button
                          onClick={() => handleExtendTrial(b.id, 14)}
                          disabled={extendingId === b.id}
                          className="px-2.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-400 border border-indigo-800 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          +14 Days Trial
                        </button>

                        {/* Toggle Suspend / Activate */}
                        <button
                          onClick={() => handleToggleStatus(b.id, b.subscriptionStatus)}
                          className={`px-2.5 py-1.5 border rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors ${
                            b.subscriptionStatus === 'SUSPENDED'
                              ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border-emerald-800'
                              : 'bg-rose-950 hover:bg-rose-900 text-rose-400 border-rose-800'
                          }`}
                        >
                          {b.subscriptionStatus === 'SUSPENDED' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" /> Activate
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" /> Suspend
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
