import { NextResponse } from 'next/server';
import { loadSyncStatus } from '@/core/sync/load-status';
import { jsonError, safeErrorMessage } from '@/shared/http';
import { logger } from '@/shared/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const status = await loadSyncStatus();
    return NextResponse.json(status);
  } catch (error) {
    logger.error({ err: error }, 'Sync status failed');
    return jsonError('STATUS_FAILED', safeErrorMessage(error), 500);
  }
}
