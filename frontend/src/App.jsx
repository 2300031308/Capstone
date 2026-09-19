import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Landing from './pages/Landing';
import Login from './pages/Login';
import RegisterAccount from './pages/RegisterAccount';
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import RegisterProduct from './pages/RegisterProduct';
import ProductList from './pages/ProductList';
import ProductDetails from './pages/ProductDetails';
import TransferCustody from './pages/TransferCustody';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, user, getRoleDashboard } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <Routes>
      {/* 1. Root Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* 2. Public Authentication Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={getRoleDashboard(user.role)} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated && user ? (
            <Navigate to={getRoleDashboard(user.role)} replace />
          ) : (
            <RegisterAccount />
          )
        }
      />
      <Route
        path="/register-account"
        element={<Navigate to="/register" replace />}
      />

      {/* 3. Authenticated Application Shell & Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar />
              <div className="main-wrapper">
                <Header
                  onRefresh={triggerRefresh}
                  isRefreshing={isRefreshing}
                />
                <main className="main-content" key={refreshKey}>
                  <Routes>
                    {/* Dedicated Role Consoles */}
                    <Route
                      path="manufacturer/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['manufacturer']}>
                          <ManufacturerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="distributor/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['distributor']}>
                          <DistributorDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="retailer/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['retailer']}>
                          <RetailerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="customer/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['customer']}>
                          <CustomerDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Manufacturer Operations */}
                    <Route
                      path="register-product"
                      element={
                        <ProtectedRoute allowedRoles={['manufacturer']}>
                          <RegisterProduct />
                        </ProtectedRoute>
                      }
                    />

                    {/* Ledger Catalog & Verification */}
                    <Route
                      path="products"
                      element={
                        <ProtectedRoute>
                          <ProductList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="products/:productId"
                      element={
                        <ProtectedRoute>
                          <ProductDetails />
                        </ProtectedRoute>
                      }
                    />

                    {/* Custody Transfer & Milestone Stubs */}
                    <Route
                      path="transfer"
                      element={
                        <ProtectedRoute allowedRoles={['manufacturer', 'distributor', 'retailer']}>
                          <TransferCustody />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="verify"
                      element={
                        <ProtectedRoute>
                          <PlaceholderPage
                            title="Digital Signature & QR Code Verification"
                            desc="ECDSA digital signature verification and QR validation will be enabled in Objective 2 & 3."
                            targetObj="O2/O3"
                          />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="history"
                      element={
                        <ProtectedRoute>
                          <PlaceholderPage
                            title="Blockchain Provenance Audit Trail"
                            desc="Complete chronological audit trail via getHistoryForKey will be enabled in Objective 5."
                            targetObj="O5"
                          />
                        </ProtectedRoute>
                      }
                    />

                    {/* Role Dashboard Fallback */}
                    <Route
                      path="dashboard"
                      element={<RoleRedirectHelper />}
                    />
                    <Route
                      path="*"
                      element={<RoleRedirectHelper />}
                    />
                  </Routes>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function RoleRedirectHelper() {
  const { user, getRoleDashboard } = useAuth();
  const target = getRoleDashboard(user?.role);
  return <Navigate to={target} replace />;
}

function PlaceholderPage({ title, desc, targetObj }) {
  return (
    <div className="placeholder-view">
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="page-subtitle">{desc}</p>
        </div>
      </div>
      <div className="card modern-card" style={{ textAlign: 'center', padding: '60px 30px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '16px', background: 'rgba(37, 99, 235, 0.08)', marginBottom: '16px' }}>
          <ShieldCheck size={48} color="var(--primary)" />
        </div>
        <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
          Planned Milestone Interface ({targetObj})
        </h3>
        <p style={{ maxWidth: '520px', margin: '0 auto 20px', color: 'var(--text-secondary)' }}>
          This component interface is structured for upcoming project objectives. The underlying smart contract stubs are already prepared on the Hyperledger Fabric chaincode.
        </p>
        <span className="badge badge-default">
          Current Focus: Objective 1 (Fabric Network, World State Storage &amp; Enterprise RBAC)
        </span>
      </div>
    </div>
  );
}
