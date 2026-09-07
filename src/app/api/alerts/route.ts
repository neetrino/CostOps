import { NextResponse } from 'next/server';
import { loadAlerts } from '@/features/alerts';
import { dashboardReadFailed, parseDashboardRequest } from '@/shared/dashboard-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const parsed = parseDashboardRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }
  try {
    return NextResponse.json(await loadAlerts(parsed.query));
  } catch (error) {
    return dashboardReadFailed('Alerts read', error);
  }
}
