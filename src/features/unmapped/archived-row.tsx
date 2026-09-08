'use client';

import { useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { ResourceMeta } from '@/features/unmapped/resource-meta';
import type { InboxResourceRow } from '@/features/unmapped/types';
import { AppIcon } from '@/shared/ui/app-icon';
import { Button } from '@/shared/ui/button';

export function ArchivedRow({
  resource,
  onChanged,
}: {
  resource: InboxResourceRow;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = async () => {
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/resources/${resource.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="surface-panel overflow-hidden opacity-90 transition-opacity hover:opacity-100">
      <div className="p-4 sm:p-5">
        <ResourceMeta
          resource={resource}
          extra={resource.archivedAt ? `Archived ${resource.archivedAt.slice(0, 10)}` : 'Archived'}
        />
      </div>
      <div className="grid gap-2 border-t border-[var(--line)] bg-[var(--sunken)] p-4 sm:flex sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs leading-5 text-[var(--muted)]">
          Returns to the decision inbox with history intact.
        </p>
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          disabled={saving}
          onClick={() => void restore()}
        >
          <AppIcon name="inbox" size={16} />
          {saving ? 'Restoring…' : 'Restore to inbox'}
        </Button>
      </div>
      {error ? (
        <p className="px-4 pb-4 text-xs text-[var(--danger)] sm:px-5" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}
