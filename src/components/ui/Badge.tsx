import React from 'react';
import clsx from 'clsx';

type BadgeProps = {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
};

export function Badge({ children, tone = 'neutral' }: BadgeProps): React.ReactElement {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'neutral' && 'bg-slate-100 text-slate-700',
        tone === 'success' && 'bg-emerald-100 text-emerald-700',
        tone === 'warning' && 'bg-amber-100 text-amber-800',
        tone === 'danger' && 'bg-rose-100 text-rose-700',
        tone === 'info' && 'bg-sky-100 text-sky-700'
      )}
    >
      {children}
    </span>
  );
}
