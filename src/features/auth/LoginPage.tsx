import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { AuthLayout } from '@/features/auth/AuthLayout';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function LoginPage(): React.ReactElement {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});

    try {
      await auth.login(parsed.data);
      const state = location.state as { from?: string } | null;
      navigate(state?.from ?? '/dashboard', { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Login failed');
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage transactions and documents.">
      <form className="space-y-4" onSubmit={onSubmit} aria-label="Login form">
        {formError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {formError}
          </div>
        ) : null}

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" className="w-full" disabled={auth.isLoading}>
          Sign in
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link to="/reset">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
