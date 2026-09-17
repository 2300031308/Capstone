import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchProducts(); }, []);

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

  const filtered = products.filter(p =>
    p.productId?.toLowerCase().includes(search.toLowerCase()) ||
    p.productName?.toLowerCase().includes(search.toLowerCase()) ||
    p.manufacturer?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Fetching products from Fabric ledger..." />;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Products</h2>
            <p>All products registered on the blockchain ({products.length} total)</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            ➕ Register Product
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search by Product ID, name, or manufacturer..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>{search ? 'No products match your search.' : 'No products registered yet.'}</p>
            {!search && (
              <button className="btn btn-primary" onClick={() => navigate('/register')}>
                Register Your First Product
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product ID</th><th>Name</th><th>Batch</th>
                <th>Manufacturer</th><th>Current Owner</th><th>Status</th>
                <th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.productId}>
                  <td><strong>{product.productId}</strong></td>
                  <td>{product.productName}</td>
                  <td>{product.batchNumber}</td>
                  <td>{product.manufacturer}</td>
                  <td>{product.currentOwner}</td>
                  <td><StatusBadge status={product.status} /></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/products/${product.productId}`)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
