import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Info,
} from 'lucide-react';

const ROLE_OPTIONS = [
  {
    id: 'customer',
    label: 'Customer / Consumer',
    desc: 'Public verification portal for product provenance and authenticity.',
    requiresKey: false,
    defaultOrg: 'Consumer',
  },
  {
    id: 'manufacturer',
    label: 'Manufacturer (Org1MSP)',
    desc: 'Authorized to register original physical assets and commit origin blocks.',
    requiresKey: true,
    defaultOrg: 'ManufacturerOrg',
  },
  {
    id: 'distributor',
    label: 'Distributor (Org2MSP)',
    desc: 'Authorized to accept freight custody and process supply chain transfers.',
    requiresKey: true,
    defaultOrg: 'DistributorOrg',
  },
  {
    id: 'retailer',
    label: 'Retailer (Org2MSP)',
    desc: 'Authorized for store inventory validation and consumer point-of-sale handoff.',
    requiresKey: true,
    defaultOrg: 'RetailerOrg',
  },
];

export default function RegisterAccount() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [organization, setOrganization] = useState('Consumer');
  const [enterpriseKey, setEnterpriseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const activeRoleOption = ROLE_OPTIONS.find((r) => r.id === role) || ROLE_OPTIONS[0];

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    const selected = ROLE_OPTIONS.find((r) => r.id === newRole);
    if (selected) {
      setOrganization(selected.defaultOrg);
      if (!selected.requiresKey) {
        setEnterpriseKey('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    if (activeRoleOption.requiresKey && !enterpriseKey.trim()) {
      setError(`Privileged enterprise role "${activeRoleOption.label}" requires an Enterprise Authorization Key.`);
      return;
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        role,
        organization: organization.trim(),
        enterpriseKey: enterpriseKey.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please check your credentials and authorization key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div style={{ maxWidth: '520px', width: '100%', marginBottom: '12px' }}>
        <Link to="/" className="back-to-home-link">
          <ArrowLeft size={14} />
          <span>Back to Overview</span>
        </Link>
      </div>

      <div className="login-card modern-card" style={{ maxWidth: '520px', width: '100%' }}>
        <div className="login-brand-header">
          <div className="brand-logo-icon-wrap">
            <ShieldCheck size={28} color="var(--primary)" />
          </div>
          <h2>Create Account</h2>
          <p className="login-subtitle">
            Join the Permissioned Supply-Chain Provenance Network
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
          {/* Name and Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group">
              <label className="form-label">
                <User size={13} color="var(--text-muted)" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={13} color="var(--text-muted)" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Passwords */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label">
                <Lock size={13} color="var(--text-muted)" />
                <span>Password</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={13} color="var(--text-muted)" />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ marginBottom: '6px' }}>
              <span>Participant Access Tier</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleRoleChange(opt.id)}
                    className={`btn btn-ghost role-card-opt ${isSelected ? 'selected' : ''}`}
                  >
                    <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{opt.label}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {opt.requiresKey ? 'Authorized Enterprise' : 'Open Registration'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Enterprise Onboarding Key */}
          {activeRoleOption.requiresKey ? (
            <div style={{ padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <KeyRound size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Controlled Onboarding Verification
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                Privileged enterprise roles require an authorization key issued by the consortium network administrator.
              </p>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.76rem' }}>
                  Enterprise Authorization Key
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MFG-AUTH-2026 / DIST-AUTH-2026 / RTL-AUTH-2026"
                  value={enterpriseKey}
                  onChange={(e) => setEnterpriseKey(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '0.76rem' }}>
                  <Building size={12} color="var(--text-muted)" />
                  <span>Organization Name</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Apex Manufacturing Inc."
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px 12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={14} color="var(--success)" />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Consumer accounts are activated immediately with zero-trust verification permissions.
              </span>
            </div>
          )}

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

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
