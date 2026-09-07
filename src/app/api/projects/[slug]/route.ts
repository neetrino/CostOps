import { NextResponse } from 'next/server';
import { loadProjectDetail, patchProjectBySlug, projectPatchBodySchema } from '@/features/projects';
import {
  dashboardReadFailed,
  dashboardWriteFailed,
  parseDashboardRequest,
} from '@/shared/dashboard-route';
import { jsonError, readJsonBody } from '@/shared/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const parsed = parseDashboardRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }
  const { slug } = await context.params;
  try {
    const detail = await loadProjectDetail(slug, parsed.query);
    if (!detail) {
      return jsonError('NOT_FOUND', 'Project not found', 404);
    }
    return NextResponse.json(detail);
  } catch (error) {
    return dashboardReadFailed('Project detail read', error);
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;
  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }
  const parsed = projectPatchBodySchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400);
  }
  try {
    const updated = await patchProjectBySlug(slug, parsed.data);
    if (!updated) {
      return jsonError('NOT_FOUND', 'Project not found', 404);
    }
    return NextResponse.json(updated);
  } catch (error) {
    return dashboardWriteFailed('Project patch', error);
  }
}
