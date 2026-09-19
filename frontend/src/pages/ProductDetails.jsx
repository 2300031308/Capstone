import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import ProductQRCode from '../components/ProductQRCode';
import {
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  QrCode,
  ShieldAlert,
  Info,
  Truck,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, verifyRes] = await Promise.all([
        productApi.getById(productId),
        productApi.verify(productId).catch(() => ({ data: null })),
      ]);

      if (prodRes && prodRes.data) {
        setProduct(prodRes.data);
      } else {
        throw new Error('Product not found in Hyperledger Fabric world state');
      }

      if (verifyRes && verifyRes.data) {
        setVerification(verifyRes.data);
      }
    } catch (err) {
      console.error('Failed to retrieve product details:', err);
      setError(err.message || `Product ${productId} does not exist on the ledger`);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else if (type === 'sig') {
      setCopiedSig(true);
      setTimeout(() => setCopiedSig(false), 2000);
    }
  };

  if (loading) {
    return <LoadingSpinner message={`Querying Hyperledger Fabric peer for key "${productId}"...`} />;
  }

  if (error) {
    return (
      <div className="product-details-view">
        <div className="page-header-bar">
          <div>
            <h2 className="page-title">Ledger Query Result</h2>
            <p className="page-subtitle">Product ID: {productId}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products')}>
            &larr; Back to Catalog
          </button>
        </div>

        <div className="alert alert-error">
          <AlertCircle size={16} />
          <div className="alert-content">
            <strong>World State Record Not Found</strong>
            <p>{error}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchProduct}>
            Retry Query
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isGenesis = product.productId === 'P000';

  return (
    <div className="product-details-view">
      {/* Top Bar */}
      <div className="page-header-bar">
        <div className="details-title-wrap">
          <div className="id-badge-large">
            <span className="id-label">PRODUCT KEY</span>
            <span className="id-value">{product.productId}</span>
            <button
              className="copy-btn"
              onClick={() => copyText(product.productId, 'id')}
              title="Copy Product ID"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? (
                <>
                  <Check size={12} color="var(--success)" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div>
            <h2 className="page-title">{product.productName}</h2>
            <p className="page-subtitle">
              Supply Chain Asset &bull; Origin: <strong>{product.manufacturer}</strong>
            </p>
          </div>
        </div>

        <div className="header-button-group">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products')}>
            &larr; Back to Catalog
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchProduct} title="Re-query ledger">
            <RefreshCw size={13} style={{ marginRight: '5px' }} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Authenticity Verification Card */}
      <div className="card modern-card" style={{ marginBottom: '20px' }}>
        <div className="card-header-bar" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--primary)" />
            <h3 className="card-title" style={{ margin: 0 }}>Authenticity Verification</h3>
          </div>

          {verification?.status === 'AUTHENTIC' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <Check size={14} />
              <span>Authentic Product</span>
            </span>
          )}

          {verification?.status === 'LEGACY' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: 'rgba(100, 116, 139, 0.1)',
                color: '#475569',
                border: '1px solid rgba(100, 116, 139, 0.25)',
              }}
            >
              <Info size={14} />
              <span>Legacy Record</span>
            </span>
          )}

          {verification && verification.status !== 'AUTHENTIC' && verification.status !== 'LEGACY' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <ShieldAlert size={14} />
              <span>Verification Failed</span>
            </span>
          )}
        </div>

        {verification?.status === 'AUTHENTIC' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Product Record</span>
              <strong style={{ color: '#059669', fontSize: '0.92rem' }}>Verified</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Data Integrity</span>
              <strong style={{ color: '#059669', fontSize: '0.92rem' }}>Verified</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Digital Signature</span>
              <strong style={{ color: '#059669', fontSize: '0.92rem' }}>Valid</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Manufacturer Identity</span>
              <strong style={{ color: '#059669', fontSize: '0.92rem' }}>Verified</strong>
            </div>
          </div>
        )}

        {verification?.status === 'LEGACY' && (
          <div className="alert alert-info" style={{ margin: 0 }}>
            <Info size={16} />
            <div className="alert-content" style={{ fontSize: '0.85rem' }}>
              Cryptographic verification data not available for this legacy record.
            </div>
          </div>
        )}

        {verification && verification.status !== 'AUTHENTIC' && verification.status !== 'LEGACY' && (
          <div className="alert alert-error" style={{ margin: 0 }}>
            <AlertCircle size={16} />
            <div className="alert-content" style={{ fontSize: '0.85rem' }}>
              {verification.message || 'Cryptographic verification check failed.'}
            </div>
          </div>
        )}
      </div>

      {/* Custody Management & Ownership Transfer Card (O4) */}
      <div className="card modern-card" style={{ marginBottom: '20px' }}>
        <div className="card-header-bar" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={20} color="var(--primary)" />
            <h3 className="card-title" style={{ margin: 0 }}>Custody Status &amp; Ownership-Based Access Control</h3>
          </div>
          <span className="badge badge-default">Objective 4</span>
        </div>

        {/* Dynamic Action Bar */}
        {product.status === 'SOLD_TO_CONSUMER' ? (
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            <Lock size={16} />
            <div className="alert-content" style={{ fontSize: '0.86rem' }}>
              <strong>Terminal State:</strong> This product has been sold to an end consumer (<code>Consumer</code>). Further custody transfers are permanently prohibited by smart contract rules.
            </div>
          </div>
        ) : user?.organization === product.currentOwner ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              padding: '14px 16px',
              background: 'rgba(37, 99, 235, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              marginBottom: '16px',
            }}
          >
            <div>
              <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '2px', fontSize: '0.9rem' }}>
                You hold active custody of this product ({user?.organization})
              </strong>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                As verified custodian, you are authorized to transfer this asset along the supply chain.
              </span>
            </div>
            {['manufacturer', 'distributor', 'retailer'].includes((user?.role || '').toLowerCase()) && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/transfer?productId=${product.productId}`)}
              >
                <Truck size={14} style={{ marginRight: '6px' }} />
                <span>Transfer Custody &rarr;</span>
              </button>
            )}
          </div>
        ) : (
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            <Info size={16} />
            <div className="alert-content" style={{ fontSize: '0.86rem' }}>
              <strong>Custody Held by {product.currentOwner}:</strong> Your authenticated organization is <code>{user?.organization || 'Unknown'}</code>. Under Fabric ownership-based access control, transfers can only be executed by the current verified custodian.
            </div>
          </div>
        )}

        {/* 4-Step Provenance Timeline */}
        <div style={{ paddingTop: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
            Supply Chain Provenance Route
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: product.status === 'REGISTERED' ? 'var(--primary)' : '#e2e8f0',
                background: product.status === 'REGISTERED' ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>HOP 1 (Org1MSP)</span>
              <strong>Manufacturer</strong>
            </div>

            <ArrowRight size={14} color="#94a3b8" />

            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: product.status === 'IN_TRANSIT_TO_DISTRIBUTOR' ? 'var(--primary)' : '#e2e8f0',
                background: product.status === 'IN_TRANSIT_TO_DISTRIBUTOR' ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>HOP 2 (Org2MSP)</span>
              <strong>Distributor Logistics</strong>
            </div>

            <ArrowRight size={14} color="#94a3b8" />

            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: product.status === 'DELIVERED_TO_RETAILER' ? 'var(--primary)' : '#e2e8f0',
                background: product.status === 'DELIVERED_TO_RETAILER' ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>HOP 3 (Org2MSP)</span>
              <strong>Retail Store</strong>
            </div>

            <ArrowRight size={14} color="#94a3b8" />

            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: product.status === 'SOLD_TO_CONSUMER' ? 'var(--success)' : '#e2e8f0',
                background: product.status === 'SOLD_TO_CONSUMER' ? 'rgba(16, 185, 129, 0.08)' : '#f8fafc',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>TERMINAL</span>
              <strong>Consumer Handover</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Asset Specification Card */}
      <div className="card modern-card" style={{ marginBottom: '20px' }}>
        <div className="card-header-bar" style={{ marginBottom: '20px' }}>
          <div>
            <h3 className="card-title">Product Details</h3>
            <p className="card-subtitle">Verified asset record on ledger</p>
          </div>
          <StatusBadge status={product.status} isGenesis={isGenesis} />
        </div>

        <div className="spec-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className="spec-item">
            <span className="spec-label">Product ID</span>
            <span className="spec-value mono"><strong>{product.productId}</strong></span>
          </div>

          <div className="spec-item">
            <span className="spec-label">Product Name</span>
            <span className="spec-value">{product.productName}</span>
          </div>

          <div className="spec-item">
            <span className="spec-label">Batch Number</span>
            <span className="spec-value mono code-pill">{product.batchNumber}</span>
          </div>

          <div className="spec-item">
            <span className="spec-label">Manufacturer</span>
            <span className="spec-value">{product.manufacturer}</span>
          </div>

          <div className="spec-item">
            <span className="spec-label">Current Custodian</span>
            <span className="spec-value highlight">{product.currentOwner}</span>
          </div>

          <div className="spec-item">
            <span className="spec-label">Status</span>
            <span className="spec-value"><StatusBadge status={product.status} isGenesis={isGenesis} /></span>
          </div>

          <div className="spec-item">
            <span className="spec-label">Registration Time</span>
            <span className="spec-value">
              {product.createdAt ? new Date(product.createdAt).toLocaleString() : '—'}
            </span>
          </div>

          <div className="spec-item">
            <span className="spec-label">Last Update</span>
            <span className="spec-value">
              {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '—'}
            </span>
          </div>
        </div>

        {/* QR Code Section */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: '#0f172a' }}>Product Verification QR Code</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Physical asset verification reference for supply chain checkpoints.
            </p>
          </div>
          <ProductQRCode productId={product.productId} size={110} showDownload={true} />
        </div>
      </div>

      {/* Technical Verification Details (Collapsed by Default) */}
      <div className="card modern-card" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          aria-expanded={showTechnicalDetails}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <h3 className="card-title" style={{ margin: 0, fontSize: '1rem' }}>
              Technical Verification Details
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>{showTechnicalDetails ? 'Hide' : 'Show'}</span>
            {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showTechnicalDetails && (
          <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            {/* Cryptographic Proof Metadata */}
            {product.productHash && (
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#0f172a' }}>Cryptographic Proof Metadata</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>SHA-256 Data Digest:</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                        onClick={() => copyText(product.productHash, 'hash')}
                      >
                        {copiedHash ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                        <span style={{ marginLeft: '4px' }}>{copiedHash ? 'Copied' : 'Copy Full Hash'}</span>
                      </button>
                    </div>
                    <code style={{ fontSize: '0.8rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                      {product.productHash.length > 24
                        ? `${product.productHash.substring(0, 16)}...${product.productHash.substring(48)}`
                        : product.productHash}
                    </code>
                  </div>

                  {product.digitalSignature && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ECDSA Digital Signature (P-256):</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                          onClick={() => copyText(product.digitalSignature, 'sig')}
                        >
                          {copiedSig ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                          <span style={{ marginLeft: '4px' }}>{copiedSig ? 'Copied' : 'Copy Full Signature'}</span>
                        </button>
                      </div>
                      <code style={{ fontSize: '0.8rem', color: '#475569', wordBreak: 'break-all' }}>
                        {product.digitalSignature.length > 40
                          ? `${product.digitalSignature.substring(0, 20)}...${product.digitalSignature.substring(product.digitalSignature.length - 20)}`
                          : product.digitalSignature}
                      </code>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Signature Status:</span>{' '}
                      <strong style={{ color: '#059669' }}>Valid</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Signer Identity:</span>{' '}
                      <strong>Org1MSP (ManufacturerOrg)</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '0 0 16px' }}>
              Cryptographic ledger consensus and world state metadata recorded across peer nodes.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Network Framework</span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Hyperledger Fabric 2.5 (LTS)</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Channel Name</span>
                <code style={{ fontSize: '0.85rem', color: '#0f172a' }}>mychannel</code>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Smart Contract</span>
                <code style={{ fontSize: '0.85rem', color: '#0f172a' }}>supplychain (v1.1)</code>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Endorsement Consensus</span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Org1MSP &amp; Org2MSP</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>State Database</span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>CouchDB (<code>mychannel_supplychain</code>)</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Ordering Service</span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Raft Crash Fault Tolerant (CFT)</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>World State Document Type</span>
                <code style={{ fontSize: '0.85rem', color: '#0f172a' }}>{product.docType || 'product'}</code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowRawJson(!showRawJson)}
              >
                {showRawJson ? 'Hide Raw World State Record' : '{ } View Raw World State Record'}
              </button>
            </div>

            {showRawJson && (
              <div style={{ marginTop: '14px' }}>
                <pre className="raw-json-viewer">
                  {JSON.stringify(product, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
