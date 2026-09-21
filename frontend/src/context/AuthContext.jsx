import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

// Helper to decode claims from JWT token payload safely
function parseJwt(tokenStr) {
  try {
    if (!tokenStr) return null;
    const parts = tokenStr.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getValidStoredToken() {
  const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (!storedToken) return null;
  const payload = parseJwt(storedToken);
  if (payload?.exp && payload.exp * 1000 < Date.now()) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
  return storedToken;
}

function getSynchronizedUser(tokenStr) {
  if (!tokenStr) return null;
  try {
    const savedUserStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
    const payload = parseJwt(tokenStr);
    if (payload) {
      if (!savedUser || savedUser.organization !== payload.organization || savedUser.role !== payload.role) {
        return {
          id: payload.id,
          name: payload.name || savedUser?.name || 'User',
          email: payload.email || savedUser?.email || '',
          role: payload.role,
          organization: payload.organization,
          mspId: payload.mspId,
        };
      }
    }
    return savedUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getValidStoredToken());
  const [user, setUser] = useState(() => {
    const initToken = getValidStoredToken();
    return getSynchronizedUser(initToken);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate token on initial mount
    const verifyToken = async () => {
      const storedToken = getValidStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response?.data?.user) {
          const verifiedUser = response.data.user;
          setUser(verifiedUser);
          sessionStorage.setItem('user', JSON.stringify(verifiedUser));
          localStorage.setItem('user', JSON.stringify(verifiedUser));
        }
      } catch {
        // Token invalid or expired
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    const authToken = response.token;
    const authUser = response.user || response.data?.user;

    if (!authToken || !authUser) {
      throw new Error('Authentication failed: Missing token or user payload.');
    }

    sessionStorage.setItem('token', authToken);
    sessionStorage.setItem('user', JSON.stringify(authUser));
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);

    return authUser;
  };

  const register = async (userData) => {
    return await authApi.register(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const getRoleDashboard = (roleName) => {
    const r = (roleName || user?.role || '').toLowerCase();
    switch (r) {
      case 'manufacturer':
        return '/manufacturer/dashboard';
      case 'distributor':
        return '/distributor/dashboard';
      case 'retailer':
        return '/retailer/dashboard';
      case 'customer':
        return '/customer/dashboard';
      default:
        return '/login';
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    getRoleDashboard,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
