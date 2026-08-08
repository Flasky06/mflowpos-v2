import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from './store/adminAuthStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Admin Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected SuperAdmin Portal */}
        <Route
          element={
            <ProtectedAdminRoute>
              <Layout />
            </ProtectedAdminRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/businesses" element={<BusinessesPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/system-health" element={<SystemHealthPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
