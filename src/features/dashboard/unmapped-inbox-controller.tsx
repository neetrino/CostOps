'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { UNMAPPED_INBOX_DISMISS_STORAGE_KEY } from '@/config/constants';
import { shouldShowUnmappedInbox } from '@/core/mapping/inbox-dismiss';
import { UnmappedInboxDialog } from '@/features/dashboard/unmapped-inbox-dialog';
import type { InboxStatusResponse } from '@/features/unmapped/types';

function readDismissedCount(): number | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  const raw = sessionStorage.getItem(UNMAPPED_INBOX_DISMISS_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function writeDismissedCount(count: number): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(UNMAPPED_INBOX_DISMISS_STORAGE_KEY, String(count));
}

function subscribeDismissed(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function getDismissedSnapshot(): number | null {
  return readDismissedCount();
}

function getDismissedServerSnapshot(): number | null {
  return null;
}

export function UnmappedInboxController({ status }: { status: InboxStatusResponse }) {
  const pathname = usePathname();
  const storedCount = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getDismissedServerSnapshot,
  );
  const [overrideCount, setOverrideCount] = useState<number | null>(null);
  const dismissedCount = overrideCount ?? storedCount;

  useEffect(() => {
    if (pathname !== '/unmapped') {
      return;
    }
    writeDismissedCount(status.unmappedCount);
    setOverrideCount((current) =>
      current === status.unmappedCount ? current : status.unmappedCount,
    );
  }, [pathname, status.unmappedCount]);

  const open =
    pathname !== '/unmapped' && shouldShowUnmappedInbox(status.unmappedCount, dismissedCount);

  if (!open) {
    return null;
  }

  return (
    <UnmappedInboxDialog
      count={status.unmappedCount}
      preview={status.preview}
      onDismiss={() => {
        writeDismissedCount(status.unmappedCount);
        setOverrideCount(status.unmappedCount);
      }}
    />
  );
}
