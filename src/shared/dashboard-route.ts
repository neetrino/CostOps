import { NextResponse } from 'next/server';
import { resolveDashboardQuery, type ResolvedDashboardQuery } from '@/shared/dashboard-query';
import { revalidateDashboardReads } from '@/shared/dashboard-read-cache';
import { jsonError, parseRequestQuery, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';

export function parseDashboardRequest(
  request: Request,
  now?: Date,
): { ok: true; query: ResolvedDashboardQuery } | { ok: false; response: NextResponse } {
  const parsed = resolveDashboardQuery(parseRequestQuery(request), now);
  if (!parsed.ok) {
    return { ok: false, response: jsonError('VALIDATION_ERROR', parsed.message, 400) };
  }
  return { ok: true, query: parsed.data };
}

export function dashboardReadFailed(action: string, error: unknown): NextResponse {
  logger.error({ err: error }, `${action} failed`);
  return jsonError('READ_FAILED', safeErrorMessage(error), 500);
}

export function dashboardWriteFailed(action: string, error: unknown): NextResponse {
  logger.error({ err: error }, `${action} failed`);
  return jsonError('WRITE_FAILED', safeErrorMessage(error), 500);
}

/** Bust cached board reads after a successful dashboard mutation. */
export function afterDashboardWrite(): void {
  revalidateDashboardReads();
}

export function dashboardWriteJson<T>(data: T, status = 200): NextResponse {
  afterDashboardWrite();
  return NextResponse.json(data, { status });
}
