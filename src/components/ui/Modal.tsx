import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import { Button } from '@/components/ui/Button';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}): React.ReactElement {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-[0.98]"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-[0.98]"
            >
              <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-soft">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                  <div>
                    <Dialog.Title className="text-base font-semibold text-slate-900">{title}</Dialog.Title>
                  </div>
                  <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
                    Close
                  </Button>
                </div>
                <div className="px-5 py-4">{children}</div>
                {footer ? <div className="border-t border-slate-100 px-5 py-4">{footer}</div> : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
