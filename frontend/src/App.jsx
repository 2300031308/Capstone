import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterProduct from './pages/RegisterProduct';
import ProductList from './pages/ProductList';
import ProductDetails from './pages/ProductDetails';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogin = (selectedRole) => {
    setRole(selectedRole);
    localStorage.setItem('role', selectedRole);
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('role');
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <Sidebar role={role} />
      <div className="main-wrapper">
        <Header
          role={role}
          onLogout={handleLogout}
          onRefresh={triggerRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="main-content" key={refreshKey}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard role={role} />} />
            <Route path="/register" element={<RegisterProduct role={role} />} />
            <Route path="/products" element={<ProductList role={role} />} />
            <Route path="/products/:productId" element={<ProductDetails role={role} />} />
            <Route path="/transfer" element={<PlaceholderPage title="Transfer Ownership" desc="Ownership transfer on Hyperledger Fabric will be enabled in Objective 4." targetObj="O4" />} />
            <Route path="/verify" element={<PlaceholderPage title="Product Authentication & QR Verification" desc="ECDSA digital signature verification and QR validation will be enabled in Objective 2 & 3." targetObj="O2/O3" />} />
            <Route path="/history" element={<PlaceholderPage title="Blockchain Provenance History" desc="Complete chronological audit trail via getHistoryForKey will be enabled in Objective 5." targetObj="O5" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
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
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
        <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Planned Milestone Feature ({targetObj})</h3>
        <p style={{ maxWidth: '520px', margin: '0 auto 20px', color: 'var(--text-secondary)' }}>
          This component interface is structured for upcoming project objectives. The underlying smart contract stubs are already prepared on the chaincode.
        </p>
        <span className="badge badge-default">
          Current Focus: Objective 1 (Fabric Network &amp; World State Storage)
        </span>
      </div>
    </div>
  );
}
