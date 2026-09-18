import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';

export default function PublicNavbar() {
  const { user, isAuthenticated, logout, getRoleDashboard } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/#' + id);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="public-navbar">
      <div className="public-navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="public-brand-link">
          <div className="brand-icon-wrap">
            <ShieldCheck size={22} color="var(--primary)" />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-main-title">SupplyChain Provenance</span>
            <span className="brand-sub-tag">Hyperledger Fabric 2.5</span>
          </div>
        </Link>

        {/* Public Navigation Links */}
        <nav className="public-nav-menu">
          <button type="button" className="public-nav-item" onClick={() => scrollToSection('home')}>
            Home
          </button>
          <button type="button" className="public-nav-item" onClick={() => scrollToSection('capabilities')}>
            Capabilities
          </button>
          <button type="button" className="public-nav-item" onClick={() => scrollToSection('how-it-works')}>
            How It Works
          </button>
          <button type="button" className="public-nav-item" onClick={() => scrollToSection('technology')}>
            Technology
          </button>
          <button type="button" className="public-nav-item" onClick={() => scrollToSection('about')}>
            About
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="public-nav-actions">
          {isAuthenticated && user ? (
            <div className="auth-user-quick-box">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(getRoleDashboard(user.role))}
              >
                <LayoutDashboard size={14} style={{ marginRight: '6px' }} />
                <span>Go to Console</span>
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                title="Sign out of account"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="public-auth-buttons">
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <span>Create Account</span>
                <ArrowRight size={14} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
