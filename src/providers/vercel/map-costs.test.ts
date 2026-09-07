import { describe, expect, it } from 'vitest';
import { VERCEL_UNALLOCATED_EXTERNAL_ID } from '@/config/constants';
import {
  chargeProjectExternalId,
  chargesForUtcDay,
  isVercelUsageCharge,
  placeholderVercelCosts,
  vercelChargesToCosts,
  vercelChargesToMetrics,
} from '@/providers/vercel/map-costs';
import type { VercelFocusCharge } from '@/providers/vercel/schemas';

const bucket = new Date('2026-09-04T00:00:00.000Z');

function charge(overrides: Partial<VercelFocusCharge> = {}): VercelFocusCharge {
  return {
    BilledCost: 1.25,
    BillingCurrency: 'USD',
    ChargeCategory: 'Usage',
    ChargePeriodStart: '2026-09-04T07:00:00.000Z',
    ChargePeriodEnd: '2026-09-05T07:00:00.000Z',
    ConsumedQuantity: 3,
    ConsumedUnit: 'GB',
    EffectiveCost: 1.3,
    ServiceName: 'Fast Data Transfer',
    Tags: { ProjectId: 'prj_a', ProjectName: 'alpha' },
    ...overrides,
  };
}

describe('vercel charge mapping', () => {
  it('maps FOCUS Tags.ProjectId and empty tags to unallocated', () => {
    expect(chargeProjectExternalId(charge())).toBe('prj_a');
    expect(chargeProjectExternalId(charge({ Tags: {} }))).toBe(VERCEL_UNALLOCATED_EXTERNAL_ID);
  });

  it('sums usage (EffectiveCost) per project and writes API $0 for listed projects without charges', () => {
    const costs = vercelChargesToCosts({
      charges: [
        charge({ BilledCost: 1.25, EffectiveCost: 1.3 }),
        charge({ BilledCost: 0.75, EffectiveCost: 0.8 }),
        charge({ BilledCost: 2, EffectiveCost: 2, Tags: {}, ServiceName: 'Team usage' }),
      ],
      projects: [
        { externalId: 'prj_a', displayName: 'alpha' },
        { externalId: 'prj_b', displayName: 'beta' },
        { externalId: VERCEL_UNALLOCATED_EXTERNAL_ID, displayName: 'Team (unallocated)' },
      ],
      bucketDate: bucket,
      isPartial: false,
    });
    const byId = Object.fromEntries(costs.map((row) => [row.externalId, row]));
    expect(byId.prj_a?.costUsd).toBeCloseTo(2.1);
    expect(byId.prj_a?.sourceType).toBe('API');
    expect(byId.prj_a?.sourceStatus).toBe('fresh');
    expect(byId.prj_b?.costUsd).toBe(0);
    expect(byId.prj_b?.sourceStatus).toBe('fresh');
    expect(byId[VERCEL_UNALLOCATED_EXTERNAL_ID]?.costUsd).toBe(2);
  });

  it('does not double-count subscriptions already represented by included usage credit', () => {
    expect(isVercelUsageCharge(charge({ ServiceName: 'Pro', Tags: {} }))).toBe(false);
    expect(isVercelUsageCharge(charge({ ServiceName: 'Additional Team Seats', Tags: {} }))).toBe(
      false,
    );

    const costs = vercelChargesToCosts({
      charges: [charge({ BilledCost: 0.67, EffectiveCost: 0.67, ServiceName: 'Pro', Tags: {} })],
      projects: [{ externalId: VERCEL_UNALLOCATED_EXTERNAL_ID, displayName: 'Team' }],
      bucketDate: bucket,
      isPartial: false,
    });
    expect(costs[0]?.costUsd).toBe(0);
  });

  it('keeps included-credit usage when invoice BilledCost is 0', () => {
    const costs = vercelChargesToCosts({
      charges: [charge({ BilledCost: 0, EffectiveCost: 8.3 })],
      projects: [{ externalId: 'prj_a', displayName: 'alpha' }],
      bucketDate: bucket,
      isPartial: false,
    });
    expect(costs[0]?.costUsd).toBeCloseTo(8.3);
    expect(costs[0]?.metadata).toMatchObject({ billedUsd: 0, effectiveUsd: 8.3 });
  });

  it('keeps 404/403 placeholders as missing/error and never treats them as billed $0', () => {
    const rows = placeholderVercelCosts({
      projects: [{ externalId: 'prj_a', displayName: 'alpha' }],
      bucketDate: bucket,
      sourceStatus: 'missing',
      metadata: { billingHttpStatus: 404, billingErrorCode: 'costs_not_found' },
    });
    expect(rows[0]?.sourceStatus).toBe('missing');
    expect(rows[0]?.costUsd).toBe(0);
    expect(rows[0]?.metadata?.billingErrorCode).toBe('costs_not_found');
  });

  it('aggregates consumed quantity metrics by project and service', () => {
    const metrics = vercelChargesToMetrics({
      charges: [
        charge({ ConsumedQuantity: 3, ServiceName: 'Fast Data Transfer' }),
        charge({ ConsumedQuantity: 2, ServiceName: 'Fast Data Transfer' }),
        charge({ ConsumedQuantity: null, ServiceName: 'Pro', Tags: {} }),
      ],
      bucketDate: bucket,
    });
    expect(metrics).toHaveLength(1);
    expect(metrics[0]?.metricKey).toBe('fast_data_transfer');
    expect(metrics[0]?.valueNumeric).toBe(5);
    expect(metrics[0]?.unit).toBe('GB');
  });

  it('drops charges whose period is a different UTC date', () => {
    const kept = chargesForUtcDay(
      [charge(), charge({ ChargePeriodStart: '2026-09-03T07:00:00.000Z', BilledCost: 9 })],
      bucket,
    );
    expect(kept).toHaveLength(1);
    expect(kept[0]?.BilledCost).toBe(1.25);
  });
});
