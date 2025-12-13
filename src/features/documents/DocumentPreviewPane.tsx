import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type DocumentFile } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export function DocumentPreviewPane({
  file,
  onShare,
}: {
  file: DocumentFile;
  onShare: () => void;
}): React.ReactElement {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (body: { text: string }) => api.documents.addAnnotation(file.id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents', 'files'] });
      setText('');
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {file.mimeType} • Updated {new Date(file.updatedAt).toLocaleString()}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onShare}>
            Share
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-900">Preview</p>
          <p className="mt-1 text-sm text-slate-600">
            This UI is ready to display document previews. Connect your backend preview endpoint (e.g.
            <code className="mx-1">/documents/:id/preview</code>) and render it here.
          </p>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-900">Annotations</p>

          <ul className="mt-2 space-y-2">
            {(file.annotations ?? []).length ? (
              file.annotations!.map((a) => (
                <li key={a.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-medium text-slate-700">{a.author}</p>
                    <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{a.text}</p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-600">No annotations yet.</li>
            )}
          </ul>

          <div className="mt-4 space-y-2">
            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {error}
              </div>
            ) : null}
            <Textarea
              label="Add annotation"
              name="annotation"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Add a note for collaborators…"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!text.trim() || addMutation.isPending}
                onClick={async () => {
                  setError(null);
                  try {
                    await addMutation.mutateAsync({ text: text.trim() });
                  } catch (e) {
                    setError(e instanceof ApiError ? e.message : 'Could not add annotation');
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
