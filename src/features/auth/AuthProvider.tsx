import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type User } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/tokenStorage';

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (body: { email: string; password: string }) => Promise<void>;
  signup: (body: { name?: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    try {
      return getAccessToken();
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    clearAccessToken();
    setToken(null);
    queryClient.removeQueries({ queryKey: ['me'] });
  }, [queryClient]);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.auth.me,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const err = meQuery.error;
    if (err instanceof ApiError && err.status === 401) logout();
  }, [logout, meQuery.error]);

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: async (data) => {
      setAccessToken(data.token);
      setToken(data.token);
      await queryClient.setQueryData(['me'], data.user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: api.auth.signup,
    onSuccess: async (data) => {
      setAccessToken(data.token);
      setToken(data.token);
      await queryClient.setQueryData(['me'], data.user);
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: meQuery.data ?? null,
      isLoading: (Boolean(token) && meQuery.isLoading) || loginMutation.isPending || signupMutation.isPending,
      isAuthenticated: Boolean(token) && Boolean(meQuery.data),
      login: async (body) => {
        await loginMutation.mutateAsync(body);
      },
      signup: async (body) => {
        await signupMutation.mutateAsync(body);
      },
      logout,
    }),
    [
      loginMutation,
      logout,
      meQuery.data,
      meQuery.isLoading,
      signupMutation,
      token,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
