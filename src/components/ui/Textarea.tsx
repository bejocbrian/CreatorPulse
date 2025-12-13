import React from 'react';
import clsx from 'clsx';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function Textarea({ label, error, className, id, ...props }: TextareaProps): React.ReactElement {
  const inputId = id ?? props.name ?? label;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={inputId}
        className={clsx(
          'w-full resize-y rounded-md border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-offset-2 focus:ring-2',
          error ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-200 focus:ring-sky-500',
          className
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
