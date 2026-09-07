import { NextResponse } from 'next/server';
import { createVpsLine, createVpsLineBodySchema } from '@/core/vps';
import { dashboardWriteFailed } from '@/shared/dashboard-route';
import { jsonError, readJsonBody } from '@/shared/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;
  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }
  const parsed = createVpsLineBodySchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400);
  }
  try {
    const result = await createVpsLine(slug, parsed.data);
    if (!result.ok) {
      return jsonError('NOT_FOUND', result.message, 404);
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    return dashboardWriteFailed('VPS line create', error);
  }
}
