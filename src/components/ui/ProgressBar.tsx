import React from 'react';

export function ProgressBar({ value }: { value: number }): React.ReactElement {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" aria-label={`Progress ${clamped}%`}>
      <div className="h-full bg-sky-600" style={{ width: `${clamped}%` }} />
    </div>
  );
}
