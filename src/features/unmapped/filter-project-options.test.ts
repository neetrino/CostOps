import { describe, expect, it } from 'vitest';
import {
  duplicateProjectNames,
  filterAndRankProjectOptions,
} from '@/features/unmapped/filter-project-options';
import type { InboxProjectOption } from '@/features/unmapped/types';

function project(
  id: string,
  name: string,
  slug: string,
  providerKeys: string[] = ['NEON'],
): InboxProjectOption {
  return { id, name, slug, archived: false, providerKeys };
}

const catalog = [
  project('n1', 'Neetrino', 'neetrino', ['NEON']),
  project('n2', 'Neetrino', 'neetrino-2', ['NEON']),
  project('o1', 'ommm', 'ommm', ['NEON']),
  project('d1', 'Degusto', 'degusto', ['NEON', 'VERCEL']),
];

describe('filterAndRankProjectOptions', () => {
  it('puts the suggested project first', () => {
    const ranked = filterAndRankProjectOptions(catalog, '', 'o1');
    expect(ranked[0]?.id).toBe('o1');
  });

  it('filters by name, slug, or provider', () => {
    expect(filterAndRankProjectOptions(catalog, 'ommm', null).map((row) => row.id)).toEqual(['o1']);
    expect(filterAndRankProjectOptions(catalog, 'neetrino-2', null).map((row) => row.id)).toEqual([
      'n2',
    ]);
    expect(filterAndRankProjectOptions(catalog, 'vercel', null).map((row) => row.id)).toEqual([
      'd1',
    ]);
  });
});

describe('duplicateProjectNames', () => {
  it('flags names that appear more than once', () => {
    expect(duplicateProjectNames(catalog).has('neetrino')).toBe(true);
    expect(duplicateProjectNames(catalog).has('ommm')).toBe(false);
  });
});
