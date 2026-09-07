import { NextResponse } from 'next/server';
import {
  budgetPatchBodySchema,
  createPrismaProjectTotalBudgetStore,
  patchProjectTotalBudget,
} from '@/core/budgets';
import { dashboardWriteFailed } from '@/shared/dashboard-route';
import { jsonError, readJsonBody } from '@/shared/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;
  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }
  const parsed = budgetPatchBodySchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body', 400);
  }
  try {
    const result = await patchProjectTotalBudget(
      createPrismaProjectTotalBudgetStore(),
      slug,
      parsed.data,
    );
    if (!result.ok) {
      return jsonError('NOT_FOUND', 'Project not found', 404);
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return dashboardWriteFailed('Project total budget patch', error);
  }
}
