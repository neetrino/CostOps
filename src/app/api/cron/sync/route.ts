import { NextResponse } from 'next/server';
import { CRON_MAX_DURATION_SECONDS } from '@/config/constants';
import { runDueAccountSyncs } from '@/core/sync/run-due-syncs';
import { requireCronSecret } from '@/shared/auth/require-cron-secret';
import { jsonError, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = CRON_MAX_DURATION_SECONDS;

export async function GET(request: Request): Promise<NextResponse> {
  const auth = requireCronSecret(request);
  if (!auth.ok) {
    return jsonError(auth.code, auth.message, auth.status);
  }

  try {
    const results = await runDueAccountSyncs();
    return NextResponse.json({
      ok: results.every((result) => result.ok),
      results,
    });
  } catch (error) {
    logger.error({ err: error }, 'Cron due-sync failed');
    return jsonError('SYNC_FAILED', safeErrorMessage(error), 500);
  }
}
