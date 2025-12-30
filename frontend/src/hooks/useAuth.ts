import { useAuthStore } from '../store/auth.store';
import { useEffect } from 'react';

export const useAuth = () => {
  const { user, isAuthenticated, loading, setUser, setLoading, login, signup, googleAuth, logout, logoutAll, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!user && isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  return {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    googleAuth,
    logout,
    logoutAll,
    refreshUser: fetchUser,
  };
};
