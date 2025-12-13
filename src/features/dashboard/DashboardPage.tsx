import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { api, type Checklist } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';

function checklistPercent(c: Checklist): number {
  if (!c.items.length) return 0;
  const done = c.items.filter((i) => i.done).length;
  return Math.round((done / c.items.length) * 100);
}

export function DashboardPage(): React.ReactElement {
  const transactionsQuery = useQuery({
    queryKey: ['transactions', 'active'],
    queryFn: api.dashboard.activeTransactions,
  });

  const checklistsQuery = useQuery({
    queryKey: ['checklists', 'active'],
    queryFn: api.dashboard.activeChecklists,
  });

  const loading = transactionsQuery.isLoading || checklistsQuery.isLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Loading dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Active transactions, task completion, and document activity at a glance.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Active transactions" subtitle="Items currently in progress">
          {transactionsQuery.data?.length ? (
            <ul className="space-y-3">
              {transactionsQuery.data.map((t) => (
                <li key={t.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Updated {new Date(t.updatedAt).toLocaleString()}</p>
                    </div>
                    <Badge
                      tone={t.status === 'completed' ? 'success' : t.status === 'blocked' ? 'danger' : 'info'}
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Checklist progress</span>
                      <span>{Math.round(t.checklistProgress)}%</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={t.checklistProgress} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No active transactions.</p>
          )}
        </Card>

        <Card title="Checklists" subtitle="Key tasks and milestones">
          {checklistsQuery.data?.length ? (
            <ul className="space-y-3">
              {checklistsQuery.data.map((c) => {
                const pct = checklistPercent(c);
                return (
                  <li key={c.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                      <Badge tone={pct === 100 ? 'success' : 'neutral'}>{pct}%</Badge>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={pct} />
                    </div>
                    <ul className="mt-3 space-y-2">
                      {c.items.slice(0, 4).map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={item.done}
                            readOnly
                            aria-label={item.label}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600"
                          />
                          <span className={item.done ? 'line-through text-slate-400' : ''}>{item.label}</span>
                        </li>
                      ))}
                      {c.items.length > 4 ? (
                        <li className="text-xs text-slate-500">+ {c.items.length - 4} more</li>
                      ) : null}
                    </ul>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No active checklists.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
