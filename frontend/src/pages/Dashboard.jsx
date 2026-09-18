import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, networkApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard({ role }) {
  const [products, setProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Fetch products, activity, and network status in parallel
      const [productsRes, activityRes, networkRes] = await Promise.all([
        productApi.getAll().catch(err => ({ error: err.message, data: [] })),
        networkApi.getActivity().catch(() => ({ data: [] })),
        networkApi.getStatus().catch(() => ({ data: null })),
      ]);

      if (productsRes.error) {
        throw new Error(productsRes.error);
      }

      setProducts(productsRes.data || []);
      setActivities(activityRes.data || []);
      if (networkRes.data) {
        setNetworkInfo(networkRes.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Unable to connect to Hyperledger Fabric gateway');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Auto-refresh every 12 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchDashboardData(false);
    }, 12000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner message="Querying Hyperledger Fabric World State (CouchDB)..." />;
  }

  // Calculate real metrics directly from Fabric world state
  const totalProducts = products.length;
  const registeredCount = products.filter(p => p.status === 'REGISTERED').length;
  const transferredCount = products.filter(p => p.status === 'TRANSFERRED').length;

  // Format relative timestamp
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="dashboard-view">
      {/* Top Banner & Refresh Controls */}
      <div className="dashboard-header-bar">
        <div>
          <h2 className="dashboard-title">Operational Dashboard</h2>
          <p className="dashboard-subtitle">
            Live Provenance Ledger &bull; Channel: <code>mychannel</code> &bull; Chaincode: <code>supplychain</code>
          </p>
        </div>

        <div className="dashboard-actions">
          <label className="toggle-label" title="Automatically poll Fabric ledger for state updates">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="toggle-text">Live Polling {autoRefresh ? '(12s)' : '(Off)'}</span>
          </label>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchDashboardData(true)}
            title="Fetch latest world state immediately"
          >
            🔄 Sync Ledger
          </button>

          {role === 'manufacturer' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/register')}
            >
              ➕ Register New Product
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <strong>Blockchain Connection Alert</strong>
            <p>{error}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchDashboardData(true)}>
            Retry Connection
          </button>
        </div>
      )}

      {/* 4 Real Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Products on Ledger</span>
            <span className="stat-badge blue">World State</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{totalProducts}</div>
            <div className="stat-icon-bg">📦</div>
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Verified on CouchDB</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Registered Products</span>
            <span className="stat-badge green">Active Origin</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{registeredCount}</div>
            <div className="stat-icon-bg">✅</div>
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Initial Manufacturer State</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Transferred Products</span>
            <span className="stat-badge amber">In Custody</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{transferredCount}</div>
            <div className="stat-icon-bg">🔄</div>
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Ownership Handover</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Network Health</span>
            <span className={`stat-badge ${networkInfo?.connected ? 'green' : 'red'}`}>
              {networkInfo?.connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number" style={{ fontSize: '1.25rem' }}>
              {networkInfo?.connected ? `Raft / ${networkInfo.latencyMs}ms` : 'Disconnected'}
            </div>
            <div className="stat-icon-bg">⛓️</div>
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">
              Peer: {networkInfo?.peerEndpoint || 'localhost:7051'} &bull; Org1MSP
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="dashboard-grid">
        {/* Left Column: Recent Products */}
        <div className="dashboard-main-col">
          <div className="card modern-card">
            <div className="card-header-bar">
              <div>
                <h3 className="card-title">Recent World State Products</h3>
                <p className="card-subtitle">Showing latest records committed to the ledger</p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/products')}
              >
                View Full Catalog ({totalProducts}) &rarr;
              </button>
            </div>

            {products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h4>No Products Found on Ledger</h4>
                <p>The Hyperledger Fabric world state currently holds no product records.</p>
                {role === 'manufacturer' && (
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
                    Register First Product
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Product Name</th>
                      <th>Batch</th>
                      <th>Manufacturer</th>
                      <th>Current Owner</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 7).map((product) => {
                      const isGenesis = product.productId === 'P000';
                      return (
                        <tr key={product.productId}>
                          <td>
                            <div className="product-id-cell">
                              <span className="product-id-text">{product.productId}</span>
                              {isGenesis && (
                                <span className="genesis-pill" title="Initial genesis seed record created during chaincode init">
                                  Seed
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="product-name-cell">
                            <strong>{product.productName}</strong>
                          </td>
                          <td><code>{product.batchNumber}</code></td>
                          <td>{product.manufacturer}</td>
                          <td>
                            <span className="owner-badge">{product.currentOwner}</span>
                          </td>
                          <td>
                            <StatusBadge status={product.status} isGenesis={isGenesis} />
                          </td>
                          <td>
                            <button
                              className="btn btn-action-view"
                              onClick={() => navigate(`/products/${product.productId}`)}
                              title="Inspect record from Fabric ledger"
                            >
                              Inspect &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Blockchain Activity Feed */}
        <div className="dashboard-side-col">
          <div className="card modern-card">
            <div className="card-header-bar">
              <div>
                <h3 className="card-title">Blockchain Activity</h3>
                <p className="card-subtitle">Real-time ledger event stream</p>
              </div>
              <span className="live-pulse-indicator" title="Live stream from backend/Fabric">
                <span className="dot"></span> Live
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="empty-state-compact">
                <p>No transaction events recorded yet.</p>
              </div>
            ) : (
              <div className="activity-stream">
                {activities.map((act) => (
                  <div className="activity-item" key={act.id}>
                    <div className="activity-icon-col">
                      <div className="activity-bullet"></div>
                      <div className="activity-line"></div>
                    </div>
                    <div className="activity-body">
                      <div className="activity-header">
                        <span className="activity-type">
                          {act.type === 'REGISTER_PRODUCT' ? 'REGISTER_PRODUCT' : act.type}
                        </span>
                        <span className="activity-time">{getRelativeTime(act.timestamp)}</span>
                      </div>
                      <div className="activity-detail">
                        Product <strong className="activity-id">{act.productId}</strong>
                        {act.productName ? ` (${act.productName})` : ''}
                      </div>
                      <div className="activity-meta">
                        <span className="activity-actor">Actor: {act.actor}</span>
                        <span className="activity-status-tag">{act.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="activity-footer-info">
              <span>All events cryptographically endorsed by peers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
