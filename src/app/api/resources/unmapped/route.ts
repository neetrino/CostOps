import { NextResponse } from 'next/server';
import { loadUnmappedResources } from '@/features/settings';
import { dashboardReadFailed, parseDashboardRequest } from '@/shared/dashboard-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const parsed = parseDashboardRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }
  try {
    return NextResponse.json(await loadUnmappedResources(parsed.query));
  } catch (error) {
    return dashboardReadFailed('Unmapped resources read', error);
  }
}
