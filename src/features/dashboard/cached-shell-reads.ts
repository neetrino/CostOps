import { loadInboxStatus } from '@/features/settings';
import { loadIntegrations } from '@/features/integrations';
import { loadSyncStatus } from '@/core/sync/load-status';
import { cacheDashboardRead } from '@/shared/dashboard-read-cache';
import { utcDayKey } from '@/shared/dates';

export function loadInboxStatusCached() {
  return cacheDashboardRead('inbox-status', 'default', () => loadInboxStatus());
}

export function loadSyncStatusCached(now: Date = new Date()) {
  return cacheDashboardRead('sync-status', utcDayKey(now), () => loadSyncStatus(now));
}

export function loadIntegrationsCached() {
  return cacheDashboardRead('integrations', 'default', () => loadIntegrations());
}
