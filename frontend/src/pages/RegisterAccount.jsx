import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function RegisterAccount() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasOrgCode, setHasOrgCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify confirmation password.');
      return;
    }

    if (hasOrgCode && !accessCode.trim()) {
      setError('Please enter your Organization Access Code, or uncheck the option to register as a consumer.');
      return;
    }

    try {
      setLoading(true);

      // Server-Side Controlled Onboarding:
      // Client never sends role or organization. The server assigns permissions strictly from accessCode (or defaults to customer).
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        accessCode: hasOrgCode ? accessCode.trim() : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1600);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please check your credentials or organization code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div style={{ maxWidth: '480px', width: '100%', marginBottom: '12px' }}>
        <Link to="/" className="back-to-home-link">
          <ArrowLeft size={14} />
          <span>Back to Overview</span>
        </Link>
      </div>

      <div className="login-card modern-card" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="login-brand-header">
          <div className="brand-logo-icon-wrap">
            <ShieldCheck size={28} color="var(--primary)" />
          </div>
          <h2>Create TraceChain Account</h2>
          <p className="login-subtitle">
            Enterprise Supply-Chain Provenance Network
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <div className="alert-content" style={{ fontSize: '0.86rem' }}>{error}</div>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <CheckCircle2 size={16} color="var(--success)" />
            <div className="alert-content" style={{ fontSize: '0.86rem' }}>
              Account registered successfully! Redirecting to sign in...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="register-name">
              <User size={13} color="var(--text-muted)" />
              <span>Full Name</span>
            </label>
            <input
              id="register-name"
              type="text"
              className="form-control"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading || success}
              autoComplete="name"
            />
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="register-email">
              <Mail size={13} color="var(--text-muted)" />
              <span>Email Address</span>
            </label>
            <input
              id="register-email"
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="register-password">
              <Lock size={13} color="var(--text-muted)" />
              <span>Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="register-confirm-password">
              <Lock size={13} color="var(--text-muted)" />
              <span>Confirm Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || success}
                autoComplete="new-password"
                style={{ paddingRight: '38px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Enterprise Onboarding Toggle */}
          <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={hasOrgCode}
                onChange={(e) => {
                  setHasOrgCode(e.target.checked);
                  if (!e.target.checked) setAccessCode('');
                }}
                style={{ marginTop: '3px' }}
                disabled={loading || success}
              />
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', display: 'block' }}>
                  Register with an Organization Access Code
                </span>
                <span style={{ fontSize: '0.76rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  Required for enterprise accounts (Manufacturer, Logistics, Retail). If you do not have a code, leave this unchecked to register as a standard consumer.
                </span>
              </div>
            </label>

            {hasOrgCode && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <label className="form-label" htmlFor="access-code-input" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  <KeyRound size={13} color="var(--primary)" />
                  <span>Organization Access Code</span>
                </label>
                <input
                  id="access-code-input"
                  type="text"
                  className="form-control"
                  placeholder="Enter code provided by your organization"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required={hasOrgCode}
                  disabled={loading || success}
                  autoComplete="off"
                  spellCheck="false"
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Role, organization, and cryptographic permissions are assigned server-side from verified access codes.
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || success}
            style={{ height: '42px', fontSize: '0.92rem' }}
          >
            {loading ? 'Validating & Registering...' : 'Create Account'}
            {!loading && <ArrowRight size={15} style={{ marginLeft: '6px' }} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Enterprise-grade Cryptographic Access Control &bull; Controlled Onboarding
          </p>
        </div>
      </div>
    </div>
  );
}
