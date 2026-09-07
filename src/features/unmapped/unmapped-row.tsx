'use client';

import { useState } from 'react';
import { isUnallocatedResource } from '@/core/mapping/suggest-project';
import { fetchJson } from '@/features/dashboard/api-client';
import { InboxActions } from '@/features/unmapped/inbox-actions';
import { ResourceMeta } from '@/features/unmapped/resource-meta';
import type { InboxProjectOption, InboxResourceRow } from '@/features/unmapped/types';

export function UnmappedRow({
  resource,
  projects,
  onChanged,
}: {
  resource: InboxResourceRow;
  projects: InboxProjectOption[];
  onChanged: () => void;
}) {
  const [projectId, setProjectId] = useState(resource.suggestion?.projectId ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (work: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await work();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[var(--shadow-card)]">
      <ResourceMeta resource={resource} />
      <SuggestionHint resource={resource} />
      <InboxActions
        resource={resource}
        projects={projects}
        projectId={projectId}
        saving={saving}
        confirmArchive={confirmArchive}
        onProjectId={setProjectId}
        onMap={() => {
          if (!projectId) {
            return;
          }
          void run(async () => {
            await fetchJson(`/api/resources/${resource.id}/mapping`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId }),
            });
          });
        }}
        onAskArchive={() => setConfirmArchive(true)}
        onCancelArchive={() => setConfirmArchive(false)}
        onConfirmArchive={() => {
          void run(async () => {
            await fetchJson(`/api/resources/${resource.id}/archive`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ archived: true }),
            });
          });
        }}
      />
      {confirmArchive ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Hides this row. History stays. Restore anytime from Archived.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </li>
  );
}

function SuggestionHint({ resource }: { resource: InboxResourceRow }) {
  if (resource.suggestion) {
    return (
      <p className="mt-3 text-xs text-[var(--warning)]">
        Suggested: {resource.suggestion.projectName}. Confirm in the list — same names can exist
        twice (check slug and Neon/Vercel/Upstash chips). A project does not need all three.
      </p>
    );
  }
  if (isUnallocatedResource(resource)) {
    return (
      <p className="mt-3 text-xs text-[var(--muted)]">
        Team leftover spend. Usually archive, not a business project.
      </p>
    );
  }
  return (
    <p className="mt-3 text-xs text-[var(--muted)]">
      No confident match. Search a project, keep unmapped, or archive.
    </p>
  );
}
