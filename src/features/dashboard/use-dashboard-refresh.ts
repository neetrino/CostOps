'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';

export function useDashboardRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const bustAndRefresh = useCallback(() => {
    startTransition(async () => {
      try {
        await fetchJson('/api/dashboard/revalidate', { method: 'POST' });
      } catch {
        // Still refresh; the next server render may be cached.
      }
      router.refresh();
    });
  }, [router]);

  return { isPending, startTransition, refresh, bustAndRefresh };
}
