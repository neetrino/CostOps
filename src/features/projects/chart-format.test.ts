import { describe, expect, it } from 'vitest';
import { formatChartAxisUsd, formatChartBarLabel } from '@/features/projects/chart-format';

describe('formatChartAxisUsd', () => {
  it('abbreviates thousands and millions', () => {
    expect(formatChartAxisUsd(1_250)).toBe('$1.3K');
    expect(formatChartAxisUsd(2_400_000)).toBe('$2.4M');
  });

  it('keeps small amounts precise', () => {
    expect(formatChartAxisUsd(2.81)).toBe('$2.81');
    expect(formatChartAxisUsd(12)).toBe('$12');
  });

  it('does not invent $0 for non-finite values', () => {
    expect(formatChartAxisUsd(Number.NaN)).toBe('—');
  });
});

describe('formatChartBarLabel', () => {
  it('hides zero and invalid values', () => {
    expect(formatChartBarLabel(0)).toBe('');
    expect(formatChartBarLabel(Number.NaN)).toBe('');
  });
});
