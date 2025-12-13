import React, { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { api, type DocumentFile } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export function ShareDialog({
  open,
  onClose,
  file,
}: {
  open: boolean;
  onClose: () => void;
  file: DocumentFile;
}): React.ReactElement {
  const [emails, setEmails] = useState('');
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const emailsArray = useMemo(() => {
    const list = emails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    return list.length ? list : undefined;
  }, [emails]);

  const shareMutation = useMutation({
    mutationFn: (body: { emails?: string[]; permission: 'view' | 'comment' | 'edit' }) => api.documents.share(file.id, body),
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
    },
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!shareMutation.isPending) onClose();
      }}
      title="Share document"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={shareMutation.isPending}>
            Close
          </Button>
          <Button
            type="button"
            disabled={shareMutation.isPending}
            onClick={async () => {
              setError(null);
              setShareUrl(null);
              try {
                const res = await shareMutation.mutateAsync({ emails: emailsArray, permission });
                setShareUrl(res.shareUrl);
              } catch (e) {
                setError(e instanceof ApiError ? e.message : 'Sharing failed');
              }
            }}
          >
            Generate link
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Sharing: <span className="font-medium text-slate-900">{file.name}</span>
        </p>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}

        <Input
          label="Invite emails (comma separated, optional)"
          name="emails"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="alice@company.com, bob@company.com"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor="permission">
            Permission
          </label>
          <select
            id="permission"
            name="permission"
            value={permission}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'view' || v === 'comment' || v === 'edit') setPermission(v);
            }}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="view">View</option>
            <option value="comment">Comment</option>
            <option value="edit">Edit</option>
          </select>
        </div>

        {shareUrl ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">Share URL</p>
            <p className="break-all text-sm text-slate-700" aria-label="Share URL">
              {shareUrl}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
