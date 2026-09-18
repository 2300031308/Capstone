import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, networkApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Truck, ShieldCheck, Boxes, RefreshCw, ArrowRight } from 'lucide-react';

export default function DistributorDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDistributorData = useCallback(async () => {
    try {
      setLoading(true);
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
      console.error('Failed to load distributor dashboard:', err);
      setError(err.message || 'Unable to load distributor data from Fabric');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistributorData();
  }, [fetchDistributorData]);

  if (loading) {
    return <LoadingSpinner message="Querying Distributor Custody from Fabric..." />;
  }

  // Filter products relevant to logistics
  const inCustody = products.filter(
    p => p.currentOwner && p.currentOwner.toLowerCase().includes('distributor')
  );
  const availableToTransfer = products.filter(p => p.status === 'REGISTERED');

  return (
    <div className="dashboard-view">
      <div className="dashboard-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Truck size={20} color="var(--primary)" />
            <h2 className="dashboard-title">Distributor Operations Console</h2>
          </div>
          <p className="dashboard-subtitle">
            Authenticated Entity: <strong>{user?.name}</strong> &bull; Organization: <code>{user?.organization}</code> &bull; MSP: <code>{user?.mspId}</code>
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchDistributorData}
          >
            <RefreshCw size={13} />
            <span>Sync Ledger</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/transfer')}
            title="Transfer ownership stub (O4)"
          >
            <Truck size={14} />
            <span>Process Custody Transfer</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Distributor Custody</span>
            <span className="stat-badge blue">In Hand</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{inCustody.length}</div>
            <Boxes size={28} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Assets assigned to {user?.organization}</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Available for Custody Transfer</span>
            <span className="stat-badge amber">Supply Chain Intake</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{availableToTransfer.length}</div>
            <Truck size={28} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Registered assets eligible for logistics</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Verified Ledger Items</span>
            <span className="stat-badge green">Network Wide</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{products.length}</div>
            <ShieldCheck size={28} className="stat-icon-svg success" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Immutable World State records</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Fabric Node Health</span>
            <span className={`stat-badge ${networkInfo?.connected ? 'green' : 'red'}`}>
              {networkInfo?.connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number" style={{ fontSize: '1.4rem' }}>
              {networkInfo?.connected ? `${networkInfo.latencyMs}ms` : 'Down'}
            </div>
            <span className="channel-badge">mychannel</span>
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Org2MSP Peer: localhost:9051</span>
          </div>
        </div>
      </div>

      {/* Main Table & Activity */}
      <div className="dashboard-grid">
        <div className="dashboard-main-col">
          <div className="card modern-card">
            <div className="card-header-bar">
              <div>
                <h3 className="card-title">Available Ledger Shipments</h3>
                <p className="card-subtitle">Verified products ready for custody inspection and transfer</p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/products')}
              >
                Inspect All Products &rarr;
              </button>
            </div>

            {products.length === 0 ? (
              <div className="empty-state">
                <p>No products currently registered on the ledger.</p>
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
                    {products.slice(0, 8).map((product) => (
                      <tr key={product.productId} className="table-row-hover">
                        <td><strong className="product-id-text">{product.productId}</strong></td>
                        <td>{product.productName}</td>
                        <td><code className="batch-code">{product.batchNumber}</code></td>
                        <td>{product.manufacturer}</td>
                        <td><span className="owner-badge">{product.currentOwner}</span></td>
                        <td><StatusBadge status={product.status} /></td>
                        <td>
                          <button
                            className="btn btn-action-view"
                            onClick={() => navigate(`/products/${product.productId}`)}
                          >
                            Inspect &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Activity */}
        <div className="dashboard-side-col">
          <div className="card modern-card">
            <div className="card-header-bar">
              <h3 className="card-title">Logistics Events</h3>
              <span className="live-pulse-indicator">
                <span className="dot"></span> Live
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="empty-state-compact">
                <p>No activities recorded yet.</p>
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
                        <span className="activity-time">Confirmed</span>
                      </div>
                      <div className="activity-detail">
                        Product <strong className="activity-id">{act.productId}</strong>
                      </div>
                      <div className="activity-meta">
                        <span>Actor: {act.actor}</span>
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
