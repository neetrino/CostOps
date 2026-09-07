import { vercelBillingWindowUtc } from '@/providers/vercel/billing-window';
import { vercelGet } from '@/providers/vercel/client';
import {
  parseVercelErrorCode,
  parseVercelJsonlCharges,
  type VercelFocusCharge,
} from '@/providers/vercel/schemas';

export type VercelChargesResult =
  | { kind: 'ok'; charges: VercelFocusCharge[] }
  | { kind: 'missing'; status: number; errorCode: string | null }
  | { kind: 'forbidden'; status: number; errorCode: string | null };

type FetchChargesParams = {
  token: string;
  teamId: string;
  utcDay: Date;
};

/**
 * FOCUS JSONL for one Vercel Pacific billing day. 403/404 are not thrown
 * (token may still list projects). 401 still throws from the client.
 */
export async function fetchVercelCharges(params: FetchChargesParams): Promise<VercelChargesResult> {
  const window = vercelBillingWindowUtc(params.utcDay);
  const searchParams = new URLSearchParams({
    teamId: params.teamId,
    from: window.from.toISOString(),
    to: window.to.toISOString(),
  });
  const raw = await vercelGet({
    token: params.token,
    path: '/v1/billing/charges',
    searchParams,
    allowStatuses: [403, 404],
  });
  return interpretChargesResponse(raw.status, raw.body);
}

export function interpretChargesResponse(status: number, body: string): VercelChargesResult {
  if (status === 200) {
    return { kind: 'ok', charges: parseVercelJsonlCharges(body) };
  }
  const errorCode = parseVercelErrorCode(body);
  if (status === 403) {
    return { kind: 'forbidden', status, errorCode };
  }
  return { kind: 'missing', status, errorCode };
}
