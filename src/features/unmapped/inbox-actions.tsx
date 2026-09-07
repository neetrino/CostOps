'use client';

import { ProjectPicker } from '@/features/unmapped/project-picker';
import type { InboxProjectOption, InboxResourceRow } from '@/features/unmapped/types';
import { Button } from '@/shared/ui/button';

export function InboxActions({
  resource,
  projects,
  projectId,
  saving,
  confirmArchive,
  onProjectId,
  onMap,
  onAskArchive,
  onCancelArchive,
  onConfirmArchive,
}: {
  resource: InboxResourceRow;
  projects: InboxProjectOption[];
  projectId: string;
  saving: boolean;
  confirmArchive: boolean;
  onProjectId: (value: string) => void;
  onMap: () => void;
  onAskArchive: () => void;
  onCancelArchive: () => void;
  onConfirmArchive: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--line)] pt-4">
      <ProjectPicker
        projects={projects}
        value={projectId}
        suggestedProjectId={resource.suggestion?.projectId ?? null}
        onChange={onProjectId}
      />
      <Button variant="secondary" disabled={saving || !projectId} onClick={onMap}>
        {saving ? 'Saving…' : 'Map'}
      </Button>
      {confirmArchive ? (
        <>
          <Button variant="ghost" disabled={saving} onClick={onCancelArchive}>
            Cancel
          </Button>
          <Button variant="secondary" disabled={saving} onClick={onConfirmArchive}>
            Confirm archive
          </Button>
        </>
      ) : (
        <Button variant="ghost" disabled={saving} onClick={onAskArchive}>
          Archive
        </Button>
      )}
    </div>
  );
}
