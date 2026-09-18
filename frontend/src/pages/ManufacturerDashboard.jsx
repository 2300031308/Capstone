import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, networkApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Factory, PackagePlus, Boxes, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ManufacturerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

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
    } catch (err) {
      console.error('Failed to load manufacturer dashboard:', err);
      setError(err.message || 'Unable to connect to Hyperledger Fabric gateway');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchDashboardData(false);
    }, 12000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner message="Loading Manufacturer World State from Fabric..." />;
  }

  const myProducts = products.filter(
    p => (p.manufacturer && p.manufacturer.toLowerCase() === (user?.organization || 'ManufacturerOrg').toLowerCase()) ||
         p.manufacturer === 'ManufacturerOrg'
  );
  const registeredCount = products.filter(p => p.status === 'REGISTERED').length;
  const uniqueBatches = new Set(products.map(p => p.batchNumber)).size;

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="dashboard-view">
      <div className="dashboard-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Factory size={20} color="var(--primary)" />
            <h2 className="dashboard-title">Manufacturer Console</h2>
          </div>
          <p className="dashboard-subtitle">
            Authenticated Entity: <strong>{user?.name}</strong> &bull; Organization: <code>{user?.organization}</code> &bull; Identity: <code>{user?.mspId}</code>
          </p>
        </div>

        <div className="dashboard-actions">
          <label className="toggle-label" title="Automatically poll Fabric ledger for state updates">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="toggle-text">Live Sync {autoRefresh ? '(12s)' : '(Off)'}</span>
          </label>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchDashboardData(true)}
            title="Synchronize world state immediately"
          >
            <RefreshCw size={13} />
            <span>Sync Ledger</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/register-product')}
          >
            <PackagePlus size={15} />
            <span>Register New Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-content">
            <strong>Blockchain Connection Notice</strong>
            <p>{error}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchDashboardData(true)}>
            Retry
          </button>
        </div>
      )}

      {/* Real Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Manufactured Assets</span>
            <span className="stat-badge blue">Org1MSP Origin</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{myProducts.length}</div>
            <Boxes size={28} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Committed with origin certificates</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Active Registered State</span>
            <span className="stat-badge green">Ledger Verified</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{registeredCount}</div>
            <CheckCircle2 size={28} className="stat-icon-svg success" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">World State: CouchDB</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Production Batches</span>
            <span className="stat-badge amber">Batch Tracking</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{uniqueBatches}</div>
            <Factory size={28} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Cryptographically indexed lots</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Fabric Peer Latency</span>
            <span className={`stat-badge ${networkInfo?.connected ? 'green' : 'red'}`}>
              {networkInfo?.connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number" style={{ fontSize: '1.4rem' }}>
              {networkInfo?.connected ? `${networkInfo.latencyMs}ms` : 'Down'}
            </div>
            <span className="channel-badge" style={{ fontSize: '0.8rem' }}>mychannel</span>
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Endorsement: Org1MSP &amp; Org2MSP</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Products Table + Live Activity */}
      <div className="dashboard-grid">
        <div className="dashboard-main-col">
          <div className="card modern-card">
            <div className="card-header-bar">
              <div>
                <h3 className="card-title">Manufactured Products on Ledger</h3>
                <p className="card-subtitle">Showing origin records committed by {user?.organization}</p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/products')}
              >
                Full Catalog &rarr;
              </button>
            </div>

            {myProducts.length === 0 ? (
              <div className="empty-state">
                <h4>No Manufactured Products Yet</h4>
                <p>Submit your first genuine product origin record to the Hyperledger Fabric ledger.</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
                  <PackagePlus size={14} /> Register First Product
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Product Name</th>
                      <th>Batch Number</th>
                      <th>Current Owner</th>
                      <th>Status</th>
                      <th>Registered On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProducts.slice(0, 7).map((product) => {
                      const isGenesis = product.productId === 'P000';
                      return (
                        <tr key={product.productId} className="table-row-hover">
                          <td>
                            <div className="product-id-cell">
                              <strong className="product-id-text">{product.productId}</strong>
                              {isGenesis && <span className="genesis-pill">Seed</span>}
                            </div>
                          </td>
                          <td><strong>{product.productName}</strong></td>
                          <td><code className="batch-code">{product.batchNumber}</code></td>
                          <td><span className="owner-badge">{product.currentOwner}</span></td>
                          <td><StatusBadge status={product.status} isGenesis={isGenesis} /></td>
                          <td className="table-date-cell">
                            {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <button
                              className="btn btn-action-view"
                              onClick={() => navigate(`/products/${product.productId}`)}
                              title="Inspect on Fabric ledger"
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

        {/* Live Blockchain Activity Stream */}
        <div className="dashboard-side-col">
          <div className="card modern-card">
            <div className="card-header-bar">
              <div>
                <h3 className="card-title">Blockchain Activity</h3>
                <p className="card-subtitle">Real-time ledger events</p>
              </div>
              <span className="live-pulse-indicator">
                <span className="dot"></span> Live
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="empty-state-compact">
                <p>No transactions logged yet.</p>
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
                        <span className="activity-type">{act.type}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
