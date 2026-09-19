import { NextResponse } from 'next/server';
import { loadUsageSeries } from '@/features/usage';
import { dashboardReadFailed, parseDashboardRequest } from '@/shared/dashboard-route';
import { cacheDashboardRead, dashboardReadCacheKey } from '@/shared/dashboard-read-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const parsed = parseDashboardRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }
  try {
    return NextResponse.json(
      await cacheDashboardRead('usage-series', dashboardReadCacheKey(parsed.query), () =>
        loadUsageSeries(parsed.query),
      ),
    );
  } catch (error) {
    return dashboardReadFailed('Usage series read', error);
  }
}
