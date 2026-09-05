import { describe, expect, it } from 'vitest';
import { escalationStepUsd } from '@/core/budgets/escalation';

describe('escalationStepUsd', () => {
  it('uses percent of the daily limit (Neon parity)', () => {
    expect(escalationStepUsd(2, 30)).toBeCloseTo(0.6);
    expect(escalationStepUsd(1, 30)).toBeCloseTo(0.3);
  });
});
