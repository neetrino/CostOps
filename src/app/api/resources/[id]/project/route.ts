import { NextResponse } from 'next/server';
import { createProjectForResource } from '@/core/mapping';
import { dashboardWriteFailed } from '@/shared/dashboard-route';
import { jsonError } from '@/shared/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    const result = await createProjectForResource(id);
    if (!result.ok) {
      const status = result.code === 'NOT_FOUND' ? 404 : 409;
      return jsonError(result.code, result.message, status);
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    return dashboardWriteFailed('Standalone project create', error);
  }
}
