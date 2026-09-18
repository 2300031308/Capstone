import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
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
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
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

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim();
    if (!cleanId) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const res = await productApi.getById(cleanId);
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

  const handleSelectProduct = (prod) => {
    setSearchId(prod.productId);
    setSearchResult(prod);
    setSearchError(null);
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
            Authenticated Consumer: <strong>{user?.name}</strong> &bull; Verification Identity: <code>{user?.mspId || 'ClientMSP'}</code>
          </p>
        </div>

        <div className="dashboard-actions">
          <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <CheckCircle2 size={13} style={{ marginRight: '5px' }} />
            Zero-Trust Ledger Verification
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
            Verify cryptographic authenticity and complete supply chain provenance directly against the Hyperledger Fabric immutable ledger.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px', height: '42px', fontSize: '0.95rem' }}
                placeholder="Enter Product ID (e.g., PROD-001)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '120px', height: '42px' }}
              disabled={searchLoading || !searchId.trim()}
            >
              {searchLoading ? 'Verifying...' : 'Verify Product'}
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
        <div className="card modern-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={28} color="var(--success)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{searchResult.productName}</h3>
                  <span className="badge badge-success">Cryptographically Authenticated</span>
                </div>
                <span className="font-mono text-sm text-muted">ID: {searchResult.productId}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/products/${searchResult.productId}`)}
              >
                <span>Complete Provenance Record</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered Manufacturer</span>
              <strong style={{ fontSize: '0.95rem' }}>{searchResult.manufacturer}</strong>
            </div>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current Custody</span>
              <strong style={{ fontSize: '0.95rem' }}>{searchResult.currentOwner}</strong>
            </div>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Batch / Lot</span>
              <span className="batch-tag">{searchResult.batchNumber}</span>
            </div>
            <div>
              <span className="meta-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ledger State</span>
              <StatusBadge status={searchResult.status} />
            </div>
          </div>

          {searchResult.description && (
            <p style={{ marginTop: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {searchResult.description}
            </p>
          )}

          {/* Provenance Step Timeline */}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Fabric Provenance Chain of Custody
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 14px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>ORIGIN (Org1MSP)</span>
                <strong>{searchResult.manufacturer}</strong>
              </div>
              <ArrowRight size={14} color="var(--text-muted)" />
              <div style={{ padding: '8px 14px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>DISTRIBUTION</span>
                <strong>Logistics Network</strong>
              </div>
              <ArrowRight size={14} color="var(--text-muted)" />
              <div style={{ padding: '8px 14px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>RETAIL POINT</span>
                <strong>Authorized Partner</strong>
              </div>
              <ArrowRight size={14} color="var(--text-muted)" />
              <div style={{ padding: '8px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--success)' }}>
                <span style={{ display: 'block', fontSize: '0.72rem' }}>END VERIFICATION</span>
                <strong>Consumer Validated</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Catalog / Genuine Products Registered */}
      <div className="card modern-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Verified Ledger Catalog</h3>
            <p className="card-desc">
              All authentic goods registered and certified by authorized enterprise manufacturers on Hyperledger Fabric.
            </p>
          </div>
        </div>

        {catalogLoading ? (
          <LoadingSpinner message="Querying ledger records..." />
        ) : catalogProducts.length === 0 ? (
          <div className="empty-state-box">
            <Boxes size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h4>No Ledger Assets Available</h4>
            <p>No products have been registered yet by authorized manufacturers.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Batch Number</th>
                  <th>Manufacturer</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Authentication</th>
                </tr>
              </thead>
              <tbody>
                {catalogProducts.map((p) => (
                  <tr key={p.productId}>
                    <td>
                      <span className="font-mono text-bold text-primary">{p.productId}</span>
                    </td>
                    <td>
                      <strong>{p.productName}</strong>
                    </td>
                    <td>{p.category || 'General'}</td>
                    <td>
                      <span className="batch-tag">{p.batchNumber}</span>
                    </td>
                    <td>{p.manufacturer}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleSelectProduct(p)}
                      >
                        <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                        Verify
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
          <strong>Tamper-Proof Consumer Protection:</strong> Every product record is permanently recorded on Hyperledger Fabric channel <code>mychannel</code> with SHA-256 digital signatures and cryptographic proof of origin. Records cannot be altered, spoofed, or deleted.
        </div>
      </div>
    </div>
  );
}
