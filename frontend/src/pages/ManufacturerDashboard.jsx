import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, networkApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  Factory,
  PackagePlus,
  Boxes,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Layers,
  Search,
  History,
  X,
  AlertCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';

export default function ManufacturerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedActivities, setExpandedActivities] = useState({});

  const toggleActivityDetails = (id) => {
    setExpandedActivities((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick Verification / Provenance Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifySearchId, setVerifySearchId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

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
      setError(err.message || 'Unable to retrieve ledger state from blockchain gateway');
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

  // Handle Quick Verification lookup against real Fabric ledger
  const handleVerifySearch = async (e) => {
    if (e) e.preventDefault();
    const cleanId = verifySearchId.trim();
    if (!cleanId) return;

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const res = await productApi.verify(cleanId);
      if (res && res.data) {
        setVerifyResult(res.data);
      } else {
        setVerifyError('Product does not exist on the ledger.');
      }
    } catch (err) {
      setVerifyError(err.message || 'Product does not exist on the ledger.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const openVerifyModal = (prefillId = '') => {
    const clean = (prefillId || '').trim();
    setVerifySearchId(clean);
    setVerifyResult(null);
    setVerifyError(null);
    setVerifyModalOpen(true);
    if (clean) {
      setVerifyLoading(true);
      setTimeout(() => {
        productApi.verify(clean)
          .then(res => setVerifyResult(res.data))
          .catch(err => setVerifyError(err.message || 'Product does not exist on the ledger.'))
          .finally(() => setVerifyLoading(false));
      }, 100);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Synchronizing Manufacturer Ledger State..." />;
  }

  // Calculate 4 Core Real Metrics
  const userOrg = user?.organization || 'ManufacturerOrg';
  const myProducts = products.filter(
    p => (p.manufacturer && p.manufacturer.toLowerCase() === userOrg.toLowerCase()) ||
         p.manufacturer === 'ManufacturerOrg'
  );

  const inCustodyCount = myProducts.filter(
    p => p.currentOwner && p.currentOwner.toLowerCase() === userOrg.toLowerCase()
  ).length;

  const transferredCount = myProducts.filter(
    p => p.currentOwner && p.currentOwner.toLowerCase() !== userOrg.toLowerCase()
  ).length;

  const uniqueBatches = new Set(myProducts.map(p => p.batchNumber).filter(Boolean)).size;

  const isLedgerOnline = networkInfo?.connected !== false;

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
      {/* Header Bar */}
      <div className="dashboard-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Factory size={20} color="var(--primary)" />
            <h2 className="dashboard-title">Manufacturer Console</h2>
          </div>
          <p className="dashboard-subtitle">
            Authenticated Entity: <strong>{user?.name}</strong> &bull; Organization: <code>{user?.organization}</code>
          </p>
        </div>

        <div className="dashboard-actions">
          {/* Simple User Ledger Status */}
          <div
            className={`status-pill ${isLedgerOnline ? 'status-pill-online' : 'status-pill-offline'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: isLedgerOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isLedgerOnline ? '#059669' : '#dc2626',
              border: `1px solid ${isLedgerOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isLedgerOnline ? '#10b981' : '#ef4444',
                display: 'inline-block',
              }}
            />
            <span>Ledger Status: {isLedgerOnline ? 'Online' : 'Offline'}</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchDashboardData(true)}
            title="Synchronize world state immediately"
          >
            <RefreshCw size={13} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-content">
            <strong>Ledger Notice</strong>
            <p>{error}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchDashboardData(true)}>
            Retry
          </button>
        </div>
      )}

      {/* Primary Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ justifyContent: 'center', padding: '12px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}
          onClick={() => navigate('/register-product')}
        >
          <PackagePlus size={20} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Register Product</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ justifyContent: 'center', padding: '12px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}
          onClick={() => navigate('/products')}
        >
          <Boxes size={20} color="var(--primary)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>View Products</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ justifyContent: 'center', padding: '12px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}
          onClick={() => openVerifyModal()}
        >
          <ShieldCheck size={20} color="var(--success)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Verify Product</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ justifyContent: 'center', padding: '12px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}
          onClick={() => {
            if (myProducts.length > 0) {
              openVerifyModal(myProducts[0].productId);
            } else {
              openVerifyModal();
            }
          }}
        >
          <History size={20} color="var(--primary)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>View Provenance</span>
        </button>
      </div>

      {/* 4 Real Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Registered</span>
            <span className="stat-badge blue">Registered Origin</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{myProducts.length}</div>
            <Boxes size={26} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Total products enrolled on ledger</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">In Custody</span>
            <span className="stat-badge green">Manufacturer Facility</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{inCustodyCount}</div>
            <CheckCircle2 size={26} className="stat-icon-svg success" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Physical assets currently in facility</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Transferred</span>
            <span className="stat-badge amber">In Transit / Distributed</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{transferredCount}</div>
            <Truck size={26} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Custody handed off downstream</span>
          </div>
        </div>

        <div className="stat-card modern-card">
          <div className="stat-card-header">
            <span className="stat-label">Active Batches</span>
            <span className="stat-badge purple">Production Lots</span>
          </div>
          <div className="stat-value-wrap">
            <div className="stat-number">{uniqueBatches}</div>
            <Layers size={26} className="stat-icon-svg" />
          </div>
          <div className="stat-footer">
            <span className="stat-subtext">Distinct manufacturing batches</span>
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
                <p className="card-subtitle">Showing origin records committed by {userOrg}</p>
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
                <p>Register your first genuine product origin record to the distributed ledger.</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/register-product')}>
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
                      <th>Current Custodian</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                      <th>Actions</th>
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
                          <td>
                            <span className={`owner-badge ${product.currentOwner === userOrg ? 'owner-badge-mine' : ''}`}>
                              {product.currentOwner}
                            </span>
                          </td>
                          <td><StatusBadge status={product.status} isGenesis={isGenesis} /></td>
                          <td className="table-date-cell">
                            {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-action-view"
                                onClick={() => navigate(`/products/${product.productId}`)}
                                title="View full details on ledger"
                              >
                                View Details
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                onClick={() => openVerifyModal(product.productId)}
                                title="Inspect provenance"
                              >
                                Provenance
                              </button>
                            </div>
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
                {activities.map((act) => {
                  const isExpanded = !!expandedActivities[act.id];
                  const readableAction =
                    act.type === 'REGISTER_PRODUCT'
                      ? 'Product registered successfully'
                      : act.type === 'TRANSFER_OWNERSHIP'
                      ? 'Custody transferred successfully'
                      : 'Transaction committed to ledger';

                  return (
                    <div className="activity-item" key={act.id}>
                      <div className="activity-icon-col">
                        <div className="activity-bullet"></div>
                        <div className="activity-line"></div>
                      </div>
                      <div className="activity-body">
                        <div className="activity-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            Product {act.productId}
                          </strong>
                          <span className="activity-time" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {getRelativeTime(act.timestamp)}
                          </span>
                        </div>
                        {act.productName && (
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--primary)', marginTop: '2px' }}>
                            {act.productName}
                          </div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {readableAction}
                        </div>

                        <div style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => toggleActivityDetails(act.id)}
                            style={{
                              fontSize: '0.73rem',
                              color: 'var(--primary)',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            {isExpanded ? '− Technical Details' : '+ Technical Details'}
                          </button>
                          {isExpanded && (
                            <div
                              style={{
                                marginTop: '6px',
                                padding: '8px 10px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                              }}
                            >
                              <div><span style={{ color: '#64748b' }}>Action:</span> <strong style={{ fontFamily: 'monospace' }}>{act.type}</strong></div>
                              <div><span style={{ color: '#64748b' }}>Actor:</span> <code>{act.actor}</code></div>
                              <div><span style={{ color: '#64748b' }}>Ledger Status:</span> <span style={{ color: '#059669', fontWeight: 600 }}>{act.status}</span></div>
                              {act.id && (
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <span style={{ color: '#64748b' }}>Tx ID:</span> <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{act.id}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Product Verification & Provenance Modal */}
      {verifyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setVerifyModalOpen(false);
          }}
        >
          <div
            className="card modern-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Verify Product</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setVerifyModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px' }}>
              Enter a Product ID to verify its registration, manufacturer, current custodian, and status.
            </p>

            <form onSubmit={handleVerifySearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Product ID (e.g. P101, P000)"
                value={verifySearchId}
                onChange={(e) => setVerifySearchId(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={verifyLoading || !verifySearchId.trim()}
                style={{ padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Search size={14} />
                <span>Verify</span>
              </button>
            </form>

            {verifyLoading && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <LoadingSpinner message="Querying distributed ledger..." />
              </div>
            )}

            {verifyError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <div className="alert-content" style={{ fontSize: '0.86rem' }}>{verifyError}</div>
              </div>
            )}

            {verifyResult && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                {verifyResult.status === 'AUTHENTIC' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>✓ Authentic Product</span>
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                        {verifyResult.productName}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.83rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Product ID</span>
                        <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{verifyResult.productId}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Manufacturer</span>
                        <strong style={{ color: '#0f172a' }}>{verifyResult.manufacturer}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Current Custodian</span>
                        <strong style={{ color: '#2563eb' }}>{verifyResult.currentOwner}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Data Integrity</span>
                        <strong style={{ color: '#059669' }}>Verified</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Digital Signature</span>
                        <strong style={{ color: '#059669' }}>Valid</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setVerifyModalOpen(false);
                          navigate(`/products/${verifyResult.productId}`);
                        }}
                      >
                        View Full Provenance &rarr;
                      </button>
                    </div>
                  </>
                ) : verifyResult.status === 'LEGACY' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: 'rgba(100, 116, 139, 0.1)',
                          color: '#475569',
                          border: '1px solid rgba(100, 116, 139, 0.25)',
                        }}
                      >
                        <Info size={16} />
                        <span>Legacy Record</span>
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                        {verifyResult.productName}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#64748b' }}>
                      Cryptographic verification data not available for this legacy record.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.83rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Product ID</span>
                        <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{verifyResult.productId}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Manufacturer</span>
                        <strong style={{ color: '#0f172a' }}>{verifyResult.manufacturer}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Current Custodian</span>
                        <strong style={{ color: '#2563eb' }}>{verifyResult.currentOwner}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setVerifyModalOpen(false);
                          navigate(`/products/${verifyResult.productId}`);
                        }}
                      >
                        View Product Details &rarr;
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                        }}
                      >
                        <ShieldAlert size={16} />
                        <span>✕ Verification Failed</span>
                      </span>
                    </div>

                    <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#dc2626' }}>
                      {verifyResult.status === 'NOT_FOUND'
                        ? 'Product does not exist on the distributed ledger.'
                        : verifyResult.status === 'DATA_TAMPERED'
                        ? 'Data integrity failed: Recalculated SHA-256 digest does not match the ledger record.'
                        : verifyResult.status === 'SIGNATURE_INVALID'
                        ? 'Digital signature failed: Signature does not match the authorized Manufacturer identity.'
                        : verifyResult.message || 'Verification could not be confirmed.'}
                    </p>

                    {verifyResult.productId && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Product ID: <strong>{verifyResult.productId}</strong>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
