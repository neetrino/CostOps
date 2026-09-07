import { NEON_USAGE_METRICS } from '@/providers/neon/metrics';
import { neonGetJson } from '@/providers/neon/client';
import {
  consumptionHistoryV2ResponseSchema,
  type ConsumptionHistoryV2Response,
} from '@/providers/neon/schemas';

type FetchParams = {
  apiKey: string;
  orgId: string;
  fromIso: string;
  toIso: string;
  granularity: 'daily' | 'hourly' | 'monthly';
};

/**
 * Fetches full v2 consumption history for all projects (paginated).
 */
export async function fetchConsumptionHistoryV2(
  params: FetchParams,
): Promise<ConsumptionHistoryV2Response['projects']> {
  const merged: ConsumptionHistoryV2Response['projects'] = [];
  let cursor: string | undefined;
  const seenCursors = new Set<string>();

  for (;;) {
    const searchParams = new URLSearchParams({
      org_id: params.orgId,
      from: params.fromIso,
      to: params.toIso,
      granularity: params.granularity,
      limit: '100',
    });
    for (const metric of NEON_USAGE_METRICS) {
      searchParams.append('metrics', metric);
    }
    if (cursor) {
      searchParams.set('cursor', cursor);
    }

    const raw = await neonGetJson({
      apiKey: params.apiKey,
      path: '/consumption_history/v2/projects',
      searchParams,
    });

    const parsed = consumptionHistoryV2ResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid consumption v2 response: ${parsed.error.message}`);
    }

    merged.push(...parsed.data.projects);
    const next = parsed.data.pagination?.cursor;
    if (!next || seenCursors.has(next)) {
      break;
    }
    seenCursors.add(next);
    cursor = next;
  }

  return merged;
}
