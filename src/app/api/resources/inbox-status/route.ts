import { NextResponse } from 'next/server';
import { loadInboxStatus } from '@/features/settings';
import { dashboardReadFailed } from '@/shared/dashboard-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await loadInboxStatus());
  } catch (error) {
    return dashboardReadFailed('Inbox status read', error);
  }
}
