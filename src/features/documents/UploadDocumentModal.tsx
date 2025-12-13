import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function UploadDocumentModal({
  open,
  onClose,
  folderId,
}: {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
}): React.ReactElement {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: api.documents.upload,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents', 'files'] });
      onClose();
      setFile(null);
    },
  });

  const canSubmit = Boolean(file) && !uploadMutation.isPending;

  const folderLabel = useMemo(() => (folderId ? `folder ${folderId}` : 'All documents'), [folderId]);

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!uploadMutation.isPending) onClose();
      }}
      title="Upload document"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              if (!file) return;
              setError(null);
              try {
                await uploadMutation.mutateAsync({ folderId, file });
              } catch (e) {
                setError(e instanceof ApiError ? e.message : 'Upload failed');
              }
            }}
            disabled={!canSubmit}
          >
            Upload
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Upload to: {folderLabel}</p>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="file">
            File
          </label>
          <input
            id="file"
            name="file"
            type="file"
            className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            onChange={(e) => {
              const f = e.currentTarget.files?.item(0) ?? null;
              setFile(f);
            }}
          />
        </div>

        <p className="text-xs text-slate-500">
          Tip: backend should accept <code>multipart/form-data</code> on <code>/documents/upload</code>.
        </p>
      </div>
    </Modal>
  );
}
