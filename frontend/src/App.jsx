import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterProduct from './pages/RegisterProduct';
import ProductList from './pages/ProductList';
import ProductDetails from './pages/ProductDetails';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('role') || null);

  const handleLogin = (selectedRole) => {
    setRole(selectedRole);
    localStorage.setItem('role', selectedRole);
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('role');
  };

  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <Sidebar role={role} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<RegisterProduct />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:productId" element={<ProductDetails />} />
          <Route path="/transfer" element={<PlaceholderPage title="Transfer Ownership" desc="Coming in Objective 4" />} />
          <Route path="/verify" element={<PlaceholderPage title="Verify Product" desc="Coming in Objective 3 & 5" />} />
          <Route path="/history" element={<PlaceholderPage title="Provenance History" desc="Coming in Objective 5" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function PlaceholderPage({ title, desc }) {
  return (
    <div>
      <div className="page-header">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">🚧</div>
          <p>This feature will be implemented in a future phase.</p>
        </div>
      </div>
    </div>
  );
}
