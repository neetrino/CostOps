import { NextResponse } from 'next/server';
import { loadSyncStatusCached } from '@/features/dashboard/cached-shell-reads';
import { jsonError, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await loadSyncStatusCached());
  } catch (error) {
    logger.error({ err: error }, 'Sync status failed');
    return jsonError('STATUS_FAILED', safeErrorMessage(error), 500);
  }
}
