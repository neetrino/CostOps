import { describe, expect, it } from 'vitest';
import { flattenSearchParams, resolveSearchParamsQuery } from '@/shared/dashboard-query';

describe('flattenSearchParams', () => {
  it('keeps the first string value and drops empties', () => {
    expect(
      flattenSearchParams({
        preset: '7',
        from: ['', '2026-09-01'],
        empty: '',
        missing: undefined,
      }),
    ).toEqual({ preset: '7' });
  });
});

describe('resolveSearchParamsQuery', () => {
  it('resolves a page searchParams object', () => {
    const parsed = resolveSearchParamsQuery(
      { preset: '1' },
      new Date('2026-09-19T12:00:00.000Z'),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.fromKey).toBe('2026-09-19');
      expect(parsed.data.toKey).toBe('2026-09-19');
    }
  });
});
