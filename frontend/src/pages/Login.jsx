import { useState } from 'react';

const roles = [
  { id: 'manufacturer', name: 'Manufacturer', icon: '🏭' },
  { id: 'distributor', name: 'Distributor', icon: '🚚' },
  { id: 'retailer', name: 'Retailer', icon: '🏪' },
  { id: 'customer', name: 'Customer', icon: '👤' },
];

export default function Login({ onLogin }) {
  const [selected, setSelected] = useState(null);

  const handleLogin = () => {
    if (selected) {
      onLogin(selected);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🔗 SupplyChain</h1>
        <p className="subtitle">Permissioned Supply-Chain Provenance on Hyperledger Fabric</p>

        <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.9rem' }}>
          Select your role to continue:
        </p>

        <div className="role-grid">
          {roles.map((role) => (
            <button
              key={role.id}
              className={`role-btn ${selected === role.id ? 'selected' : ''}`}
              onClick={() => setSelected(role.id)}
            >
              <span className="role-icon">{role.icon}</span>
              <span className="role-name">{role.name}</span>
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleLogin}
          disabled={!selected}
        >
          Enter Dashboard
        </button>
      </div>
    </div>
  );
}
