import { create } from 'zustand';
import { User } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  googleAuth: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (loading) => set({ loading }),

  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await authService.login({ email, password });
      set({ user: response.user || null, isAuthenticated: true });
    } finally {
      set({ loading: false });
    }
  },

  signup: async (data) => {
    set({ loading: true });
    try {
      const response = await authService.signup(data);
      set({ user: response.user || null, isAuthenticated: true });
    } finally {
      set({ loading: false });
    }
  },

  googleAuth: async (idToken) => {
    set({ loading: true });
    try {
      const response = await authService.googleAuth({ idToken });
      set({ user: response.user || null, isAuthenticated: true });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  logoutAll: async () => {
    set({ loading: true });
    try {
      await authService.logoutAll();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  fetchUser: async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    set({ loading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },
}));
