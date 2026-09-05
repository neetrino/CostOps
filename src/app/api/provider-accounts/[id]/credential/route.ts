import { NextResponse } from 'next/server';
import { credentialPatchBodySchema, patchProviderAccountCredential } from '@/features/integrations';
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
  const parsed = credentialPatchBodySchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400);
  }
  try {
    const updated = await patchProviderAccountCredential(id, parsed.data);
    if (!updated) {
      return jsonError('NOT_FOUND', 'Provider account not found', 404);
    }
    return NextResponse.json(updated);
  } catch (error) {
    return dashboardWriteFailed('Credential patch', error);
  }
}
