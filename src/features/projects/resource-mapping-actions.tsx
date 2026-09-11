'use client';

import { useMemo, useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import {
  destinationProjectsForMove,
  suggestedMoveProjectId,
} from '@/features/projects/destination-projects';
import type { ProjectResourceRow } from '@/features/projects/types';
import { ProjectPicker } from '@/features/unmapped/project-picker';
import type { InboxProjectOption } from '@/features/unmapped/types';
import { isFixedVpsProvider } from '@/shared/provider-label';
import { Button } from '@/shared/ui/button';

type MappingMode = 'idle' | 'move' | 'unmap';

export function ResourceMappingActions({
  resource,
  providerKey,
  currentProjectId,
  projects,
  onChanged,
}: {
  resource: ProjectResourceRow;
  providerKey: string;
  currentProjectId: string;
  projects: InboxProjectOption[];
  onChanged: () => void;
}) {
  const destinations = useMemo(
    () => destinationProjectsForMove(projects, currentProjectId),
    [currentProjectId, projects],
  );
  const suggestedId = useMemo(
    () =>
      suggestedMoveProjectId(
        {
          displayName: resource.displayName,
          externalId: resource.externalId,
          resourceType: resource.resourceType,
        },
        destinations,
      ),
    [destinations, resource.displayName, resource.externalId, resource.resourceType],
  );
  const allowUnmap = !isFixedVpsProvider(providerKey);
  const [mode, setMode] = useState<MappingMode>('idle');
  const [projectId, setProjectId] = useState(suggestedId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (nextProjectId: string | null) => {
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/resources/${resource.id}/mapping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: nextProjectId }),
      });
      setMode('idle');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const openMove = () => {
    setError(null);
    setProjectId(suggestedId ?? '');
    setMode('move');
  };

  if (mode === 'move') {
    return (
      <div className="border-t border-[var(--line)] bg-[var(--sunken)] px-4 py-3">
        <ProjectPicker
          projects={destinations}
          value={projectId}
          suggestedProjectId={suggestedId}
          allowUnmapped={false}
          label="Move to project"
          unassignedTitle="Choose a project"
          unassignedHint="History follows this resource."
          onChange={setProjectId}
        />
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Spend stays on this resource. Archive the empty leftover project when nothing remains.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button variant="ghost" disabled={saving} onClick={() => setMode('idle')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={saving || !projectId}
            onClick={() => {
              void run(projectId);
            }}
          >
            {saving ? 'Moving…' : 'Move resource'}
          </Button>
        </div>
        {error ? (
          <p className="mt-3 text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (mode === 'unmap') {
    return (
      <div className="border-t border-[var(--line)] bg-[var(--sunken)] px-4 py-3">
        <p className="text-xs leading-5 text-[var(--muted)]">
          Sends this resource back to the inbox. Project totals drop it; history stays on the
          resource so you can map it again.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button variant="ghost" disabled={saving} onClick={() => setMode('idle')}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => {
              void run(null);
            }}
          >
            {saving ? 'Unmapping…' : 'Confirm unmap'}
          </Button>
        </div>
        {error ? (
          <p className="mt-3 text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--line)] bg-[var(--sunken)] px-4 py-3">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button
          variant="secondary"
          disabled={destinations.length === 0}
          title={
            destinations.length === 0 ? 'No other live projects to move into' : 'Move to another project'
          }
          onClick={openMove}
        >
          Move
        </Button>
        {allowUnmap ? (
          <Button
            variant="ghost"
            onClick={() => {
              setError(null);
              setMode('unmap');
            }}
          >
            Unmap
          </Button>
        ) : null}
      </div>
      {destinations.length === 0 && allowUnmap ? (
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Unmap to send this resource back to the inbox, then map it onto the right project.
        </p>
      ) : null}
      {!allowUnmap ? (
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          VPS lines stay on a project. Move them if the monthly fee belongs elsewhere.
        </p>
      ) : null}
    </div>
  );
}
