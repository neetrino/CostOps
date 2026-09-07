import { vercelGet } from '@/providers/vercel/client';
import { vercelInvoicesResponseSchema } from '@/providers/vercel/schemas';

export type VercelBillingCycle = {
  start: string;
  end: string;
};

export async function fetchVercelBillingCycle(params: {
  token: string;
  teamId: string;
  now: Date;
}): Promise<VercelBillingCycle | null> {
  const raw = await vercelGet({
    token: params.token,
    path: '/v1/invoices',
    searchParams: new URLSearchParams({ teamId: params.teamId }),
  });
  return currentBillingCycleFromInvoices(JSON.parse(raw.body) as unknown, params.now);
}

export function currentBillingCycleFromInvoices(
  raw: unknown,
  now: Date,
): VercelBillingCycle | null {
  const parsed = vercelInvoicesResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid Vercel invoices response: ${parsed.error.message}`);
  }
  const nowMs = now.getTime();
  const candidates = parsed.data.data.flatMap((invoice) =>
    invoice.lineItems
      .filter((item) => item.description === 'Pro')
      .map((item) => ({
        start: item.periodStart,
        end: item.periodEnd,
        startMs: Date.parse(item.periodStart),
        endMs: Date.parse(item.periodEnd),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.startMs) &&
          Number.isFinite(item.endMs) &&
          item.startMs <= nowMs &&
          nowMs < item.endMs,
      ),
  );
  candidates.sort((left, right) => right.startMs - left.startMs);
  const current = candidates[0];
  return current ? { start: current.start.slice(0, 10), end: current.end.slice(0, 10) } : null;
}
