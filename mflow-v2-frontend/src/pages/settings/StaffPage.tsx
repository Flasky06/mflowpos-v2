import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Plus,
  ShieldCheck,
  Trash2,
  CheckSquare,
  Square,
  KeyRound,
  UserCheck,
  Ban,
  CheckCircle2,
} from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  { code: 'CAN_CANCEL_SALE', label: 'Void & Cancel Sales Receipts', description: 'Allows cashier to void completed transactions and auto-restock items' },
  { code: 'CAN_ADJUST_STOCK', label: 'Adjust Branch Product Stock', description: 'Allows physical stock level counting and count adjustments' },
  { code: 'CAN_RECORD_EXPENSE', label: 'Record Operating Outflows', description: 'Allows recording shop operational cash expenses' },
  { code: 'CAN_TRANSFER_STOCK', label: 'Initiate Inter-Shop Transfers', description: 'Allows requesting and transferring inventory between branches' },
  { code: 'CAN_MANAGE_CUSTOMERS', label: 'Manage Customers & Debt Ledger', description: 'Allows adding customers and recording credit payments' },
  { code: 'CAN_VIEW_REPORTS', label: 'Access Financial Reports', description: 'Allows viewing Statements of Profit & Loss, Ledger, and Balance Sheet' },
];

export const StaffPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'SALES_REP',
    shopId: '',
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const [userRes, shopRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/business/shops'),
      ]);
      setStaffList(userRes.data?.data || []);
      setShops(shopRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.fullName.trim() || !staffForm.email.trim() || !staffForm.password) {
      addToast({ type: 'warning', title: 'Missing Fields', message: 'Full name, email, and password are required' });
      return;
    }

    try {
      await apiClient.post('/users', staffForm);
      addToast({ type: 'success', title: 'Staff Registered', message: `Account for '${staffForm.fullName}' created` });
      setIsStaffModalOpen(false);
      setStaffForm({ fullName: '', email: '', password: '', role: 'SALES_REP', shopId: shops[0]?.id || '' });
      fetchStaffData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create staff account';
      addToast({ type: 'error', title: 'Registration Error', message: msg });
    }
  };

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      await apiClient.put(`/users/${selectedStaff.id}/permissions`, {
        customPermissions: selectedPermissions,
      });

      addToast({ type: 'success', title: 'Permissions Saved', message: `Permissions updated for '${selectedStaff.fullName}'` });
      setIsPermModalOpen(false);
      setSelectedStaff(null);
      fetchStaffData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update permissions';
      addToast({ type: 'error', title: 'Permission Error', message: msg });
    }
  };

  const handleToggleUserStatus = async (id: string, name: string, isCurrentlyActive: boolean) => {
    const actionText = isCurrentlyActive ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionText} staff user '${name}'?`)) return;

    try {
      await apiClient.put(`/users/${id}/status`);
      addToast({
        type: 'success',
        title: 'User Status Changed',
        message: `Account '${name}' ${isCurrentlyActive ? 'suspended' : 'reactivated'}.`,
      });
      fetchStaffData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Status Update Failed', message: err.response?.data?.message || 'Error updating status' });
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove staff account '${name}'?`)) return;
    try {
      await apiClient.delete(`/users/${id}`);
      addToast({ type: 'success', title: 'Account Removed', message: `Staff user '${name}' deleted` });
      fetchStaffData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', message: err.response?.data?.message || 'Failed to delete account' });
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalShopAdmins = staffList.filter((s) => s.role === 'SHOP_ADMIN' || s.role === 'ADMIN').length;
  const totalSalesReps = staffList.filter((s) => s.role === 'SALES_REP').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Reusable Page Header */}
      <PageHeader
        title="User Management & Permission Overrides"
        description="Manage cashier and manager accounts, toggle active/suspended status, and set permission grants"
        icon={<Users className="w-6 h-6 text-indigo-600" />}
        actions={
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setStaffForm({ fullName: '', email: '', password: '', role: 'SALES_REP', shopId: shops[0]?.id || '' });
              setIsStaffModalOpen(true);
            }}
          >
            Add New Staff Member
          </Button>
        }
      />

      {/* Reusable KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total User Accounts"
          value={`${staffList.length} Accounts`}
          icon={<Users className="w-6 h-6" />}
          variant="indigo"
        />
        <StatCard
          title="Shop Managers & Admins"
          value={`${totalShopAdmins} Managers`}
          icon={<UserCheck className="w-6 h-6" />}
          variant="violet"
        />
        <StatCard
          title="Cashiers & Sales Reps"
          value={`${totalSalesReps} Cashiers`}
          icon={<KeyRound className="w-6 h-6" />}
          variant="emerald"
        />
      </div>

      {/* Staff Table & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <SearchInput
            value={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search staff by full name or email address..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600">Role Filter:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl py-2 px-3 focus:outline-none"
            >
              <option value="ALL">All Roles ({staffList.length})</option>
              <option value="ADMIN">Admins</option>
              <option value="SHOP_ADMIN">Shop Admins</option>
              <option value="SALES_REP">Sales Reps / Cashiers</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4 text-center">Assigned Role</th>
                <th className="py-3.5 px-4 text-center">Account Status</th>
                <th className="py-3.5 px-4">Branch Shop</th>
                <th className="py-3.5 px-4 text-center">Granted Overrides</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No staff members found matching filter.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const perms = staff.customPermissions || [];
                  const isActive = staff.active !== false;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{staff.fullName}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{staff.email}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            staff.role === 'SUPER_ADMIN' || staff.role === 'ADMIN'
                              ? 'violet'
                              : staff.role === 'SHOP_ADMIN'
                              ? 'indigo'
                              : 'emerald'
                          }
                        >
                          {staff.role?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isActive ? 'emerald' : 'rose'}>
                          {isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        {staff.shop?.name || 'All Branches'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {staff.role === 'SUPER_ADMIN' || staff.role === 'ADMIN' ? (
                          <span className="text-xs font-bold text-violet-600">Full Access</span>
                        ) : perms.length > 0 ? (
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            {perms.length} Granted
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {staff.role !== 'ADMIN' && staff.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleToggleUserStatus(staff.id, staff.fullName, isActive)}
                              title={isActive ? 'Suspend User' : 'Reactivate User'}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isActive
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setSelectedPermissions(staff.customPermissions || []);
                              setIsPermModalOpen(true);
                            }}
                            title="Manage Permissions"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                          >
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                            title="Remove Account"
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-slate-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REUSABLE CREATE STAFF MODAL */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title="Add New Staff Member"
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={staffForm.fullName}
              onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              placeholder="sarah@shop.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password *</label>
            <input
              type="password"
              required
              value={staffForm.password}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Staff Role *</label>
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            >
              <option value="SALES_REP">Sales Rep / Cashier</option>
              <option value="SHOP_ADMIN">Shop Manager / Admin</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Assigned Branch Shop</label>
            <select
              value={staffForm.shopId}
              onChange={(e) => setStaffForm({ ...staffForm, shopId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.shopType})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Register Staff Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* REUSABLE PERMISSIONS MODAL */}
      {selectedStaff && (
        <Modal
          isOpen={isPermModalOpen}
          onClose={() => setIsPermModalOpen(false)}
          title="Custom Permission Overrides"
          subtitle={`Configure granted permissions for '${selectedStaff.fullName}'`}
          maxWidth="lg"
        >
          <form onSubmit={handleUpdatePermissions} className="space-y-3">
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.code);
                return (
                  <div
                    key={perm.code}
                    onClick={() => togglePermission(perm.code)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="mt-0.5 text-indigo-600">
                      {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{perm.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setIsPermModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Permissions
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
