import { NextResponse } from 'next/server';
import { loadIntegrationsCached } from '@/features/dashboard/cached-shell-reads';
import { dashboardReadFailed } from '@/shared/dashboard-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await loadIntegrationsCached());
  } catch (error) {
    return dashboardReadFailed('Integrations read', error);
  }
}
