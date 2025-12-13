import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export function UserManagementPage(): React.ReactElement {
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: api.admin.users,
  });

  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const list = usersQuery.data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((u) => (u.email + ' ' + (u.name ?? '')).toLowerCase().includes(term));
  }, [q, usersQuery.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">User management</h1>
        <p className="mt-1 text-sm text-slate-600">Admin-only directory for managing access.</p>
      </div>

      <Card
        title="Users"
        subtitle={usersQuery.data ? `${usersQuery.data.length} total` : 'Loading…'}
        action={<div className="w-56"><Input label="Search" name="q" value={q} onChange={(e) => setQ(e.target.value)} /></div>}
      >
        {usersQuery.isLoading ? (
          <Spinner label="Loading users" />
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2" aria-label="Users table">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="rounded-lg bg-slate-50">
                    <td className="px-3 py-3 text-sm font-medium text-slate-900">{u.name ?? '—'}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">{u.email}</td>
                    <td className="px-3 py-3 text-sm">
                      <Badge tone={u.role === 'admin' ? 'info' : 'neutral'}>{u.role}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No users found.</p>
        )}
      </Card>
    </div>
  );
}
