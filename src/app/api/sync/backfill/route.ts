import { NextResponse } from 'next/server';
import { backfillBodySchema, parseBackfillRange, runProviderBackfill } from '@/core/sync';
import { clientIpFromHeaders } from '@/shared/auth/login-rate-limit';
import { consumeSyncNowAttempt } from '@/shared/auth/sync-now-rate-limit';
import { jsonError, readJsonBody, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Must be a literal. Matches BACKFILL_MAX_DURATION_SECONDS. */
export const maxDuration = 120;

export async function POST(request: Request): Promise<NextResponse> {
  const ip = clientIpFromHeaders(request.headers);
  if (!consumeSyncNowAttempt(ip)) {
    return jsonError('RATE_LIMITED', 'Too many sync requests', 429);
  }
  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }
  const parsed = backfillBodySchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400);
  }
  try {
    const range = parseBackfillRange(parsed.data.from, parsed.data.to);
    const result = await runProviderBackfill({
      providerKey: parsed.data.providerKey,
      from: range.from,
      to: range.to,
    });
    if (!result.ok) {
      const status = result.code === 'NOT_FOUND' ? 404 : 400;
      return jsonError(result.code, result.message, status);
    }
    return NextResponse.json({
      ok: result.results.every((row) => row.ok),
      results: result.results,
    });
  } catch (error) {
    logger.error({ err: error }, 'Manual backfill failed');
    return jsonError('SYNC_FAILED', safeErrorMessage(error), 500);
  }
}
