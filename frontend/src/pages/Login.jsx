import { useState } from 'react';

const participants = [
  {
    id: 'manufacturer',
    name: 'Manufacturer Org',
    msp: 'Org1MSP',
    role: 'Origin & Production',
    icon: '🏭',
    desc: 'Authorized to register genuine products and commit origin records to the ledger.',
  },
  {
    id: 'distributor',
    name: 'Distributor Org',
    msp: 'Org2MSP',
    role: 'Logistics & Supply Chain',
    icon: '🚚',
    desc: 'Authorized to verify shipment custody and process supply chain transfers.',
  },
  {
    id: 'retailer',
    name: 'Retail Partner',
    msp: 'RetailerMSP',
    role: 'Inventory & Point of Sale',
    icon: '🏪',
    desc: 'Receives verified inventory and validates authenticity before retail distribution.',
  },
  {
    id: 'customer',
    name: 'Consumer / End-User',
    msp: 'ClientMSP',
    role: 'Provenance Verification',
    icon: '👤',
    desc: 'Inspects tamper-proof provenance history and authenticates product legitimacy.',
  },
];

export default function Login({ onLogin }) {
  const [selected, setSelected] = useState('manufacturer');

  const handleLogin = () => {
    if (selected) {
      onLogin(selected);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card modern-card">
        <div className="login-brand-header">
          <div className="login-chain-icon">⛓️</div>
          <h2>Permissioned Supply Chain</h2>
          <p className="login-subtitle">
            Hyperledger Fabric 2.5 &bull; Enterprise Provenance Platform
          </p>
        </div>

        <div className="login-role-selection-box">
          <label className="selection-label">Select Participant Identity:</label>

          <div className="role-cards-list">
            {participants.map((p) => {
              const isSelected = selected === p.id;
              return (
                <div
                  key={p.id}
                  className={`role-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelected(p.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelected(p.id); }}
                >
                  <div className="role-select-icon">{p.icon}</div>
                  <div className="role-select-info">
                    <div className="role-select-title-row">
                      <strong className="role-select-name">{p.name}</strong>
                      <span className="msp-badge">{p.msp}</span>
                    </div>
                    <p className="role-select-desc">{p.desc}</p>
                  </div>
                  <div className="role-radio-dot">
                    {isSelected && <div className="dot-inner"></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="login-footer">
          <button
            className="btn btn-primary btn-block"
            onClick={handleLogin}
          >
            Access Distributed Ledger &rarr;
          </button>
          <p className="login-security-notice">
            🔒 Access controlled via Hyperledger Fabric X.509 Certificate Authorities
          </p>
        </div>
      </div>
    </div>
  );
}
