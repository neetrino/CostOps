import { NextResponse } from 'next/server';
import { runForcedAccountSyncs } from '@/core/sync/run-due-syncs';
import { clientIpFromHeaders } from '@/shared/auth/login-rate-limit';
import { consumeSyncNowAttempt } from '@/shared/auth/sync-now-rate-limit';
import { jsonError, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Vercel/Next segment config must be a literal (same as CRON_MAX_DURATION_SECONDS). */
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const ip = clientIpFromHeaders(request.headers);
  if (!consumeSyncNowAttempt(ip)) {
    return jsonError('RATE_LIMITED', 'Too many sync-now requests', 429);
  }

  try {
    const results = await runForcedAccountSyncs();
    return NextResponse.json({
      ok: results.every((result) => result.ok),
      results,
    });
  } catch (error) {
    logger.error({ err: error }, 'Manual sync-now failed');
    return jsonError('SYNC_FAILED', safeErrorMessage(error), 500);
  }
}
