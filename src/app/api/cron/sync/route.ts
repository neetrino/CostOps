import { NextResponse } from 'next/server';
import { runStoredSpendAlertPass } from '@/core/sync/run-stored-alert-pass';
import { requireCronSecret } from '@/shared/auth/require-cron-secret';
import { jsonError, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Alert-only pass. Provider pulls live on /api/cron/sync/[provider].
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = requireCronSecret(request);
  if (!auth.ok) {
    return jsonError(auth.code, auth.message, auth.status);
  }

  try {
    await runStoredSpendAlertPass();
    return NextResponse.json({ ok: true, mode: 'alerts' });
  } catch (error) {
    logger.error({ err: error }, 'Cron stored-alert pass failed');
    return jsonError('ALERTS_FAILED', safeErrorMessage(error), 500);
  }
}
