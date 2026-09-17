import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';

export default function RegisterProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    batchNumber: '',
    manufacturer: 'ManufacturerOrg',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await productApi.register(formData);
      setSuccess(`Product ${formData.productId} registered successfully on the blockchain!`);
      setFormData({ productId: '', productName: '', batchNumber: '', manufacturer: 'ManufacturerOrg' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Register Product</h2>
        <p>Register a new product on the Hyperledger Fabric blockchain</p>
      </div>

      {success && (
        <div className="alert alert-success">
          ✅ {success}
          <button className="link-btn" style={{ marginLeft: '16px' }} onClick={() => navigate('/products')}>
            View All Products
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">❌ {error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="productId">Product ID *</label>
              <input type="text" id="productId" name="productId" className="form-input"
                placeholder="e.g., P001" value={formData.productId} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="productName">Product Name *</label>
              <input type="text" id="productName" name="productName" className="form-input"
                placeholder="e.g., Smart Device" value={formData.productName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="batchNumber">Batch Number *</label>
              <input type="text" id="batchNumber" name="batchNumber" className="form-input"
                placeholder="e.g., B101" value={formData.batchNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="manufacturer">Manufacturer *</label>
              <input type="text" id="manufacturer" name="manufacturer" className="form-input"
                placeholder="e.g., ManufacturerOrg" value={formData.manufacturer} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Submitting to Blockchain...' : '📦 Register Product'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="processing-overlay">
          <div className="processing-card">
            <div className="spinner"></div>
            <h3>Processing Blockchain Transaction</h3>
            <p>Submitting to Hyperledger Fabric network...</p>
            <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>This may take a few seconds.</p>
          </div>
        </div>
      )}
    </div>
  );
}
