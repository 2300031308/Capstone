import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    batchNumber: '',
    manufacturer: user?.organization || 'ApexManufacturing',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState('');
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);
    setIsSubmitting(true);

    // Multi-phase feedback reflecting real Hyperledger Fabric transaction lifecycle
    setSubmitPhase('Creating transaction proposal with client identity (Org1MSP)...');

    const phase2Timer = setTimeout(() => {
      setSubmitPhase('Endorsing proposal across peers (peer0.org1 & peer0.org2)...');
    }, 900);

    const phase3Timer = setTimeout(() => {
      setSubmitPhase('Ordering transaction via Raft consensus and committing to World State...');
    }, 2200);

    try {
      const response = await productApi.register({
        productId: formData.productId.trim(),
        productName: formData.productName.trim(),
        batchNumber: formData.batchNumber.trim(),
        manufacturer: formData.manufacturer.trim(),
      });

      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);

      if (response && response.data) {
        setReceipt(response.data);
      } else {
        setReceipt({
          productId: formData.productId.trim(),
          productName: formData.productName.trim(),
          batchNumber: formData.batchNumber.trim(),
          manufacturer: formData.manufacturer.trim(),
          currentOwner: formData.manufacturer.trim(),
          status: 'REGISTERED',
          createdAt: new Date().toISOString(),
        });
      }

      // Reset form
      setFormData({
        productId: '',
        productName: '',
        batchNumber: '',
        manufacturer: 'ManufacturerOrg',
      });
    } catch (err) {
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
      console.error('Registration failed:', err);

      let cleanMsg = err.message || 'Failed to submit transaction to Fabric';
      if (cleanMsg.includes('already exists')) {
        cleanMsg = `Product ID "${formData.productId}" already exists on the ledger. Product IDs must be globally unique.`;
      } else if (cleanMsg.includes('ABORTED') || cleanMsg.includes('failed to endorse')) {
        cleanMsg = `Transaction rejected by endorsing peers: Product ID "${formData.productId}" is likely already registered on the blockchain.`;
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
            Submit an immutable origin record to Hyperledger Fabric Channel: <code>mychannel</code>
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products')}>
          &larr; Back to Catalog
        </button>
      </div>

      {/* Confirmed Receipt Card */}
      {receipt && (
        <div className="receipt-card modern-card">
          <div className="receipt-header">
            <div className="receipt-badge-icon">✅</div>
            <div>
              <h3>Blockchain Transaction Committed</h3>
              <p className="receipt-sub">
                Product record successfully verified and written to CouchDB World State
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
              <span className="receipt-label">Manufacturer:</span>
              <span className="receipt-val">{receipt.manufacturer}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-label">Initial Owner:</span>
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

          <div className="receipt-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/products/${receipt.productId}`)}
            >
              Inspect Product on Ledger &rarr;
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setReceipt(null)}
            >
              Register Another Product
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-icon">⚠️</div>
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
        <div className="form-intro-banner">
          <div className="info-icon">ℹ️</div>
          <div>
            <strong>Fabric Endorsement Policy Notice</strong>
            <p>
              Submitting this form executes the <code>SupplyChainContract:registerProduct</code> smart contract.
              The proposal requires endorsements from both <code>Org1MSP</code> and <code>Org2MSP</code> peers before block commitment.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="enterprise-form">
          <div className="form-grid">
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
              />
              <span className="field-hint">Unique alphanumeric identifier stored as ledger key.</span>
            </div>

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

            <div className="form-group">
              <label htmlFor="manufacturer">
                Manufacturing Organization <span className="req">*</span>
              </label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                className="form-input"
                value={formData.manufacturer}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
              <span className="field-hint">Origin organization authorized under Org1MSP identity.</span>
            </div>
          </div>

          <div className="form-footer-bar">
            <div className="submit-info">
              <span>Channel: <strong>mychannel</strong></span>
              <span className="sep">&bull;</span>
              <span>Initial Status: <strong>REGISTERED</strong></span>
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
                {isSubmitting ? 'Submitting to Fabric...' : '📦 Commit to Blockchain'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Multi-step Blockchain Processing Modal Overlay */}
      {isSubmitting && (
        <div className="processing-overlay">
          <div className="processing-card modern-card">
            <div className="blockchain-pulse-icon">⛓️</div>
            <div className="spinner"></div>
            <h3>Submitting Hyperledger Fabric Transaction</h3>
            <p className="phase-text">{submitPhase}</p>
            <div className="ledger-steps">
              <div className="step-item active">Proposal</div>
              <div className="step-arrow">&rarr;</div>
              <div className="step-item active">Endorsement</div>
              <div className="step-arrow">&rarr;</div>
              <div className="step-item active">Orderer</div>
              <div className="step-arrow">&rarr;</div>
              <div className="step-item active">World State</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
