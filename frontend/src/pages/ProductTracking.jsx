/*
 * Product Tracking Page
 * Complete Supply Chain Provenance & Custody Tracking on Hyperledger Fabric.
 *
 * Displays:
 * - Prominent Current Custodian card with actual Fabric transaction timestamps
 * - Dynamic 4-Stage Progress Stepper (Manufacturer -> Distributor -> Retailer -> Consumer)
 * - Cryptographic Authenticity indicators (SHA-256 Data Integrity & ECDSA Digital Signature)
 * - Chronological Vertical Journey Timeline with exact Fabric transaction IDs
 * - Search bar with sample quick-selection chips and integrated QR Scanner
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import QRScannerModal from '../components/QRScannerModal';
import ProductQRCode from '../components/ProductQRCode';
import {
  Route,
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  Building2,
  Truck,
  Store,
  UserCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  QrCode,
  Sparkles,
  Layers,
  History,
  Info,
  Calendar,
  KeyRound,
  FileCheck2,
} from 'lucide-react';

export default function ProductTracking() {
  const { productId: pathProductId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, getRoleDashboard } = useAuth();

  const queryId = searchParams.get('id') || pathProductId || '';
  const [searchId, setSearchId] = useState(queryId);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedTxId, setCopiedTxId] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Quick selection chips
  const sampleProducts = ['WB-CUSTODY-201', 'WB-102', 'TC2545', 'SENS-101', 'P000'];

  const fetchTracking = useCallback(async (targetId) => {
    const cleanId = (targetId || '').trim();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const res = await publicApi.getTracking(cleanId);
      if (res && res.data) {
        setTrackingData(res.data);
      } else {
        setError(`Product "${cleanId}" does not exist on the blockchain ledger.`);
      }
    } catch (err) {
      console.warn('[ProductTracking] Fetch error:', err.message);
      setError(err.message || `Unable to query ledger tracking for "${cleanId}".`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryId) {
      setSearchId(queryId);
      fetchTracking(queryId);
    }
  }, [queryId, fetchTracking]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const clean = searchId.trim();
    if (!clean) return;
    setSearchParams({ id: clean });
    fetchTracking(clean);
  };

  const selectChip = (chipId) => {
    setSearchId(chipId);
    setSearchParams({ id: chipId });
    fetchTracking(chipId);
  };

  const handleScanSuccess = (scannedId) => {
    setScannerOpen(false);
    if (scannedId) {
      setSearchId(scannedId);
      setSearchParams({ id: scannedId });
      fetchTracking(scannedId);
    }
  };

  const copyText = (text, type, txId = null) => {
    navigator.clipboard.writeText(text);
    if (type === 'tx' && txId) {
      setCopiedTxId(txId);
      setTimeout(() => setCopiedTxId(null), 2000);
    } else if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Stage helper icons and labels
  const getStageIcon = (role, state) => {
    const color = state === 'completed' ? 'var(--success)' : state === 'current' ? 'var(--primary)' : 'var(--text-muted)';
    const size = 18;
    switch ((role || '').toLowerCase()) {
      case 'manufacturer':
        return <Building2 size={size} color={color} />;
      case 'distributor':
        return <Truck size={size} color={color} />;
      case 'retailer':
        return <Store size={size} color={color} />;
      case 'consumer':
        return <UserCheck size={size} color={color} />;
      default:
        return <Layers size={size} color={color} />;
    }
  };

  const isStandalone = !isAuthenticated || window.location.pathname.startsWith('/track');

  return (
    <div className="product-tracking-page" style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      {/* Standalone Guest Header */}
      {isStandalone && (
        <header
          style={{
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--navy-card)',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(30, 64, 175, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Route size={22} color="var(--primary)" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>TraceChain</h1>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Supply Chain Provenance &amp; Tracking</span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(searchId ? `/verify?id=${searchId}` : '/verify')}
            >
              <ShieldCheck size={14} style={{ marginRight: '4px' }} />
              <span>Verify Product</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(searchId ? `/history?id=${searchId}` : '/history')}
            >
              <History size={14} style={{ marginRight: '4px' }} />
              <span>Audit Trail</span>
            </button>

            {isAuthenticated && user ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(getRoleDashboard(user.role))}
              >
                <span>Console</span>
                <ArrowRight size={14} style={{ marginLeft: '4px' }} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/login')}
              >
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Page Banner */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              marginBottom: '12px',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Route size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
              Hyperledger Fabric Provenance Tracking
            </span>
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Live Supply Chain Product Tracking
          </h2>
          <p style={{ maxWidth: '620px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Track the end-to-end custody journey of physical goods from manufacturer origin to consumer point-of-sale, backed by immutable blockchain timestamps.
          </p>
        </div>

        {/* Search & QR Scanner Bar */}
        <div className="card modern-card" style={{ marginBottom: '24px', padding: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="input-field"
                style={{ width: '100%', paddingLeft: '40px' }}
                placeholder="Enter Product ID (e.g. WB-CUSTODY-201, WB-102, SENS-101)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || !searchId.trim()}>
              <Route size={16} style={{ marginRight: '6px' }} />
              <span>Track Product</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setScannerOpen(true)}
              title="Scan QR Code"
            >
              <QrCode size={16} style={{ marginRight: '6px' }} />
              <span>Scan QR</span>
            </button>
          </form>

          {/* Quick Selection Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Sample Assets:
            </span>
            {sampleProducts.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`badge ${searchId === chip ? 'badge-primary' : 'badge-default'}`}
                style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: '0.76rem', borderRadius: '6px' }}
                onClick={() => selectChip(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && <LoadingSpinner message="Querying Live Custody State &amp; Provenance from Fabric..." />}

        {/* Error Notice */}
        {error && !loading && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div className="alert-content">
              <strong>Tracking Query Error</strong>
              <p>{error}</p>
              <span style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px', display: 'block' }}>
                Please verify that the Product ID is spelled correctly and registered on the Hyperledger Fabric channel.
              </span>
            </div>
          </div>
        )}

        {/* Tracking Results View */}
        {trackingData && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 1. Prominent CURRENT CUSTODIAN Card (Requirement 4) */}
            <div
              className="card modern-card"
              style={{
                borderLeft: '5px solid var(--primary)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--primary)',
                        background: 'var(--primary-light)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Current Custodian
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Physical Asset Possession
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      margin: '4px 0 8px',
                      color: 'var(--navy-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    {trackingData.currentCustodian}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Status:{' '}
                      <strong style={{ color: 'var(--text-main)' }}>{trackingData.currentStatus}</strong>
                    </span>
                    <span style={{ color: 'var(--border-color)' }}>&bull;</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Last Ledger Update:{' '}
                      <strong style={{ color: 'var(--text-main)' }}>{trackingData.lastUpdatedFormatted}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <StatusBadge status={trackingData.currentStatus} />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowQrModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <QrCode size={14} />
                    <span>View Asset QR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Tracking Progress Stepper (Requirement 5) */}
            <div className="card modern-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Supply Chain Lifecycle Progress
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Dynamic ledger progression based on verified state transitions
                  </span>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                  {trackingData.currentStatus === 'SOLD_TO_CONSUMER' ? '4 / 4 Completed' :
                   trackingData.currentStatus === 'DELIVERED_TO_RETAILER' ? '3 / 4 In Retail' :
                   trackingData.currentStatus === 'IN_TRANSIT_TO_DISTRIBUTOR' ? '2 / 4 In Transit' : '1 / 4 Registered'}
                </span>
              </div>

              {/* Progress Stepper Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  position: 'relative',
                }}
              >
                {trackingData.progress.map((p, idx) => {
                  const isCompleted = p.state === 'completed';
                  const isCurrent = p.state === 'current';
                  const isPending = p.state === 'pending';

                  return (
                    <div
                      key={p.stage}
                      style={{
                        background: isCurrent ? 'var(--primary-light)' : isCompleted ? 'rgba(5, 150, 105, 0.05)' : 'var(--bg-page)',
                        border: `1px solid ${isCurrent ? 'var(--primary)' : isCompleted ? 'var(--success-border)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        padding: '14px',
                        position: 'relative',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--border-color)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {isCompleted ? <Check size={14} /> : isCurrent ? idx + 1 : idx + 1}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isCurrent ? 'var(--primary)' : 'var(--text-main)' }}>
                            {p.label}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isCompleted ? 'var(--success-bg)' : isCurrent ? 'var(--primary-light)' : '#f1f5f9',
                            color: isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                            border: `1px solid ${isCompleted ? 'var(--success-border)' : isCurrent ? 'var(--primary-border)' : '#e2e8f0'}`,
                          }}
                        >
                          {p.state}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Custodian: <strong>{p.organization}</strong>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Status: <code>{p.targetStatus}</code>
                      </div>

                      {p.formattedTime && (
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {p.formattedTime}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Product Details Overview Card */}
            <div className="card modern-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>
                    {trackingData.productName}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Product ID:</span>
                    <code style={{ fontWeight: 700, color: 'var(--primary)' }}>{trackingData.productId}</code>
                    <button
                      type="button"
                      onClick={() => copyText(trackingData.productId, 'id')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
                      title="Copy Product ID"
                    >
                      {copiedId ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${trackingData.authenticity.authentic ? 'badge-success' : 'badge-warning'}`}>
                    {trackingData.authenticity.status}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/verify?id=${trackingData.productId}`)}
                  >
                    <ShieldCheck size={14} style={{ marginRight: '4px' }} />
                    <span>Cryptographic Audit</span>
                  </button>
                </div>
              </div>

              {/* Specification Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  padding: '16px',
                  background: 'var(--bg-page)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Manufacturer</span>
                  <strong style={{ fontSize: '0.92rem' }}>{trackingData.manufacturer}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Batch Number</span>
                  <strong style={{ fontSize: '0.92rem' }}>{trackingData.batchNumber}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Genesis Registration</span>
                  <strong style={{ fontSize: '0.92rem' }}>{trackingData.registrationFormatted}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Signer MSP Identity</span>
                  <strong style={{ fontSize: '0.92rem' }}>{trackingData.authenticity.signerMsp || 'Org1MSP'}</strong>
                </div>
              </div>

              {/* Cryptographic Trust Badges */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileCheck2 size={15} color={trackingData.authenticity.dataIntegrity === 'Verified' ? 'var(--success)' : 'var(--danger)'} />
                  <span>SHA-256 Integrity: <strong>{trackingData.authenticity.dataIntegrity}</strong></span>
                </div>
                <span style={{ color: 'var(--border-color)' }}>&bull;</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={15} color={trackingData.authenticity.digitalSignature === 'Valid' ? 'var(--success)' : 'var(--danger)'} />
                  <span>ECDSA Signature: <strong>{trackingData.authenticity.digitalSignature}</strong></span>
                </div>
                <span style={{ color: 'var(--border-color)' }}>&bull;</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building2 size={15} color="var(--primary)" />
                  <span>Manufacturer Identity: <strong>{trackingData.authenticity.manufacturerIdentity}</strong></span>
                </div>
              </div>
            </div>

            {/* 4. Complete Product Journey Vertical Timeline (Requirement 2 & 3) */}
            <div className="card modern-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800 }}>
                    Complete Custody &amp; Provenance Journey
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Chronological audit log of blockchain transactions with exact Fabric transaction IDs
                  </span>
                </div>
                <span className="badge badge-default" style={{ fontSize: '0.75rem' }}>
                  {trackingData.totalTransitions} Event{trackingData.totalTransitions !== 1 ? 's' : ''} Recorded
                </span>
              </div>

              {/* Vertical Timeline */}
              <div style={{ position: 'relative', paddingLeft: '32px' }}>
                {/* Continuous Vertical Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '16px',
                    bottom: '24px',
                    width: '2px',
                    background: 'var(--border-color)',
                  }}
                />

                {trackingData.events.map((event, idx) => {
                  const isLatest = idx === trackingData.events.length - 1;
                  const isGenesis = event.sequence === 1;

                  return (
                    <div
                      key={event.transactionId || idx}
                      style={{
                        position: 'relative',
                        marginBottom: idx === trackingData.events.length - 1 ? 0 : '24px',
                      }}
                    >
                      {/* Timeline Node Bullet */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-32px',
                          top: '16px',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isLatest ? 'var(--primary)' : 'var(--navy-card)',
                          border: `3px solid ${isLatest ? 'var(--primary-border)' : 'var(--border-color)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {isGenesis ? (
                          <Building2 size={12} color={isLatest ? '#ffffff' : 'var(--primary)'} />
                        ) : isLatest ? (
                          <CheckCircle2 size={14} color="#ffffff" />
                        ) : (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                        )}
                      </div>

                      {/* Event Detail Card */}
                      <div
                        className="card modern-card"
                        style={{
                          borderLeft: isLatest ? '4px solid var(--primary)' : '1px solid var(--border-color)',
                          padding: '18px 20px',
                        }}
                      >
                        {/* Event Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                className="badge badge-default"
                                style={{ fontSize: '0.72rem', fontWeight: 700 }}
                              >
                                STEP #{event.sequence}
                              </span>
                              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                                {event.actionLabel}
                              </strong>
                              {isLatest && (
                                <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                                  Current State
                                </span>
                              )}
                            </div>

                            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {event.description}
                            </p>
                          </div>

                          <StatusBadge status={event.status} />
                        </div>

                        {/* Event Details Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '12px',
                            padding: '12px',
                            background: 'var(--bg-page)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            marginBottom: '12px',
                            fontSize: '0.84rem',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                              Custody Handover
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontWeight: 600 }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{event.from || 'Genesis'}</span>
                              <ArrowRight size={13} color="var(--primary)" />
                              <span style={{ color: 'var(--primary)' }}>{event.to}</span>
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                              Authorizing Entity / Role
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              {getStageIcon(event.role, 'completed')}
                              <span style={{ fontWeight: 600 }}>{event.participantName}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({event.role})</span>
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                              Exact Fabric Timestamp
                            </span>
                            <div style={{ marginTop: '2px', fontWeight: 600 }}>
                              {event.formattedTime}
                            </div>
                          </div>
                        </div>

                        {/* Transaction ID & Cryptographic Proof */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            paddingTop: '8px',
                            borderTop: '1px dashed var(--border-color)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '100%', overflow: 'hidden' }}>
                            <span>Transaction ID:</span>
                            <code style={{ fontSize: '0.72rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                              {event.transactionId}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyText(event.transactionId, 'tx', event.transactionId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
                              title="Copy Transaction ID"
                            >
                              {copiedTxId === event.transactionId ? (
                                <Check size={12} color="var(--success)" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={13} color="var(--success)" />
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                              Fabric Endorsed &amp; Validated
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State before search */}
        {!trackingData && !loading && !error && (
          <div className="card modern-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'var(--primary-light)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Route size={32} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>
              Track Supply Chain Provenance
            </h3>
            <p style={{ maxWidth: '460px', margin: '0 auto 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Enter any verified Product ID or scan a product QR code above to query the complete, immutable custody history from Hyperledger Fabric.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {sampleProducts.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => selectChip(chip)}
                >
                  <span>Track {chip}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanSuccess}
      />

      {/* QR Code Inspection Modal */}
      {showQrModal && trackingData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="card modern-card"
            style={{ maxWidth: '360px', width: '100%', textAlign: 'center', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>
              Physical Asset QR Code
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Scan to instantly track this product journey on TraceChain
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <ProductQRCode productId={trackingData.productId} size={180} showDownload={true} />
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-dark)', marginBottom: '16px' }}>
              <code>{trackingData.productId}</code>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => setShowQrModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
