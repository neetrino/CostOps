'use client';

import { useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { ResourceMeta } from '@/features/unmapped/resource-meta';
import type { InboxResourceRow } from '@/features/unmapped/types';
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
    <li className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-card)]">
      <ResourceMeta
        resource={resource}
        extra={resource.archivedAt ? `Archived ${resource.archivedAt.slice(0, 10)}` : 'Archived'}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
        <Button variant="secondary" disabled={saving} onClick={() => void restore()}>
          {saving ? 'Restoring…' : 'Restore to inbox'}
        </Button>
        <p className="text-xs text-[var(--muted)]">Returns to Unmapped. Mapping is unchanged.</p>
      </div>
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </li>
  );
}
