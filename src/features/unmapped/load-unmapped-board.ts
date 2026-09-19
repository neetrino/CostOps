import { loadProjectOptions } from '@/features/projects';
import { loadArchivedResources, loadUnmappedResources } from '@/features/settings';
import type { InboxResourcesResponse } from '@/features/settings/load-unmapped';
import type { ProjectOptionsResponse } from '@/features/unmapped/types';
import { cacheDashboardRead, dashboardReadCacheKey } from '@/shared/dashboard-read-cache';
import type { ResolvedDashboardQuery } from '@/shared/dashboard-query';

export type InboxTab = InboxResourcesResponse['inbox'];

export type UnmappedBoardPayload = {
  inbox: InboxResourcesResponse;
  options: ProjectOptionsResponse;
};

export async function loadUnmappedBoard(
  query: ResolvedDashboardQuery,
  tab: InboxTab,
): Promise<UnmappedBoardPayload> {
  const [inbox, options] = await Promise.all([
    tab === 'archived' ? loadArchivedResources(query) : loadUnmappedResources(query),
    loadProjectOptions(),
  ]);
  return { inbox, options };
}

export function loadUnmappedBoardCached(
  query: ResolvedDashboardQuery,
  tab: InboxTab,
): Promise<UnmappedBoardPayload> {
  return cacheDashboardRead('unmapped-board', `${tab}|${dashboardReadCacheKey(query)}`, () =>
    loadUnmappedBoard(query, tab),
  );
}
