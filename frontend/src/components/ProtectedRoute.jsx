import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading, getRoleDashboard } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Verifying authentication session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if specific roles are required
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      // User is authenticated but unauthorized for this specific role dashboard/page
      return (
        <div className="unauthorized-container card modern-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Your account role (<strong>{user.role}</strong> &bull; {user.organization}) does not have permission to access this page.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Navigate to={getRoleDashboard(user.role)} replace />
          </div>
        </div>
      );
    }
  }

  return children;
}
