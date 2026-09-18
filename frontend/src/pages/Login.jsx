import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, getRoleDashboard } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email address and account password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const loggedInUser = await login({ email, password });

      // Navigate to previous intended path or role-specific console
      const fromPath = location.state?.from?.pathname;
      const targetDashboard = getRoleDashboard(loggedInUser?.role);
      navigate(fromPath || targetDashboard, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials or authentication server is currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Top return link to Public Landing Page */}
      <div style={{ maxWidth: '440px', width: '100%', marginBottom: '12px' }}>
        <Link to="/" className="back-to-home-link">
          <ArrowLeft size={14} />
          <span>Back to Overview</span>
        </Link>
      </div>

      <div className="login-card modern-card" style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="brand-logo-icon-wrap">
            <ShieldCheck size={28} color="var(--primary)" />
          </div>
          <h2>Sign In to TraceChain</h2>
          <p className="login-subtitle">
            Enterprise Supply-Chain Provenance Console
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <div className="alert-content" style={{ fontSize: '0.86rem' }}>{error}</div>
          </div>
        )}

        {/* Enterprise Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="email-input">
              <Mail size={13} color="var(--text-muted)" />
              <span>Email Address</span>
            </label>
            <input
              id="email-input"
              type="email"
              className="form-control"
              placeholder="e.g. name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" htmlFor="password-input">
              <Lock size={13} color="var(--text-muted)" />
              <span>Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '38px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ height: '42px', fontSize: '0.92rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={15} style={{ marginLeft: '6px' }} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Create an account
          </Link>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Enterprise-grade Cryptographic Access Control &bull; Verified Organization Signatures
          </p>
        </div>
      </div>
    </div>
  );
}
