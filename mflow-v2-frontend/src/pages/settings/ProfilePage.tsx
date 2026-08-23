import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { apiClient } from '../../api/client';
import { User, Store, Shield, CheckCircle2, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, activeShopId, updateUser } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [shops, setShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>(activeShopId || '');
  const [operationMode, setOperationMode] = useState<'BOTH' | 'PRODUCTS_ONLY' | 'SERVICES_ONLY'>('BOTH');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.businessId) {
      apiClient
        .get('/business/shops')
        .then((res) => {
          const fetchedShops = res.data.data || [];
          setShops(fetchedShops);
          const currentShop = fetchedShops.find((s: any) => s.id === activeShopId) || fetchedShops[0];
          if (currentShop) {
            setSelectedShopId(currentShop.id);
            setOperationMode(currentShop.shopType || 'BOTH');
          }
        })
        .catch(() => {});
    }
  }, [user?.businessId, activeShopId]);

  const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shopId = e.target.value;
    setSelectedShopId(shopId);
    const shop = shops.find((s) => s.id === shopId);
    if (shop) {
      setOperationMode(shop.shopType || 'BOTH');
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) {
      addToast({ type: 'error', title: 'No Branch Selected', message: 'Select a shop branch to configure' });
      return;
    }

    setIsSaving(true);
    try {
      // Update shop operation mode on backend
      await apiClient.put(`/business/shops/${selectedShopId}`, {
        shopType: operationMode,
      });

      // Update active user state in authStore
      if (user?.shop) {
        updateUser({
          shop: {
            ...user.shop,
            shopType: operationMode,
          },
        });
      }

      addToast({
        type: 'success',
        title: 'Operation Mode Saved',
        message: `Branch set to ${operationMode.replace('_', ' ')} mode. Navigation updated.`,
      });

      // Refresh shops list
      const res = await apiClient.get('/business/shops');
      setShops(res.data.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update shop operation mode.';
      addToast({ type: 'error', title: 'Save Error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Account Info Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          Account Profile Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Full Name</label>
            <p className="font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">{user?.fullName}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Email Address</label>
            <p className="font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">{user?.email}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Business Name</label>
            <p className="font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {user?.business?.name || 'Default Business'}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Assigned Role</label>
            <p className="font-bold text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-200 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription & Paystack Billing Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Business Subscription & Billing
          </h3>
          <span className="text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
            {(user?.business as any)?.subscription?.status || 'Active Plan'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Current Plan</label>
            <p className="font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
              mflow POS Standard
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Pricing Rate</label>
            <p className="font-bold text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-200">
              KES 1,000 / month
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Branches & Staff Limit</label>
            <p className="font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Unlimited
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-600">
            <p className="font-bold text-slate-900">Renew or extend your business subscription</p>
            <p className="text-[11px] text-slate-500">Instant activation with automated M-PESA STK push or Card</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await apiClient.post('/subscriptions/paystack/initialize', {});
                if (res.data?.data?.authorizationUrl) {
                  window.location.href = res.data.data.authorizationUrl;
                }
              } catch (err: any) {
                addToast({
                  type: 'error',
                  title: 'Payment Error',
                  message: err.response?.data?.message || 'Unable to connect to Paystack',
                });
              }
            }}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
          >
            Renew via Paystack (KES 1,000)
          </button>
        </div>
      </div>

      {/* Operation Mode Selection Form */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2 mb-4">
          <Store className="w-4 h-4 text-indigo-600" />
          Shop Operation Mode Preference
        </h3>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          {shops.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Branch to Configure</label>
              <select
                value={selectedShopId}
                onChange={handleShopChange}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-xl py-2.5 px-3 focus:outline-none focus:border-indigo-600"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.shopType})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Choose Operation Mode
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: BOTH */}
              <button
                type="button"
                onClick={() => setOperationMode('BOTH')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  operationMode === 'BOTH'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">BOTH</span>
                  {operationMode === 'BOTH' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sell physical products & non-inventory services (Laundry, Tailoring, Repairs).
                </p>
              </button>

              {/* Option 2: PRODUCTS_ONLY */}
              <button
                type="button"
                onClick={() => setOperationMode('PRODUCTS_ONLY')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  operationMode === 'PRODUCTS_ONLY'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">PRODUCTS ONLY</span>
                  {operationMode === 'PRODUCTS_ONLY' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Focus exclusively on physical inventory, barcodes, stock transfers, and PO restocks.
                </p>
              </button>

              {/* Option 3: SERVICES_ONLY */}
              <button
                type="button"
                onClick={() => setOperationMode('SERVICES_ONLY')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  operationMode === 'SERVICES_ONLY'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">SERVICES ONLY</span>
                  {operationMode === 'SERVICES_ONLY' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Focus on laundry, dry cleaning, repairs, consultations, and service job order progress.
                </p>
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving Preferences...' : 'Save Operation Mode Preference'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
