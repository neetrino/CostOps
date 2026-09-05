'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  buildDashboardQueryString,
  mergeDashboardUrlState,
  readDashboardUrlState,
  type DashboardUrlState,
} from '@/features/dashboard/dashboard-url';

export function useDashboardUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state = useMemo(() => readDashboardUrlState(searchParams), [searchParams]);
  const queryString = useMemo(() => buildDashboardQueryString(state), [state]);

  const replaceState = useCallback(
    (patch: Partial<DashboardUrlState>) => {
      const next = mergeDashboardUrlState(state, patch);
      const href = `${pathname}${buildDashboardQueryString(next)}`;
      router.replace(href, { scroll: false });
    },
    [pathname, router, state],
  );

  return { state, queryString, replaceState };
}
