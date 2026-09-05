const MANUALLY_IGNORED_NEON_PROJECT_IDS = [
  'red-violet-56414917',
  'mute-mode-52233375',
  'frosty-waterfall-89740024',
  'broad-block-37553355',
] as const;

const ignoredNeonProjectIdSet = new Set<string>(MANUALLY_IGNORED_NEON_PROJECT_IDS);

/** Neon project IDs excluded from sync, mapping, and spend alerts (parity with neetrino/neon). */
export function isIgnoredNeonProjectId(projectId: string): boolean {
  return ignoredNeonProjectIdSet.has(projectId);
}

export function filterIgnoredNeonProjects<T extends { id: string }>(projects: T[]): T[] {
  return projects.filter((project) => !isIgnoredNeonProjectId(project.id));
}

export function ignoredNeonProjectIds(): readonly string[] {
  return MANUALLY_IGNORED_NEON_PROJECT_IDS;
}
