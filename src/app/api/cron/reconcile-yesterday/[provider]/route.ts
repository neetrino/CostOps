import { NextResponse } from 'next/server';
import { reconcileYesterday } from '@/core/sync/reconcile-yesterday';
import { requireCronSecret } from '@/shared/auth/require-cron-secret';
import { jsonError, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';
import { parseRegisteredProviderKey } from '@/shared/registered-providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Vercel/Next segment config must be a literal (same as CRON_MAX_DURATION_SECONDS). */
export const maxDuration = 300;

type RouteContext = { params: Promise<{ provider: string }> };

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const auth = requireCronSecret(request);
  if (!auth.ok) {
    return jsonError(auth.code, auth.message, auth.status);
  }

  const { provider } = await context.params;
  const providerKey = parseRegisteredProviderKey(provider);
  if (!providerKey) {
    return jsonError('VALIDATION_ERROR', 'Unknown provider key', 400);
  }

  try {
    const results = await reconcileYesterday({ providerKey });
    return NextResponse.json({
      ok: results.every((result) => result.ok),
      providerKey,
      results,
    });
  } catch (error) {
    logger.error({ err: error, providerKey }, 'Cron provider reconcile failed');
    return jsonError('RECONCILE_FAILED', safeErrorMessage(error), 500);
  }
}
