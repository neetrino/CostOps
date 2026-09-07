import { describe, expect, it } from 'vitest';
import { interpretChargesResponse } from '@/providers/vercel/fetch-charges';

const line = JSON.stringify({
  BilledCost: 0.5,
  BillingCurrency: 'USD',
  ChargeCategory: 'Usage',
  ChargePeriodStart: '2026-09-04T07:00:00.000Z',
  ChargePeriodEnd: '2026-09-05T07:00:00.000Z',
  ConsumedQuantity: 1,
  ConsumedUnit: 'units',
  EffectiveCost: 0.5,
  ServiceName: 'Edge Requests',
  Tags: { ProjectId: 'prj_a', ProjectName: 'alpha' },
});

describe('interpretChargesResponse', () => {
  it('parses FOCUS JSONL on 200', () => {
    const result = interpretChargesResponse(200, `${line}\n`);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.charges).toHaveLength(1);
      expect(result.charges[0]?.BilledCost).toBe(0.5);
    }
  });

  it('treats 404 costs_not_found as missing, not a thrown auth failure', () => {
    const result = interpretChargesResponse(
      404,
      '{"error":{"code":"costs_not_found","message":"Costs not found"}}',
    );
    expect(result).toEqual({
      kind: 'missing',
      status: 404,
      errorCode: 'costs_not_found',
    });
  });

  it('treats billing 403 as forbidden so project discovery can still succeed', () => {
    const result = interpretChargesResponse(403, '{"error":{"code":"forbidden"}}');
    expect(result.kind).toBe('forbidden');
    if (result.kind === 'forbidden') {
      expect(result.status).toBe(403);
    }
  });
});
