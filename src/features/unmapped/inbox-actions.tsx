'use client';

import { ProjectPicker } from '@/features/unmapped/project-picker';
import type { InboxProjectOption, InboxResourceRow } from '@/features/unmapped/types';
import { AppIcon } from '@/shared/ui/app-icon';
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
    return <div className="grid gap-2 sm:flex sm:justify-end">{archive}</div>;
  }
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-end">
      <ProjectPicker
        projects={projects}
        value={projectId}
        suggestedProjectId={resource.suggestion?.projectId ?? null}
        onChange={onProjectId}
      />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          variant="primary"
          disabled={saving || !projectId}
          onClick={onMap}
        >
          <AppIcon name="check" size={16} />
          {saving ? 'Saving…' : 'Map resource'}
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          disabled={saving}
          onClick={onSaveAsProject}
        >
          {saving ? 'Saving…' : 'New project'}
        </Button>
        {archive}
      </div>
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
      <div className="col-span-2 grid grid-cols-2 gap-2 sm:flex">
        <Button
          className="w-full sm:w-auto"
          variant="ghost"
          disabled={saving}
          onClick={onCancelArchive}
        >
          Cancel
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          disabled={saving}
          onClick={onConfirmArchive}
        >
          Confirm archive
        </Button>
      </div>
    );
  }
  return (
    <div className="col-span-2 sm:col-span-1">
      <Button
        className="w-full sm:w-auto"
        variant={leftover ? 'secondary' : 'ghost'}
        disabled={saving}
        onClick={onAskArchive}
      >
        {leftover ? 'Archive leftover' : 'Archive'}
      </Button>
    </div>
  );
}
