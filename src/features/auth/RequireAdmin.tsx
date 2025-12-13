import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthProvider';

export function RequireAdmin({ children }: { children: React.ReactNode }): React.ReactElement {
  const { user } = useAuth();

  if (!user) return <Navigate to="/dashboard" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
