import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { AuthLayout } from '@/features/auth/AuthLayout';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const requestSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

const confirmSchema = z.object({
  token: z.string().min(1, 'Missing token'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function ResetPasswordPage(): React.ReactElement {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mode = useMemo(() => (token ? 'confirm' : 'request'), [token]);

  const requestMutation = useMutation({
    mutationFn: api.auth.requestReset,
    onSuccess: () => {
      setSuccess('If an account exists for that email, a reset link has been sent.');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: api.auth.confirmReset,
    onSuccess: () => {
      setSuccess('Password updated. You can now sign in.');
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (mode === 'request') {
      const parsed = requestSchema.safeParse({ email });
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
        await requestMutation.mutateAsync(parsed.data);
      } catch (err) {
        setFormError(err instanceof ApiError ? err.message : 'Reset request failed');
      }
      return;
    }

    const parsed = confirmSchema.safeParse({ token: token ?? '', password });
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
      await confirmMutation.mutateAsync(parsed.data);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Password reset failed');
    }
  }

  const isPending = requestMutation.isPending || confirmMutation.isPending;

  return (
    <AuthLayout
      title="Reset password"
      subtitle={mode === 'request' ? 'Request a password reset link.' : 'Set a new password.'}
    >
      <form className="space-y-4" onSubmit={onSubmit} aria-label="Reset password form">
        {formError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {formError}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {success}
          </div>
        ) : null}

        {mode === 'request' ? (
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
        ) : (
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {mode === 'request' ? 'Send reset link' : 'Update password'}
        </Button>

        <p className="text-sm text-slate-600">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
