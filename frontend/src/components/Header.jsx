import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { networkApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, RefreshCw, LogOut, CheckCircle, XCircle } from 'lucide-react';

export default function Header({ onRefresh, isRefreshing }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    await checkStatus();
    if (onRefresh) {
      onRefresh();
    }
  };

  const roleConfigs = {
    manufacturer: { label: 'Manufacturer', msp: 'Org1MSP' },
    distributor: { label: 'Distributor', msp: 'Org2MSP' },
    retailer: { label: 'Retailer', msp: 'Org2MSP' },
    customer: { label: 'Consumer', msp: 'Org1MSP' },
  };

  const currentRoleConfig = roleConfigs[user?.role?.toLowerCase()] || {
    label: user?.role || 'Participant',
    msp: user?.mspId || 'Org1MSP',
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
          <ShieldCheck className="brand-logo-icon" size={22} color="var(--primary)" />
          <h1 className="header-app-title">TraceChain</h1>
          <span className="network-env-tag">Enterprise Console</span>
        </div>
      </div>

      <div className="header-right">
        {/* Live Fabric Connection Indicator */}
        <div
          className={`network-pill ${networkStatus.connected ? 'online' : 'offline'}`}
          title={`Peer: ${networkStatus.peerEndpoint} | Channel: ${networkStatus.channel}`}
        >
          {networkStatus.connected ? (
            <CheckCircle size={14} className="status-svg-icon" />
          ) : (
            <XCircle size={14} className="status-svg-icon" />
          )}
          <span className="network-pill-text">
            {networkStatus.connected
              ? `Fabric Online ${networkStatus.latencyMs ? `(${networkStatus.latencyMs}ms)` : ''}`
              : 'Fabric Offline'}
          </span>
          <span className="channel-badge">{networkStatus.channel}</span>
        </div>

        {/* Sync Status and Manual Trigger */}
        <div className="sync-control">
          <span className="sync-time">
            Sync: {formatTime(networkStatus.lastSynchronized)}
          </span>
          <button
            className={`btn-icon-sync ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleManualSync}
            title="Synchronize World State from Hyperledger Fabric"
            aria-label="Synchronize ledger"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Authenticated User Account Details (NO ROLE SWITCHING) */}
        <div className="header-user-account-box">
          <div className="user-text-info">
            <div className="user-name-line">
              <strong className="account-user-name">{user?.name}</strong>
              <span className="account-role-badge">{currentRoleConfig.label}</span>
            </div>
            <div className="user-sub-line">
              <span className="account-org-name">{user?.organization}</span>
              <span className="account-msp-tag">({currentRoleConfig.msp})</span>
            </div>
          </div>

          <button
            className="btn-logout"
            onClick={() => {
              logout();
              navigate('/');
            }}
            title="Sign out of current account"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
