import { ensureNeonAccountFromEnv } from '@/core/sync/ensure-neon-account';
import { ensureVercelAccountFromEnv } from '@/core/sync/ensure-vercel-account';

/** Upserts registered provider rows + env-backed accounts before cron/sync. */
export async function ensureRegisteredAccountsFromEnv(): Promise<void> {
  await ensureNeonAccountFromEnv();
  await ensureVercelAccountFromEnv();
}
