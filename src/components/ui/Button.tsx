import React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps): React.ReactElement {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-sky-600 text-white hover:bg-sky-700',
        variant === 'secondary' && 'bg-slate-900 text-white hover:bg-slate-800',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
        variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100',
        className
      )}
      {...props}
    />
  );
}
