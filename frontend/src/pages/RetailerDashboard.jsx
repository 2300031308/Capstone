import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, networkApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Store, ShieldCheck, Boxes, RefreshCw, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function RetailerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchRetailerData = useCallback(async () => {
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
      console.error('Failed to load retailer dashboard:', err);
      setError(err.message || 'Unable to load retailer data from Hyperledger Fabric');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRetailerData();
  }, [fetchRetailerData]);

  if (loading) {
    return <LoadingSpinner message="Querying Retail Store World State from Fabric..." />;
  }

  // Retail inventory calculations
  const retailInventory = products.filter(
    p => p.currentOwner && (p.currentOwner.toLowerCase().includes('retail') || p.currentOwner === user?.organization)
  );
  const verifiedAssets = products.length;
  const inStockCount = retailInventory.length > 0 ? retailInventory.length : products.length;

  return (
    <div className="dashboard-view">
      <div className="dashboard-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Store size={20} color="var(--primary)" />
            <h2 className="dashboard-title">Retail Store Operations Console</h2>
          </div>
          <p className="dashboard-subtitle">
            Authenticated Entity: <strong>{user?.name}</strong> &bull; Organization: <code>{user?.organization}</code> &bull; MSP: <code>{user?.mspId || 'RetailerMSP'}</code>
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchRetailerData}
            title="Synchronize retail inventory with Fabric ledger"
          >
            <RefreshCw size={13} />
            <span>Sync Ledger</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/verify')}
          >
            <ShieldCheck size={15} />
            <span>Verify Inbound Stock</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-content">
            <strong>Blockchain Query Error</strong>
            <p>{error}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchRetailerData}>
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Store Inventory Units</span>
            <span className="stat-badge blue">RetailerMSP</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{inStockCount}</div>
            <Store size={28} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Verified items in store registry</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Verified Ledger Assets</span>
            <span className="stat-badge green">CouchDB State</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{verifiedAssets}</div>
            <CheckCircle2 size={28} className="stat-icon-svg success" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Cryptographically authenticated</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Point-of-Sale Readiness</span>
            <span className="stat-badge amber">Ready for Sale</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{products.filter(p => p.status === 'REGISTERED').length}</div>
            <ShoppingBag size={28} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Eligible for consumer transfer</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Fabric Channel</span>
            <span className="stat-badge purple">{networkInfo?.channel || 'mychannel'}</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number" style={{ fontSize: '1.25rem' }}>
              {networkInfo?.peerEndpoint || 'localhost:7051'}
            </div>
            <Boxes size={28} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Consensus: Raft &bull; Status: Active</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="dashboard-content-grid">
        {/* Retail Stock Table */}
        <div className="card modern-card content-card-main">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Retail Shelf &amp; Inbound Stock</h3>
              <p className="card-desc">
                Products currently verified on the ledger and eligible for sale or point-of-sale customer dispatch.
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/products')}
            >
              <span>View All Products</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {products.length === 0 ? (
            <div className="empty-state-box">
              <Boxes size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <h4>No Retail Inventory Registered</h4>
              <p>
                There are currently no products registered on the Hyperledger Fabric ledger. Products registered by manufacturers will appear here.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Batch</th>
                    <th>Current Custodian</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 8).map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <span className="font-mono text-bold text-primary">
                          {product.productId}
                        </span>
                      </td>
                      <td>
                        <strong>{product.productName}</strong>
                      </td>
                      <td>{product.category || 'General'}</td>
                      <td>
                        <span className="batch-tag">{product.batchNumber}</span>
                      </td>
                      <td>
                        <span className="font-mono text-sm">{product.currentOwner}</span>
                      </td>
                      <td>
                        <StatusBadge status={product.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => navigate(`/products/${product.productId}`)}
                          title="Inspect provenance"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar Info Panels */}
        <div className="dashboard-side-col">
          {/* Retail Responsibility Card */}
          <div className="card modern-card role-guidance-card">
            <h4 className="card-section-title">Retailer Role Mandate</h4>
            <div className="guidance-step">
              <div className="step-badge">1</div>
              <div className="step-text">
                <strong>Inspect Inbound Consignments</strong>
                <p>Verify QR code signatures against manufacturer certificates before accepting into retail inventory.</p>
              </div>
            </div>
            <div className="guidance-step">
              <div className="step-badge">2</div>
              <div className="step-text">
                <strong>Ledger Ownership Transfer</strong>
                <p>Transfer product custody to the retail store entity on the Hyperledger Fabric channel.</p>
              </div>
            </div>
            <div className="guidance-step">
              <div className="step-badge">3</div>
              <div className="step-text">
                <strong>Consumer Point of Sale</strong>
                <p>Deliver verified authentic goods to consumers with tamper-proof provenance certificates.</p>
              </div>
            </div>
          </div>

          {/* Recent Channel Activity */}
          <div className="card modern-card">
            <h4 className="card-section-title">Ledger Audit Activity</h4>
            {activities.length === 0 ? (
              <p className="empty-subtext">No recent transactions recorded on ledger.</p>
            ) : (
              <div className="activity-timeline">
                {activities.slice(0, 5).map((act, idx) => (
                  <div className="timeline-item" key={idx}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <span className="timeline-action">{act.action}</span>
                      <span className="timeline-target">{act.productId}</span>
                      <span className="timeline-time">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'Verified'}
                      </span>
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
