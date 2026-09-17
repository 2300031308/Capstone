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

  useEffect(() => { fetchProduct(); }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productApi.getById(productId);
      setProduct(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message={`Fetching product ${productId} from Fabric...`} />;

  if (error) {
    return (
      <div>
        <div className="alert alert-error">❌ {error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>← Back to Products</button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{product.productName}</h2>
            <p>Product details retrieved from Hyperledger Fabric ledger</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/products')}>← Back to Products</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Product Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Product ID</div>
            <div className="detail-value">{product.productId}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Product Name</div>
            <div className="detail-value">{product.productName}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Batch Number</div>
            <div className="detail-value">{product.batchNumber}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Manufacturer</div>
            <div className="detail-value">{product.manufacturer}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Current Owner</div>
            <div className="detail-value">{product.currentOwner}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value"><StatusBadge status={product.status} /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Created At</div>
            <div className="detail-value">{product.createdAt ? new Date(product.createdAt).toLocaleString() : '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Last Updated</div>
            <div className="detail-value">{product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '—'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="alert alert-info" style={{ marginBottom: 0 }}>
          🔗 This product data is stored on and retrieved from the Hyperledger Fabric blockchain.
          The record is immutable and tamper-proof.
        </div>
      </div>
    </div>
  );
}
