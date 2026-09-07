import { describe, expect, it } from 'vitest';
import {
  parseVercelErrorCode,
  parseVercelJsonlCharges,
  vercelFocusChargeSchema,
  vercelProjectsResponseSchema,
} from '@/providers/vercel/schemas';

const focusCharge = {
  BilledCost: 0.1021330542880589,
  BillingCurrency: 'USD',
  ChargeCategory: 'Usage',
  ChargePeriodStart: '2026-09-04T07:00:00.000Z',
  ChargePeriodEnd: '2026-09-05T07:00:00.000Z',
  ConsumedQuantity: 12.5,
  ConsumedUnit: 'GB',
  EffectiveCost: 0.11,
  ServiceName: 'Fluid Provisioned Memory',
  ServiceCategory: 'Compute',
  ServiceProviderName: 'Vercel',
  Tags: { ProjectId: 'prj_example', ProjectName: 'storefront' },
  PricingCategory: 'Standard',
  PricingCurrency: 'USD',
  PricingQuantity: 12.5,
  PricingUnit: 'GB',
};

describe('Vercel Zod fixtures', () => {
  it('accepts an observed GET /v10/projects page', () => {
    const parsed = vercelProjectsResponseSchema.parse({
      projects: [{ id: 'prj_1', name: 'web', framework: 'nextjs', extra: true }],
      pagination: { count: 1, next: null, prev: 1_788_618_031_882 },
    });
    expect(parsed.projects[0]?.id).toBe('prj_1');
    expect(parsed.pagination.next).toBeNull();
  });

  it('accepts an observed FOCUS charge line', () => {
    const parsed = vercelFocusChargeSchema.parse(focusCharge);
    expect(parsed.BilledCost).toBeCloseTo(0.102133);
    expect(parsed.Tags.ProjectId).toBe('prj_example');
  });

  it('accepts empty Tags and nullable consumption', () => {
    const parsed = vercelFocusChargeSchema.parse({
      ...focusCharge,
      ConsumedQuantity: null,
      ConsumedUnit: null,
      Tags: {},
    });
    expect(parsed.ConsumedQuantity).toBeNull();
    expect(parsed.Tags.ProjectId).toBeUndefined();
  });

  it('parses JSONL charges and rejects a malformed line', () => {
    const body = `${JSON.stringify(focusCharge)}\n${JSON.stringify({ ...focusCharge, Tags: {} })}\n`;
    expect(parseVercelJsonlCharges(body)).toHaveLength(2);
    expect(() => parseVercelJsonlCharges('{"BilledCost":"nope"}\n')).toThrow(
      /Invalid Vercel charge/,
    );
  });

  it('reads costs_not_found from a 404 envelope', () => {
    expect(
      parseVercelErrorCode('{"error":{"code":"costs_not_found","message":"Costs not found"}}'),
    ).toBe('costs_not_found');
    expect(parseVercelErrorCode('not-json')).toBeNull();
  });
});
