import { create } from 'zustand';

export interface AuthUser {
  username: string;
  display_name: string;
  role: string;
  department: string;
  team: string;
  domain: string;
  computer: string;
  login_at: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  loginWithWindows: () => Promise<boolean>;
  loginWithUsername: (username: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
  clearError: () => void;
}

const STORAGE_KEY = 'cim_auth';

function loadFromStorage(): { user: AuthUser | null; token: string | null; expiresAt: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, token: null, expiresAt: null };
    const parsed = JSON.parse(raw);
    // 检查是否过期
    if (parsed.expiresAt) {
      const expires = new Date(parsed.expiresAt).getTime();
      if (Date.now() > expires) {
        localStorage.removeItem(STORAGE_KEY);
        return { user: null, token: null, expiresAt: null };
      }
    }
    return {
      user: parsed.user || null,
      token: parsed.token || null,
      expiresAt: parsed.expiresAt || null,
    };
  } catch {
    return { user: null, token: null, expiresAt: null };
  }
}

function saveToStorage(user: AuthUser, token: string, expiresAt: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token, expiresAt }));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  expiresAt: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  loginWithWindows: async () => {
    set({ isLoading: true, error: null });
    try {
      const resp = await fetch('/api/auth/windows');
      const data = await resp.json();
      if (data.success) {
        saveToStorage(data.user, data.token, data.expires_at);
        set({
          user: data.user,
          token: data.token,
          expiresAt: data.expires_at,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false, error: data.detail || '登录失败' });
      return false;
    } catch (err) {
      set({ isLoading: false, error: 'Windows认证服务不可用，请检查后端服务' });
      return false;
    }
  },

  loginWithUsername: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await resp.json();
      if (data.success) {
        saveToStorage(data.user, data.token, data.expires_at);
        set({
          user: data.user,
          token: data.token,
          expiresAt: data.expires_at,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false, error: data.detail || '登录失败' });
      return false;
    } catch (err) {
      set({ isLoading: false, error: '登录服务不可用，请检查后端服务' });
      return false;
    }
  },

  logout: () => {
    clearStorage();
    set({ user: null, token: null, expiresAt: null, isAuthenticated: false, error: null });
  },

  initialize: () => {
    const { user, token, expiresAt } = loadFromStorage();
    if (user && token) {
      set({ user, token, expiresAt, isAuthenticated: true });
    }
  },

  clearError: () => set({ error: null }),
}));
