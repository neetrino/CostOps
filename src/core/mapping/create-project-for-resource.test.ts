import { describe, expect, it } from 'vitest';
import { VERCEL_UNALLOCATED_RESOURCE_TYPE } from '@/config/constants';
import { standaloneProjectBlockReason } from '@/core/mapping/standalone-project';

describe('standaloneProjectBlockReason', () => {
  it('allows a Vercel-only app', () => {
    expect(
      standaloneProjectBlockReason({
        projectId: null,
        displayName: 'ios-screen-cat',
        externalId: 'prj_1',
        resourceType: 'vercel_project',
      }),
    ).toBeNull();
  });

  it('blocks leftover team spend', () => {
    expect(
      standaloneProjectBlockReason({
        projectId: null,
        displayName: 'Team (unallocated)',
        externalId: '_unallocated',
        resourceType: VERCEL_UNALLOCATED_RESOURCE_TYPE,
      }),
    ).toBe('UNALLOCATED');
  });

  it('blocks an already mapped resource', () => {
    expect(
      standaloneProjectBlockReason({
        projectId: 'p1',
        displayName: 'ommm.am',
        externalId: 'prj_2',
        resourceType: 'vercel_project',
      }),
    ).toBe('MAPPED');
  });
});
