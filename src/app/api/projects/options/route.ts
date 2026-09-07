import { NextResponse } from 'next/server';
import { loadProjectOptions } from '@/features/projects/load-project-options';
import { dashboardReadFailed } from '@/shared/dashboard-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await loadProjectOptions());
  } catch (error) {
    return dashboardReadFailed('Project options read', error);
  }
}
