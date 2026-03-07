import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('zaika_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('zaika_token');
      localStorage.removeItem('zaika_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login:    (data: { email: string; password: string }) => api.post('/api/auth/login', data),
  register: (data: { name: string; email: string; password: string; phone?: string }) => api.post('/api/auth/register', data),
  me:       () => api.get('/api/auth/me'),
};

// ─── Menu ─────────────────────────────────────────────────────
export const menuApi = {
  getMenu:    (params?: { category?: string; item_class?: string; search?: string; veg_only?: boolean }) =>
    api.get('/api/menu', { params }),
  getItem:    (id: string) => api.get(`/api/menu/${id}`),
  getCombos:  () => api.get('/api/menu/combos'),
};

// ─── Orders ───────────────────────────────────────────────────
export const ordersApi = {
  placeOrder: (data: {
    items: { item_id: string; qty: number; modifiers?: any[] }[];
    channel?: 'cart' | 'chat' | 'voice';
    special_notes?: string;
    language_used?: string;
  }) => api.post('/api/orders', data),

  chatOrder: (data: {
    message: string;
    conversation_history?: { role: string; content: string }[];
    language?: string;
  }) => api.post('/api/orders/chat', data),

  myOrders:   (page = 1) => api.get('/api/orders', { params: { page } }),
  getOrder:   (id: string) => api.get(`/api/orders/${id}`),

  // Admin
  allOrders:  (params?: { status?: string; channel?: string; page?: number }) =>
    api.get('/api/orders/all', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/orders/${id}/status`, { status }),
};

// ─── Revenue ──────────────────────────────────────────────────
export const revenueApi = {
  getInsights:       () => api.get('/api/revenue/insights'),
  getRecommendations:() => api.get('/api/revenue/recommendations'),
  getCombos:         () => api.get('/api/revenue/combos'),
};

// ─── Voice ────────────────────────────────────────────────────
export const voiceApi = {
  processTranscript: (data: { transcript: string; language?: string }) =>
    api.post('/api/voice/order', data),
  confirmOrder: (data: any) =>
    api.post('/api/voice/confirm', data),
};
