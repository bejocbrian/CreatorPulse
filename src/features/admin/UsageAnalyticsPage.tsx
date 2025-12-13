import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export function UsageAnalyticsPage(): React.ReactElement {
  const analyticsQuery = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: api.admin.analytics,
  });

  if (analyticsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Loading analytics" />
      </div>
    );
  }

  const data = analyticsQuery.data ?? { dailyActiveUsers: [], storageBytesByDay: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Usage analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Basic product metrics for admins.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Daily active users" subtitle="Trailing activity">
          {data.dailyActiveUsers.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyActiveUsers} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No data.</p>
          )}
        </Card>

        <Card title="Storage usage" subtitle="Bytes stored per day">
          {data.storageBytesByDay.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.storageBytesByDay} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatBytes(Number(v))} />
                  <Tooltip formatter={(v) => formatBytes(Number(v))} />
                  <Bar dataKey="bytes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No data.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
