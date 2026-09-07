import { VERCEL_PROJECT_PAGE_LIMIT, VERCEL_PROJECT_PAGE_SIZE } from '@/config/constants';
import { vercelGet } from '@/providers/vercel/client';
import {
  vercelProjectsResponseSchema,
  type VercelProjectListItem,
} from '@/providers/vercel/schemas';

type ListProjectsParams = {
  token: string;
  teamId: string;
};

/**
 * Lists team projects (GET /v10/projects) with cursor pagination.
 */
export async function listAllVercelProjects(
  params: ListProjectsParams,
): Promise<VercelProjectListItem[]> {
  const out: VercelProjectListItem[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;

  for (let page = 0; page < VERCEL_PROJECT_PAGE_LIMIT; page += 1) {
    const searchParams = new URLSearchParams({
      teamId: params.teamId,
      limit: String(VERCEL_PROJECT_PAGE_SIZE),
    });
    if (cursor) {
      searchParams.set('from', cursor);
    }
    const raw = await vercelGet({
      token: params.token,
      path: '/v10/projects',
      searchParams,
    });
    const parsed = vercelProjectsResponseSchema.safeParse(parseJsonBody(raw.body));
    if (!parsed.success) {
      throw new Error(`Invalid Vercel projects response: ${parsed.error.message}`);
    }
    out.push(...parsed.data.projects);
    const next = parsed.data.pagination.next;
    if (next === null || next === undefined || parsed.data.projects.length === 0) {
      break;
    }
    const nextKey = String(next);
    if (seen.has(nextKey)) {
      break;
    }
    seen.add(nextKey);
    cursor = nextKey;
  }

  return out;
}

function parseJsonBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Invalid Vercel projects JSON');
  }
}
