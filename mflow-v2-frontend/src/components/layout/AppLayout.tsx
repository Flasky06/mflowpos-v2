import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { PaywallModal } from '../common/PaywallModal';
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
  Store,
  User,
  Bell,
  PackageCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, activeShopId, setActiveShopId, logout } = useAuthStore();
  const navigate = useNavigate();

  const [shops, setShops] = useState<any[]>([]);
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const isNotificationEligible = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SHOP_ADMIN';

  // Exclusive Accordion State (Only one group open at a time)
  const [openGroupTitle, setOpenGroupTitle] = useState<string | null>('Dashboard');

  const fetchLayoutData = async () => {
    try {
      const promises: Promise<any>[] = [
        apiClient.get('/business/shops'),
        apiClient.get('/purchase-orders').catch(() => apiClient.get('/purchases/orders')),
      ];

      if (isNotificationEligible) {
        promises.push(apiClient.get('/notifications/unread-count').catch(() => ({ data: { data: { unreadCount: 0 } } })));
      }

      const results = await Promise.all(promises);
      const shopRes = results[0];
      const poRes = results[1];
      const notifRes = results[2];

      const shopList = shopRes.data?.data || [];
      setShops(shopList);

      if (!activeShopId && shopList.length > 0) {
        setActiveShopId(shopList[0].id);
      }

      const allOrders = poRes.data?.data || [];
      const pendingList = allOrders.filter((po: any) => !po.status || po.status === 'PENDING');
      setPendingPOs(pendingList);

      if (notifRes?.data?.data?.unreadCount !== undefined) {
        setUnreadCount(notifRes.data.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLayoutData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeShop = shops.find((s) => s.id === activeShopId);

  // Grouped Navigation Tree Structure (Aligned with original mflowpos)
  const menuGroups = [
    {
      title: 'Main',
      isCollapsible: false,
      items: [
        { to: '/dashboard', label: 'POS Terminal & Register', show: true },
      ],
    },
    {
      title: 'Sales',
      isCollapsible: true,
      items: [
        { to: '/sales', label: 'Sales History', show: true },
        { to: '/sales/products', label: 'Products Sales Log', show: true },
        { to: '/sales/services', label: 'Services Sales Log', show: true },
        { to: '/quotations', label: 'Quotations & Invoices', show: true },
        { to: '/customers', label: 'Customers Database', show: true },
      ],
    },
    {
      title: 'Products & Inventory',
      isCollapsible: true,
      items: [
        { to: '/products', label: 'Products Catalog', show: true },
        { to: '/categories', label: 'Product Categories', show: true },
        { to: '/services', label: 'Services Catalog', show: true },
        { to: '/service-categories', label: 'Service Categories', show: true },
        { to: '/transfers', label: 'Stock Branch Transfers', show: true },
        { to: '/returns', label: 'Customer Stock Returns', show: true },
      ],
    },
    {
      title: 'Suppliers',
      isCollapsible: true,
      items: [
        { to: '/suppliers', label: 'Suppliers & Purchase Orders', show: true },
      ],
    },
    {
      title: 'Finance',
      isCollapsible: true,
      items: [
        { to: '/expenses', label: 'Operating Expenses', show: true },
        { to: '/expense-categories', label: 'Expense Categories', show: true },
        { to: '/finance/reports/profit-and-loss', label: 'Statement of Profit & Loss', show: true },
        { to: '/finance/reports/general-ledger', label: 'General Ledger', show: true },
        { to: '/finance/reports/balance-sheet', label: 'Statement of Balance Sheet', show: true },
      ],
    },
    {
      title: 'Admin',
      isCollapsible: true,
      items: [
        { to: '/superadmin', label: 'SuperAdmin Control Panel', show: user?.role === 'SUPER_ADMIN' },
        { to: '/notifications', label: 'Notifications Inbox', show: isNotificationEligible },
        { to: '/profile', label: 'Business Profile & Subscription', show: true },
        { to: '/settings/payment-accounts', label: 'Payment Accounts & Paybills', show: true },
        { to: '/settings/branches', label: 'Shops & Branch Locations', show: user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' },
        { to: '/settings/staff', label: 'Team Management & Permissions', show: user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' },
        { to: '/settings/audit-trail', label: 'System Audit Trail', show: true },
      ],
    },
  ];

  const toggleGroup = (title: string) => {
    setOpenGroupTitle((prev) => (prev === title ? null : title));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Subscription Paywall Listener */}
      <PaywallModal />

      {/* MOBILE TOP HEADER */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <span className="font-black text-lg tracking-tight text-white">
            mflowpos.com
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pendingPOs.length > 0 && (
            <button
              onClick={() => navigate('/suppliers')}
              className="p-1.5 bg-amber-500 text-white rounded-lg relative"
              title="Pending Purchase Orders"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-[10px] font-extrabold text-white rounded-full flex items-center justify-center">
                {pendingPOs.length}
              </span>
            </button>
          )}

          {shops.length > 0 && (
            <select
              value={activeShopId || ''}
              onChange={(e) => setActiveShopId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-lg py-1.5 px-2.5 focus:outline-none"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 hover:ring-2 hover:ring-indigo-400 transition-all"
            title="Profile & Subscription"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs"
        />
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* RESPONSIVE SIDEBAR DRAWER */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* ACCORDION SIDEBAR MENU ITEMS */}
          <nav className="flex-1 overflow-hidden p-4 space-y-3">
            {menuGroups.map((group) => {
              const isOpen = !group.isCollapsible || openGroupTitle === group.title;
              const visibleItems = group.items.filter((item) => item.show);

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {group.isCollapsible ? (
                    <>
                      <button
                        onClick={() => toggleGroup(group.title)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors rounded-lg"
                      >
                        <span>{group.title}</span>
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="pl-3 space-y-1 mt-1 border-l-2 border-slate-800 ml-3">
                          {visibleItems.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              end
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={({ isActive }) =>
                                `block px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                  isActive
                                    ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                }`
                              }
                            >
                              {item.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1">
                      {visibleItems.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `block px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* USER FOOTER BAR */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-3 overflow-hidden flex-1 p-1.5 -ml-1 rounded-xl hover:bg-slate-800/80 transition-colors group cursor-pointer"
              title="View Profile & Subscription Billing"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate transition-colors">
                  {user?.fullName || 'Active User'}
                </p>
                <p className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 uppercase transition-colors">
                  {user?.role?.replace('_', ' ')} · Settings
                </p>
              </div>
            </Link>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              title={isFullscreen ? 'Exit Full Screen' : 'Enlarge Screen for Full View'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-indigo-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {isNotificationEligible && (
              <Link
                to="/notifications"
                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 relative"
                title="System Notifications Desk"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full text-[9px] font-black w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-y-auto">
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
