import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  return (
    <div
      className="card stat-card"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/products/${product.productId}`)}
    >
      <div className="stat-icon blue">📦</div>
      <div className="stat-info">
        <h3 style={{ fontSize: '1.1rem' }}>{product.productName}</h3>
        <p>{product.productId} · {product.batchNumber}</p>
        <div style={{ marginTop: '8px' }}>
          <StatusBadge status={product.status} />
        </div>
      </div>
    </div>
  );
}
