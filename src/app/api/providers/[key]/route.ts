import { NextResponse } from 'next/server';
import { loadProviderDetail } from '@/features/providers';
import { parseProviderKeyParam } from '@/shared/dashboard-query';
import { dashboardReadFailed, parseDashboardRequest } from '@/shared/dashboard-route';
import { jsonError } from '@/shared/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ key: string }> };

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const { key } = await context.params;
  const providerKey = parseProviderKeyParam(key);
  if (!providerKey) {
    return jsonError('VALIDATION_ERROR', 'Unknown provider key', 400);
  }
  const parsed = parseDashboardRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }
  try {
    const detail = await loadProviderDetail(providerKey, parsed.query);
    if (!detail) {
      return jsonError('NOT_FOUND', 'Provider not found', 404);
    }
    return NextResponse.json(detail);
  } catch (error) {
    return dashboardReadFailed('Provider detail read', error);
  }
}
