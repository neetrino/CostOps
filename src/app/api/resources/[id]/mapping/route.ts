import { NextResponse } from 'next/server';
import { assignResourceToProject, resourceMappingBodySchema } from '@/core/mapping';
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
  const parsed = resourceMappingBodySchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400);
  }
  try {
    const result = await assignResourceToProject({
      resourceId: id,
      projectId: parsed.data.projectId,
    });
    if (!result.ok) {
      const status = result.code === 'NOT_FOUND' ? 404 : 409;
      return jsonError(result.code, result.message, status);
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return dashboardWriteFailed('Resource mapping patch', error);
  }
}
