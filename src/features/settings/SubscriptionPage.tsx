import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

function toneForStatus(status: string): Parameters<typeof Badge>[0]['tone'] {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'success';
    case 'past_due':
      return 'warning';
    case 'canceled':
    case 'incomplete':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function SubscriptionPage(): React.ReactElement {
  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: api.billing.subscription,
  });

  if (subscriptionQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner label="Loading subscription" />
      </div>
    );
  }

  const sub = subscriptionQuery.data ?? { status: 'none' as const };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Subscription</h1>
        <p className="mt-1 text-sm text-slate-600">Stripe billing status and account settings.</p>
      </div>

      <Card
        title="Plan"
        subtitle="Billing details"
        action={
          sub.portalUrl ? (
            <Button type="button" variant="secondary" onClick={() => window.open(sub.portalUrl, '_blank', 'noopener,noreferrer')}>
              Open Stripe portal
            </Button>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-700">Status:</p>
            <Badge tone={toneForStatus(sub.status)}>{sub.status}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{sub.planName ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Renews</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            This page surfaces your Stripe subscription state. Connect your backend’s billing endpoint
            (<code className="mx-1">/billing/subscription</code>) to return a status, plan name, and portal URL.
          </p>
        </div>
      </Card>
    </div>
  );
}
