import { NextResponse } from 'next/server';
import { reconcileYesterday } from '@/core/sync/reconcile-yesterday';
import { requireCronSecret } from '@/shared/auth/require-cron-secret';
import { jsonError, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Vercel/Next segment config must be a literal (same as CRON_MAX_DURATION_SECONDS). */
export const maxDuration = 300;

export async function GET(request: Request): Promise<NextResponse> {
  const auth = requireCronSecret(request);
  if (!auth.ok) {
    return jsonError(auth.code, auth.message, auth.status);
  }

  try {
    const results = await reconcileYesterday();
    return NextResponse.json({
      ok: results.every((result) => result.ok),
      results,
    });
  } catch (error) {
    logger.error({ err: error }, 'Cron reconcile-yesterday failed');
    return jsonError('RECONCILE_FAILED', safeErrorMessage(error), 500);
  }
}
