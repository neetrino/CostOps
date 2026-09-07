import { describe, expect, it } from 'vitest';
import { shouldArchiveMissingResources } from '@/core/sync/archive-missing-resources';

describe('shouldArchiveMissingResources', () => {
  it('refuses to archive when discovery returned nothing', () => {
    expect(shouldArchiveMissingResources(0)).toBe(false);
  });

  it('archives leftovers after a non-empty live list', () => {
    expect(shouldArchiveMissingResources(3)).toBe(true);
  });
});
