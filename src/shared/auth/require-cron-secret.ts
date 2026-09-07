import { getEnv } from '@/shared/env';

export type CronAuthResult =
  { ok: true } | { ok: false; status: 401 | 500; code: string; message: string };

/**
 * Vercel Cron / operator jobs: `Authorization: Bearer <CRON_SECRET>`.
 */
export function requireCronSecret(request: Request): CronAuthResult {
  const env = getEnv();
  if (!env.CRON_SECRET) {
    return { ok: false, status: 500, code: 'CRON_NOT_CONFIGURED', message: 'Cron not configured' };
  }
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' };
  }
  return { ok: true };
}
