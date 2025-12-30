import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    googleAuth,
    logout,
    getCurrentUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    clearError,
    setLoading,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    googleAuth,
    logout,
    getCurrentUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    clearError,
    setLoading,
  };
}
