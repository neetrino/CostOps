import { NextResponse } from 'next/server';
import { loadIntegrations } from '@/features/integrations';
import { dashboardReadFailed } from '@/shared/dashboard-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await loadIntegrations());
  } catch (error) {
    return dashboardReadFailed('Integrations read', error);
  }
}
