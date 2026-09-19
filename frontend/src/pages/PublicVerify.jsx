/*
 * Public Product Verification Page (Objective 5)
 * Allows any consumer, evaluator, or supply chain auditor to verify
 * product authenticity and cryptographic validity without an account or JWT.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import QRScannerModal from '../components/QRScannerModal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ShieldCheck,
  Search,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Truck,
  ArrowRight,
  ExternalLink,
  Printer,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

export default function PublicVerify() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, getRoleDashboard } = useAuth();

  const [productIdInput, setProductIdInput] = useState('');
  const [activeResult, setActiveResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Read URL query parameter "?id=" if present
  const queryId = searchParams.get('id');

  const executeVerification = useCallback(async (targetId) => {
    const cleanId = (targetId || '').trim();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    setActiveResult(null);

    try {
      const response = await publicApi.verify(cleanId);
      if (response && response.data) {
        setActiveResult(response.data);
      } else {
        setError(`Product "${cleanId}" could not be verified on the ledger.`);
      }
    } catch (err) {
      console.warn('[PublicVerify] Verification error:', err.message);
      setError(err.message || `No immutable record found for ID: "${cleanId}"`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryId) {
      setProductIdInput(queryId);
      executeVerification(queryId);
    }
  }, [queryId, executeVerification]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanId = productIdInput.trim();
    if (!cleanId) return;
    setSearchParams({ id: cleanId });
    executeVerification(cleanId);
  };

  const handleScanSuccess = (scannedId) => {
    setProductIdInput(scannedId);
    setSearchParams({ id: scannedId });
    executeVerification(scannedId);
  };

  const handleChipClick = (id) => {
    setProductIdInput(id);
    setSearchParams({ id });
    executeVerification(id);
  };

  const copyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // State machine stages for visual progression
  const custodySteps = [
    { key: 'REGISTERED', label: 'Origin Registration', role: 'ManufacturerOrg', desc: 'Cryptographically certified' },
    { key: 'IN_TRANSIT_TO_DISTRIBUTOR', label: 'Distribution Transit', role: 'DistributorOrg', desc: 'Custody transferred' },
    { key: 'DELIVERED_TO_RETAILER', label: 'Retail Center', role: 'RetailerOrg', desc: 'Inbound verified' },
    { key: 'SOLD_TO_CONSUMER', label: 'Consumer Purchase', role: 'Consumer', desc: 'Terminal ownership' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'REGISTERED': return 0;
      case 'IN_TRANSIT_TO_DISTRIBUTOR': return 1;
      case 'DELIVERED_TO_RETAILER': return 2;
      case 'SOLD_TO_CONSUMER': return 3;
      default: return -1;
    }
  };

  const currentStepIdx = activeResult ? getStepIndex(activeResult.currentStatus) : -1;

  return (
    <div className="public-verify-container" style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>TraceChain</h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Public Verification Portal</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated && user ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(getRoleDashboard(user.role))}
            >
              <span>Back to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Console</span>
              <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: '20px', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', marginBottom: '12px', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
              Zero-Trust Blockchain Verification
            </span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 8px' }}>
            Verify Genuine Product Authenticity
          </h2>
          <p style={{ maxWidth: '580px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
            Enter a Product ID or scan a physical QR code to evaluate cryptographic integrity, manufacturer digital signatures, and provenance directly on Hyperledger Fabric.
          </p>
        </div>

        {/* Search & Scan Control Box */}
        <div className="card modern-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '40px', height: '46px', fontSize: '0.98rem' }}
                placeholder="Enter Product ID (e.g. TC2545, TC6207, SENS-101)"
                value={productIdInput}
                onChange={(e) => setProductIdInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '130px', height: '46px', fontSize: '0.92rem' }}
              disabled={loading || !productIdInput.trim()}
            >
              {loading ? 'Verifying...' : 'Verify Product'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ height: '46px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsScannerOpen(true)}
              title="Scan QR code using camera or image file"
            >
              <QrCode size={18} color="var(--primary)" />
              <span>Scan QR</span>
            </button>
          </form>

          {/* Quick Verification Chips */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick sample IDs:</span>
            {['TC2545', 'TC6207', 'SENS-101', 'P000'].map((chip) => (
              <button
                key={chip}
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => handleChipClick(chip)}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-main)',
                  padding: '3px 9px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div style={{ margin: '32px 0' }}>
            <LoadingSpinner message="Consulting Hyperledger Fabric peer nodes and verifying ECDSA cryptographic signatures..." />
          </div>
        )}

        {/* Error Notice */}
        {error && !loading && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <AlertTriangle size={20} />
            <div className="alert-content">
              <strong>Verification Result: Asset Not Found</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Active Verification Result Card */}
        {activeResult && !loading && (
          <div className="verification-result-wrapper">
            {/* Status Header Banner */}
            <div
              className="card modern-card"
              style={{
                marginBottom: '20px',
                borderLeft: `5px solid ${
                  activeResult.status === 'AUTHENTIC'
                    ? 'var(--success)'
                    : activeResult.status === 'LEGACY'
                    ? 'var(--primary)'
                    : 'var(--danger)'
                }`,
                background:
                  activeResult.status === 'AUTHENTIC'
                    ? 'linear-gradient(to right, rgba(16, 185, 129, 0.06), var(--bg-card))'
                    : activeResult.status === 'LEGACY'
                    ? 'linear-gradient(to right, rgba(37, 99, 235, 0.06), var(--bg-card))'
                    : 'linear-gradient(to right, rgba(239, 68, 68, 0.06), var(--bg-card))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background:
                        activeResult.status === 'AUTHENTIC'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : activeResult.status === 'LEGACY'
                          ? 'rgba(37, 99, 235, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activeResult.status === 'AUTHENTIC' ? (
                      <CheckCircle2 size={32} color="var(--success)" />
                    ) : activeResult.status === 'LEGACY' ? (
                      <Clock size={32} color="var(--primary)" />
                    ) : (
                      <XCircle size={32} color="var(--danger)" />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.35rem' }}>{activeResult.productName}</h3>
                      <span
                        className={`badge ${
                          activeResult.status === 'AUTHENTIC'
                            ? 'badge-success'
                            : activeResult.status === 'LEGACY'
                            ? 'badge-default'
                            : 'badge-danger'
                        }`}
                        style={{ fontSize: '0.85rem', padding: '4px 10px' }}
                      >
                        {activeResult.status === 'AUTHENTIC'
                          ? 'Cryptographically Authenticated'
                          : activeResult.status === 'LEGACY'
                          ? 'Legacy Ledger Asset'
                          : activeResult.status}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {activeResult.message}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/history?id=${activeResult.productId}`)}
                  >
                    <Clock size={13} style={{ marginRight: '4px' }} />
                    <span>Provenance History</span>
                    <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => window.print()}
                    title="Print verification summary"
                  >
                    <Printer size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Cryptographic Verification Breakdown (Safe Consumer Evidence) */}
            <div className="card modern-card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Zero-Trust Cryptographic Evidence</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Data Integrity (SHA-256)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    {activeResult.dataIntegrity === 'Verified' ? (
                      <CheckCircle2 size={16} color="var(--success)" />
                    ) : (
                      <XCircle size={16} color="var(--danger)" />
                    )}
                    <strong style={{ fontSize: '0.92rem', color: activeResult.dataIntegrity === 'Verified' ? 'var(--success)' : 'var(--danger)' }}>
                      {activeResult.dataIntegrity}
                    </strong>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    ECDSA Digital Signature
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    {activeResult.digitalSignature === 'Valid' ? (
                      <CheckCircle2 size={16} color="var(--success)" />
                    ) : (
                      <XCircle size={16} color="var(--danger)" />
                    )}
                    <strong style={{ fontSize: '0.92rem', color: activeResult.digitalSignature === 'Valid' ? 'var(--success)' : 'var(--danger)' }}>
                      {activeResult.digitalSignature}
                    </strong>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Manufacturer Identity
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Building2 size={16} color="var(--primary)" />
                    <strong style={{ fontSize: '0.92rem' }}>
                      {activeResult.manufacturerIdentity} ({activeResult.signerMsp || 'Org1MSP'})
                    </strong>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Current Custodian
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Truck size={16} color="var(--primary)" />
                    <strong style={{ fontSize: '0.92rem' }}>
                      {activeResult.currentOwner}
                    </strong>
                  </div>
                </div>
              </div>

              {/* SHA-256 Digest Display */}
              {activeResult.productHash && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Canonical Ledger Hash (SHA-256):
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => copyHash(activeResult.productHash)}
                    >
                      {copiedHash ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                      <span style={{ marginLeft: '4px', fontSize: '0.72rem' }}>{copiedHash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <code style={{ fontSize: '0.82rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                    {activeResult.productHash}
                  </code>
                </div>
              )}
            </div>

            {/* Product Specifications */}
            <div className="card modern-card" style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '1rem' }}>Asset Specifications</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Product ID</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{activeResult.productId}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Category</span>
                  <span>{activeResult.category}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Batch / Lot</span>
                  <span className="code-pill font-mono">{activeResult.batchNumber}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Manufacturer Origin</span>
                  <strong>{activeResult.manufacturer}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Ledger Status</span>
                  <StatusBadge status={activeResult.currentStatus} />
                </div>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>Verified At</span>
                  <span style={{ fontSize: '0.82rem' }}>
                    {activeResult.verifiedAt ? new Date(activeResult.verifiedAt).toLocaleString() : 'Just now'}
                  </span>
                </div>
              </div>

              {activeResult.description && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {activeResult.description}
                </div>
              )}
            </div>

            {/* Custody State Machine Progress */}
            <div className="card modern-card" style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Supply Chain Custody Progression</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {custodySteps.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div
                      key={step.key}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--border)',
                        background: isCurrent ? 'rgba(37, 99, 235, 0.06)' : isDone ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-main)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          STAGE {idx + 1}
                        </span>
                        {isDone && <CheckCircle2 size={14} color={isCurrent ? 'var(--primary)' : 'var(--success)'} />}
                      </div>
                      <strong style={{ fontSize: '0.88rem', display: 'block', color: isCurrent ? 'var(--primary)' : 'inherit' }}>
                        {step.label}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        {step.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full Provenance Action CTA */}
            <div
              style={{
                padding: '20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.08))',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>Inspect Complete Immutable History</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  View the full chronological chain of custody, exact Hyperledger Fabric block transaction IDs, and timestamps.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/history?id=${activeResult.productId}`)}
              >
                <span>View Full Audit Trail</span>
                <ArrowRight size={14} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanSuccess}
      />
    </div>
  );
}
