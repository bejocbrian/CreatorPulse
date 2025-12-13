import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FolderTree } from '@/features/documents/FolderTree';

describe('FolderTree', () => {
  it('renders nested folders and allows selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <FolderTree
        folders={[{ id: 'f1', name: 'Deals', children: [{ id: 'f2', name: '2025', children: [] }] }]}
        selectedId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole('button', { name: 'All documents' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2025' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2025' }));
    expect(onSelect).toHaveBeenCalledWith('f2');
  });
});
