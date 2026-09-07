import {
  SUGGEST_PROJECT_AMBIGUITY_DELTA,
  SUGGEST_PROJECT_MIN_SCORE,
  VERCEL_UNALLOCATED_EXTERNAL_ID,
  VERCEL_UNALLOCATED_RESOURCE_TYPE,
} from '@/config/constants';
import {
  joinedMappingTokens,
  mappingMatchTokens,
  normalizeMappingTokens,
} from '@/core/mapping/normalize-name';
import { stringSimilarity } from '@/core/mapping/string-similarity';

export type ProjectSuggestCandidate = {
  id: string;
  name: string;
  slug: string;
};

export type ProjectSuggestion = {
  projectId: string;
  projectName: string;
  score: number;
};

export function isUnallocatedResource(resource: {
  displayName: string;
  externalId: string;
  resourceType: string;
}): boolean {
  return (
    resource.resourceType === VERCEL_UNALLOCATED_RESOURCE_TYPE ||
    resource.externalId === VERCEL_UNALLOCATED_EXTERNAL_ID ||
    resource.displayName === VERCEL_UNALLOCATED_EXTERNAL_ID
  );
}

/**
 * Best project match for an inbox row. Never auto-applies — operator must confirm.
 * Returns null when the name is too weak or two projects are too close.
 */
export function suggestProjectForResource(
  resource: { displayName: string; externalId: string; resourceType: string },
  projects: readonly ProjectSuggestCandidate[],
): ProjectSuggestion | null {
  if (isUnallocatedResource(resource)) {
    return null;
  }
  const resourceTokens = normalizeMappingTokens(resource.displayName);
  if (resourceTokens.length === 0) {
    return null;
  }
  const ranked = projects
    .map((project) => ({ project, score: scoreResourceAgainstProject(resourceTokens, project) }))
    .filter((row) => row.score >= SUGGEST_PROJECT_MIN_SCORE)
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  const second = ranked[1];
  if (!best) {
    return null;
  }
  if (second && best.score - second.score < SUGGEST_PROJECT_AMBIGUITY_DELTA) {
    return null;
  }
  return { projectId: best.project.id, projectName: best.project.name, score: best.score };
}

function scoreResourceAgainstProject(
  resourceTokens: readonly string[],
  project: ProjectSuggestCandidate,
): number {
  const nameTokens = normalizeMappingTokens(project.name);
  const slugTokens = normalizeMappingTokens(project.slug.replace(/-/g, ' '));
  return Math.max(tokenScore(resourceTokens, nameTokens), tokenScore(resourceTokens, slugTokens));
}

function tokenScore(resourceTokens: readonly string[], projectTokens: readonly string[]): number {
  if (projectTokens.length === 0) {
    return 0;
  }
  const resourceMatch = mappingMatchTokens(resourceTokens);
  const projectMatch = mappingMatchTokens(projectTokens);
  const resourceSet = new Set(resourceMatch);
  const projectSet = new Set(projectMatch);
  const intersection = [...projectSet].filter((token) => resourceSet.has(token)).length;
  const union = new Set([...resourceMatch, ...projectMatch]).size;
  const jaccard = union === 0 ? 0 : intersection / union;
  const contained =
    projectTokens.every((token) => resourceSet.has(token)) ||
    resourceTokens.every((token) => projectSet.has(token));
  const containment = contained
    ? 0.8 +
      0.2 *
        (Math.min(resourceTokens.length, projectTokens.length) /
          Math.max(resourceTokens.length, projectTokens.length))
    : 0;
  const spell = stringSimilarity(
    joinedMappingTokens(resourceTokens),
    joinedMappingTokens(projectTokens),
  );
  return Math.max(jaccard, containment, spell);
}
