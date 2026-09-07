import { NextResponse } from 'next/server';
import { loadProjectOptions } from '@/features/projects/load-project-options';
import { dashboardReadFailed } from '@/shared/dashboard-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const params = new URL(request.url).searchParams;
    return NextResponse.json(
      await loadProjectOptions({
        includeEmpty: params.get('includeEmpty') === '1',
        liveBoard: params.get('liveBoard') === '1',
      }),
    );
  } catch (error) {
    return dashboardReadFailed('Project options read', error);
  }
}
