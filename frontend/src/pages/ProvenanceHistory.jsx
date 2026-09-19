/*
 * Provenance History Audit Trail Page (Objective 5)
 * Displays chronological blockchain transaction history populated directly
 * from Hyperledger Fabric's getHistoryForKey() on "mychannel".
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  History,
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  Building2,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Database,
  Layers,
} from 'lucide-react';

export default function ProvenanceHistory() {
  const { productId: pathProductId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, getRoleDashboard } = useAuth();

  const queryId = searchParams.get('id') || pathProductId || '';
  const [searchId, setSearchId] = useState(queryId);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedTxId, setCopiedTxId] = useState(null);
  const [expandedSnapshots, setExpandedSnapshots] = useState({});

  const fetchHistory = useCallback(async (targetId) => {
    const cleanId = (targetId || '').trim();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    setHistoryData(null);

    try {
      const res = await publicApi.getHistory(cleanId);
      if (res && res.data) {
        setHistoryData(res.data);
      } else {
        setError(`No blockchain transaction history found for product "${cleanId}".`);
      }
    } catch (err) {
      console.warn('[ProvenanceHistory] Fetch error:', err.message);
      setError(err.message || `Unable to query ledger history for "${cleanId}".`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryId) {
      setSearchId(queryId);
      fetchHistory(queryId);
    }
  }, [queryId, fetchHistory]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const clean = searchId.trim();
    if (!clean) return;
    setSearchParams({ id: clean });
    fetchHistory(clean);
  };

  const copyTx = (txId) => {
    navigator.clipboard.writeText(txId);
    setCopiedTxId(txId);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const toggleSnapshot = (index) => {
    setExpandedSnapshots((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const latestRecord = historyData && historyData.length > 0 ? historyData[historyData.length - 1] : null;
  const initialRecord = historyData && historyData.length > 0 ? historyData[0] : null;

  return (
    <div className="provenance-history-page" style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>TraceChain</h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Blockchain Provenance Audit Trail</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(searchId ? `/verify?id=${searchId}` : '/verify')}
          >
            <ShieldCheck size={14} style={{ marginRight: '4px' }} />
            <span>Verify Authenticity</span>
          </button>

          {isAuthenticated && user && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(getRoleDashboard(user.role))}
            >
              <span>Console</span>
              <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Page Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: '20px', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', marginBottom: '12px', alignItems: 'center', gap: '6px' }}>
            <Database size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
              Hyperledger Fabric getHistoryForKey()
            </span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 8px' }}>
            Immutable Provenance Audit Trail
          </h2>
          <p style={{ maxWidth: '580px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
            Inspect the complete, permanent chronological log of all block transactions and custody handovers recorded on the distributed ledger.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="card modern-card" style={{ marginBottom: '24px', padding: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '40px', height: '44px', fontSize: '0.95rem' }}
                placeholder="Enter Product ID to query history (e.g. SENS-101, TC2545)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '130px', height: '44px' }}
              disabled={loading || !searchId.trim()}
            >
              {loading ? 'Querying...' : 'Query History'}
            </button>
          </form>

          {/* Sample ID suggestions */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Known ledger assets:</span>
            {['SENS-101', 'TC2545', 'TC6207', 'P000'].map((chip) => (
              <button
                key={chip}
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setSearchId(chip);
                  setSearchParams({ id: chip });
                  fetchHistory(chip);
                }}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-main)',
                  padding: '3px 8px',
                  fontSize: '0.76rem',
                  fontFamily: 'monospace',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ margin: '32px 0' }}>
            <LoadingSpinner message="Extracting immutable block history from Fabric ledger state..." />
          </div>
        )}

        {/* Error Notice */}
        {error && !loading && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <AlertCircle size={20} />
            <div className="alert-content">
              <strong>Query Unsuccessful</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Results Container */}
        {historyData && !loading && (
          <div>
            {/* Audit Summary Card */}
            <div className="card modern-card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Blockchain Asset
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '1.4rem' }}>
                    {latestRecord?.snapshot?.productName || searchId}
                  </h3>
                  <code style={{ fontSize: '0.88rem', color: 'var(--primary)' }}>ID: {searchId}</code>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/verify?id=${searchId}`)}
                  >
                    <ShieldCheck size={14} style={{ marginRight: '4px' }} />
                    <span>Verify Authenticity</span>
                  </button>
                </div>
              </div>

              {/* Summary Metric Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', padding: '14px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Total Block Events</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{historyData.length} Transactions</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Genesis Registered By</span>
                  <strong style={{ fontSize: '0.95rem' }}>{initialRecord?.snapshot?.manufacturer || 'Org1MSP'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Current Custodian</span>
                  <strong style={{ fontSize: '0.95rem' }}>{latestRecord?.currentOwner || 'Unknown'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Current Ledger State</span>
                  <StatusBadge status={latestRecord?.status} />
                </div>
              </div>
            </div>

            {/* Chronological Timeline */}
            <div style={{ position: 'relative', paddingLeft: '28px', marginBottom: '28px' }}>
              {/* Vertical timeline line */}
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '16px',
                  bottom: '16px',
                  width: '2px',
                  background: 'var(--border)',
                }}
              />

              {historyData.map((rec, idx) => {
                const isLatest = idx === historyData.length - 1;
                const isExpanded = !!expandedSnapshots[idx];

                return (
                  <div key={rec.txId || idx} style={{ position: 'relative', marginBottom: '24px' }}>
                    {/* Timeline bullet dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-28px',
                        top: '14px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isLatest ? 'var(--primary)' : 'var(--bg-card)',
                        border: `3px solid ${isLatest ? '#93c5fd' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isLatest ? '#ffffff' : 'var(--primary)',
                        }}
                      />
                    </div>

                    {/* Timeline Card */}
                    <div className="card modern-card" style={{ borderLeft: isLatest ? '4px solid var(--primary)' : '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge badge-default" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              EVENT #{rec.sequence}
                            </span>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                              {rec.event === 'PRODUCT_REGISTERED'
                                ? 'Product Origin Registered'
                                : rec.event === 'SOLD_TO_CONSUMER'
                                ? 'Sold to Consumer'
                                : 'Custody Handover'}
                            </strong>
                            {isLatest && <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Current State</span>}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            Timestamp: <strong>{rec.formattedTime}</strong> &bull; <code style={{ fontSize: '0.75rem' }}>{rec.timestamp}</code>
                          </span>
                        </div>

                        <StatusBadge status={rec.status} />
                      </div>

                      {/* Custody Transition Details */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '12px',
                          padding: '12px',
                          background: 'var(--bg-main)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Custody Transfer</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '0.88rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{rec.previousOwner}</span>
                            <ArrowRight size={14} color="var(--primary)" />
                            <strong>{rec.currentOwner}</strong>
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Status Transition</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '0.88rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{rec.previousStatus}</span>
                            <ArrowRight size={14} color="var(--primary)" />
                            <strong>{rec.status}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Transaction ID */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Fabric Tx ID:</span>
                          <code style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {rec.txId ? `${rec.txId.substring(0, 16)}...${rec.txId.substring(rec.txId.length - 12)}` : 'N/A'}
                          </code>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => copyTx(rec.txId)}
                            title="Copy full transaction ID"
                          >
                            {copiedTxId === rec.txId ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                          </button>
                        </div>

                        {/* Snapshot Toggle */}
                        {rec.snapshot && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => toggleSnapshot(idx)}
                            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>{isExpanded ? 'Hide Snapshot' : 'View Snapshot'}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}
                      </div>

                      {/* Expanded Snapshot Viewer */}
                      {isExpanded && rec.snapshot && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                            Ledger State Snapshot at Block Execution:
                          </span>
                          <pre
                            style={{
                              background: '#0f172a',
                              color: '#93c5fd',
                              padding: '10px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              overflowX: 'auto',
                              margin: 0,
                            }}
                          >
                            {JSON.stringify(rec.snapshot, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Technical Verification Details */}
            <div
              className="card modern-card"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem' }}>Fabric Channel</span>
                <code style={{ color: 'var(--primary)' }}>mychannel</code>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem' }}>Smart Contract</span>
                <code>supplychain (v1.1)</code>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem' }}>Consensus Orderer</span>
                <strong>Raft CFT (Crash Fault Tolerant)</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem' }}>Ledger Storage</span>
                <strong>CouchDB (peer0.org1 / peer0.org2)</strong>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
