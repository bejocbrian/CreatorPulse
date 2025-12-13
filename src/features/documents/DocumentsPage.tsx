import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api, type DocumentFile } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { FolderTree } from '@/features/documents/FolderTree';
import { UploadDocumentModal } from '@/features/documents/UploadDocumentModal';
import { DocumentPreviewPane } from '@/features/documents/DocumentPreviewPane';
import { ShareDialog } from '@/features/documents/ShareDialog';

export function DocumentsPage(): React.ReactElement {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const foldersQuery = useQuery({
    queryKey: ['documents', 'folders'],
    queryFn: api.documents.folders,
  });

  const filesQuery = useQuery({
    queryKey: ['documents', 'files', selectedFolderId],
    queryFn: () => api.documents.files(selectedFolderId),
  });

  const selectedFile = useMemo<DocumentFile | null>(() => {
    if (!selectedFileId) return null;
    return filesQuery.data?.find((f) => f.id === selectedFileId) ?? null;
  }, [filesQuery.data, selectedFileId]);

  const loading = foldersQuery.isLoading || filesQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-600">Browse folders, upload files, and collaborate with annotations.</p>
        </div>
        <Button type="button" onClick={() => setUploadOpen(true)}>
          Upload
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Card title="Library" subtitle="Folder tree">
            {foldersQuery.isLoading ? (
              <Spinner label="Loading folders" />
            ) : (
              <FolderTree folders={foldersQuery.data ?? []} selectedId={selectedFolderId} onSelect={setSelectedFolderId} />
            )}
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card
            title="Files"
            subtitle={selectedFolderId ? `Folder: ${selectedFolderId}` : 'All documents'}
            action={
              <Button type="button" variant="ghost" onClick={() => filesQuery.refetch()}>
                Refresh
              </Button>
            }
          >
            {loading ? (
              <Spinner label="Loading files" />
            ) : filesQuery.data?.length ? (
              <ul className="space-y-2" aria-label="Document list">
                {filesQuery.data.map((f) => {
                  const selected = f.id === selectedFileId;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        className={
                          selected
                            ? 'flex w-full items-start justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-left'
                            : 'flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:bg-slate-50'
                        }
                        onClick={() => setSelectedFileId(f.id)}
                        aria-current={selected ? 'page' : undefined}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{f.name}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {f.mimeType} • Updated {new Date(f.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-xs text-slate-500">{(f.annotations ?? []).length} notes</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No documents found.</p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4">
          <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            {selectedFile ? (
              <DocumentPreviewPane
                file={selectedFile}
                onShare={() => {
                  setShareOpen(true);
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <p className="text-sm font-medium text-slate-900">Select a document to preview</p>
                  <p className="mt-1 text-sm text-slate-600">Annotations and sharing options appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={selectedFolderId} />

      {selectedFile ? (
        <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} file={selectedFile} />
      ) : null}
    </div>
  );
}
