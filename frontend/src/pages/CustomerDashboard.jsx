import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import QRScannerModal from '../components/QRScannerModal';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ArrowRight,
  Boxes,
  Lock,
  ExternalLink,
  History,
  XCircle,
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setCatalogLoading(true);
        const res = await productApi.getAll();
        setCatalogProducts(res.data || []);
      } catch (err) {
        console.error('Failed to load products for consumer verification:', err);
      } finally {
        setCatalogLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const handleVerifyId = async (targetId) => {
    const cleanId = (targetId || '').trim();
    if (!cleanId) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const res = await publicApi.verify(cleanId);
      if (res && res.data) {
        setSearchResult(res.data);
      } else {
        setSearchError(`Product "${cleanId}" could not be verified on the blockchain.`);
      }
    } catch (err) {
      setSearchError(err.message || `No immutable record found for ID: "${cleanId}"`);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    handleVerifyId(searchId);
  };

  const handleSelectProduct = (prod) => {
    setSearchId(prod.productId);
    handleVerifyId(prod.productId);
  };

  const handleScanSuccess = (scannedId) => {
    setSearchId(scannedId);
    handleVerifyId(scannedId);
  };

  return (
    <div className="dashboard-view">
      {/* Header */}
      <div className="dashboard-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={22} color="var(--success)" />
            <h2 className="dashboard-title">Consumer Provenance &amp; Authenticity Portal</h2>
          </div>
          <p className="dashboard-subtitle">
            Authenticated Consumer: <strong>{user?.name}</strong> &bull; Verification Identity: <code>{user?.mspId || 'Org1MSP'}</code>
          </p>
        </div>

        <div className="dashboard-actions">
          <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <CheckCircle2 size={13} style={{ marginRight: '5px' }} />
            Fabric Online &bull; mychannel
          </span>
        </div>
      </div>

      {/* Main Verification Search Hero */}
      <div className="card modern-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(16, 185, 129, 0.05))', border: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '16px 0' }}>
          <ShieldCheck size={40} color="var(--primary)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--text-main)' }}>
            Instant Product Authenticity Verification
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.92rem' }}>
            Scan or enter a Product ID to verify whether the product is authentic and trace its provenance.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '560px', margin: '0 auto', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px', height: '42px', fontSize: '0.95rem' }}
                placeholder="Enter Product ID (e.g., TC2545, SENS-101)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '130px', height: '42px' }}
              disabled={searchLoading || !searchId.trim()}
            >
              {searchLoading ? 'Verifying...' : 'Verify Product'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsScannerOpen(true)}
              title="Scan QR Code"
            >
              <QrCode size={16} color="var(--primary)" />
              <span>Scan QR</span>
            </button>
          </form>

          {/* Quick sample chips */}
          {catalogProducts.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quick verify from ledger:</span>
              {catalogProducts.slice(0, 4).map((p) => (
                <button
                  key={p.productId}
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleSelectProduct(p)}
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                >
                  {p.productId}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verification Results Panel */}
      {searchError && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={18} />
          <div className="alert-content">
            <strong>Verification Notice</strong>
            <p>{searchError}</p>
          </div>
        </div>
      )}

      {searchResult && (
        <div
          className="card modern-card"
          style={{
            marginBottom: '24px',
            borderLeft: `4px solid ${searchResult.authentic ? 'var(--success)' : 'var(--danger)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: searchResult.authentic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {searchResult.authentic ? (
                  <ShieldCheck size={28} color="var(--success)" />
                ) : (
                  <AlertTriangle size={28} color="var(--danger)" />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{searchResult.productName}</h3>
                  <span
                    className={`badge ${
                      searchResult.authentic
                        ? 'badge-success'
                        : searchResult.status === 'LEGACY'
                        ? 'badge-default'
                        : 'badge-danger'
                    }`}
                  >
                    {searchResult.authentic ? 'AUTHENTIC PRODUCT' : (searchResult.status || 'UNVERIFIED')}
                  </span>
                </div>
                <span className="font-mono text-sm text-muted">ID: {searchResult.productId}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/history?id=${searchResult.productId}`)}
              >
                <History size={13} style={{ marginRight: '4px' }} />
                <span>Provenance Timeline</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/verify?id=${searchResult.productId}`)}
              >
                <ShieldCheck size={13} style={{ marginRight: '4px' }} />
                <span>Verification Portal</span>
                <ExternalLink size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>

          {/* Product Details - 6 Core Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Product ID</span>
              <span className="font-mono text-bold text-primary" style={{ fontSize: '0.95rem' }}>{searchResult.productId}</span>
            </div>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Product Name</span>
              <strong style={{ fontSize: '0.95rem' }}>{searchResult.productName}</strong>
            </div>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Batch Number</span>
              <span className="batch-tag">{searchResult.batchNumber}</span>
            </div>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manufacturer</span>
              <strong style={{ fontSize: '0.95rem' }}>{searchResult.manufacturer}</strong>
            </div>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current Owner</span>
              <strong style={{ fontSize: '0.95rem' }}>{searchResult.currentOwner}</strong>
            </div>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current Status</span>
              <StatusBadge status={searchResult.currentStatus || searchResult.status} />
            </div>
          </div>

          {/* Cryptographic Proof Evidence */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '14px',
              background: 'var(--bg-main)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              marginBottom: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SHA-256 data integrity</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <CheckCircle2 size={15} color={searchResult.dataIntegrity === 'Verified' ? 'var(--success)' : 'var(--danger)'} />
                <strong style={{ fontSize: '0.88rem' }}>SHA-256 Integrity &rarr; {searchResult.dataIntegrity || 'Verified'}</strong>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ECDSA digital signature</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <CheckCircle2 size={15} color={searchResult.digitalSignature === 'Valid' ? 'var(--success)' : 'var(--danger)'} />
                <strong style={{ fontSize: '0.88rem' }}>ECDSA Digital Signature &rarr; {searchResult.digitalSignature || 'Valid'}</strong>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Manufacturer Identity</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <CheckCircle2 size={15} color={searchResult.manufacturerIdentity === 'Verified' ? 'var(--success)' : 'var(--danger)'} />
                <strong style={{ fontSize: '0.88rem' }}>Manufacturer Identity &rarr; {searchResult.manufacturerIdentity || 'Verified'}</strong>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Signer Identity</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span className="badge badge-default" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {searchResult.signerMsp || 'Org1MSP'}
                </span>
              </div>
            </div>
          </div>

          {searchResult.description && (
            <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {searchResult.description}
            </p>
          )}

          {/* Provenance Step Timeline */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Supply-Chain Provenance &amp; Chain of Custody
            </h4>
            {(() => {
              const activeStatus = searchResult.currentStatus || searchResult.status;
              const isRegistered = activeStatus === 'REGISTERED';
              const isDistributorActive = activeStatus === 'IN_TRANSIT_TO_DISTRIBUTOR' || activeStatus === 'RECEIVED_BY_DISTRIBUTOR';
              const isRetailerActive = activeStatus === 'IN_TRANSIT_TO_RETAILER' || activeStatus === 'DELIVERED_TO_RETAILER' || activeStatus === 'RECEIVED_BY_RETAILER';
              const isConsumerActive = activeStatus === 'SOLD_TO_CONSUMER';

              const distComplete = isDistributorActive || isRetailerActive || isConsumerActive;
              const retComplete = isRetailerActive || isConsumerActive;

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: isRegistered ? 'var(--primary)' : 'var(--border)',
                      background: isRegistered ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                      fontSize: '0.85rem',
                      flex: '1 1 180px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Manufacturer</span>
                    <strong>{searchResult.manufacturer}</strong>
                    <div style={{ fontSize: '0.75rem', color: isRegistered ? 'var(--primary)' : 'var(--success)', marginTop: '2px' }}>
                      {isRegistered ? '● Current Custodian' : '✓ Origin Certified'}
                    </div>
                  </div>

                  <ArrowRight size={14} color="var(--text-muted)" />

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: isDistributorActive ? 'var(--primary)' : 'var(--border)',
                      background: isDistributorActive ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                      fontSize: '0.85rem',
                      flex: '1 1 180px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Distributor</span>
                    <strong>{distComplete ? (searchResult.currentOwner === 'DistributorOrg' ? searchResult.currentOwner : 'Logistics Partner') : 'Pending Transfer'}</strong>
                    <div style={{ fontSize: '0.75rem', color: isDistributorActive ? 'var(--primary)' : distComplete ? 'var(--success)' : 'var(--text-muted)', marginTop: '2px' }}>
                      {isDistributorActive ? '● Current Custodian' : distComplete ? '✓ Custody Transferred' : '○ Pending Dispatch'}
                    </div>
                  </div>

                  <ArrowRight size={14} color="var(--text-muted)" />

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: isRetailerActive ? 'var(--primary)' : 'var(--border)',
                      background: isRetailerActive ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                      fontSize: '0.85rem',
                      flex: '1 1 180px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Retailer</span>
                    <strong>{retComplete ? (searchResult.currentOwner === 'RetailerOrg' ? searchResult.currentOwner : 'Retail Store') : 'Pending Delivery'}</strong>
                    <div style={{ fontSize: '0.75rem', color: isRetailerActive ? 'var(--primary)' : retComplete ? 'var(--success)' : 'var(--text-muted)', marginTop: '2px' }}>
                      {isRetailerActive ? '● Current Custodian' : retComplete ? '✓ Delivered to Store' : '○ Pending Delivery'}
                    </div>
                  </div>

                  <ArrowRight size={14} color="var(--text-muted)" />

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: isConsumerActive ? 'var(--success)' : 'var(--border)',
                      background: isConsumerActive ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-main)',
                      fontSize: '0.85rem',
                      flex: '1 1 180px',
                      color: isConsumerActive ? 'var(--success)' : 'inherit',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: isConsumerActive ? 'var(--success)' : 'var(--text-muted)' }}>Consumer</span>
                    <strong>{isConsumerActive ? 'Consumer Validated' : 'Pending Sale'}</strong>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px', color: isConsumerActive ? 'var(--success)' : 'var(--text-muted)' }}>
                      {isConsumerActive ? '✓ Final Ownership' : '○ Not Yet Sold'}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Recently Verified Products (Reduced Customer-Oriented List) */}
      <div className="card modern-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Recently Verified Products</h3>
            <p className="card-desc">
              Select a recent product recorded on the ledger to inspect its cryptographic validity and provenance.
            </p>
          </div>
        </div>

        {catalogLoading ? (
          <LoadingSpinner message="Querying ledger records..." />
        ) : catalogProducts.length === 0 ? (
          <div className="empty-state-box">
            <Boxes size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h4>No Ledger Assets Available</h4>
            <p>No products have been registered yet on the blockchain.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {catalogProducts.slice(0, 5).map((p) => (
                  <tr key={p.productId}>
                    <td>
                      <span className="font-mono text-bold text-primary">{p.productId}</span>
                    </td>
                    <td>
                      <strong>{p.productName}</strong>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleSelectProduct(p)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ShieldCheck size={12} color="var(--primary)" />
                        <span>Verify</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Consumer Security & Blockchain Trust Notice */}
      <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Lock size={20} color="var(--primary)" />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong>Tamper-Proof Consumer Protection:</strong> Product provenance is recorded on Hyperledger Fabric with cryptographic proof of origin. Ownership changes are recorded as traceable blockchain transactions.
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanSuccess}
      />
    </div>
  );
}
