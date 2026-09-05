import { describe, expect, it } from 'vitest';

function parseLimit(value: string): { ok: true; limitUsd: number } | { ok: false; error: string } {
  const trimmed = value.trim();
  const n = Number.parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: 'Enter a positive daily limit.' };
  }
  return { ok: true, limitUsd: n };
}

describe('budget limit parse', () => {
  it('accepts positive decimals', () => {
    expect(parseLimit('12.5')).toEqual({ ok: true, limitUsd: 12.5 });
  });

  it('rejects zero', () => {
    expect(parseLimit('0').ok).toBe(false);
  });
});
