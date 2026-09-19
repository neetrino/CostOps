import { NextResponse } from 'next/server';
import { revalidateDashboardReads } from '@/shared/dashboard-read-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  revalidateDashboardReads();
  return NextResponse.json({ ok: true });
}
