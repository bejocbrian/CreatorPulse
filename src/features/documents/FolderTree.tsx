import React, { useMemo } from 'react';
import clsx from 'clsx';

import type { DocumentFolder } from '@/lib/api';

type NodeProps = {
  folder: DocumentFolder;
  selectedId: string | null;
  onSelect: (id: string) => void;
  level: number;
};

function FolderNode({ folder, selectedId, onSelect, level }: NodeProps): React.ReactElement {
  const selected = folder.id === selectedId;

  return (
    <li>
      <button
        type="button"
        className={clsx(
          'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500',
          selected ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-100'
        )}
        style={{ paddingLeft: `${8 + level * 12}px` }}
        onClick={() => onSelect(folder.id)}
        aria-current={selected ? 'page' : undefined}
      >
        <span className="truncate">{folder.name}</span>
      </button>

      {folder.children?.length ? (
        <ul className="mt-1 space-y-1">
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function FolderTree({
  folders,
  selectedId,
  onSelect,
}: {
  folders: DocumentFolder[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}): React.ReactElement {
  const hasFolders = Boolean(folders.length);

  const items = useMemo(() => folders, [folders]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Folders</p>
      </div>

      <ul className="space-y-1" aria-label="Folder tree">
        <li>
          <button
            type="button"
            className={clsx(
              'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500',
              selectedId === null ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-100'
            )}
            onClick={() => onSelect(null)}
            aria-current={selectedId === null ? 'page' : undefined}
          >
            All documents
          </button>
        </li>
        {hasFolders ? (
          items.map((f) => (
            <FolderNode key={f.id} folder={f} selectedId={selectedId} onSelect={(id) => onSelect(id)} level={0} />
          ))
        ) : (
          <li className="px-2 py-2 text-sm text-slate-500">No folders.</li>
        )}
      </ul>
    </div>
  );
}
