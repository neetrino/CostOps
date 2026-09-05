import { describe, expect, it } from 'vitest';
import {
  filterIgnoredNeonProjects,
  ignoredNeonProjectIds,
  isIgnoredNeonProjectId,
} from '@/providers/neon/ignored-projects';

describe('ignored Neon project IDs', () => {
  it('matches the four manually ignored IDs from neetrino/neon', () => {
    expect(ignoredNeonProjectIds()).toEqual([
      'red-violet-56414917',
      'mute-mode-52233375',
      'frosty-waterfall-89740024',
      'broad-block-37553355',
    ]);
    expect(isIgnoredNeonProjectId('red-violet-56414917')).toBe(true);
    expect(isIgnoredNeonProjectId('active-project-123')).toBe(false);
  });

  it('filters ignored projects out of Neon list payloads', () => {
    const projects = [
      { id: 'red-violet-56414917', name: 'Ignored A' },
      { id: 'active-project-123', name: 'Active' },
      { id: 'broad-block-37553355', name: 'Ignored B' },
    ];
    expect(filterIgnoredNeonProjects(projects)).toEqual([
      { id: 'active-project-123', name: 'Active' },
    ]);
  });
});
