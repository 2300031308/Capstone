import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;

export const productApi = {
  register: (productData) => api.post('/products', productData),
  getAll: () => api.get('/products'),
  getById: (productId) => api.get(`/products/${productId}`),
  transfer: (productId, transferData) => api.post(`/products/${productId}/transfer`, transferData),
  getHistory: (productId) => api.get(`/products/${productId}/history`),
};

export const networkApi = {
  getStatus: () => api.get('/network/status'),
  getActivity: () => api.get('/network/activity'),
};

