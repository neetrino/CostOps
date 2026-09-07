'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UNMAPPED_INBOX_DISMISS_STORAGE_KEY } from '@/config/constants';
import { shouldShowUnmappedInbox } from '@/core/mapping/inbox-dismiss';
import { fetchJson, UnauthorizedError } from '@/features/dashboard/api-client';
import { UnmappedInboxDialog } from '@/features/dashboard/unmapped-inbox-dialog';
import type { InboxStatusResponse } from '@/features/unmapped/types';

function readDismissedCount(): number | null {
  const raw = sessionStorage.getItem(UNMAPPED_INBOX_DISMISS_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function writeDismissedCount(count: number): void {
  sessionStorage.setItem(UNMAPPED_INBOX_DISMISS_STORAGE_KEY, String(count));
}

export function UnmappedInboxController() {
  const pathname = usePathname();
  const [status, setStatus] = useState<InboxStatusResponse | null>(null);
  const [dismissedCount, setDismissedCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchJson<InboxStatusResponse>('/api/resources/inbox-status')
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setDismissedCount(readDismissedCount());
        setStatus(payload);
      })
      .catch((error: unknown) => {
        if (!(error instanceof UnauthorizedError) && !cancelled) {
          setStatus(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (pathname === '/unmapped' && status && dismissedCount !== status.unmappedCount) {
    writeDismissedCount(status.unmappedCount);
    setDismissedCount(status.unmappedCount);
  }

  const open =
    pathname !== '/unmapped' &&
    status !== null &&
    shouldShowUnmappedInbox(status.unmappedCount, dismissedCount);

  if (!open || !status) {
    return null;
  }

  return (
    <UnmappedInboxDialog
      count={status.unmappedCount}
      preview={status.preview}
      onDismiss={() => {
        writeDismissedCount(status.unmappedCount);
        setDismissedCount(status.unmappedCount);
      }}
    />
  );
}
