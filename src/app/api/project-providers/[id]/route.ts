import { NextResponse } from 'next/server';
import { removeEmptyVpsAttachment } from '@/core/vps';
import { dashboardWriteFailed } from '@/shared/dashboard-route';
import { jsonError } from '@/shared/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    const result = await removeEmptyVpsAttachment(id);
    if (!result.ok) {
      const status = result.code === 'NOT_FOUND' ? 404 : 409;
      return jsonError(result.code, result.message, status);
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return dashboardWriteFailed('VPS leftover remove', error);
  }
}
