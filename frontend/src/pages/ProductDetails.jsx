import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getById(productId);
      if (response && response.data) {
        setProduct(response.data);
      } else {
        throw new Error('Product not found in Hyperledger Fabric world state');
      }
    } catch (err) {
      console.error('Failed to retrieve product details:', err);
      setError(err.message || `Product ${productId} does not exist on the ledger`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="alert-icon">⚠️</div>
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
              onClick={() => copyToClipboard(product.productId)}
              title="Copy Product ID"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          <div>
            <h2 className="page-title">{product.productName}</h2>
            <p className="page-subtitle">
              Verified record on channel <code>mychannel</code> &bull; Fabric World State
            </p>
          </div>
        </div>

        <div className="header-button-group">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products')}>
            &larr; Back to Catalog
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchProduct} title="Re-query ledger">
            🔄 Refresh State
          </button>
        </div>
      </div>

      {/* Main Grid: Details + Verification Card */}
      <div className="details-grid-layout">
        {/* Left Card: Core Asset Attributes */}
        <div className="card modern-card details-main-card">
          <div className="card-header-bar">
            <h3 className="card-title">Asset Specification</h3>
            <StatusBadge status={product.status} isGenesis={isGenesis} />
          </div>

          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Product Identifier</span>
              <span className="spec-value mono"><strong>{product.productId}</strong></span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Commercial Asset Name</span>
              <span className="spec-value">{product.productName}</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Production Batch Number</span>
              <span className="spec-value mono code-pill">{product.batchNumber}</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Origin Manufacturer (Org1MSP)</span>
              <span className="spec-value">{product.manufacturer}</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Current Custodian / Owner</span>
              <span className="spec-value highlight">{product.currentOwner}</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">World State Document Type</span>
              <span className="spec-value mono">{product.docType || 'product'}</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Ledger Registration Time</span>
              <span className="spec-value">
                {product.createdAt ? new Date(product.createdAt).toLocaleString() : '—'}
              </span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Last State Mutation Time</span>
              <span className="spec-value">
                {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Blockchain Verification Ledger Card */}
        <div className="card modern-card ledger-verification-card">
          <div className="card-header-bar">
            <h3 className="card-title">Blockchain Verification</h3>
            <span className="verified-pill">🛡️ Valid State</span>
          </div>

          <p className="ledger-desc">
            This record is cryptographically committed to the Hyperledger Fabric ledger across peer nodes.
          </p>

          <div className="ledger-meta-list">
            <div className="ledger-meta-row">
              <span className="label">Network Framework:</span>
              <span className="val">Hyperledger Fabric 2.5 (LTS)</span>
            </div>
            <div className="ledger-meta-row">
              <span className="label">Channel Name:</span>
              <span className="val mono">mychannel</span>
            </div>
            <div className="ledger-meta-row">
              <span className="label">Smart Contract:</span>
              <span className="val mono">supplychain (v1.0)</span>
            </div>
            <div className="ledger-meta-row">
              <span className="label">Endorsement Consensus:</span>
              <span className="val">Org1MSP &amp; Org2MSP</span>
            </div>
            <div className="ledger-meta-row">
              <span className="label">State Database:</span>
              <span className="val">CouchDB (<code>mychannel_supplychain</code>)</span>
            </div>
            <div className="ledger-meta-row">
              <span className="label">Ordering Service:</span>
              <span className="val">Raft Crash Fault Tolerant (CFT)</span>
            </div>
          </div>

          <div className="raw-json-trigger-wrap">
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => setShowRawJson(!showRawJson)}
            >
              {showRawJson ? 'Hide Raw World State Record' : '{ } View Raw World State Record'}
            </button>
          </div>
        </div>
      </div>

      {/* Raw World State JSON Collapsible */}
      {showRawJson && (
        <div className="card modern-card" style={{ marginTop: '20px' }}>
          <div className="card-header-bar">
            <h3 className="card-title">World State JSON Document (CouchDB)</h3>
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Key: {product.productId}
            </span>
          </div>
          <pre className="raw-json-viewer">
            {JSON.stringify(product, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
