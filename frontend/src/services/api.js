import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: Attach JWT token if user is logged in
// Prioritize sessionStorage for tab-isolated enterprise authentication, fallback to localStorage
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract clean error message
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If 401 Unauthorized or 403 Forbidden, dispatch event or handle session expiry
    // Exclude public pages so guest visitors are not redirected to login
    const isPublicPath =
      window.location.pathname === '/' ||
      window.location.pathname === '/login' ||
      window.location.pathname === '/register' ||
      window.location.pathname.startsWith('/verify') ||
      window.location.pathname.startsWith('/history') ||
      window.location.pathname.startsWith('/track');

    if (error.response?.status === 401 && !isPublicPath) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const publicApi = {
  verify: (productId) => api.get(`/public/products/${encodeURIComponent(productId)}/verify`),
  getHistory: (productId) => api.get(`/public/products/${encodeURIComponent(productId)}/history`),
  getTracking: (productId) => api.get(`/public/products/${encodeURIComponent(productId)}/tracking`),
};

export const productApi = {
  register: (productData) => api.post('/products', productData),
  getAll: () => api.get('/products'),
  getById: (productId) => api.get(`/products/${productId}`),
  verify: (productId) => api.get(`/products/${productId}/verify`),
  transfer: (productId, transferData) => api.post(`/products/${productId}/transfer`, transferData),
  getHistory: (productId) => api.get(`/products/${productId}/history`),
  getTracking: (productId) => api.get(`/products/${encodeURIComponent(productId)}/tracking`),
};

export const networkApi = {
  getStatus: () => api.get('/network/status'),
  getActivity: () => api.get('/network/activity'),
};
