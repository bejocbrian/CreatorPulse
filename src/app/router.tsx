import React, { useEffect } from 'react';
import { createBrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequireAdmin } from '@/features/auth/RequireAdmin';
import { useAuth } from '@/features/auth/AuthProvider';

import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { SubscriptionPage } from '@/features/settings/SubscriptionPage';
import { UserManagementPage } from '@/features/admin/UserManagementPage';
import { UsageAnalyticsPage } from '@/features/admin/UsageAnalyticsPage';
import { NotFoundPage } from '@/app/NotFoundPage';

function Landing(): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return <div className="p-6 text-sm text-slate-600">Loading…</div>;
}

type RedirectState = { from?: string };

function LoginRedirectIfAuthed({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="p-6 text-sm text-slate-600">Loading…</div>;

  if (isAuthenticated) {
    const state = location.state as RedirectState | null;
    return <Navigate to={state?.from ?? '/dashboard'} replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
    errorElement: <NotFoundPage />, // basic fallback
  },
  {
    path: '/login',
    element: (
      <LoginRedirectIfAuthed>
        <LoginPage />
      </LoginRedirectIfAuthed>
    ),
  },
  {
    path: '/signup',
    element: (
      <LoginRedirectIfAuthed>
        <SignupPage />
      </LoginRedirectIfAuthed>
    ),
  },
  {
    path: '/reset',
    element: (
      <LoginRedirectIfAuthed>
        <ResetPasswordPage />
      </LoginRedirectIfAuthed>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/documents', element: <DocumentsPage /> },
      { path: '/settings/subscription', element: <SubscriptionPage /> },
      {
        path: '/admin/users',
        element: (
          <RequireAdmin>
            <UserManagementPage />
          </RequireAdmin>
        ),
      },
      {
        path: '/admin/analytics',
        element: (
          <RequireAdmin>
            <UsageAnalyticsPage />
          </RequireAdmin>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
