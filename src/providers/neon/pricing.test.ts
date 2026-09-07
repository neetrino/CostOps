import { describe, expect, it } from 'vitest';
import {
  applyPublicTransferAllowance,
  BILLING_HOURS_PER_MONTH,
  BYTES_PER_DECIMAL_GB,
  estimateProjectCost,
  INCLUDED_PUBLIC_TRANSFER_GB,
  normalizeTotals,
  periodHoursFromCalendarDays,
  PRICING_RATES,
  type EstimatedProjectCost,
  type RawTotals,
} from '@/providers/neon/pricing';

function emptyRaw(overrides: Partial<RawTotals> = {}): RawTotals {
  return {
    compute_unit_seconds: 0n,
    root_branch_bytes_month: 0n,
    child_branch_bytes_month: 0n,
    instant_restore_bytes_month: 0n,
    public_network_transfer_bytes: 0n,
    private_network_transfer_bytes: 0n,
    extra_branches_month: 0n,
    ...overrides,
  };
}

function estimate(raw: RawTotals, plan: 'launch' | 'scale' = 'launch'): EstimatedProjectCost {
  const hours = periodHoursFromCalendarDays(1);
  return estimateProjectCost(raw, normalizeTotals(raw, hours), PRICING_RATES[plan], hours);
}

describe('Neon estimate vs old formula', () => {
  it('matches 1 CU-hour + 1 GB-month root storage on launch', () => {
    const raw = emptyRaw({
      compute_unit_seconds: 3600n,
      root_branch_bytes_month: BigInt(BILLING_HOURS_PER_MONTH * BYTES_PER_DECIMAL_GB),
    });
    const cost = estimate(raw, 'launch');
    expect(cost.computeUsd).toBeCloseTo(0.106);
    expect(cost.storageUsd).toBeCloseTo(0.35);
    expect(cost.totalUsd).toBeCloseTo(0.456);
  });

  it('applies the org-wide 100 GB public transfer allowance like neon', () => {
    const hours = periodHoursFromCalendarDays(1);
    const rates = PRICING_RATES.launch;
    const projectA = {
      estimatedCost: estimate(
        emptyRaw({ public_network_transfer_bytes: BigInt(80 * BYTES_PER_DECIMAL_GB) }),
      ),
    };
    const projectB = {
      estimatedCost: estimate(
        emptyRaw({ public_network_transfer_bytes: BigInt(70 * BYTES_PER_DECIMAL_GB) }),
      ),
    };
    applyPublicTransferAllowance([projectA, projectB], rates);
    const totalPublic = 150;
    const billable = Math.max(0, totalPublic - INCLUDED_PUBLIC_TRANSFER_GB);
    const ratio = billable / totalPublic;
    expect(projectA.estimatedCost.publicTransferBillableGb).toBeCloseTo(80 * ratio);
    expect(projectB.estimatedCost.publicTransferBillableGb).toBeCloseTo(70 * ratio);
    expect(projectA.estimatedCost.publicTransferUsd).toBeCloseTo(80 * ratio * 0.1);
    expect(hours).toBe(24);
  });

  it('uses scale compute and private transfer rates', () => {
    const cost = estimate(
      emptyRaw({
        compute_unit_seconds: 3600n,
        private_network_transfer_bytes: BigInt(BYTES_PER_DECIMAL_GB),
      }),
      'scale',
    );
    expect(cost.computeUsd).toBeCloseTo(0.222);
    expect(cost.privateTransferUsd).toBeCloseTo(0.01);
  });
});
