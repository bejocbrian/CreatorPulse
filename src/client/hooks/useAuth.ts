import { useCallback } from 'react';
import { useAuthStore, User } from './authStore';
import api from '../lib/api';

interface LoginResponse {
  user: User;
  accessToken: string;
}

interface AuthError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, setLoading } = useAuthStore();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const response = await api.post<LoginResponse>('/auth/login', {
          email,
          password,
        });
        login(response.data.user, response.data.accessToken);
        return { success: true };
      } catch (error: any) {
        const axiosError = error as { response?: { data: AuthError } };
        return {
          success: false,
          error: axiosError.response?.data?.error || 'Login failed',
        };
      } finally {
        setLoading(false);
      }
    },
    [login, setLoading]
  );

  const handleSignup = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      creatorType: string;
      currency: string;
      payoutRegion: string;
    }) => {
      setLoading(true);
      try {
        const response = await api.post<LoginResponse>('/auth/signup', data);
        login(response.data.user, response.data.accessToken);
        return { success: true };
      } catch (error: any) {
        const axiosError = error as { response?: { data: AuthError } };
        return {
          success: false,
          error: axiosError.response?.data?.error || 'Signup failed',
        };
      } finally {
        setLoading(false);
      }
    },
    [login, setLoading]
  );

  const handleGoogleAuth = useCallback(
    async (idToken: string) => {
      setLoading(true);
      try {
        const response = await api.post<LoginResponse>('/auth/google', { idToken });
        login(response.data.user, response.data.accessToken);
        return { success: true };
      } catch (error: any) {
        const axiosError = error as { response?: { data: AuthError } };
        return {
          success: false,
          error: axiosError.response?.data?.error || 'Google authentication failed',
        };
      } finally {
        setLoading(false);
      }
    },
    [login, setLoading]
  );

  const handleLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      logout();
      window.location.href = '/auth/login';
    }
  }, [logout]);

  const handleVerifyEmail = useCallback(
    async (token: string) => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        return { success: true, message: response.data.message };
      } catch (error: any) {
        const axiosError = error as { response?: { data: AuthError } };
        return {
          success: false,
          error: axiosError.response?.data?.error || 'Verification failed',
        };
      }
    },
    []
  );

  const handleForgotPassword = useCallback(async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      const axiosError = error as { response?: { data: AuthError } };
      return {
        success: false,
        error: axiosError.response?.data?.error || 'Failed to send reset email',
      };
    }
  }, []);

  const handleResetPassword = useCallback(
    async (token: string, password: string) => {
      try {
        const response = await api.post('/auth/reset-password', { token, password });
        return { success: true, message: response.data.message };
      } catch (error: any) {
        const axiosError = error as { response?: { data: AuthError } };
        return {
          success: false,
          error: axiosError.response?.data?.error || 'Password reset failed',
        };
      }
    },
    []
  );

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      useAuthStore.getState().setUser(response.data.user);
    } catch {
      // Token might be invalid
      logout();
    }
  }, [logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    signup: handleSignup,
    loginWithGoogle: handleGoogleAuth,
    logout: handleLogout,
    verifyEmail: handleVerifyEmail,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    fetchUser,
  };
};
