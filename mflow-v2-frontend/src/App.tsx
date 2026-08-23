import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { POSTerminalPage } from './pages/pos/POSTerminalPage';
import { SalesHistoryPage } from './pages/sales/SalesHistoryPage';
import { ProductsSalesHistoryPage } from './pages/sales/ProductsSalesHistoryPage';
import { ServicesSalesHistoryPage } from './pages/sales/ServicesSalesHistoryPage';
import { ProductsPage } from './pages/catalog/ProductsPage';
import { CategoriesPage } from './pages/catalog/CategoriesPage';
import { ServicesPage } from './pages/catalog/ServicesPage';
import { ServiceCategoriesPage } from './pages/catalog/ServiceCategoriesPage';
import { TransfersPage } from './pages/inventory/TransfersPage';
import { ReturnsPage } from './pages/inventory/ReturnsPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { QuotationsPage } from './pages/quotations/QuotationsPage';
import { ProfitLossPage } from './pages/reports/ProfitLossPage';
import { GeneralLedgerPage } from './pages/reports/GeneralLedgerPage';
import { BalanceSheetPage } from './pages/reports/BalanceSheetPage';
import { BranchSettingsPage } from './pages/settings/BranchSettingsPage';
import { StaffPage } from './pages/settings/StaffPage';
import { PaymentAccountsPage } from './pages/settings/PaymentAccountsPage';
import { ProfilePage } from './pages/settings/ProfilePage';
import { AuditTrailPage } from './pages/settings/AuditTrailPage';
import { SuperAdminDashboardPage } from './pages/superadmin/SuperAdminDashboardPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<LoginPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pos" element={<POSTerminalPage />} />
            <Route path="/sales" element={<SalesHistoryPage />} />
            <Route path="/sales/products" element={<ProductsSalesHistoryPage />} />
            <Route path="/sales/services" element={<ServicesSalesHistoryPage />} />

            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/service-categories" element={<ServiceCategoriesPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />

            {/* 3 Standalone Financial Report Routes */}
            <Route path="/finance/reports/profit-and-loss" element={<ProfitLossPage />} />
            <Route path="/finance/reports/general-ledger" element={<GeneralLedgerPage />} />
            <Route path="/finance/reports/balance-sheet" element={<BalanceSheetPage />} />

            <Route path="/settings/branches" element={<BranchSettingsPage />} />
            <Route path="/settings/staff" element={<StaffPage />} />
            <Route path="/settings/payment-accounts" element={<PaymentAccountsPage />} />
            <Route path="/settings/audit-trail" element={<AuditTrailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* SuperAdmin Dedicated Route */}
            <Route
              path="/superadmin"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardPage />
                </SuperAdminRoute>
              }
            />
          </Route>

          {/* Fallback Catch-All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
