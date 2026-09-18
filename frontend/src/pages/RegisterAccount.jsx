import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, User, Building, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

const ROLES = [
  { id: 'manufacturer', label: 'Manufacturer', msp: 'Org1MSP', defaultOrg: 'ApexManufacturing' },
  { id: 'distributor', label: 'Distributor', msp: 'Org2MSP', defaultOrg: 'SwiftLogistics' },
  { id: 'retailer', label: 'Retailer', msp: 'RetailerMSP', defaultOrg: 'GlobalRetailCo' },
  { id: 'customer', label: 'Customer', msp: 'ClientMSP', defaultOrg: 'Consumer' },
];

export default function RegisterAccount() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('manufacturer');
  const [organization, setOrganization] = useState('ApexManufacturing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    const found = ROLES.find(r => r.id === newRole);
    if (found) {
      setOrganization(found.defaultOrg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        organization: organization.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card modern-card" style={{ maxWidth: '520px', width: '100%' }}>
        <div className="login-brand-header">
          <div className="brand-logo-icon-wrap" style={{ margin: '0 auto 12px', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={28} color="var(--primary)" />
          </div>
          <h2>Create Participant Account</h2>
          <p className="login-subtitle">
            Register your organization identity on the Supply Chain Provenance Network
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <div className="alert-content" style={{ fontSize: '0.88rem' }}>{error}</div>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="var(--success)" />
            <div className="alert-content" style={{ fontSize: '0.88rem' }}>
              Account successfully registered! Redirecting to login...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <User size={13} color="var(--text-muted)" />
                Full Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <Mail size={13} color="var(--text-muted)" />
                Corporate Email
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <Lock size={13} color="var(--text-muted)" />
                Password
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
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <Lock size={13} color="var(--text-muted)" />
                Confirm Password
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

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
              Select Supply Chain Participant Role
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleChange(r.id)}
                  className="btn btn-ghost"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    textAlign: 'left',
                    background: role === r.id ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                    borderColor: role === r.id ? 'var(--primary)' : 'var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{r.label}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MSP: {r.msp}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
              <Building size={13} color="var(--text-muted)" />
              Organization / Company Name
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Acme Pharma Inc."
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || success}
            style={{ height: '44px', fontSize: '0.95rem' }}
          >
            {loading ? 'Registering Account...' : 'Create Account & Join Network'}
            {!loading && <ArrowRight size={16} style={{ marginLeft: '6px' }} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
