import { useState, useEffect } from 'react';
import { networkApi } from '../services/api';

export default function Header({ role, onLogout, onRefresh, isRefreshing }) {
  const [networkStatus, setNetworkStatus] = useState({
    connected: false,
    status: 'CHECKING',
    latencyMs: null,
    channel: 'mychannel',
    peerEndpoint: 'localhost:7051',
    lastSynchronized: null,
  });

  const checkStatus = async () => {
    try {
      const response = await networkApi.getStatus();
      if (response && response.data) {
        setNetworkStatus(response.data);
      }
    } catch {
      setNetworkStatus(prev => ({
        ...prev,
        connected: false,
        status: 'OFFLINE',
      }));
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll network status every 15 seconds
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    await checkStatus();
    if (onRefresh) {
      onRefresh();
    }
  };

  const roleLabels = {
    manufacturer: { name: 'Manufacturer', icon: '🏭', desc: 'Org1MSP — Product Origin' },
    distributor: { name: 'Distributor', icon: '🚚', desc: 'Org2MSP — Logistics & Transit' },
    retailer: { name: 'Retailer', icon: '🏪', desc: 'Retail Verification' },
    customer: { name: 'Consumer', icon: '👤', desc: 'End-User Verification' },
  };

  const currentRole = roleLabels[role?.toLowerCase()] || {
    name: role || 'Manufacturer',
    icon: '🏢',
    desc: 'Authorized Participant',
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Connecting...';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-title-wrap">
          <h1 className="header-app-title">
            <span className="chain-logo">⛓️</span>
            SupplyChain Provenance
          </h1>
          <span className="network-env-tag">Hyperledger Fabric 2.5</span>
        </div>
      </div>

      <div className="header-right">
        {/* Live Fabric Connection Indicator */}
        <div className={`network-pill ${networkStatus.connected ? 'online' : 'offline'}`} title={`Peer: ${networkStatus.peerEndpoint} | Channel: ${networkStatus.channel}`}>
          <span className="pulse-dot"></span>
          <span className="network-pill-text">
            {networkStatus.connected
              ? `Fabric Connected ${networkStatus.latencyMs ? `(${networkStatus.latencyMs}ms)` : ''}`
              : 'Fabric Offline'}
          </span>
          <span className="channel-badge">{networkStatus.channel}</span>
        </div>

        {/* Sync Status and Trigger */}
        <div className="sync-control">
          <span className="sync-time" title="Last World State synchronization">
            Sync: {formatTime(networkStatus.lastSynchronized)}
          </span>
          <button
            className={`btn-icon-sync ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleManualSync}
            title="Synchronize with Hyperledger Fabric ledger"
            aria-label="Synchronize ledger"
          >
            🔄
          </button>
        </div>

        {/* Active Role Indicator */}
        <div className="header-role-card">
          <div className="role-avatar">{currentRole.icon}</div>
          <div className="role-info">
            <span className="role-title">{currentRole.name}</span>
            <span className="role-subtext">{currentRole.desc}</span>
          </div>
          <button
            className="btn-switch-role"
            onClick={onLogout}
            title="Switch participant role"
          >
            Switch
          </button>
        </div>
      </div>
    </header>
  );
}
