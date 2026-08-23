import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { ShieldAlert, User, RefreshCw } from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditTrail = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [salesResult, expResult, stockResult] = await Promise.allSettled([
        apiClient.get(`/sales${shopQuery}`),
        apiClient.get(`/expenses${shopQuery}`),
        apiClient.get(`/transfers`),
      ]);

      const salesArr = salesResult.status === 'fulfilled' ? (salesResult.value.data?.data?.sales || salesResult.value.data?.data || []) : [];
      const expArr = expResult.status === 'fulfilled' ? (expResult.value.data?.data?.expenses || expResult.value.data?.data || []) : [];
      const transfersArr = stockResult.status === 'fulfilled' ? (stockResult.value.data?.data || []) : [];

      const logs: any[] = [];

      // Map Sales Activity
      if (Array.isArray(salesArr)) {
        salesArr.forEach((s: any) => {
          if (!s) return;
          logs.push({
            id: `sale-${s.id}`,
            timestamp: s.createdAt,
            userName: s.user?.fullName || 'Cashier',
            action: s.status === 'CANCELLED' ? 'SALE_VOIDED' : 'SALE_COMPLETED',
            reference: `Receipt #${s.receiptNumber || s.id?.slice(0, 8)}`,
            details: `Total Amount: KES ${Number(s.totalAmount || 0).toLocaleString()} (${s.customer?.name || 'Walk-in'})`,
            statusColor: s.status === 'CANCELLED' ? 'rose' : 'emerald',
          });
        });
      }

      // Map Expenses Activity
      if (Array.isArray(expArr)) {
        expArr.forEach((e: any) => {
          if (!e) return;
          logs.push({
            id: `exp-${e.id}`,
            timestamp: e.createdAt || e.expenseDate || new Date().toISOString(),
            userName: e.user?.fullName || 'Staff',
            action: 'EXPENSE_RECORDED',
            reference: `Expense #${e.id?.substring(0, 8) || 'EXP'}`,
            details: `Amount: KES ${Number(e.amount || 0).toLocaleString()} (${e.description || e.category?.name || 'General'})`,
            statusColor: 'amber',
          });
        });
      }

      // Map Stock Transfer Activity
      if (Array.isArray(transfersArr)) {
        transfersArr.forEach((t: any) => {
          if (!t) return;
          logs.push({
            id: `transfer-${t.id}`,
            timestamp: t.createdAt || new Date().toISOString(),
            userName: t.createdBy || 'Store Admin',
            action: 'STOCK_TRANSFER',
            reference: `Transfer #${t.id?.substring(0, 8)}`,
            details: `${t.fromShop?.name || 'Source'} ➔ ${t.toShop?.name || 'Destination'} (${t.status || 'COMPLETED'})`,
            statusColor: 'indigo',
          });
        });
      }

      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(logs);
    } catch (err) {
      console.error('Audit trail load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [activeShopId]);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="System Audit Trail & Activity Log"
        description="Immutable security audit logs for sales, voided transactions, and operational outflows"
        icon={<ShieldAlert className="w-6 h-6 text-indigo-600" />}
        actions={
          <Button
            isLoading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchAuditTrail}
          >
            Refresh Audit Trail
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <SearchInput
            value={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by cashier name, receipt #, or action details..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600">Action Filter:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl py-2 px-3 focus:outline-none"
            >
              <option value="ALL">All Actions ({auditLogs.length})</option>
              <option value="SALE_COMPLETED">Sales Completed</option>
              <option value="SALE_VOIDED">Sales Voided</option>
              <option value="EXPENSE_RECORDED">Expenses Recorded</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">User / Staff</th>
                <th className="py-3.5 px-4 text-center">Action Type</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No activity logs recorded for this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 text-xs">
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={log.statusColor}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{log.reference}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{log.details}</td>
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
