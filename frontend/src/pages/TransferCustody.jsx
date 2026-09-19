import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Boxes,
  Store,
  Building2,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function TransferCustody() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('productId');

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(preselectedId || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successReceipt, setSuccessReceipt] = useState(null);

  const userRole = (user?.role || '').toLowerCase();
  const userOrg = user?.organization || '';

  // Determine transition specs based on authenticated role
  const getTransitionDetails = () => {
    switch (userRole) {
      case 'manufacturer':
        return {
          stepName: 'Hop 1: Manufacturer Dispatches to Logistics',
          fromOwner: 'ManufacturerOrg',
          fromMsp: 'Org1MSP',
          toOwner: 'DistributorOrg',
          toMsp: 'Org2MSP',
          expectedStatus: 'REGISTERED',
          targetStatus: 'IN_TRANSIT_TO_DISTRIBUTOR',
          actionLabel: 'Transfer Custody to Distributor',
          description: 'Transfer physical asset custody to authorized distributor logistics network.',
        };
      case 'distributor':
        return {
          stepName: 'Hop 2: Distributor Delivers to Retail Store',
          fromOwner: 'DistributorOrg',
          fromMsp: 'Org2MSP',
          toOwner: 'RetailerOrg',
          toMsp: 'Org2MSP',
          expectedStatus: 'IN_TRANSIT_TO_DISTRIBUTOR',
          targetStatus: 'DELIVERED_TO_RETAILER',
          actionLabel: 'Transfer Custody to Retailer',
          description: 'Deliver stock into custody of verified retail store partner.',
        };
      case 'retailer':
        return {
          stepName: 'Hop 3: Retail Store Point-of-Sale to Consumer',
          fromOwner: 'RetailerOrg',
          fromMsp: 'Org2MSP',
          toOwner: 'Consumer',
          toMsp: 'N/A (Terminal)',
          expectedStatus: 'DELIVERED_TO_RETAILER',
          targetStatus: 'SOLD_TO_CONSUMER',
          actionLabel: 'Finalize Consumer Point-of-Sale',
          description: 'Record final consumer sale on the blockchain. Product enters terminal state.',
        };
      default:
        return null;
    }
  };

  const transition = getTransitionDetails();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productApi.getAll();
      const all = res.data || [];

      // Filter products currently in this organization's custody and at the valid status for transfer
      const inCustody = all.filter(
        (p) => p.currentOwner === userOrg && p.status === transition?.expectedStatus
      );

      setProducts(inCustody);

      // If preselected product is in the list, keep it; otherwise select the first if available
      if (preselectedId && inCustody.some((p) => p.productId === preselectedId)) {
        setSelectedProductId(preselectedId);
      } else if (inCustody.length > 0 && !selectedProductId) {
        setSelectedProductId(inCustody[0].productId);
      }
    } catch (err) {
      console.error('Failed to query products in custody:', err);
      setError(err.message || 'Failed to retrieve products from ledger');
    } finally {
      setLoading(false);
    }
  }, [userOrg, transition?.expectedStatus, preselectedId, selectedProductId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please select a product to transfer.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await productApi.transfer(selectedProductId);

      if (res && res.data) {
        setSuccessReceipt({
          productId: selectedProductId,
          product: res.data,
          previousOwner: userOrg,
          newOwner: res.data.currentOwner,
          status: res.data.status,
          timestamp: res.data.updatedAt,
        });
        // Reload list
        loadProducts();
      } else {
        throw new Error('No confirmation receipt returned from ledger');
      }
    } catch (err) {
      console.error('Custody transfer transaction failed:', err);
      setError(err.message || 'Blockchain transaction endorsement failed. Please check permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.productId === selectedProductId);

  if (!transition) {
    return (
      <div className="placeholder-view">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div className="alert-content">
            <strong>Unauthorized Role</strong>
            <p>Your role ({userRole || 'Unknown'}) is not permitted to initiate supply chain custody transfers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transfer-custody-view">
      {/* Header Bar */}
      <div className="page-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Truck size={22} color="var(--primary)" />
            <h2 className="page-title">Supply Chain Custody Transfer Console</h2>
          </div>
          <p className="page-subtitle">
            Authenticated Entity: <strong>{user?.name}</strong> &bull; Organization: <code>{userOrg}</code> &bull; Identity: <code>{user?.mspId}</code>
          </p>
        </div>

        <div className="header-button-group">
          <button className="btn btn-secondary btn-sm" onClick={loadProducts} disabled={loading || submitting}>
            <RefreshCw size={13} style={{ marginRight: '5px' }} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* Security Architecture Callout */}
      <div
        className="card modern-card"
        style={{
          marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(16, 185, 129, 0.04))',
          border: '1px solid var(--border)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Lock size={20} color="var(--primary)" />
          <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Multi-Layer Custody Authorization:</strong> Transactions require dual verification: JWT role verification at the backend application gateway and smart contract endorsement with <code>ctx.clientIdentity.getMSPID()</code> on Hyperledger Fabric channel <code>mychannel</code>.
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <div className="alert-content">
            <strong>Custody Transfer Notice</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Success Receipt Modal / Card */}
      {successReceipt && (
        <div
          className="card modern-card"
          style={{
            marginBottom: '24px',
            borderLeft: '4px solid var(--success)',
            background: 'rgba(16, 185, 129, 0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} color="var(--success)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Custody Transfer Successfully Committed</h3>
                <span className="font-mono text-sm text-muted">Asset ID: {successReceipt.productId}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/products/${successReceipt.productId}`)}
              >
                <span>Inspect Product Record</span>
                <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSuccessReceipt(null)}
              >
                Dismiss
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              padding: '14px',
              background: '#ffffff',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Previous Custodian</span>
              <strong>{successReceipt.previousOwner}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>New Ledger Custodian</span>
              <strong style={{ color: 'var(--primary)' }}>{successReceipt.newOwner}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Updated State</span>
              <StatusBadge status={successReceipt.status} />
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Blockchain Timestamp</span>
              <span>{successReceipt.timestamp ? new Date(successReceipt.timestamp).toLocaleTimeString() : 'Committed'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left Column: Product Selection & Execution Form */}
        <div className="dashboard-main-col">
          <div className="card modern-card">
            <div className="card-header-bar" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title">Assets in Your Verified Custody</h3>
                <p className="card-subtitle">
                  Select a product currently held by <strong>{userOrg}</strong> in state <code>{transition.expectedStatus}</code>
                </p>
              </div>
              <span className="badge badge-default">{products.length} eligible item{products.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <LoadingSpinner message="Scanning world state for assets in custody..." />
            ) : products.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Boxes size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No Eligible Products in Custody</h4>
                <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  There are no products currently held by <strong>{userOrg}</strong> in state <code>{transition.expectedStatus}</code> ready for transfer.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products')}>
                  Browse Product Catalog &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleTransfer}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="productSelect" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                    Select Asset for Transfer:
                  </label>
                  <select
                    id="productSelect"
                    className="form-control"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    style={{ height: '42px', fontSize: '0.92rem' }}
                  >
                    {products.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        [{p.productId}] {p.productName} (Batch: {p.batchNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '20px',
                    }}
                  >
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#0f172a' }}>
                      Selected Asset Specification
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.84rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Product Name:</span>
                        <strong>{selectedProduct.productName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Batch Number:</span>
                        <code className="batch-code">{selectedProduct.batchNumber}</code>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Manufacturer:</span>
                        <span>{selectedProduct.manufacturer}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Current Status:</span>
                        <StatusBadge status={selectedProduct.status} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Transfer Action Button */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || !selectedProductId}
                    style={{ minWidth: '220px', height: '42px' }}
                  >
                    <Truck size={16} style={{ marginRight: '6px' }} />
                    <span>{submitting ? 'Endorsing Transaction...' : transition.actionLabel}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Visual State Machine Route Preview */}
        <div className="dashboard-side-col">
          <div className="card modern-card">
            <div className="card-header-bar" style={{ marginBottom: '14px' }}>
              <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Lifecycle Step Preview</h3>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Objective 4</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              {transition.description}
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>FROM CUSTODIAN</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{transition.fromOwner}</strong>
                  <code style={{ fontSize: '0.72rem', display: 'block', color: '#64748b' }}>{transition.fromMsp}</code>
                </div>
                <ArrowRight size={18} color="var(--primary)" />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>TO CUSTODIAN</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--primary)' }}>{transition.toOwner}</strong>
                  <code style={{ fontSize: '0.72rem', display: 'block', color: '#64748b' }}>{transition.toMsp}</code>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>TARGET STATE TRANSITION</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '0.75rem' }}>{transition.expectedStatus}</code>
                  <ArrowRight size={12} color="#94a3b8" />
                  <code style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{transition.targetStatus}</code>
                </div>
              </div>
            </div>

            {/* Complete Supply Chain Steps */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                Custody Chain Architecture
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: userRole === 'manufacturer' ? 1 : 0.6 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: userRole === 'manufacturer' ? 'var(--primary)' : '#94a3b8' }}></div>
                  <span>1. ManufacturerOrg (Org1MSP) &rarr; DistributorOrg</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: userRole === 'distributor' ? 1 : 0.6 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: userRole === 'distributor' ? 'var(--primary)' : '#94a3b8' }}></div>
                  <span>2. DistributorOrg (Org2MSP) &rarr; RetailerOrg</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: userRole === 'retailer' ? 1 : 0.6 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: userRole === 'retailer' ? 'var(--primary)' : '#94a3b8' }}></div>
                  <span>3. RetailerOrg (Org2MSP) &rarr; Consumer (Terminal)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
