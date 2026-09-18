import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Factory, Truck, Store, User } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'Manufacturer',
    email: 'manufacturer@supplychain.com',
    password: 'Password@123',
    org: 'ManufacturerOrg',
    msp: 'Org1MSP',
    icon: Factory,
    desc: 'Authorized to register products & commit origin records',
  },
  {
    role: 'Distributor',
    email: 'distributor@supplychain.com',
    password: 'Password@123',
    org: 'DistributorOrg',
    msp: 'Org2MSP',
    icon: Truck,
    desc: 'Authorized for supply chain logistics & custody transfer',
  },
  {
    role: 'Retailer',
    email: 'retailer@supplychain.com',
    password: 'Password@123',
    org: 'RetailerOrg',
    msp: 'RetailerMSP',
    icon: Store,
    desc: 'Authorized for store inventory & retail authentication',
  },
  {
    role: 'Customer',
    email: 'customer@supplychain.com',
    password: 'Password@123',
    org: 'EndConsumerOrg',
    msp: 'ClientMSP',
    icon: User,
    desc: 'Consumer portal for zero-trust provenance verification',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, getRoleDashboard } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDemoFill = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const loggedInUser = await login({ email, password });

      // Navigate to intended target or dedicated role dashboard
      const fromPath = location.state?.from?.pathname;
      const targetDashboard = getRoleDashboard(loggedInUser?.role);
      navigate(fromPath || targetDashboard, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials or authentication server offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card modern-card" style={{ maxWidth: '480px', width: '100%' }}>
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="brand-logo-icon-wrap" style={{ margin: '0 auto 12px', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={28} color="var(--primary)" />
          </div>
          <h2>SupplyChain Provenance</h2>
          <p className="login-subtitle">
            Hyperledger Fabric 2.5 &bull; Authenticated Enterprise Gateway
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <div className="alert-content" style={{ fontSize: '0.88rem' }}>{error}</div>
          </div>
        )}

        {/* Enterprise Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <Mail size={14} color="var(--text-muted)" />
              Enterprise Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. manufacturer@supplychain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <Lock size={14} color="var(--text-muted)" />
              Account Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ height: '44px', fontSize: '0.95rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Ledger Portal'}
            {!loading && <ArrowRight size={16} style={{ marginLeft: '6px' }} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '16px 0 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don&apos;t have an enterprise account?{' '}
          <Link to="/register-account" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register New Organization Account
          </Link>
        </div>

        {/* Quick Demo Credentials Panel for Viva / Testing */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              One-Click Evaluation Accounts
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Password: Password@123</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoFill(acc)}
                  className="btn btn-ghost"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '2px',
                    background: email === acc.email ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                    borderColor: email === acc.email ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                    <Icon size={14} color="var(--primary)" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {acc.role}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {acc.msp}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            🔒 Role-based access control backed by Fabric MSP cryptographic identities
          </p>
        </div>
      </div>
    </div>
  );
}
