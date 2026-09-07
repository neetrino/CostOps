import { describe, expect, it } from 'vitest';
import { currentBillingCycleFromInvoices } from '@/providers/vercel/fetch-billing-cycle';

describe('currentBillingCycleFromInvoices', () => {
  it('reads the active Pro period from the invoice payload', () => {
    const cycle = currentBillingCycleFromInvoices(
      {
        data: [
          {
            createdAt: '2026-09-03T19:48:10.000Z',
            lineItems: [
              {
                description: 'Pro',
                periodStart: '2026-09-03T07:00:00+00:00',
                periodEnd: '2026-10-03T07:00:00+00:00',
              },
            ],
          },
        ],
      },
      new Date('2026-09-07T12:00:00.000Z'),
    );

    expect(cycle).toEqual({ start: '2026-09-03', end: '2026-10-03' });
  });

  it('returns null when no active Pro period exists', () => {
    expect(
      currentBillingCycleFromInvoices(
        {
          data: [
            {
              createdAt: '2026-08-03T19:48:10.000Z',
              lineItems: [
                {
                  description: 'Pro',
                  periodStart: '2026-08-03T07:00:00+00:00',
                  periodEnd: '2026-09-03T07:00:00+00:00',
                },
              ],
            },
          ],
        },
        new Date('2026-09-07T12:00:00.000Z'),
      ),
    ).toBeNull();
  });
});
