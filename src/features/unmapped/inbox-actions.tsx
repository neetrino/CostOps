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
  onSaveAsProject,
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
  onSaveAsProject: (() => void) | null;
  onAskArchive: () => void;
  onCancelArchive: () => void;
  onConfirmArchive: () => void;
}) {
  const archive = (
    <ArchiveButtons
      saving={saving}
      confirmArchive={confirmArchive}
      leftover={!onSaveAsProject}
      onAskArchive={onAskArchive}
      onCancelArchive={onCancelArchive}
      onConfirmArchive={onConfirmArchive}
    />
  );
  if (!onSaveAsProject) {
    return (
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--line)] pt-4">
        {archive}
      </div>
    );
  }
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
      <Button variant="secondary" disabled={saving} onClick={onSaveAsProject}>
        {saving ? 'Saving…' : 'Save as project'}
      </Button>
      {archive}
    </div>
  );
}

function ArchiveButtons({
  saving,
  confirmArchive,
  leftover,
  onAskArchive,
  onCancelArchive,
  onConfirmArchive,
}: {
  saving: boolean;
  confirmArchive: boolean;
  leftover: boolean;
  onAskArchive: () => void;
  onCancelArchive: () => void;
  onConfirmArchive: () => void;
}) {
  if (confirmArchive) {
    return (
      <>
        <Button variant="ghost" disabled={saving} onClick={onCancelArchive}>
          Cancel
        </Button>
        <Button variant="secondary" disabled={saving} onClick={onConfirmArchive}>
          Confirm archive
        </Button>
      </>
    );
  }
  return (
    <Button variant={leftover ? 'secondary' : 'ghost'} disabled={saving} onClick={onAskArchive}>
      {leftover ? 'Archive leftover' : 'Archive'}
    </Button>
  );
}
