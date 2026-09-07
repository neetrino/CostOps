import { NextResponse } from 'next/server';
import { runForcedAccountSyncs } from '@/core/sync/run-due-syncs';
import { clientIpFromHeaders } from '@/shared/auth/login-rate-limit';
import { consumeSyncNowAttempt } from '@/shared/auth/sync-now-rate-limit';
import { jsonError, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';
import { parseRegisteredProviderKey } from '@/shared/registered-providers';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Vercel/Next segment config must be a literal (same as CRON_MAX_DURATION_SECONDS). */
export const maxDuration = 300;

const syncNowBodySchema = z.object({
  providerKey: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = syncNowBodySchema.safeParse(body);
  const providerKey = parsed.success ? parseRegisteredProviderKey(parsed.data.providerKey) : null;
  if (!providerKey) {
    return jsonError(
      'VALIDATION_ERROR',
      'providerKey must be NEON, UPSTASH, VERCEL, or HETZNER',
      400,
    );
  }

  const ip = clientIpFromHeaders(request.headers);
  if (!consumeSyncNowAttempt(ip)) {
    return jsonError('RATE_LIMITED', 'Too many sync-now requests', 429);
  }

  try {
    const results = await runForcedAccountSyncs({ providerKey });
    return NextResponse.json({
      ok: results.every((result) => result.ok),
      providerKey,
      results,
    });
  } catch (error) {
    logger.error({ err: error, providerKey }, 'Manual sync-now failed');
    return jsonError('SYNC_FAILED', safeErrorMessage(error), 500);
  }
}
