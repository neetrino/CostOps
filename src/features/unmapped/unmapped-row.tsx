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
    <li className="surface-ledger overflow-hidden">
      <div className="p-4 sm:p-5">
        <ResourceMeta resource={resource} />
        <SuggestionHint resource={resource} />
      </div>
      <div className="border-t border-[var(--line)] bg-[var(--sunken)] p-4 sm:px-5">
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
          onSaveAsProject={
            isUnallocatedResource(resource)
              ? null
              : () => {
                  void run(async () => {
                    await fetchJson(`/api/resources/${resource.id}/project`, { method: 'POST' });
                  });
                }
          }
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
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            Hides this row. History stays and the resource can be restored at any time.
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function SuggestionHint({ resource }: { resource: InboxResourceRow }) {
  if (resource.suggestion) {
    return (
      <p className="mt-3 text-xs text-[var(--warning)]">
        Suggested match: <span className="font-semibold">{resource.suggestion.projectName}</span>.
        Confirm its slug and provider chips before mapping.
      </p>
    );
  }
  if (isUnallocatedResource(resource)) {
    return (
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        Team-level charge, not an application. Archive it if it should stay outside project totals.
      </p>
    );
  }
  return (
    <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
      Standalone provider resource. Save as project to start a new single-provider CostOps project.
    </p>
  );
}
