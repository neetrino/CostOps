import { neonGetJson } from '@/providers/neon/client';
import { listProjectsResponseSchema, type ListProjectsResponse } from '@/providers/neon/schemas';

type ListProjectsParams = {
  apiKey: string;
  orgId: string;
  limit?: number;
};

/**
 * Lists all projects for an org (cursor pagination until exhausted).
 */
export async function listAllNeonProjects(
  params: ListProjectsParams,
): Promise<ListProjectsResponse['projects']> {
  const limit = params.limit ?? 400;
  const out: ListProjectsResponse['projects'] = [];
  let cursor: string | undefined;
  const seenCursors = new Set<string>();

  for (;;) {
    const searchParams = new URLSearchParams({
      org_id: params.orgId,
      limit: String(limit),
    });
    if (cursor) {
      searchParams.set('cursor', cursor);
    }

    const raw = await neonGetJson({
      apiKey: params.apiKey,
      path: '/projects',
      searchParams,
    });

    const parsed = listProjectsResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid list projects response: ${parsed.error.message}`);
    }

    out.push(...parsed.data.projects);
    const next = parsed.data.pagination?.cursor;
    if (!next || parsed.data.projects.length === 0 || seenCursors.has(next)) {
      break;
    }
    seenCursors.add(next);
    cursor = next;
  }

  return out;
}
