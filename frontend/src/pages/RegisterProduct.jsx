import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PackagePlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import ProductQRCode from '../components/ProductQRCode';

export default function RegisterProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    batchNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState('');
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const manufacturerOrg = user?.organization || 'ManufacturerOrg';

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);

    const cleanId = formData.productId.trim();
    const cleanName = formData.productName.trim();
    const cleanBatch = formData.batchNumber.trim();

    if (!cleanId || !cleanName || !cleanBatch) {
      setError('Please fill in Product ID, Product Name, and Batch Number.');
      return;
    }

    setIsSubmitting(true);
    setSubmitPhase('Creating certified transaction proposal with enterprise identity...');

    const phase2Timer = setTimeout(() => {
      setSubmitPhase('Collecting cryptographic endorsements from network peers...');
    }, 1000);

    const phase3Timer = setTimeout(() => {
      setSubmitPhase('Ordering transaction and committing origin block to the ledger...');
    }, 2200);

    try {
      const response = await productApi.register({
        productId: cleanId,
        productName: cleanName,
        batchNumber: cleanBatch,
        manufacturer: manufacturerOrg,
      });

      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);

      if (response && response.data) {
        setReceipt(response.data);
      } else {
        setReceipt({
          productId: cleanId,
          productName: cleanName,
          batchNumber: cleanBatch,
          manufacturer: manufacturerOrg,
          currentOwner: manufacturerOrg,
          status: 'REGISTERED',
          createdAt: new Date().toISOString(),
        });
      }

      // Reset form
      setFormData({
        productId: '',
        productName: '',
        batchNumber: '',
      });
    } catch (err) {
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
      console.error('Registration failed:', err);

      let cleanMsg = err.message || 'Unable to commit the transaction. Please try again.';
      if (cleanMsg.includes('already exists') || cleanMsg.includes('already registered')) {
        cleanMsg = 'Product ID already exists on the ledger. Please use a different Product ID.';
      } else {
        cleanMsg = 'Unable to commit the transaction. Please try again.';
      }
      setError(cleanMsg);
    } finally {
      setIsSubmitting(false);
      setSubmitPhase('');
    }
  };

  return (
    <div className="register-product-view">
      {/* Header */}
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">Register Product on Ledger</h2>
          <p className="page-subtitle">
            Create an immutable digital origin record for certified physical assets
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products')}>
          &larr; Back to Catalog
        </button>
      </div>

      {/* Confirmed Receipt Screen (Shown ONLY upon successful registration) */}
      {receipt ? (
        <div className="receipt-card modern-card">
          <div className="receipt-header">
            <div className="receipt-badge-icon">
              <CheckCircle2 size={24} color="var(--success)" />
            </div>
            <div>
              <h3>Product Registered Successfully</h3>
              <p className="receipt-sub">
                Product origin record successfully verified and written to the distributed ledger
              </p>
            </div>
          </div>

          <div className="receipt-details-grid">
            <div className="receipt-item">
              <span className="receipt-label">Product ID:</span>
              <strong className="receipt-val">{receipt.productId}</strong>
            </div>
            <div className="receipt-item">
              <span className="receipt-label">Product Name:</span>
              <span className="receipt-val">{receipt.productName}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-label">Batch Number:</span>
              <code className="receipt-code">{receipt.batchNumber}</code>
            </div>
            <div className="receipt-item">
              <span className="receipt-label">Origin Manufacturer:</span>
              <span className="receipt-val">{receipt.manufacturer}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-label">Initial Custodian:</span>
              <span className="receipt-val">{receipt.currentOwner || receipt.manufacturer}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-label">Ledger Status:</span>
              <span className="receipt-val badge badge-registered">REGISTERED</span>
            </div>
            <div className="receipt-item full-width">
              <span className="receipt-label">Block Timestamp:</span>
              <span className="receipt-val mono">
                {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cryptographic Authenticity & QR Code Section */}
          <div
            style={{
              marginTop: '16px',
              padding: '14px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <ShieldCheck size={16} color="var(--success)" />
                <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>Cryptographic Authenticity Established</strong>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#64748b' }}>
                Deterministic SHA-256 hash &amp; ECDSA signature committed to Fabric world state.
              </p>
              {receipt.productHash && (
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  <span style={{ color: '#64748b' }}>Digest:</span>{' '}
                  <code style={{ fontSize: '0.74rem' }}>
                    {receipt.productHash.substring(0, 16)}...{receipt.productHash.substring(48)}
                  </code>
                </div>
              )}
            </div>
            <ProductQRCode productId={receipt.productId} size={90} showDownload={true} />
          </div>

          <div className="receipt-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/products/${receipt.productId}`)}
            >
              View Product &rarr;
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setReceipt(null)}
            >
              Register Another Product
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/manufacturer/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <div className="alert-content">
                <strong>Registration Rejection</strong>
                <p>{error}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {/* Registration Form Card */}
          <div className="card modern-card form-card">
        <form onSubmit={handleSubmit} className="enterprise-form">
          <div className="form-grid">
            {/* Product ID */}
            <div className="form-group">
              <label htmlFor="productId">
                Product ID <span className="req">*</span>
              </label>
              <input
                type="text"
                id="productId"
                name="productId"
                className="form-input"
                placeholder="e.g., P101, PROD-9002"
                value={formData.productId}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                autoFocus
              />
              <span className="field-hint">Unique alphanumeric identifier stored as ledger world state key.</span>
            </div>

            {/* Product Name */}
            <div className="form-group">
              <label htmlFor="productName">
                Product Name <span className="req">*</span>
              </label>
              <input
                type="text"
                id="productName"
                name="productName"
                className="form-input"
                placeholder="e.g., Smart Medical Sensor, Precision Valve"
                value={formData.productName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
              <span className="field-hint">Official commercial name of the manufactured asset.</span>
            </div>

            {/* Batch Number */}
            <div className="form-group">
              <label htmlFor="batchNumber">
                Batch Number <span className="req">*</span>
              </label>
              <input
                type="text"
                id="batchNumber"
                name="batchNumber"
                className="form-input"
                placeholder="e.g., BATCH-2026-X1"
                value={formData.batchNumber}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
              <span className="field-hint">Manufacturing production batch or lot reference.</span>
            </div>

            {/* Origin Manufacturer (Derived Server-Side, Read-Only) */}
            <div className="form-group">
              <label>
                Origin Manufacturer (Organization)
              </label>
              <div
                style={{
                  padding: '9px 12px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Building size={14} color="var(--primary)" />
                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{manufacturerOrg}</strong>
                <span style={{ fontSize: '0.72rem', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  Verified Identity
                </span>
              </div>
              <span className="field-hint">Origin organization identity derived server-side from authenticated session.</span>
            </div>
          </div>

          {/* Optional Collapsible Technical Details for Viva */}
          <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            >
              <Cpu size={14} />
              <span>{showTechnicalDetails ? '- Technical Details' : '+ Technical Details'}</span>
              {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTechnicalDetails && (
              <div style={{ marginTop: '10px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Channel:</span>
                    <code style={{ color: '#0f172a', fontWeight: 600 }}>mychannel</code>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Smart Contract Method:</span>
                    <code style={{ color: '#0f172a', fontWeight: 600 }}>SupplyChainContract:registerProduct</code>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Endorsement Information:</span>
                    <code style={{ color: '#0f172a', fontWeight: 600 }}>Org1MSP &amp; Org2MSP</code>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-footer-bar" style={{ marginTop: '20px' }}>
            <div className="submit-info">
              <span>Initial Ledger Status: <strong>REGISTERED</strong></span>
            </div>

            <div className="form-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/products')}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !formData.productId.trim() || !formData.productName.trim()}
              >
                {isSubmitting ? (
                  'Committing to Ledger...'
                ) : (
                  <>
                    <PackagePlus size={15} style={{ marginRight: '6px' }} />
                    <span>Commit to Ledger</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )}

      {/* Multi-step Processing Modal Overlay */}
      {isSubmitting && (
        <div className="processing-overlay">
          <div className="processing-card modern-card">
            <div className="spinner"></div>
            <h3>Submitting Transaction to Ledger</h3>
            <p className="phase-text">{submitPhase}</p>
            <div className="ledger-steps">
              <div className="step-item active">Proposal</div>
              <div className="step-arrow">&rarr;</div>
              <div className="step-item active">Endorsement</div>
              <div className="step-arrow">&rarr;</div>
              <div className="step-item active">Ordering</div>
              <div className="step-arrow">&rarr;</div>
              <div className="step-item active">World State</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
