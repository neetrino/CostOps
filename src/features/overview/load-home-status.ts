import { loadSyncStatus, type SyncStatusView } from '@/core/sync/load-status';

export type HomeStatus =
  { available: true; status: SyncStatusView } | { available: false; message: string };

export async function loadHomeStatus(): Promise<HomeStatus> {
  try {
    const status = await loadSyncStatus();
    return { available: true, status };
  } catch {
    return { available: false, message: 'Sync status unavailable' };
  }
}
