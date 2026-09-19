import { NextResponse } from 'next/server';
import { loadProjects } from '@/features/projects';
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
      await cacheDashboardRead('projects', dashboardReadCacheKey(parsed.query), () =>
        loadProjects(parsed.query),
      ),
    );
  } catch (error) {
    return dashboardReadFailed('Projects read', error);
  }
}
