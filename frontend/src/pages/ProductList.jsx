import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { RefreshCw, PackagePlus, Search, AlertCircle, X, ArrowRight } from 'lucide-react';

export default function ProductList() {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [originFilter, setOriginFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getAll();
      setProducts(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve products from ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter & Sort Pipeline
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(p =>
        (p.productId && p.productId.toLowerCase().includes(q)) ||
        (p.productName && p.productName.toLowerCase().includes(q)) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(q)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        (p.currentOwner && p.currentOwner.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter(p => p.status === statusFilter);
    }

    // Origin filter (Genesis vs Live)
    if (originFilter === 'LIVE') {
      list = list.filter(p => p.productId !== 'P000');
    } else if (originFilter === 'GENESIS') {
      list = list.filter(p => p.productId === 'P000');
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'ID_ASC') {
        return (a.productId || '').localeCompare(b.productId || '');
      }
      if (sortBy === 'ID_DESC') {
        return (b.productId || '').localeCompare(a.productId || '');
      }
      if (sortBy === 'NAME_ASC') {
        return (a.productName || '').localeCompare(b.productName || '');
      }
      return 0;
    });

    return list;
  }, [products, search, statusFilter, originFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, originFilter, pageSize]);

  if (loading) {
    return <LoadingSpinner message="Querying World State range from Hyperledger Fabric..." />;
  }

  return (
    <div className="product-list-view">
      {/* Header Bar */}
      <div className="page-header-bar">
        <div>
          <h2 className="page-title">Ledger Products Catalog</h2>
          <p className="page-subtitle">
            Authenticated assets registered on Hyperledger Fabric World State ({products.length} total records)
          </p>
        </div>

        <div className="header-button-group">
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchProducts}
            title="Refresh from world state"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          {role === 'manufacturer' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/register-product')}
            >
              <PackagePlus size={14} />
              <span>Register Product</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <div className="alert-content">
            <strong>Error Querying Ledger</strong>
            <p>{error}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchProducts}>
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Controls Toolbar */}
      <div className="catalog-toolbar modern-card">
        <div className="search-input-wrap">
          <Search size={16} className="search-lens" color="var(--text-muted)" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search by Product ID, Name, Batch, Owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-controls-wrap">
          <div className="filter-item">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="REGISTERED">REGISTERED</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Origin:</label>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="ALL">All Origin Types</option>
              <option value="LIVE">Live Registered</option>
              <option value="GENESIS">Genesis Seed (P000)</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="toolbar-select"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="ID_ASC">Product ID (A &rarr; Z)</option>
              <option value="NAME_ASC">Product Name (A &rarr; Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Table Card */}
      <div className="card modern-card" style={{ marginTop: '16px' }}>
        <div className="table-summary-bar">
          <span className="summary-text">
            Showing <strong>{filteredProducts.length}</strong> matching product{filteredProducts.length === 1 ? '' : 's'} on distributed ledger
          </span>
          <div className="table-page-size">
            <label>Per page:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="toolbar-select-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Search size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <h4>No Products Match Your Criteria</h4>
            <p>
              {search || statusFilter !== 'ALL' || originFilter !== 'ALL'
                ? 'Try adjusting your search terms or clearing the active filters.'
                : 'No products are currently recorded on the blockchain world state.'}
            </p>
            {(search || statusFilter !== 'ALL' || originFilter !== 'ALL') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setOriginFilter('ALL');
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Batch Number</th>
                  <th>Manufacturer</th>
                  <th>Current Owner</th>
                  <th>Status</th>
                  <th>Registered On</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const isGenesis = product.productId === 'P000';
                  const formattedDate = product.createdAt
                    ? new Date(product.createdAt).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={product.productId} className="table-row-hover">
                      <td>
                        <div className="product-id-cell">
                          <strong className="product-id-text">{product.productId}</strong>
                          {isGenesis && (
                            <span className="genesis-pill" title="Initial genesis seed record">
                              Seed
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="table-product-name">{product.productName}</span>
                      </td>
                      <td>
                        <code className="batch-code">{product.batchNumber}</code>
                      </td>
                      <td>
                        <span className="org-label">{product.manufacturer}</span>
                      </td>
                      <td>
                        <span className="owner-badge">{product.currentOwner}</span>
                      </td>
                      <td>
                        <StatusBadge status={product.status} isGenesis={isGenesis} />
                      </td>
                      <td className="table-date-cell">{formattedDate}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-action-view"
                          onClick={() => navigate(`/products/${product.productId}`)}
                          title="Inspect world state and history for this product"
                        >
                          Inspect Ledger &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <span className="page-indicator">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="pagination-buttons">
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                &larr; Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
