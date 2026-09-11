import { describe, expect, it } from 'vitest';
import {
  destinationProjectsForMove,
  suggestedMoveProjectId,
} from '@/features/projects/destination-projects';
import type { InboxProjectOption } from '@/features/unmapped/types';

function project(
  id: string,
  name: string,
  slug: string,
  providerKeys: string[] = ['NEON'],
  archived = false,
): InboxProjectOption {
  return { id, name, slug, archived, providerKeys };
}

describe('destinationProjectsForMove', () => {
  it('drops the current project and archived shells', () => {
    const destinations = destinationProjectsForMove(
      [
        project('keep', 'ToonExpo_Feedback', 'toonexpo-feedback'),
        project('vercel', 'toon-expo-feedback', 'toon-expo-feedback', ['VERCEL']),
        project('old', 'ToonExpo leftover', 'toonexpo-2', ['NEON'], true),
      ],
      'keep',
    );
    expect(destinations.map((row) => row.id)).toEqual(['vercel']);
  });
});

describe('suggestedMoveProjectId', () => {
  it('prefills a unique name match after excluding the current project', () => {
    expect(
      suggestedMoveProjectId(
        {
          displayName: 'ToonExpo_Feedback',
          externalId: 'damp-haze-11140325',
          resourceType: 'neon_project',
        },
        [project('vercel', 'toon-expo-feedback', 'toon-expo-feedback', ['VERCEL'])],
      ),
    ).toBe('vercel');
  });
});
