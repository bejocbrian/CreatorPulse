import React, { Fragment, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

const linkBase =
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500';

function AppNavLinks({ onNavigate }: { onNavigate?: () => void }): React.ReactElement {
  const { user } = useAuth();
  const navLink = (to: string, label: string) => (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(linkBase, isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-100')
      }
    >
      {label}
    </NavLink>
  );

  return (
    <nav className="space-y-1" aria-label="Primary">
      {navLink('/dashboard', 'Dashboard')}
      {navLink('/documents', 'Documents')}
      {navLink('/settings/subscription', 'Subscription')}
      {user?.role === 'admin' ? (
        <div className="pt-2">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Admin</p>
          <div className="space-y-1">
            {navLink('/admin/users', 'User management')}
            {navLink('/admin/analytics', 'Usage analytics')}
          </div>
        </div>
      ) : null}
    </nav>
  );
}

export function AppShell(): React.ReactElement {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Transition.Root show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setMobileOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="w-full max-w-xs bg-white p-4 shadow-soft">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">Dashboard</p>
                    <Button variant="ghost" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                      Close
                    </Button>
                  </div>
                  <AppNavLinks onNavigate={() => setMobileOpen(false)} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block">
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-900">Workspace</p>
            <p className="text-xs text-slate-500">Secure transactions & documents</p>
          </div>
          <AppNavLinks />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  Menu
                </Button>
                <p className="text-sm font-semibold text-slate-900">Dashboard</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-slate-900">{user?.name ?? user?.email}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <Button variant="secondary" onClick={logout}>
                  Log out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
