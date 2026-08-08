import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import {
  Building2,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, busRes] = await Promise.all([
        apiClient.get('/superadmin/stats').catch(() => ({ data: { data: null } })),
        apiClient.get('/superadmin/businesses').catch(() => ({ data: { data: [] } })),
      ]);

      setStats(statsRes.data.data);
      setBusinesses(busRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalBusinesses = businesses.length || stats?.totalBusinesses || 0;
  const activeSubscribers = businesses.filter((b) => b.subscriptionStatus === 'ACTIVE').length || stats?.activeSubscribers || 0;
  const totalTrialing = businesses.filter((b) => b.subscriptionStatus === 'FREE_TRIAL').length || stats?.trialingBusinesses || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-500" />
            Platform Overview & Tenant Analytics
          </h1>
          <p className="text-xs text-slate-400">Real-time platform subscriptions, tenant metrics, and system status</p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Refresh Platform Metrics
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Registered Businesses</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{totalBusinesses} Tenants</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Active Subscriptions</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-0.5">{activeSubscribers} Paid</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/80 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Free Trial Tenants</p>
            <h3 className="text-2xl font-black text-amber-400 mt-0.5">{totalTrialing} Trialing</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-950 text-violet-400 border border-violet-800/80 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Platform Revenue</p>
            <h3 className="text-2xl font-black text-violet-400 mt-0.5">KSh {stats?.totalRevenue ? Number(stats.totalRevenue).toLocaleString() : '0.00'}</h3>
          </div>
        </div>
      </div>

      {/* Recent Tenants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white">Registered Tenant Directory</h3>
          <span className="text-xs font-bold text-slate-400">{businesses.length} Total Registered</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Business Name</th>
                <th className="py-3.5 px-4">Owner Email</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Shops</th>
                <th className="py-3.5 px-4 text-center">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No business tenants registered yet.
                  </td>
                </tr>
              ) : (
                businesses.slice(0, 10).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850">
                    <td className="py-3.5 px-4 font-bold text-white">{b.name}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{b.users?.[0]?.email || b.ownerEmail || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-full border ${
                          b.subscriptionStatus === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {b.subscriptionStatus || 'FREE_TRIAL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-400">{b.shops?.length || 1} Shops</td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                      {new Date(b.createdAt).toLocaleDateString()}
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
