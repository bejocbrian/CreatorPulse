import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-slate-600">The page you requested does not exist.</p>
      <div>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
