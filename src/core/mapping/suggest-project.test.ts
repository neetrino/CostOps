import { describe, expect, it } from 'vitest';
import { VERCEL_UNALLOCATED_RESOURCE_TYPE } from '@/config/constants';
import { suggestProjectForResource } from '@/core/mapping/suggest-project';

const projects = [
  { id: 'ommm', name: 'Ommm', slug: 'ommm' },
  { id: 'degusto', name: 'Degusto', slug: 'degusto' },
  { id: 'nbos', name: 'NBOS', slug: 'nbos' },
  { id: 'toonexpo', name: 'ToonExpo', slug: 'toonexpo' },
  { id: 'mobee', name: 'Mobee', slug: 'mobee' },
  { id: 'whiteshop', name: 'WhiteShop', slug: 'whiteshop' },
  { id: 'whiteshop-min', name: 'whiteshop.am-minimal', slug: 'whiteshop-am-minimal' },
];

describe('suggestProjectForResource', () => {
  it('maps Ommm.am to Ommm', () => {
    const suggestion = suggestProjectForResource(
      { displayName: 'Ommm.am', externalId: 'prj_1', resourceType: 'vercel_project' },
      projects,
    );
    expect(suggestion?.projectId).toBe('ommm');
  });

  it('maps TOONEXPO-ECOSYSTEM to ToonExpo', () => {
    const suggestion = suggestProjectForResource(
      { displayName: 'TOONEXPO-ECOSYSTEM', externalId: 'prj_2', resourceType: 'vercel_project' },
      projects,
    );
    expect(suggestion?.projectId).toBe('toonexpo');
  });

  it('maps a Redis name that contains the project', () => {
    const suggestion = suggestProjectForResource(
      { displayName: 'Ommm Redis', externalId: 'db-1', resourceType: 'upstash_redis' },
      projects,
    );
    expect(suggestion?.projectId).toBe('ommm');
  });

  it('does not suggest Vercel leftover spend', () => {
    expect(
      suggestProjectForResource(
        {
          displayName: '_unallocated',
          externalId: '_unallocated',
          resourceType: VERCEL_UNALLOCATED_RESOURCE_TYPE,
        },
        projects,
      ),
    ).toBeNull();
  });

  it('does not suggest shared QStash regions', () => {
    expect(
      suggestProjectForResource(
        {
          displayName: 'QStash (us-east-1)',
          externalId: '3da46e42-5b12-45b1-8ff5-3160a2f53620',
          resourceType: 'upstash_qstash',
        },
        projects,
      ),
    ).toBeNull();
  });

  it('returns null when two projects are too close', () => {
    expect(
      suggestProjectForResource(
        { displayName: 'Ommm Degusto', externalId: 'prj_3', resourceType: 'vercel_project' },
        projects,
      ),
    ).toBeNull();
  });

  it('prefers WhiteShop over a whiteshop.am-* sibling', () => {
    const suggestion = suggestProjectForResource(
      {
        displayName: 'white-shop-original',
        externalId: 'prj_5',
        resourceType: 'vercel_project',
      },
      projects,
    );
    expect(suggestion?.projectId).toBe('whiteshop');
  });

  it('returns null when nothing is close enough', () => {
    expect(
      suggestProjectForResource(
        { displayName: 'Random Cloud Thing', externalId: 'prj_4', resourceType: 'vercel_project' },
        projects,
      ),
    ).toBeNull();
  });
});
