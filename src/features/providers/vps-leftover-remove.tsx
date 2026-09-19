'use client';

import { useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { Button } from '@/shared/ui/button';

type VpsLeftoverRemoveProps = {
  projectProviderId: string;
  onRemoved: () => void;
};

export function VpsLeftoverRemove({ projectProviderId, onRemoved }: VpsLeftoverRemoveProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (!window.confirm('Remove this empty VPS attachment? The project stays.')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/project-providers/${projectProviderId}`, { method: 'DELETE' });
      onRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs leading-5 text-[var(--muted)]">
        No active VPS line. Remove the leftover attachment — the project stays.
      </p>
      <Button variant="ghost" className="text-xs" disabled={saving} onClick={() => void remove()}>
        {saving ? 'Removing…' : 'Remove leftover'}
      </Button>
      {error ? (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
