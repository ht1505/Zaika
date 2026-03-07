import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  preferred_language: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

// ── Mock users (no backend needed) ───────────────────────────────────────────
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@zaika.com': {
    password: 'admin123',
    user: {
      id: 'admin_1',
      name: 'Admin',
      email: 'admin@zaika.com',
      role: 'admin',
      preferred_language: 'en',
    },
  },
  'customer@zaika.com': {
    password: 'demo123',
    user: {
      id: 'cust_1',
      name: 'Arjun',
      email: 'customer@zaika.com',
      role: 'customer',
      preferred_language: 'en',
    },
  },
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('zaika_token');
    const userStr = localStorage.getItem('zaika_user');
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr) });
      } catch {}
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 400)); // realistic delay

    const match = MOCK_USERS[email.toLowerCase().trim()];
    if (!match || match.password !== password) {
      set({ loading: false });
      throw new Error('Invalid email or password');
    }

    const token = 'mock_token_' + Date.now();
    localStorage.setItem('zaika_token', token);
    localStorage.setItem('zaika_user', JSON.stringify(match.user));
    set({ token, user: match.user, loading: false });
  },

  register: async (data) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 400));

    const user: User = {
      id: 'user_' + Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'customer',
      preferred_language: 'en',
    };

    const token = 'mock_token_' + Date.now();
    localStorage.setItem('zaika_token', token);
    localStorage.setItem('zaika_user', JSON.stringify(user));
    set({ token, user, loading: false });
  },

  logout: () => {
    localStorage.removeItem('zaika_token');
    localStorage.removeItem('zaika_user');
    set({ user: null, token: null });
    window.location.href = '/login';
  },
}));