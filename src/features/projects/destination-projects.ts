import { suggestProjectForResource } from '@/core/mapping/suggest-project';
import type { InboxProjectOption } from '@/features/unmapped/types';

/** Other live CostOps projects a mapped resource can move into. */
export function destinationProjectsForMove(
  projects: readonly InboxProjectOption[],
  currentProjectId: string,
): InboxProjectOption[] {
  return projects.filter((project) => project.id !== currentProjectId && !project.archived);
}

export function suggestedMoveProjectId(
  resource: { displayName: string; externalId: string; resourceType: string },
  destinations: readonly InboxProjectOption[],
): string | null {
  return suggestProjectForResource(resource, destinations)?.projectId ?? null;
}
