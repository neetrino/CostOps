import { NextResponse } from 'next/server';
import { patchVpsLine, patchVpsLineBodySchema } from '@/core/vps';
import { dashboardWriteFailed } from '@/shared/dashboard-route';
import { jsonError, readJsonBody } from '@/shared/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;
  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }
  const parsed = patchVpsLineBodySchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400);
  }
  try {
    const result = await patchVpsLine(id, parsed.data);
    if (!result.ok) {
      return jsonError('NOT_FOUND', result.message, 404);
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return dashboardWriteFailed('VPS line patch', error);
  }
}
