import { NextResponse } from 'next/server';
import { requireCronSecret } from '@/shared/auth/require-cron-secret';
import { jsonError } from '@/shared/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reconcile is per provider: /api/cron/reconcile-yesterday/[provider].
 */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = requireCronSecret(request);
  if (!auth.ok) {
    return jsonError(auth.code, auth.message, auth.status);
  }
  return jsonError(
    'VALIDATION_ERROR',
    'Use /api/cron/reconcile-yesterday/neon|upstash|vercel',
    400,
  );
}
