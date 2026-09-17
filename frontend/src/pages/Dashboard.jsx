import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll();
      setProducts(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard data from Fabric..." />;

  const registeredCount = products.filter(p => p.status === 'REGISTERED').length;
  const transferredCount = products.filter(p => p.status === 'TRANSFERRED').length;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Supply Chain Provenance Overview — Powered by Hyperledger Fabric</p>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon blue">📦</div>
          <div className="stat-info">
            <h3>{products.length}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <h3>{registeredCount}</h3>
            <p>Registered</p>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon yellow">🔄</div>
          <div className="stat-info">
            <h3>{transferredCount}</h3>
            <p>Transferred</p>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon red">🔗</div>
          <div className="stat-info">
            <h3>Fabric</h3>
            <p>Blockchain Network</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Recent Products</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
            ➕ Register New
          </button>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No products registered yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>
              Register Your First Product
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Batch</th>
                  <th>Manufacturer</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 10).map((product) => (
                  <tr key={product.productId}>
                    <td><strong>{product.productId}</strong></td>
                    <td>{product.productName}</td>
                    <td>{product.batchNumber}</td>
                    <td>{product.manufacturer}</td>
                    <td>{product.currentOwner}</td>
                    <td><StatusBadge status={product.status} /></td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/products/${product.productId}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
