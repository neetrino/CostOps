import { NextResponse } from 'next/server';
import { loadProjects } from '@/features/projects';
import { dashboardReadFailed, parseDashboardRequest } from '@/shared/dashboard-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const parsed = parseDashboardRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }
  try {
    return NextResponse.json(await loadProjects(parsed.query));
  } catch (error) {
    return dashboardReadFailed('Projects read', error);
  }
}
